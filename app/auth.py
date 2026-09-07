"""Supabase Auth adapter. Each operation owns its client and never shares a session."""
from contextlib import contextmanager
import logging
import json
import httpx
from flask import g, has_request_context
from supabase import create_client, ClientOptions
from supabase_auth.errors import AuthApiError, AuthRetryableError
from app.service import DomainError

logger = logging.getLogger("vibelearn.auth")


def log_auth_failure(operation, error=None, reason=None):
    # Only fixed classifications, never provider messages, credentials or identities.
    code = getattr(error, "code", None)
    known = {"invalid_credentials", "email_not_confirmed", "user_banned",
             "over_request_rate_limit", "over_email_send_rate_limit",
             "bad_jwt", "session_not_found", "user_not_found", "unexpected_failure"}
    reason = reason or (code if code in known else "provider_error")
    status = getattr(error, "status", None)
    logger.warning(json.dumps({"event": "auth_failure", "operation": operation,
        "reason": reason, "provider_status": status if isinstance(status, int) else None,
        "request_id": getattr(g, "request_id", None) if has_request_context() else None}))


class SupabaseAuth:
    def __init__(self, url, key):
        self.url, self.key = url, key

    @contextmanager
    def client(self):
        with httpx.Client(timeout=8.0) as transport:
            yield create_client(self.url, self.key, options=ClientOptions(
                persist_session=False, auto_refresh_token=False, httpx_client=transport,
                flow_type="implicit"  # Recovery links can open in a different browser.
            ))

    def login(self, email, password):
        try:
            with self.client() as client:
                result = client.auth.sign_in_with_password({"email": email, "password": password})
                if not result.session:
                    log_auth_failure("login", reason="missing_session")
                    raise DomainError("UNAUTHENTICATED", "Sign-in failed. Check your email and password.", 401)
                return result.session.access_token, min(int(result.session.expires_in), 3600)
        except AuthApiError as error:
            log_auth_failure("login", error)
            if error.status >= 500 or error.status == 429:
                raise DomainError("AUTH_UNAVAILABLE", "Sign-in is temporarily unavailable. Please retry later.", 503) from error
            if getattr(error, "code", None) == "email_not_confirmed":
                raise DomainError("UNAUTHENTICATED", "Confirm your email before signing in.", 401) from error
            raise DomainError("UNAUTHENTICATED", "Sign-in failed. Check your email and password. If needed, ask the pilot owner to reset your password.", 401) from error
        except (httpx.HTTPError, AuthRetryableError) as error:
            log_auth_failure("login", reason="transport_error")
            raise DomainError("AUTH_UNAVAILABLE", "Sign-in is temporarily unavailable. Please retry.", 503) from error

    def user(self, access_token):
        try:
            with self.client() as client:
                user = client.auth.get_user(access_token).user
                if not user or not user.email_confirmed_at or user.is_anonymous:
                    log_auth_failure("verify_user", reason="unconfirmed_or_anonymous")
                    raise DomainError("UNAUTHENTICATED", "Sign in with your confirmed email account.", 401)
                return {"id": user.id, "email": (user.email or "").lower()}
        except AuthApiError as error:
            log_auth_failure("verify_user", error)
            if error.status >= 500 or error.status == 429:
                raise DomainError("AUTH_UNAVAILABLE", "Sign-in verification is temporarily unavailable.", 503) from error
            raise DomainError("UNAUTHENTICATED", "Your session expired. Sign in again to resume.", 401) from error
        except (httpx.HTTPError, AuthRetryableError) as error:
            log_auth_failure("verify_user", reason="transport_error")
            raise DomainError("AUTH_UNAVAILABLE", "Sign-in verification is temporarily unavailable.", 503) from error

    def request_reset(self, email, origin):
        try:
            with self.client() as client:
                client.auth.reset_password_for_email(email, {"redirect_to": origin})
        except (AuthApiError, AuthRetryableError, httpx.HTTPError) as error:
            log_auth_failure("request_reset", error)
            raise DomainError("AUTH_UNAVAILABLE", "Could not send a reset email. Please retry shortly.", 503) from error

    def reset_password(self, access, refresh, password, allowed):
        try:
            with self.client() as client:
                client.auth.set_session(access, refresh)
                user = client.auth.get_user().user
                if not user or not user.email_confirmed_at or user.is_anonymous or (user.email or "").lower() not in allowed:
                    raise DomainError("FORBIDDEN", "This reset link cannot be used for this pilot.", 403)
                client.auth.update_user({"password": password})
                return user.id
        except (AuthApiError, AuthRetryableError, httpx.HTTPError) as error:
            log_auth_failure("reset_password", error)
            raise DomainError("RESET_FAILED", "The reset link may have expired, or the password was rejected. Request a new link and choose a different password.", 400) from error
