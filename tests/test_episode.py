import json
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4
from app import service
from app.storage import migrate, transaction


class EpisodeTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "learning.sqlite3"
        migrate(self.path)
        self.token, self.learner = service.create_session(self.path)
        self.other_token, self.other = service.create_session(self.path)
        self.attempt = self.issue("start", mode="LEARN")

    def issue(self, action, learner=None, **extra):
        body = {"command_id": str(uuid4()), "expected_revision": 0 if action == "start" else self.attempt["revision"], **extra}
        if action != "start":
            body.setdefault("attempt_id", self.attempt["id"])
        return service.command(self.path, learner or self.learner, action, body)

    def answer(self, prediction="2, 1, 2", diagnosis="Store the logical intent key durably, bind its payload, and reconcile late retries.", aid="none"):
        return {"prediction": prediction, "diagnosis": diagnosis, "aid_declaration": aid}

    def test_save_resume_pins_content_without_private_profile(self):
        saved = self.issue("save", response=self.answer())
        migrate(self.path)
        resumed = service.state(self.path, service.resolve_session(self.path, self.token))["attempt"]
        self.assertEqual(resumed, saved)
        self.assertNotIn("experience", json.dumps(saved["snapshot"]))
        self.assertEqual(saved["snapshot_digest"], self.attempt["snapshot_digest"])
        self.assertNotIn("hints", saved["snapshot"])
        self.assertNotIn("url", saved["snapshot"]["source"])

    def test_learner_cannot_read_or_write_another_attempt(self):
        self.assertIsNone(service.state(self.path, self.other)["attempt"])
        with self.assertRaises(service.DomainError) as error:
            self.issue("save", learner=self.other, response=self.answer())
        self.assertEqual(error.exception.status, 404)
        self.assertEqual(service.state(self.path, self.learner)["attempt"]["response"], service.EMPTY_RESPONSE)

    def test_stale_save_preserves_committed_answer(self):
        saved = self.issue("save", response=self.answer())
        with self.assertRaises(service.DomainError) as error:
            self.issue("save", response=self.answer("0, 0, 0"))
        self.assertEqual(error.exception.code, "STALE_REVISION")
        self.assertEqual(service.state(self.path, self.learner)["attempt"], saved)

    def test_duplicate_save_and_conflicting_command_id(self):
        body = {"command_id": str(uuid4()), "expected_revision": 1, "attempt_id": self.attempt["id"], "response": self.answer()}
        first = service.command(self.path, self.learner, "save", body)
        self.assertEqual(first, service.command(self.path, self.learner, "save", body))
        body["response"]["prediction"] = "0, 0, 0"
        with self.assertRaises(service.DomainError) as error:
            service.command(self.path, self.learner, "save", body)
        self.assertEqual(error.exception.code, "IDEMPOTENCY_CONFLICT")

    def test_invalid_command_never_changes_state(self):
        for value in [None, {"prediction": []}, self.answer(aid="forged")]:
            with self.assertRaises(service.DomainError):
                self.issue("save", response=value)
        self.assertEqual(service.state(self.path, self.learner)["attempt"]["revision"], 1)

    def test_newer_database_is_not_silently_downgraded(self):
        with transaction(self.path) as db:
            db.execute("PRAGMA user_version=999")
        with self.assertRaises(RuntimeError):
            migrate(self.path)

    def test_submission_records_evidence_and_course_independent_review(self):
        result = self.issue("submit", response=self.answer())
        self.assertEqual(result["assessment"]["outcome"], "correct")
        self.assertEqual(result["assessment"]["mastery"], "provisional")
        self.assertIsNone(result["assessment"]["reasoning"]["score"])
        self.assertEqual(result["evidence"]["capsule"]["response"], self.answer())
        self.assertEqual(result["review"]["frame"]["id"], self.attempt["snapshot"]["frame"]["id"])
        self.assertIsNone(result["review"]["activity_id"])
        self.assertNotIn("course", json.dumps(result["review"]))
        self.assertGreater(result["review"]["due_at"], result["updated_at"])
        self.assertIsNone(service.state(self.path, self.other)["attempt"])

    def test_duplicate_submission_is_idempotent(self):
        body = {"command_id": str(uuid4()), "expected_revision": 1, "attempt_id": self.attempt["id"], "response": self.answer()}
        first = service.command(self.path, self.learner, "submit", body)
        self.assertEqual(first, service.command(self.path, self.learner, "submit", body))
        self.attempt = first
        with self.assertRaises(service.DomainError):
            self.issue("submit", response=self.answer())
        with transaction(self.path) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM evidence").fetchone()[0], 1)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM checkpoints").fetchone()[0], 1)

    def test_invalid_submission_keeps_saved_draft_and_unknown_distinct_from_failure(self):
        self.assertIsNone(self.attempt["assessment"]["score"])
        self.assertEqual(self.attempt["assessment"]["outcome"], "not_observed")
        self.attempt = self.issue("save", response=self.answer("incomplete"))
        for answer in [self.answer(""), self.answer("2, x, 1"), self.answer(diagnosis=" ")]:
            with self.assertRaises(service.DomainError) as error:
                self.issue("submit", response=answer)
            self.assertEqual(error.exception.code, "INVALID_ANSWER")
        self.assertEqual(service.state(self.path, self.learner)["attempt"]["response"]["prediction"], "incomplete")
        result = self.issue("submit", response=self.answer("0, 0, 0"))
        self.assertEqual(result["assessment"]["outcome"], "incorrect")
        self.assertEqual(result["assessment"]["score"], 0)

    def test_unknown_external_aids_do_not_claim_independence(self):
        result = self.issue("submit", response=self.answer(aid="unknown"))
        self.assertEqual(result["assessment"]["independence"], "unknown")

    def test_pre_hint_checkpoint_is_separate_from_assisted_submission(self):
        before = self.answer("1, 1, 1")
        self.attempt = self.issue("hint", response=before)
        checkpoint = self.attempt["checkpoints"][0]
        self.assertEqual(checkpoint["response"], before)
        self.assertEqual(checkpoint["assistance"], [])
        self.assertNotIn("assessment", checkpoint)  # Don't leak the key before submit.
        self.assertEqual(len(self.attempt["hints"]), 1)
        result = self.issue("submit", response=self.answer())
        self.assertEqual(result["assessment"]["independence"], "assisted")
        self.assertEqual(result["checkpoints"][0]["assessment"]["independence"], "declared_independent")
        self.assertEqual(result["checkpoints"][0]["assessment"]["outcome"], "partially_correct")
        self.assertEqual(result["checkpoints"][-1]["response"], self.answer())

    def test_source_gate_and_mode_changes_never_erase_assistance(self):
        with self.assertRaises(service.DomainError) as error:
            self.issue("source", response=self.answer())
        self.assertEqual(error.exception.code, "AID_RESTRICTED")
        self.assertEqual(service.state(self.path, self.learner)["attempt"]["checkpoints"], [])
        self.attempt = self.issue("mode", response=self.answer(), mode="PAIR")
        self.attempt = self.issue("source", response=self.answer())
        self.assertTrue(self.attempt["source"]["url"].startswith("https://aws.amazon.com/"))
        self.attempt = self.issue("mode", response=self.answer(), mode="LEARN")
        result = self.issue("submit", response=self.answer())
        self.assertEqual(result["assessment"]["independence"], "assisted")
        self.assertEqual(result["evidence"]["capsule"]["mode_at_submission"], "LEARN")
        self.assertEqual(result["evidence"]["capsule"]["snapshot"]["mode_at_start"], "LEARN")

    def test_build_worked_example_and_switch_back_are_assisted(self):
        self.attempt = self.issue("mode", response=self.answer(), mode="BUILD")
        self.assertIn("A commits twice", self.attempt["worked_example"])
        self.attempt = self.issue("mode", response=self.answer(), mode="LEARN")
        self.assertEqual(self.issue("submit", response=self.answer())["assessment"]["independence"], "assisted")

    def test_hints_are_progressive_deduplicated_and_bounded(self):
        body = {"command_id": str(uuid4()), "expected_revision": 1, "attempt_id": self.attempt["id"], "response": self.answer()}
        self.attempt = service.command(self.path, self.learner, "hint", body)
        self.assertEqual(self.attempt, service.command(self.path, self.learner, "hint", body))
        self.assertEqual(len(self.attempt["hints"]), 1)
        for _ in range(2):
            self.attempt = self.issue("hint", response=self.answer())
        with self.assertRaises(service.DomainError) as error:
            self.issue("hint", response=self.answer())
        self.assertEqual(error.exception.code, "NO_MORE_HINTS")
        self.assertEqual(len(self.attempt["checkpoints"]), 3)

    def test_reward_cap_and_prior_exposure_survive_a_new_attempt(self):
        first = self.issue("submit", response=self.answer("0,0,0"))
        self.assertEqual(first["reward"], 10)
        due = first["review"]["due_at"]
        self.attempt = self.issue("start", mode="LEARN")
        second = self.issue("submit", response=self.answer())
        self.assertEqual(second["practice_xp"], 10)
        self.assertEqual(second["reward"], 0)
        self.assertEqual(second["assessment"]["independence"], "assisted")
        self.assertEqual(second["review"]["due_at"], due)
        with transaction(self.path) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM evidence").fetchone()[0], 2)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM rewards").fetchone()[0], 1)
        self.assertEqual(service.state(self.path, self.other)["attempt"], None)

    def test_source_after_submit_never_rewrites_response_or_evidence(self):
        self.attempt = self.issue("submit", response=self.answer())
        evidence = self.attempt["evidence"]
        result = self.issue("source", response=self.answer("0,0,0", "Changed"))
        self.assertEqual(result["response"], self.answer())
        self.assertEqual(result["evidence"], evidence)
        self.assertEqual(result["assessment"]["independence"], "declared_independent")

    def test_all_commands_enforce_learner_scope(self):
        for action in ["hint", "source", "mode", "submit", "save"]:
            extra = {"mode": "BUILD"} if action == "mode" else {}
            with self.assertRaises(service.DomainError) as error:
                self.issue(action, learner=self.other, response=self.answer(), **extra)
            self.assertEqual(error.exception.status, 404)
        with transaction(self.path) as db:
            for table in ["assistance", "checkpoints", "evidence", "rewards", "reviews"]:
                self.assertEqual(db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0], 0)

    def test_concurrent_duplicate_submit_commits_once(self):
        from concurrent.futures import ThreadPoolExecutor
        body = {"command_id": str(uuid4()), "expected_revision": 1, "attempt_id": self.attempt["id"], "response": self.answer()}
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: service.command(self.path, self.learner, "submit", body), range(2)))
        self.assertEqual(results[0], results[1])
        with transaction(self.path) as db:
            self.assertEqual(db.execute("SELECT COUNT(*) FROM evidence").fetchone()[0], 1)
            self.assertEqual(db.execute("SELECT COUNT(*) FROM rewards").fetchone()[0], 1)

    def test_reward_storage_failure_rolls_back_entire_submission(self):
        with transaction(self.path) as db:
            db.execute("CREATE TRIGGER fail_reward BEFORE INSERT ON rewards BEGIN SELECT RAISE(ABORT, 'injected storage failure'); END")
        import sqlite3
        with self.assertRaises(sqlite3.IntegrityError):
            self.issue("submit", response=self.answer())
        result = service.state(self.path, self.learner)["attempt"]
        self.assertEqual(result["status"], "draft")
        self.assertEqual(result["revision"], 1)
        self.assertIsNone(result["evidence"])
        self.assertIsNone(result["review"])
        self.assertEqual(result["checkpoints"], [])

    def test_evaluator_failure_is_unknown_and_preserves_draft(self):
        from unittest.mock import patch
        self.attempt = self.issue("save", response=self.answer())
        # Deliberate failure injection, not a substitute for live assessment tests.
        with patch("app.service.evaluate", side_effect=ValueError("unavailable")):
            with self.assertRaises(service.DomainError) as error:
                self.issue("submit", response=self.answer())
        self.assertEqual(error.exception.code, "EVALUATOR_UNAVAILABLE")
        result = service.state(self.path, self.learner)["attempt"]
        self.assertEqual(result["response"], self.answer())
        self.assertIsNone(result["assessment"]["score"])
        self.assertEqual(result["assessment"]["outcome"], "not_observed")

    def test_historical_context_is_immutable_in_database(self):
        import sqlite3
        self.attempt = self.issue("submit", response=self.answer())
        statements = ["UPDATE attempts SET snapshot='{}'", "UPDATE attempts SET response='{}'", "UPDATE evidence SET result='{}'", "UPDATE checkpoints SET response='{}'"]
        for sql in statements:
            with self.assertRaises(sqlite3.IntegrityError):
                with transaction(self.path) as db:
                    db.execute(sql)
        self.assertEqual(service.state(self.path, self.learner)["attempt"]["response"], self.answer())
