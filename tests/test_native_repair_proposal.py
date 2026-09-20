import copy
import hashlib
import json
import tempfile
import unittest
from pathlib import Path

from app.orchestrator_adapter import VibeLearnAdapter, ContractError
from tests import test_native_capture_coverage as captures
from tests import test_orchestrator_adapter as adapter_tests
from tools.build_native_repair_proposal import build_proposal, CAPABILITY


class NativeRepairProposalTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.parent = json.loads(adapter_tests.FIXTURE.read_text())["start_request"]
        self.parent["run_request"]["repository"]["base_revision"] = captures.native.IDENTITY["candidate_sha"]
        self.record = captures.execution()
        for event in self.record["events"]:
            if event["kind"] == "observation":
                data = b"synthetic capture, not real GUI evidence"
                (self.root / event["ref"]).write_bytes(data)
                event["sha256"] = hashlib.sha256(data).hexdigest()
        self.record["checkpoints"].pop("after_resume")
        self.config = dict(identity=captures.native.IDENTITY, requirements=captures.requirements())
        self.kwargs = dict(parent_run_ref="fixture:parent-run", evidence_ref="fixture:native-record",
                           request_id="repair-new", idempotency_key="repair-new-intent",
                           budget=dict(max_model_calls=2, max_tool_calls=12, max_parallel_workers=1))

    def build(self):
        return build_proposal(self.parent, self.config, self.record, self.root, **self.kwargs)

    def test_preserves_lineage_reviews_policy_and_parent(self):
        original = copy.deepcopy(self.parent)
        proposal = self.build()
        self.assertFalse(proposal["dispatch_authorized"])
        child = proposal["request"]
        self.assertEqual(self.parent, original)
        self.assertEqual(child["run_request"]["budget"], self.kwargs["budget"])
        self.assertEqual(child["run_request"]["repository"]["allowed_write_scope"], [])
        self.assertEqual(child["run_request"]["review_requirements"][:-1], self.parent["run_request"]["review_requirements"])
        self.assertEqual(child["run_request"]["execution_policy_ref"], self.parent["run_request"]["execution_policy_ref"])
        self.assertEqual(child["extensions"][CAPABILITY]["session_policy"], "fresh_session_replay")

    def test_existing_transport_blocks_unnegotiated_semantics_before_start(self):
        transport = adapter_tests.FakeTransport()
        with self.assertRaises(ContractError) as failure:
            VibeLearnAdapter(transport).start_run(self.build()["request"])
        self.assertEqual(failure.exception.code, "UNSUPPORTED_CAPABILITY")
        self.assertFalse(any(call[0] == "start_run" for call in transport.calls))

    def test_complete_evidence_does_not_create_child(self):
        self.record["checkpoints"]["after_resume"] = "after"
        self.assertIsNone(self.build()["request"])
        self.assertEqual(self.build()["status"], "no_evidence_repair_needed")

    def test_rejects_wrong_build_and_changed_bytes(self):
        self.parent["run_request"]["repository"]["base_revision"] = "b" * 40
        with self.assertRaisesRegex(ValueError, "parent build"):
            self.build()
        self.parent["run_request"]["repository"]["base_revision"] = captures.native.IDENTITY["candidate_sha"]
        (self.root / "before").write_bytes(b"tampered")
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            self.build()

    def test_rejects_missing_policy_or_budget_expansion(self):
        self.kwargs["budget"]["max_model_calls"] = 31
        with self.assertRaisesRegex(ValueError, "budget"):
            self.build()
        self.kwargs["budget"]["max_model_calls"] = 2
        del self.parent["run_request"]["execution_policy_ref"]
        with self.assertRaisesRegex(ValueError, "policy"):
            self.build()

    def test_source_changes_change_intent(self):
        one = self.build()["request"]
        self.record["checkpoints"].clear()
        two = self.build()["request"]
        self.assertNotEqual(VibeLearnAdapter._intent_digest(one), VibeLearnAdapter._intent_digest(two))

    def test_does_not_reuse_parent_idempotency(self):
        self.kwargs["idempotency_key"] = self.parent["idempotency_key"]
        with self.assertRaisesRegex(ValueError, "new request"):
            self.build()

    def test_another_bounded_repair_preserves_single_blocking_review(self):
        self.parent = self.build()["request"]
        self.kwargs.update(request_id="repair-round-two", idempotency_key="repair-round-two-intent")
        child = self.build()["request"]
        reviews = child["run_request"]["review_requirements"]
        self.assertEqual(sum(r["requirement_id"] == "native-evidence-coverage" for r in reviews), 1)
        self.parent["run_request"]["review_requirements"][-1]["blocking"] = False
        with self.assertRaisesRegex(ValueError, "conflicts"):
            self.build()
