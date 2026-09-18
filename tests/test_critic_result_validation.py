import copy
import tempfile
import unittest
from pathlib import Path

from tools.critic_execution_receipt import build_receipt
from tools.materialize_critic_capsule import materialize
from tools.validate_critic_result import validate_result


class CriticResultValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/"workspace";self.root.mkdir()
        self.capsule_dir=Path(self.temp.name)/"capsule"
        self.sha="a"*40
        (self.root/"opening").mkdir()
        (self.root/"opening"/"prologue-caption-blind.webm").write_bytes(b"motion")
        (self.root/"opening"/"prologue-audio.webm").write_bytes(b"audio")
        self.evidence=[
            {"ref":"opening/prologue-caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha},
            {"ref":"opening/prologue-audio.webm","modality":"audio_capture","candidate_sha":self.sha},
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
        self.capsule=materialize(self.assignment,self.root,self.capsule_dir)
        self.receipt=build_receipt(
            self.assignment,
            "test-harness",
            "session-1",
            copy.deepcopy(self.evidence),
            ["assignment"],
            capsule_id=self.capsule["capsule_id"],
        )
        self.result={
            "schema":"vibelearn.critic-result.v1",
            "candidate_sha":self.sha,
            "assignment_id":self.assignment["assignment_id"],
            "execution_receipt_id":self.receipt["receipt_id"],
            "pass":"cold_observer",
            "verdict":"unresolved",
            "context_attestation":{
                "allowed_context_only":True,
                "observations_before_interpretation":True,
                "notes":"Reviewed only the assigned player-facing evidence."
            },
            "used_evidence":[copy.deepcopy(self.evidence[0])],
            "observations":["A bright settlement and moving robots are visible before disruption."],
            "interpretation":"The setting is partly legible, but some relationships remain uncertain.",
            "uncertainties":["The exact social role of the lantern is unclear without text."],
            "counterexample_attempt":"Tried to explain the event without reading any caption or semantic identifier.",
            "blockers":[],
        }

    def test_valid_result_is_normalized_to_pass_modality(self):
        result=validate_result(self.assignment,self.result,self.receipt)
        self.assertEqual(result["candidate_sha"],self.sha)
        self.assertEqual(result["pass"],"cold_observer")
        self.assertEqual(result["modality"],"cold_observer_report")
        self.assertEqual(result["verdict"],"unresolved")
        self.assertEqual(result["capsule_id"],self.capsule["capsule_id"])

    def test_execution_receipt_is_required(self):
        with self.assertRaisesRegex(ValueError,"execution receipt is required"):
            validate_result(self.assignment,self.result,None)

    def test_result_must_echo_exact_execution_receipt_id(self):
        self.result["execution_receipt_id"]="sha256:"+"9"*64
        with self.assertRaisesRegex(ValueError,"different execution receipt"):
            validate_result(self.assignment,self.result,self.receipt)

    def test_result_cannot_claim_evidence_not_supplied_by_harness(self):
        narrow=build_receipt(
            self.assignment,
            "test-harness",
            "session-2",
            [copy.deepcopy(self.evidence[1])],
            ["assignment"],
            capsule_id=self.capsule["capsule_id"],
        )
        result=copy.deepcopy(self.result)
        result["execution_receipt_id"]=narrow["receipt_id"]
        with self.assertRaisesRegex(ValueError,"not supplied by execution harness"):
            validate_result(self.assignment,result,narrow)

    def test_result_must_echo_exact_assignment_id(self):
        self.result["assignment_id"]="sha256:"+"2"*64
        with self.assertRaisesRegex(ValueError,"different assignment"):
            validate_result(self.assignment,self.result,self.receipt)

    def test_result_must_use_required_evidence_modality(self):
        self.result["used_evidence"]=[copy.deepcopy(self.evidence[1])]
        with self.assertRaisesRegex(ValueError,"did not use required evidence modality"):
            validate_result(self.assignment,self.result,self.receipt)

    def test_result_cannot_use_unassigned_evidence(self):
        self.result["used_evidence"]=[{
            "ref":"source/review-source.tar",
            "modality":"source_inspection",
            "candidate_sha":self.sha
        }]
        with self.assertRaisesRegex(ValueError,"outside its assignment"):
            validate_result(self.assignment,self.result,self.receipt)

    def test_blocked_assignment_cannot_receive_result(self):
        self.assignment["status"]="blocked_missing_evidence"
        with self.assertRaisesRegex(ValueError,"blocked critic assignment"):
            validate_result(self.assignment,self.result,self.receipt)

    def test_context_attestation_is_required(self):
        self.result["context_attestation"]["allowed_context_only"]=False
        with self.assertRaisesRegex(ValueError,"allowed-context-only"):
            validate_result(self.assignment,self.result,self.receipt)

    def test_passing_result_cannot_hide_blocker(self):
        self.result["verdict"]="pass"
        self.result["blockers"]=[{"finding":"Cause is unclear","retest":"Replay without captions"}]
        with self.assertRaisesRegex(ValueError,"passing critic result"):
            validate_result(self.assignment,self.result,self.receipt)

    def test_needs_revision_requires_blocker(self):
        self.result["verdict"]="needs_revision"
        with self.assertRaisesRegex(ValueError,"must contain at least one blocker"):
            validate_result(self.assignment,self.result,self.receipt)

    def test_candidate_and_pass_are_exact_boundaries(self):
        for field,value,pattern in (
            ("candidate_sha","b"*40,"different candidate"),
            ("pass","motion_audience","different pass"),
        ):
            result=copy.deepcopy(self.result)
            result[field]=value
            with self.assertRaisesRegex(ValueError,pattern):
                validate_result(self.assignment,result,self.receipt)


if __name__=="__main__":
    unittest.main()
