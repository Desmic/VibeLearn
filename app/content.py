"""Original static practice content and the progressive retry campaign.

No learner context belongs in this module. Existing Phase 1 snapshots remain valid.
Campaign story revisions bump immutable activity revisions while preserving reviewed
family/frame identity when the assessed meaning is intentionally equivalent.
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

CAMPAIGN_META = {
    "title": "The Shopping Agent",
    "subtitle": "Reliable Agents · Safe retries",
    "objective": "Teach an AI shopping agent to retry a purchase safely, so one request from you never becomes two purchases or two charges.",
    "story": "You ask your AI agent to buy one 5 kg dumbbell. The store takes the payment, but the confirmation disappears. The agent has to decide how to retry without buying it twice.",
    "plain_rule": "One request from you should mean one purchase, even when messages get lost.",
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


def _campaign_mission(*, mission_id, number, difficulty, activity_id, family_id, frame_id, binding_id, rubric_id, title, objective, plain_objective, intro, assumptions, traces, story, prompt, hints, requires_diagnosis, available_modes, source_enabled, boss=False, activity_revision=2):
    count = len(traces)
    return {
        "schema_version": 1,
        "activity": {"id": activity_id, "revision": activity_revision},
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
            "plain_objective": plain_objective,
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
        "story": story,
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
        title="The missing receipt",
        objective="Recognize a retained idempotent retry",
        plain_objective="Keep one dumbbell purchase as one charge when the confirmation message disappears.",
        intro="You ask your AI agent to buy one 5 kg dumbbell. The store charges you once, but the confirmation never reaches the agent. It retries 30 seconds later using the same purchase ticket.",
        assumptions="The store remembers every successful purchase ticket for 24 hours. If it sees the same remembered ticket again, it returns the old result instead of charging again.",
        traces=[{"label": "A", "name": "Same purchase ticket", "first": "order-87", "retry": "order-87", "elapsed_seconds": 30, "retention_seconds": 86400}],
        story=[
            {"icon": "🧑", "title": "You ask", "text": "Buy one 5 kg dumbbell."},
            {"icon": "🤖", "title": "Agent orders", "text": "It sends purchase ticket order-87."},
            {"icon": "💳", "title": "Store charges", "text": "The payment succeeds once."},
            {"icon": "📡", "title": "Receipt vanishes", "text": "The success message never reaches the agent."},
            {"icon": "🔁", "title": "Agent retries", "text": "It sends the same ticket 30 seconds later."},
        ],
        prompt="After the retry, how many charges should exist in total: 1 or 2?",
        hints=["Imagine the store keeps a notebook of purchase tickets it already processed. Is order-87 still in that notebook?"],
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
        title="A new ticket, a second charge",
        objective="Separate worker identity from business intent",
        plain_objective="See why a restarted agent must remember the purchase itself, not invent a new ID for the retry.",
        intro="Same dumbbell, same user request. The first charge succeeds and its confirmation is lost. This time the agent restarts, forgets the old purchase ticket, invents a new one, and retries.",
        assumptions="The store only recognizes exact purchase-ticket IDs it has seen before. A different ticket looks like a brand-new purchase, even if the human wanted the same dumbbell.",
        traces=[{"label": "A", "name": "New ticket after restart", "first": "run-41", "retry": "run-42", "elapsed_seconds": 30, "retention_seconds": 86400}],
        story=[
            {"icon": "🧑", "title": "Same request", "text": "You still want exactly one 5 kg dumbbell."},
            {"icon": "💳", "title": "First charge", "text": "The store charges successfully."},
            {"icon": "📡", "title": "Receipt vanishes", "text": "The agent never sees the success message."},
            {"icon": "💥", "title": "Agent restarts", "text": "It forgets run-41 and creates run-42."},
            {"icon": "🔁", "title": "Retry looks new", "text": "The store sees a different ticket."},
        ],
        prompt="How many total charges exist after the retry: 1 or 2?",
        hints=["The store cannot see the agent's hidden intention. It only compares the ticket it received: run-41 versus run-42."],
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
        title="The store forgot",
        objective="Reason about the retention boundary",
        plain_objective="Learn why even the right purchase ticket only protects retries while the store still remembers it.",
        intro="The agent now keeps the same purchase ticket. But the store only remembers processed tickets for 24 hours. Compare a quick retry with one that arrives two days later.",
        assumptions="Each scenario starts fresh. The store remembers a successful purchase ticket for exactly 24 hours. While remembered, the same ticket replays the old result. After 24 hours, the store has forgotten it.",
        traces=[
            {"label": "A", "name": "Same ticket, 30 seconds later", "first": "order-87", "retry": "order-87", "elapsed_seconds": 30, "retention_seconds": 86400},
            {"label": "B", "name": "Same ticket, two days later", "first": "order-87", "retry": "order-87", "elapsed_seconds": 172800, "retention_seconds": 86400},
        ],
        story=[
            {"icon": "🎫", "title": "One purchase ticket", "text": "The agent keeps order-87 across retries."},
            {"icon": "🧠", "title": "Store memory", "text": "The store remembers processed tickets for 24 hours."},
            {"icon": "⚡", "title": "Quick retry", "text": "30 seconds later, order-87 is still remembered."},
            {"icon": "🕒", "title": "Late retry", "text": "Two days later, the store has forgotten order-87."},
        ],
        prompt="For A and B, choose whether the total is 1 charge or 2 charges. Then explain in simple words why time changes the answer.",
        hints=[
            "For each case, ask one question first: does the store still remember order-87?",
            "The same ticket is safe only while the store's memory of that ticket still exists.",
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
        title="Boss: one dumbbell, no duplicates",
        objective="Design a retry identity and retention contract",
        plain_objective="Design the rules that let a shopping agent retry uncertain purchases without accidentally buying or charging twice.",
        intro="Your shopping agent is going live. It must survive three kinds of uncertainty: a new ticket after restart, a safe quick retry, and a very late retry after the store has forgotten the old ticket.",
        assumptions="Treat A, B and C as separate shopping runs. Every new accepted ticket creates one charge. A remembered matching ticket replays the stored result without charging. The store remembers tickets for 24 hours from the first successful purchase.",
        traces=[
            {"label": "A", "name": "Agent invents a new ticket", "first": "run-41", "retry": "run-42", "elapsed_seconds": 30, "retention_seconds": 86400},
            {"label": "B", "name": "Same ticket, quick retry", "first": "order-87", "retry": "order-87", "elapsed_seconds": 30, "retention_seconds": 86400},
            {"label": "C", "name": "Same ticket, very late retry", "first": "order-87", "retry": "order-87", "elapsed_seconds": 172800, "retention_seconds": 86400},
        ],
        story=[
            {"icon": "🧑", "title": "Your rule", "text": "One human request should create one purchase."},
            {"icon": "🤖", "title": "Agent can fail", "text": "It may restart or lose a confirmation."},
            {"icon": "🏪", "title": "Store has memory", "text": "It remembers purchase tickets for a limited time."},
            {"icon": "🛡️", "title": "Your job", "text": "Design a retry contract that stays safe in all three cases."},
        ],
        prompt="Choose the total charges for A, B and C. Then design the shopping-agent rule: what stable purchase ID should survive retries, what if the purchase details change, and what should the agent do when the store may have forgotten an old ID?",
        hints=[
            "Start with the human's intent: 'buy this one dumbbell once.' Which ID should represent that intent even if the agent process restarts?",
            "For each case, compare the first and retry ticket, then ask whether the store still remembers the first ticket.",
            "A charges twice because the ticket changes. B stays at one because the ticket is remembered. C can charge twice after the memory window. A safe contract needs stable intent identity plus a plan for very late uncertainty.",
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


def campaign_overview():
    return deepcopy(CAMPAIGN_META)


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
