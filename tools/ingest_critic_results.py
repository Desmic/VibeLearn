"""Sequentially validate raw post-CI critic results against regenerated assignments."""
import argparse
import json
from pathlib import Path

from tools.build_critic_assignments import build_assignments
from tools.validate_critic_result import validate_result

PASS_ORDER=(
    "cold_observer",
    "motion_audience",
    "physicality",
    "handoff_tutorial",
    "audio_atmosphere",
    "learning_transfer",
    "cinematic_causality",
    "intent_comparison",
)

def load(path:Path):
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value,dict):
        raise ValueError(f"{path} must contain an object")
    return value

def base_workspace(index:dict):
    if index.get("schema")!="vibelearn.review-evidence-index.v1":
        raise ValueError("unsupported review-index schema")
    return {
        "schema":"vibelearn.review-workspace.v1",
        "candidate_sha":index.get("candidate_sha"),
        "technical_result":index.get("technical_result"),
        "base_index":index,
        "supplemental_evidence":[],
        "critic_passes":[],
    }

def ingest(index:dict,raw_results:dict,execution_receipts:dict):
    workspace=base_workspace(index)
    unknown=sorted(set(raw_results)-set(PASS_ORDER))
    if unknown:
        raise ValueError(f"unknown critic result passes: {', '.join(unknown)}")
    unknown_receipts=sorted(set(execution_receipts)-set(PASS_ORDER))
    if unknown_receipts:
        raise ValueError(f"unknown critic execution-receipt passes: {', '.join(unknown_receipts)}")
    orphan_receipts=sorted(set(execution_receipts)-set(raw_results))
    if orphan_receipts:
        raise ValueError(f"execution receipt without critic result: {', '.join(orphan_receipts)}")
    normalized={}
    for review_pass in PASS_ORDER:
        raw=raw_results.get(review_pass)
        if raw is None:
            continue
        assignment=build_assignments(workspace).get(review_pass)
        if not assignment:
            raise ValueError(f"no assignment generated for pass: {review_pass}")
        receipt=execution_receipts.get(review_pass)
        if receipt is None:
            raise ValueError(f"critic result is missing execution receipt: {review_pass}")
        result=validate_result(assignment,raw,receipt)
        normalized[review_pass]=result
        workspace["supplemental_evidence"].append({
            "ref":f"post-ci/{review_pass}.json",
            "modality":result["modality"],
            "candidate_sha":result["candidate_sha"],
            "pass":review_pass,
            "verdict":result["verdict"],
        })
        workspace["critic_passes"].append(review_pass)
    return workspace,normalized

def read_raw_results(root:Path):
    root=root.resolve()
    if not root.is_dir():
        raise ValueError("critic-result root must be a directory")
    results={};receipts={}
    for path in sorted(root.rglob("*.json")):
        value=load(path)
        schema=value.get("schema")
        if schema=="vibelearn.critic-result.v1":
            review_pass=value.get("pass")
            if not isinstance(review_pass,str) or not review_pass:
                raise ValueError(f"critic result has no pass: {path}")
            if review_pass in results:
                raise ValueError(f"duplicate raw critic result for pass: {review_pass}")
            results[review_pass]=value
        elif schema=="vibelearn.critic-execution-receipt.v1":
            review_pass=value.get("pass")
            if not isinstance(review_pass,str) or not review_pass:
                raise ValueError(f"critic execution receipt has no pass: {path}")
            if review_pass in receipts:
                raise ValueError(f"duplicate critic execution receipt for pass: {review_pass}")
            receipts[review_pass]=value
    return results,receipts

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index",type=Path,required=True)
    parser.add_argument("--results-root",type=Path,required=True)
    parser.add_argument("--output-root",type=Path,required=True)
    args=parser.parse_args()
    try:
        index=load(args.index)
        raw_results,execution_receipts=read_raw_results(args.results_root)
        workspace,normalized=ingest(index,raw_results,execution_receipts)
    except ValueError as exc:
        print(json.dumps({"status":"invalid_post_ci_review","error":str(exc)}))
        return 2

    post_ci=args.output_root/"post-ci"
    post_ci.mkdir(parents=True,exist_ok=True)
    for review_pass,value in normalized.items():
        (post_ci/f"{review_pass}.json").write_text(json.dumps(value,indent=2)+"\n",encoding="utf-8")
    args.output_root.mkdir(parents=True,exist_ok=True)
    (args.output_root/"review-workspace.json").write_text(json.dumps(workspace,indent=2)+"\n",encoding="utf-8")
    assignments=build_assignments(workspace)
    assignments_dir=args.output_root/"critic-assignments"
    assignments_dir.mkdir(parents=True,exist_ok=True)
    for name,value in assignments.items():
        (assignments_dir/f"{name}.json").write_text(json.dumps(value,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({
        "status":"ok",
        "candidate_sha":workspace["candidate_sha"],
        "validated_passes":workspace["critic_passes"],
        "ready_passes":[name for name,a in assignments.items() if a["status"]=="ready"],
        "blocked_passes":[name for name,a in assignments.items() if a["status"]!="ready"],
    }))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
