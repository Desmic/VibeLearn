"""Harness-owned native GUI action guard and receipt validation.

Only a trusted executor may own callbacks, capture references and checkpoint
verification. This is not a sandbox against an agent with direct tool access.
"""
import asyncio
import copy
import hashlib
import re
from pathlib import Path

ACTIONS = {"click", "key", "drag", "scroll", "type", "reload", "navigate"}
CAPTURE_MODALITIES = {"ax", "screenshot", "motion_video", "audio"}


def validate_native_artifacts(execution, root):
    """CLI sealing step: hashes must match real captures inside the capture root."""
    root = Path(root).resolve()
    for event in execution["events"]:
        if event["kind"] != "observation":
            continue
        relative = Path(event["ref"])
        path = (root / relative).resolve()
        if relative.is_absolute() or not path.is_relative_to(root):
            raise ValueError("native capture must stay inside capture root")
        try:
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
        except OSError as exc:
            raise ValueError("native capture is unavailable") from exc
        if digest != event["sha256"]:
            raise ValueError("native capture digest mismatch")


def _names(value, label):
    if not isinstance(value, list) or not value or not all(
        isinstance(x, str) and x.strip() for x in value
    ) or len(set(value)) != len(value):
        raise ValueError(f"{label} needs unique non-empty names")
    return value


def validate_requirements(value):
    if not isinstance(value, dict) or value.get("mode") != "native_gui":
        raise ValueError("native execution mode must be native_gui")
    if type(value.get("max_inputs")) is not int or value["max_inputs"] < 1:
        raise ValueError("max_inputs must be a positive integer")
    _names(value.get("required_capabilities"), "required_capabilities")
    _names(value.get("required_checkpoints"), "required_checkpoints")
    rules = value.get("capture_rules", {})
    if not isinstance(rules, dict):
        raise ValueError("capture_rules must be a checkpoint mapping")
    for checkpoint, rule in rules.items():
        if checkpoint not in value["required_checkpoints"] or not isinstance(rule, dict):
            raise ValueError("capture rule needs an assigned checkpoint")
        if set(rule) != {"modality", "action", "occurrence", "relation"}:
            raise ValueError("capture rule needs modality, action, occurrence and relation")
        if (not isinstance(rule["modality"], str) or rule["modality"] not in CAPTURE_MODALITIES
                or not isinstance(rule["action"], str) or rule["action"] not in ACTIONS):
            raise ValueError("unsupported capture modality or action")
        if type(rule["occurrence"]) is not int or rule["occurrence"] < 1:
            raise ValueError("capture action occurrence must be a positive integer")
        if not isinstance(rule["relation"], str) or rule["relation"] not in {"before", "after"}:
            raise ValueError("capture relation must be before or after")
    return copy.deepcopy(value)


def _capture_gaps(requirements, execution):
    """Check declared capture type and immediate input boundary, not semantics."""
    events = execution["events"]
    observations = {e["ref"]: (i, e) for i, e in enumerate(events) if e["kind"] == "observation"}
    gaps = []
    for checkpoint, rule in requirements.get("capture_rules", {}).items():
        capture = observations.get(execution["checkpoints"].get(checkpoint))
        targets = [i for i, e in enumerate(events)
                   if e["kind"] == "input" and e["action"] == rule["action"]]
        reason = None
        if capture is None:
            reason = "missing_capture"
        elif capture[1].get("modality") != rule["modality"]:
            reason = "wrong_or_unknown_modality"
        elif len(targets) < rule["occurrence"]:
            reason = "missing_action"
        else:
            target = targets[rule["occurrence"] - 1]
            observation = capture[0]
            between = events[min(target, observation) + 1:max(target, observation)]
            if events[target]["outcome"] != "succeeded":
                reason = "action_failed"
            elif (rule["relation"] == "before") != (observation < target):
                reason = "wrong_side_of_action"
            elif any(e["kind"] == "input" for e in between):
                reason = "intervening_input"
        if reason:
            gaps.append(dict(checkpoint=checkpoint, reason=reason))
    return gaps


def capture_repair_steps(requirements, execution):
    """Bounded evidence follow-ups; never authorize dispatch or change a verdict."""
    steps = []
    events = execution["events"]
    for gap in _capture_gaps(requirements, execution):
        rule = requirements["capture_rules"][gap["checkpoint"]]
        targets = [i for i, e in enumerate(events) if e["kind"] == "input" and e["action"] == rule["action"]]
        target = targets[rule["occurrence"] - 1] if len(targets) >= rule["occurrence"] else None
        if gap["reason"] == "missing_action":
            next_step = "perform_assigned_action"
        elif target is None:
            next_step = "collect_and_verify" if rule["relation"] == "before" else "perform_assigned_action"
        elif (rule["relation"] == "after" and events[target]["outcome"] == "succeeded"
              and not any(e["kind"] == "input" for e in events[target + 1:])):
            next_step = "collect_and_verify"
        else:
            next_step = "replay_in_new_run"
        steps.append(dict(gap, requirement=copy.deepcopy(rule), next_step=next_step))
    return steps


