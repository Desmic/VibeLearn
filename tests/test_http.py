import json
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from pathlib import Path
from app.server import make_server


class HttpTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.server = make_server(Path(self.directory.name) / "http.sqlite3", 0)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.cleanup)

    def cleanup(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join()
        self.directory.cleanup()

    def request(self, method, path, data=None, headers=None):
        connection = HTTPConnection("127.0.0.1", self.server.server_port, timeout=5)
        try:
            connection.request(method, path, json.dumps(data) if data is not None else None, headers or {})
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), json.loads(response.read())
        finally:
            connection.close()

    def test_host_origin_and_command_boundary(self):
        for headers in [{"Host": "attacker.example"}, {}, {"Content-Type": "application/json", "X-Learning-Command": "1", "Origin": "https://attacker.example"}]:
            self.assertEqual(self.request("POST", "/api/session", {}, headers)[0], 403)
        good = {"Content-Type": "application/json", "X-Learning-Command": "1"}
        status, headers, state = self.request("POST", "/api/session", {}, good)
        self.assertEqual(status, 200)
        self.assertIn("HttpOnly", headers["Set-Cookie"])
        self.assertIn("SameSite=Strict", headers["Set-Cookie"])
        self.assertEqual(self.request("GET", "/api/state")[0], 401)
        good["Cookie"] = headers["Set-Cookie"].split(";")[0]
        self.assertEqual(self.request("GET", "/api/state", headers=good)[2]["learner_id"], state["learner_id"])
        self.assertEqual(self.request("GET", "/../data/learning.sqlite3", headers=good)[0], 404)
        self.assertEqual(self.request("POST", "/api/session", [], good)[0], 400)
        self.assertEqual(self.request("POST", "/api/commands/start", {"command_id": "command-test", "expected_revision": 0, "mode": []}, good)[0], 400)

    def test_manifest_identifies_running_source_and_schema(self):
        status, headers, health = self.request("GET", "/api/health")
        self.assertEqual(status, 200)
        self.assertEqual(health["schema_version"], 5)
        self.assertEqual(len(health["source_digest"]), 64)
        self.assertIn("web/app.js", health["files"])
        self.assertEqual(health["user_acceptance"], "pending")
