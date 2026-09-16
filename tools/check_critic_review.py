"""Check review evidence and readiness. This does not judge a game or accept it."""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GATES = {
    "rendered_story": ("world_role_stakes", "visible_causality", "attachment_pull"),
    "first_touch": ("orientation_action", "hud_readability", "controls"),
    "whole_chapter": ("meaningful_agency", "progression_recovery", "world_continuity"),
    "learning": ("concept_fidelity", "fresh_transfer"),
}
COVERAGE = (
    "fresh_entry", "first_action", "mistake", "recovery", "later_challenge",
    "payoff", "transfer", "replay", "save_resume", "controls_after_save",
    "desktop", "phone_360", "phone_390", "phone_430", "touch", "keyboard",
    "enlarged_text", "reduced_motion",
)


def evaluate(record, candidate, root=ROOT):
    """Reject malformed/stale claims; return internal readiness, never acceptance."""
    def require(condition, message):
        if not condition:
            raise ValueError(message)

    def evidence(refs):
        require(isinstance(refs, list) and bool(refs), "Evidence references are required")
        for ref in refs:
            require(isinstance(ref, str) and bool(ref.strip()), "Invalid evidence reference")
            path = (root / ref).resolve()
            require(path.is_relative_to(root.resolve()) and path.is_file(),
                    f"Missing or external evidence: {ref}")

    require(record.get("schema_version") == 1, "Unsupported review schema")
    require(isinstance(candidate, str) and re.fullmatch(r"[0-9a-f]{40}", candidate),
            "An exact 40-character candidate SHA is required")
    require(record.get("candidate_sha") == candidate, "Review belongs to a different candidate")
    require(record.get("method") in ("internal_tool_assisted", "independent_agent"),
            "Declare the internal reviewer method; this tool cannot record user acceptance")
    for key in ("environment", "limitations", "prior_context", "user_authority"):
        require(isinstance(record.get(key), str) and bool(record[key].strip()), f"Missing {key}")
    require(record.get("technical_status") in ("passed", "failed", "not_checked"),
            "Invalid technical status")
    if record["technical_status"] != "not_checked":
        evidence(record.get("technical_evidence"))
    require(isinstance(record.get("criteria"), dict), "Missing criteria")
    require(set(record["criteria"]) == {c for group in GATES.values() for c in group},
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
            evidence(item.get("evidence"))
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
        "status": status,
        "gate_minimums": {
            gate: min(scores[c] for c in criteria) if all(scores[c] is not None for c in criteria) else None
            for gate, criteria in GATES.items()
        },
        "unassessed_criteria": [c for c, score in scores.items() if score is None],
        "unobserved_coverage": [c for c, item in record["coverage"].items() if item["status"] != "observed"],
        "user_acceptance": "not_determined_by_tool",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("record", type=Path)
    parser.add_argument("--candidate", required=True)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    try:
        record = json.loads(args.record.read_text(encoding="utf-8"))
        if not isinstance(record, dict):
            raise ValueError("Review must be an object")
        result = evaluate(record, args.candidate)
    except (ValueError, OSError, TypeError) as exc:
        print(json.dumps({"status": "invalid_record", "error": str(exc)}))
        return 2
    print(json.dumps(result, indent=2))
    return 0 if args.validate_only or result["status"] == "ready_for_user_review" else 1


if __name__ == "__main__":
    raise SystemExit(main())
