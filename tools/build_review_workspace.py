"""Merge immutable CI evidence index with validated post-CI critic results."""
import argparse
import json
import re
from pathlib import Path

HEX40=re.compile(r"^[0-9a-f]{40}$")

def load(path:Path):
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value,dict):
        raise ValueError(f"{path} must contain an object")
    return value

def build_workspace(index:dict,supplemental_root:Path|None=None):
    def require(ok,message):
        if not ok: raise ValueError(message)

    require(index.get("schema")=="vibelearn.review-evidence-index.v1","unsupported review-index schema")
    candidate=index.get("candidate_sha")
    require(isinstance(candidate,str) and HEX40.fullmatch(candidate),"review index candidate SHA is invalid")

    supplemental=[]
    seen_passes=set()
    if supplemental_root is not None:
        supplemental_root=supplemental_root.resolve()
        require(supplemental_root.is_dir(),"supplemental root must be a directory")
        for path in sorted(supplemental_root.rglob("*.json")):
            value=load(path)
            if value.get("schema")!="vibelearn.validated-critic-result.v1":
                continue
            require(value.get("candidate_sha")==candidate,
                    f"supplemental critic result belongs to another candidate: {path}")
            review_pass=value.get("pass")
            require(isinstance(review_pass,str) and review_pass,
                    f"supplemental critic result has no pass: {path}")
            require(review_pass not in seen_passes,
                    f"duplicate supplemental critic result for pass: {review_pass}")
            seen_passes.add(review_pass)
            modality=value.get("modality")
            require(isinstance(modality,str) and modality,
                    f"supplemental critic result has no modality: {path}")
            supplemental.append({
                "ref":(Path("post-ci")/path.relative_to(supplemental_root)).as_posix(),
                "modality":modality,
                "candidate_sha":candidate,
                "pass":review_pass,
                "verdict":value.get("verdict"),
            })

    return {
        "schema":"vibelearn.review-workspace.v1",
        "candidate_sha":candidate,
        "technical_result":index.get("technical_result"),
        "base_index":index,
        "supplemental_evidence":supplemental,
        "critic_passes":sorted(seen_passes),
    }

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index",type=Path,required=True)
    parser.add_argument("--supplemental-root",type=Path)
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    try:
        workspace=build_workspace(load(args.index),args.supplemental_root)
    except ValueError as exc:
        print(json.dumps({"status":"invalid_review_workspace","error":str(exc)}))
        return 2
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(workspace,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({
        "status":"ok",
        "candidate_sha":workspace["candidate_sha"],
        "critic_passes":workspace["critic_passes"],
        "supplemental_count":len(workspace["supplemental_evidence"]),
    }))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
