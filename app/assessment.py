"""Pure, bounded assessment. Never infer reasoning quality from words or XP."""
import re
from datetime import datetime, timedelta


def trace_effects(trace):
    # Two calls in order. A retained key suppresses only the second effect.
    ledger = {}
    effects = 0
    for key, seconds in [(trace["first"], 0), (trace["retry"], trace["elapsed_seconds"])]:
        retained = key in ledger and seconds - ledger[key] < trace["retention_seconds"]
        if not retained:
            effects += 1
            ledger[key] = seconds
    return effects


def parse_prediction(text, expected_count=3):
    if not isinstance(text, str) or type(expected_count) is not int or expected_count < 1:
        return None
    parts = [part.strip() for part in text.split(",")]
    if len(parts) != expected_count or any(not re.fullmatch(r"[0-9]{1,3}", part) for part in parts):
        return None
    return [int(part) for part in parts]


def evaluate(snapshot, response, assistance):
    total = len(snapshot["trace"])
    values = parse_prediction(response["prediction"], total)
    if values is None:
        return {"outcome": "not_observed", "score": None, "reason": "No valid trace prediction was submitted."}
    if snapshot["policies"]["assessment"] != "trace-counts-v1":
        raise ValueError("Unsupported pinned assessment policy")
    rows = []
    for trace, actual in zip(snapshot["trace"], values):
        expected = trace_effects(trace)
        reason = (
            "The retry uses a new key, so it commits another charge."
            if trace["first"] != trace["retry"]
            else "The matching record has expired, so the retry commits another charge."
            if trace["elapsed_seconds"] >= trace["retention_seconds"]
            else "The matching key is retained, so the retry replays the stored result."
        )
        rows.append({"run": trace["label"], "actual": actual, "expected": expected, "correct": actual == expected, "reason": reason})
    count = sum(row["correct"] for row in rows)
    independence = "assisted" if assistance or response["aid_declaration"] == "external" else "unknown" if response["aid_declaration"] == "unknown" else "declared_independent"
    return {
        "outcome": "correct" if count == total else "incorrect" if count == 0 else "partially_correct",
        "score": count / total,
        "correct_count": count,
        "total_count": total,
        "rows": rows,
        "independence": independence,
        "criterion": "trace_counts",
        "reasoning": {"outcome": "not_observed", "score": None, "message": "Your diagnosis is retained for reflection. It has not been graded or reviewed by a human."},
        "mastery": "provisional",
        "scope": f"Exact predictions for {total} pinned trace{'s' if total != 1 else ''} only. Partial frame coverage; no mastery, skip or independent capability claim.",
        "validation": snapshot["validation"],
    }


def review_need(snapshot, result, as_of):
    days = 1 if result["independence"] != "declared_independent" or result["outcome"] != "correct" else 3
    return {
        "frame": snapshot["frame"],
        "competency": snapshot["competency"],
        "due_at": (datetime.fromisoformat(as_of) + timedelta(days=days)).isoformat(),
        "policy": snapshot["policies"]["retrieval"],
        "reason": "Try a fresh trace without help after a delay. One practice episode cannot establish durable understanding.",
        "content_status": "needs_fresh_activity",
        "activity_id": None,
    }
