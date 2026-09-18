import json
import tempfile
import unittest
from pathlib import Path

from tools.build_review_index import EXPECTED_SUITES,build_index


class ReviewIndexTests(unittest.TestCase):
    def receipt(self,root,suite,sha):
        d=root/suite;d.mkdir(parents=True,exist_ok=True)
        payload={
            "schema":"vibelearn.evidence-receipt.v1",
            "candidate_sha":sha,
            "suite":suite,
            "root":".",
            "evidence":[{"ref":"x.json","modality":"runtime_trace","candidate_sha":sha,"bytes":1}],
            "modalities":["runtime_trace"],
        }
        (d/f"evidence-receipt-{suite}.json").write_text(json.dumps(payload),encoding="utf-8")

    def test_success_requires_all_suites_and_aggregates_modalities(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);sha="a"*40
            for suite in EXPECTED_SUITES:self.receipt(root,suite,sha)
            result=build_index(root,sha,"success")
            self.assertEqual(result["candidate_sha"],sha)
            self.assertEqual(result["missing_suites"],[])
            self.assertEqual(set(result["observed_suites"]),set(EXPECTED_SUITES))
            self.assertEqual(result["modalities"],["runtime_trace"])

    def test_success_rejects_missing_receipt(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);sha="a"*40
            for suite in EXPECTED_SUITES[:-1]:self.receipt(root,suite,sha)
            with self.assertRaisesRegex(ValueError,"missing suite receipts"):
                build_index(root,sha,"success")

    def test_failed_run_can_preserve_partial_index(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);sha="a"*40
            self.receipt(root,EXPECTED_SUITES[0],sha)
            result=build_index(root,sha,"failure")
            self.assertTrue(result["missing_suites"])
            self.assertEqual(result["technical_result"],"failure")

    def test_cross_candidate_receipt_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);sha="a"*40
            self.receipt(root,EXPECTED_SUITES[0],"b"*40)
            with self.assertRaisesRegex(ValueError,"another candidate"):
                build_index(root,sha,"failure")


if __name__=="__main__":
    unittest.main()
