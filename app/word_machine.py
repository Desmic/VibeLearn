"""Bounded, explicitly authored next-word toy. GameRules owns legal actions.

This is guided practice in context-conditioned generation, not a trained LLM.
No rendering result, delivery or reward establishes learner mastery.
"""
from copy import deepcopy
from uuid import NAMESPACE_URL, uuid5

from app.game_rules import GameRulesEngine, GameRulesError

MISSION_ID = "ai-01-context"
VERSION = "1"


def field(name):
    return {"field": name}


def eq(name, value):
    return {"op": "eq", "left": field(name), "right": value}


def both(*args):
    return {"op": "and", "args": list(args)}


def set_to(name, value):
    return {"op": "set", "field": name, "value": value}


CORRECT = {"op": "or", "args": [both(eq("round", 0), eq("clue", "garden")),
                                         both(eq("round", 1), eq("clue", "library"))]}
RULES = {
    "schemaVersion": "1", "id": "ai.context-generation-practice", "version": VERSION,
    "state": {
        "round": {"type": "integer", "min": 0, "max": 1, "initial": 0},
        "pieces": {"type": "integer", "min": 0, "max": 3, "initial": 0},
        "clue": {"type": "enum", "values": ["none", "garden", "library"], "initial": "none"},
        "status": {"type": "enum", "values": ["building", "wrong", "success"], "initial": "building"},
        "saw_wrong": {"type": "boolean", "initial": False},
    },
    "invariants": [],
    "actions": {
        "step": {
            "when": both(eq("status", "building"), {"op": "lt", "left": field("pieces"), "right": 3}),
            "effects": [{"op": "add", "field": "pieces", "value": 1}], "emits": ["piece-appended"],
        },
        "send": {
            "when": both(eq("status", "building"), eq("pieces", 3)),
            "branches": [
                {"when": CORRECT, "effects": [set_to("status", "success")], "emits": ["delivery-arrived"]},
                {"when": {"op": "not", "arg": CORRECT}, "effects": [set_to("status", "wrong"), set_to("saw_wrong", True)], "emits": ["delivery-missed"]},
            ],
        },
        "rewind": {
            "effects": [set_to("pieces", 0), set_to("status", "building")], "emits": ["generation-rewound"],
        },
        "next": {
            "when": both(eq("round", 0), eq("status", "success")),
            "effects": [set_to("round", 1), set_to("pieces", 0), set_to("clue", "none"), set_to("status", "building")],
            "emits": ["new-context-challenge"],
        },
    },
    "objectives": {"complete": {"when": both(eq("round", 1), eq("status", "success"))}},
}
for clue in ("garden", "library"):
    RULES["actions"]["add-" + clue] = {
        "when": {"op": "or", "args": [field("saw_wrong"), eq("round", 1)]},
        "effects": [set_to("clue", clue), set_to("pieces", 0), set_to("status", "building")],
        "emits": ["context-changed"],
    }

CASES = [
    {"person": "Mira", "parcel": "flower", "target": "Garden", "base": "Deliver Mira's flower.",
     "note": "Mira is waiting in the Garden.", "prior": [{"piece": "Library", "chance": 70}, {"piece": "Garden", "chance": 30}]},
    {"person": "Ivo", "parcel": "book", "target": "Library", "base": "Deliver Ivo's book.",
     "note": "Ivo left the Garden. He is now at the Library.", "prior": [{"piece": "Garden", "chance": 80}, {"piece": "Library", "chance": 20}]},
]


def identity(name):
    return str(uuid5(NAMESPACE_URL, "https://vibelearn.local/learning/" + name))


