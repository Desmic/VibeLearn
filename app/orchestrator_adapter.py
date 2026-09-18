"""Semantic v0.1 boundary between VibeLearn and an external orchestrator.

No Terminal PM Agent internals live here. The transport is replaceable and the
adapter only enforces the invariants in docs/ORCHESTRATOR-ADAPTER-CONTRACT.md.
"""
from __future__ import annotations

import copy
import hashlib
import json
from typing import Any, Mapping, Protocol

CONTRACT_VERSION = "0.1"
CORE_OPERATIONS = {
    "describe_capabilities", "start_run", "get_run", "lookup_operation", "cancel_run",
}
EFFECT_STATUSES = {"rejected", "acknowledged", "effect_confirmed", "effect_unknown"}
REVIEW_STATUSES = {"passed", "failed", "unresolved", "blocked"}


class ContractError(ValueError):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


class EffectUnknown(RuntimeError):
    """Transport cannot prove whether a mutating request took effect."""


class Transport(Protocol):
    def describe_capabilities(self) -> Mapping[str, Any]: ...
    def start_run(self, request: Mapping[str, Any]) -> Mapping[str, Any]: ...
    def lookup_operation(
        self, *, request_id: str, idempotency_key: str, intent_digest: str
    ) -> Mapping[str, Any] | None: ...
    def get_run(self, run_ref: Any) -> Mapping[str, Any]: ...
    def cancel_run(self, request: Mapping[str, Any]) -> Mapping[str, Any]: ...


