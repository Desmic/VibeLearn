"""A bounded, replayable teaching game. No code execution, randomness or learner I/O.

World truth and the courier's knowledge are deliberately separate. A durable order
register is an explicit extra scenario service; it is not an infinite retry cache.
The old trace campaign and all previously pinned snapshots remain unchanged.
"""
from copy import deepcopy
from uuid import NAMESPACE_URL, uuid5

VERSION = "expedition-v1"
MAX_MOVES = 80
POLICY_OPTIONS = {
    "identity": {"remember": "Keep the order's ticket", "replace": "New courier, new ticket"},
    "payload": {"reject": "Stop if the order changes", "overwrite": "Reuse the ticket for anything"},
    "expiry": {"check": "Check the order register", "repeat": "Keep retrying forever"},
    "unknown": {"pause": "Pause and ask for help", "repeat": "Send another order"},
}
ACTIONS = {"send", "retry", "restart", "restore", "new_ticket", "wait", "inspect", "collect", "rewind", "test"}
TITLES = ["A message in the storm", "Pip loses the ticket", "When the workshop forgets", "The storm engine", "Detour: the order that never arrived"]
GOALS = [
    "Help Pip collect one bridge gear, not two.",
    "Recover Pip's original ticket after a restart.",
    "Find the gear after the workshop's memory expires.",
    "Build a courier rule that survives every storm test.",
    "A shorter memory. A missing order. Get the gear safely.",
]
INTROS = [
    "Pip needs one gear to mend the bridge. Send the order across the valley.",
    "Pip's battery is flickering. The expedition journal survives even when the courier restarts.",
    "The storm lasts longer than the workshop remembers tickets. Its separate order register can still tell us what happened.",
    "Pip needs rules, not lucky guesses. Fit four rules into the storm engine, then watch them run.",
    "This workshop remembers tickets for only 2 hours. This time the storm may swallow the order itself, not just the reply.",
]
LESSONS = [
    "A lost reply does not mean the order failed. Reusing a retained ticket repeats the result, not the work. Engineers call this idempotent retry behavior.",
    "Keep one durable ticket per business intent, not per courier process. A restart changes the worker, not the order you wanted.",
    "Idempotency has a retention boundary. Once it expires, reconcile against an authoritative order record. Changed order details must not reuse the old intent's ticket. An unavailable record means uncertainty, not failure.",
    "Your policy was executed against specific disruptions. Stable intent, payload binding, bounded retention and explicit uncertainty handling work together. Passing these cases is practice, not proof of general mastery.",
    "In this detour, the authoritative register proves the order absent and no old request is in flight. That permits a new attempt. Without that guarantee, absence of a reply alone would not justify resending.",
]


def make_campaign(template):
    result = []
    for index in range(5):
        number = index + 1
        item = deepcopy(template)
        key = f"vibelearn:{VERSION}:mission:{number}"
        for field in ("activity", "frame", "binding", "rubric"):
            item[field]["id"] = str(uuid5(NAMESPACE_URL, key + ":" + field))
            item[field]["revision"] = 1
        item["family_id"] = str(uuid5(NAMESPACE_URL, key + ":family"))
        item["schema_version"] = 2
        item["title"], item["intro"] = TITLES[index], INTROS[index]
        item["frame"].update(name=GOALS[index], coverage="guided simulation practice")
        item["binding"]["criterion"] = "expedition_execution"
        item["rubric"]["criteria"] = [{"id": "expedition_execution", "name": "Execute a safe delivery or policy", "method": VERSION, "coverage": "Pinned simulation only; interactive feedback is recorded as assistance. No general mastery inference."}]
        item["trace"] = []
        item["prompt"] = GOALS[index]
        item["policies"]["assessment"] = VERSION
        item["validation"] = {"status": "criterion_checked", "scope": "Bounded simulated delivery and policy cases", "basis": "Executable original teaching model; not independently content-reviewed or educationally validated."}
        item["assumptions"] = "The workshop atomically makes one gear and remembers a ticket/result for 24 hours (2 hours in the detour). Matching retained tickets replay the result; changed details are rejected. An expired ticket alone cannot prevent another gear. A separate durable order register reports committed, authoritative absent with no in-flight request, or unavailable. Rewind resets this simulation only, never real purchases or saved evidence."
        item["hints"] = [LESSONS[index]]
        item["mission"] = {"id": f"expedition-{number:02d}", "number": number, "difficulty": ["Tutorial", "Easy", "Medium", "Boss", "Remix"][index], "boss": number == 4, "objective": GOALS[index], "plain_objective": GOALS[index], "requires_diagnosis": False, "available_modes": ["LEARN"], "source_enabled": number >= 3, "hint_count": 1, "reward_xp": 10}
        item["expedition"] = {"version": VERSION, "level": number, "retention_hours": 2 if number == 5 else 24, "first_arrives": number != 5, "lesson": LESSONS[index], "policy_options": deepcopy(POLICY_OPTIONS) if number == 4 else {}}
        result.append(item)
    return result


