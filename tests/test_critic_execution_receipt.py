import copy
import unittest

from tools.critic_execution_receipt import build_receipt,validate_receipt


class CriticExecutionReceiptTests(unittest.TestCase):
    def setUp(self):
        self.sha="a"*40
        self.evidence=[
            {"ref":"opening/caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha},
            {"ref":"opening/audio.webm","modality":"audio_capture","candidate_sha":self.sha},
        ]
        self.assignment={
            "schema":"vibelearn.critic-assignment.v1",
            "candidate_sha":self.sha,
            "assignment_id":"sha256:"+"1"*64,
            "pass":"cold_observer",
            "status":"ready",
            "required_evidence_groups":[["caption_blind_motion","interactive_trace"]],
            "allowed_evidence":copy.deepcopy(self.evidence),
            "allowed_modalities":["caption_blind_motion","audio_capture"],
            "forbidden_context":["story treatment","creator intent"],
            "questions":["What world is shown?"],
            "expected_output_modality":"cold_observer_report",
        }

    def test_valid_receipt_is_candidate_assignment_and_session_bound(self):
        receipt=build_receipt(
            self.assignment,"terminal-orchestrator","session-123",
            [self.evidence[0]],["assignment"]
        )
        validated=validate_receipt(self.assignment,receipt)
        self.assertEqual(validated["candidate_sha"],self.sha)
        self.assertEqual(validated["assignment_id"],self.assignment["assignment_id"])
        self.assertEqual(validated["executor_id"],"terminal-orchestrator")
        self.assertEqual(validated["session_id"],"session-123")
        self.assertRegex(validated["receipt_id"],r"^sha256:[0-9a-f]{64}$")

    def test_harness_cannot_supply_evidence_outside_assignment(self):
        outside={"ref":"source/design.tar","modality":"source_inspection","candidate_sha":self.sha}
        with self.assertRaisesRegex(ValueError,"outside assignment"):
            build_receipt(
                self.assignment,"terminal-orchestrator","session-123",
                [outside],["assignment"]
            )

    def test_assignment_capsule_must_be_present_in_supplied_context(self):
        with self.assertRaisesRegex(ValueError,"include the assignment capsule"):
            build_receipt(
                self.assignment,"terminal-orchestrator","session-123",
                [self.evidence[0]],["runtime only"]
            )

    def test_forbidden_context_label_is_detected_from_supplied_context(self):
        with self.assertRaisesRegex(ValueError,"supplied forbidden context label"):
            build_receipt(
                self.assignment,"terminal-orchestrator","session-123",
                [self.evidence[0]],["assignment","story treatment v4"]
            )

    def test_forbidden_context_is_hard_rejected(self):
        with self.assertRaisesRegex(ValueError,"forbidden context"):
            build_receipt(
                self.assignment,"terminal-orchestrator","session-123",
                [self.evidence[0]],["assignment"],["story treatment"]
            )

    def test_receipt_digest_detects_tampering(self):
        receipt=build_receipt(
            self.assignment,"terminal-orchestrator","session-123",
            [self.evidence[0]],["assignment"]
        )
        receipt["session_id"]="different-session"
        with self.assertRaisesRegex(ValueError,"digest mismatch"):
            validate_receipt(self.assignment,receipt)

    def test_receipt_cannot_be_replayed_to_different_assignment(self):
        receipt=build_receipt(
            self.assignment,"terminal-orchestrator","session-123",
            [self.evidence[0]],["assignment"]
        )
        changed=copy.deepcopy(self.assignment)
        changed["assignment_id"]="sha256:"+"2"*64
        with self.assertRaisesRegex(ValueError,"another assignment"):
            validate_receipt(changed,receipt)


if __name__=="__main__":
    unittest.main()
