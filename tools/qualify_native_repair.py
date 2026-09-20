"""Local qualification of repair returns using the existing critic capsule gate.

No provider/transport is called. Passing qualifies evidence for this one task,
not an executor's general competence or a game release.
"""
import hashlib
import json
import argparse
from pathlib import Path

from app.orchestrator_adapter import VibeLearnAdapter, validate_start_request
from tools.build_native_repair_proposal import CAPABILITY
from tools.native_play_execution import validate_native_execution, validate_native_artifacts
from tools.materialize_critic_capsule import materialize, validate_capsule
from tools.validate_critic_result import validate_result


def digest(value):
    return "sha256:" + hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def _identity(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{label} identity is required")
    return value.strip()


def review_assignment(request, execution, capture_root, worker_executor_id):
    request = validate_start_request(request)
    extension = request.get("extensions", {}).get(CAPABILITY)
    if not isinstance(extension, dict) or CAPABILITY not in request["required_capabilities"]:
        raise ValueError("native repair capability contract is required")
    if extension.get("session_policy") != "fresh_session_replay":
        raise ValueError("fresh session replay is required")
    source = extension["source_identity"]
    session = _identity(execution.get("session_id"), "worker session")
    if session == _identity(source["session_id"], "source session"):
        raise ValueError("repair must use a fresh worker session")
    worker_executor_id = _identity(worker_executor_id, "worker executor")
    if request["run_request"]["repository"]["base_revision"] != source["candidate_sha"]:
        raise ValueError("repair request build mismatch")
    coverage = validate_native_execution(extension["execution_requirements"], execution,
        candidate_sha=source["candidate_sha"], assignment_id=source["assignment_id"], session_id=session)
    root = Path(capture_root)
    validate_native_artifacts(execution, root)
    record_path = root / "execution.json"
    if json.loads(record_path.read_text(encoding="utf-8")) != execution:
        raise ValueError("retained worker execution does not match return")
    evidence = [dict(ref="execution.json", modality="native_execution", candidate_sha=source["candidate_sha"])]
    for event in execution["events"]:
        if event["kind"] == "observation":
            if event["ref"] == "execution.json":
                raise ValueError("capture conflicts with reserved execution record")
            evidence.append(dict(ref=event["ref"], modality=event.get("modality", "unknown_capture"),
                                 candidate_sha=source["candidate_sha"]))
    value = dict(schema="vibelearn.critic-assignment.v1", candidate_sha=source["candidate_sha"],
                 status="ready", **{"pass": "native_evidence_coverage"},
                 expected_output_modality="native_evidence_review", allowed_evidence=evidence,
                 required_evidence_groups=[["native_execution"]],
                 forbidden_context=["creator rationale", "worker conclusion"],
                 questions=["Does the retained action record and every capture support all assigned checkpoints?",
                            "Look for contradictory visible states, missing modalities and incorrect ordering. "
                            "Do not infer live acquisition or unseen behavior from metadata alone."],
                 repair_binding=dict(request_intent_digest=VibeLearnAdapter._intent_digest(request),
                                     native_execution_digest=digest(execution), worker_executor_id=worker_executor_id,
                                     worker_session_id=session),
                 native_requirements=extension["execution_requirements"], native_coverage=coverage)
    value["assignment_id"] = digest(value)
    return value


def prepare_review(request, execution, capture_root, worker_executor_id, capsule_dir):
    """Prepare only a new capsule; never overwrite an existing review."""
    output = Path(capsule_dir)
    if output.exists():
        raise ValueError("review capsule must be new")
    assignment = review_assignment(request, execution, capture_root, worker_executor_id)
    return materialize(assignment, Path(capture_root), output)


def qualify_return(request, execution, capture_root, worker_executor_id,
                   capsule_dir, reviewer_receipt, reviewer_result):
    expected = review_assignment(request, execution, capture_root, worker_executor_id)
    capsule_dir = Path(capsule_dir)
    capsule = validate_capsule(capsule_dir)
    supplied = json.loads((capsule_dir / "assignment.json").read_text(encoding="utf-8"))
    if supplied != expected or reviewer_receipt.get("capsule_id") != capsule["capsule_id"]:
        raise ValueError("review is not bound to this repair return")
    reviewed = validate_result(expected, reviewer_result, reviewer_receipt)
    # Receipt validation canonicalizes identity strings. Compare those validated
    # identities with the canonical worker binding, never raw caller spellings.
    binding = expected["repair_binding"]
    if (reviewed["executor_id"] == binding["worker_executor_id"]
            or reviewed["session_id"] == binding["worker_session_id"]):
        raise ValueError("review must be separate from worker executor and session")
    used = {item["ref"] for item in reviewed["used_evidence"]}
    if reviewed["verdict"] == "pass" and used != {item["ref"] for item in expected["allowed_evidence"]}:
        raise ValueError("repair reviewer must account for every retained observation")
    coverage = expected["native_coverage"]
    complete = (coverage["successful_input_count"] > 0 and coverage["observed_after_last_input"]
                and not coverage["missing_checkpoints"] and not coverage["capture_gaps"])
    if reviewed["verdict"] == "pass" and not complete:
        raise ValueError("reviewer pass cannot override incomplete native coverage")
    status = {"pass": "evidence_repair_qualified", "unresolved": "unresolved",
              "needs_revision": "needs_revision"}[reviewed["verdict"]]
    return dict(schema="vibelearn.native-repair-qualification.v1", status=status,
                repair_binding=expected["repair_binding"], capsule_id=capsule["capsule_id"],
                reviewer_receipt_id=reviewed["execution_receipt_id"], native_coverage=coverage,
                product_acceptance="undetermined", dispatch_authorized=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("request", "run_dir", "capsule_dir"):
        parser.add_argument("--" + name.replace("_", "-"), required=True, type=Path)
    parser.add_argument("--worker-executor-id", required=True)
    parser.add_argument("--reviewer-receipt", type=Path)
    parser.add_argument("--reviewer-result", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    def read(path):
        return json.loads(path.read_text(encoding="utf-8"))
    try:
        request = read(args.request)
        execution = read(args.run_dir / "execution.json")
        review_args = (args.reviewer_receipt, args.reviewer_result, args.output)
        if not any(review_args):
            result = prepare_review(request, execution, args.run_dir, args.worker_executor_id, args.capsule_dir)
            print(json.dumps(dict(status="review_required", capsule_id=result["capsule_id"])))
        else:
            if not all(review_args):
                raise ValueError("qualification needs reviewer receipt, result and new output path")
            result = qualify_return(request, execution, args.run_dir, args.worker_executor_id,
                                    args.capsule_dir, read(args.reviewer_receipt), read(args.reviewer_result))
            with args.output.open("x", encoding="utf-8") as stream:
                json.dump(result, stream, indent=2)
            print(json.dumps(dict(status=result["status"], product_acceptance="undetermined")))
    except (ValueError, KeyError, OSError) as exc:
        parser.exit(2, f"Invalid repair qualification: {exc}\n")


if __name__ == "__main__":
    main()
