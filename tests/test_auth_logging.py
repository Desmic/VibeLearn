"""Adapter unit tests; simulated provider failures do not claim live Auth acceptance."""
import json
import unittest
from contextlib import contextmanager
from unittest.mock import patch
from unittest.mock import Mock
from types import SimpleNamespace
from supabase_auth.errors import AuthApiError
from app.auth import SupabaseAuth
from app.service import DomainError


class AuthLoggingTests(unittest.TestCase):
    def test_reset_requires_verified_allowlisted_identity(self):
        adapter = SupabaseAuth("https://example.test", "secret-key")
        auth = Mock()
        user = SimpleNamespace(id="test-id", email="other@example.test", email_confirmed_at=True, is_anonymous=False)
        auth.get_user.return_value = SimpleNamespace(user=user)
        @contextmanager
        def client():
            yield SimpleNamespace(auth=auth)
        with patch.object(adapter, "client", client):
            with self.assertRaises(DomainError):
                adapter.reset_password("access", "refresh", "new-password", {"owner@example.test"})
            auth.update_user.assert_not_called()
            user.email = "owner@example.test"
            self.assertEqual(adapter.reset_password("access", "refresh", "new-password", {user.email}), "test-id")
            auth.update_user.assert_called_once_with({"password": "new-password"})

    def test_provider_failure_is_classified_without_secrets(self):
        adapter = SupabaseAuth("https://example.test", "secret-key")
        @contextmanager
        def failed_client():
            raise AuthApiError("password=do-not-log token=private owner@example.test", 400, "invalid_credentials")
            yield
        with patch.object(adapter, "client", failed_client), self.assertLogs("vibelearn.auth") as logs:
            with self.assertRaises(DomainError) as failure:
                adapter.login("owner@example.test", "do-not-log")
        self.assertEqual(failure.exception.status, 401)
        record = json.loads(logs.records[0].message)
        self.assertEqual(record["reason"], "invalid_credentials")
        self.assertEqual(record["provider_status"], 400)
        for secret in ("do-not-log", "private", "owner@example.test", "secret-key"):
            self.assertNotIn(secret, logs.records[0].message)
        self.assertNotIn("confirmation", failure.exception.message)

    def test_unknown_provider_code_does_not_leak(self):
        from app.auth import log_auth_failure
        with self.assertLogs("vibelearn.auth") as logs:
            log_auth_failure("login", AuthApiError("secret", 401, "secret-code"))
        self.assertEqual(json.loads(logs.records[0].message)["reason"], "provider_error")
        self.assertNotIn("secret", logs.records[0].message)
