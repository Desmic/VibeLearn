"""Bellweather's puzzle rules run on the server's GameRulesSpec interpreter.

The browser plays the same JSON (exported by experiments/bellweather-arcade/
tools/export-rules.mjs); tools/rules-parity.mjs checks both engines agree on
random play. These tests pin the learning-critical paths on the server side.
"""
import json
import unittest
from pathlib import Path

from app.game_rules import GameRulesEngine, InvalidAction

RULES = Path(__file__).resolve().parents[1] / "experiments" / "bellweather-arcade" / "rules"


def engine(rules_id):
    return GameRulesEngine(json.loads((RULES / f"{rules_id}.json").read_text(encoding="utf-8")))


def judged(transition):
    return [e["id"] for e in transition.events if e["id"].startswith("decide:")]


class BellweatherRulesTests(unittest.TestCase):
    def test_all_rule_files_load(self):
        files = sorted(RULES.glob("*.json"))
        self.assertGreaterEqual(len(files), 4)
        for path in files:
            GameRulesEngine(json.loads(path.read_text(encoding="utf-8")))

    def test_skiff_whole_sentence_wakes_it_and_a_wrong_feed_resets_picks(self):
        e = engine("first-words.wake-skiff")
        t = e.replay(["place", "catch", "catch", "pick.2", "feed"])
        self.assertEqual(judged(t), ["decide:next-input:wrong:newest-only"])
        self.assertFalse(t.state["pick2"])
        t = e.replay(["place", "catch", "catch", "pick.0", "pick.1", "pick.2", "feed", "catch", "loop-done"])
        self.assertTrue(t.objectives["awake"])
        self.assertTrue(t.objectives["no-miss"])

    def test_gate_opens_only_where_the_notes_point(self):
        e = engine("first-words.blossom-gate")
        decoy = e.replay(["take-satchel", "take.mira", "take.warden", "speak", "predict.unclear", "support.route", "run"])
        self.assertEqual(decoy.state["phase"], "bag")
        self.assertIn("decide:destination-prediction:right:unclear", judged(decoy))
        self.assertIn("decide:context-selection:wrong", judged(decoy))
        opened = e.replay(["take-satchel", "take.mira", "speak", "predict.lotus", "support.route", "run"])
        self.assertTrue(opened.objectives["open"])

    def test_gate_refuses_notes_before_the_satchel(self):
        e = engine("first-words.blossom-gate")
        with self.assertRaises(InvalidAction):
            e.apply(e.initial_state(), "take.mira")

    def test_relay_needs_mira_channel_then_the_whole_message(self):
        e = engine("first-words.relay-contact")
        t = e.replay(["tune.3", "call", "tune.7", "call", "word.0", "word.1", "word.2", "send"])
        self.assertEqual(judged(t), ["decide:context-selection:wrong", "decide:context-selection:right", "decide:next-input:right:all"])
        self.assertTrue(t.objectives["reached"])

    def test_loom_short_call_overflows_and_common_words_fit(self):
        e = engine("loom.word-loom")
        t = e.replay(["lift", "lift", "lift", "predict.words", "choose.short", "choose.common"])
        self.assertEqual(judged(t), [
            "decide:predict-pieces:wrong:one-per-word",
            "decide:choose-message:wrong:fewer-letters",
            "decide:choose-message:right:common-words",
        ])
        self.assertTrue(t.objectives["free"])
        with self.assertRaises(InvalidAction):
            e.replay(["lift", "predict.pieces"])


if __name__ == "__main__":
    unittest.main()
