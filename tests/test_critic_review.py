"""Adversarial checks of review consistency, not evidence of game quality."""
import copy
import tempfile
import unittest
from pathlib import Path

from tools.check_critic_review import COVERAGE, GATES, evaluate


class CriticReviewTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / "fixture.txt").write_text("Synthetic validator fixture; not real play evidence.")
        self.sha = "a" * 40
        self.record = {
            "schema_version": 1, "candidate_sha": self.sha,
            "method": "internal_tool_assisted", "environment": "Synthetic fixture",
            "limitations": "No game was reviewed", "prior_context": "Test author",
            "user_authority": "Current user is sole human product critic",
            "technical_status": "passed", "technical_evidence": ["fixture.txt"],
            "criteria": {c: {"rating": 9, "reason": "Fixture only",
                             "evidence": ["fixture.txt"], "counterexample_attempt": "Fixture only"}
                         for group in GATES.values() for c in group},
            "coverage": {c: {"status": "observed", "note": "Fixture only", "evidence": ["fixture.txt"]}
                         for c in COVERAGE}, "blockers": [],
        }

    def check(self, record=None):
        return evaluate(self.record if record is None else record, self.sha, self.root)

    def test_ready_is_never_user_acceptance(self):
        result = self.check()
        self.assertEqual(result["status"], "ready_for_user_review")
        self.assertEqual(result["user_acceptance"], "not_determined_by_tool")

    def test_beauty_cannot_average_away_bad_clarity(self):
        for item in self.record["criteria"].values():
            item["rating"] = 10
        self.record["criteria"]["world_role_stakes"]["rating"] = 3
        result = self.check()
        self.assertEqual(result["status"], "needs_revision")
        self.assertEqual(result["gate_minimums"]["rendered_story"], 3)

    def test_blocker_overrides_perfect_scores(self):
        self.record["blockers"] = [{"finding": "Controls remain disabled after save",
                                    "retest": "Use controls after save", "evidence": ["fixture.txt"]}]
        self.assertEqual(self.check()["status"], "needs_revision")

    def test_unknown_is_incomplete_not_zero(self):
        self.record["criteria"]["fresh_transfer"]["rating"] = None
        result = self.check()
        self.assertEqual(result["status"], "review_incomplete")
        self.assertIsNone(result["gate_minimums"]["learning"])

    def test_missing_coverage_and_technical_checks_cannot_pass(self):
        for edit in (lambda r: r["coverage"]["reduced_motion"].update(status="not_checked"),
                     lambda r: r.update(technical_status="not_checked")):
            record = copy.deepcopy(self.record)
            edit(record)
            self.assertEqual(self.check(record)["status"], "review_incomplete")

    def test_stale_revision_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "different candidate"):
            evaluate(self.record, "b" * 40, self.root)

    def test_missing_and_external_evidence_are_rejected(self):
        for ref in ("missing.png", "../outside.txt"):
            self.record["criteria"]["controls"]["evidence"] = [ref]
            with self.assertRaisesRegex(ValueError, "Missing or external"):
                self.check()

    def test_fractional_or_boolean_score_is_rejected(self):
        for rating in (9.059, True, -1, 11):
            self.record["criteria"]["controls"]["rating"] = rating
            with self.assertRaisesRegex(ValueError, "integer"):
                self.check()

    def test_high_score_requires_counterexample(self):
        del self.record["criteria"]["controls"]["counterexample_attempt"]
        with self.assertRaisesRegex(ValueError, "counterexample"):
            self.check()

    def test_acceptance_cannot_be_forged_in_internal_record(self):
        self.record["user_accepted"] = True
        with self.assertRaisesRegex(ValueError, "User acceptance"):
            self.check()
