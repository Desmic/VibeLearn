import asyncio
import copy
import hashlib
import json
import unittest
import tempfile
from pathlib import Path

from tools.native_play_execution import NativePlayGuard, validate_native_execution, validate_native_artifacts
from tools.critic_execution_receipt import build_receipt, validate_receipt
from tools.validate_critic_result import validate_result
from tools.build_critic_assignments import build_assignments
from tools.materialize_critic_capsule import materialize
from tests import test_critic_result_validation as legacy_results


IDENTITY = dict(candidate_sha="a" * 40, assignment_id="sha256:" + "1" * 64, session_id="run-1")


def requirements(max_inputs=2, checkpoint="maze.exit"):
    return dict(mode="native_gui", max_inputs=max_inputs,
                required_capabilities=["screenshot", "keyboard"], required_checkpoints=[checkpoint])


def capture(ref):
    async def call():
        return dict(ref=ref, sha256=hashlib.sha256(ref.encode()).hexdigest())
    return call


class NativeGuardTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.sent = 0
        self.guard = NativePlayGuard(requirements(1), **IDENTITY, model="gpt-5.6-luna", capabilities=["screenshot", "keyboard"])

    async def send(self):
        self.sent += 1

    async def test_budget_blocks_before_dispatch_not_after(self):
        await self.guard.observe(capture("before"))
        await self.guard.input("key", self.send)
        await self.guard.observe(capture("after"))
        with self.assertRaisesRegex(ValueError, "budget exhausted"):
            await self.guard.input("key", self.send)
        self.assertEqual(self.sent, 1)
        record = await self.guard.export()
        summary = validate_native_execution(requirements(1), record, **IDENTITY)
        self.assertEqual((summary["input_count"], summary["observation_count"]), (1, 2))

    async def test_failed_send_consumes_attempt_and_needs_observation(self):
        async def fail():
            raise RuntimeError("transport lost acknowledgement")
        await self.guard.observe(capture("before"))
        with self.assertRaises(RuntimeError):
            await self.guard.input("click", fail)
        record = await self.guard.export()
        self.assertEqual(record["events"][-1]["outcome"], "failed")
        with self.assertRaisesRegex(ValueError, "budget exhausted"):
            await self.guard.input("click", self.send)

    async def test_input_requires_real_observation_callback(self):
        with self.assertRaisesRegex(ValueError, "fresh observation"):
            await self.guard.input("key", self.send)
        self.assertEqual(self.sent, 0)

    async def test_cannot_batch_inputs_without_reobservation(self):
        guard = NativePlayGuard(requirements(2), **IDENTITY, model="gpt-5.6-luna", capabilities=["screenshot", "keyboard"])
        await guard.observe(capture("before"))
        await guard.input("key", self.send)
        with self.assertRaisesRegex(ValueError, "fresh observation"):
            await guard.input("key", self.send)
        self.assertEqual(self.sent, 1)

    async def test_concurrent_dispatch_cannot_overrun_ceiling(self):
        await self.guard.observe(capture("before"))
        results = await asyncio.gather(self.guard.input("key", self.send),
                                       self.guard.input("key", self.send), return_exceptions=True)
        self.assertEqual(self.sent, 1)
        self.assertEqual(sum(isinstance(x, ValueError) for x in results), 1)

    async def test_checkpoint_must_reference_observed_capture(self):
        await self.guard.observe(capture("before"))
        with self.assertRaisesRegex(ValueError, "observed capture"):
            await self.guard.verify_checkpoint("maze.exit", "invented")

    async def test_success_stops_padding_on_unrelated_task(self):
        guard = NativePlayGuard(requirements(4, "garden.resumed"), **IDENTITY, model="gpt-5.6-luna",
                                capabilities=["screenshot", "keyboard"])
        await guard.observe(capture("before"))
        await guard.input("reload", self.send)
        await guard.observe(capture("resumed"))
        await guard.verify_checkpoint("garden.resumed", "resumed")
        with self.assertRaisesRegex(ValueError, "complete; stop"):
            await guard.input("click", self.send)
        self.assertEqual(self.sent, 1)

    async def test_export_is_defensive_copy(self):
        await self.guard.observe(capture("before"))
        record = await self.guard.export()
        record["events"].clear()
        self.assertEqual(len((await self.guard.export())["events"]), 1)

    async def test_missing_capability_rejected_before_any_input(self):
        with self.assertRaisesRegex(ValueError, "capabilities unavailable"):
            NativePlayGuard(requirements(), **IDENTITY, model="gpt-5.6-luna", capabilities=["screenshot"])


