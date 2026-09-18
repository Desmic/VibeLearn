"""Build an exact-candidate evidence receipt for one CI/browser artifact directory."""
import argparse
import json
import re
from pathlib import Path

HEX40 = re.compile(r"^[0-9a-f]{40}$")

def modality_for(path: Path):
    name = path.name.lower()
    suffix = path.suffix.lower()
    if name.startswith("cold-observer-") and suffix == ".json":
        return "cold_observer_report"
    if name.endswith("trace.zip"):
        return "interactive_trace"
    if suffix in {".webm", ".mp4", ".mov"}:
        return "motion_video"
    if suffix in {".png", ".jpg", ".jpeg", ".webp"}:
        return "screenshot"
    if name.endswith("-report.json") or name.endswith("-report.txt"):
        return "runtime_trace"
    if "replay" in name and suffix in {".json", ".md"}:
        return "authoritative_replay"
    return None

def build_receipt(root: Path, candidate: str, suite: str):
    if not HEX40.fullmatch(candidate):
        raise ValueError("candidate must be an exact 40-character lowercase SHA")
    if not suite or not suite.strip():
        raise ValueError("suite is required")
    root = root.resolve()
    if not root.is_dir():
        raise ValueError("evidence root must be a directory")
    evidence = []
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        modality = modality_for(path)
        if not modality:
            continue
        evidence.append({
            "ref": path.relative_to(root).as_posix(),
            "modality": modality,
            "candidate_sha": candidate,
            "bytes": path.stat().st_size,
        })
    return {
        "schema": "vibelearn.evidence-receipt.v1",
        "candidate_sha": candidate,
        "suite": suite,
        "root": ".",
        "evidence": evidence,
        "modalities": sorted({item["modality"] for item in evidence}),
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--suite", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        receipt = build_receipt(args.root, args.candidate, args.suite)
    except ValueError as exc:
        print(json.dumps({"status": "invalid_evidence_receipt", "error": str(exc)}))
        return 2
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "ok", "count": len(receipt["evidence"]), "modalities": receipt["modalities"]}))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