def validate_native_execution(requirements, execution, *, candidate_sha, assignment_id, session_id):
    requirements = validate_requirements(requirements)
    if not isinstance(execution, dict) or execution.get("schema") != "vibelearn.native-play.v1":
        raise ValueError("native play execution is required")
    if not isinstance(execution.get("model"), str) or not execution["model"].strip():
        raise ValueError("native executor model identity is required")
    for key, expected in (("candidate_sha", candidate_sha), ("assignment_id", assignment_id),
                          ("session_id", session_id)):
        if execution.get(key) != expected:
            raise ValueError(f"native execution {key} mismatch")
    capabilities = _names(execution.get("verified_capabilities"), "verified_capabilities")
    if not set(requirements["required_capabilities"]) <= set(capabilities):
        raise ValueError("native execution lacks required capabilities")
    events = execution.get("events")
    if not isinstance(events, list) or not events:
        raise ValueError("native execution needs events")
    observations = {}
    inputs = 0
    fresh = False
    for event in events:
        if not isinstance(event, dict):
            raise ValueError("invalid native event")
        if event.get("kind") == "observation":
            if "modality" in event and (not isinstance(event["modality"], str)
                                        or event["modality"] not in CAPTURE_MODALITIES):
                raise ValueError("unsupported observation modality")
            ref = event.get("ref")
            if not isinstance(ref, str) or not ref.strip() or ref in observations:
                raise ValueError("observation reference must be unique")
            if not isinstance(event.get("sha256"), str) or not re.fullmatch(r"[a-f0-9]{64}", event["sha256"]):
                raise ValueError("observation capture digest is required")
            observations[ref] = event
            fresh = True
        elif event.get("kind") == "input":
            if not fresh:
                raise ValueError("fresh observation required before each input")
            if event.get("action") not in ACTIONS or event.get("outcome") not in {"succeeded", "failed"}:
                raise ValueError("invalid or unfinished native input")
            inputs += 1
            fresh = False
        else:
            raise ValueError("unknown native event kind")
    if inputs > requirements["max_inputs"]:
        raise ValueError("native input budget exceeded")
    checkpoints = execution.get("checkpoints")
    if not isinstance(checkpoints, dict):
        raise ValueError("native checkpoints must be an object")
    for name, ref in checkpoints.items():
        if name not in requirements["required_checkpoints"] or not isinstance(ref, str) or ref not in observations:
            raise ValueError("checkpoint needs an assigned name and observed capture")
    return {
        "input_count": inputs,
        "successful_input_count": sum(e.get("kind") == "input" and e.get("outcome") == "succeeded" for e in events),
        "observation_count": len(observations),
        "missing_checkpoints": sorted(set(requirements["required_checkpoints"]) - checkpoints.keys()),
        "observed_after_last_input": fresh,
        "capture_gaps": _capture_gaps(requirements, execution),
    }


class NativePlayGuard:
    """One in-process run; reserve attempts before dispatch, including failures.

    Executor must expose only this route to inputs, provide one action per send,
    and preserve the ledger across its own lifecycle. No resume/transport system
    is implemented here. Direct CUA calls are not automatically intercepted.
    """

    def __init__(self, requirements, *, candidate_sha, assignment_id, session_id, capabilities, model):
        self.requirements = validate_requirements(requirements)
        if not isinstance(model, str) or not model.strip():
            raise ValueError("native executor model identity is required")
        _names(capabilities, "capabilities")
        if not set(self.requirements["required_capabilities"]) <= set(capabilities):
            raise ValueError("required capabilities unavailable")
        self._record = dict(schema="vibelearn.native-play.v1", model=model, candidate_sha=candidate_sha,
                            assignment_id=assignment_id, session_id=session_id,
                            verified_capabilities=list(capabilities), events=[], checkpoints={})
        self._lock = asyncio.Lock()
        self._fresh = False
        self._inputs = 0

    async def observe(self, capture):
        """Capture callback returns {ref, sha256}; executor retains the artifact."""
        async with self._lock:
            item = await capture()
            trial = copy.deepcopy(self._record)
            trial["events"].append(dict(item, kind="observation"))
            validate_native_execution(self.requirements, trial, **self._identity())
            self._record = trial
            self._fresh = True
            return copy.deepcopy(item)

    async def input(self, action, send):
        async with self._lock:
            if action not in ACTIONS:
                raise ValueError("unsupported GUI input")
            if self._inputs >= self.requirements["max_inputs"]:
                raise ValueError("native input budget exhausted")
            if not self._fresh:
                raise ValueError("fresh observation required before input")
            if (set(self.requirements["required_checkpoints"]) <= self._record["checkpoints"].keys()
                    and not _capture_gaps(self.requirements, self._record)):
                raise ValueError("assigned checkpoints complete; stop inputs")
            # Reserve destructive-to-evidence transitions only after their
            # assigned capture is verified. Rules contain no game identifiers.
            occurrence = 1 + sum(e["kind"] == "input" and e["action"] == action
                                 for e in self._record["events"])
            for checkpoint, rule in self.requirements.get("capture_rules", {}).items():
                if (rule["relation"], rule["action"], rule["occurrence"]) != ("before", action, occurrence):
                    continue
                ref = self._record["checkpoints"].get(checkpoint)
                recent = []
                for event in reversed(self._record["events"]):
                    if event["kind"] == "input":
                        break
                    recent.append(event)
                if not any(e["ref"] == ref and e.get("modality") == rule["modality"] for e in recent):
                    raise ValueError(f"required pre-input capture missing: {checkpoint}")
            self._inputs += 1
            self._fresh = False
            event = dict(kind="input", action=action, outcome="failed")
            self._record["events"].append(event)
            result = await send()
            event["outcome"] = "succeeded"
            return result

    async def verify_checkpoint(self, name, observation_ref):
        """Independent verifier calls this, never the player model directly."""
        async with self._lock:
            trial = copy.deepcopy(self._record)
            trial["checkpoints"][name] = observation_ref
            validate_native_execution(self.requirements, trial, **self._identity())
            self._record = trial

    def _identity(self):
        return {key: self._record[key] for key in ("candidate_sha", "assignment_id", "session_id")}

    async def export(self):
        async with self._lock:
            validate_native_execution(self.requirements, self._record, **self._identity())
            return copy.deepcopy(self._record)
