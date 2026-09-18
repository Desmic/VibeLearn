"""Create/validate a harness-side critic execution receipt.

The reviewer does not author this receipt. The orchestrator/harness that launches
the critic records exactly which assignment/evidence/context it supplied.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

HEX40=re.compile(r"^[0-9a-f]{40}$")

def digest_receipt(value:dict):
    payload={k:v for k,v in value.items() if k!="receipt_id"}
    return "sha256:"+hashlib.sha256(
        json.dumps(payload,sort_keys=True,separators=(",",":")).encode("utf-8")
    ).hexdigest()

def build_receipt(assignment:dict,executor_id:str,session_id:str,supplied_evidence:list,
                  supplied_context:list|None=None,forbidden_context_supplied:list|None=None):
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
    forbidden=list(forbidden_context_supplied or [])
    if forbidden:
        raise ValueError("execution receipt contains forbidden context")
    value={
        "schema":"vibelearn.critic-execution-receipt.v1",
        "candidate_sha":candidate,
        "pass":assignment.get("pass"),
        "assignment_id":assignment_id,
        "executor_id":executor_id.strip(),
        "session_id":session_id.strip(),
        "context_mode":"assignment_only",
        "supplied_evidence":sorted(normalized,key=lambda x:(x.get("modality",""),x.get("ref",""))),
        "supplied_context":list(supplied_context or ["assignment"]),
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
                        help="Harness-authored JSON containing executor_id, session_id, supplied_evidence and supplied_context")
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    try:
        assignment=load(args.assignment);manifest=load(args.context_manifest)
        receipt=build_receipt(
            assignment,
            manifest.get("executor_id",""),
            manifest.get("session_id",""),
            manifest.get("supplied_evidence") or [],
            manifest.get("supplied_context") or ["assignment"],
            manifest.get("forbidden_context_supplied") or [],
        )
    except ValueError as exc:
        print(json.dumps({"status":"invalid_critic_execution","error":str(exc)}))
        return 2
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(receipt,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({
        "status":"ok","candidate_sha":receipt["candidate_sha"],"pass":receipt["pass"],
        "assignment_id":receipt["assignment_id"],"receipt_id":receipt["receipt_id"]
    }))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
