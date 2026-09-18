import copy
import json
import unittest
from pathlib import Path

from tools.check_quality_failure_corpus import validate

ROOT=Path(__file__).resolve().parents[1]


class QualityFailureCorpusTests(unittest.TestCase):
    def setUp(self):
        self.record=json.loads((ROOT/"docs"/"quality-failure-corpus.json").read_text(encoding="utf-8"))

    def test_current_failure_corpus_is_structurally_valid(self):
        result=validate(self.record,ROOT)
        self.assertEqual(result["status"],"valid")
        self.assertGreaterEqual(result["incident_count"],7)

    def test_generalized_rule_cannot_embed_proof_game_names(self):
        record=copy.deepcopy(self.record)
        record["incidents"][0]["invariant"]="Zip must understand Bellweather."
        with self.assertRaisesRegex(ValueError,"proof-game-specific"):
            validate(record,ROOT)

    def test_reviewer_only_fix_is_rejected(self):
        record=copy.deepcopy(self.record)
        record["incidents"][0]["prevention_layers"]=["reviewer"]
        with self.assertRaisesRegex(ValueError,"reviewer-only"):
            validate(record,ROOT)

    def test_missing_regression_reference_is_rejected(self):
        record=copy.deepcopy(self.record)
        record["incidents"][0]["regression_tests"]=["tests/does-not-exist.py"]
        with self.assertRaisesRegex(ValueError,"missing regression test"):
            validate(record,ROOT)


if __name__=="__main__":
    unittest.main()