def build_content(template):
    item = deepcopy(template)
    item.update({
        "activity": {"id": identity("ai.context.practice"), "revision": 1},
        "family_id": identity("ai.context.practice.family"),
        "competency": {"id": identity("ai.autoregressive-generation"), "revision": 1, "name": "Reason about context-conditioned generation"},
        "frame": {"id": identity("ai.context-relevance"), "revision": 1, "name": "Predict how available context changes continuation", "coverage": "guided toy practice", "allowed_aids": ["visible context", "simulation feedback"]},
        "binding": {"id": identity("ai.context.binding"), "revision": 1, "criterion": "context_practice", "attribution_fraction": 1},
        "rubric": {"id": identity("ai.context.rubric"), "revision": 1, "criteria": [{"id": "context_practice", "name": "Complete context experiments", "method": "deterministic action replay", "coverage": "Guided practice only; no mastery or independent-transfer claim."}]},
        "title": "The Missing Message", "intro": "Help a little delivery robot get two parcels to the right people.",
        "assumptions": "An authored whole-word toy chooses its highest-scored next piece. It is not a trained LLM.",
        "trace": [], "prompt": "Give the machine the context it needs. Watch each piece join the next input.",
        "hints": ["The machine can only use the words in its input tray.", "Compare where the recipient is now with the clue you supplied."],
        "source": {"id": identity("ai.context.source"), "revision": 1, "title": "Mechanics of Next Token Prediction with Transformers", "publisher": "Google Research", "url": "https://research.google/pubs/mechanics-of-next-token-prediction-with-transformers/", "access": "Primary research reference; toy probabilities are authored illustrations.", "summary": "Autoregressive generation conditions each next-token prediction on the available sequence. This activity is a simplified illustration, not that research model."},
        "policies": {"assessment": "word-machine-v1", "retrieval": "practice-followup-v1", "reward": "first-family-practice-v1", "assistance": "explicit-aids-v1"},
        "validation": {"status": "prototype", "scope": "Two authored context experiments", "basis": "Deterministic rules and storage checks; no human educational validation."},
        "mission": {"id": MISSION_ID, "number": 1, "difficulty": "Explore", "available_modes": ["LEARN"], "requires_diagnosis": False, "source_enabled": True, "objective": "Get the message to the right person", "plain_objective": "Help the robot find its friends."},
        "word_machine": {"version": VERSION, "rules": deepcopy(RULES), "cases": deepcopy(CASES)},
    })
    return item


def empty():
    return {"moves": []}


def validate(value):
    if not isinstance(value, dict) or set(value) != {"moves"}:
        raise ValueError("This activity needs a semantic action log.")
    moves = value["moves"]
    from app.first_words import RULES as RESCUE_RULES, RULES_V2, RULES_V3, RULES_V4
    allowed = set(RULES['actions']) | set(RESCUE_RULES['actions']) | set(RULES_V2['actions']) | set(RULES_V3['actions']) | set(RULES_V4['actions'])
    if not isinstance(moves, list) or len(moves) > 240 or any(not isinstance(m, str) or m not in allowed for m in moves):
        raise ValueError("The action log is invalid or full.")


def replay(snapshot, value=None):
    value = empty() if value is None else value
    validate(value)
    config = snapshot["word_machine"]
    if config['version'] in ('first-words-1', 'first-words-2', 'first-words-3', 'first-words-4'):
        from app.first_words import replay as replay_rescue
        return replay_rescue(snapshot, value)
    if config["version"] != VERSION:
        raise ValueError("Unsupported pinned word-machine version")
    engine = GameRulesEngine(config["rules"])
    result = engine.replay(value["moves"])
    state = result.state
    case = config["cases"][state["round"]]
    candidates = deepcopy(case["prior"]) if state["clue"] == "none" else [
        {"piece": state["clue"].title(), "chance": 90},
        {"piece": "Library" if state["clue"] == "garden" else "Garden", "chance": 10},
    ]
    destination = candidates[0]["piece"]
    output = ["Go", "to", destination][:state["pieces"]]
    clue = "" if state["clue"] == "none" else f"{case['person']} is at the {state['clue'].title()}."
    legal = []
    for action in config["rules"]["actions"]:
        try:
            engine.apply(state, action)
            legal.append(action)
        except GameRulesError:
            pass
    if state["pieces"] < 2:
        candidates = [{"piece": ["Go", "to"][state["pieces"]], "chance": 100}]
    if state["pieces"] == 3:
        candidates = [{"piece": "End", "chance": 100}]
    return {**state, "case": case, "context": ([case["base"], clue] if clue else [case["base"]]) + output,
            "output": output, "candidates": candidates, "destination": destination,
            "available_actions": legal, "complete": result.objectives["complete"],
            "events": list(result.events[-1:]), "moves": len(value["moves"]),
            "model_label": "Illustrative whole-word toy · highest score chosen"}


def evaluate(snapshot, response, independence):
    state = replay(snapshot, response.get("word_machine"))
    complete = state["complete"]
    return {"outcome": "correct" if complete else "not_observed", "score": 1 if complete else None,
            "correct_count": int(complete), "total_count": 1, "criterion": "context_practice",
            "rows": [{"run": "Two context experiments", "actual": "complete" if complete else "unfinished", "expected": "complete", "correct": complete, "reason": "The saved action log completes two guided context experiments."}],
            "independence": independence, "mastery": "unknown",
            "reasoning": {"outcome": "not_observed", "score": None, "message": "No independent explanation or delayed recall has been assessed."},
            "scope": "Guided toy practice only. Game success does not establish understanding of a real LLM or independent transfer.",
            "validation": snapshot["validation"]}