def validate_game(game):
    if not isinstance(game, dict) or set(game) != {"moves", "policy"}:
        raise ValueError("The saved expedition has an invalid structure.")
    moves, policy = game["moves"], game["policy"]
    if not isinstance(moves, list) or len(moves) > MAX_MOVES:
        raise ValueError("This run is full. Save a result and begin another run.")
    if not isinstance(policy, dict) or set(policy) - set(POLICY_OPTIONS):
        raise ValueError("Choose the expedition's four known rules.")
    for key, value in policy.items():
        if not isinstance(value, str) or value not in POLICY_OPTIONS[key]:
            raise ValueError("Choose a known rule option.")
    for move in moves:
        if isinstance(move, str):
            if move not in ACTIONS - {"test"}:
                raise ValueError("Unknown expedition move.")
        elif isinstance(move, dict) and set(move) == {"action", "policy"} and move["action"] == "test":
            validate_game({"moves": [], "policy": move["policy"]})
        else:
            raise ValueError("Invalid expedition move.")
    return game


def empty_game():
    return {"moves": [], "policy": {}}


def policy_cases(policy):
    """Execute decisions against counterexamples, including safety AND liveness.

    Each fixture pins server truth and available observations. Unknown is never
    treated as an absent order; authoritative absence requires no in-flight call.
    """
    cases = [
        ("Restart, same order", True, 0.1, False, "committed"),
        ("At the 24-hour boundary", True, 24, False, "committed"),
        ("Two-day storm", True, 48, False, "committed"),
        ("Different gear, same ticket", True, 0.1, True, "committed"),
        ("Order never arrived", False, 48, False, "absent"),
        ("Register is unreachable", True, 48, False, "unavailable"),
        ("Unreachable and no gear yet", False, 48, False, "unavailable"),
    ]
    rows = []
    complete = set(policy) == set(POLICY_OPTIONS)
    for title, committed, elapsed, changed, register in cases:
        gears = int(committed)
        status, explanation = "unknown", "Fit all four rules first."
        if complete:
            if changed and policy["payload"] == "reject":
                status, explanation = "rejected", "Different order details: keep the old intent intact; request a new authorized intent instead."
            elif elapsed >= 24 and policy["expiry"] == "check":
                if register == "committed":
                    status, explanation = "confirmed", "The durable order register locates the existing gear. No second order."
                elif register == "absent":
                    gears += 1
                    status, explanation = "confirmed", "The register proves no effect and no in-flight request. One new attempt delivers the gear."
                elif policy["unknown"] == "pause":
                    status, explanation = "paused", "Unknown stays unknown. Pause and escalate; do not manufacture certainty."
                else:
                    gears += 1
                    status, explanation = "unverified_retry", "An unavailable register is not proof of failure. Another order risks duplication."
            else:
                retained = committed and elapsed < 24 and policy["identity"] == "remember"
                if changed and retained:
                    status, explanation = "payload_conflict", "The workshop rejects conflicting details, but the courier policy keeps attempting an invalid request."
                else:
                    gears += int(not retained)
                    status = "confirmed"
                    explanation = "The original ticket replays the retained result." if retained else "No matching retained ticket: the workshop makes another gear."
            if changed:
                passed = status == "rejected" and gears == 1
            elif register == "unavailable":
                passed = status == "paused" and gears == int(committed)
            else:
                passed = status == "confirmed" and gears == 1
        else:
            passed = False
        rows.append({"run": title, "actual": f"{gears} gear(s), {status}", "expected": "reject changed intent" if changed else "pause with uncertainty intact" if register == "unavailable" else "one confirmed gear", "correct": passed, "reason": explanation})
    return rows


