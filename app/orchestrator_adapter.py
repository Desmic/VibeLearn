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
        self, *, request_id: str, idempotency_key: str
    ) -> Mapping[str, Any] | None: ...
    def get_run(self, run_ref: Any) -> Mapping[str, Any]: ...
    def cancel_run(self, request: Mapping[str, Any]) -> Mapping[str, Any]: ...


def _key(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def _require_text(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ContractError("INVALID_REFERENCE", f"{field} is required")
    return value


def _receipt(value: Mapping[str, Any]) -> dict[str, Any]:
    if not isinstance(value, Mapping) or value.get("effect_status") not in EFFECT_STATUSES:
        raise ContractError("INTERNAL_ERROR", "invalid operation receipt")
    _require_text(value.get("request_id"), "receipt.request_id")
    _require_text(value.get("idempotency_key"), "receipt.idempotency_key")
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

    def _remember_idempotency(self, request: Mapping[str, Any]) -> None:
        key = request["idempotency_key"]
        digest = hashlib.sha256(_key(request).encode()).hexdigest()
        previous = self._seen_idempotency.get(key)
        if previous is not None and previous != digest:
            raise ContractError("IDEMPOTENCY_CONFLICT", "same key used for different payload")
        self._seen_idempotency[key] = digest

    def start_run(self, request: Mapping[str, Any]) -> dict[str, Any]:
        value = validate_start_request(request)
        work = value["run_request"].get("work_requirements") or {}
        required = list(dict.fromkeys(
            (value.get("required_capabilities") or [])
            + (work.get("required_capabilities") or [])
        ))
        self.require_capabilities(required)
        self._remember_idempotency(value)
        try:
            return _receipt(self.transport.start_run(copy.deepcopy(value)))
        except EffectUnknown:
            return self._reconcile(value["request_id"], value["idempotency_key"], "start_run")

    def cancel_run(
        self, *, run_ref: Any, expected_revision: Any, request_id: str,
        idempotency_key: str, actor_ref: str
    ) -> dict[str, Any]:
        self.describe_capabilities()
        request = {
            "contract_version": CONTRACT_VERSION,
            "request_id": _require_text(request_id, "request_id"),
            "idempotency_key": _require_text(idempotency_key, "idempotency_key"),
            "actor_ref": _require_text(actor_ref, "actor_ref"),
            "purpose": "cancel_run",
            "run_ref": copy.deepcopy(run_ref),
            "expected_revision": expected_revision,
        }
        if run_ref in (None, "", {}):
            raise ContractError("INVALID_REFERENCE", "run_ref is required")
        self._remember_idempotency(request)
        try:
            return _receipt(self.transport.cancel_run(copy.deepcopy(request)))
        except EffectUnknown:
            return self._reconcile(request_id, idempotency_key, "cancel_run")

    def _reconcile(self, request_id: str, idempotency_key: str, operation: str) -> dict[str, Any]:
        found = self.transport.lookup_operation(
            request_id=request_id, idempotency_key=idempotency_key
        )
        if found is None:
            raise ContractError("EFFECT_UNKNOWN", f"{operation} remains unknown; do not retry")
        receipt = _receipt(found)
        if receipt["request_id"] != request_id or receipt["idempotency_key"] != idempotency_key:
            raise ContractError("INTERNAL_ERROR", "reconciled receipt identity mismatch")
        if receipt["effect_status"] == "effect_unknown":
            raise ContractError("EFFECT_UNKNOWN", f"{operation} remains unknown; do not retry")
        return receipt

    def get_run(self, run_ref: Any, original_run_request: Mapping[str, Any]) -> dict[str, Any]:
        if run_ref in (None, "", {}):
            raise ContractError("INVALID_REFERENCE", "run_ref is required")
        return self.consume_run(self.transport.get_run(copy.deepcopy(run_ref)), original_run_request)

    @staticmethod
    def consume_run(snapshot: Mapping[str, Any], original_run_request: Mapping[str, Any]) -> dict[str, Any]:
        """Return only VibeLearn-facing semantics; never synthesize product acceptance."""
        candidates = snapshot.get("candidate_refs") or []
        candidate = candidates[-1] if isinstance(candidates, list) and candidates else None
        candidate_key = _key(candidate) if candidate is not None else None

        required = {
            item["requirement_id"]: item
            for item in (original_run_request.get("review_requirements") or [])
            if item.get("required", True)
        }
        results = {
            item.get("requirement_id"): item
            for item in (snapshot.get("review_results") or [])
            if isinstance(item, Mapping) and item.get("requirement_id")
        }
        statuses, blocking, stale = {}, [], []
        for rid, requirement in required.items():
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
            and candidate is not None
            and bool(linked)
            and not blocking
        )
        return {
            "run_ref": copy.deepcopy(snapshot.get("run_ref")),
            "revision": snapshot.get("revision"),
            "state": snapshot.get("state"),
            "orchestration_disposition": snapshot.get("orchestration_disposition"),
            "candidate_ref": copy.deepcopy(candidate),
            "candidate_evidence_refs": linked,
            "unlinked_evidence_refs": unlinked,
            "worker_activity_refs": copy.deepcopy(snapshot.get("worker_activity_refs") or []),
            "review_statuses": statuses,
            "blocking_review_ids": sorted(set(blocking)),
            "stale_review_ids": sorted(set(stale)),
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
        run["parent_run_ref"] = copy.deepcopy(parent_run_ref)
        run["incident_ref"] = copy.deepcopy(incident_ref)
        run["requested_outcome"] = _require_text(requested_outcome, "requested_outcome")
        run["context_refs"] = list(run.get("context_refs") or []) + copy.deepcopy(context_refs)
        run["repository"]["base_revision"] = _require_text(base_revision, "base_revision")
        return validate_start_request(child)
