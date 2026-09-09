"""WSGI deployment entry point. Hosted mode always requires authenticated access."""
import os
import secrets
import sqlite3
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
from uuid import UUID

import psycopg
from flask import Flask, jsonify, request, send_from_directory, g
from werkzeug.exceptions import HTTPException
from app import service
from app.auth import SupabaseAuth
from app.pilot_auth import PilotAuth
from app.manifest import manifest
from app.storage import is_postgres, migrate, transaction

ROOT = Path(__file__).resolve().parent.parent
COOKIE = "__Host-vibelearn-session"
ACCESS_COOKIE = "__Host-vibelearn-access"


def create_app(config=None, auth_provider=None):
    settings = dict(os.environ if config is None else config)
    database = settings.get("DATABASE_URL", "")
    origin = settings.get("APP_ORIGIN", "").rstrip("/")
    parsed = urlsplit(origin)
    testing = settings.get("TESTING") is True
    if not testing and not is_postgres(database):
        raise RuntimeError("Hosted mode requires a PostgreSQL DATABASE_URL")
    if not testing and parse_qs(urlsplit(database).query).get("sslmode", [""])[0] not in ("require", "verify-ca", "verify-full"):
        raise RuntimeError("Hosted database connections must require TLS")
    if parsed.scheme != "https" or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username:
        raise RuntimeError("APP_ORIGIN must be the exact HTTPS origin of this deployment")
    allowed = {email.strip().lower() for email in settings.get("ALLOWED_EMAILS", "").split(",") if email.strip()}
    if not allowed:
        raise RuntimeError("Set ALLOWED_EMAILS for this private pilot")
    if auth_provider is None:
        auth_url = settings.get("SUPABASE_URL", "")
        key = settings.get("SUPABASE_PUBLISHABLE_KEY", "")
        auth_parts = urlsplit(auth_url)
        if auth_parts.scheme != "https" or not auth_parts.hostname or auth_parts.path not in ("", "/") or not key:
            raise RuntimeError("Configure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY")
        auth_provider = SupabaseAuth(auth_url.rstrip("/"), key)
    auth_provider, test_name = PilotAuth.configure(auth_provider, settings)
    if test_name:
        allowed.add(test_name)
    migrate(database)
    app = Flask(__name__, static_folder=None)
    app.config.update(TESTING=testing, MAX_CONTENT_LENGTH=65536)
    identity = manifest() | {"activation": "hosted_private_pilot", "database": "postgresql", "schema_version": 1}

    def verified_user():
        token = request.cookies.get(ACCESS_COOKIE)
        local_token = request.cookies.get(COOKIE)
        if not token or not local_token:
            raise service.DomainError("UNAUTHENTICATED", "Sign in to open your workspace.", 401)
        user = auth_provider.user(token)
        if user["email"] not in allowed:
            raise service.DomainError("FORBIDDEN", "This account does not have access to this private pilot.", 403)
        learner = str(UUID(user["id"]))
        with transaction(database, learner=learner) as db:
            row = db.execute("SELECT learner_id, expires_at FROM hosted_sessions WHERE token_hash=? AND learner_id=?", (service.token_hash(local_token), learner)).fetchone()
            if not row or datetime.fromisoformat(row["expires_at"]) <= datetime.now(timezone.utc):
                raise service.DomainError("UNAUTHENTICATED", "Your session expired. Sign in again to resume.", 401)
        return learner

    @app.before_request
    def boundary():
        g.request_id = secrets.token_hex(8)
        g.request_started = time.monotonic()
        if request.host != parsed.netloc:
            raise service.DomainError("FORBIDDEN", "Unknown application host.", 403)
        if request.method not in ("GET", "HEAD", "OPTIONS"):
            if request.headers.get("Origin") != origin or request.headers.get("X-Learning-Command") != "1":
                raise service.DomainError("FORBIDDEN", "Cross-origin commands are disabled.", 403)
            if request.mimetype != "application/json":
                raise service.DomainError("INVALID_CONTENT_TYPE", "Send JSON.", 415)

    @app.after_request
    def headers(response):
        response.headers["X-Request-ID"] = g.request_id
        tracked = {"login", "logout", "request_reset", "reset_password", "reset_progress"}
        if request.endpoint in tracked or response.status_code >= 500:
            logging.getLogger("vibelearn.requests").warning(json.dumps({
                "event": "request_completed", "request_id": g.request_id,
                "endpoint": request.endpoint if request.endpoint in tracked | {"health", "state", "command", "rescue_history"} else "other",
                "status": response.status_code,
                "duration_ms": round((time.monotonic() - g.request_started) * 1000)}))
        response.headers.update({
            "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer", "Strict-Transport-Security": "max-age=31536000",
            "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
        })
        return response

    @app.errorhandler(service.DomainError)
    def domain_error(error):
        return jsonify(error=error.code, message=error.message, request_id=g.request_id), error.status

    @app.errorhandler(psycopg.Error)
    @app.errorhandler(sqlite3.Error)
    def storage_error(error):
        return jsonify(error="STORAGE_UNAVAILABLE", message="Storage is unavailable. Your visible answer is retained; retry shortly.", request_id=g.request_id), 503

    @app.errorhandler(HTTPException)
    def http_error(error):
        return jsonify(error="INVALID_REQUEST", message=error.name), error.code

    @app.get("/")
    def index():
        return send_from_directory(ROOT / "web", "index.html")

    @app.get("/<asset>")
    def asset(asset):
        if asset not in (
            "rescue.js", "rescue.css", "rescue-intro.js", "rescue-intro.css",
            "rescue-chapter1.js", "rescue-chapter1.css", "auth-game.js", "auth-game.css",
            "progress-controls.js", "progress-controls.css",
            "relay-repair-kit.zip", "app.js", "style.css", "premium.css", "game.css",
            "expedition.js", "expedition.css", "valley3d.js"
        ):
            raise service.DomainError("NOT_FOUND", "Not found.", 404)
        return send_from_directory(ROOT / "web", asset)

    @app.get("/vendor/<name>")
    def vendor_asset(name):
        if name not in ("three.module.min.js", "three.core.min.js", "THREE-LICENSE.txt"):
            raise service.DomainError("NOT_FOUND", "Not found.", 404)
        return send_from_directory(ROOT / "web" / "vendor", name)

    @app.get("/api/config")
    def configuration():
        return jsonify(hosted=True, auth="supabase", sign_in_required=True)

    @app.get("/api/health")
    def health():
        with transaction(database) as db:
            db.execute("SELECT 1").fetchone()
        return jsonify(status="ok", **identity)

    @app.post("/api/auth/login")
    def login():
        body = request.get_json()
        if not isinstance(body, dict) or set(body) != {"email", "password"} or any(not isinstance(v, str) for v in body.values()) or not 1 <= len(body["email"]) <= 320 or not 1 <= len(body["password"]) <= 4096:
            raise service.DomainError("INVALID_REQUEST", "Enter your email or player name and password.")
        identifier = body["email"].strip().lower()
        if identifier not in allowed:
            raise service.DomainError("UNAUTHENTICATED", "Check your sign-in details and pilot access.", 401)
        access, ttl = auth_provider.login(identifier, body["password"])
        user = auth_provider.user(access)
        if user["email"] != identifier:
            raise service.DomainError("FORBIDDEN", "The signed-in account does not match.", 403)
        learner = str(UUID(user["id"]))
        local_token = secrets.token_urlsafe(32)
        expires = (datetime.now(timezone.utc) + timedelta(seconds=ttl)).isoformat()
        with transaction(database, learner=learner, lock=True) as db:
            db.execute("INSERT INTO learners (id, profile, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING", (learner, service.encode({"basis": "No experience profile supplied; not measured mastery"}), service.now()))
            old = request.cookies.get(COOKIE)
            if old:
                db.execute("DELETE FROM hosted_sessions WHERE token_hash=? AND learner_id=?", (service.token_hash(old), learner))
            db.execute("DELETE FROM hosted_sessions WHERE learner_id=? AND expires_at<=?", (learner, service.now()))
            db.execute("INSERT INTO hosted_sessions (token_hash, learner_id, expires_at) VALUES (?, ?, ?)", (service.token_hash(local_token), learner, expires))
        result = jsonify(ok=True)
        for name, value in ((COOKIE, local_token), (ACCESS_COOKIE, access)):
            result.set_cookie(name, value, max_age=ttl, secure=True, httponly=True, samesite="Strict", path="/")
        return result

    @app.post("/api/auth/logout")
    def logout():
        learner = verified_user()
        with transaction(database, learner=learner) as db:
            db.execute("DELETE FROM hosted_sessions WHERE token_hash=? AND learner_id=?", (service.token_hash(request.cookies[COOKIE]), learner))
        result = jsonify(ok=True)
        for name in (COOKIE, ACCESS_COOKIE):
            result.delete_cookie(name, secure=True, httponly=True, samesite="Strict", path="/")
        return result

    @app.post("/api/auth/request-reset")
    def request_reset():
        body = request.get_json()
        if not isinstance(body, dict) or set(body) != {"email"} or not isinstance(body["email"], str) or not 1 <= len(body["email"]) <= 320:
            raise service.DomainError("INVALID_REQUEST", "Enter your email or player name.")
        identifier = body["email"].strip().lower()
        if identifier in allowed:
            auth_provider.request_reset(identifier, origin)
        return jsonify(ok=True, message="If this account supports password recovery, a reset link will arrive shortly.")

    @app.post("/api/auth/reset-password")
    def reset_password():
        body = request.get_json()
        if not isinstance(body, dict) or set(body) != {"access_token", "refresh_token", "password"} or any(not isinstance(v, str) for v in body.values()) or not 6 <= len(body["password"]) <= 4096 or any(not 1 <= len(body[k]) <= 8192 for k in ("access_token", "refresh_token")):
            raise service.DomainError("INVALID_REQUEST", "Use a valid reset link and a password of at least 6 characters.")
        learner = str(UUID(auth_provider.reset_password(body["access_token"], body["refresh_token"], body["password"], allowed)))
        with transaction(database, learner=learner) as db:
            db.execute("DELETE FROM hosted_sessions WHERE learner_id=?", (learner,))
        result = jsonify(ok=True)
        for name in (COOKIE, ACCESS_COOKIE):
            result.delete_cookie(name, secure=True, httponly=True, samesite="Strict", path="/")
        return result

    @app.get("/api/history/rescue/<mission_id>")
    def rescue_history(mission_id):
        learner = verified_user()
        with transaction(database, learner=learner) as db:
            rows = db.execute("SELECT * FROM attempts WHERE learner_id=? AND status='submitted' ORDER BY rowid DESC", (learner,)).fetchall()
            for row in rows:
                snapshot = json.loads(row["snapshot"])
                if "rescue" in snapshot and snapshot.get("mission", {}).get("id") == mission_id:
                    return jsonify(service.attempt_view(db, row))
        raise service.DomainError("NOT_FOUND", "No completed run exists for that signal.", 404)

    @app.post("/api/progress/reset")
    def reset_progress():
        body = request.get_json()
        if body != {"confirmation": "RESET_PROGRESS"}:
            raise service.DomainError("CONFIRMATION_REQUIRED", "Confirm the full progress reset in the game first.", 400)
        learner = verified_user()
        with transaction(database, learner=learner, lock=True) as db:
            if is_postgres(database):
                db.execute("SELECT vibelearn.reset_current_learner_progress()").fetchone()
            else:
                for table in ("reviews", "rewards", "evidence", "assistance", "checkpoints", "commands", "attempts"):
                    db.execute(f"DELETE FROM {table} WHERE learner_id=?", (learner,))
        return jsonify(service.state(database, learner))

    @app.route("/api/session", methods=["POST"])
    @app.route("/api/state", methods=["GET"])
    def state():
        return jsonify(service.state(database, verified_user()))

    @app.post("/api/commands/<action>")
    def command(action):
        return jsonify(service.command(database, verified_user(), action, request.get_json()))

    return app
