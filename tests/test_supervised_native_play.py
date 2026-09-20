import json
import tempfile
import unittest
from pathlib import Path

from tools.supervised_native_play import supervise
from tools.native_play_execution import validate_native_artifacts
from tests.test_native_preflight import fixture_preflight


class SupervisedBridgeTests(unittest.IsolatedAsyncioTestCase):
    async def run_bridge(self, *, bad_ack=False, succeeded=True):
        config = {
            "requirements": {"mode": "native_gui", "max_inputs": 1,
                             "required_capabilities": ["ax", "click"],
                             "required_checkpoints": ["result"]},
            "identity": {"candidate_sha": "test", "assignment_id": "task",
                         "session_id": "session", "capabilities": ["ax", "click"],
                         "model": "test-model"},
        }
        config["preflight"] = fixture_preflight(config)
        queue = [dict(op="observe", text="Start"), dict(op="input", action="click", target=2),
                 dict(op="observe", text="Result"), dict(op="input", action="click", target=3),
                 dict(op="stop")]
        output = []

        class Reader:
            def readline(self):
                return json.dumps(queue.pop(0)) + "\n" if queue else ""

        with tempfile.TemporaryDirectory() as parent:
            root = Path(parent) / "run"

            def emit(item):
                output.append(item)
                if item["status"] == "permit":
                    self.assertTrue((root / "pending.json").exists())
                    queue.insert(0, dict(op="ack", permit_id="wrong" if bad_ack else item["permit_id"],
                                         succeeded=succeeded))

            await supervise(config, root, Reader(), emit)
            record = json.loads((root / "execution.json").read_text())
            validate_native_artifacts(record, root)
            self.assertEqual(sum(x["status"] == "permit" for x in output), 1)
            inputs = [x for x in record["events"] if x["kind"] == "input"]
            self.assertEqual(len(inputs), 1)
            self.assertEqual(inputs[0]["outcome"], "succeeded" if succeeded and not bad_ack else "failed")
            self.assertEqual((root / "pending.json").exists(), bad_ack)
            return output

    async def test_budget_blocks_second_dispatch(self):
        output = await self.run_bridge()
        self.assertTrue(any("budget exhausted" in x.get("reason", "") for x in output))

    async def test_failed_tool_attempt_consumes_budget(self):
        output = await self.run_bridge(succeeded=False)
        self.assertTrue(any("budget exhausted" in x.get("reason", "") for x in output))

    async def test_bad_ack_stops_with_pending_evidence(self):
        output = await self.run_bridge(bad_ack=True)
        self.assertEqual(output[-1]["status"], "rejected")
        self.assertNotIn("stopped", [x["status"] for x in output])
