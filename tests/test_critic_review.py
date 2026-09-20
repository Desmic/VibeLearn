"""Adversarial checks of review consistency, not evidence of game quality."""
import copy
import tempfile
import unittest
from pathlib import Path

from tools.check_critic_review import COVERAGE, GATES, V2_GATES, CRITERION_MODALITIES, evaluate


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


    def v2_record(self):
        files = {
            "cold_observer_report": "cold.json",
            "interactive_trace": "interactive.json",
            "motion_video": "motion.webm",
            "caption_blind_motion": "caption-blind.webm",
            "audio_listening": "audio.txt",
            "screenshot": "screen.png",
            "runtime_trace": "runtime.json",
            "authoritative_replay": "replay.json",
            "ci_report": "ci.json",
            "source_inspection": "source.txt",
        }
        for modality, name in files.items():
            (self.root / name).write_text(f"{modality} fixture", encoding="utf-8")

        def ev(modality):
            return {"ref": files[modality], "modality": modality, "candidate_sha": self.sha}

        criteria = {}
        for name in {criterion for group in V2_GATES.values() for criterion in group}:
            evidence = []
            for alternatives in CRITERION_MODALITIES.get(name, ()):
                evidence.append(ev(alternatives[0]))
            if not evidence:
                evidence = [ev("source_inspection")]
            criteria[name] = {
                "rating": 9,
                "reason": "Synthetic v2 fixture",
                "evidence": evidence,
                "counterexample_attempt": "Synthetic adversarial attempt",
            }

        return {
            "schema_version": 2,
            "candidate_sha": self.sha,
            "method": "independent_agent",
            "environment": "Synthetic v2 fixture",
            "limitations": "No real game was reviewed",
            "prior_context": "Cold observer intentionally restricted",
            "user_authority": "Current user is sole human product critic",
            "review_order": "cold_observer_then_intent",
            "cold_observer_context": "Runtime evidence only; no story/design treatment",
            "technical_status": "passed",
            "technical_evidence": [ev("ci_report")],
            "criteria": criteria,
            "coverage": {
                name: {
                    "status": "observed",
                    "note": "Synthetic fixture",
                    "evidence": [ev("interactive_trace")],
                }
                for name in COVERAGE
            },
            "blockers": [],
        }

    def test_v2_can_be_structurally_ready_without_becoming_user_acceptance(self):
        result = self.check(self.v2_record())
        self.assertEqual(result["schema_version"], 2)
        self.assertEqual(result["status"], "ready_for_user_review")
        self.assertEqual(result["user_acceptance"], "not_determined_by_tool")
        self.assertEqual(set(result["gate_minimums"]), set(V2_GATES))

    def test_v2_art_failure_cannot_be_averaged_away(self):
        record = self.v2_record()
        record['criteria']['spatial_composition']['rating'] = 8
        result = self.check(record)
        self.assertEqual(result['status'], 'needs_revision')
        self.assertEqual(result['gate_minimums']['art_world_direction'], 8)

    def test_v2_art_cannot_be_omitted_or_certified_by_screenshot(self):
        record = self.v2_record()
        del record['criteria']['focal_identity']
        with self.assertRaises(ValueError):
            self.check(record)
        record = self.v2_record()
        record['criteria']['focal_identity']['evidence'] = [{
            'ref':'screen.png','modality':'screenshot','candidate_sha':self.sha}]
        with self.assertRaisesRegex(ValueError, 'focal_identity: evidence needs'):
            self.check(record)

    def test_v2_review_assignment_cannot_substitute_for_cold_observer_report(self):
        record = self.v2_record()
        (self.root / "assignment.json").write_text("assignment", encoding="utf-8")
        record["criteria"]["world_comprehension"]["evidence"] = [
            {"ref": "assignment.json", "modality": "review_assignment", "candidate_sha": self.sha},
            {"ref": "motion.webm", "modality": "motion_video", "candidate_sha": self.sha},
        ]
        with self.assertRaisesRegex(ValueError, "world_comprehension: evidence needs"):
            self.check(record)

    def test_v2_world_comprehension_cannot_use_captioned_motion_only(self):
        record = self.v2_record()
        record["criteria"]["world_comprehension"]["evidence"] = [
            {"ref": "cold.json", "modality": "cold_observer_report", "candidate_sha": self.sha},
            {"ref": "motion.webm", "modality": "motion_video", "candidate_sha": self.sha},
        ]
        with self.assertRaisesRegex(ValueError, "world_comprehension: evidence needs"):
            self.check(record)

    def test_v2_motion_claim_cannot_use_screenshot_only(self):
        record = self.v2_record()
        record["criteria"]["motion_direction"]["evidence"] = [{
            "ref": "screen.png", "modality": "screenshot", "candidate_sha": self.sha
        }]
        with self.assertRaisesRegex(ValueError, "motion_direction: evidence needs"):
            self.check(record)

    def test_v2_audio_quality_requires_actual_listening_evidence(self):
        record = self.v2_record()
        record["criteria"]["audio_atmosphere"]["evidence"] = [{
            "ref": "motion.webm", "modality": "motion_video", "candidate_sha": self.sha
        }]
        with self.assertRaisesRegex(ValueError, "audio_atmosphere: evidence needs"):
            self.check(record)

    def test_v2_physicality_requires_interactive_trace(self):
        record = self.v2_record()
        record["criteria"]["physicality"]["evidence"] = [{
            "ref": "runtime.json", "modality": "runtime_trace", "candidate_sha": self.sha
        }]
        with self.assertRaisesRegex(ValueError, "physicality: evidence needs"):
            self.check(record)

    def test_v2_requires_cold_observer_before_intent(self):
        record = self.v2_record()
        record["review_order"] = "intent_first"
        with self.assertRaisesRegex(ValueError, "cold observer"):
            self.check(record)

    def test_v2_evidence_is_exact_candidate_bound(self):
        record = self.v2_record()
        record["criteria"]["controls"]["evidence"][0]["candidate_sha"] = "b" * 40
        with self.assertRaisesRegex(ValueError, "different candidate"):
            self.check(record)

    def test_v2_rejects_evidence_file_type_that_does_not_match_modality(self):
        record = self.v2_record()
        record["criteria"]["motion_direction"]["evidence"] = [{
            "ref": "screen.png", "modality": "motion_video", "candidate_sha": self.sha
        }]
        with self.assertRaisesRegex(ValueError, "motion_video: unsupported evidence file type"):
            self.check(record)

    def test_acceptance_cannot_be_forged_in_internal_record(self):
        self.record["user_accepted"] = True
        with self.assertRaisesRegex(ValueError, "User acceptance"):
            self.check()
