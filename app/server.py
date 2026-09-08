"""Loopback HTTP transport. Static files are explicitly allowlisted."""
import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from http.cookies import SimpleCookie
import sqlite3
from app import service
from app.manifest import manifest
from urllib.parse import urlsplit

from app.storage import migrate

ROOT = Path(__file__).resolve().parent.parent


def make_server(database, port=8000):
    migrate(database)
    running_manifest = manifest()

    class Handler(BaseHTTPRequestHandler):
        def send(self, status, content, mime="application/json; charset=utf-8", cookie=None):
            payload = content if isinstance(content, bytes) else json.dumps(content).encode()
            self.send_response(status)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(payload)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("Referrer-Policy", "no-referrer")
            self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
            if cookie:
                self.send_header("Set-Cookie", cookie)
            self.end_headers()
            self.wfile.write(payload)

        def allowed_host(self):
            return self.headers.get("Host") in (f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}")

        def learner(self):
            cookies = SimpleCookie()
            try:
                cookies.load(self.headers.get("Cookie", ""))
            except Exception:
                return None
            token = cookies.get("learning_session")
            return service.resolve_session(database, token.value) if token else None

        def do_POST(self):
            if not self.allowed_host() or self.headers.get("X-Learning-Command") != "1":
                return self.send(403, {"error": "FORBIDDEN", "message": "Only local application commands are allowed."})
            origin = self.headers.get("Origin")
            if origin and origin != f"http://{self.headers.get('Host')}":
                return self.send(403, {"error": "FORBIDDEN", "message": "Cross-origin commands are disabled."})
            if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                return self.send(415, {"error": "INVALID_CONTENT_TYPE", "message": "Send JSON."})
            try:
                size = int(self.headers.get("Content-Length", "0"))
                if not 0 < size <= 65536:
                    raise service.DomainError("INVALID_COMMAND", "Request is empty or too large.")
                body = json.loads(self.rfile.read(size))
                if not isinstance(body, dict):
                    raise service.DomainError("INVALID_COMMAND", "Send a JSON object.")
                learner = self.learner()
                path = urlsplit(self.path).path
                if path == "/api/session":
                    cookie = None
                    if not learner:
                        token, learner = service.create_session(database)
                        cookie = f"learning_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000"
                    return self.send(200, service.state(database, learner), cookie=cookie)
                if not learner:
                    raise service.DomainError("UNAUTHENTICATED", "Open a local session first.", 401)
                if path.startswith("/api/commands/"):
                    return self.send(200, service.command(database, learner, path.rsplit("/", 1)[1], body))
                raise service.DomainError("NOT_FOUND", "Unknown command.", 404)
            except service.DomainError as error:
                return self.send(error.status, {"error": error.code, "message": error.message})
            except (ValueError, TypeError, UnicodeError):
                return self.send(400, {"error": "INVALID_JSON", "message": "The request could not be read."})
            except sqlite3.Error:
                return self.send(503, {"error": "STORAGE_UNAVAILABLE", "message": "Storage is unavailable. Your local answer is retained; retry shortly."})

        def do_GET(self):
            if not self.allowed_host():
                return self.send(403, {"error": "FORBIDDEN"})
            path = urlsplit(self.path).path
            if path == "/api/config":
                return self.send(200, {"hosted": False, "sign_in_required": False})
            if path == "/api/health":
                return self.send(200, {"status": "ok", **running_manifest})
            if path == "/api/state":
                try:
                    learner = self.learner()
                    if not learner:
                        return self.send(401, {"error": "UNAUTHENTICATED"})
                    return self.send(200, service.state(database, learner))
                except sqlite3.Error:
                    return self.send(503, {"error": "STORAGE_UNAVAILABLE", "message": "The database is unavailable. Retry shortly."})
            if path == "/storm":
                return self.send(200, (ROOT / "web" / "storm.html").read_bytes(), "text/html; charset=utf-8")
            assets = {"/storm.js": ("storm.js", "text/javascript"), "/storm.css": ("storm.css", "text/css"), "/retry-lab.py": ("retry-lab.py", "text/plain"), "/": ("index.html", "text/html"), "/app.js": ("app.js", "text/javascript"), "/style.css": ("style.css", "text/css"), "/premium.css": ("premium.css", "text/css"), "/game.css": ("game.css", "text/css"), "/expedition.js": ("expedition.js", "text/javascript"), "/expedition.css": ("expedition.css", "text/css"), "/valley3d.js": ("valley3d.js", "text/javascript"), "/vendor/three.module.min.js": ("vendor/three.module.min.js", "text/javascript"), "/vendor/three.core.min.js": ("vendor/three.core.min.js", "text/javascript"), "/vendor/THREE-LICENSE.txt": ("vendor/THREE-LICENSE.txt", "text/plain")}
            if path in assets:
                name, mime = assets[path]
                return self.send(200, (ROOT / "web" / name).read_bytes(), mime + "; charset=utf-8")
            return self.send(404, {"error": "NOT_FOUND"})

    return ThreadingHTTPServer(("127.0.0.1", port), Handler)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--db", default=str(ROOT / "data" / "learning.sqlite3"))
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    server = make_server(args.db, args.port)
    print(f"vibeLearn ready at http://127.0.0.1:{server.server_port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
