"""Gate previews and phase advancement using exact-SHA review evidence and human authority."""
import argparse
import json
import re
from pathlib import Path

from tools.check_critic_review import evaluate

HEX40=re.compile(r"^[0-9a-f]{40}$")

def load_json(path:Path):
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value,dict):
        raise ValueError(f"{path} must contain an object")
    return value

def gate(candidate:str,mode:str,status_record:dict,review_record:dict|None,evidence_root:Path,
         explicit_preview_override:bool=False):
    def require(ok,message):
        if not ok: raise ValueError(message)

    require(HEX40.fullmatch(candidate) is not None,"candidate must be an exact 40-character lowercase SHA")
    require(status_record.get("schema")=="vibelearn.quality-status.v1","unsupported quality-status schema")
    require(mode in {"preview","phase-advance"},"mode must be preview or phase-advance")

    rejected=set(status_record.get("rejected_candidates") or [])
    accepted=set(status_record.get("accepted_candidates") or [])
    policy=status_record.get("policy") or {}

    if candidate in rejected:
        raise ValueError("candidate is explicitly rejected by human review")

    if mode=="phase-advance":
        require(status_record.get("level2_allowed") is True,
                "phase advancement is disabled in quality status")
        require(candidate in accepted,
                "phase advancement requires explicit human acceptance for this candidate")
        return {
            "status":"allowed",
            "mode":mode,
            "candidate_sha":candidate,
            "authority":"human_acceptance",
        }

    # Preview mode.
    require(review_record is not None,"preview requires an internal review record")
    result=evaluate(review_record,candidate,evidence_root)
    required_schema=policy.get("preview_requires_review_schema",2)
    require(result.get("schema_version")==required_schema,
            f"preview requires critic schema v{required_schema}")

    if result["status"]=="ready_for_user_review":
        return {
            "status":"allowed",
            "mode":"preview",
            "candidate_sha":candidate,
            "review_status":result["status"],
            "authority":"internal_v2_ready",
        }

    if explicit_preview_override:
        require(policy.get("manual_preview_override_requires_explicit_user_request") is True,
                "manual preview override is not enabled by policy")
        require(result["status"]=="review_incomplete",
                "manual preview override only applies to review_incomplete candidates")
        require(review_record.get("technical_status")=="passed",
                "manual preview override requires technical pass")
        require(not review_record.get("blockers"),
                "manual preview override cannot bypass explicit blockers")
        return {
            "status":"allowed",
            "mode":"preview",
            "candidate_sha":candidate,
            "review_status":result["status"],
            "authority":"explicit_user_preview_override",
        }

    raise ValueError(f"preview blocked: internal review status is {result['status']}")

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate",required=True)
    parser.add_argument("--mode",choices=("preview","phase-advance"),required=True)
    parser.add_argument("--quality-status",type=Path,default=Path("docs/quality-status.json"))
    parser.add_argument("--review-record",type=Path)
    parser.add_argument("--evidence-root",type=Path,default=Path("."))
    parser.add_argument("--explicit-user-preview-override",action="store_true")
    args=parser.parse_args()
    try:
        status_record=load_json(args.quality_status)
        review_record=load_json(args.review_record) if args.review_record else None
        result=gate(
            args.candidate,args.mode,status_record,review_record,args.evidence_root,
            explicit_preview_override=args.explicit_user_preview_override
        )
    except ValueError as exc:
        print(json.dumps({"status":"blocked","error":str(exc)}))
        return 1
    print(json.dumps(result,indent=2))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
