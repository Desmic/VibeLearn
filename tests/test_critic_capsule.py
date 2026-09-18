import copy
import tempfile
import unittest
from pathlib import Path

from tools.materialize_critic_capsule import materialize,validate_capsule


class CriticCapsuleTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/"workspace";self.root.mkdir()
        self.out=Path(self.temp.name)/"capsule"
        self.sha="a"*40
        (self.root/"opening").mkdir()
        (self.root/"foundation").mkdir()
        (self.root/"opening"/"caption-blind.webm").write_bytes(b"motion")
        (self.root/"opening"/"frame.png").write_bytes(b"png")
        (self.root/"foundation"/"review-source.tar").write_bytes(b"source")
        self.assignment={
            "schema":"vibelearn.critic-assignment.v1",
            "candidate_sha":self.sha,
            "assignment_id":"sha256:"+"1"*64,
            "pass":"cold_observer",
            "status":"ready",
            "required_evidence_groups":[["caption_blind_motion","interactive_trace"]],
            "missing_evidence":[],
            "allowed_evidence":[
                {"ref":"opening/caption-blind.webm","modality":"caption_blind_motion","candidate_sha":self.sha},
                {"ref":"opening/frame.png","modality":"screenshot","candidate_sha":self.sha},
            ],
            "allowed_modalities":["caption_blind_motion","screenshot"],
            "forbidden_context":["story treatment","source inspection","creator intent"],
            "questions":["What world do you perceive?"],
            "expected_output_modality":"cold_observer_report",
        }

    def test_cold_capsule_contains_only_assignment_and_allowed_evidence(self):
        manifest=materialize(self.assignment,self.root,self.out)
        validated=validate_capsule(self.out)
        self.assertEqual(validated["capsule_id"],manifest["capsule_id"])
        refs={item["ref"] for item in validated["evidence"]}
        self.assertEqual(refs,{"opening/caption-blind.webm","opening/frame.png"})
        self.assertNotIn("foundation/review-source.tar",refs)
        evidence_files=[p for p in (self.out/"evidence").iterdir() if p.is_file()]
        self.assertEqual(len(evidence_files),2)
        self.assertTrue((self.out/"assignment.json").is_file())
        self.assertTrue((self.out/"README.md").is_file())

    def test_intent_capsule_can_include_source_only_when_assignment_allows_it(self):
        assignment=copy.deepcopy(self.assignment)
        assignment["pass"]="intent_comparison"
        assignment["assignment_id"]="sha256:"+"2"*64
        assignment["allowed_evidence"].append({
            "ref":"foundation/review-source.tar","modality":"source_inspection","candidate_sha":self.sha
        })
        manifest=materialize(assignment,self.root,self.out)
        self.assertIn("foundation/review-source.tar",{item["ref"] for item in manifest["evidence"]})
        validate_capsule(self.out)

    def test_blocked_assignment_cannot_be_materialized(self):
        assignment=copy.deepcopy(self.assignment)
        assignment["status"]="blocked_missing_evidence"
        with self.assertRaisesRegex(ValueError,"blocked critic assignment"):
            materialize(assignment,self.root,self.out)

    def test_evidence_path_cannot_escape_workspace(self):
        outside=Path(self.temp.name)/"outside.webm";outside.write_bytes(b"outside")
        assignment=copy.deepcopy(self.assignment)
        assignment["allowed_evidence"]=[{
            "ref":"../outside.webm","modality":"caption_blind_motion","candidate_sha":self.sha
        }]
        with self.assertRaisesRegex(ValueError,"escapes root"):
            materialize(assignment,self.root,self.out)

    def test_evidence_tamper_is_detected(self):
        manifest=materialize(self.assignment,self.root,self.out)
        evidence_path=self.out/manifest["evidence"][0]["capsule_ref"]
        evidence_path.write_bytes(b"changed")
        with self.assertRaisesRegex(ValueError,"size mismatch|digest mismatch"):
            validate_capsule(self.out)

    def test_untracked_capsule_file_is_rejected(self):
        materialize(self.assignment,self.root,self.out)
        (self.out/"evidence"/"unexpected.txt").write_text("leak",encoding="utf-8")
        with self.assertRaisesRegex(ValueError,"untracked files"):
            validate_capsule(self.out)

    def test_assignment_tamper_is_detected(self):
        materialize(self.assignment,self.root,self.out)
        assignment_path=self.out/"assignment.json"
        value=__import__("json").loads(assignment_path.read_text(encoding="utf-8"))
        value["assignment_id"]="sha256:"+"9"*64
        assignment_path.write_text(__import__("json").dumps(value),encoding="utf-8")
        with self.assertRaisesRegex(ValueError,"does not match assignment"):
            validate_capsule(self.out)


if __name__=="__main__":
    unittest.main()
