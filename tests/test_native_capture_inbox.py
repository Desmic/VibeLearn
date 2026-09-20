import base64
import hashlib
import json
import tempfile
import unittest
import http.client
import threading
from http.server import HTTPServer
from urllib.parse import urlencode
from pathlib import Path

from tools.native_capture_inbox import retain_capture, handler
from tools.supervised_native_play import supervise
from tools.native_play_execution import capture_repair_steps, validate_native_artifacts
from tests import test_native_capture_coverage as coverage
from tests.test_native_preflight import fixture_preflight

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=')


class CaptureInboxTests(unittest.TestCase):
    def test_retains_exact_bytes_with_no_overwrite(self):
        with tempfile.TemporaryDirectory() as root:
            one = retain_capture(root, base64.b64encode(PNG).decode())
            two = retain_capture(root, base64.b64encode(PNG).decode())
            self.assertNotEqual(one["ref"], two["ref"])
            self.assertEqual((Path(root) / one["ref"]).read_bytes(), PNG)
            self.assertEqual(one["sha256"], hashlib.sha256(PNG).hexdigest())

    def test_rejects_text_as_screenshot_and_invalid_base64(self):
        with tempfile.TemporaryDirectory() as root:
            for data in ("%%%", base64.b64encode(b"a confident screenshot description").decode()):
                with self.assertRaises(ValueError):
                    retain_capture(root, data)
            self.assertEqual(list(Path(root).iterdir()), [])

    def test_repair_distinguishes_collect_from_irrecoverable_boundary(self):
        record = coverage.execution()
        record["checkpoints"] = {}
        steps = capture_repair_steps(coverage.requirements(), record)
        self.assertEqual([s["next_step"] for s in steps], ["replay_in_new_run", "collect_and_verify"])
        record["events"] = record["events"][:1]
        steps = capture_repair_steps(coverage.requirements(), record)
        self.assertEqual([s["next_step"] for s in steps], ["collect_and_verify", "perform_assigned_action"])


class CaptureImportTests(unittest.IsolatedAsyncioTestCase):
    async def test_import_checks_scope_digest_and_copies_immutable_bytes(self):
        config = dict(requirements=coverage.requirements(), identity=dict(
            coverage.native.IDENTITY, model="test", capabilities=["screenshot", "reload"]))
        config["preflight"] = fixture_preflight(config)
        with tempfile.TemporaryDirectory() as parent:
            staging = Path(parent) / "staging"
            staging.mkdir()
            image = retain_capture(staging, base64.b64encode(PNG).decode())
            queue = [dict(op="observe_capture", ref="../outside.png", sha256=image["sha256"]),
                     dict(op="observe_capture", ref=image["ref"], sha256="0"*64),
                     dict(op="observe_capture", ref=image["ref"], sha256=image["sha256"]), dict(op="stop")]
            class Reader:
                def readline(self):
                    return json.dumps(queue.pop(0)) + "\n" if queue else ""
            output = []
            run = Path(parent) / "run"
            await supervise(config, run, Reader(), output.append, staging)
            self.assertEqual(sum(x["status"] == "rejected" for x in output), 2)
            record = json.loads((run / "execution.json").read_text())
            self.assertEqual(record["events"][0]["modality"], "screenshot")
            (staging / image["ref"]).write_bytes(b"changed source")
            validate_native_artifacts(record, run)
            followup = json.loads((run / "followup.json").read_text())
            self.assertFalse(followup["automatic_dispatch"])
            self.assertEqual(len(followup["capture_steps"]), 2)


class InboxHttpTests(unittest.TestCase):
    def test_only_scoped_same_origin_form_can_retain_capture(self):
        with tempfile.TemporaryDirectory() as root:
            server = HTTPServer(("127.0.0.1", 0), handler(root, "/capture/test", "pending"))
            authority = f"127.0.0.1:{server.server_port}"
            server.RequestHandlerClass = handler(root, "/capture/test", authority)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            try:
                for origin, path, expected in (("http://elsewhere.invalid", "/capture/test", 403),
                                               ("http://"+authority, "/capture/wrong", 403),
                                               ("http://"+authority, "/capture/test", 200)):
                    client = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=5)
                    client.request("POST", path, urlencode(dict(data=base64.b64encode(PNG).decode())),
                                   {"Origin": origin, "Content-Type": "application/x-www-form-urlencoded"})
                    response = client.getresponse()
                    self.assertEqual(response.status, expected)
                    response.read()
                    client.close()
                self.assertEqual(len(list(Path(root).iterdir())), 1)
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)
