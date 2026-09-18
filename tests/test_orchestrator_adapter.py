import copy
import json
import unittest
from pathlib import Path

from app.orchestrator_adapter import (
    CONTRACT_VERSION, ContractError, EffectUnknown, VibeLearnAdapter,
    validate_incident_record, validate_outcome_record, validate_start_request,
)

FIXTURE = Path(__file__).resolve().parent / "fixtures" / "orchestrator_adapter_v01.json"


def descriptor():
    return {
        "contract_versions": [CONTRACT_VERSION],
        "operations": {"core": [
            "describe_capabilities", "start_run", "get_run",
            "lookup_operation", "cancel_run",
        ]},
        "execution": ["repo_edit", "test_execution"],
        "review": {"independent_context": True, "executable_reproduction": True},
        "evidence": {"candidate_digest": True},
        "budget": {"model_call_limit": "enforced", "cost_limit": "observed_only"},
        "privacy": {"secret_redaction": True},
    }


def request():
    return {
        "contract_version": CONTRACT_VERSION,
        "request_id": "req-1",
        "idempotency_key": "repair-1",
        "actor_ref": "vibelearn:service/automation",
        "purpose": "implement_and_review_product_change",
        "required_capabilities": [
            "repo_edit", "review.independent_context",
            "review.executable_reproduction", "budget.model_call_limit.enforced",
        ],
        "extensions": {"vibelearn.fixture": {"future": True}},
        "run_request": {
            "goal_ref": "vibelearn:goal/level1-quality@2",
            "requested_outcome": "Repair the escaped quality-system failure.",
            "repository": {
                "repo_ref": "Desmic/VibeLearn", "base_revision": "a" * 40,
                "allowed_read_scope": ["repo"], "allowed_write_scope": ["web/", "tests/"],
            },
            "context_refs": ["vibelearn:context/user-review@2"],
            "work_requirements": {"required_capabilities": ["repo_edit", "test_execution"]},
            "review_requirements": [
                {
                    "requirement_id": "story",
                    "profile_ref": "vibelearn:profile/story@4",
                    "required": True, "blocking": True,
                },
                {
                    "requirement_id": "art-world",
                    "profile_ref": "vibelearn:profile/art-world@3",
                    "required": True, "blocking": True,
                },
            ],
            "budget": {"max_model_calls": 30},
        },
    }


def snapshot(story="passed", art="passed", candidate="candidate-2"):
    return {
        "run_ref": "terminal_pm:run/1",
        "revision": 11,
        "state": "completed",
        "orchestration_disposition": "candidate_available",
        "candidate_refs": [candidate],
        "worker_activity_refs": ["activity/old-worker", "activity/replacement-worker"],
        "review_results": [
            {
                "requirement_id": "story",
                "profile_ref": "vibelearn:profile/story@4",
                "candidate_ref": candidate,
                "status": story,
            },
            {
                "requirement_id": "art-world",
                "profile_ref": "vibelearn:profile/art-world@3",
                "candidate_ref": candidate,
                "status": art,
            },
        ],
        "evidence_refs": [
            {"id": "trace", "kind": "browser_trace", "candidate_ref": candidate}
        ],
    }


