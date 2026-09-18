import json
import tempfile
import unittest
from pathlib import Path

from tools.check_critic_review import COVERAGE,V2_GATES,CRITERION_MODALITIES
from tools.check_release_gate import gate


class ReleaseGateTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        self.sha="a"*40
        files={
            "cold_observer_report":"cold.json",
            "interactive_trace":"interactive.json",
            "motion_video":"motion.webm",
            "caption_blind_motion":"caption-blind.webm",
            "audio_listening":"audio.txt",
            "screenshot":"screen.png",
            "runtime_trace":"runtime.json",
            "authoritative_replay":"replay.json",
            "ci_report":"ci.json",
            "source_inspection":"source.txt",
        }
        for name in files.values():(self.root/name).write_text("fixture",encoding="utf-8")
        def ev(modality):
            return {"ref":files[modality],"modality":modality,"candidate_sha":self.sha}
        criteria={}
        for name in {c for group in V2_GATES.values() for c in group}:
            refs=[ev(alternatives[0]) for alternatives in CRITERION_MODALITIES.get(name,())] or [ev("source_inspection")]
            criteria[name]={"rating":9,"reason":"fixture","evidence":refs,"counterexample_attempt":"fixture"}
        self.review={
            "schema_version":2,"candidate_sha":self.sha,"method":"independent_agent",
            "environment":"fixture","limitations":"fixture","prior_context":"restricted",
            "user_authority":"user","review_order":"cold_observer_then_intent",
            "cold_observer_context":"runtime evidence only","technical_status":"passed",
            "technical_evidence":[ev("ci_report")],"criteria":criteria,
            "coverage":{name:{"status":"observed","note":"fixture","evidence":[ev("interactive_trace")]} for name in COVERAGE},
            "blockers":[]
        }
        self.status={
            "schema":"vibelearn.quality-status.v1","phase":"phase1_system_repair","level2_allowed":False,
            "rejected_candidates":[],"accepted_candidates":[],
            "policy":{
                "preview_requires_review_schema":2,
                "preview_requires_status":"ready_for_user_review",
                "phase_advance_requires_human_acceptance":True,
                "manual_preview_override_requires_explicit_user_request":True,
                "manual_preview_override_forbidden_for_known_rejected_candidate":True,
            }
        }

    def test_v2_ready_candidate_can_be_previewed_without_acceptance(self):
        result=gate(self.sha,"preview",self.status,self.review,self.root)
        self.assertEqual(result["status"],"allowed")
        self.assertEqual(result["authority"],"internal_v2_ready")

    def test_rejected_candidate_cannot_be_repreviewed(self):
        self.status["rejected_candidates"]=[self.sha]
        with self.assertRaisesRegex(ValueError,"explicitly rejected"):
            gate(self.sha,"preview",self.status,self.review,self.root,explicit_preview_override=True)

    def test_incomplete_preview_needs_explicit_user_override(self):
        self.review["criteria"]["audio_atmosphere"]["rating"]=None
        self.review["criteria"]["audio_atmosphere"].pop("evidence")
        self.review["criteria"]["audio_atmosphere"].pop("counterexample_attempt")
        with self.assertRaisesRegex(ValueError,"preview blocked"):
            gate(self.sha,"preview",self.status,self.review,self.root)
        result=gate(self.sha,"preview",self.status,self.review,self.root,explicit_preview_override=True)
        self.assertEqual(result["authority"],"explicit_user_preview_override")

    def test_override_cannot_bypass_blocker(self):
        self.review["criteria"]["audio_atmosphere"]["rating"]=None
        self.review["criteria"]["audio_atmosphere"].pop("evidence")
        self.review["criteria"]["audio_atmosphere"].pop("counterexample_attempt")
        self.review["blockers"]=[{
            "finding":"world causality unclear","retest":"cold observe again",
            "evidence":[{"ref":"interactive.json","modality":"interactive_trace","candidate_sha":self.sha}]
        }]
        with self.assertRaisesRegex(ValueError,"review_incomplete"):
            gate(self.sha,"preview",self.status,self.review,self.root,explicit_preview_override=True)


    def test_preview_promotion_workflow_is_release_gate_driven(self):
        workflow=(Path(__file__).resolve().parents[1]/".github"/"workflows"/"promote-preview.yml").read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:",workflow)
        self.assertIn("evidence_run_id:",workflow)
        self.assertIn("review_record:",workflow)
        self.assertIn("build_review_index.py",workflow)
        self.assertIn("ingest_critic_results.py",workflow)
        self.assertIn('docs/reviews/results/$CANDIDATE_SHA',workflow)
        self.assertIn("check_release_gate.py",workflow)
        self.assertIn('gh","api"',workflow)
        self.assertIn("git merge-base --is-ancestor",workflow)
        self.assertIn("deploy/render-supabase",workflow)
        self.assertIn("Render auto-deploy is intentionally off",workflow)

    def test_phase_advance_requires_human_acceptance_and_flag(self):
        with self.assertRaisesRegex(ValueError,"disabled"):
            gate(self.sha,"phase-advance",self.status,None,self.root)
        self.status["level2_allowed"]=True
        with self.assertRaisesRegex(ValueError,"explicit human acceptance"):
            gate(self.sha,"phase-advance",self.status,None,self.root)
        self.status["accepted_candidates"]=[self.sha]
        result=gate(self.sha,"phase-advance",self.status,None,self.root)
        self.assertEqual(result["authority"],"human_acceptance")


if __name__=="__main__":
    unittest.main()
