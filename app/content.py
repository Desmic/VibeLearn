"""Original static practice content and the progressive retry campaign.

No learner context belongs in this module. Existing Phase 1 snapshots remain valid;
the campaign adds new immutable activity/family IDs rather than mutating old history.
"""
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

COMPETENCY = {"id": "1ec3ab95-7f46-4aaa-8d07-d94fcb71f262", "revision": 1, "name": "Reliable side-effect execution"}
SOURCE = {
    "id": "6b39b57a-8df0-442e-9857-61d5ba4c3826",
    "revision": 1,
    "title": "Making retries safe with idempotent APIs",
    "publisher": "AWS Builders Library · Malcolm Featonby",
    "url": "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/",
    "access": "Article text inspected during development on 2026-09-06; external link, no embedded copy.",
    "summary": "Caller-provided request IDs express intent. Retried requests and late arrivals need an explicit service contract.",
}
POLICIES = {"assessment": "trace-counts-v1", "retrieval": "practice-followup-v1", "reward": "first-family-practice-v1", "assistance": "explicit-aids-v1"}
VALIDATION = {
    "status": "criterion_checked",
    "scope": "Trace counts under explicit assumptions only",
    "basis": "Original practice problems, manually inspected by the implementation agent and checked with an executable trace model. No independent human content review or educational validation yet.",
}

# Historical Phase 1 activity. Keep IDs/content stable so old snapshots/tests remain valid.
CONTENT = {
    "schema_version": 1,
    "activity": {"id": "18386b0b-93b2-4b04-bc26-3357ec487513", "revision": 1},
    "family_id": "45377d57-4acf-4bc7-acda-8823d9a65761",
    "competency": deepcopy(COMPETENCY),
    "frame": {"id": "7dab5b1b-2a06-4880-9d74-63eca29cf23c", "revision": 1, "name": "Reason about retry identity and retention", "coverage": "partial practice", "allowed_aids": ["task statement", "own notes"]},
    "binding": {"id": "2b4c83ed-65a7-4de6-9ba0-b6b3a552eb66", "revision": 1, "criterion": "trace_counts", "attribution_fraction": 1},
    "rubric": {"id": "5ca05650-554d-44cd-aa68-c552848170bc", "revision": 1, "criteria": [
        {"id": "trace_counts", "name": "Predict committed effects", "method": "deterministic trace model", "coverage": "Three specific traces only; no general mastery inference."},
        {"id": "diagnosis", "name": "Explain the repair and its limits", "method": "ungraded reflection", "coverage": "Requires human review; never scored by keyword."},
    ]},
    "title": "The retry that charged twice",
    "intro": "Your agent calls a payment tool. The charge commits, but the acknowledgement is lost. The worker restarts and retries. Does one intent still produce one charge?",
    "assumptions": "Treat A, B and C as separate runs with an empty ledger. Every accepted call commits exactly one charge and its key/result atomically. A retained key replays the stored result without charging. There are no other calls, failures or in-flight requests. Ledger retention starts at the first commit.",
    "trace": [
        {"label": "A", "name": "New key on retry", "first": "run-41", "retry": "run-42", "elapsed_seconds": 30, "retention_seconds": 86400},
        {"label": "B", "name": "Stable intent key", "first": "order-87", "retry": "order-87", "elapsed_seconds": 30, "retention_seconds": 86400},
        {"label": "C", "name": "Retry after expiry", "first": "order-87", "retry": "order-87", "elapsed_seconds": 172800, "retention_seconds": 86400},
    ],
    "prompt": "Predict the total committed charges after each retry, in A, B, C order. Then diagnose the bug and propose a repair: where does the key live, how do you handle changed payloads, and what happens after retention expires?",
    "hints": [
        "Separate the logical business intent from a worker run. What exact value tells the payment service that two calls mean the same thing?",
        "The charge and deduplication result are committed together here. Compare the second key with the first, then check whether the first record is still retained.",
        "A commits twice because its key changes. B replays its retained result and commits once. C commits twice because the matching record has expired. A stable key alone cannot protect a retry beyond retention.",
    ],
    "source": deepcopy(SOURCE),
    "validation": deepcopy(VALIDATION),
    "policies": deepcopy(POLICIES),
}