class FakeTransport:
    def __init__(self):
        self.descriptor = descriptor()
        self.calls = []
        self.raise_start_unknown = False
        self.raise_cancel_unknown = False
        self.store_unknown_receipt = True
        self.lookup_results = {}
        self.snapshot = snapshot()

    def describe_capabilities(self):
        self.calls.append(("describe_capabilities",))
        return copy.deepcopy(self.descriptor)

    def start_run(self, value):
        self.calls.append(("start_run", copy.deepcopy(value)))
        receipt = {
            "request_id": value["request_id"],
            "idempotency_key": value["idempotency_key"],
            "intent_digest": value["intent_digest"],
            "effect_status": "effect_confirmed",
            "run_ref": "terminal_pm:run/1",
        }
        if self.raise_start_unknown:
            if self.store_unknown_receipt:
                receipt["effect_status"] = "acknowledged"
                self.lookup_results[value["idempotency_key"]] = copy.deepcopy(receipt)
            raise EffectUnknown()
        self.lookup_results[value["idempotency_key"]] = copy.deepcopy(receipt)
        return receipt

    def lookup_operation(self, *, request_id, idempotency_key, intent_digest):
        self.calls.append(("lookup_operation", request_id, idempotency_key, intent_digest))
        return copy.deepcopy(self.lookup_results.get(idempotency_key))

    def get_run(self, run_ref):
        self.calls.append(("get_run", copy.deepcopy(run_ref)))
        return copy.deepcopy(self.snapshot)

    def cancel_run(self, value):
        self.calls.append(("cancel_run", copy.deepcopy(value)))
        receipt = {
            "request_id": value["request_id"],
            "idempotency_key": value["idempotency_key"],
            "intent_digest": value["intent_digest"],
            "effect_status": "acknowledged",
            "run_ref": value["run_ref"],
        }
        if self.raise_cancel_unknown:
            if self.store_unknown_receipt:
                receipt["effect_status"] = "effect_unknown"
                self.lookup_results[value["idempotency_key"]] = copy.deepcopy(receipt)
            raise EffectUnknown()
        self.lookup_results[value["idempotency_key"]] = copy.deepcopy(receipt)
        return receipt