class NativeReceiptTests(unittest.TestCase):
    def setUp(self):
        legacy_results.CriticResultValidationTests.setUp(self)
        self.assignment["execution_requirements"] = requirements()
        payload = {k: v for k, v in self.assignment.items() if k != "assignment_id"}
        self.assignment["assignment_id"] = "sha256:" + hashlib.sha256(
            json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        self.capsule = materialize(self.assignment, self.root, self.capsule_dir.parent / "native-capsule")
        self.result["assignment_id"] = self.assignment["assignment_id"]
        self.execution = dict(schema="vibelearn.native-play.v1", model="gpt-5.6-luna", candidate_sha=self.sha,
                              assignment_id=self.assignment["assignment_id"], session_id="session-1",
                              verified_capabilities=["screenshot", "keyboard"],
                              events=[dict(kind="observation", ref="before", sha256="1"*64),
                                      dict(kind="input", action="key", outcome="succeeded"),
                                      dict(kind="observation", ref="after", sha256="2"*64)],
                              checkpoints={"maze.exit": "after"})

    def make_receipt(self):
        return build_receipt(self.assignment, "harness", "session-1", self.evidence,
                             capsule_id=self.capsule["capsule_id"], native_execution=self.execution)

    def test_native_pass_and_v2_roundtrip(self):
        receipt = self.make_receipt()
        self.assertEqual(receipt["schema"], "vibelearn.critic-execution-receipt.v2")
        self.assertEqual(validate_receipt(self.assignment, receipt), receipt)
        self.result["verdict"] = "pass"
        self.result["execution_receipt_id"] = receipt["receipt_id"]
        self.assertEqual(validate_result(self.assignment, self.result, receipt)["verdict"], "pass")

    def test_legacy_receipt_cannot_satisfy_native_assignment(self):
        with self.assertRaisesRegex(ValueError, "native play execution is required"):
            validate_receipt(self.assignment, self.receipt_without_native())

    def receipt_without_native(self):
        old = copy.deepcopy(self.assignment)
        del old["execution_requirements"]
        return build_receipt(old, "harness", "session-1", self.evidence)

    def test_missing_checkpoint_blocks_pass_but_preserves_unresolved(self):
        self.execution["checkpoints"] = {}
        receipt = self.make_receipt()
        self.result["execution_receipt_id"] = receipt["receipt_id"]
        self.result["verdict"] = "pass"
        with self.assertRaisesRegex(ValueError, "missing checkpoints"):
            validate_result(self.assignment, self.result, receipt)
        self.result["verdict"] = "unresolved"
        self.assertEqual(validate_result(self.assignment, self.result, receipt)["verdict"], "unresolved")

    def test_stills_without_input_cannot_pass(self):
        self.execution["events"] = [self.execution["events"][0]]
        self.execution["checkpoints"] = {"maze.exit": "before"}
        receipt = self.make_receipt()
        self.result.update(verdict="pass", execution_receipt_id=receipt["receipt_id"])
        with self.assertRaisesRegex(ValueError, "actual input"):
            validate_result(self.assignment, self.result, receipt)

    def test_failed_inputs_only_cannot_establish_live_pass(self):
        self.execution["events"][1]["outcome"] = "failed"
        receipt = self.make_receipt()
        self.result.update(verdict="pass", execution_receipt_id=receipt["receipt_id"])
        with self.assertRaisesRegex(ValueError, "successful input dispatch"):
            validate_result(self.assignment, self.result, receipt)

    def test_unobserved_last_action_cannot_pass(self):
        self.execution["events"].append(dict(kind="input", action="click", outcome="succeeded"))
        receipt = self.make_receipt()
        self.result.update(verdict="pass", execution_receipt_id=receipt["receipt_id"])
        with self.assertRaisesRegex(ValueError, "final observation"):
            validate_result(self.assignment, self.result, receipt)

    def test_reject_wrong_session_and_over_budget(self):
        self.execution["session_id"] = "other"
        with self.assertRaisesRegex(ValueError, "session_id mismatch"):
            self.make_receipt()
        self.execution["session_id"] = "session-1"
        self.assignment["execution_requirements"]["max_inputs"] = 1
        self.execution["events"].append(dict(kind="input", action="click", outcome="failed"))
        with self.assertRaisesRegex(ValueError, "budget exceeded"):
            self.make_receipt()

    def test_receipt_digest_covers_live_action_history(self):
        receipt = self.make_receipt()
        receipt["native_execution"]["events"][1]["action"] = "scroll"
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            validate_receipt(self.assignment, receipt)

    def test_requirements_are_bound_into_assignment_identity(self):
        index = dict(candidate_sha=self.sha, receipts=[])
        legacy = build_assignments(index)["physicality"]
        native = build_assignments(index, {"physicality": requirements()})["physicality"]
        self.assertNotEqual(legacy["assignment_id"], native["assignment_id"])
        with self.assertRaises(ValueError):
            build_assignments(index, {"unknown-pass": requirements()})


class NativeArtifactTests(unittest.TestCase):
    def test_sealing_verifies_bytes_and_rejects_changed_or_missing_capture(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "capture.txt"
            path.write_bytes(b"visible observation fixture")
            event = dict(kind="observation", ref="capture.txt",
                         sha256=hashlib.sha256(path.read_bytes()).hexdigest())
            execution = {"events": [event]}
            validate_native_artifacts(execution, folder)
            path.write_bytes(b"modified")
            with self.assertRaisesRegex(ValueError, "digest mismatch"):
                validate_native_artifacts(execution, folder)
            event["ref"] = "missing.txt"
            with self.assertRaisesRegex(ValueError, "unavailable"):
                validate_native_artifacts(execution, folder)

    def test_capture_cannot_escape_root(self):
        with tempfile.TemporaryDirectory() as folder:
            event = dict(kind="observation", ref="../outside.txt", sha256="a" * 64)
            with self.assertRaisesRegex(ValueError, "inside capture root"):
                validate_native_artifacts({"events": [event]}, folder)


if __name__ == "__main__":
    unittest.main()
