import copy
import json
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

from app import service, word_machine
from app.content import CONTENT, RESCUE, freeze
from app.storage import migrate, transaction

FIRST = ["step"] * 3 + ["send", "add-garden"] + ["step"] * 3 + ["send"]
COMPLETE = FIRST + ["next", "add-library"] + ["step"] * 3 + ["send"]


class WordMachineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "review.db"
        migrate(self.path)
        _, self.learner = service.create_session(self.path)
        self.attempt = service.command(self.path, self.learner, "start", {
            "command_id": str(uuid4()), "expected_revision": 0, "mode": "LEARN", "mission_id": word_machine.MISSION_ID})

    def action(self, action):
        response = copy.deepcopy(self.attempt["response"])
        response["word_machine"]["moves"].append(action)
        body = {"command_id": str(uuid4()), "expected_revision": self.attempt["revision"], "attempt_id": self.attempt["id"], "response": response}
        self.attempt = service.command(self.path, self.learner, "save", body)
        return body

    def test_new_learning_identity_preserves_retry_families(self):
        snapshot = self.attempt["snapshot"]
        self.assertNotIn(snapshot["family_id"], [CONTENT["family_id"], *[x["family_id"] for x in RESCUE]])
        self.assertNotEqual(snapshot["competency"]["id"], CONTENT["competency"]["id"])

    def test_context_changes_prediction_and_second_case_defeats_first_answer(self):
        for action in FIRST:
            self.action(action)
        self.assertEqual(self.attempt["word_machine_state"]["output"], ["Go", "to", "Garden"])
        self.action("next")
        self.action("add-garden")
        for action in ["step"] * 3 + ["send"]:
            self.action(action)
        self.assertEqual(self.attempt["word_machine_state"]["status"], "wrong")
        self.action("add-library")
        for action in ["step"] * 3 + ["send"]:
            self.action(action)
        self.assertTrue(self.attempt["word_machine_state"]["complete"])

    def test_illegal_step_and_rewriting_history_do_not_persist(self):
        with self.assertRaises(service.DomainError):
            self.action("send")
        self.action("step")
        response = copy.deepcopy(self.attempt["response"])
        response["word_machine"]["moves"] = []
        with self.assertRaisesRegex(service.DomainError, "cannot be rewritten"):
            service.command(self.path, self.learner, "save", {"command_id": str(uuid4()), "expected_revision": self.attempt["revision"], "attempt_id": self.attempt["id"], "response": response})
        self.assertEqual(service.state(self.path, self.learner)["attempt"]["word_machine_state"]["pieces"], 1)

    def test_receipt_replay_restart_stale_revision_and_isolation(self):
        body = self.action("step")
        self.assertEqual(service.command(self.path, self.learner, "save", body), self.attempt)
        self.assertEqual(service.state(self.path, self.learner)["attempt"]["response"], self.attempt["response"])
        conflict = copy.deepcopy(body)
        conflict["response"]["word_machine"]["moves"].append("step")
        with self.assertRaises(service.DomainError) as caught:
            service.command(self.path, self.learner, "save", conflict)
        self.assertEqual(caught.exception.code, "IDEMPOTENCY_CONFLICT")
        conflict["command_id"] = str(uuid4())
        with self.assertRaises(service.DomainError) as caught:
            service.command(self.path, self.learner, "save", conflict)
        self.assertEqual(caught.exception.code, "STALE_REVISION")
        _, other = service.create_session(self.path)
        conflict["expected_revision"] = self.attempt["revision"]
        with self.assertRaises(service.DomainError) as caught:
            service.command(self.path, other, "save", conflict)
        self.assertEqual(caught.exception.code, "NOT_FOUND")

    def test_completed_evidence_is_immutable_and_not_mastery(self):
        for action in COMPLETE:
            self.action(action)
        body = {"command_id": str(uuid4()), "expected_revision": self.attempt["revision"], "attempt_id": self.attempt["id"], "response": self.attempt["response"]}
        submitted = service.command(self.path, self.learner, "submit", body)
        self.assertEqual(submitted["assessment"]["mastery"], "unknown")
        self.assertEqual(submitted["assessment"]["independence"], "assisted")
        self.assertEqual(submitted["assessment"]["outcome"], "correct")
        self.assertEqual(service.command(self.path, self.learner, "submit", body)["evidence"]["id"], submitted["evidence"]["id"])
        with transaction(self.path) as db:
            self.assertEqual(db.execute("SELECT count(*) FROM evidence").fetchone()[0], 1)
            self.assertEqual(db.execute("SELECT count(*) FROM rewards").fetchone()[0], 1)
            with self.assertRaises(Exception):
                db.execute("UPDATE evidence SET result='{}'")

    def test_pinned_rules_and_context_are_replayed_not_client_results(self):
        snapshot = freeze("LEARN", word_machine.MISSION_ID)
        a = word_machine.replay(snapshot, {"moves": ["step"] * 3})
        self.assertEqual(a["output"], ["Go", "to", "Library"])
        self.assertEqual(word_machine.replay(snapshot, {"moves": ["step"] * 2})["candidates"][0]["chance"], 70)
        self.assertEqual(a, word_machine.replay(json.loads(json.dumps(snapshot)), {"moves": ["step"] * 3}))
        with self.assertRaises(ValueError):
            word_machine.replay(snapshot, {"moves": [], "complete": True})
