"""Optional private-pilot test identity layered over the real auth provider.

The test credential is supplied only through deployment environment variables. No
password or signing secret is committed to source. Normal users continue through
Supabase Auth unchanged.
"""
import hashlib
import hmac
import secrets
from uuid import UUID

from app.service import DomainError


class PilotAuth:
    PREFIX = "vlt"

    def __init__(self, provider, *, name, password, user_id, secret):
        self.provider = provider
        self.name = name.strip().lower()
        self.password = password
        self.user_id = str(UUID(user_id))
        self.secret = secret.encode("utf-8")
        if not self.name or not self.password or len(secret) < 24:
            raise RuntimeError("Test-user configuration is incomplete or unsafe")

    @classmethod
    def configure(cls, provider, settings):
        name = settings.get("TEST_USER_NAME", "").strip().lower()
        password = settings.get("TEST_USER_PASSWORD", "")
        user_id = settings.get("TEST_USER_ID", "")
        secret = settings.get("TEST_USER_SECRET", "")
        configured = any((name, password, user_id, secret))
        if not configured:
            return provider, None
        if not all((name, password, user_id, secret)):
            raise RuntimeError("Set TEST_USER_NAME, TEST_USER_PASSWORD, TEST_USER_ID and TEST_USER_SECRET together")
        return cls(provider, name=name, password=password, user_id=user_id, secret=secret), name

    def _signature(self, nonce):
        payload = f"{self.name}:{self.user_id}:{nonce}".encode("utf-8")
        return hmac.new(self.secret, payload, hashlib.sha256).hexdigest()

    def login(self, identifier, password):
        if identifier.strip().lower() != self.name:
            return self.provider.login(identifier, password)
        if not hmac.compare_digest(password, self.password):
            raise DomainError("UNAUTHENTICATED", "Sign-in failed. Check your player name and password.", 401)
        nonce = secrets.token_urlsafe(24)
        return f"{self.PREFIX}.{nonce}.{self._signature(nonce)}", 3600

    def user(self, token):
        if not token.startswith(self.PREFIX + "."):
            return self.provider.user(token)
        parts = token.split(".")
        if len(parts) != 3 or not parts[1] or not hmac.compare_digest(parts[2], self._signature(parts[1])):
            raise DomainError("UNAUTHENTICATED", "Your test session expired. Sign in again.", 401)
        return {"id": self.user_id, "email": self.name}

    def request_reset(self, identifier, origin):
        if identifier.strip().lower() == self.name:
            return None
        return self.provider.request_reset(identifier, origin)

    def reset_password(self, access, refresh, password, allowed):
        return self.provider.reset_password(access, refresh, password, allowed)
