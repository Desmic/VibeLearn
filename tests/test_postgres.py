"""Real PostgreSQL application tests. Requires the explicitly disposable CI database."""
import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from uuid import uuid4
from urllib.parse import urlsplit
import psycopg
from app import service
from app.storage import migrate, transaction

DSN = os.environ.get("TEST_DATABASE_URL")


@unittest.skipUnless(DSN, "TEST_DATABASE_URL not set; real PostgreSQL application gate pending")
class PostgresTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        parts = urlsplit(DSN)
        if parts.hostname not in ("127.0.0.1", "localhost") or not parts.path.endswith("_test"):
            raise RuntimeError("PostgreSQL tests require a disposable local *_test database")
        with psycopg.connect(DSN) as db:
            db.execute("CREATE ROLE anon NOLOGIN")
            db.execute("CREATE ROLE authenticated NOLOGIN")
            db.execute((Path(__file__).resolve().parents[1] / "db/hosted-schema.sql").read_text())

    def setUp(self):
        migrate(DSN)
        self.learner, self.other = str(uuid4()), str(uuid4())
        for learner in (self.learner, self.other):
            with transaction(DSN, learner=learner) as db:
                db.execute("INSERT INTO learners (id,profile,created_at) VALUES (?, ?, ?)", (learner, "{}", service.now()))
        self.attempt = service.command(DSN, self.learner, "start", {"command_id": str(uuid4()), "expected_revision": 0, "mode": "LEARN"})

    def body(self):
        return {"command_id": str(uuid4()), "expected_revision": self.attempt["revision"], "attempt_id": self.attempt["id"], "response": {"prediction": "2, 1, 2", "diagnosis": "Persist the intent key and reconcile late retries.", "aid_declaration": "none"}}

    def test_concurrent_submit_and_reward_deduplication(self):
        body = self.body()
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: service.command(DSN, self.learner, "submit", body), range(2)))
        self.assertEqual(results[0], results[1])
        self.assertEqual(results[0]["practice_xp"], 10)
        self.assertEqual(results[0]["assessment"]["outcome"], "correct")
        with transaction(DSN, learner=self.learner) as db:
            self.assertEqual(db.execute("SELECT count(*) FROM evidence WHERE learner_id=?", (self.learner,)).fetchone()[0], 1)

    def test_save_resume_and_stale_write(self):
        body = self.body()
        saved = service.command(DSN, self.learner, "save", body)
        self.assertEqual(service.state(DSN, self.learner)["attempt"], saved)
        with self.assertRaises(service.DomainError) as error:
            service.command(DSN, self.learner, "save", body | {"command_id": str(uuid4())})
        self.assertEqual(error.exception.code, "STALE_REVISION")

    def test_database_and_service_learner_isolation(self):
        with transaction(DSN, learner=self.other) as db:
            self.assertIsNone(db.execute("SELECT * FROM attempts WHERE id=?", (self.attempt["id"],)).fetchone())
        with self.assertRaises(service.DomainError) as error:
            service.command(DSN, self.other, "save", self.body())
        self.assertEqual(error.exception.code, "NOT_FOUND")

    def test_hints_pin_checkpoint_and_assistance(self):
        hinted = service.command(DSN, self.learner, "hint", self.body())
        self.assertEqual(hinted["checkpoints"][0]["kind"], "before_hint")
        self.assertEqual(len(hinted["hints"]), 1)
        self.attempt = hinted
        submitted = service.command(DSN, self.learner, "submit", self.body())
        self.assertTrue(submitted["evidence"]["capsule"]["assistance"])

    def test_invalid_answer_rolls_back(self):
        body = self.body()
        body["response"]["prediction"] = "invalid"
        with self.assertRaises(service.DomainError):
            service.command(DSN, self.learner, "submit", body)
        self.assertEqual(service.state(DSN, self.learner)["attempt"]["revision"], 1)

    def test_history_and_reward_permissions(self):
        result = service.command(DSN, self.learner, "submit", self.body())
        with self.assertRaises(psycopg.errors.InsufficientPrivilege):
            with transaction(DSN, learner=self.learner) as db:
                db.execute("UPDATE evidence SET result='{}' WHERE id=?", (result["evidence"]["id"],))
        with self.assertRaises(psycopg.errors.CheckViolation):
            with transaction(DSN, learner=self.learner) as db:
                db.execute("UPDATE attempts SET response='{}' WHERE id=?", (result["id"],))
