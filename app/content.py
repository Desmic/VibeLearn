"""Original static practice content. No learner context belongs in this module."""
from copy import deepcopy
import hashlib
import json


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


MODES = {
    "LEARN": {"description": "Try first. Progressive hints preserve your earlier answer. Sources unlock after submission.", "sources_before_submit": False, "hints": True},
    "PAIR": {"description": "Think alongside prepared hints and a source. Any help is recorded.", "sources_before_submit": True, "hints": True},
    "BUILD": {"description": "Use a worked example and the source freely. This is assisted practice.", "sources_before_submit": True, "hints": True},
}

CONTENT = {
    "schema_version": 1,
    "activity": {"id": "18386b0b-93b2-4b04-bc26-3357ec487513", "revision": 1},
    "family_id": "45377d57-4acf-4bc7-acda-8823d9a65761",
    "competency": {"id": "1ec3ab95-7f46-4aaa-8d07-d94fcb71f262", "revision": 1, "name": "Reliable side-effect execution"},
    "frame": {"id": "7dab5b1b-2a06-4880-9d74-63eca29cf23c", "revision": 1, "name": "Reason about retry identity and retention", "coverage": "partial practice", "allowed_aids": ["task statement", "own notes" ]},
    "binding": {"id": "2b4c83ed-65a7-4de6-9ba0-b6b3a552eb66", "revision": 1, "criterion": "trace_counts", "attribution_fraction": 1},
    "rubric": {"id": "5ca05650-554d-44cd-aa68-c552848170bc", "revision": 1, "criteria": [
        {"id": "trace_counts", "name": "Predict committed effects", "method": "deterministic trace model", "coverage": "Three specific traces only; no general mastery inference."},
        {"id": "diagnosis", "name": "Explain the repair and its limits", "method": "ungraded reflection", "coverage": "Requires human review; never scored by keyword."}
    ]},
    "title": "The retry that charged twice",
    "intro": "Your agent calls a payment tool. The charge commits, but the acknowledgement is lost. The worker restarts and retries. Does one intent still produce one charge?",
    "assumptions": "Treat A, B and C as separate runs with an empty ledger. Every accepted call commits exactly one charge and its key/result atomically. A retained key replays the stored result without charging. There are no other calls, failures or in-flight requests. Ledger retention starts at the first commit.",
    "trace": [
        {"label": "A", "name": "New key on retry", "first": "run-41", "retry": "run-42", "elapsed_seconds": 30, "retention_seconds": 86400},
        {"label": "B", "name": "Stable intent key", "first": "order-87", "retry": "order-87", "elapsed_seconds": 30, "retention_seconds": 86400},
        {"label": "C", "name": "Retry after expiry", "first": "order-87", "retry": "order-87", "elapsed_seconds": 172800, "retention_seconds": 86400}
    ],
    "prompt": "Predict the total committed charges after each retry, in A, B, C order. Then diagnose the bug and propose a repair: where does the key live, how do you handle changed payloads, and what happens after retention expires?",
    "hints": [
        "Separate the logical business intent from a worker run. What exact value tells the payment service that two calls mean the same thing?",
        "The charge and deduplication result are committed together here. Compare the second key with the first, then check whether the first record is still retained.",
        "A commits twice because its key changes. B replays its retained result and commits once. C commits twice because the matching record has expired. A stable key alone cannot protect a retry beyond retention."
    ],
    "source": {"id": "6b39b57a-8df0-442e-9857-61d5ba4c3826", "revision": 1, "title": "Making retries safe with idempotent APIs", "publisher": "AWS Builders Library · Malcolm Featonby", "url": "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/", "access": "Article text inspected during development on 2026-09-06; external link, no embedded copy.", "summary": "Caller-provided request IDs express intent. Retried requests and late arrivals need an explicit service contract."},
    "validation": {"status": "criterion_checked", "scope": "Trace counts under explicit assumptions only", "basis": "Original practice problem, manually inspected by the implementation agent and checked with an executable trace model. No independent human content review or educational validation yet."},
    "policies": {"assessment": "trace-counts-v1", "retrieval": "practice-followup-v1", "reward": "first-family-practice-v1", "assistance": "explicit-aids-v1"}
}


def freeze(mode):
    snapshot = deepcopy(CONTENT)
    snapshot["mode_at_start"] = mode
    snapshot["aid_contract"] = deepcopy(MODES[mode])
    snapshot["mode_contracts"] = deepcopy(MODES)
    return snapshot


def presented(snapshot):
    result = deepcopy(snapshot)
    result.pop("hints", None)
    result["source"].pop("url", None)
    result["source"].pop("summary", None)
    return result