class OrchestratorAdapterTests(unittest.TestCase):
    @staticmethod
    def fixture():
        return json.loads(FIXTURE.read_text(encoding="utf-8"))

    def test_serialized_fixture_expresses_real_task_and_required_boundary_states(self):
        fixture = self.fixture()
        value = validate_start_request(fixture["start_request"])
        self.assertEqual(
            value["run_request"]["repository"]["base_revision"],
            "02d8e80e81df2e96262d75a17124a3a3d4ca483e",
        )
        self.assertIn("Terminal PM adapter retry contract", value["run_request"]["requested_outcome"])
        self.assertEqual(
            set(fixture["run_snapshots"]),
            {"success", "reviewer_defect", "unresolved"},
        )

    def test_serialized_fixture_run_states_preserve_vibelearn_acceptance_authority(self):
        fixture = self.fixture()
        run_request = fixture["start_request"]["run_request"]
        success = VibeLearnAdapter.consume_run(fixture["run_snapshots"]["success"], run_request)
        defect = VibeLearnAdapter.consume_run(
            fixture["run_snapshots"]["reviewer_defect"], run_request
        )
        unresolved = VibeLearnAdapter.consume_run(
            fixture["run_snapshots"]["unresolved"], run_request
        )
        self.assertTrue(success["ready_for_vibelearn_evaluation"])
        self.assertEqual(success["product_acceptance"], "undetermined")
        self.assertEqual(success["candidate_ref"]["kind"], "candidate")
        self.assertEqual(
            success["candidate_ref"]["artifact_refs"][0]["kind"], "artifact"
        )
        self.assertFalse(defect["ready_for_vibelearn_evaluation"])
        self.assertIn("contract-safety", defect["blocking_review_ids"])
        self.assertFalse(unresolved["ready_for_vibelearn_evaluation"])
        self.assertIn("contract-safety", unresolved["blocking_review_ids"])

    def test_typed_opaque_refs_survive_outcome_and_incident_validation(self):
        fixture = self.fixture()
        outcome = validate_outcome_record(fixture["outcome"])
        incident = validate_incident_record(fixture["incident"], outcome)
        self.assertEqual(outcome["run_ref"]["system"], "terminal_pm")
        self.assertEqual(outcome["build_ref"]["system"], "vibelearn")
        self.assertEqual(incident["candidate_ref"]["kind"], "candidate")

    def test_serialized_outcome_and_incident_keep_exact_cross_system_lineage(self):
        fixture = self.fixture()
        outcome = validate_outcome_record(fixture["outcome"])
        incident = validate_incident_record(fixture["incident"], outcome)
        self.assertEqual(incident["originating_run_ref"], outcome["run_ref"])
        self.assertEqual(incident["candidate_ref"], outcome["candidate_ref"])
        self.assertEqual(incident["build_ref"], outcome["build_ref"])

    def test_fixture_carries_no_model_visible_credentials(self):
        fixture = self.fixture()
        forbidden_keys = {"password", "token", "cookie", "database_url", "api_key"}

        def walk(value):
            if isinstance(value, dict):
                for key, child in value.items():
                    self.assertNotIn(key.lower(), forbidden_keys)
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)

        walk(fixture)

    def test_successful_candidate_keeps_exact_evidence_and_product_authority_separate(self):
        transport = FakeTransport()
        adapter = VibeLearnAdapter(transport)
        adapter.start_run(request())
        result = adapter.get_run("terminal_pm:run/1", request()["run_request"])
        self.assertTrue(result["ready_for_vibelearn_evaluation"])
        self.assertEqual(result["candidate_ref"], "candidate-2")
        self.assertEqual(result["candidate_evidence_refs"][0]["candidate_ref"], "candidate-2")
        self.assertEqual(result["product_acceptance"], "undetermined")

    def test_required_critics_are_independent_and_unresolved_does_not_average_to_pass(self):
        transport = FakeTransport()
        transport.snapshot = snapshot(story="passed", art="unresolved")
        result = VibeLearnAdapter(transport).get_run(
            "terminal_pm:run/1", request()["run_request"]
        )
        self.assertEqual(result["review_statuses"], {"story": "passed", "art-world": "unresolved"})
        self.assertEqual(result["blocking_review_ids"], ["art-world"])
        self.assertFalse(result["ready_for_vibelearn_evaluation"])

    def test_reviewer_proven_defect_blocks_candidate(self):
        transport = FakeTransport()
        transport.snapshot = snapshot(story="failed")
        result = VibeLearnAdapter(transport).get_run(
            "terminal_pm:run/1", request()["run_request"]
        )
        self.assertEqual(result["blocking_review_ids"], ["story"])
        self.assertFalse(result["ready_for_vibelearn_evaluation"])

    def test_unsupported_critic_capability_blocks_before_dispatch(self):
        transport = FakeTransport()
        value = request()
        value["required_capabilities"].append("review.physical_device_execution")
        with self.assertRaises(ContractError) as error:
            VibeLearnAdapter(transport).start_run(value)
        self.assertEqual(error.exception.code, "UNSUPPORTED_CAPABILITY")
        self.assertFalse(any(call[0] == "start_run" for call in transport.calls))

    def test_required_review_semantics_derive_hard_capabilities(self):
        fixture = self.fixture()
        value = fixture["start_request"]
        value["required_capabilities"] = [
            item for item in value["required_capabilities"]
            if not item.startswith("review.")
        ]
        transport = FakeTransport()
        transport.descriptor["review"]["independent_context"] = False
        with self.assertRaises(ContractError) as error:
            VibeLearnAdapter(transport).start_run(value)
        self.assertEqual(error.exception.code, "UNSUPPORTED_CAPABILITY")
        self.assertIn("review.independent_context", str(error.exception))
        self.assertFalse(any(call[0] == "start_run" for call in transport.calls))

    def test_hard_budget_does_not_downgrade_to_observed_only(self):
        transport = FakeTransport()
        value = request()
        value["required_capabilities"].append("budget.cost_limit.enforced")
        with self.assertRaises(ContractError) as error:
            VibeLearnAdapter(transport).start_run(value)
        self.assertEqual(error.exception.code, "BUDGET_NOT_ENFORCEABLE")

    def test_unknown_start_effect_reconciles_and_never_blindly_redispatches(self):
        transport = FakeTransport()
        transport.raise_start_unknown = True
        receipt = VibeLearnAdapter(transport).start_run(request())
        self.assertEqual(receipt["effect_status"], "acknowledged")
        self.assertEqual(
            [x[0] for x in transport.calls if x[0] in {"start_run", "lookup_operation"}],
            ["lookup_operation", "start_run", "lookup_operation"],
        )
        self.assertEqual(sum(x[0] == "start_run" for x in transport.calls), 1)

    def test_unknown_start_effect_stays_unknown_without_reconciliation_evidence(self):
        transport = FakeTransport()
        transport.raise_start_unknown = True
        transport.store_unknown_receipt = False
        with self.assertRaises(ContractError) as error:
            VibeLearnAdapter(transport).start_run(request())
        self.assertEqual(error.exception.code, "EFFECT_UNKNOWN")
        self.assertEqual(sum(x[0] == "start_run" for x in transport.calls), 1)

    def test_unknown_cancel_effect_stays_uncertain(self):
        transport = FakeTransport()
        transport.raise_cancel_unknown = True
        with self.assertRaises(ContractError) as error:
            VibeLearnAdapter(transport).cancel_run(
                run_ref="terminal_pm:run/1", expected_revision=11,
                request_id="cancel-1", idempotency_key="cancel-key",
                actor_ref="vibelearn:service/automation",
            )
        self.assertEqual(error.exception.code, "EFFECT_UNKNOWN")
        self.assertEqual(sum(x[0] == "cancel_run" for x in transport.calls), 1)

    def test_same_idempotency_key_with_materially_different_payload_conflicts(self):
        transport = FakeTransport()
        adapter = VibeLearnAdapter(transport)
        adapter.start_run(request())
        changed = request()
        changed["run_request"]["requested_outcome"] = "Different outcome"
        with self.assertRaises(ContractError) as error:
            adapter.start_run(changed)
        self.assertEqual(error.exception.code, "IDEMPOTENCY_CONFLICT")

    def test_retry_after_adapter_restart_reconciles_by_key_and_intent_digest(self):
        transport = FakeTransport()
        first = VibeLearnAdapter(transport).start_run(request())
        retry = request()
        retry["request_id"] = "req-after-restart"
        second = VibeLearnAdapter(transport).start_run(retry)
        self.assertEqual(second, first)
        self.assertEqual(sum(x[0] == "start_run" for x in transport.calls), 1)

    def test_changed_payload_after_adapter_restart_detects_idempotency_conflict(self):
        transport = FakeTransport()
        VibeLearnAdapter(transport).start_run(request())
        changed = request()
        changed["request_id"] = "req-after-restart"
        changed["run_request"]["requested_outcome"] = "A materially different outcome"
        with self.assertRaises(ContractError) as error:
            VibeLearnAdapter(transport).start_run(changed)
        self.assertEqual(error.exception.code, "IDEMPOTENCY_CONFLICT")
        self.assertEqual(sum(x[0] == "start_run" for x in transport.calls), 1)

    def test_same_intended_operation_with_new_request_id_reconciles_without_redispatch(self):
        transport = FakeTransport()
        adapter = VibeLearnAdapter(transport)
        first = adapter.start_run(request())
        retry = request()
        retry["request_id"] = "req-2"
        second = adapter.start_run(retry)
        self.assertEqual(second, first)
        self.assertEqual(sum(x[0] == "start_run" for x in transport.calls), 1)
        lookups = [x for x in transport.calls if x[0] == "lookup_operation"]
        self.assertGreaterEqual(len(lookups), 2)
        self.assertEqual(lookups[-1][1:3], ("req-2", "repair-1"))
        self.assertEqual(len(lookups[-1][3]), 64)

    def test_multiple_candidates_without_active_ref_are_ambiguous(self):
        transport = FakeTransport()
        transport.snapshot = snapshot(candidate="candidate-2")
        transport.snapshot["candidate_refs"] = ["candidate-1", "candidate-2"]
        result = VibeLearnAdapter(transport).get_run(
            "terminal_pm:run/1", request()["run_request"]
        )
        self.assertEqual(result["candidate_selection"], "ambiguous")
        self.assertIsNone(result["candidate_ref"])
        self.assertFalse(result["ready_for_vibelearn_evaluation"])

    def test_explicit_active_candidate_resolves_multi_candidate_snapshot(self):
        transport = FakeTransport()
        transport.snapshot = snapshot(candidate="candidate-2")
        transport.snapshot["candidate_refs"] = ["candidate-1", "candidate-2"]
        transport.snapshot["active_candidate_ref"] = "candidate-2"
        result = VibeLearnAdapter(transport).get_run(
            "terminal_pm:run/1", request()["run_request"]
        )
        self.assertEqual(result["candidate_selection"], "explicit")
        self.assertEqual(result["candidate_ref"], "candidate-2")
        self.assertTrue(result["ready_for_vibelearn_evaluation"])

    def test_duplicate_required_review_results_block_instead_of_overwriting(self):
        transport = FakeTransport()
        transport.snapshot["review_results"].append(copy.deepcopy(
            transport.snapshot["review_results"][0]
        ))
        result = VibeLearnAdapter(transport).get_run(
            "terminal_pm:run/1", request()["run_request"]
        )
        self.assertEqual(result["review_statuses"]["story"], "duplicate")
        self.assertEqual(result["duplicate_review_ids"], ["story"])
        self.assertIn("story", result["blocking_review_ids"])
        self.assertFalse(result["ready_for_vibelearn_evaluation"])

    def test_completed_run_without_candidate_available_disposition_is_not_ready(self):
        transport = FakeTransport()
        transport.snapshot["orchestration_disposition"] = "finished"
        result = VibeLearnAdapter(transport).get_run(
            "terminal_pm:run/1", request()["run_request"]
        )
        self.assertFalse(result["ready_for_vibelearn_evaluation"])

    def test_candidate_change_invalidates_prior_review_and_stale_evidence(self):
        transport = FakeTransport()
        transport.snapshot = snapshot(candidate="candidate-2")
        transport.snapshot["review_results"][0]["candidate_ref"] = "candidate-1"
        transport.snapshot["evidence_refs"].append(
            {"id": "old-trace", "kind": "browser_trace", "candidate_ref": "candidate-1"}
        )
        result = VibeLearnAdapter(transport).get_run(
            "terminal_pm:run/1", request()["run_request"]
        )
        self.assertEqual(result["stale_review_ids"], ["story"])
        self.assertEqual(result["blocking_review_ids"], ["story"])
        self.assertEqual(len(result["candidate_evidence_refs"]), 1)
        self.assertEqual(len(result["unlinked_evidence_refs"]), 1)

    def test_worker_replacement_lineage_is_preserved(self):
        result = VibeLearnAdapter(FakeTransport()).get_run(
            "terminal_pm:run/1", request()["run_request"]
        )
        self.assertEqual(
            result["worker_activity_refs"],
            ["activity/old-worker", "activity/replacement-worker"],
        )

    def test_product_rejection_can_become_incident_linked_child_repair_run(self):
        adapter = VibeLearnAdapter(FakeTransport())
        child = adapter.build_repair_request(
            request(),
            request_id="req-2",
            idempotency_key="repair-2",
            parent_run_ref="terminal_pm:run/1",
            incident_ref="vibelearn:incident/user-rejection-1",
            requested_outcome="Repair the escaped storytelling failure.",
            context_refs=["vibelearn:evidence/user-review-ur17"],
            base_revision="b" * 40,
        )
        self.assertEqual(child["purpose"], "diagnose_and_repair_escaped_failure")
        self.assertEqual(child["run_request"]["parent_run_ref"], "terminal_pm:run/1")
        self.assertEqual(
            child["run_request"]["incident_ref"], "vibelearn:incident/user-rejection-1"
        )
        self.assertEqual(child["run_request"]["repository"]["base_revision"], "b" * 40)
        self.assertEqual(
            [x["requirement_id"] for x in child["run_request"]["review_requirements"]],
            ["story", "art-world"],
        )

    def test_unknown_additive_extension_is_preserved_but_not_control_authority(self):
        transport = FakeTransport()
        value = request()
        value["extensions"]["terminal_pm.future_hint"] = {"anything": [1, 2, 3]}
        VibeLearnAdapter(transport).start_run(value)
        sent = next(x[1] for x in transport.calls if x[0] == "start_run")
        self.assertEqual(sent["extensions"]["terminal_pm.future_hint"]["anything"], [1, 2, 3])


if __name__ == "__main__":
    unittest.main()
