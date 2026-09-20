"""Offline critic-task recommendations, not dispatch or proof of GUI execution.

The harness/reviewer supplies audited checkpoints and capability status. Model
self-report must never populate those trusted fields. No live model, session,
budget allocator or Terminal PM implementation is introduced here.
"""
from dataclasses import dataclass


LUNA = "gpt-5.6-luna"
ASTRA = "gpt-6-astra"
TASKS = {"bounded_play", "checkpoint", "evidence_triage", "creative_direction"}
SIGNALS = {"clear", "uncertain", "blocked", "defect"}


@dataclass(frozen=True)
class Recommendation:
    action: str
    model: str | None
    reason: str


def recommend_review(
    task: str,
    *,
    capabilities_ready: bool,
    signal: str | None = None,
    reviewer_model: str | None = None,
    required_checkpoints: frozenset[str] = frozenset(),
    verified_checkpoints: frozenset[str] = frozenset(),
    evidence_conflict: bool = False,
    independent_audit_passed: bool = False,
) -> Recommendation:
    """Recommend the next bounded review step; never grant release acceptance.

    Checkpoint verification/audit are external inputs, not inferred from a
    confident 'clear' signal. Unknown capabilities must be represented as False.
    Recommendations need a separately authorized budget before execution.
    """
    if task not in TASKS or (signal is not None and signal not in SIGNALS):
        raise ValueError("unknown task or signal")
    for value in (capabilities_ready, evidence_conflict, independent_audit_passed):
        if type(value) is not bool:
            raise ValueError("capability and audit flags must be explicit booleans")
    for points in (required_checkpoints, verified_checkpoints):
        if not isinstance(points, (set, frozenset)) or not all(
            isinstance(point, str) and point.strip() for point in points
        ):
            raise ValueError("checkpoints must be sets of non-empty identifiers")
    if signal is not None and reviewer_model not in {LUNA, ASTRA}:
        raise ValueError("completed review needs a supported reviewer model")
    if not capabilities_ready:
        return Recommendation("repair_environment", None, "Required execution/observation capability is unavailable or unverified.")
    if signal is None:
        return Recommendation("assign", ASTRA, "Astra is the primary critic for every task; evidence and independent audit remain required.")
    if task == "creative_direction" and reviewer_model != ASTRA:
        return Recommendation("review_with_astra", ASTRA, "Luna observations do not replace the creative-direction critic.")
    if evidence_conflict or signal in {"uncertain", "blocked"}:
        if reviewer_model == ASTRA:
            return Recommendation("unresolved", None, "Astra still lacks a supported conclusion; do not escalate in a loop.")
        return Recommendation("review_with_astra", ASTRA, "Investigate the unresolved question with its evidence and uncertainty.")
    if signal == "defect" and independent_audit_passed:
        return Recommendation("repair_game", None, "Audited defect evidence calls for repair, not model escalation to obtain a pass.")
    missing = required_checkpoints - verified_checkpoints
    if not required_checkpoints or missing or not independent_audit_passed or signal == "defect":
        return Recommendation("audit_evidence", None, "Self-reported confidence cannot replace checkpoint coverage and independent evidence audit.")
    return Recommendation("record_scoped_result", None, "Audited task result only; no creative, learning-mastery or release acceptance is implied.")
