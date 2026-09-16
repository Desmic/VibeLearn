import unittest

from app.game_rules import GameRulesEngine, GameRulesError, InvalidAction


def field(name):
    return {"field": name}


def op(name, left, right):
    return {"op": name, "left": left, "right": right}


def both(*args):
    return {"op": "and", "args": list(args)}


FORGE_RULES = {
    "schemaVersion": "1",
    "id": "proof.retry-safe-forge",
    "version": "1",
    "state": {
        "ticket": {"type": "enum", "values": ["order-01", "fresh"], "initial": "order-01"},
        "forgeEffects": {"type": "integer", "initial": 1, "min": 0, "max": 2},
        "lookedAtForge": {"type": "boolean", "initial": False},
        "lookedAtTicket": {"type": "boolean", "initial": False},
        "sent": {"type": "boolean", "initial": False},
        "failed": {"type": "boolean", "initial": False},
    },
    "invariants": [
        {"id": "effect-count-safe", "expression": op("gte", field("forgeEffects"), 0)},
    ],
    "actions": {
        "inspect-forge": {
            "effects": [{"op": "set", "field": "lookedAtForge", "value": True}],
            "emits": ["forge-inspected"],
        },
        "inspect-ticket": {
            "when": field("lookedAtForge"),
            "effects": [{"op": "set", "field": "lookedAtTicket", "value": True}],
            "emits": ["ticket-inspected"],
        },
        "issue-fresh-ticket": {
            "when": both(field("lookedAtTicket"), {"op": "not", "arg": field("failed")}),
            "effects": [{"op": "set", "field": "ticket", "value": "fresh"}],
            "emits": ["identity-changed"],
        },
        "retry": {
            "when": both(field("lookedAtTicket"), {"op": "not", "arg": field("failed")}),
            "branches": [
                {
                    "when": op("eq", field("ticket"), "order-01"),
                    "effects": [{"op": "set", "field": "sent", "value": True}],
                    "emits": ["safe-retry"],
                },
                {
                    "when": op("eq", field("ticket"), "fresh"),
                    "effects": [
                        {"op": "add", "field": "forgeEffects", "value": 1},
                        {"op": "set", "field": "sent", "value": True},
                        {"op": "set", "field": "failed", "value": True},
                    ],
                    "emits": ["duplicate-created"],
                },
            ],
        },
    },
    "objectives": {
        "clear": {
            "when": both(
                field("sent"),
                {"op": "not", "arg": field("failed")},
                op("eq", field("forgeEffects"), 1),
            )
        }
    },
}


ORCHARD_RULES = {
    "schemaVersion": "1",
    "id": "proof.star-orchard-resource-loop",
    "version": "1",
    "state": {
        "energy": {"type": "integer", "initial": 2, "min": 0, "max": 2},
        "fruit": {"type": "integer", "initial": 0, "min": 0, "max": 3},
    },
    "invariants": [
        {"id": "basket-capacity", "expression": op("lte", field("fruit"), 3)},
    ],
    "actions": {
        "harvest": {
            "when": both(op("gt", field("energy"), 0), op("lt", field("fruit"), 3)),
            "effects": [
                {"op": "add", "field": "energy", "value": -1},
                {"op": "add", "field": "fruit", "value": 1},
            ],
            "emits": ["fruit-harvested"],
        },
        "rest": {
            "when": op("lt", field("energy"), 2),
            "effects": [{"op": "set", "field": "energy", "value": 2}],
            "emits": ["energy-restored"],
        },
    },
    "objectives": {"basket-full": {"when": op("eq", field("fruit"), 3)}},
}


class GameRulesTests(unittest.TestCase):
    def test_safe_retry_and_duplicate_use_same_renderer_free_interpreter(self):
        engine = GameRulesEngine(FORGE_RULES)
        safe = engine.replay(["inspect-forge", "inspect-ticket", "retry"])
        self.assertEqual(safe.state["forgeEffects"], 1)
        self.assertFalse(safe.state["failed"])
        self.assertTrue(safe.objectives["clear"])
        self.assertEqual([event["id"] for event in safe.events],
                         ["forge-inspected", "ticket-inspected", "safe-retry"])

        duplicate = engine.replay(["inspect-forge", "inspect-ticket", "issue-fresh-ticket", "retry"])
        self.assertEqual(duplicate.state["forgeEffects"], 2)
        self.assertTrue(duplicate.state["failed"])
        self.assertFalse(duplicate.objectives["clear"])
        self.assertEqual(duplicate.events[-1]["id"], "duplicate-created")

    def test_invalid_action_fails_closed_without_mutating_input(self):
        engine = GameRulesEngine(FORGE_RULES)
        state = engine.initial_state()
        before = dict(state)
        with self.assertRaises(InvalidAction):
            engine.apply(state, "inspect-ticket")
        self.assertEqual(state, before)
        with self.assertRaises(InvalidAction):
            engine.apply(state, "made-up-engine-callback")
        self.assertEqual(state, before)

    def test_replay_is_deterministic_and_serializable(self):
        engine = GameRulesEngine(FORGE_RULES)
        actions = ["inspect-forge", "inspect-ticket", "retry"]
        first = engine.replay(actions)
        second = engine.replay(actions)
        self.assertEqual(first, second)
        self.assertEqual(set(first.state), set(FORGE_RULES["state"]))
        self.assertTrue(all(set(event) == {"id", "action"} for event in first.events))

    def test_materially_different_resource_loop_uses_same_interpreter(self):
        engine = GameRulesEngine(ORCHARD_RULES)
        result = engine.replay(["harvest", "harvest", "rest", "harvest"])
        self.assertEqual(result.state, {"energy": 1, "fruit": 3})
        self.assertTrue(result.objectives["basket-full"])
        self.assertEqual([event["id"] for event in result.events].count("fruit-harvested"), 3)
        with self.assertRaises(InvalidAction):
            engine.apply(result.state, "harvest")

    def test_candidate_state_bounds_are_checked_before_commit(self):
        spec = {
            "schemaVersion": "1",
            "id": "proof.boundary",
            "version": "1",
            "state": {"value": {"type": "integer", "initial": 1, "min": 0, "max": 1}},
            "actions": {"overflow": {"effects": [{"op": "add", "field": "value", "value": 1}]}},
        }
        engine = GameRulesEngine(spec)
        state = engine.initial_state()
        with self.assertRaises(GameRulesError):
            engine.apply(state, "overflow")
        self.assertEqual(state, {"value": 1})

    def test_unknown_fields_and_expression_ops_are_rejected_at_compile_time(self):
        unknown_field = {
            "schemaVersion": "1",
            "id": "proof.bad-field",
            "version": "1",
            "state": {"ready": {"type": "boolean", "initial": False}},
            "actions": {"go": {"effects": [{"op": "set", "field": "missing", "value": True}]}},
        }
        with self.assertRaises(GameRulesError):
            GameRulesEngine(unknown_field)

        arbitrary_call = {
            "schemaVersion": "1",
            "id": "proof.no-eval",
            "version": "1",
            "state": {"ready": {"type": "boolean", "initial": False}},
            "actions": {"go": {"when": {"op": "call", "args": ["danger"]}, "effects": []}},
        }
        with self.assertRaises(GameRulesError):
            GameRulesEngine(arbitrary_call)


if __name__ == "__main__":
    unittest.main()
