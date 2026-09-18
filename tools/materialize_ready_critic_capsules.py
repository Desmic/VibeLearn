"""Materialize every ready critic assignment into a sealed evidence capsule."""
import argparse
import json
from pathlib import Path

from tools.materialize_critic_capsule import materialize,validate_capsule

def load(path:Path):
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value,dict):
        raise ValueError(f"{path} must contain an object")
    return value

def materialize_ready(assignments_dir:Path,evidence_root:Path,output_root:Path):
    assignments_dir=assignments_dir.resolve()
    evidence_root=evidence_root.resolve()
    output_root=output_root.resolve()
    if not assignments_dir.is_dir():
        raise ValueError("assignments directory is missing")
    if not evidence_root.is_dir():
        raise ValueError("evidence root is missing")
    output_root.mkdir(parents=True,exist_ok=True)

    ready=[];blocked=[]
    for path in sorted(assignments_dir.glob("*.json")):
        assignment=load(path)
        if assignment.get("schema")!="vibelearn.critic-assignment.v1":
            raise ValueError(f"unsupported assignment schema: {path}")
        review_pass=assignment.get("pass")
        if not isinstance(review_pass,str) or not review_pass:
            raise ValueError(f"assignment has no pass: {path}")
        if assignment.get("status")!="ready":
            blocked.append({
                "pass":review_pass,
                "status":assignment.get("status"),
                "missing_evidence":assignment.get("missing_evidence") or [],
            })
            continue
        capsule_dir=output_root/review_pass
        manifest=materialize(assignment,evidence_root,capsule_dir)
        validated=validate_capsule(capsule_dir)
        if validated["capsule_id"]!=manifest["capsule_id"]:
            raise ValueError(f"{review_pass}: capsule validation changed capsule id")
        ready.append({
            "pass":review_pass,
            "assignment_id":assignment["assignment_id"],
            "capsule_id":validated["capsule_id"],
            "evidence_count":len(validated.get("evidence") or []),
            "path":review_pass,
        })

    summary={
        "schema":"vibelearn.critic-capsule-index.v1",
        "ready":ready,
        "blocked":blocked,
    }
    (output_root/"capsule-index.json").write_text(json.dumps(summary,indent=2)+"\n",encoding="utf-8")
    return summary

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assignments-dir",type=Path,required=True)
    parser.add_argument("--evidence-root",type=Path,required=True)
    parser.add_argument("--output-root",type=Path,required=True)
    args=parser.parse_args()
    try:
        summary=materialize_ready(args.assignments_dir,args.evidence_root,args.output_root)
    except ValueError as exc:
        print(json.dumps({"status":"invalid_critic_capsules","error":str(exc)}))
        return 2
    print(json.dumps({
        "status":"ok",
        "ready":[item["pass"] for item in summary["ready"]],
        "blocked":[item["pass"] for item in summary["blocked"]],
    }))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