def replay(snapshot, game=None):
    config = snapshot["expedition"]
    if config["version"] != VERSION:
        raise ValueError("Unsupported pinned expedition version.")
    game = validate_game(game or empty_game())
    level = config["level"]
    if level == 4:
        if any(not isinstance(move, dict) for move in game["moves"]):
            raise ValueError("The storm engine accepts rule tests, not delivery moves.")
        latest = game["moves"][-1] if game["moves"] else None
        rows = policy_cases(latest["policy"]) if latest else []
        tested = bool(latest and latest["policy"] == game["policy"])
        return {"level": level, "parts": 1 if rows and all(row["correct"] for row in rows) else 0, "known": "policy", "ticket": "order-01", "hours": 0, "retention": 24, "rows": rows, "complete": bool(tested and rows and all(row["correct"] for row in rows)), "tested": tested, "moves": len(game["moves"]), "rewinds": 0, "feedback": "The engine found a safe route through every pinned disruption." if tested and all(row["correct"] for row in rows) else "Watch the gears and the courier's knowledge in each test. Change a rule, then test again." if latest else "Build Pip's storm rules. Safety means no duplicates; it also means delivering when the outcome is known.", "available": ["test"], "sent": bool(latest), "restarted": False, "inspected": False}

    def initial():
        return {"level": level, "parts": 0, "known": "not_sent", "ticket": "order-01", "hours": 0, "retention": config["retention_hours"], "rows": [], "complete": False, "sent": False, "restarted": False, "inspected": False, "feedback": INTROS[level - 1]}

    state, rewinds, trail = initial(), 0, []
    for move in game["moves"]:
        available = available_actions(state)
        if not isinstance(move, str) or move not in available:
            raise ValueError("That move is not available in this expedition state.")
        if move == "rewind":
            state = initial()
            rewinds += 1
            state["feedback"] = "A fresh rehearsal. Earlier moves and feedback stay in this run's history."
        elif move == "send":
            state.update(sent=True, parts=int(config["first_arrives"]), known="unknown")
            state["feedback"] = "The workshop made a gear, but the storm swallowed its reply. Pip does not know it worked. Try the same ticket again." if level == 1 else "No reply reaches Pip. Look at the workshop and the courier separately: what happened is not the same as what Pip knows."
        elif move == "restart":
            state.update(ticket="worker-02", restarted=True)
            state["feedback"] = "Pip rebooted with a new ticket. The expedition journal still holds order-01. Which ticket means the original order?"
        elif move == "restore":
            state["ticket"] = "order-01"
            state["feedback"] = "Original ticket recovered from the journal. A new courier is not a new order."
        elif move == "new_ticket":
            state["ticket"] = "worker-02"
            state["feedback"] = "A different ticket. The workshop will treat this as another order."
        elif move == "wait":
            state["hours"] = state["retention"] + 1
            state["known"] = "unknown"
            state["feedback"] = "The retry memory is now empty. The order register is a different record. Check it before risking another gear."
        elif move == "inspect":
            state["inspected"] = True
            state["known"] = "confirmed" if state["parts"] else "absent"
            state["feedback"] = "The durable order register confirms the gear exists. Collect it; do not order again. Also: one ticket must keep the same gear details. If those change, stop and resolve the new intent." if state["parts"] else "The register proves no gear was made and no old request is in flight. Now one new attempt is safe."
        elif move == "retry":
            retained = state["parts"] > 0 and state["ticket"] == "order-01" and state["hours"] < state["retention"]
            state["parts"] += int(not retained)
            state["known"] = "confirmed"
            state["feedback"] = "Same remembered ticket: the workshop sends its old receipt. One gear, not two!" if retained else "One gear made. This retry was authorized by the absent-order check." if state["parts"] == 1 and state["inspected"] else "Two gears! A new or forgotten ticket was accepted as another order. Rewind the rehearsal and try a safer route."
        elif move == "collect":
            state["complete"] = True
            state["feedback"] = ["Pip: One gear! The first bridge hinge is fixed. I knew you would figure out the storm.", "Pip: My memory blinked, but our order did not change. The second hinge is safe.", "Pip: You found the gear without ordering twice. Now let's teach my storm engine.", "", "Pip: This time the order was missing, not the reply. You checked instead of guessing. The lookout lift is running!"][level - 1]
        trail.append({"action": move, "parts": state["parts"], "known": state["known"], "ticket": state["ticket"], "hours": state["hours"]})
    state.update(available=available_actions(state), moves=len(game["moves"]), rewinds=rewinds, trail=trail)
    return state


def available_actions(state):
    if state["complete"]:
        return ["rewind"]
    if not state["sent"]:
        return ["send"]
    level = state["level"]
    if state["parts"] > 1:
        return ["rewind"]
    result = ["rewind"]
    # Each mechanic is performed, not skipped by guessing the final state.
    if level == 2 and not state["restarted"]:
        return result + ["restart"]
    if level in (3, 5) and state["hours"] < state["retention"]:
        return result + ["wait"]
    if level >= 2:
        result += ["restore"] if state["ticket"] != "order-01" else ["new_ticket"]
    if level in (3, 5):
        result += ["inspect"]
    if state["known"] in ("unknown", "absent"):
        # Detour's absent order must be reconciled, not accidentally guessed.
        if level != 5 or state["inspected"]:
            result += ["retry"]
    if state["known"] == "confirmed" and state["parts"] == 1:
        result += ["collect"]
    return result


def evaluate_game(snapshot, response, independence):
    state = replay(snapshot, response.get("game"))
    if not state["moves"]:
        return {"outcome": "not_observed", "score": None, "independence": independence, "mastery": "unknown", "rows": [], "reason": "No expedition action was observed."}
    if state["level"] == 4:
        rows = state["rows"]
        total = 7
        correct = sum(row["correct"] for row in rows) if state["tested"] else 0
    else:
        total, correct = 1, int(state["complete"])
        rows = [{"run": snapshot["title"], "actual": f'{state["parts"]} gear(s), {state["known"]}', "expected": "one confirmed collected gear", "correct": state["complete"], "reason": state["feedback"]}]
    return {"outcome": "correct" if state["complete"] else "partially_correct" if correct else "incorrect", "score": correct / total, "correct_count": correct, "total_count": total, "rows": rows, "independence": independence, "criterion": "expedition_execution", "reasoning": {"outcome": "not_observed", "score": None, "message": "The bounded simulation was checked. Free prose and general design ability were not graded."}, "mastery": "provisional", "scope": "Guided, feedback-exposed simulation practice on pinned cases only. No fresh-independent, real-world safety or general mastery claim.", "validation": snapshot["validation"]}
