"""Validate supervisor-observed capabilities before a new native review run.

This validates scope and coverage, not the truth of tool observations. The trusted
supervisor must retain actual probe results; model confidence is not a probe.
"""
import argparse
import json
from pathlib import Path

from tools.native_play_execution import validate_requirements

BASE_CHECKS = {"tool_access", "browser_provider", "tab_creation", "visible_input_response"}
MEDIA_CHECKS = {
    "motion_video": {"motion_capture", "motion_inspection"},
    "audio": {"audio_capture", "audio_inspection"},
}


def assess_preflight(requirements, identity, report):
    requirements = validate_requirements(requirements)
    if not isinstance(report, dict) or report.get("schema") != "vibelearn.native-preflight.v1":
        raise ValueError("supervisor capability preflight is required")
    for key in ("candidate_sha", "assignment_id", "session_id", "model"):
        expected = identity.get(key)
        if not isinstance(expected, str) or not expected.strip() or report.get(key) != expected:
            raise ValueError(f"preflight {key} mismatch")
    checks = report.get("checks")
    if not isinstance(checks, dict):
        raise ValueError("preflight checks must be an object")
    for name, check in checks.items():
        if not isinstance(name, str) or not name.strip() or not isinstance(check, dict):
            raise ValueError("invalid capability check")
        if not isinstance(check.get("status"), str) or check["status"] not in {"verified", "unavailable", "unverified"}:
            raise ValueError("capability status must be explicit")
        observation = check.get("observation")
        if not isinstance(observation, str) or not observation.strip():
            raise ValueError("capability check needs a retained probe observation or reason")
    required = BASE_CHECKS | set(requirements["required_capabilities"])
    modalities = requirements.get("review_modalities", [])
    if not isinstance(modalities, list) or any(not isinstance(m, str) or m not in MEDIA_CHECKS for m in modalities):
        raise ValueError("unsupported review modality")
    for modality in modalities:
        required |= MEDIA_CHECKS[modality]
    missing = sorted(name for name in required if checks.get(name, {}).get("status") != "verified")
    return {
        "ready": not missing,
        "missing_checks": missing,
        "verified_capabilities": sorted(name for name in requirements["required_capabilities"]
                                        if checks.get(name, {}).get("status") == "verified"),
        "automatic_dispatch": False,
        "product_acceptance": "undetermined",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, required=True)
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8"))
    result = assess_preflight(config["requirements"], config["identity"], config.get("preflight"))
    print(json.dumps(result, indent=2))
    raise SystemExit(0 if result["ready"] else 2)


if __name__ == "__main__":
    main()
