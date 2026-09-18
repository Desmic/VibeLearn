import unittest

from tools.build_critic_assignments import build_assignments
from tools.critic_execution_receipt import build_receipt
from tools.ingest_critic_results import ingest


class SequentialCriticIngestionTests(unittest.TestCase):
    def setUp(self):
        self.sha="a"*40
        self.index={
            "schema":"vibelearn.review-evidence-index.v1",
            "candidate_sha":self.sha,
            "technical_result":"success",
            "receipts":[
                {
                    "suite":"first-words-opening",
                    "receipt_ref":"opening/evidence-receipt.json",
                    "evidence":[
                        {"ref":"caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha},
                        {"ref":"motion.webm","modality":"motion_video","candidate_sha":self.sha},
                        {"ref":"event-audio.webm","modality":"audio_capture","candidate_sha":self.sha},
                    ],
                },
                {
                    "suite":"first-words-controls",
                    "receipt_ref":"controls/evidence-receipt.json",
                    "evidence":[
                        {"ref":"controls-interaction-trace.json","modality":"interactive_trace","candidate_sha":self.sha}
                    ],
                },
                {
                    "suite":"foundation",
                    "receipt_ref":"foundation/evidence-receipt.json",
                    "evidence":[
                        {"ref":"review-source.tar","modality":"source_inspection","candidate_sha":self.sha},
                        {"ref":"learning-replay.json","modality":"authoritative_replay","candidate_sha":self.sha},
                    ],
                },
            ],
        }

    def bundle(self,assignment,used,verdict="unresolved",blockers=None,supplied=None,session=None):
        receipt=build_receipt(
            assignment,
            "test-harness",
            session or f"session-{assignment['pass']}",
            supplied if supplied is not None else used,
            ["assignment"],
        )
        result={
            "schema":"vibelearn.critic-result.v1",
            "candidate_sha":self.sha,
            "assignment_id":assignment["assignment_id"],
            "execution_receipt_id":receipt["receipt_id"],
            "pass":assignment["pass"],
            "verdict":verdict,
            "context_attestation":{
                "allowed_context_only":True,
                "observations_before_interpretation":True,
                "notes":"Used only harness-supplied assignment evidence."
            },
            "used_evidence":used,
            "observations":["Observed the assigned evidence before interpreting it."],
            "interpretation":"Synthetic reviewer interpretation.",
            "uncertainties":["Synthetic uncertainty."],
            "counterexample_attempt":"Attempted to falsify the apparent interpretation.",
            "blockers":blockers or [],
        }
        return result,receipt

    def test_cold_result_unlocks_cinematic_and_intent_in_same_ingestion(self):
        cold_assignment=build_assignments(self.index)["cold_observer"]
        cold_used=[
            {"ref":"opening/caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha}
        ]
        cold,cold_receipt=self.bundle(cold_assignment,cold_used)

        workspace_after_cold,_=ingest(
            self.index,
            {"cold_observer":cold},
            {"cold_observer":cold_receipt},
        )
        downstream=build_assignments(workspace_after_cold)

        cinematic_used=[
            {"ref":"post-ci/cold_observer.json","modality":"cold_observer_report","candidate_sha":self.sha},
            {"ref":"opening/motion.webm","modality":"motion_video","candidate_sha":self.sha},
        ]
        cinematic,cinematic_receipt=self.bundle(
            downstream["cinematic_causality"],cinematic_used,session="session-cinematic"
        )
        intent_used=[
            {"ref":"post-ci/cold_observer.json","modality":"cold_observer_report","candidate_sha":self.sha},
            {"ref":"foundation/review-source.tar","modality":"source_inspection","candidate_sha":self.sha},
        ]
        intent,intent_receipt=self.bundle(
            downstream["intent_comparison"],intent_used,session="session-intent"
        )

        workspace,normalized=ingest(
            self.index,
            {
                "cold_observer":cold,
                "cinematic_causality":cinematic,
                "intent_comparison":intent,
            },
            {
                "cold_observer":cold_receipt,
                "cinematic_causality":cinematic_receipt,
                "intent_comparison":intent_receipt,
            },
        )
        self.assertEqual(
            workspace["critic_passes"],
            ["cold_observer","cinematic_causality","intent_comparison"],
        )
        self.assertEqual(normalized["cold_observer"]["modality"],"cold_observer_report")
        self.assertEqual(normalized["cold_observer"]["assignment_id"],cold_assignment["assignment_id"])
        self.assertEqual(normalized["cold_observer"]["execution_receipt_id"],cold_receipt["receipt_id"])
        self.assertEqual(workspace["supplemental_evidence"][0]["ref"],"post-ci/cold_observer.json")

    def test_cinematic_result_without_cold_result_is_rejected(self):
        assignment=build_assignments(self.index)["cinematic_causality"]
        used=[{"ref":"opening/motion.webm","modality":"motion_video","candidate_sha":self.sha}]
        result,receipt=self.bundle(assignment,used)
        with self.assertRaisesRegex(ValueError,"blocked critic assignment"):
            ingest(
                self.index,
                {"cinematic_causality":result},
                {"cinematic_causality":receipt},
            )

    def test_cold_observer_cannot_use_source_even_though_workspace_has_it(self):
        assignment=build_assignments(self.index)["cold_observer"]
        used=[{"ref":"foundation/review-source.tar","modality":"source_inspection","candidate_sha":self.sha}]
        supplied=[
            {"ref":"opening/caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha}
        ]
        result,receipt=self.bundle(assignment,used,supplied=supplied)
        with self.assertRaisesRegex(ValueError,"outside its assignment"):
            ingest(self.index,{"cold_observer":result},{"cold_observer":receipt})

    def test_audio_listener_can_use_capture_but_normalizes_to_listening_report(self):
        assignment=build_assignments(self.index)["audio_atmosphere"]
        used=[{"ref":"opening/event-audio.webm","modality":"audio_capture","candidate_sha":self.sha}]
        result,receipt=self.bundle(assignment,used)
        workspace,normalized=ingest(
            self.index,
            {"audio_atmosphere":result},
            {"audio_atmosphere":receipt},
        )
        self.assertEqual(normalized["audio_atmosphere"]["modality"],"audio_listening")
        self.assertEqual(workspace["supplemental_evidence"][0]["modality"],"audio_listening")

    def test_missing_execution_receipt_is_rejected(self):
        assignment=build_assignments(self.index)["cold_observer"]
        used=[{"ref":"opening/caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha}]
        result,receipt=self.bundle(assignment,used)
        self.assertTrue(receipt["receipt_id"])
        with self.assertRaisesRegex(ValueError,"missing execution receipt"):
            ingest(self.index,{"cold_observer":result},{})

    def test_execution_receipt_without_result_is_rejected(self):
        assignment=build_assignments(self.index)["cold_observer"]
        used=[{"ref":"opening/caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha}]
        _,receipt=self.bundle(assignment,used)
        with self.assertRaisesRegex(ValueError,"execution receipt without critic result"):
            ingest(self.index,{},{"cold_observer":receipt})

    def test_unknown_pass_is_rejected(self):
        bogus={
            "schema":"vibelearn.critic-result.v1",
            "candidate_sha":self.sha,
            "assignment_id":"sha256:"+"9"*64,
            "execution_receipt_id":"sha256:"+"8"*64,
            "pass":"mystery",
            "verdict":"unresolved",
        }
        with self.assertRaisesRegex(ValueError,"unknown critic result passes"):
            ingest(self.index,{"mystery":bogus},{})


if __name__=="__main__":
    unittest.main()
