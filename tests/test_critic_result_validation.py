import copy
import unittest

from tools.validate_critic_result import validate_result


class CriticResultValidationTests(unittest.TestCase):
    def setUp(self):
        self.sha="a"*40
        self.evidence=[
            {"ref":"opening/prologue-caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha},
            {"ref":"opening/prologue-audio.webm","modality":"audio_capture","candidate_sha":self.sha},
        ]
        self.assignment={
            "schema":"vibelearn.critic-assignment.v1",
            "candidate_sha":self.sha,
            "pass":"cold_observer",
            "status":"ready",
            "allowed_evidence":copy.deepcopy(self.evidence),
            "allowed_modalities":["caption_blind_motion","audio_capture"],
            "forbidden_context":["story treatment","creator intent"],
            "questions":["What world is shown?"],
            "expected_output_modality":"cold_observer_report",
        }
        self.result={
            "schema":"vibelearn.critic-result.v1",
            "candidate_sha":self.sha,
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
        result=validate_result(self.assignment,self.result)
        self.assertEqual(result["candidate_sha"],self.sha)
        self.assertEqual(result["pass"],"cold_observer")
        self.assertEqual(result["modality"],"cold_observer_report")
        self.assertEqual(result["verdict"],"unresolved")

    def test_result_cannot_use_unassigned_evidence(self):
        self.result["used_evidence"]=[{
            "ref":"source/review-source.tar",
            "modality":"source_inspection",
            "candidate_sha":self.sha
        }]
        with self.assertRaisesRegex(ValueError,"outside its assignment"):
            validate_result(self.assignment,self.result)

    def test_blocked_assignment_cannot_receive_result(self):
        self.assignment["status"]="blocked_missing_evidence"
        with self.assertRaisesRegex(ValueError,"blocked critic assignment"):
            validate_result(self.assignment,self.result)

    def test_context_attestation_is_required(self):
        self.result["context_attestation"]["allowed_context_only"]=False
        with self.assertRaisesRegex(ValueError,"allowed-context-only"):
            validate_result(self.assignment,self.result)

    def test_passing_result_cannot_hide_blocker(self):
        self.result["verdict"]="pass"
        self.result["blockers"]=[{"finding":"Cause is unclear","retest":"Replay without captions"}]
        with self.assertRaisesRegex(ValueError,"passing critic result"):
            validate_result(self.assignment,self.result)

    def test_needs_revision_requires_blocker(self):
        self.result["verdict"]="needs_revision"
        with self.assertRaisesRegex(ValueError,"must contain at least one blocker"):
            validate_result(self.assignment,self.result)

    def test_candidate_and_pass_are_exact_boundaries(self):
        for field,value,pattern in (
            ("candidate_sha","b"*40,"different candidate"),
            ("pass","motion_audience","different pass"),
        ):
            result=copy.deepcopy(self.result)
            result[field]=value
            with self.assertRaisesRegex(ValueError,pattern):
                validate_result(self.assignment,result)


if __name__=="__main__":
    unittest.main()
