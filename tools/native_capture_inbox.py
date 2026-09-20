"""Loopback-only screenshot inbox for supervised native browser captures.

The browser supervisor pastes base64 bytes returned by its screenshot tool into
this form. No page/game state is read by this server. One new staging directory
and unguessable per-process route; no overwrite, uploads bounded to 8 MiB.
"""
import argparse
import base64
import hashlib
import html
import json
import secrets
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs

MAX_CAPTURE_BYTES = 8 * 1024 * 1024
MAX_REQUEST_BYTES = 12 * 1024 * 1024


def screenshot_extension(data):
    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24 and data[12:16] == b"IHDR":
        return ".png"
    if data.startswith(b"\xff\xd8\xff") and data.endswith(b"\xff\xd9"):
        return ".jpg"
    if len(data) >= 16 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    raise ValueError("capture needs PNG, JPEG or WebP image bytes")


def retain_capture(root, encoded):
    data = base64.b64decode(encoded, validate=True)
    if not data or len(data) > MAX_CAPTURE_BYTES:
        raise ValueError("capture size outside limit")
    suffix = screenshot_extension(data)
    ref = secrets.token_hex(12) + suffix
    with (Path(root) / ref).open("xb") as stream:
        stream.write(data)
    return dict(ref=ref, sha256=hashlib.sha256(data).hexdigest(), modality="screenshot", bytes=len(data))


def handler(root, route, authority):
    class Inbox(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def page(self, status, message=""):
            body = ("<!doctype html><meta charset=utf-8><title>Native capture inbox</title>"
                    "<h1>Native capture inbox</h1><p>Local supervisor evidence transfer.</p>"
                    f"<pre>{html.escape(message)}</pre><form method=post action='{route}'>"
                    "<label>Screenshot bytes (base64)<textarea name=data rows=4 cols=70></textarea></label>"
                    "<p><button>Retain capture</button></p></form>").encode()
            self.send_response(status)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Security-Policy", "default-src 'none'; form-action 'self'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(body)

        def allowed(self):
            return self.path == route and self.headers.get("Host") == authority

        def do_GET(self):
            if not self.allowed():
                self.send_error(404)
                return
            self.page(200)

        def do_POST(self):
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if not 0 < length <= MAX_REQUEST_BYTES:
                    raise ValueError("request size outside limit")
                # Consume bounded form bodies before rejecting their origin.
                # Closing with unread bytes can reset the connection on Windows
                # before the client receives the intended rejection response.
                self.connection.settimeout(5)
                body = self.rfile.read(length)
                if not self.allowed() or self.headers.get("Origin") != "http://" + authority:
                    self.send_error(403)
                    return
                if self.headers.get("Content-Type", "").split(";")[0] != "application/x-www-form-urlencoded":
                    raise ValueError("form encoding required")
                fields = parse_qs(body.decode("ascii"), strict_parsing=True)
                if set(fields) != {"data"} or len(fields["data"]) != 1:
                    raise ValueError("one capture is required")
                result = retain_capture(root, fields["data"][0])
                self.page(200, json.dumps(result))
            except (ValueError, UnicodeError) as exc:
                self.page(400, str(exc))
    return Inbox


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--port", type=int, default=8054)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    route = "/capture/" + secrets.token_urlsafe(24)
    authority = f"127.0.0.1:{args.port}"
    server = HTTPServer(("127.0.0.1", args.port), handler(args.output, route, authority))
    print(json.dumps(dict(url="http://" + authority + route)), flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
