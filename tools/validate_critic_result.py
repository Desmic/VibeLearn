"""Validate and normalize one critic result against its exact assignment."""
import argparse
import json
import re
from pathlib import Path

from tools.critic_execution_receipt import validate_receipt
from tools.native_play_execution import validate_native_execution
from tools.art_world_rubric import ART_WORLD_CRITERIA

HEX40=re.compile(r"^[0-9a-f]{40}$")
PASS_RESULT_MODALITY={
    "cold_observer":"cold_observer_report",
    "audio_atmosphere":"audio_listening",
}
ALLOWED_VERDICTS={"pass","needs_revision","unresolved"}

def load(path:Path):
    try:
        value=json.loads(path.read_text(encoding="utf-8"))
    except (OSError,json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {path}: {exc}") from exc
    if not isinstance(value,dict):
        raise ValueError(f"{path} must contain an object")
    return value

def validate_result(assignment:dict,result:dict,execution_receipt:dict|None=None):
    def require(ok,message):
        if not ok: raise ValueError(message)

    require(assignment.get("schema")=="vibelearn.critic-assignment.v1","unsupported critic-assignment schema")
    require(result.get("schema")=="vibelearn.critic-result.v1","unsupported critic-result schema")
    candidate=assignment.get("candidate_sha")
    require(isinstance(candidate,str) and HEX40.fullmatch(candidate),"assignment candidate SHA is invalid")
    assignment_id=assignment.get("assignment_id")
    require(isinstance(assignment_id,str) and assignment_id.startswith("sha256:"),"assignment_id is required")
    require(result.get("assignment_id")==assignment_id,"critic result belongs to a different assignment")
    require(result.get("candidate_sha")==candidate,"critic result belongs to a different candidate")
    review_pass=assignment.get("pass")
    require(result.get("pass")==review_pass,"critic result belongs to a different pass")
    require(assignment.get("status")=="ready","cannot submit a result for a blocked critic assignment")
    require(result.get("verdict") in ALLOWED_VERDICTS,"invalid critic verdict")
    require(isinstance(execution_receipt,dict),"critic execution receipt is required")
    normalized_receipt=validate_receipt(assignment,execution_receipt)
    native = None
    if "execution_requirements" in assignment:
        native = validate_native_execution(
            assignment["execution_requirements"], normalized_receipt.get("native_execution"),
            candidate_sha=candidate, assignment_id=assignment_id,
            session_id=normalized_receipt["session_id"])
        if result["verdict"] == "pass":
            require(native["input_count"] > 0, "native pass needs actual input")
            require(native["successful_input_count"] > 0, "native pass needs a successful input dispatch")
            require(not native["missing_checkpoints"], "native pass is missing checkpoints")
            require(not native["capture_gaps"], "native pass is missing required capture coverage")
            require(native["observed_after_last_input"], "native pass needs final observation")
    capsule_id=normalized_receipt.get("capsule_id")
    require(isinstance(capsule_id,str) and re.fullmatch(r"sha256:[0-9a-f]{64}",capsule_id),
            "sealed critic capsule is required")
    require(result.get("execution_receipt_id")==normalized_receipt["receipt_id"],
            "critic result belongs to a different execution receipt")

    attestation=result.get("context_attestation")
    require(isinstance(attestation,dict),"context_attestation is required")
    require(attestation.get("allowed_context_only") is True,"critic must attest allowed-context-only review")
    require(attestation.get("observations_before_interpretation") is True,
            "critic must attest observations-before-interpretation")
    require(isinstance(attestation.get("notes"),str) and attestation["notes"].strip(),
            "critic context attestation needs notes")

    observations=result.get("observations")
    require(isinstance(observations,list) and observations
            and all(isinstance(x,str) and x.strip() for x in observations),
            "critic observations are required")
    require(isinstance(result.get("interpretation"),str) and result["interpretation"].strip(),
            "critic interpretation is required")
    require(isinstance(result.get("uncertainties"),list)
            and all(isinstance(x,str) and x.strip() for x in result["uncertainties"]),
            "critic uncertainties must be a list of strings")
    require(isinstance(result.get("counterexample_attempt"),str)
            and result["counterexample_attempt"].strip(),
            "critic counterexample attempt is required")

    blockers=result.get("blockers")
    require(isinstance(blockers,list),"critic blockers must be a list")
    for blocker in blockers:
        require(isinstance(blocker,dict)
                and isinstance(blocker.get("finding"),str) and blocker["finding"].strip()
                and isinstance(blocker.get("retest"),str) and blocker["retest"].strip(),
                "critic blocker needs finding and retest")
    if result["verdict"]=="pass":
        require(not blockers,"passing critic result cannot contain blockers")
    if result["verdict"]=="needs_revision":
        require(bool(blockers),"needs_revision result must contain at least one blocker")

    used=result.get("used_evidence")
    require(isinstance(used,list) and used,"critic used_evidence is required")
    allowed={
        (item.get("ref"),item.get("modality"),item.get("candidate_sha"))
        for item in assignment.get("allowed_evidence") or []
        if isinstance(item,dict)
    }
    supplied={
        (item.get("ref"),item.get("modality"),item.get("candidate_sha"))
        for item in normalized_receipt.get("supplied_evidence") or []
        if isinstance(item,dict)
    }
    used_modalities=set()
    for item in used:
        require(isinstance(item,dict),"used_evidence entries must be objects")
        key=(item.get("ref"),item.get("modality"),item.get("candidate_sha"))
        require(key in allowed,f"critic used evidence outside its assignment: {item.get('ref')}")
        require(key in supplied,f"critic used evidence not supplied by execution harness: {item.get('ref')}")
        used_modalities.add(item.get("modality"))
    for alternatives in assignment.get("required_evidence_groups") or []:
        require(isinstance(alternatives,list) and alternatives,"assignment required-evidence group is invalid")
        require(used_modalities.intersection(alternatives),
                f"critic result did not use required evidence modality: {' or '.join(alternatives)}")

    dimensions = None
    if review_pass == "art_world_direction":
        dimensions = result.get("dimensions")
        require(isinstance(dimensions, dict) and set(dimensions) == set(ART_WORLD_CRITERIA),
                "art/world result must address every required dimension")
        used_keys = {(e.get("ref"), e.get("modality"), e.get("candidate_sha")) for e in used}
        statuses = set()
        for name, dimension in dimensions.items():
            require(isinstance(dimension, dict), f"{name}: dimension must be an object")
            status = dimension.get("status")
            require(status in {"pass", "needs_revision", "unassessed"}, f"{name}: invalid dimension status")
            statuses.add(status)
            require(isinstance(dimension.get("observation"), str) and dimension["observation"].strip(),
                    f"{name}: observation or explicit evidence gap is required")
            refs = dimension.get("evidence")
            require(isinstance(refs, list), f"{name}: evidence must be a list")
            for ref in refs:
                require(isinstance(ref, dict) and
                        (ref.get("ref"), ref.get("modality"), ref.get("candidate_sha")) in used_keys,
                        f"{name}: dimension evidence must belong to used_evidence")
            if status != "unassessed":
                require(bool(refs), f"{name}: assessed dimension needs evidence")
                modalities = {ref.get("modality") for ref in refs}
                require({"cold_observer_report", "interactive_trace"} <= modalities,
                        f"{name}: assessed dimension needs cold-observer and interactive evidence")
            if status == "pass":
                require(isinstance(dimension.get("counterexample_attempt"), str)
                        and dimension["counterexample_attempt"].strip(),
                        f"{name}: passing dimension needs a counterexample attempt")
        expected_verdict = ("needs_revision" if "needs_revision" in statuses else
                            "unresolved" if "unassessed" in statuses else "pass")
        require(result["verdict"] == expected_verdict,
                "art/world verdict must reflect its weakest dimension")

    expected=assignment.get("expected_output_modality")
    normalized_modality=PASS_RESULT_MODALITY.get(review_pass,expected)
    require(isinstance(normalized_modality,str) and normalized_modality,
            "critic assignment has no output modality")

    return {
        "schema":"vibelearn.validated-critic-result.v1",
        "candidate_sha":candidate,
        "assignment_id":assignment_id,
        "capsule_id":capsule_id,
        "execution_receipt_id":normalized_receipt["receipt_id"],
        "executor_id":normalized_receipt["executor_id"],
        "session_id":normalized_receipt["session_id"],
        "pass":review_pass,
        "modality":normalized_modality,
        "verdict":result["verdict"],
        "context_attestation":attestation,
        "used_evidence":used,
        "observations":observations,
        "interpretation":result["interpretation"],
        "uncertainties":result["uncertainties"],
        "counterexample_attempt":result["counterexample_attempt"],
        "blockers":blockers,
        **({"dimensions": dimensions} if dimensions is not None else {}),
        **({"native_coverage": native} if native is not None else {}),
    }

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assignment",type=Path,required=True)
    parser.add_argument("--result",type=Path,required=True)
    parser.add_argument("--execution-receipt",type=Path,required=True)
    parser.add_argument("--output",type=Path,required=True)
    args=parser.parse_args()
    try:
        normalized=validate_result(
            load(args.assignment),load(args.result),load(args.execution_receipt)
        )
    except ValueError as exc:
        print(json.dumps({"status":"invalid_critic_result","error":str(exc)}))
        return 2
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(normalized,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"status":"ok","candidate_sha":normalized["candidate_sha"],"pass":normalized["pass"],"verdict":normalized["verdict"],"modality":normalized["modality"]}))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
