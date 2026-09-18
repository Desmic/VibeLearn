import json
import tempfile
import unittest
from pathlib import Path

from tools.build_review_workspace import build_workspace
from tools.build_critic_assignments import build_assignments


class ReviewWorkspaceTests(unittest.TestCase):
    def base_index(self,sha):
        return {
            "schema":"vibelearn.review-evidence-index.v1",
            "candidate_sha":sha,
            "technical_result":"success",
            "expected_suites":[],
            "observed_suites":[],
            "missing_suites":[],
            "modalities":["caption_blind_motion","motion_video","source_inspection"],
            "receipts":[
                {
                    "suite":"first-words-opening",
                    "receipt_ref":"opening/evidence-receipt.json",
                    "modalities":["caption_blind_motion","motion_video"],
                    "evidence_count":2,
                    "evidence":[
                        {"ref":"caption-blind.webm","modality":"caption_blind_motion","candidate_sha":sha},
                        {"ref":"motion.webm","modality":"motion_video","candidate_sha":sha},
                    ],
                },
                {
                    "suite":"foundation",
                    "receipt_ref":"foundation/evidence-receipt.json",
                    "modalities":["source_inspection"],
                    "evidence_count":1,
                    "evidence":[
                        {"ref":"review-source.tar","modality":"source_inspection","candidate_sha":sha}
                    ],
                },
            ],
        }

    def critic_result(self,sha,review_pass="cold_observer",modality="cold_observer_report"):
        return {
            "schema":"vibelearn.validated-critic-result.v1",
            "candidate_sha":sha,
            "pass":review_pass,
            "modality":modality,
            "verdict":"unresolved",
            "context_attestation":{"allowed_context_only":True,"observations_before_interpretation":True,"notes":"fixture"},
            "used_evidence":[],
            "observations":["fixture observation"],
            "interpretation":"fixture interpretation",
            "uncertainties":["fixture uncertainty"],
            "counterexample_attempt":"fixture counterexample",
            "blockers":[],
        }

    def test_validated_cold_result_unlocks_downstream_assignments(self):
        sha="a"*40
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            (root/"cold.json").write_text(json.dumps(self.critic_result(sha)),encoding="utf-8")
            workspace=build_workspace(self.base_index(sha),root)
            self.assertEqual(workspace["critic_passes"],["cold_observer"])
            self.assertEqual(workspace["supplemental_evidence"][0]["ref"],"post-ci/cold.json")
            assignments=build_assignments(workspace)
            self.assertEqual(assignments["cinematic_causality"]["status"],"ready")
            self.assertEqual(assignments["intent_comparison"]["status"],"ready")

    def test_without_validated_cold_result_downstream_stays_blocked(self):
        sha="a"*40
        workspace=build_workspace(self.base_index(sha),None)
        assignments=build_assignments(workspace)
        self.assertEqual(assignments["cinematic_causality"]["status"],"blocked_missing_evidence")
        self.assertEqual(assignments["intent_comparison"]["status"],"blocked_missing_evidence")

    def test_cross_candidate_supplemental_result_is_rejected(self):
        sha="a"*40
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            (root/"cold.json").write_text(json.dumps(self.critic_result("b"*40)),encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"another candidate"):
                build_workspace(self.base_index(sha),root)

    def test_duplicate_pass_results_are_rejected(self):
        sha="a"*40
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            value=self.critic_result(sha)
            (root/"cold-a.json").write_text(json.dumps(value),encoding="utf-8")
            (root/"cold-b.json").write_text(json.dumps(value),encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"duplicate supplemental"):
                build_workspace(self.base_index(sha),root)

    def test_unvalidated_json_is_ignored_not_promoted_to_evidence(self):
        sha="a"*40
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            (root/"notes.json").write_text(json.dumps({"schema":"random","candidate_sha":sha}),encoding="utf-8")
            workspace=build_workspace(self.base_index(sha),root)
            self.assertEqual(workspace["supplemental_evidence"],[])


if __name__=="__main__":
    unittest.main()