def _campaign_mission(*, mission_id, number, difficulty, activity_id, family_id, frame_id, binding_id, rubric_id, title, objective, intro, assumptions, traces, prompt, hints, requires_diagnosis, available_modes, source_enabled, boss=False):
    count = len(traces)
    return {
        "schema_version": 1,
        "activity": {"id": activity_id, "revision": 1},
        "family_id": family_id,
        "competency": deepcopy(COMPETENCY),
        "frame": {"id": frame_id, "revision": 1, "name": objective, "coverage": "partial practice", "allowed_aids": ["task statement", "own notes"]},
        "binding": {"id": binding_id, "revision": 1, "criterion": "trace_counts", "attribution_fraction": 1},
        "rubric": {"id": rubric_id, "revision": 1, "criteria": [
            {"id": "trace_counts", "name": "Predict committed effects", "method": "deterministic trace model", "coverage": f"{count} pinned trace{'s' if count != 1 else ''}; no general mastery inference."},
            {"id": "diagnosis", "name": "Explain the repair and its limits", "method": "ungraded reflection", "coverage": "Required only on missions that explicitly ask for it; never keyword-scored."},
        ]},
        "mission": {
            "id": mission_id,
            "number": number,
            "difficulty": difficulty,
            "boss": boss,
            "objective": objective,
            "requires_diagnosis": requires_diagnosis,
            "available_modes": available_modes,
            "source_enabled": source_enabled,
            "hint_count": len(hints),
            "reward_xp": 10,
        },
        "title": title,
        "intro": intro,
        "assumptions": assumptions,
        "trace": traces,
        "prompt": prompt,
        "hints": hints,
        "source": deepcopy(SOURCE),
        "validation": deepcopy(VALIDATION),
        "policies": deepcopy(POLICIES),
    }


