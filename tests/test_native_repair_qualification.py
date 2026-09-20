import copy
import json
import unittest

from tests import test_native_repair_proposal as proposal_tests
from tools.critic_execution_receipt import build_receipt
from tools.qualify_native_repair import prepare_review, qualify_return


class NativeRepairQualificationTests(unittest.TestCase):
    def setUp(self):
        proposal_tests.NativeRepairProposalTests.setUp(self)
        self.request = proposal_tests.NativeRepairProposalTests.build(self)["request"]
        self.worker = copy.deepcopy(self.record)
        self.worker["session_id"] = "fresh-worker-session"
        self.worker["checkpoints"]["after_resume"] = "after"
        self.capsule_dir = self.root / "new-review"

    def prepare(self, worker_executor_id="worker-1"):
        (self.root / "execution.json").write_text(json.dumps(self.worker), encoding="utf-8")
        capsule = prepare_review(self.request, self.worker, self.root, worker_executor_id, self.capsule_dir)
        self.assignment = json.loads((self.capsule_dir / "assignment.json").read_text())
        self.receipt = build_receipt(self.assignment, "reviewer-2", "fresh-review-session",
            self.assignment["allowed_evidence"], capsule_id=capsule["capsule_id"])
        self.result = dict(schema="vibelearn.critic-result.v1", candidate_sha=self.worker["candidate_sha"],
            assignment_id=self.assignment["assignment_id"], execution_receipt_id=self.receipt["receipt_id"],
            **{"pass": "native_evidence_coverage"}, verdict="pass",
            context_attestation=dict(allowed_context_only=True, observations_before_interpretation=True,
                                     notes="Controlled synthetic reviewer fixture, not real model review."),
            used_evidence=self.assignment["allowed_evidence"], observations=["Synthetic protocol fixture."],
            interpretation="Contract fixture only.", uncertainties=[],
            counterexample_attempt="Protocol tests vary captures, identities, coverage and review bindings.", blockers=[])

    def qualify(self):
        return qualify_return(self.request, self.worker, self.root, "worker-1", self.capsule_dir,
                              self.receipt, self.result)

    def test_complete_review_qualifies_only_evidence(self):
        self.prepare()
        result = self.qualify()
        self.assertEqual(result["status"], "evidence_repair_qualified")
        self.assertEqual(result["product_acceptance"], "undetermined")
        self.assertFalse(result["dispatch_authorized"])

    def test_reused_worker_session_rejected_before_review(self):
        self.worker["session_id"] = self.record["session_id"]
        with self.assertRaisesRegex(ValueError, "fresh worker session"):
            self.prepare()

    def test_same_worker_cannot_self_review(self):
        self.prepare()
        self.receipt = build_receipt(self.assignment, "worker-1", "fresh-review-session",
            self.assignment["allowed_evidence"], capsule_id=self.receipt["capsule_id"])
        self.result["execution_receipt_id"] = self.receipt["receipt_id"]
        with self.assertRaisesRegex(ValueError, "separate"):
            self.qualify()

    def test_padded_reviewer_executor_cannot_hide_self_review(self):
        self.prepare()
        self.receipt = build_receipt(self.assignment, "worker-1", "fresh-review-session",
            self.assignment["allowed_evidence"], capsule_id=self.receipt["capsule_id"])
        self.result["execution_receipt_id"] = self.receipt["receipt_id"]
        # Receipt validation canonicalizes whitespace, so its digest remains valid.
        self.receipt["executor_id"] = " worker-1 "
        with self.assertRaises(ValueError):
            self.qualify()

    def test_padded_reviewer_session_cannot_hide_reused_worker_session(self):
        self.prepare()
        self.receipt = build_receipt(self.assignment, "reviewer-2", self.worker["session_id"],
            self.assignment["allowed_evidence"], capsule_id=self.receipt["capsule_id"])
        self.result["execution_receipt_id"] = self.receipt["receipt_id"]
        self.receipt["session_id"] = " " + self.worker["session_id"] + " "
        with self.assertRaises(ValueError):
            self.qualify()

    def test_padded_source_session_cannot_claim_fresh_replay(self):
        self.worker["session_id"] = " " + self.record["session_id"] + " "
        with self.assertRaises(ValueError):
            self.prepare()

    def test_padded_worker_executor_cannot_hide_self_review(self):
        with self.assertRaises(ValueError):
            self.prepare(worker_executor_id=" worker-1 ")
            self.receipt = build_receipt(self.assignment, "worker-1", "fresh-review-session",
                self.assignment["allowed_evidence"], capsule_id=self.receipt["capsule_id"])
            self.result["execution_receipt_id"] = self.receipt["receipt_id"]
            qualify_return(self.request, self.worker, self.root, " worker-1 ",
                           self.capsule_dir, self.receipt, self.result)

    def test_missing_capture_cannot_pass_even_with_reviewer_confidence(self):
        self.worker["checkpoints"].pop("after_resume")
        self.prepare()
        with self.assertRaisesRegex(ValueError, "incomplete native coverage"):
            self.qualify()
        self.result["verdict"] = "unresolved"
        self.assertEqual(self.qualify()["status"], "unresolved")

    def test_old_review_cannot_qualify_changed_native_record(self):
        self.prepare()
        self.worker["model"] = "changed-worker-model"
        (self.root / "execution.json").write_text(json.dumps(self.worker))
        with self.assertRaisesRegex(ValueError, "bound to this repair"):
            self.qualify()

    def test_omitted_observation_in_review_rejected(self):
        self.prepare()
        self.result["used_evidence"] = self.result["used_evidence"][:1]
        with self.assertRaisesRegex(ValueError, "every retained observation"):
            self.qualify()
        self.result["verdict"] = "unresolved"
        self.result["uncertainties"] = ["Not all supplied captures were reviewed."]
        self.assertEqual(self.qualify()["status"], "unresolved")

    def test_tampered_capture_rejected(self):
        self.prepare()
        (self.root / "after").write_bytes(b"changed capture")
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            self.qualify()

    def test_capsule_cannot_be_overwritten(self):
        self.prepare()
        with self.assertRaisesRegex(ValueError, "must be new"):
            self.prepare()
