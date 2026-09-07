"""Supabase Auth adapter. Each operation owns its client and never shares a session."""
from contextlib import contextmanager
import httpx
from supabase import create_client, ClientOptions
from supabase_auth.errors import AuthApiError, AuthRetryableError
from app.service import DomainError


class SupabaseAuth:
    def __init__(self, url, key):
        self.url, self.key = url, key

    @contextmanager
    def client(self):
        with httpx.Client(timeout=8.0) as transport:
            yield create_client(self.url, self.key, options=ClientOptions(
                persist_session=False, auto_refresh_token=False, httpx_client=transport
            ))

    def login(self, email, password):
        try:
            with self.client() as client:
                result = client.auth.sign_in_with_password({"email": email, "password": password})
                if not result.session:
                    raise DomainError("UNAUTHENTICATED", "Check your email confirmation and sign-in details.", 401)
                return result.session.access_token, min(int(result.session.expires_in), 3600)
        except AuthApiError as error:
            if error.status >= 500 or error.status == 429:
                raise DomainError("AUTH_UNAVAILABLE", "Sign-in is temporarily unavailable. Please retry later.", 503) from error
            raise DomainError("UNAUTHENTICATED", "Check your email confirmation and sign-in details.", 401) from error
        except (httpx.HTTPError, AuthRetryableError) as error:
            raise DomainError("AUTH_UNAVAILABLE", "Sign-in is temporarily unavailable. Please retry.", 503) from error

    def user(self, access_token):
        try:
            with self.client() as client:
                user = client.auth.get_user(access_token).user
                if not user or not user.email_confirmed_at or user.is_anonymous:
                    raise DomainError("UNAUTHENTICATED", "Sign in with your confirmed email account.", 401)
                return {"id": user.id, "email": (user.email or "").lower()}
        except AuthApiError as error:
            if error.status >= 500 or error.status == 429:
                raise DomainError("AUTH_UNAVAILABLE", "Sign-in verification is temporarily unavailable.", 503) from error
            raise DomainError("UNAUTHENTICATED", "Your session expired. Sign in again to resume.", 401) from error
        except (httpx.HTTPError, AuthRetryableError) as error:
            raise DomainError("AUTH_UNAVAILABLE", "Sign-in verification is temporarily unavailable.", 503) from error
