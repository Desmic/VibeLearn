"""Gate previews and phase advancement using exact-SHA review evidence and human authority."""
import argparse
import json
import re
from pathlib import Path

from tools.check_critic_review import evaluate
from tools.ingest_critic_results import PASS_ORDER
from tools.check_learning_design import check_design_gate

HEX40=re.compile(r"^[0-9a-f]{40}$")

def load_json(path:Path):
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value,dict):
        raise ValueError(f"{path} must contain an object")
    return value

def read_validated_critic_results(root:Path|None,candidate:str):
    if root is None:
        return {}
    root=root.resolve()
    if not root.is_dir():
        raise ValueError("validated critic-result root must be a directory")
    results={}
    for path in sorted(root.rglob("*.json")):
        value=load_json(path)
        if value.get("schema")!="vibelearn.validated-critic-result.v1":
            continue
        if value.get("candidate_sha")!=candidate:
            raise ValueError(f"validated critic result belongs to another candidate: {path}")
        review_pass=value.get("pass")
        if review_pass not in PASS_ORDER:
            raise ValueError(f"validated critic result has unknown pass: {review_pass}")
        if review_pass in results:
            raise ValueError(f"duplicate validated critic result for pass: {review_pass}")
        results[review_pass]=value
    return results

def gate(candidate:str,mode:str,status_record:dict,review_record:dict|None,evidence_root:Path,
         explicit_preview_override:bool=False,validated_critic_results:dict|None=None,
         learning_design:dict|None=None,learning_design_review:dict|None=None):
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

    if policy.get('learning_design_required') is True:
        require(learning_design is not None, 'learning design required by release policy')
        check_design_gate(learning_design, learning_design_review, stage='release',
                          candidate=candidate, evidence_root=evidence_root)

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
    critic_results=validated_critic_results or {}
    critic_verdicts={name:value.get("verdict") for name,value in critic_results.items()}
    failed_critics=sorted(name for name,verdict in critic_verdicts.items() if verdict=="needs_revision")
    require(not failed_critics,
            "preview cannot bypass needs_revision critic verdicts: "+", ".join(failed_critics))
    required_schema=policy.get("preview_requires_review_schema",2)
    require(result.get("schema_version")==required_schema,
            f"preview requires critic schema v{required_schema}")

    if result["status"]=="ready_for_user_review":
        missing_critics=sorted(set(PASS_ORDER)-set(critic_results))
        require(not missing_critics,
                "ready preview requires all validated critic passes: "+", ".join(missing_critics))
        nonpassing=sorted(name for name in PASS_ORDER if critic_verdicts.get(name)!="pass")
        require(not nonpassing,
                "ready preview requires pass verdict from every critic: "+", ".join(nonpassing))
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
        unresolved=sorted(name for name,verdict in critic_verdicts.items() if verdict=="unresolved")
        missing=sorted(set(PASS_ORDER)-set(critic_results))
        return {
            "status":"allowed",
            "mode":"preview",
            "candidate_sha":candidate,
            "review_status":result["status"],
            "authority":"explicit_user_preview_override",
            "unresolved_critics":unresolved,
            "missing_critics":missing,
        }

    raise ValueError(f"preview blocked: internal review status is {result['status']}")

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate",required=True)
    parser.add_argument("--mode",choices=("preview","phase-advance"),required=True)
    parser.add_argument("--quality-status",type=Path,default=Path("docs/quality-status.json"))
    parser.add_argument("--review-record",type=Path)
    parser.add_argument("--evidence-root",type=Path,default=Path("."))
    parser.add_argument("--critic-results-root",type=Path)
    parser.add_argument("--explicit-user-preview-override",action="store_true")
    parser.add_argument("--learning-design",type=Path)
    parser.add_argument("--learning-design-review",type=Path)
    args=parser.parse_args()
    try:
        status_record=load_json(args.quality_status)
        review_record=load_json(args.review_record) if args.review_record else None
        critic_results=read_validated_critic_results(args.critic_results_root,args.candidate)
        result=gate(
            args.candidate,args.mode,status_record,review_record,args.evidence_root,
            explicit_preview_override=args.explicit_user_preview_override,
            validated_critic_results=critic_results,
            learning_design=load_json(args.learning_design) if args.learning_design else None,
            learning_design_review=load_json(args.learning_design_review) if args.learning_design_review else None
        )
    except ValueError as exc:
        print(json.dumps({"status":"blocked","error":str(exc)}))
        return 1
    print(json.dumps(result,indent=2))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
