import unittest

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

    def result(self,review_pass,used,verdict="unresolved",blockers=None):
        return {
            "schema":"vibelearn.critic-result.v1",
            "candidate_sha":self.sha,
            "pass":review_pass,
            "verdict":verdict,
            "context_attestation":{
                "allowed_context_only":True,
                "observations_before_interpretation":True,
                "notes":"Used only assignment evidence."
            },
            "used_evidence":used,
            "observations":["Observed the assigned evidence before interpreting it."],
            "interpretation":"Synthetic reviewer interpretation.",
            "uncertainties":["Synthetic uncertainty."],
            "counterexample_attempt":"Attempted to falsify the apparent interpretation.",
            "blockers":blockers or [],
        }

    def test_cold_result_unlocks_cinematic_and_intent_in_same_ingestion(self):
        cold=self.result("cold_observer",[
            {"ref":"opening/caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha}
        ])
        cinematic=self.result("cinematic_causality",[
            {"ref":"post-ci/cold_observer.json","modality":"cold_observer_report","candidate_sha":self.sha},
            {"ref":"opening/motion.webm","modality":"motion_video","candidate_sha":self.sha},
        ])
        intent=self.result("intent_comparison",[
            {"ref":"post-ci/cold_observer.json","modality":"cold_observer_report","candidate_sha":self.sha},
            {"ref":"foundation/review-source.tar","modality":"source_inspection","candidate_sha":self.sha},
        ])
        workspace,normalized=ingest(self.index,{
            "cold_observer":cold,
            "cinematic_causality":cinematic,
            "intent_comparison":intent,
        })
        self.assertEqual(workspace["critic_passes"],["cold_observer","cinematic_causality","intent_comparison"])
        self.assertEqual(normalized["cold_observer"]["modality"],"cold_observer_report")
        self.assertEqual(workspace["supplemental_evidence"][0]["ref"],"post-ci/cold_observer.json")

    def test_cinematic_result_without_cold_result_is_rejected(self):
        cinematic=self.result("cinematic_causality",[
            {"ref":"opening/motion.webm","modality":"motion_video","candidate_sha":self.sha}
        ])
        with self.assertRaisesRegex(ValueError,"blocked critic assignment"):
            ingest(self.index,{"cinematic_causality":cinematic})

    def test_cold_observer_cannot_use_source_even_though_workspace_has_it(self):
        cold=self.result("cold_observer",[
            {"ref":"foundation/review-source.tar","modality":"source_inspection","candidate_sha":self.sha}
        ])
        with self.assertRaisesRegex(ValueError,"outside its assignment"):
            ingest(self.index,{"cold_observer":cold})

    def test_audio_listener_can_use_capture_but_normalizes_to_listening_report(self):
        audio=self.result("audio_atmosphere",[
            {"ref":"opening/event-audio.webm","modality":"audio_capture","candidate_sha":self.sha}
        ])
        workspace,normalized=ingest(self.index,{"audio_atmosphere":audio})
        self.assertEqual(normalized["audio_atmosphere"]["modality"],"audio_listening")
        self.assertEqual(workspace["supplemental_evidence"][0]["modality"],"audio_listening")

    def test_unknown_pass_is_rejected(self):
        bogus=self.result("mystery",[
            {"ref":"opening/motion.webm","modality":"motion_video","candidate_sha":self.sha}
        ])
        with self.assertRaisesRegex(ValueError,"unknown critic result passes"):
            ingest(self.index,{"mystery":bogus})


if __name__=="__main__":
    unittest.main()
