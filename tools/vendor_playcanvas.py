"""Fetch a pinned PlayCanvas engine build at build time.

Learner sessions remain same-origin and CSP can stay self-only. We intentionally
resolve one immutable npm version, verify the registry-provided SRI before
extracting the ESM build, and record exact hashes in artifacts/.
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
from pathlib import Path
import tarfile
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
VERSION = "2.22.1"
METADATA_URL = f"https://registry.npmjs.org/playcanvas/{VERSION}"
EXPECTED_TARBALL = f"https://registry.npmjs.org/playcanvas/-/playcanvas-{VERSION}.tgz"
USER_AGENT = "VibeLearn-pinned-build"
MAX_TARBALL_BYTES = 12_000_000
ENGINE_MEMBER = "package/build/playcanvas.mjs"
LICENSE_MEMBER = "package/LICENSE"


def _read_url(url: str, limit: int) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=45) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise RuntimeError(f"PlayCanvas dependency exceeded {limit} bytes")
    return data


def _verify_sri(data: bytes, integrity: str) -> None:
    try:
        algorithm, encoded = integrity.split("-", 1)
    except ValueError as exc:
        raise RuntimeError("PlayCanvas npm metadata has malformed integrity") from exc
    if algorithm != "sha512":
        raise RuntimeError(f"Unsupported PlayCanvas integrity algorithm: {algorithm}")
    actual = base64.b64encode(hashlib.sha512(data).digest()).decode()
    if actual != encoded:
        raise RuntimeError("Pinned PlayCanvas npm integrity verification failed")


def main() -> None:
    metadata = json.loads(_read_url(METADATA_URL, 1_000_000))
    if metadata.get("version") != VERSION:
        raise RuntimeError("npm returned an unexpected PlayCanvas version")
    dist = metadata.get("dist") or {}
    tarball = dist.get("tarball")
    integrity = dist.get("integrity")
    if tarball != EXPECTED_TARBALL or not isinstance(integrity, str):
        raise RuntimeError("Pinned PlayCanvas npm metadata did not match the expected artifact")

    archive = _read_url(tarball, MAX_TARBALL_BYTES)
    _verify_sri(archive, integrity)

    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as package:
        members = {member.name: member for member in package.getmembers()}
        if ENGINE_MEMBER not in members or LICENSE_MEMBER not in members:
            raise RuntimeError("Pinned PlayCanvas package is missing required build artifacts")
        engine_file = package.extractfile(members[ENGINE_MEMBER])
        license_file = package.extractfile(members[LICENSE_MEMBER])
        if engine_file is None or license_file is None:
            raise RuntimeError("Pinned PlayCanvas package could not be extracted")
        engine = engine_file.read()
        license_text = license_file.read()

    target = ROOT / "web" / "vendor"
    target.mkdir(exist_ok=True)
    (target / "playcanvas.mjs").write_bytes(engine)
    (target / "PLAYCANVAS-LICENSE.txt").write_bytes(license_text)

    report = {
        "version": VERSION,
        "npm_integrity": integrity,
        "tarball_sha256": hashlib.sha256(archive).hexdigest(),
        "engine_sha256": hashlib.sha256(engine).hexdigest(),
        "engine_bytes": len(engine),
    }
    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "playcanvas-vendor.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print(f"Pinned PlayCanvas {VERSION} verified and self-hosted.")


if __name__ == "__main__":
    main()
