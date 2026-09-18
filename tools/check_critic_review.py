"""Check review evidence and readiness. This does not judge a game or accept it."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

V1_GATES = {
    "rendered_story": ("world_role_stakes", "visible_causality", "attachment_pull"),
    "first_touch": ("orientation_action", "hud_readability", "controls"),
    "whole_chapter": ("meaningful_agency", "progression_recovery", "world_continuity"),
    "learning": ("concept_fidelity", "fresh_transfer"),
}
# Backward-compatible export used by historical tests/records.
GATES = V1_GATES

V2_GATES = {
    "rendered_story": ("world_role_stakes", "visible_causality", "attachment_pull"),
    "creative_direction": (
        "world_comprehension", "motion_direction", "semantic_readability", "audio_atmosphere"
    ),
    "first_touch": (
        "orientation_action", "hud_readability", "controls",
        "physicality", "transition_handoff", "tutorial_clarity",
    ),
    "whole_chapter": ("meaningful_agency", "progression_recovery", "world_continuity"),
    "learning": ("concept_fidelity", "fresh_transfer"),
}

COVERAGE = (
    "fresh_entry", "first_action", "mistake", "recovery", "later_challenge",
    "payoff", "transfer", "replay", "save_resume", "controls_after_save",
    "desktop", "phone_360", "phone_390", "phone_430", "touch", "keyboard",
    "enlarged_text", "reduced_motion",
)

EVIDENCE_MODALITIES = {
    "cold_observer_report",
    "interactive_trace",
    "motion_video",
    "audio_listening",
    "screenshot",
    "runtime_trace",
    "authoritative_replay",
    "ci_report",
    "source_inspection",
    "review_assignment",
    "audio_capture",
    "caption_blind_motion",
    "critic_report",
}

MODALITY_EXTENSIONS = {
    "cold_observer_report": {".json", ".md", ".txt"},
    "interactive_trace": {".json", ".zip"},
    "motion_video": {".webm", ".mp4", ".mov"},
    "audio_listening": {".json", ".md", ".txt"},
    "screenshot": {".png", ".jpg", ".jpeg", ".webp"},
    "runtime_trace": {".json", ".zip"},
    "authoritative_replay": {".json", ".md"},
    "ci_report": {".json", ".txt"},
    "source_inspection": {".json", ".md", ".txt", ".tar"},
    "review_assignment": {".json", ".md", ".txt"},
    "audio_capture": {".wav", ".mp3", ".ogg", ".m4a", ".webm"},
    "caption_blind_motion": {".webm", ".mp4", ".mov"},
    "critic_report": {".json", ".md", ".txt"},
}

# Each tuple is an AND requirement; alternatives inside a tuple are OR.
CRITERION_MODALITIES = {
    "world_role_stakes": (("cold_observer_report",), ("motion_video", "interactive_trace")),
    "visible_causality": (("motion_video", "interactive_trace"),),
    "attachment_pull": (("cold_observer_report",),),
    "world_comprehension": (("cold_observer_report",), ("caption_blind_motion", "interactive_trace")),
    "motion_direction": (("motion_video", "interactive_trace"),),
    "semantic_readability": (("cold_observer_report",),),
    "audio_atmosphere": (("audio_listening",),),
    "orientation_action": (("interactive_trace",),),
    "hud_readability": (("screenshot", "interactive_trace"),),
    "controls": (("interactive_trace",),),
    "physicality": (("interactive_trace",),),
    "transition_handoff": (("interactive_trace",),),
    "tutorial_clarity": (("interactive_trace",),),
    "meaningful_agency": (("interactive_trace",),),
    "progression_recovery": (("interactive_trace",),),
    "world_continuity": (("motion_video", "interactive_trace"),),
    "concept_fidelity": (("authoritative_replay",),),
    "fresh_transfer": (("authoritative_replay",),),
}


def evaluate(record, candidate, root=ROOT):
    """Reject malformed/stale claims; return internal readiness, never acceptance."""
    def require(condition, message):
        if not condition:
            raise ValueError(message)

    schema = record.get("schema_version")
    require(schema in (1, 2), "Unsupported review schema")

    require(isinstance(candidate, str) and re.fullmatch(r"[0-9a-f]{40}", candidate),
            "An exact 40-character candidate SHA is required")
    require(record.get("candidate_sha") == candidate, "Review belongs to a different candidate")

    def evidence(refs, criterion=None):
        require(isinstance(refs, list) and bool(refs), "Evidence references are required")
        modalities = set()
        for item in refs:
            if schema == 1:
                require(isinstance(item, str) and bool(item.strip()), "Invalid evidence reference")
                ref = item
            else:
                require(isinstance(item, dict), "V2 evidence must be a structured object")
                ref = item.get("ref")
                modality = item.get("modality")
                require(isinstance(ref, str) and bool(ref.strip()), "Invalid evidence reference")
                require(modality in EVIDENCE_MODALITIES, f"Invalid evidence modality: {modality}")
                require(item.get("candidate_sha") == candidate,
                        "V2 evidence belongs to a different candidate")
                modalities.add(modality)
            path = (root / ref).resolve()
            require(path.is_relative_to(root.resolve()) and path.is_file(),
                    f"Missing or external evidence: {ref}")
            if schema == 2:
                allowed = MODALITY_EXTENSIONS.get(modality, set())
                require(not allowed or path.suffix.lower() in allowed,
                        f"{modality}: unsupported evidence file type {path.suffix.lower()}")
        if schema == 2 and criterion:
            for acceptable in CRITERION_MODALITIES.get(criterion, ()):
                require(modalities.intersection(acceptable),
                        f"{criterion}: evidence needs one of {', '.join(acceptable)}")
        return modalities

    require(record.get("method") in ("internal_tool_assisted", "independent_agent"),
            "Declare the internal reviewer method; this tool cannot record user acceptance")
    for key in ("environment", "limitations", "prior_context", "user_authority"):
        require(isinstance(record.get(key), str) and bool(record[key].strip()), f"Missing {key}")

    if schema == 2:
        require(record.get("review_order") == "cold_observer_then_intent",
                "V2 review must run cold observer before design-intent comparison")
        require(isinstance(record.get("cold_observer_context"), str)
                and bool(record["cold_observer_context"].strip()),
                "V2 review must describe the restricted cold-observer context")

    require(record.get("technical_status") in ("passed", "failed", "not_checked"),
            "Invalid technical status")
    if record["technical_status"] != "not_checked":
        technical_modalities = evidence(record.get("technical_evidence"))
        if schema == 2 and record["technical_status"] == "passed":
            require(technical_modalities.intersection({"ci_report", "runtime_trace", "interactive_trace"}),
                    "V2 technical pass needs CI/runtime/interactive evidence")

    gates = V1_GATES if schema == 1 else V2_GATES
    expected_criteria = {c for group in gates.values() for c in group}
    require(isinstance(record.get("criteria"), dict), "Missing criteria")
    require(set(record["criteria"]) == expected_criteria,
            "All required criteria must be present, without extras")

    scores = {}
    incomplete = record["technical_status"] == "not_checked"
    needs_revision = record["technical_status"] == "failed"

    for name, item in record["criteria"].items():
        require(isinstance(item, dict), f"Invalid criterion: {name}")
        rating = item.get("rating")
        require(rating is None or (type(rating) is int and 0 <= rating <= 10),
                f"{name}: rating must be an integer 0–10 or null")
        require(isinstance(item.get("reason"), str) and bool(item["reason"].strip()),
                f"{name}: explain the judgment or missing assessment")
        if rating is not None:
            evidence(item.get("evidence"), name if schema == 2 else None)
            if rating >= 9:
                require(isinstance(item.get("counterexample_attempt"), str)
                        and bool(item["counterexample_attempt"].strip()),
                        f"{name}: a 9+ needs a recorded counterexample attempt")
            needs_revision |= rating < 9
        else:
            incomplete = True
        scores[name] = rating

    require(isinstance(record.get("coverage"), dict) and set(record["coverage"]) == set(COVERAGE),
            "All required play coverage must be recorded")
    for name, item in record["coverage"].items():
        require(isinstance(item, dict) and item.get("status") in ("observed", "blocked", "not_checked"),
                f"Invalid coverage: {name}")
        require(isinstance(item.get("note"), str) and bool(item["note"].strip()),
                f"{name}: coverage needs a note")
        if item["status"] != "not_checked":
            evidence(item.get("evidence"))
        incomplete |= item["status"] == "not_checked"
        needs_revision |= item["status"] == "blocked"

    require(isinstance(record.get("blockers"), list), "Blockers must be explicitly listed")
    for blocker in record["blockers"]:
        require(isinstance(blocker, dict) and bool(blocker.get("finding"))
                and bool(blocker.get("retest")), "A blocker needs finding and retest")
        evidence(blocker.get("evidence"))
    needs_revision |= bool(record["blockers"])

    require("user_accepted" not in record and "acceptance" not in record,
            "User acceptance cannot be supplied to the internal checker")

    status = "needs_revision" if needs_revision else "review_incomplete" if incomplete else "ready_for_user_review"
    return {
        "candidate_sha": candidate,
        "schema_version": schema,
        "status": status,
        "gate_minimums": {
            gate: min(scores[c] for c in criteria) if all(scores[c] is not None for c in criteria) else None
            for gate, criteria in gates.items()
        },
        "unassessed_criteria": [c for c, score in scores.items() if score is None],
        "unobserved_coverage": [c for c, item in record["coverage"].items() if item["status"] != "observed"],
        "user_acceptance": "not_determined_by_tool",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("record", type=Path)
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--evidence-root", type=Path, default=ROOT,
                        help="Root containing extracted exact-candidate evidence files")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    try:
        record = json.loads(args.record.read_text(encoding="utf-8"))
        if not isinstance(record, dict):
            raise ValueError("Review must be an object")
        result = evaluate(record, args.candidate, args.evidence_root)
    except (ValueError, OSError, TypeError) as exc:
        print(json.dumps({"status": "invalid_record", "error": str(exc)}))
        return 2
    print(json.dumps(result, indent=2))
    return 0 if args.validate_only or result["status"] == "ready_for_user_review" else 1


if __name__ == "__main__":
    raise SystemExit(main())
