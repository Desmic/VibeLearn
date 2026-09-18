"""Materialize one critic assignment into a sealed filesystem evidence capsule.

The capsule contains the assignment plus only evidence explicitly allowed by that
assignment. It is designed to be the reviewer's entire mounted working set.
"""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

def load(path:Path):
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value,dict):
        raise ValueError(f"{path} must contain an object")
    return value

def digest_receipt(value:dict):
    return "sha256:"+hashlib.sha256(
        json.dumps(value,sort_keys=True,separators=(",",":")).encode("utf-8")
    ).hexdigest()

def sha256(path:Path):
    digest=hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda:handle.read(1024*1024),b""):
            digest.update(chunk)
    return digest.hexdigest()

def safe_source(root:Path,ref:str):
    path=(root/ref).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f"evidence escapes root: {ref}")
    if not path.is_file():
        raise ValueError(f"evidence is missing: {ref}")
    if path.is_symlink():
        raise ValueError(f"symlink evidence is not allowed: {ref}")
    return path

def materialize(assignment:dict,evidence_root:Path,output:Path):
    if assignment.get("schema")!="vibelearn.critic-assignment.v1":
        raise ValueError("unsupported critic assignment schema")
    if assignment.get("status")!="ready":
        raise ValueError("cannot materialize a blocked critic assignment")
    candidate=assignment.get("candidate_sha")
    assignment_id=assignment.get("assignment_id")
    review_pass=assignment.get("pass")
    if not candidate or not assignment_id or not review_pass:
        raise ValueError("assignment identity is incomplete")

    evidence_root=evidence_root.resolve()
    output=output.resolve()
    if output.exists():
        shutil.rmtree(output)
    (output/"evidence").mkdir(parents=True)

    copied=[]
    seen=set()
    for index,item in enumerate(assignment.get("allowed_evidence") or []):
        if not isinstance(item,dict):
            raise ValueError("allowed evidence entry must be an object")
        ref=item.get("ref")
        modality=item.get("modality")
        item_candidate=item.get("candidate_sha")
        if not isinstance(ref,str) or not ref:
            raise ValueError("allowed evidence ref is invalid")
        if item_candidate!=candidate:
            raise ValueError(f"evidence belongs to another candidate: {ref}")
        key=(ref,modality,item_candidate)
        if key in seen:
            continue
        seen.add(key)
        source=safe_source(evidence_root,ref)
        suffix="".join(source.suffixes)[-32:]
        dest_name=f"{index:03d}-{hashlib.sha256(ref.encode()).hexdigest()[:12]}{suffix}"
        destination=output/"evidence"/dest_name
        shutil.copyfile(source,destination)
        copied.append({
            "ref":ref,
            "modality":modality,
            "candidate_sha":candidate,
            "capsule_ref":f"evidence/{dest_name}",
            "sha256":sha256(destination),
            "bytes":destination.stat().st_size,
        })

    assignment_copy=output/"assignment.json"
    assignment_copy.write_text(json.dumps(assignment,indent=2)+"\n",encoding="utf-8")

    manifest={
        "schema":"vibelearn.critic-capsule.v1",
        "candidate_sha":candidate,
        "pass":review_pass,
        "assignment_id":assignment_id,
        "context_mode":"assignment_only",
        "supplied_context":["assignment"],
        "forbidden_context":assignment.get("forbidden_context") or [],
        "evidence":copied,
    }
    manifest["capsule_id"]=digest_receipt(manifest)
    (output/"capsule.json").write_text(json.dumps(manifest,indent=2)+"\n",encoding="utf-8")

    readme=[
        f"# Critic capsule: {review_pass}",
        "",
        f"Candidate: {candidate}",
        f"Assignment: {assignment_id}",
        f"Capsule: {manifest['capsule_id']}",
        "",
        "This directory is the complete reviewer context supplied by the harness.",
        "Do not access the repository, creator rationale or external project context.",
        "",
        "Questions:",
    ]
    readme.extend(f"- {q}" for q in assignment.get("questions") or [])
    readme.extend([
        "",
        "Output:",
        f"- modality: {assignment.get('expected_output_modality')}",
        "- observations before interpretation",
        "- uncertainties",
        "- counterexample attempt",
        "- verdict: pass | needs_revision | unresolved",
        "- blockers + retest when needs_revision",
    ])
    (output/"README.md").write_text("\n".join(readme)+"\n",encoding="utf-8")
    return manifest

def validate_capsule(output:Path):
    output=output.resolve()
    assignment=load(output/"assignment.json")
    manifest=load(output/"capsule.json")
    if manifest.get("schema")!="vibelearn.critic-capsule.v1":
        raise ValueError("unsupported critic capsule schema")
    for key in ("candidate_sha","pass","assignment_id"):
        if manifest.get(key)!=assignment.get(key):
            raise ValueError(f"capsule {key} does not match assignment")
    if manifest.get("context_mode")!="assignment_only":
        raise ValueError("capsule context mode must be assignment_only")
    if manifest.get("supplied_context")!=["assignment"]:
        raise ValueError("capsule supplied context must be assignment only")

    expected_id=digest_receipt({k:v for k,v in manifest.items() if k!="capsule_id"})
    if manifest.get("capsule_id")!=expected_id:
        raise ValueError("capsule manifest digest mismatch")

    allowed={
        (item.get("ref"),item.get("modality"),item.get("candidate_sha"))
        for item in assignment.get("allowed_evidence") or []
        if isinstance(item,dict)
    }
    observed=set()
    expected_files=set()
    for item in manifest.get("evidence") or []:
        key=(item.get("ref"),item.get("modality"),item.get("candidate_sha"))
        if key not in allowed:
            raise ValueError(f"capsule contains evidence outside assignment: {item.get('ref')}")
        observed.add(key)
        capsule_ref=item.get("capsule_ref")
        if not isinstance(capsule_ref,str) or not capsule_ref.startswith("evidence/"):
            raise ValueError("capsule evidence ref is invalid")
        path=(output/capsule_ref).resolve()
        if not path.is_relative_to((output/"evidence").resolve()) or not path.is_file():
            raise ValueError(f"capsule evidence file missing: {capsule_ref}")
        expected_files.add(path)
        if path.stat().st_size!=item.get("bytes"):
            raise ValueError(f"capsule evidence size mismatch: {capsule_ref}")
        if sha256(path)!=item.get("sha256"):
            raise ValueError(f"capsule evidence digest mismatch: {capsule_ref}")
    if observed!=allowed:
        missing=allowed-observed
        raise ValueError(f"capsule did not materialize all allowed evidence: {sorted(missing)}")
    actual_files={p.resolve() for p in (output/"evidence").rglob("*") if p.is_file()}
    if actual_files!=expected_files:
        raise ValueError("capsule evidence directory contains untracked files")
    return manifest

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assignment",type=Path,required=True)
    parser.add_argument("--evidence-root",type=Path,required=True)
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    try:
        materialize(load(args.assignment),args.evidence_root,args.output)
        manifest=validate_capsule(args.output)
    except ValueError as exc:
        print(json.dumps({"status":"invalid_critic_capsule","error":str(exc)}))
        return 2
    print(json.dumps({
        "status":"ok",
        "candidate_sha":manifest["candidate_sha"],
        "pass":manifest["pass"],
        "assignment_id":manifest["assignment_id"],
        "capsule_id":manifest["capsule_id"],
        "evidence_count":len(manifest["evidence"]),
    }))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
