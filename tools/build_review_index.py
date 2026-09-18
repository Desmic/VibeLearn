"""Aggregate per-suite evidence receipts into one exact-candidate review index."""
import argparse
import json
import re
from pathlib import Path

HEX40=re.compile(r"^[0-9a-f]{40}$")
EXPECTED_SUITES=(
    "foundation","first-words-opening","first-words-tutorial","first-words-controls",
    "first-words-chapter","first-words-readability","first-words-lifecycle",
)
VALID_TECHNICAL={"success","failure","cancelled","skipped"}

def build_index(root: Path,candidate: str,technical_result: str):
    if not HEX40.fullmatch(candidate):
        raise ValueError("candidate must be an exact 40-character lowercase SHA")
    if technical_result not in VALID_TECHNICAL:
        raise ValueError("technical result is invalid")
    root=root.resolve()
    if not root.is_dir():
        raise ValueError("evidence root must be a directory")

    receipts=[]
    seen=set()
    for path in sorted(root.rglob("evidence-receipt-*.json")):
        try:
            receipt=json.loads(path.read_text(encoding="utf-8"))
        except (OSError,json.JSONDecodeError) as exc:
            raise ValueError(f"invalid receipt {path}: {exc}") from exc
        if receipt.get("schema")!="vibelearn.evidence-receipt.v1":
            raise ValueError(f"unsupported receipt schema: {path}")
        if receipt.get("candidate_sha")!=candidate:
            raise ValueError(f"receipt belongs to another candidate: {path}")
        suite=receipt.get("suite")
        if suite not in EXPECTED_SUITES:
            raise ValueError(f"unexpected suite receipt: {suite}")
        if suite in seen:
            raise ValueError(f"duplicate suite receipt: {suite}")
        seen.add(suite)
        evidence=receipt.get("evidence")
        if not isinstance(evidence,list):
            raise ValueError(f"{suite}: evidence must be a list")
        receipts.append({
            "suite":suite,
            "receipt_ref":path.relative_to(root).as_posix(),
            "modalities":sorted(set(receipt.get("modalities") or [])),
            "evidence_count":len(evidence),
            "evidence":evidence,
        })

    missing=sorted(set(EXPECTED_SUITES)-seen)
    if technical_result=="success" and missing:
        raise ValueError(f"successful technical run is missing suite receipts: {', '.join(missing)}")

    modalities=sorted({m for receipt in receipts for m in receipt["modalities"]})
    return {
        "schema":"vibelearn.review-evidence-index.v1",
        "candidate_sha":candidate,
        "technical_result":technical_result,
        "expected_suites":list(EXPECTED_SUITES),
        "observed_suites":sorted(seen),
        "missing_suites":missing,
        "modalities":modalities,
        "receipts":sorted(receipts,key=lambda item:item["suite"]),
    }

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root",type=Path,required=True)
    parser.add_argument("--candidate",required=True)
    parser.add_argument("--technical-result",required=True)
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    try:
        result=build_index(args.root,args.candidate,args.technical_result)
    except ValueError as exc:
        print(json.dumps({"status":"invalid_review_index","error":str(exc)}))
        return 2
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":"ok","candidate_sha":args.candidate,"suite_count":len(result["observed_suites"]),"modalities":result["modalities"]}))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