def _key(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _require_text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ContractError("INVALID_REFERENCE", f"{field} is required")
    return value


def _require_ref(value: Any, field: str) -> Any:
    """Accept the draft contract's opaque text or typed cross-system ref."""
    if isinstance(value, str) and value.strip():
        return value
    if isinstance(value, Mapping):
        for key in ("system", "kind", "id"):
            _require_text(value.get(key), f"{field}.{key}")
        return copy.deepcopy(dict(value))
    raise ContractError("INVALID_REFERENCE", f"{field} is required")


def _receipt(value: Mapping[str, Any]) -> dict[str, Any]:
    if not isinstance(value, Mapping) or value.get("effect_status") not in EFFECT_STATUSES:
        raise ContractError("INTERNAL_ERROR", "invalid operation receipt")
    _require_text(value.get("request_id"), "receipt.request_id")
    _require_text(value.get("idempotency_key"), "receipt.idempotency_key")
    digest = _require_text(value.get("intent_digest"), "receipt.intent_digest")
    if len(digest) != 64 or any(ch not in "0123456789abcdef" for ch in digest):
        raise ContractError("INTERNAL_ERROR", "receipt.intent_digest must be sha256 hex")
    return copy.deepcopy(dict(value))


def capability_tokens(descriptor: Mapping[str, Any]) -> set[str]:
    """Translate the illustrative descriptor into negotiated capability tokens."""
    tokens = set(descriptor.get("execution") or [])
    for namespace in ("review", "evidence", "privacy"):
        for name, value in (descriptor.get(namespace) or {}).items():
            if value is True:
                tokens.add(f"{namespace}.{name}")
            elif isinstance(value, str):
                tokens.add(f"{namespace}.{name}.{value}")
    for name, level in (descriptor.get("budget") or {}).items():
        if isinstance(level, str):
            tokens.add(f"budget.{name}.{level}")
    tokens.update(descriptor.get("capability_tokens") or [])
    return tokens


OUTCOME_SOURCES = {"human", "model", "critic", "telemetry"}
INCIDENT_STATUSES = {"open", "diagnosed", "repairing", "resolved"}


def validate_outcome_record(record: Mapping[str, Any]) -> dict[str, Any]:
    """Validate fixture/adapter lineage without choosing a production store."""
    if not isinstance(record, Mapping) or record.get("schema") != "vibelearn.automation-outcome.v0.1":
        raise ContractError("INVALID_REFERENCE", "unsupported automation outcome record")
    value = copy.deepcopy(dict(record))
    _require_text(value.get("outcome_ref"), "outcome.outcome_ref")
    for field in ("build_ref", "run_ref", "candidate_ref"):
        _require_ref(value.get(field), f"outcome.{field}")
    for field in ("observation", "observed_at"):
        _require_text(value.get(field), f"outcome.{field}")
    if value.get("source") not in OUTCOME_SOURCES:
        raise ContractError("INVALID_REFERENCE", "outcome.source is invalid")
    evidence = value.get("evidence_refs")
    if not isinstance(evidence, list) or not evidence:
        raise ContractError("INVALID_REFERENCE", "outcome.evidence_refs are required")
    return value


def validate_incident_record(
    record: Mapping[str, Any], outcome: Mapping[str, Any] | None = None
) -> dict[str, Any]:
    """Validate an escaped-failure record and, when supplied, exact outcome lineage."""
    if not isinstance(record, Mapping) or record.get("schema") != "vibelearn.automation-incident.v0.1":
        raise ContractError("INVALID_REFERENCE", "unsupported automation incident record")
    value = copy.deepcopy(dict(record))
    for field in ("incident_ref", "outcome_ref", "problem_summary", "escape_summary"):
        _require_text(value.get(field), f"incident.{field}")
    for field in ("build_ref", "originating_run_ref", "candidate_ref"):
        _require_ref(value.get(field), f"incident.{field}")
    if value.get("status") not in INCIDENT_STATUSES:
        raise ContractError("INVALID_REFERENCE", "incident.status is invalid")
    evidence = value.get("evidence_refs")
    if not isinstance(evidence, list) or not evidence:
        raise ContractError("INVALID_REFERENCE", "incident.evidence_refs are required")
    if outcome is not None:
        normalized = validate_outcome_record(outcome)
        expected = {
            "outcome_ref": normalized["outcome_ref"],
            "build_ref": normalized["build_ref"],
            "originating_run_ref": normalized["run_ref"],
            "candidate_ref": normalized["candidate_ref"],
        }
        for field, expected_value in expected.items():
            if value.get(field) != expected_value:
                raise ContractError(
                    "INVALID_REFERENCE", f"incident.{field} does not match outcome lineage"
                )
    return value


def required_review_capabilities(run_request: Mapping[str, Any]) -> list[str]:
    """Derive hard runtime capabilities from required review semantics."""
    required = []
    for review in run_request.get("review_requirements") or []:
        if not isinstance(review, Mapping) or review.get("required", True) is not True:
            continue
        independence = review.get("independence") or {}
        if independence.get("separate_from_builder") is True or independence.get("fresh_context_first_pass") is True:
            required.append("review.independent_context")
        policy = review.get("evidence_policy") or {}
        if policy.get("execute_reproduction_when_possible") is True:
            required.append("review.executable_reproduction")
    return list(dict.fromkeys(required))


def validate_start_request(request: Mapping[str, Any]) -> dict[str, Any]:
    if not isinstance(request, Mapping) or request.get("contract_version") != CONTRACT_VERSION:
        raise ContractError("UNSUPPORTED_CONTRACT_VERSION", "start_run requires contract 0.1")
    value = copy.deepcopy(dict(request))
    for field in ("request_id", "idempotency_key", "actor_ref", "purpose"):
        _require_text(value.get(field), field)
    required = value.get("required_capabilities") or []
    if not isinstance(required, list) or not all(isinstance(x, str) and x for x in required):
        raise ContractError("UNSUPPORTED_CAPABILITY", "required_capabilities must be strings")
    run = value.get("run_request")
    if not isinstance(run, Mapping):
        raise ContractError("INVALID_REFERENCE", "run_request is required")
    if run.get("goal_ref") in (None, "", {}):
        raise ContractError("INVALID_REFERENCE", "run_request.goal_ref is required")
    _require_text(run.get("requested_outcome"), "run_request.requested_outcome")
    repo = run.get("repository")
    if not isinstance(repo, Mapping):
        raise ContractError("INVALID_REFERENCE", "run_request.repository is required")
    _require_text(repo.get("base_revision"), "repository.base_revision")
    work = run.get("work_requirements") or {}
    work_required = work.get("required_capabilities") or []
    if not isinstance(work_required, list) or not all(isinstance(x, str) and x for x in work_required):
        raise ContractError("UNSUPPORTED_CAPABILITY", "work required_capabilities must be strings")
    seen = set()
    for review in run.get("review_requirements") or []:
        if not isinstance(review, Mapping):
            raise ContractError("INVALID_REFERENCE", "review requirement must be an object")
        rid = _require_text(review.get("requirement_id"), "review requirement_id")
        if rid in seen or review.get("profile_ref") in (None, "", {}):
            raise ContractError("INVALID_REFERENCE", f"invalid review requirement: {rid}")
        seen.add(rid)
    return value


class VibeLearnAdapter:
    def __init__(self, transport: Transport):
        self.transport = transport
        self._seen_idempotency: dict[str, str] = {}

    def describe_capabilities(self) -> dict[str, Any]:
        descriptor = copy.deepcopy(dict(self.transport.describe_capabilities()))
        if CONTRACT_VERSION not in (descriptor.get("contract_versions") or []):
            raise ContractError("UNSUPPORTED_CONTRACT_VERSION", "orchestrator does not support 0.1")
        core = set((descriptor.get("operations") or {}).get("core") or [])
        missing = sorted(CORE_OPERATIONS - core)
        if missing:
            raise ContractError("UNSUPPORTED_CAPABILITY", "missing core operations: " + ", ".join(missing))
        return descriptor

    def require_capabilities(self, required: list[str]) -> None:
        tokens = capability_tokens(self.describe_capabilities())
        missing = sorted(set(required) - tokens)
        if not missing:
            return
        code = (
            "BUDGET_NOT_ENFORCEABLE"
            if any(x.startswith("budget.") and x.endswith(".enforced") for x in missing)
            else "UNSUPPORTED_CAPABILITY"
        )
        raise ContractError(code, "unsupported capabilities: " + ", ".join(missing))

    @staticmethod
    def _intent_digest(request: Mapping[str, Any]) -> str:
        # request_id identifies a transport attempt, while idempotency_key
        # identifies the intended external effect. A safe retry may use a new
        # request_id but must not change the intended payload.
        payload = copy.deepcopy(dict(request))
        payload.pop("request_id", None)
        payload.pop("idempotency_key", None)
        payload.pop("intent_digest", None)
        return hashlib.sha256(_key(payload).encode()).hexdigest()

    def _remember_idempotency(self, request: Mapping[str, Any]) -> None:
        key = request["idempotency_key"]
        digest = self._intent_digest(request)
        previous = self._seen_idempotency.get(key)
        if previous is not None and previous != digest:
            raise ContractError("IDEMPOTENCY_CONFLICT", "same key used for different intended payload")
        self._seen_idempotency[key] = digest

    def _lookup_existing(
        self, request_id: str, idempotency_key: str, intent_digest: str, operation: str
    ):
        found = self.transport.lookup_operation(
            request_id=request_id,
            idempotency_key=idempotency_key,
            intent_digest=intent_digest,
        )
        if found is None:
            return None
        return self._validate_reconciled(found, idempotency_key, intent_digest, operation)

    @staticmethod
    def _validate_reconciled(
        found: Mapping[str, Any], idempotency_key: str, intent_digest: str, operation: str
    ) -> dict[str, Any]:
        receipt = _receipt(found)
        # A retry may use a new request_id. The original authoritative receipt
        # is still the same operation when the idempotency key matches.
        if receipt["idempotency_key"] != idempotency_key:
            raise ContractError("INTERNAL_ERROR", "reconciled receipt idempotency mismatch")
        if receipt["intent_digest"] != intent_digest:
            raise ContractError("IDEMPOTENCY_CONFLICT", "same key belongs to a different intended payload")
        if receipt["effect_status"] == "effect_unknown":
            raise ContractError("EFFECT_UNKNOWN", f"{operation} remains unknown; do not retry")
        return receipt

    def start_run(self, request: Mapping[str, Any]) -> dict[str, Any]:
        value = validate_start_request(request)
        work = value["run_request"].get("work_requirements") or {}
        required = list(dict.fromkeys(
            (value.get("required_capabilities") or [])
            + (work.get("required_capabilities") or [])
            + required_review_capabilities(value["run_request"])
        ))
        self._remember_idempotency(value)
        intent_digest = self._intent_digest(value)
        existing = self._lookup_existing(
            value["request_id"], value["idempotency_key"], intent_digest, "start_run"
        )
        if existing is not None:
            return existing
        self.require_capabilities(required)
        outbound = copy.deepcopy(value)
        outbound["intent_digest"] = intent_digest
        try:
            receipt = _receipt(self.transport.start_run(outbound))
            return self._validate_reconciled(
                receipt, value["idempotency_key"], intent_digest, "start_run"
            )
        except EffectUnknown:
            return self._reconcile(
                value["request_id"], value["idempotency_key"], intent_digest, "start_run"
            )

    def cancel_run(
        self, *, run_ref: Any, expected_revision: Any, request_id: str,
        idempotency_key: str, actor_ref: str
    ) -> dict[str, Any]:
        request = {
            "contract_version": CONTRACT_VERSION,
            "request_id": _require_text(request_id, "request_id"),
            "idempotency_key": _require_text(idempotency_key, "idempotency_key"),
            "actor_ref": _require_text(actor_ref, "actor_ref"),
            "purpose": "cancel_run",
            "run_ref": copy.deepcopy(run_ref),
            "expected_revision": expected_revision,
        }
        _require_ref(run_ref, "run_ref")
        self._remember_idempotency(request)
        intent_digest = self._intent_digest(request)
        existing = self._lookup_existing(
            request_id, idempotency_key, intent_digest, "cancel_run"
        )
        if existing is not None:
            return existing
        self.describe_capabilities()
        outbound = copy.deepcopy(request)
        outbound["intent_digest"] = intent_digest
        try:
            receipt = _receipt(self.transport.cancel_run(outbound))
            return self._validate_reconciled(
                receipt, idempotency_key, intent_digest, "cancel_run"
            )
        except EffectUnknown:
            return self._reconcile(
                request_id, idempotency_key, intent_digest, "cancel_run"
            )

    def _reconcile(
        self, request_id: str, idempotency_key: str, intent_digest: str, operation: str
    ) -> dict[str, Any]:
        found = self.transport.lookup_operation(
            request_id=request_id,
            idempotency_key=idempotency_key,
            intent_digest=intent_digest,
        )
        if found is None:
            raise ContractError("EFFECT_UNKNOWN", f"{operation} remains unknown; do not retry")
        return self._validate_reconciled(found, idempotency_key, intent_digest, operation)

    def get_run(self, run_ref: Any, original_run_request: Mapping[str, Any]) -> dict[str, Any]:
        _require_ref(run_ref, "run_ref")
        return self.consume_run(self.transport.get_run(copy.deepcopy(run_ref)), original_run_request)

    @staticmethod
    def consume_run(snapshot: Mapping[str, Any], original_run_request: Mapping[str, Any]) -> dict[str, Any]:
        """Return only VibeLearn-facing semantics; never synthesize product acceptance."""
        candidates = snapshot.get("candidate_refs") or []
        if not isinstance(candidates, list):
            candidates = []
        active = snapshot.get("active_candidate_ref")
        candidate = None
        candidate_selection = "missing"
        if active is not None:
            matches = [item for item in candidates if _key(item) == _key(active)]
            if len(matches) == 1:
                candidate = copy.deepcopy(matches[0])
                candidate_selection = "explicit"
            else:
                candidate_selection = "invalid_active"
        elif len(candidates) == 1:
            candidate = copy.deepcopy(candidates[0])
            candidate_selection = "single"
        elif len(candidates) > 1:
            candidate_selection = "ambiguous"
        candidate_key = _key(candidate) if candidate is not None else None

        required = {
            item["requirement_id"]: item
            for item in (original_run_request.get("review_requirements") or [])
            if item.get("required", True)
        }
        results = {}
        duplicate_review_ids = set()
        for item in snapshot.get("review_results") or []:
            if not isinstance(item, Mapping) or not item.get("requirement_id"):
                continue
            rid = item["requirement_id"]
            if rid in results:
                duplicate_review_ids.add(rid)
                continue
            results[rid] = item
        statuses, blocking, stale = {}, [], []
        for rid, requirement in required.items():
            if rid in duplicate_review_ids:
                statuses[rid] = "duplicate"
                blocking.append(rid)
                continue
            result = results.get(rid)
            if result is None:
                statuses[rid] = "missing"
                if requirement.get("blocking", True):
                    blocking.append(rid)
                continue
            status = result.get("status")
            statuses[rid] = status
            exact = (
                status in REVIEW_STATUSES
                and _key(result.get("profile_ref")) == _key(requirement.get("profile_ref"))
                and candidate_key is not None
                and _key(result.get("candidate_ref")) == candidate_key
            )
            if not exact:
                stale.append(rid)
                if requirement.get("blocking", True):
                    blocking.append(rid)
            elif status != "passed" and requirement.get("blocking", True):
                blocking.append(rid)

        linked, unlinked = [], []
        for evidence in snapshot.get("evidence_refs") or []:
            if (
                isinstance(evidence, Mapping)
                and candidate_key is not None
                and _key(evidence.get("candidate_ref")) == candidate_key
            ):
                linked.append(copy.deepcopy(evidence))
            else:
                unlinked.append(copy.deepcopy(evidence))

        ready = (
            snapshot.get("state") == "completed"
            and snapshot.get("orchestration_disposition") == "candidate_available"
            and candidate is not None
            and candidate_selection in {"single", "explicit"}
            and bool(linked)
            and not blocking
            and not duplicate_review_ids
        )
        return {
            "run_ref": copy.deepcopy(snapshot.get("run_ref")),
            "revision": snapshot.get("revision"),
            "state": snapshot.get("state"),
            "orchestration_disposition": snapshot.get("orchestration_disposition"),
            "candidate_ref": copy.deepcopy(candidate),
            "candidate_selection": candidate_selection,
            "candidate_evidence_refs": linked,
            "unlinked_evidence_refs": unlinked,
            "worker_activity_refs": copy.deepcopy(snapshot.get("worker_activity_refs") or []),
            "review_statuses": statuses,
            "blocking_review_ids": sorted(set(blocking)),
            "stale_review_ids": sorted(set(stale)),
            "duplicate_review_ids": sorted(duplicate_review_ids),
            "ready_for_vibelearn_evaluation": ready,
            "product_acceptance": "undetermined",
        }

    def build_repair_request(
        self, parent_request: Mapping[str, Any], *, request_id: str, idempotency_key: str,
        parent_run_ref: Any, incident_ref: Any, requested_outcome: str,
        context_refs: list[Any], base_revision: str
    ) -> dict[str, Any]:
        """Create a normal child run; incidents do not need a second orchestration API."""
        child = copy.deepcopy(dict(parent_request))
        child["request_id"] = _require_text(request_id, "request_id")
        child["idempotency_key"] = _require_text(idempotency_key, "idempotency_key")
        child["purpose"] = "diagnose_and_repair_escaped_failure"
        run = child["run_request"]
        run["parent_run_ref"] = _require_ref(parent_run_ref, "parent_run_ref")
        run["incident_ref"] = _require_ref(incident_ref, "incident_ref")
        run["requested_outcome"] = _require_text(requested_outcome, "requested_outcome")
        run["context_refs"] = list(run.get("context_refs") or []) + copy.deepcopy(context_refs)
        run["repository"]["base_revision"] = _require_text(base_revision, "base_revision")
        return validate_start_request(child)
