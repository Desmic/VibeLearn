"""Create/validate a harness-side critic execution receipt.

The reviewer does not author this receipt. The orchestrator/harness that launches
the critic records exactly which assignment/evidence/context it supplied.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

from tools.materialize_critic_capsule import validate_capsule

HEX40=re.compile(r"^[0-9a-f]{40}$")

def digest_receipt(value:dict):
    payload={k:v for k,v in value.items() if k!="receipt_id"}
    return "sha256:"+hashlib.sha256(
        json.dumps(payload,sort_keys=True,separators=(",",":")).encode("utf-8")
    ).hexdigest()

def build_receipt(assignment:dict,executor_id:str,session_id:str,supplied_evidence:list,
                  supplied_context:list|None=None,forbidden_context_supplied:list|None=None,
                  capsule_id:str|None=None):
    if assignment.get("schema")!="vibelearn.critic-assignment.v1":
        raise ValueError("unsupported critic assignment schema")
    candidate=assignment.get("candidate_sha")
    if not isinstance(candidate,str) or not HEX40.fullmatch(candidate):
        raise ValueError("assignment candidate SHA is invalid")
    assignment_id=assignment.get("assignment_id")
    if not isinstance(assignment_id,str) or not re.fullmatch(r"sha256:[0-9a-f]{64}",assignment_id):
        raise ValueError("assignment_id is invalid")
    if not isinstance(executor_id,str) or not executor_id.strip():
        raise ValueError("executor_id is required")
    if not isinstance(session_id,str) or not session_id.strip():
        raise ValueError("session_id is required")
    if capsule_id is not None and not re.fullmatch(r"sha256:[0-9a-f]{64}",capsule_id):
        raise ValueError("capsule_id is invalid")
    allowed={
        (item.get("ref"),item.get("modality"),item.get("candidate_sha"))
        for item in assignment.get("allowed_evidence") or []
        if isinstance(item,dict)
    }
    normalized=[]
    seen=set()
    for item in supplied_evidence:
        if not isinstance(item,dict):
            raise ValueError("supplied_evidence entries must be objects")
        key=(item.get("ref"),item.get("modality"),item.get("candidate_sha"))
        if key not in allowed:
            raise ValueError(f"execution supplied evidence outside assignment: {item.get('ref')}")
        if key in seen:
            continue
        seen.add(key);normalized.append(dict(item))
    context_labels=list(supplied_context or ["assignment"])
    if not context_labels or not all(isinstance(label,str) and label.strip() for label in context_labels):
        raise ValueError("supplied_context must be a non-empty list of strings")
    normalized_context=[label.strip().lower() for label in context_labels]
    if "assignment" not in normalized_context:
        raise ValueError("execution context must include the assignment capsule")
    forbidden=list(forbidden_context_supplied or [])
    if forbidden:
        raise ValueError("execution receipt contains forbidden context")
    forbidden_rules=[
        str(label).strip().lower()
        for label in assignment.get("forbidden_context") or []
        if str(label).strip()
    ]
    for supplied in normalized_context:
        if any(rule in supplied or supplied in rule for rule in forbidden_rules):
            raise ValueError(f"execution supplied forbidden context label: {supplied}")
    value={
        "schema":"vibelearn.critic-execution-receipt.v1",
        "candidate_sha":candidate,
        "pass":assignment.get("pass"),
        "assignment_id":assignment_id,
        "capsule_id":capsule_id,
        "executor_id":executor_id.strip(),
        "session_id":session_id.strip(),
        "context_mode":"assignment_only",
        "supplied_evidence":sorted(normalized,key=lambda x:(x.get("modality",""),x.get("ref",""))),
        "supplied_context":context_labels,
        "forbidden_context_supplied":[],
    }
    value["receipt_id"]=digest_receipt(value)
    return value

def validate_receipt(assignment:dict,receipt:dict):
    expected=build_receipt(
        assignment,
        receipt.get("executor_id",""),
        receipt.get("session_id",""),
        receipt.get("supplied_evidence") or [],
        receipt.get("supplied_context") or [],
        receipt.get("forbidden_context_supplied") or [],
        receipt.get("capsule_id"),
    )
    if receipt.get("schema")!="vibelearn.critic-execution-receipt.v1":
        raise ValueError("unsupported critic execution receipt schema")
    if receipt.get("candidate_sha")!=expected["candidate_sha"] or receipt.get("pass")!=expected["pass"]:
        raise ValueError("execution receipt belongs to another candidate/pass")
    if receipt.get("assignment_id")!=expected["assignment_id"]:
        raise ValueError("execution receipt belongs to another assignment")
    if receipt.get("context_mode")!="assignment_only":
        raise ValueError("execution receipt must use assignment_only context mode")
    if receipt.get("receipt_id")!=expected["receipt_id"]:
        raise ValueError("execution receipt digest mismatch")
    return expected

def load(path:Path):
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value,dict):
        raise ValueError(f"{path} must contain an object")
    return value

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assignment",type=Path,required=True)
    parser.add_argument("--context-manifest",type=Path,required=True,
                        help="Harness-authored JSON containing executor_id, session_id and supplied_context")
    parser.add_argument("--capsule-dir",type=Path,required=True,
                        help="Validated sealed capsule mounted into the reviewer session")
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    try:
        assignment=load(args.assignment);manifest=load(args.context_manifest)
        capsule=validate_capsule(args.capsule_dir)
        for key in ("candidate_sha","pass","assignment_id"):
            if capsule.get(key)!=assignment.get(key):
                raise ValueError(f"capsule {key} does not match execution assignment")
        supplied_evidence=[
            {
                "ref":item["ref"],
                "modality":item["modality"],
                "candidate_sha":item["candidate_sha"],
            }
            for item in capsule.get("evidence") or []
        ]
        receipt=build_receipt(
            assignment,
            manifest.get("executor_id",""),
            manifest.get("session_id",""),
            supplied_evidence,
            manifest.get("supplied_context") or ["assignment"],
            manifest.get("forbidden_context_supplied") or [],
            capsule.get("capsule_id"),
        )
    except ValueError as exc:
        print(json.dumps({"status":"invalid_critic_execution","error":str(exc)}))
        return 2
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(receipt,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({
        "status":"ok","candidate_sha":receipt["candidate_sha"],"pass":receipt["pass"],
        "assignment_id":receipt["assignment_id"],"capsule_id":receipt["capsule_id"],"receipt_id":receipt["receipt_id"]
    }))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
