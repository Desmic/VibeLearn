"""Vendor pinned game assets for the generated-world runtime.

Learner sessions never fetch third-party game assets. Build time downloads
immutable preserved GLBs, verifies their Git object identity and size, and writes
them under web/assets for same-origin serving. The current assets are CC0 1.0;
provenance is retained even though attribution is not legally required.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
USER_AGENT = "VibeLearn-pinned-build"
FETCH_ATTEMPTS = 3
FETCH_BACKOFF_SECONDS = (0.5, 1.5)

ROBOT_SOURCE_COMMIT = "0062ceaa6dd8cda2d2b69cbcc5f80724928543bf"
ROBOT_SOURCE_URL = (
    "https://raw.githubusercontent.com/age2pierre/solid-akkadi/"
    f"{ROBOT_SOURCE_COMMIT}/demo-app/public/assets/Animated_Robot.glb"
)
ROBOT_EXPECTED_BYTES = 401_024
ROBOT_EXPECTED_GIT_BLOB_SHA1 = "8784b36b4a174bfc89a31150b39f1d4fd1853dfa"
ROBOT_TARGET = "quaternius-animated-robot.glb"

BLACKSMITH_SOURCE_COMMIT = "425e0b90b9e151a9f04d83f82ba37439df5c080f"
BLACKSMITH_SOURCE_URL = (
    "https://raw.githubusercontent.com/Edward-H26/PersonalWebsite/"
    f"{BLACKSMITH_SOURCE_COMMIT}/public/models/medieval_village_pack/blacksmith.glb"
)
BLACKSMITH_EXPECTED_BYTES = 670_832
BLACKSMITH_EXPECTED_GIT_BLOB_SHA1 = "83917c55b132d8e51e6c2b969911e14c857956a8"
BLACKSMITH_TARGET = "quaternius-blacksmith.glb"

MAX_ASSET_BYTES = 2_000_000

ROBOT_PROVENANCE = """Quaternius Animated Robot — CC0 1.0 / Public Domain

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

BLACKSMITH_PROVENANCE = """Quaternius Blacksmith — CC0 1.0 / Public Domain

Original creator: Quaternius
Original model page: https://poly.pizza/m/bV52eTG1Aj
Creator pack/source: https://quaternius.com/packs/medievalvillage.html
License: CC0 1.0 Universal (Public Domain Dedication)
License text: https://creativecommons.org/publicdomain/zero/1.0/

Pinned preservation source used by VibeLearn builds:
https://github.com/Edward-H26/PersonalWebsite
Commit: 425e0b90b9e151a9f04d83f82ba37439df5c080f
Path: public/models/medieval_village_pack/blacksmith.glb
Expected Git blob SHA-1: 83917c55b132d8e51e6c2b969911e14c857956a8
Expected bytes: 670832

The preservation repository documents the Medieval Village Pack as CC0 and maps
this exact file back to the Quaternius / Poly Pizza Blacksmith model above.
VibeLearn vendors the binary at build time so learner sessions stay same-origin.
"""


def _read_url(url: str, limit: int) -> bytes:
    last_error = None
    for attempt in range(FETCH_ATTEMPTS):
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                length = response.headers.get("Content-Length")
                if length and int(length) > limit:
                    raise RuntimeError(f"Pinned game asset exceeded {limit} bytes")
                data = response.read(limit + 1)
            if len(data) > limit:
                raise RuntimeError(f"Pinned game asset exceeded {limit} bytes")
            return data
        except RuntimeError:
            # Size/policy violations are deterministic integrity failures, not retries.
            raise
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError) as error:
            last_error = error
            if attempt >= FETCH_ATTEMPTS - 1:
                break
            time.sleep(FETCH_BACKOFF_SECONDS[min(attempt, len(FETCH_BACKOFF_SECONDS) - 1)])
    raise RuntimeError(f"Pinned game-asset fetch failed after {FETCH_ATTEMPTS} attempts") from last_error


def _git_blob_sha1(data: bytes) -> str:
    header = f"blob {len(data)}\0".encode("ascii")
    return hashlib.sha1(header + data).hexdigest()  # noqa: S324 - Git object identity, not security auth.


def main() -> None:
    robot = _read_url(ROBOT_SOURCE_URL, MAX_ASSET_BYTES)
    if len(robot) != ROBOT_EXPECTED_BYTES:
        raise RuntimeError(
            f"Animated Robot size changed: expected {ROBOT_EXPECTED_BYTES}, got {len(robot)}"
        )
    robot_blob_sha = _git_blob_sha1(robot)
    if robot_blob_sha != ROBOT_EXPECTED_GIT_BLOB_SHA1:
        raise RuntimeError(
            "Animated Robot Git blob verification failed: "
            f"expected {ROBOT_EXPECTED_GIT_BLOB_SHA1}, got {robot_blob_sha}"
        )
    if robot[:4] != b"glTF":
        raise RuntimeError("Animated Robot is not a binary glTF/GLB payload")

    blacksmith = _read_url(BLACKSMITH_SOURCE_URL, MAX_ASSET_BYTES)
    if len(blacksmith) != BLACKSMITH_EXPECTED_BYTES:
        raise RuntimeError(
            f"Blacksmith size changed: expected {BLACKSMITH_EXPECTED_BYTES}, got {len(blacksmith)}"
        )
    blacksmith_blob_sha = _git_blob_sha1(blacksmith)
    if blacksmith_blob_sha != BLACKSMITH_EXPECTED_GIT_BLOB_SHA1:
        raise RuntimeError(
            "Blacksmith Git blob verification failed: "
            f"expected {BLACKSMITH_EXPECTED_GIT_BLOB_SHA1}, got {blacksmith_blob_sha}"
        )
    if blacksmith[:4] != b"glTF":
        raise RuntimeError("Blacksmith is not a binary glTF/GLB payload")

    target = ROOT / "web" / "assets"
    target.mkdir(parents=True, exist_ok=True)
    (target / ROBOT_TARGET).write_bytes(robot)
    (target / "QUATERNIUS-ANIMATED-ROBOT-LICENSE.txt").write_text(
        ROBOT_PROVENANCE, encoding="utf-8"
    )
    (target / BLACKSMITH_TARGET).write_bytes(blacksmith)
    (target / "QUATERNIUS-BLACKSMITH-LICENSE.txt").write_text(
        BLACKSMITH_PROVENANCE, encoding="utf-8"
    )

    report = {
        "assets": [
            {
                "id": "quaternius.animated-robot",
                "source_commit": ROBOT_SOURCE_COMMIT,
                "source_url": ROBOT_SOURCE_URL,
                "license": "CC0-1.0",
                "bytes": len(robot),
                "git_blob_sha1": robot_blob_sha,
                "sha256": hashlib.sha256(robot).hexdigest(),
                "target": f"web/assets/{ROBOT_TARGET}",
            },
            {
                "id": "quaternius.blacksmith",
                "source_commit": BLACKSMITH_SOURCE_COMMIT,
                "source_url": BLACKSMITH_SOURCE_URL,
                "license": "CC0-1.0",
                "bytes": len(blacksmith),
                "git_blob_sha1": blacksmith_blob_sha,
                "sha256": hashlib.sha256(blacksmith).hexdigest(),
                "target": f"web/assets/{BLACKSMITH_TARGET}",
            },
        ]
    }
    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "game-assets-vendor.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print("Pinned CC0 Animated Robot and Blacksmith verified and self-hosted.")


if __name__ == "__main__":
    main()
