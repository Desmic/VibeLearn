"""Small allowlisted interpreter for engine-neutral GameRulesSpec v1.

This module owns deterministic gameplay semantics only. It does not render, perform
I/O, mutate learner evidence, or execute generated code. The existing Relay Rescue
model remains authoritative until an explicit incremental migration is proven.
"""
from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass
import re
from typing import Any


GAME_RULES_SPEC_VERSION = "1"
MAX_FIELDS = 64
MAX_ACTIONS = 64
MAX_EFFECTS_PER_TRANSITION = 32
MAX_BRANCHES_PER_ACTION = 16
MAX_EVENTS_PER_TRANSITION = 16

_ID = re.compile(r"^[A-Za-z0-9._:-]+$")
_STATE_TYPES = {"boolean", "integer", "enum"}
_BINARY_OPS = {"eq", "ne", "lt", "lte", "gt", "gte", "in"}
_NARY_OPS = {"and", "or"}
_EFFECT_OPS = {"set", "add"}


class GameRulesError(ValueError):
    """Base class for invalid rules or invalid gameplay transitions."""


class InvalidAction(GameRulesError):
    """The requested semantic action is not currently legal."""


class InvariantViolation(GameRulesError):
    """A candidate transition would violate canonical gameplay invariants."""


def _assert(condition: bool, message: str) -> None:
    if not condition:
        raise GameRulesError(f"GameRulesSpec invalid: {message}")


def _id(value: Any, label: str) -> str:
    _assert(isinstance(value, str) and bool(_ID.fullmatch(value)), f"{label} has invalid id")
    return value


def _literal(value: Any) -> bool:
    return value is None or isinstance(value, (bool, int, float, str))


def _validate_expr(expr: Any, fields: set[str], label: str) -> None:
    if _literal(expr):
        return
    _assert(isinstance(expr, dict), f"{label} must be a literal or expression object")
    if set(expr) == {"field"}:
        field = _id(expr["field"], f"{label}.field")
        _assert(field in fields, f"{label} references unknown field {field}")
        return
    op = expr.get("op")
    _assert(isinstance(op, str), f"{label}.op is required")
    if op in _BINARY_OPS:
        _assert(set(expr) == {"op", "left", "right"}, f"{label} {op} has invalid shape")
        _validate_expr(expr["left"], fields, f"{label}.left")
        right = expr["right"]
        if op == "in" and isinstance(right, list):
            _assert(all(_literal(item) for item in right), f"{label}.right list must contain literals")
        else:
            _validate_expr(right, fields, f"{label}.right")
        return
    if op in _NARY_OPS:
        _assert(set(expr) == {"op", "args"}, f"{label} {op} has invalid shape")
        args = expr["args"]
        _assert(isinstance(args, list) and 1 <= len(args) <= 16, f"{label}.args must contain 1-16 expressions")
        for index, item in enumerate(args):
            _validate_expr(item, fields, f"{label}.args[{index}]")
        return
    if op == "not":
        _assert(set(expr) == {"op", "arg"}, f"{label} not has invalid shape")
        _validate_expr(expr["arg"], fields, f"{label}.arg")
        return
    raise GameRulesError(f"GameRulesSpec invalid: {label} uses unsupported expression op {op!r}")


def _validate_effects(effects: Any, fields: dict[str, dict[str, Any]], label: str) -> None:
    _assert(isinstance(effects, list) and len(effects) <= MAX_EFFECTS_PER_TRANSITION,
            f"{label} must contain at most {MAX_EFFECTS_PER_TRANSITION} effects")
    for index, effect in enumerate(effects):
        item = f"{label}[{index}]"
        _assert(isinstance(effect, dict), f"{item} must be an object")
        op = effect.get("op")
        _assert(op in _EFFECT_OPS, f"{item} uses unsupported effect op {op!r}")
        _assert(set(effect) == {"op", "field", "value"}, f"{item} has invalid shape")
        field = _id(effect["field"], f"{item}.field")
        _assert(field in fields, f"{item} references unknown field {field}")
        _validate_expr(effect["value"], set(fields), f"{item}.value")
        if op == "add":
            _assert(fields[field]["type"] == "integer", f"{item} add requires integer field {field}")


def _validate_events(events: Any, label: str) -> None:
    _assert(isinstance(events, list) and len(events) <= MAX_EVENTS_PER_TRANSITION,
            f"{label} must contain at most {MAX_EVENTS_PER_TRANSITION} events")
    for index, event in enumerate(events):
        _id(event, f"{label}[{index}]")


def _validate_state_value(definition: dict[str, Any], value: Any, label: str) -> None:
    kind = definition["type"]
    if kind == "boolean":
        _assert(type(value) is bool, f"{label} must be boolean")
    elif kind == "integer":
        _assert(type(value) is int, f"{label} must be integer")
        if "min" in definition:
            _assert(value >= definition["min"], f"{label} is below min")
        if "max" in definition:
            _assert(value <= definition["max"], f"{label} is above max")
    elif kind == "enum":
        _assert(value in definition["values"], f"{label} must be one of declared enum values")


