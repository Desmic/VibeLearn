import unittest

from tools.critic_task_policy import ASTRA, LUNA, recommend_review


class CriticTaskPolicyTests(unittest.TestCase):
    def test_creative_direction_starts_with_astra(self):
        decision = recommend_review("creative_direction", capabilities_ready=True)
        self.assertEqual((decision.action, decision.model), ("assign", ASTRA))

    def test_bounded_checks_start_with_astra(self):
        for task in ("bounded_play", "checkpoint", "evidence_triage"):
            with self.subTest(task=task):
                self.assertEqual(recommend_review(task, capabilities_ready=True).model, ASTRA)

    def test_reported_uncertainty_triggers_fallback(self):
        for signal in ("uncertain", "blocked"):
            decision = recommend_review("bounded_play", capabilities_ready=True,
                                        signal=signal, reviewer_model=LUNA)
            self.assertEqual((decision.action, decision.model), ("review_with_astra", ASTRA))

    def test_missing_tools_are_not_fixed_by_model_escalation(self):
        for task in ("creative_direction", "bounded_play"):
            decision = recommend_review(task, capabilities_ready=False,
                                        signal="uncertain", reviewer_model=LUNA)
            self.assertEqual((decision.action, decision.model), ("repair_environment", None))

    def test_false_clear_cannot_hide_missing_ending(self):
        decision = recommend_review("bounded_play", capabilities_ready=True,
                                    signal="clear", reviewer_model=LUNA,
                                    required_checkpoints={"maze.exit", "maze.ending"},
                                    verified_checkpoints={"maze.exit"},
                                    independent_audit_passed=True)
        self.assertEqual(decision.action, "audit_evidence")

    def test_complete_unrelated_task_can_record_scoped_result(self):
        decision = recommend_review("checkpoint", capabilities_ready=True,
                                    signal="clear", reviewer_model=LUNA,
                                    required_checkpoints={"garden.saved", "garden.resumed"},
                                    verified_checkpoints={"garden.saved", "garden.resumed"},
                                    independent_audit_passed=True)
        self.assertEqual(decision.action, "record_scoped_result")

    def test_self_report_needs_independent_audit_even_with_full_coverage(self):
        decision = recommend_review("checkpoint", capabilities_ready=True,
                                    signal="clear", reviewer_model=LUNA,
                                    required_checkpoints={"result"}, verified_checkpoints={"result"})
        self.assertEqual(decision.action, "audit_evidence")

    def test_empty_assignment_does_not_vacuously_pass(self):
        self.assertEqual(recommend_review("checkpoint", capabilities_ready=True,
                         signal="clear", reviewer_model=LUNA,
                         independent_audit_passed=True).action, "audit_evidence")

    def test_conflict_overrides_confident_complete_report(self):
        decision = recommend_review("checkpoint", capabilities_ready=True,
                                    signal="clear", reviewer_model=LUNA,
                                    required_checkpoints={"saved"}, verified_checkpoints={"saved"},
                                    independent_audit_passed=True, evidence_conflict=True)
        self.assertEqual(decision.model, ASTRA)

    def test_luna_cannot_supply_creative_acceptance(self):
        decision = recommend_review("creative_direction", capabilities_ready=True,
                                    signal="clear", reviewer_model=LUNA,
                                    required_checkpoints={"critique"}, verified_checkpoints={"critique"},
                                    independent_audit_passed=True)
        self.assertEqual(decision.model, ASTRA)

    def test_astra_uncertainty_stays_unresolved(self):
        decision = recommend_review("creative_direction", capabilities_ready=True,
                                    signal="uncertain", reviewer_model=ASTRA)
        self.assertEqual((decision.action, decision.model), ("unresolved", None))

    def test_verified_defect_requests_repair_not_another_opinion(self):
        decision = recommend_review("bounded_play", capabilities_ready=True,
                                    signal="defect", reviewer_model=LUNA,
                                    independent_audit_passed=True)
        self.assertEqual((decision.action, decision.model), ("repair_game", None))

    def test_unverified_defect_needs_audit(self):
        self.assertEqual(recommend_review("bounded_play", capabilities_ready=True,
                         signal="defect", reviewer_model=LUNA).action, "audit_evidence")

    def test_invalid_flags_and_unknown_routes_fail_closed(self):
        for changes in ({"task": "unknown"}, {"signal": "probably"},
                        {"capabilities_ready": "yes"}, {"independent_audit_passed": "true"},
                        {"verified_checkpoints": "ending"}, {"reviewer_model": "unknown"}):
            args = dict(task="checkpoint", capabilities_ready=True, signal="clear", reviewer_model=LUNA)
            args.update(changes)
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                recommend_review(**args)


if __name__ == "__main__":
    unittest.main()