CAMPAIGN = [
    _campaign_mission(
        mission_id="retry-01-replay",
        number=1,
        difficulty="Tutorial",
        activity_id="63f36df3-e8ac-4520-bf5f-b4777703fac6",
        family_id="e001fa80-98dd-48ba-907f-2c8886b3ee49",
        frame_id="cf2177ee-205f-44a9-9de8-306cafed4f39",
        binding_id="4f5e9fb4-660b-4733-bbf1-7e9fdff57948",
        rubric_id="62510c5d-7a03-4e12-9182-23017d04246e",
        title="Replay, don't repay",
        objective="Recognize a retained idempotent retry",
        intro="A payment commits, its acknowledgement disappears, and the agent retries 30 seconds later with the exact same request key.",
        assumptions="The payment service stores a successful key and result atomically for 24 hours. The retry arrives 30 seconds later. No other calls occur.",
        traces=[{"label": "A", "name": "Same key, quick retry", "first": "order-87", "retry": "order-87", "elapsed_seconds": 30, "retention_seconds": 86400}],
        prompt="How many total charges exist after the retry? Pick the outcome. This first level teaches one rule only.",
        hints=["The service still remembers the first key. Ask whether the second call looks new or identical to the stored intent."],
        requires_diagnosis=False,
        available_modes=["LEARN"],
        source_enabled=False,
    ),
    _campaign_mission(
        mission_id="retry-02-identity",
        number=2,
        difficulty="Easy",
        activity_id="68526864-59a6-469e-b3a8-60cf8bf19c54",
        family_id="37c65e6b-b3d3-4d98-9912-9dc3137e1f20",
        frame_id="3c53fd66-73bf-46e6-b61d-e3be1a7458ca",
        binding_id="af41d00b-c2c0-42ef-9706-bbc7a45064f8",
        rubric_id="6b7561b3-477d-44c0-9f82-0bd1d23c54e2",
        title="The key changed",
        objective="Separate worker identity from business intent",
        intro="The payment commits. The acknowledgement is lost. After restart the worker invents a fresh run ID and retries with that new key.",
        assumptions="The payment service deduplicates only exact retained keys. Both calls arrive within 30 seconds and each accepted new key commits one charge.",
        traces=[{"label": "A", "name": "Fresh run key", "first": "run-41", "retry": "run-42", "elapsed_seconds": 30, "retention_seconds": 86400}],
        prompt="How many total charges exist now? Then notice what changed between the two calls.",
        hints=["The service does not know that run-41 and run-42 belong to the same business intent."],
        requires_diagnosis=False,
        available_modes=["LEARN"],
        source_enabled=False,
    ),
    _campaign_mission(
        mission_id="retry-03-retention",
        number=3,
        difficulty="Medium",
        activity_id="c346f4e3-e7f0-4e25-a33c-2cb06430a8a0",
        family_id="a79664b5-1c3f-4f63-8076-0283556272c5",
        frame_id="5b40635e-9178-4d19-9dcb-8f6fb0f4653f",
        binding_id="84724243-f796-45a7-b2bf-5340ac30b392",
        rubric_id="b70ff217-fb8a-4377-93f2-f6e96f534bde",
        title="The record expired",
        objective="Reason about the retention boundary",
        intro="You fixed retry identity. Now the same key can arrive while its result is still retained—or after that protection has expired.",
        assumptions="Each run begins with an empty ledger. Successful keys/results are retained for exactly 24 hours. A retained match replays; an expired record behaves as absent.",
        traces=[
            {"label": "A", "name": "Retry inside retention", "first": "order-87", "retry": "order-87", "elapsed_seconds": 30, "retention_seconds": 86400},
            {"label": "B", "name": "Retry after expiry", "first": "order-87", "retry": "order-87", "elapsed_seconds": 172800, "retention_seconds": 86400},
        ],
        prompt="Predict both outcomes. Then explain in one or two sentences why a stable key is not enough forever.",
        hints=[
            "First compare the retry delay with the 24-hour retention window.",
            "The same key protects the retry only while the matching record still exists.",
        ],
        requires_diagnosis=True,
        available_modes=["LEARN", "PAIR"],
        source_enabled=True,
    ),
    _campaign_mission(
        mission_id="retry-04-boss",
        number=4,
        difficulty="Boss",
        activity_id="d8ebf355-204f-45c5-bb92-9316e3cbf95e",
        family_id="8d183558-1c52-440c-bada-bd6e4fc5bd5e",
        frame_id="4fd9d3a7-430c-4e10-aa40-c28a441f0824",
        binding_id="b8760807-943c-48fa-92f8-f2f7ec4b635e",
        rubric_id="04bb09b2-b52b-477f-9a94-6281ac76e6c5",
        title="The retry that charged twice",
        objective="Design a retry identity and retention contract",
        intro="Now combine everything: a changed key, a retained key, and a late retry after expiry. Read all three runs and design the contract that survives them.",
        assumptions="Treat A, B and C as separate runs with an empty ledger. Every accepted call commits exactly one charge and its key/result atomically. A retained key replays the stored result without charging. Ledger retention starts at the first commit.",
        traces=[
            {"label": "A", "name": "New key on retry", "first": "run-41", "retry": "run-42", "elapsed_seconds": 30, "retention_seconds": 86400},
            {"label": "B", "name": "Stable intent key", "first": "order-87", "retry": "order-87", "elapsed_seconds": 30, "retention_seconds": 86400},
            {"label": "C", "name": "Retry after expiry", "first": "order-87", "retry": "order-87", "elapsed_seconds": 172800, "retention_seconds": 86400},
        ],
        prompt="Predict A, B and C, then propose the full repair: where the intent key lives, how payload changes are handled, and what happens after retention expires.",
        hints=[
            "Separate the logical business intent from a worker run. What exact value tells the payment service that two calls mean the same thing?",
            "Compare each retry key with the first call, then compare the retry delay with retention.",
            "A commits twice because its key changes. B replays. C commits twice after expiry. Your contract has to address identity and late uncertainty.",
        ],
        requires_diagnosis=True,
        available_modes=["LEARN", "PAIR", "BUILD"],
        source_enabled=True,
        boss=True,
    ),
]

MISSION_INDEX = {item["mission"]["id"]: item for item in CAMPAIGN}


def campaign_catalog():
    return [deepcopy(item["mission"] | {"title": item["title"], "family_id": item["family_id"]}) for item in CAMPAIGN]


def freeze(mode, mission_id=None):
    source = CONTENT if mission_id is None else MISSION_INDEX.get(mission_id)
    if source is None:
        raise ValueError("Unknown mission")
    if mission_id is not None and mode not in source["mission"]["available_modes"]:
        raise ValueError("Mode unavailable for mission")
    snapshot = deepcopy(source)
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