def validate_game_rules_spec(spec: Any) -> dict[str, Any]:
    """Validate the small v1 rules language and return the original spec."""
    _assert(isinstance(spec, dict), "spec must be an object")
    _assert(str(spec.get("schemaVersion")) == GAME_RULES_SPEC_VERSION,
            f"schemaVersion must be {GAME_RULES_SPEC_VERSION}")
    _id(spec.get("id"), "rules")
    _assert(isinstance(spec.get("version"), str) and bool(spec["version"]), "version is required")

    state = spec.get("state")
    _assert(isinstance(state, dict) and 1 <= len(state) <= MAX_FIELDS,
            f"state must declare 1-{MAX_FIELDS} fields")
    for field, definition in state.items():
        _id(field, "state field")
        _assert(isinstance(definition, dict), f"state.{field} must be an object")
        kind = definition.get("type")
        _assert(kind in _STATE_TYPES, f"state.{field} has unsupported type {kind!r}")
        _assert("initial" in definition, f"state.{field}.initial is required")
        allowed = {"type", "initial", "min", "max"} if kind == "integer" else {"type", "initial", "values"} if kind == "enum" else {"type", "initial"}
        _assert(set(definition).issubset(allowed), f"state.{field} has unsupported keys")
        if kind == "integer":
            if "min" in definition:
                _assert(type(definition["min"]) is int, f"state.{field}.min must be integer")
            if "max" in definition:
                _assert(type(definition["max"]) is int, f"state.{field}.max must be integer")
            if "min" in definition and "max" in definition:
                _assert(definition["min"] <= definition["max"], f"state.{field} min exceeds max")
        if kind == "enum":
            values = definition.get("values")
            _assert(isinstance(values, list) and 1 <= len(values) <= 32 and len(set(values)) == len(values),
                    f"state.{field}.values must be 1-32 unique literals")
            _assert(all(isinstance(value, (str, int)) and type(value) is not bool for value in values),
                    f"state.{field}.values must contain string/integer literals")
        _validate_state_value(definition, definition["initial"], f"state.{field}.initial")

    field_ids = set(state)
    invariants = spec.get("invariants", [])
    _assert(isinstance(invariants, list) and len(invariants) <= 32, "invariants must contain at most 32 rules")
    seen_invariants: set[str] = set()
    for index, invariant in enumerate(invariants):
        _assert(isinstance(invariant, dict) and set(invariant) == {"id", "expression"},
                f"invariants[{index}] has invalid shape")
        invariant_id = _id(invariant["id"], f"invariants[{index}].id")
        _assert(invariant_id not in seen_invariants, f"duplicate invariant {invariant_id}")
        seen_invariants.add(invariant_id)
        _validate_expr(invariant["expression"], field_ids, f"invariants[{index}].expression")

    actions = spec.get("actions")
    _assert(isinstance(actions, dict) and 1 <= len(actions) <= MAX_ACTIONS,
            f"actions must declare 1-{MAX_ACTIONS} actions")
    for action_id, action in actions.items():
        _id(action_id, "action")
        _assert(isinstance(action, dict), f"actions.{action_id} must be an object")
        _assert(set(action).issubset({"when", "effects", "branches", "emits"}),
                f"actions.{action_id} has unsupported keys")
        _validate_expr(action.get("when", True), field_ids, f"actions.{action_id}.when")
        has_effects = "effects" in action
        has_branches = "branches" in action
        _assert(has_effects != has_branches, f"actions.{action_id} must declare exactly one of effects or branches")
        _validate_events(action.get("emits", []), f"actions.{action_id}.emits")
        if has_effects:
            _validate_effects(action["effects"], state, f"actions.{action_id}.effects")
        else:
            branches = action["branches"]
            _assert(isinstance(branches, list) and 1 <= len(branches) <= MAX_BRANCHES_PER_ACTION,
                    f"actions.{action_id}.branches must contain 1-{MAX_BRANCHES_PER_ACTION} branches")
            for index, branch in enumerate(branches):
                label = f"actions.{action_id}.branches[{index}]"
                _assert(isinstance(branch, dict) and set(branch).issubset({"when", "effects", "emits"}) and "effects" in branch,
                        f"{label} has invalid shape")
                _validate_expr(branch.get("when", True), field_ids, f"{label}.when")
                _validate_effects(branch["effects"], state, f"{label}.effects")
                _validate_events(branch.get("emits", []), f"{label}.emits")

    objectives = spec.get("objectives", {})
    _assert(isinstance(objectives, dict) and len(objectives) <= 32, "objectives must be an object with at most 32 entries")
    for objective_id, objective in objectives.items():
        _id(objective_id, "objective")
        _assert(isinstance(objective, dict) and set(objective) == {"when"},
                f"objectives.{objective_id} has invalid shape")
        _validate_expr(objective["when"], field_ids, f"objectives.{objective_id}.when")
    return spec


