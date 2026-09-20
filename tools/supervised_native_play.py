"""Manual JSON-lines bridge for a trusted supervisor using native GUI tools.

This does not connect to a browser or isolate the player model's other tools.
The supervisor supplies captures, executes exactly one permitted action, and
acknowledges its tool result. An interrupted pending permit is never resumable.
"""
import argparse
import asyncio
import hashlib
import json
import sys
import uuid
from pathlib import Path

from tools.native_play_execution import NativePlayGuard, validate_native_execution, capture_repair_steps
from tools.native_capture_inbox import MAX_CAPTURE_BYTES, screenshot_extension
from tools.native_preflight import assess_preflight


async def supervise(config, root, reader, emit, capture_root=None):
    preflight = assess_preflight(config["requirements"], config["identity"], config.get("preflight"))
    if not preflight["ready"]:
        raise ValueError("native preflight incomplete: " + ", ".join(preflight["missing_checks"]))
    # Ignore caller-asserted capability names; derive them from scoped probe results.
    identity = dict(config["identity"], capabilities=preflight["verified_capabilities"])
    root = Path(root)
    root.mkdir(parents=True, exist_ok=False)
    (root / "config.json").write_text(json.dumps(config, indent=2), encoding="utf-8")
    guard = NativePlayGuard(config["requirements"], **identity)
    observations = 0
    capture_root = Path(capture_root).resolve() if capture_root is not None else None

    async def save():
        record = await guard.export()
        (root / "execution.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
        identity = {k: config["identity"][k] for k in ("candidate_sha", "assignment_id", "session_id")}
        coverage = validate_native_execution(config["requirements"], record, **identity)
        (root / "coverage.json").write_text(json.dumps(coverage, indent=2), encoding="utf-8")
        followup = dict(identity, automatic_dispatch=False,
                        capture_steps=capture_repair_steps(config["requirements"], record),
                        unverified_checkpoints=coverage["missing_checkpoints"])
        (root / "followup.json").write_text(json.dumps(followup, indent=2), encoding="utf-8")

    while line := reader.readline():
        try:
            command = json.loads(line)
            op = command["op"]
            if op == "observe":
                capture = command["text"]
                if not isinstance(capture, str) or not capture.strip():
                    raise ValueError("capture text is required")
                observations += 1
                ref = f"observation-{observations:03}.txt"
                data = capture.encode("utf-8")
                (root / ref).write_bytes(data)

                async def capture_ref():
                    return {"ref": ref, "sha256": hashlib.sha256(data).hexdigest(), "modality": "ax"}

                await guard.observe(capture_ref)
            elif op == "observe_capture":
                if capture_root is None:
                    raise ValueError("capture root is not configured")
                source = (capture_root / command["ref"]).resolve()
                if Path(command["ref"]).is_absolute() or not source.is_relative_to(capture_root):
                    raise ValueError("capture must stay inside configured root")
                with source.open("rb") as stream:
                    data = stream.read(MAX_CAPTURE_BYTES + 1)
                if len(data) > MAX_CAPTURE_BYTES:
                    raise ValueError("capture size outside limit")
                digest = hashlib.sha256(data).hexdigest()
                if digest != command["sha256"]:
                    raise ValueError("capture digest mismatch")
                suffix = screenshot_extension(data)
                observations += 1
                ref = f"observation-{observations:03}{suffix}"
                (root / ref).write_bytes(data)

                async def image_ref():
                    return dict(ref=ref, sha256=digest, modality="screenshot")

                await guard.observe(image_ref)
            elif op == "input":
                async def dispatch():
                    permit = dict(command, permit_id=uuid.uuid4().hex)
                    # Fail closed after interruption: leave pending evidence on disk.
                    pending = root / "pending.json"
                    pending.write_text(json.dumps(permit, indent=2), encoding="utf-8")
                    emit(dict(status="permit", **permit))
                    ack = json.loads(reader.readline())
                    if ack.get("op") != "ack" or ack.get("permit_id") != permit["permit_id"] or type(ack.get("succeeded")) is not bool:
                        raise ValueError("invalid acknowledgement; session cannot continue")
                    with (root / "dispatch.jsonl").open("a", encoding="utf-8") as stream:
                        stream.write(json.dumps({"permit": permit, "ack": ack}) + "\n")
                    pending.unlink()
                    if not ack["succeeded"]:
                        raise RuntimeError("native tool reported failure")

                try:
                    await guard.input(command["action"], dispatch)
                finally:
                    await save()
            elif op == "checkpoint":
                await guard.verify_checkpoint(command["name"], command["ref"])
            elif op == "stop":
                await save()
                emit({"status": "stopped"})
                return
            else:
                raise ValueError("unknown supervisor command")
            await save()
            emit({"status": "recorded", "op": op})
        except (ValueError, KeyError, RuntimeError, OSError) as exc:
            emit({"status": "rejected", "reason": str(exc)})
            if (root / "pending.json").exists():
                return


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--capture-root", type=Path)
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8"))
    asyncio.run(supervise(config, args.output, sys.stdin,
                          lambda value: print(json.dumps(value), flush=True), args.capture_root))


if __name__ == "__main__":
    main()
