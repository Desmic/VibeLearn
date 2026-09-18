import json
import tempfile
import unittest
from pathlib import Path

from tools.build_critic_assignments import build_assignments
from tools.materialize_ready_critic_capsules import materialize_ready


class ReadyCriticCapsuleTests(unittest.TestCase):
    def test_ready_assignments_materialize_and_blocked_assignments_do_not(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            evidence_root=root/"evidence";evidence_root.mkdir()
            assignments_dir=root/"assignments";assignments_dir.mkdir()
            output=root/"capsules"
            sha="a"*40

            files=[
                ("opening/caption-blind.webm","caption_blind_motion"),
                ("opening/motion.webm","motion_video"),
                ("opening/audio.webm","audio_capture"),
                ("controls/trace.json","interactive_trace"),
                ("foundation/replay.json","authoritative_replay"),
                ("foundation/source.tar","source_inspection"),
            ]
            for ref,modality in files:
                path=evidence_root/ref;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(modality.encode())

            index={
                "schema":"vibelearn.review-evidence-index.v1",
                "candidate_sha":sha,
                "technical_result":"success",
                "receipts":[
                    {
                        "suite":"first-words-opening",
                        "receipt_ref":"opening/evidence-receipt.json",
                        "evidence":[
                            {"ref":"caption-blind.webm","modality":"caption_blind_motion","candidate_sha":sha},
                            {"ref":"motion.webm","modality":"motion_video","candidate_sha":sha},
                            {"ref":"audio.webm","modality":"audio_capture","candidate_sha":sha},
                        ],
                    },
                    {
                        "suite":"first-words-controls",
                        "receipt_ref":"controls/evidence-receipt.json",
                        "evidence":[
                            {"ref":"trace.json","modality":"interactive_trace","candidate_sha":sha},
                        ],
                    },
                    {
                        "suite":"foundation",
                        "receipt_ref":"foundation/evidence-receipt.json",
                        "evidence":[
                            {"ref":"replay.json","modality":"authoritative_replay","candidate_sha":sha},
                            {"ref":"source.tar","modality":"source_inspection","candidate_sha":sha},
                        ],
                    },
                ],
            }
            assignments=build_assignments(index)
            for name,value in assignments.items():
                (assignments_dir/f"{name}.json").write_text(json.dumps(value),encoding="utf-8")

            summary=materialize_ready(assignments_dir,evidence_root,output)
            ready={item["pass"] for item in summary["ready"]}
            blocked={item["pass"] for item in summary["blocked"]}

            self.assertIn("cold_observer",ready)
            self.assertIn("motion_audience",ready)
            self.assertIn("physicality",ready)
            self.assertIn("handoff_tutorial",ready)
            self.assertIn("audio_atmosphere",ready)
            self.assertIn("learning_transfer",ready)
            self.assertIn("cinematic_causality",blocked)
            self.assertIn("intent_comparison",blocked)

            cold=next(item for item in summary["ready"] if item["pass"]=="cold_observer")
            self.assertRegex(cold["capsule_id"],r"^sha256:[0-9a-f]{64}$")
            self.assertTrue((output/"cold_observer"/"capsule.json").is_file())
            self.assertTrue((output/"cold_observer"/"assignment.json").is_file())
            self.assertFalse((output/"cinematic_causality").exists())

    def test_missing_ready_evidence_fails_instead_of_emitting_partial_capsule(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            assignments=root/"assignments";assignments.mkdir()
            evidence=root/"evidence";evidence.mkdir()
            output=root/"capsules"
            sha="a"*40
            assignment={
                "schema":"vibelearn.critic-assignment.v1",
                "candidate_sha":sha,
                "assignment_id":"sha256:"+"1"*64,
                "pass":"cold_observer",
                "status":"ready",
                "required_evidence_groups":[["caption_blind_motion"]],
                "missing_evidence":[],
                "allowed_evidence":[
                    {"ref":"opening/missing.webm","modality":"caption_blind_motion","candidate_sha":sha}
                ],
                "allowed_modalities":["caption_blind_motion"],
                "forbidden_context":["source"],
                "questions":["What world is shown?"],
                "expected_output_modality":"cold_observer_report",
            }
            (assignments/"cold_observer.json").write_text(json.dumps(assignment),encoding="utf-8")
            with self.assertRaisesRegex(ValueError,"evidence is missing"):
                materialize_ready(assignments,evidence,output)


if __name__=="__main__":
    unittest.main()
