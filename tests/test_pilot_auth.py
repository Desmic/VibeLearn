import unittest
from uuid import uuid4

from app.pilot_auth import PilotAuth
from app.service import DomainError


class Provider:
    def __init__(self):
        self.calls = []

    def login(self, identifier, password):
        self.calls.append(("login", identifier, password))
        return "real-token", 1800

    def user(self, token):
        self.calls.append(("user", token))
        return {"id": str(uuid4()), "email": "owner@example.test"}

    def request_reset(self, identifier, origin):
        self.calls.append(("reset", identifier, origin))

    def reset_password(self, access, refresh, password, allowed):
        self.calls.append(("reset_password", access))
        return str(uuid4())


class PilotAuthTests(unittest.TestCase):
    def setUp(self):
        self.provider = Provider()
        self.user_id = str(uuid4())
        self.auth = PilotAuth(
            self.provider,
            name="dank",
            password="123456",
            user_id=self.user_id,
            secret="test-secret-long-enough-for-hmac-signing",
        )

    def test_test_identity_is_signed_and_does_not_hit_supabase_provider(self):
        token, ttl = self.auth.login("DANK", "123456")
        self.assertTrue(token.startswith("vlt."))
        self.assertEqual(ttl, 3600)
        self.assertEqual(self.auth.user(token), {"id": self.user_id, "email": "dank"})
        self.assertEqual(self.provider.calls, [])
        with self.assertRaises(DomainError):
            self.auth.user(token + "x")

    def test_wrong_test_password_fails_and_normal_identity_still_delegates(self):
        with self.assertRaises(DomainError):
            self.auth.login("dank", "wrong")
        token, ttl = self.auth.login("owner@example.test", "real-password")
        self.assertEqual((token, ttl), ("real-token", 1800))
        self.assertEqual(self.provider.calls[0], ("login", "owner@example.test", "real-password"))

    def test_test_account_reset_is_noop_but_normal_reset_delegates(self):
        self.assertIsNone(self.auth.request_reset("dank", "https://pilot.example.test"))
        self.assertEqual(self.provider.calls, [])
        self.auth.request_reset("owner@example.test", "https://pilot.example.test")
        self.assertEqual(self.provider.calls[0][0], "reset")

    def test_partial_environment_configuration_fails_closed(self):
        with self.assertRaises(RuntimeError):
            PilotAuth.configure(self.provider, {"TEST_USER_NAME": "dank"})
        provider, name = PilotAuth.configure(self.provider, {})
        self.assertIs(provider, self.provider)
        self.assertIsNone(name)


if __name__ == "__main__":
    unittest.main()
