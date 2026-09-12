"""Vendor pinned game assets for the generated-world runtime.

Learner sessions never fetch third-party game assets. Build time downloads one
immutable preserved GLB, verifies its Git object identity and size, and writes it
under web/assets for same-origin serving. The asset itself is CC0 1.0; provenance
is retained even though attribution is not legally required.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
USER_AGENT = "VibeLearn-pinned-build"

ROBOT_SOURCE_COMMIT = "0062ceaa6dd8cda2d2b69cbcc5f80724928543bf"
ROBOT_SOURCE_URL = (
    "https://raw.githubusercontent.com/age2pierre/solid-akkadi/"
    f"{ROBOT_SOURCE_COMMIT}/demo-app/public/assets/Animated_Robot.glb"
)
ROBOT_EXPECTED_BYTES = 401_024
ROBOT_EXPECTED_GIT_BLOB_SHA1 = "8784b36b4a174bfc89a31150b39f1d4fd1853dfa"
ROBOT_TARGET = "quaternius-animated-robot.glb"
MAX_ASSET_BYTES = 2_000_000

PROVENANCE = """Quaternius Animated Robot — CC0 1.0 / Public Domain

Original creator: Quaternius
Original model page: https://poly.pizza/m/QCm7qe9uNJ
Creator pack/source: https://quaternius.com/packs/ultimatedanimatedcharacterpack.html
License: CC0 1.0 Universal (Public Domain Dedication)
License text: https://creativecommons.org/publicdomain/zero/1.0/

Pinned preservation source used by VibeLearn builds:
https://github.com/age2pierre/solid-akkadi
Commit: 0062ceaa6dd8cda2d2b69cbcc5f80724928543bf
Path: demo-app/public/assets/Animated_Robot.glb
Expected Git blob SHA-1: 8784b36b4a174bfc89a31150b39f1d4fd1853dfa
Expected bytes: 401024

VibeLearn vendors the binary at build time so learner sessions stay same-origin.
The primitive Pip representation remains the runtime fallback if this asset cannot
be loaded or instantiated.
"""


def _read_url(url: str, limit: int) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        length = response.headers.get("Content-Length")
        if length and int(length) > limit:
            raise RuntimeError(f"Pinned game asset exceeded {limit} bytes")
        data = response.read(limit + 1)
    if len(data) > limit:
        raise RuntimeError(f"Pinned game asset exceeded {limit} bytes")
    return data


def _git_blob_sha1(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()  # noqa: S324 - Git object identity, not security auth.


def main() -> None:
    robot = _read_url(ROBOT_SOURCE_URL, MAX_ASSET_BYTES)
    if len(robot) != ROBOT_EXPECTED_BYTES:
        raise RuntimeError(
            f"Animated Robot size changed: expected {ROBOT_EXPECTED_BYTES}, got {len(robot)}"
        )
    blob_sha = _git_blob_sha1(robot)
    if blob_sha != ROBOT_EXPECTED_GIT_BLOB_SHA1:
        raise RuntimeError(
            "Animated Robot Git blob verification failed: "
            f"expected {ROBOT_EXPECTED_GIT_BLOB_SHA1}, got {blob_sha}"
        )
    if robot[:4] != b"glTF":
        raise RuntimeError("Animated Robot is not a binary glTF/GLB payload")

    target = ROOT / "web" / "assets"
    target.mkdir(parents=True, exist_ok=True)
    (target / ROBOT_TARGET).write_bytes(robot)
    (target / "QUATERNIUS-ANIMATED-ROBOT-LICENSE.txt").write_text(
        PROVENANCE, encoding="utf-8"
    )

    report = {
        "assets": [
            {
                "id": "quaternius.animated-robot",
                "source_commit": ROBOT_SOURCE_COMMIT,
                "source_url": ROBOT_SOURCE_URL,
                "license": "CC0-1.0",
                "bytes": len(robot),
                "git_blob_sha1": blob_sha,
                "sha256": hashlib.sha256(robot).hexdigest(),
                "target": f"web/assets/{ROBOT_TARGET}",
            }
        ]
    }
    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "game-assets-vendor.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print("Pinned CC0 Animated Robot verified and self-hosted.")


if __name__ == "__main__":
    main()
