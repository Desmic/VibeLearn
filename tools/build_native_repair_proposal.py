"""Build an offline native-evidence repair proposal using adapter contract 0.1.

No transport, provider or model is invoked. New child sessions replay the full
native contract; prior captures remain context, never newly acquired evidence.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path

from app.orchestrator_adapter import validate_start_request
from tools.native_play_execution import (
    validate_native_execution, validate_native_artifacts, capture_repair_steps,
)

CAPABILITY = "vibelearn.native_evidence_repair.v1"


def build_proposal(parent, config, execution, capture_root, *, parent_run_ref,
                   evidence_ref, request_id, idempotency_key, budget):
    parent = validate_start_request(parent)
    identity = {k: config["identity"][k] for k in ("candidate_sha", "assignment_id", "session_id")}
    coverage = validate_native_execution(config["requirements"], execution, **identity)
    validate_native_artifacts(execution, capture_root)
    if parent["run_request"]["repository"]["base_revision"] != execution["candidate_sha"]:
        raise ValueError("parent build does not match native execution")
    source_digest = hashlib.sha256(json.dumps(execution, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
    result = dict(schema="vibelearn.native-repair-proposal.v1", dispatch_authorized=False,
                  source_execution_digest="sha256:" + source_digest, coverage=coverage,
                  capture_steps=capture_repair_steps(config["requirements"], execution))
    needed = (coverage["missing_checkpoints"] or coverage["capture_gaps"]
              or not coverage["observed_after_last_input"] or not coverage["successful_input_count"])
    if not needed:
        return dict(result, status="no_evidence_repair_needed", request=None)
    for name, value in (("parent_run_ref", parent_run_ref), ("evidence_ref", evidence_ref),
                        ("request_id", request_id), ("idempotency_key", idempotency_key)):
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{name} must be a non-empty opaque reference")
    if request_id == parent["request_id"] or idempotency_key == parent["idempotency_key"]:
        raise ValueError("repair needs new request and idempotency identities")
    parent_budget = parent["run_request"].get("budget", {})
    if not isinstance(budget, dict) or not budget or set(budget) != set(parent_budget):
        raise ValueError("explicit repair budget must cover every parent budget dimension")
    for name, amount in budget.items():
        limit = parent_budget[name]
        if type(amount) is not int or type(limit) is not int or not 0 < amount <= limit:
            raise ValueError("repair budget must be positive integers within parent ceilings")
    if not parent["run_request"].get("execution_policy_ref"):
        raise ValueError("configured execution policy reference is required")
    child = copy.deepcopy(parent)
    child.pop("intent_digest", None)
    child.update(request_id=request_id, idempotency_key=idempotency_key,
                 purpose="repair_native_evidence_coverage")
    child["required_capabilities"] = list(dict.fromkeys(child.get("required_capabilities", []) + [CAPABILITY]))
    extension = dict(source_execution_digest=result["source_execution_digest"],
                     source_identity=identity, source_evidence_ref=evidence_ref,
                     source_capture_steps=result["capture_steps"],
                     execution_requirements=copy.deepcopy(config["requirements"]),
                     session_policy="fresh_session_replay", review_mode="informed_evidence_repair",
                     suggested_worker_model="gpt-5.6-luna", dispatch_authorized=False)
    child.setdefault("extensions", {})[CAPABILITY] = extension
    run = child["run_request"]
    run.update(parent_run_ref=parent_run_ref, budget=copy.deepcopy(budget),
               requested_outcome="Replay the assigned native evidence task on the same build in a fresh disposable session. "
               "Collect and independently verify all required checkpoints and captures. Preserve unresolved claims; "
               "do not change the game, reuse old captures as new evidence, or grant product acceptance.")
    run["context_refs"] = list(run.get("context_refs", [])) + [
        dict(system="vibelearn", kind="native_execution", id=evidence_ref,
             digest=result["source_execution_digest"])]
    run["repository"]["allowed_write_scope"] = []
    reviews = run.setdefault("review_requirements", [])
    native_review = dict(requirement_id="native-evidence-coverage",
                        profile_ref="vibelearn:review/native-evidence-coverage@1", required=True, blocking=True,
                        independence=dict(separate_from_builder=True, fresh_context_first_pass=True),
                        evidence_policy=dict(execute_reproduction_when_possible=True,
                                             substantive_claims_require_falsification_attempt=True))
    existing = [r for r in reviews if r["requirement_id"] == "native-evidence-coverage"]
    if existing and existing != [native_review]:
        raise ValueError("parent native evidence review conflicts with required profile")
    if not existing:
        reviews.append(native_review)
    return dict(result, status="proposed_only", request=validate_start_request(child))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("parent", "run_dir", "budget", "output"):
        parser.add_argument("--" + name.replace("_", "-"), required=True, type=Path)
    for name in ("parent_run_ref", "evidence_ref", "request_id", "idempotency_key"):
        parser.add_argument("--" + name.replace("_", "-"), required=True)
    args = parser.parse_args()
    def read(path):
        return json.loads(path.read_text(encoding="utf-8"))
    try:
        result = build_proposal(read(args.parent), read(args.run_dir / "config.json"),
                                read(args.run_dir / "execution.json"), args.run_dir,
                                parent_run_ref=args.parent_run_ref, evidence_ref=args.evidence_ref,
                                request_id=args.request_id, idempotency_key=args.idempotency_key,
                                budget=read(args.budget))
        with args.output.open("x", encoding="utf-8") as stream:
            json.dump(result, stream, indent=2)
    except (ValueError, KeyError, OSError) as exc:
        parser.exit(2, f"Invalid repair proposal: {exc}\n")
    print(json.dumps(dict(status=result["status"], dispatch_authorized=False)))


if __name__ == "__main__":
    main()
