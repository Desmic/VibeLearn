import unittest

from tools.build_critic_assignments import build_assignments


class CriticAssignmentTests(unittest.TestCase):
    def index(self):
        sha="a"*40
        return {
            "schema":"vibelearn.review-evidence-index.v1",
            "candidate_sha":sha,
            "technical_result":"success",
            "receipts":[
                {
                    "suite":"first-words-opening",
                    "receipt_ref":"opening/evidence-receipt-first-words-opening.json",
                    "evidence":[
                        {"ref":"prologue-motion.webm","modality":"motion_video","candidate_sha":sha},
                        {"ref":"frame.png","modality":"screenshot","candidate_sha":sha},
                        {"ref":"cold-observer-opening-packet.json","modality":"review_assignment","candidate_sha":sha},
                    ]
                },
                {
                    "suite":"first-words-controls",
                    "receipt_ref":"controls/evidence-receipt-first-words-controls.json",
                    "evidence":[
                        {"ref":"controls-interaction-trace.json","modality":"interactive_trace","candidate_sha":sha}
                    ]
                },
                {
                    "suite":"foundation",
                    "receipt_ref":"foundation/evidence-receipt-foundation.json",
                    "evidence":[
                        {"ref":"learning-replay.json","modality":"authoritative_replay","candidate_sha":sha}
                    ]
                }
            ]
        }

    def test_cold_observer_is_ready_from_motion_but_excludes_assignment_packet(self):
        assignments=build_assignments(self.index())
        cold=assignments["cold_observer"]
        self.assertEqual(cold["status"],"ready")
        self.assertIn("story treatment",cold["forbidden_context"])
        modalities={item["modality"] for item in cold["allowed_evidence"]}
        self.assertIn("motion_video",modalities)
        self.assertNotIn("review_assignment",modalities)

    def test_downstream_causality_waits_for_actual_cold_report(self):
        assignments=build_assignments(self.index())
        cinematic=assignments["cinematic_causality"]
        self.assertEqual(cinematic["status"],"blocked_missing_evidence")
        self.assertIn(["cold_observer_report"],cinematic["missing_evidence"])

    def test_audio_pass_blocks_without_audio_capture(self):
        audio=build_assignments(self.index())["audio_atmosphere"]
        self.assertEqual(audio["status"],"blocked_missing_evidence")
        self.assertEqual(audio["missing_evidence"],[["audio_capture"]])

    def test_physicality_and_learning_use_strong_modalities(self):
        assignments=build_assignments(self.index())
        self.assertEqual(assignments["physicality"]["status"],"ready")
        self.assertEqual(assignments["learning_transfer"]["status"],"ready")
        physical={item["modality"] for item in assignments["physicality"]["allowed_evidence"]}
        learning={item["modality"] for item in assignments["learning_transfer"]["allowed_evidence"]}
        self.assertIn("interactive_trace",physical)
        self.assertIn("authoritative_replay",learning)

    def test_intent_comparison_waits_for_cold_report_and_source(self):
        intent=build_assignments(self.index())["intent_comparison"]
        self.assertEqual(intent["status"],"blocked_missing_evidence")
        self.assertIn(["cold_observer_report"],intent["missing_evidence"])
        self.assertIn(["source_inspection"],intent["missing_evidence"])


if __name__=="__main__":
    unittest.main()
