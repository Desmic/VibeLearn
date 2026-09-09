import tempfile
import unittest
from pathlib import Path
from uuid import uuid4

from app.hosted import create_app
from app.storage import migrate, transaction


class UnusedProvider:
    def login(self, *args):
        raise AssertionError("Supabase fixture should not be used for the configured test player")

    def user(self, *args):
        raise AssertionError("Supabase fixture should not be used for the configured test player")

    def request_reset(self, *args):
        raise AssertionError("Test player reset should not call the provider")

    def reset_password(self, *args):
        raise AssertionError("Recovery token path is not part of this test")


class ProgressControlTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = Path(directory.name) / "test.sqlite3"
        migrate(self.path)
        with transaction(self.path) as db:
            db.execute("CREATE TABLE hosted_sessions (token_hash TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), expires_at TEXT NOT NULL)")
        self.test_user_id = str(uuid4())
        self.origin = "https://pilot.example.test"
        self.config = {
            "TESTING": True,
            "DATABASE_URL": self.path,
            "APP_ORIGIN": self.origin,
            "ALLOWED_EMAILS": "owner@example.test",
            "TEST_USER_NAME": "dank",
            "TEST_USER_PASSWORD": "123456",
            "TEST_USER_ID": self.test_user_id,
            "TEST_USER_SECRET": "unit-test-secret-long-enough-for-hmac-signing",
        }
        self.app = create_app(self.config, UnusedProvider())
        self.client = self.app.test_client()

    def post(self, path, body):
        return self.client.post(path, json=body, base_url=self.origin, headers={"Origin": self.origin, "X-Learning-Command": "1"})

    def get(self, path):
        return self.client.get(path, base_url=self.origin)

    def test_test_player_can_review_previous_signal_while_newer_signal_is_active(self):
        login = self.post("/api/auth/login", {"email": "dank", "password": "123456"})
        self.assertEqual(login.status_code, 200)
        self.assertEqual(self.post("/api/session", {}).json["learner_id"], self.test_user_id)

        first = self.post("/api/commands/start", {
            "command_id": str(uuid4()), "expected_revision": 0,
            "mode": "LEARN", "mission_id": "rescue-01",
        }).json
        response = {"prediction": "", "diagnosis": "", "aid_declaration": "none", "rescue": {"moves": ["retry"], "draft": []}}
        submitted = self.post("/api/commands/submit", {
            "command_id": str(uuid4()), "expected_revision": first["revision"],
            "attempt_id": first["id"], "response": response,
        })
        self.assertEqual(submitted.status_code, 200)
        self.assertEqual(submitted.json["assessment"]["outcome"], "correct")

        current = self.post("/api/commands/start", {
            "command_id": str(uuid4()), "expected_revision": 0,
            "mode": "LEARN", "mission_id": "rescue-02",
        }).json
        history = self.get("/api/history/rescue/rescue-01")
        self.assertEqual(history.status_code, 200)
        self.assertEqual(history.json["snapshot"]["mission"]["id"], "rescue-01")
        self.assertEqual(history.json["status"], "submitted")
        self.assertEqual(self.post("/api/session", {}).json["attempt"]["id"], current["id"])

    def test_reset_requires_confirmation_and_keeps_account_session(self):
        self.assertEqual(self.post("/api/auth/login", {"email": "dank", "password": "123456"}).status_code, 200)
        started = self.post("/api/commands/start", {
            "command_id": str(uuid4()), "expected_revision": 0,
            "mode": "LEARN", "mission_id": "rescue-01",
        })
        self.assertEqual(started.status_code, 200)
        self.assertEqual(self.post("/api/progress/reset", {"confirmation": "no"}).status_code, 400)
        reset = self.post("/api/progress/reset", {"confirmation": "RESET_PROGRESS"})
        self.assertEqual(reset.status_code, 200)
        self.assertIsNone(reset.json["attempt"])
        self.assertEqual(reset.json["course"]["rescue"][0]["status"], "unlocked")
        self.assertTrue(all(item["status"] == "locked" for item in reset.json["course"]["rescue"][1:]))
        with transaction(self.path) as db:
            self.assertEqual(db.execute("SELECT count(*) FROM learners WHERE id=?", (self.test_user_id,)).fetchone()[0], 1)
            self.assertEqual(db.execute("SELECT count(*) FROM hosted_sessions WHERE learner_id=?", (self.test_user_id,)).fetchone()[0], 1)
            self.assertEqual(db.execute("SELECT count(*) FROM attempts WHERE learner_id=?", (self.test_user_id,)).fetchone()[0], 0)


if __name__ == "__main__":
    unittest.main()
