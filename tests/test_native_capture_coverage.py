import unittest
import hashlib
import json

from tests import test_native_play_execution as native
from tools.native_play_execution import NativePlayGuard, validate_native_execution, validate_requirements
from tools.validate_critic_result import validate_result
from tools.build_critic_assignments import build_assignments


def requirements():
    return dict(mode="native_gui", max_inputs=5, required_capabilities=["screenshot", "reload"],
                required_checkpoints=["before_resume", "after_resume"], capture_rules={
                    name: dict(modality="screenshot", action="reload", occurrence=1, relation=relation)
                    for name, relation in (("before_resume", "before"), ("after_resume", "after"))})


def observation(ref, modality="screenshot"):
    return dict(kind="observation", ref=ref, sha256="a" * 64, modality=modality)


def execution():
    return dict(schema="vibelearn.native-play.v1", model="test-model", **native.IDENTITY,
                verified_capabilities=["screenshot", "reload"],
                events=[observation("before"), dict(kind="input", action="reload", outcome="succeeded"),
                        observation("after")],
                checkpoints={"before_resume": "before", "after_resume": "after"})


class CaptureCoverageTests(unittest.TestCase):
    def test_capture_rules_change_assignment_identity(self):
        contract = requirements()
        first = build_assignments(dict(candidate_sha="a" * 40, receipts=[]), {"physicality": contract})
        contract["capture_rules"]["before_resume"]["modality"] = "ax"
        second = build_assignments(dict(candidate_sha="a" * 40, receipts=[]), {"physicality": contract})
        self.assertNotEqual(first["physicality"]["assignment_id"], second["physicality"]["assignment_id"])

    def gaps(self, record, contract=None):
        return validate_native_execution(contract or requirements(), record, **native.IDENTITY)["capture_gaps"]

    def test_complete_before_after_contract(self):
        self.assertEqual(self.gaps(execution()), [])

    def test_text_cannot_replace_requested_screenshot(self):
        for modality in ("ax", None):
            record = execution()
            if modality:
                record["events"][0]["modality"] = modality
            else:
                del record["events"][0]["modality"]
            self.assertEqual(self.gaps(record), [dict(checkpoint="before_resume", reason="wrong_or_unknown_modality")])

    def test_late_capture_cannot_fill_before_slot(self):
        record = execution()
        record["checkpoints"]["before_resume"] = "after"
        self.assertEqual(self.gaps(record)[0]["reason"], "wrong_side_of_action")

    def test_capture_must_be_adjacent_to_target_input(self):
        record = execution()
        record["events"][1:1] = [dict(kind="input", action="key", outcome="succeeded"), observation("newer")]
        self.assertEqual(self.gaps(record)[0]["reason"], "intervening_input")
        record = execution()
        record["events"][2:2] = [observation("interim"), dict(kind="input", action="click", outcome="succeeded")]
        self.assertEqual(self.gaps(record)[0]["reason"], "intervening_input")

    def test_failed_or_absent_action_does_not_establish_coverage(self):
        record = execution()
        record["events"][1]["outcome"] = "failed"
        self.assertEqual({x["reason"] for x in self.gaps(record)}, {"action_failed"})
        record["events"].pop(1)
        self.assertEqual({x["reason"] for x in self.gaps(record)}, {"missing_action"})

    def test_occurrence_cannot_be_satisfied_by_different_reload(self):
        contract = requirements()
        contract["capture_rules"]["after_resume"]["occurrence"] = 2
        self.assertEqual(self.gaps(execution(), contract)[0]["reason"], "missing_action")

    def test_invalid_rule_cannot_silently_weaken_contract(self):
        for field, value in (("modality", "text"), ("action", "teleport"), ("occurrence", True),
                             ("relation", "around"), ("extra", 1)):
            contract = requirements()
            contract["capture_rules"]["before_resume"][field] = value
            with self.assertRaises(ValueError):
                validate_requirements(contract)


class CaptureGuardTests(unittest.IsolatedAsyncioTestCase):
    async def test_reload_blocked_before_dispatch_until_verified_screenshot(self):
        guard = NativePlayGuard(requirements(), **native.IDENTITY, model="test-model",
                                capabilities=["screenshot", "reload"])
        calls = []

        async def send():
            calls.append("reload")

        async def ax():
            return observation("text", "ax")

        await guard.observe(ax)
        await guard.verify_checkpoint("before_resume", "text")
        with self.assertRaisesRegex(ValueError, "pre-input capture missing"):
            await guard.input("reload", send)
        self.assertEqual(calls, [])

        async def screen():
            return observation("before")

        await guard.observe(screen)
        await guard.verify_checkpoint("before_resume", "before")
        await guard.input("reload", send)
        self.assertEqual(calls, ["reload"])
        self.assertEqual(sum(e["kind"] == "input" for e in (await guard.export())["events"]), 1)

        async def after():
            return observation("after")

        await guard.observe(after)
        await guard.verify_checkpoint("after_resume", "after")
        with self.assertRaisesRegex(ValueError, "complete; stop"):
            await guard.input("click", send)


class CaptureResultTests(unittest.TestCase):
    def setUp(self):
        native.NativeReceiptTests.setUp(self)
        self.assignment["execution_requirements"]["capture_rules"] = {
            "maze.exit": dict(modality="screenshot", action="key", occurrence=1, relation="after")}
        payload = {k: v for k, v in self.assignment.items() if k != "assignment_id"}
        identity = "sha256:" + hashlib.sha256(
            json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        self.assignment["assignment_id"] = identity
        self.execution["assignment_id"] = identity
        self.result["assignment_id"] = identity
        self.capsule = native.materialize(self.assignment, self.root,
                                          self.capsule_dir.parent / "capture-capsule")

    def test_missing_capture_blocks_pass_but_preserves_unresolved(self):
        receipt = native.NativeReceiptTests.make_receipt(self)
        self.result.update(verdict="pass", execution_receipt_id=receipt["receipt_id"])
        with self.assertRaisesRegex(ValueError, "capture coverage"):
            validate_result(self.assignment, self.result, receipt)
        self.result["verdict"] = "unresolved"
        result = validate_result(self.assignment, self.result, receipt)
        self.assertEqual(result["verdict"], "unresolved")
        self.assertEqual(result["native_coverage"]["capture_gaps"],
                         [dict(checkpoint="maze.exit", reason="wrong_or_unknown_modality")])

    def test_correct_capture_allows_scoped_pass(self):
        self.execution["events"][-1]["modality"] = "screenshot"
        receipt = native.NativeReceiptTests.make_receipt(self)
        self.result.update(verdict="pass", execution_receipt_id=receipt["receipt_id"])
        self.assertEqual(validate_result(self.assignment, self.result, receipt)["verdict"], "pass")