def _eval(expr: Any, state: dict[str, Any]) -> Any:
    if _literal(expr):
        return expr
    if set(expr) == {"field"}:
        return state[expr["field"]]
    op = expr["op"]
    if op == "not":
        return not bool(_eval(expr["arg"], state))
    if op == "and":
        return all(bool(_eval(item, state)) for item in expr["args"])
    if op == "or":
        return any(bool(_eval(item, state)) for item in expr["args"])
    left = _eval(expr["left"], state)
    right = expr["right"] if op == "in" and isinstance(expr["right"], list) else _eval(expr["right"], state)
    if op == "eq":
        return left == right
    if op == "ne":
        return left != right
    if op == "lt":
        return left < right
    if op == "lte":
        return left <= right
    if op == "gt":
        return left > right
    if op == "gte":
        return left >= right
    if op == "in":
        return left in right
    raise GameRulesError(f"Unsupported expression op {op!r}")


def _objectives(spec: dict[str, Any], state: dict[str, Any]) -> dict[str, bool]:
    return {name: bool(_eval(definition["when"], state)) for name, definition in spec.get("objectives", {}).items()}


@dataclass(frozen=True)
class Transition:
    state: dict[str, Any]
    events: tuple[dict[str, str], ...]
    objectives: dict[str, bool]


class GameRulesEngine:
    """Deterministic, side-effect-free interpreter for one validated rules package."""

    def __init__(self, spec: dict[str, Any]):
        self.spec = deepcopy(validate_game_rules_spec(spec))
        self._state_definitions = self.spec["state"]
        self._initial = {name: deepcopy(definition["initial"]) for name, definition in self._state_definitions.items()}
        self._validate_state(self._initial)
        self._check_invariants(self._initial)

    def initial_state(self) -> dict[str, Any]:
        return deepcopy(self._initial)

    def _validate_state(self, state: Any) -> None:
        if not isinstance(state, dict) or set(state) != set(self._state_definitions):
            raise GameRulesError("Gameplay state does not match declared fields")
        for field, definition in self._state_definitions.items():
            _validate_state_value(definition, state[field], f"state.{field}")

    def _check_invariants(self, state: dict[str, Any]) -> None:
        for invariant in self.spec.get("invariants", []):
            if not bool(_eval(invariant["expression"], state)):
                raise InvariantViolation(f"Invariant {invariant['id']} would be violated")

    def _apply_effects(self, state: dict[str, Any], effects: list[dict[str, Any]]) -> None:
        for effect in effects:
            field = effect["field"]
            value = _eval(effect["value"], state)
            if effect["op"] == "set":
                state[field] = deepcopy(value)
            elif effect["op"] == "add":
                state[field] += value
            else:  # unreachable after validation; retained as fail-closed defense.
                raise GameRulesError(f"Unsupported effect op {effect['op']!r}")

    def apply(self, state: dict[str, Any], action_id: str) -> Transition:
        """Apply one semantic action atomically; invalid transitions do not mutate input state."""
        self._validate_state(state)
        action = self.spec["actions"].get(action_id)
        if action is None:
            raise InvalidAction(f"Unknown action {action_id}")
        if not bool(_eval(action.get("when", True), state)):
            raise InvalidAction(f"Action {action_id} is not currently allowed")

        effects: list[dict[str, Any]]
        events = list(action.get("emits", []))
        if "effects" in action:
            effects = action["effects"]
        else:
            branch = next((candidate for candidate in action["branches"] if bool(_eval(candidate.get("when", True), state))), None)
            if branch is None:
                raise InvalidAction(f"Action {action_id} has no valid deterministic branch")
            effects = branch["effects"]
            events.extend(branch.get("emits", []))

        candidate = deepcopy(state)
        self._apply_effects(candidate, effects)
        self._validate_state(candidate)
        self._check_invariants(candidate)
        semantic_events = tuple({"id": event_id, "action": action_id} for event_id in events)
        return Transition(state=candidate, events=semantic_events, objectives=_objectives(self.spec, candidate))

    def replay(self, actions: list[str]) -> Transition:
        """Replay a semantic action list from canonical initial state."""
        _assert(isinstance(actions, list) and len(actions) <= 512, "replay actions must be a list of at most 512 ids")
        state = self.initial_state()
        events: list[dict[str, str]] = []
        objectives = _objectives(self.spec, state)
        for action_id in actions:
            _id(action_id, "replay action")
            transition = self.apply(state, action_id)
            state = transition.state
            events.extend(transition.events)
            objectives = transition.objectives
        return Transition(state=state, events=tuple(events), objectives=objectives)
