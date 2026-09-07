"""HTTP/session contract tests with real SQLite and an explicitly simulated Auth provider.

These do not establish live Supabase Auth or PostgreSQL application connectivity.
"""
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4
from app import service
from app.hosted import create_app, COOKIE, ACCESS_COOKIE
from app.storage import migrate, transaction


class AuthFixture:
    def __init__(self):
        self.identity = {"id": str(uuid4()), "email": "owner@example.test"}

    def login(self, email, password):
        if password != "test-password":
            raise service.DomainError("UNAUTHENTICATED", "Invalid credentials", 401)
        return "verified-test-access", 3600

    def user(self, token):
        if token != "verified-test-access":
            raise service.DomainError("UNAUTHENTICATED", "Invalid token", 401)
        return self.identity


class HostedTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = Path(directory.name) / "test.sqlite3"
        migrate(self.path)
        with transaction(self.path) as db:
            db.execute("CREATE TABLE hosted_sessions (token_hash TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), expires_at TEXT NOT NULL)")
        self.auth = AuthFixture()
        self.config = {"TESTING": True, "DATABASE_URL": self.path, "APP_ORIGIN": "https://pilot.example.test", "ALLOWED_EMAILS": "owner@example.test"}
        self.app = create_app(self.config, self.auth)
        self.client = self.app.test_client()

    def post(self, path, body, **kwargs):
        return self.client.post(path, json=body, base_url=self.config["APP_ORIGIN"], headers={"Origin": self.config["APP_ORIGIN"], "X-Learning-Command": "1"}, **kwargs)

    def login(self):
        response = self.post("/api/auth/login", {"email": "owner@example.test", "password": "test-password"})
        self.assertEqual(response.status_code, 200)
        return response

    def test_hosted_configuration_fails_closed(self):
        for change in ({"ALLOWED_EMAILS": ""}, {"APP_ORIGIN": "http://pilot.example.test"}, {"TESTING": False}):
            with self.assertRaises(RuntimeError):
                create_app(self.config | change, self.auth)

    def test_no_anonymous_session_or_cookie_forgery(self):
        self.assertEqual(self.post("/api/session", {}).status_code, 401)
        self.client.set_cookie(ACCESS_COOKIE, "forged", domain="pilot.example.test")
        self.client.set_cookie(COOKIE, "forged", domain="pilot.example.test")
        self.assertEqual(self.post("/api/session", {}).status_code, 401)
        with transaction(self.path) as db:
            self.assertEqual(db.execute("SELECT count(*) FROM learners").fetchone()[0], 0)

    def test_host_and_origin_are_checked_even_with_forwarded_headers(self):
        response = self.client.post("/api/auth/login", json={}, base_url="https://attacker.test", headers={"X-Forwarded-Host": "pilot.example.test"})
        self.assertEqual(response.status_code, 403)
        response = self.client.post("/api/session", json={}, base_url=self.config["APP_ORIGIN"], headers={"Origin": "https://attacker.test", "X-Learning-Command": "1"})
        self.assertEqual(response.status_code, 403)

    def test_login_scope_and_secure_cookies(self):
        self.assertEqual(self.post("/api/auth/login", {"email": "stranger@example.test", "password": "test-password"}).status_code, 401)
        response = self.login()
        for cookie in response.headers.getlist("Set-Cookie"):
            for attribute in ("Secure", "HttpOnly", "SameSite=Strict", "Path=/"):
                self.assertIn(attribute, cookie)
        state = self.post("/api/session", {}).json
        self.assertEqual(state["learner_id"], self.auth.identity["id"])
        self.assertNotIn("6+", str(state["profile"]))

    def test_saved_answer_survives_relogin(self):
        self.login()
        attempt = self.post("/api/commands/start", {"command_id": str(uuid4()), "expected_revision": 0, "mode": "LEARN"}).json
        body = {"command_id": str(uuid4()), "expected_revision": attempt["revision"], "attempt_id": attempt["id"], "response": {"prediction": "2, 1, 2", "diagnosis": "Durable intent key", "aid_declaration": "none"}}
        self.assertEqual(self.post("/api/commands/save", body).status_code, 200)
        self.post("/api/auth/logout", {})
        self.login()
        resumed = self.post("/api/session", {}).json["attempt"]
        self.assertEqual(resumed["response"], body["response"])

    def test_logout_revokes_replayed_cookie_pair(self):
        self.login()
        session = self.client.get_cookie(COOKIE, domain="pilot.example.test").value
        access = self.client.get_cookie(ACCESS_COOKIE, domain="pilot.example.test").value
        self.assertEqual(self.post("/api/auth/logout", {}).status_code, 200)
        self.client.set_cookie(COOKIE, session, domain="pilot.example.test")
        self.client.set_cookie(ACCESS_COOKIE, access, domain="pilot.example.test")
        self.assertEqual(self.post("/api/session", {}).status_code, 401)

    def test_changed_identity_cannot_use_another_session(self):
        self.login()
        self.auth.identity = self.auth.identity | {"id": str(uuid4())}
        self.assertEqual(self.post("/api/session", {}).status_code, 401)

    def test_expired_session_cannot_resume(self):
        self.login()
        with transaction(self.path) as db:
            db.execute("UPDATE hosted_sessions SET expires_at='2000-01-01T00:00:00+00:00'")
        self.assertEqual(self.post("/api/session", {}).status_code, 401)
