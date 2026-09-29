"""Vendor pinned game assets for the generated-world runtime.

Learner sessions never fetch third-party game assets. Build time verifies pinned
source sizes and hashes, packages the one selected glTF tree, and writes only
the selected GLBs under web/assets for same-origin serving. Pack-specific license
and transformation provenance stays beside each asset.
"""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path
import struct
import time
import urllib.error
import urllib.request
import zipfile

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

# Official Kenney Nature Kit 2.1 archive. Only these three small GLBs are
# extracted and served; the complete pack never becomes a learner download.
KENNEY_PACK_URL = (
    "https://kenney.nl/media/pages/assets/nature-kit/"
    "37ac38a37b-1677698939/kenney_nature-kit.zip"
)
KENNEY_PACK_BYTES = 10_537_521
KENNEY_PACK_SHA256 = "fa7974a0d342bfe63c38664ba9f8ec1a4aab8ea25f099bdc56870e33588c4d9d"
KENNEY_TREES = (
    ("tree_detailed", "kenney-tree-detailed.glb", 31_412,
     "c041daf2f0fb1d49e4325227cbcd58667adbe51e9b55e8c1f0a94b74cc521b3b"),
    ("tree_oak", "kenney-tree-oak.glb", 14_644,
     "d7fd8773674928c50c11b66d12c636d49bdcc15a8b1c7fbb98e6f63a3439a3f3"),
    ("tree_thin", "kenney-tree-thin.glb", 17_200,
     "f0f1f6861fe0446963d3be216cc628324f538bb0841bc9a8e14140313f64e2f3"),
)
KENNEY_LICENSE_TARGET = "KENNEY-NATURE-KIT-LICENSE.txt"

KENNEY_PROVENANCE = """Kenney Nature Kit 2.1 — CC0 1.0 / Public Domain

Creator and source: Kenney, https://kenney.nl/assets/nature-kit
Official archive: https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip
Archive bytes: 10537521
Archive SHA-256: fa7974a0d342bfe63c38664ba9f8ec1a4aab8ea25f099bdc56870e33588c4d9d
License: Creative Commons Zero (CC0), https://creativecommons.org/publicdomain/zero/1.0/

Vendored archive members (GLTF format):
tree_detailed.glb -> kenney-tree-detailed.glb, 31412 bytes,
  SHA-256 c041daf2f0fb1d49e4325227cbcd58667adbe51e9b55e8c1f0a94b74cc521b3b
tree_oak.glb -> kenney-tree-oak.glb, 14644 bytes,
  SHA-256 d7fd8773674928c50c11b66d12c636d49bdcc15a8b1c7fbb98e6f63a3439a3f3
tree_thin.glb -> kenney-tree-thin.glb, 17200 bytes,
  SHA-256 f0f1f6861fe0446963d3be216cc628324f538bb0841bc9a8e14140313f64e2f3

The GLBs preserve Kenney's leafsGreen and woodBark material slots so the world
can remap their surfaces. VibeLearn serves this selected subset from its own origin.
"""

# The creator's May 2022 pack page explicitly displays CC0. Its public Drive
# folder exposes separate glTF geometry and textures, so build only this one
# reviewed model into a GLB. The 22.7 MB bark normal map is not needed for this
# color/alpha comparison and is deliberately excluded from learner delivery.
BIRCH_PACK_PAGE = "https://quaternius.com/packs/ultimatestylizednature.html"
BIRCH_SOURCE_FOLDER = "https://drive.google.com/drive/folders/1-ob9Aade1RIM3A_XKoQAOG6XqF2IDAIC"
BIRCH_SOURCE_FILES = (
    ("BirchTree_5.gltf", "1_UdbvgKuhURdKP5R5Ppnsw7p3BQWAWeH", 3_418,
     "5b752e7b487fe952ca34a02e3e6117c881202179d301257346439188e671e49e"),
    ("BirchTree_5.bin", "1Ut5yJ3emg_DEjR2q21Gzat0d1VC2-YT_", 180_720,
     "7d1f1009a7609ae1b59b3e0131d63c9b8660aa0fac1aea01ebd7caaa2e6ddab5"),
    ("BirchTree_Bark.jpg", "1puC8NuyemENIPB40TOsKdqzp0EmUJe1g", 1_015_231,
     "f796f02e47bc5afddd17dc2385bbef53a352628ceb348deb1188ef04fe5deff9"),
    ("BirchTree_Leaves.png", "1RPfkjEuuEwFno9gh3U0zQndzcB8DOr_S", 77_836,
     "8b674a02017d987f8ec0448bd2a52ad788d1235f91b7f00499b4ca071f8e69fe"),
)
BIRCH_TARGET = "quaternius-birch-tree-5.glb"
BIRCH_LICENSE_TARGET = "QUATERNIUS-STYLIZED-NATURE-BIRCH-TREE-5-LICENSE.txt"
BIRCH_EXPECTED_BYTES = 1_276_252
BIRCH_EXPECTED_SHA256 = "5e7b57f866ccb1e86bdf2611ac7286939aa29e663bad0b335b0c0d4b1cf826bd"

BIRCH_PROVENANCE = """Quaternius Ultimate Stylized Nature — BirchTree_5 review asset

Creator / pack page: Quaternius, https://quaternius.com/packs/ultimatestylizednature.html
Official public glTF folder: https://drive.google.com/drive/folders/1-ob9Aade1RIM3A_XKoQAOG6XqF2IDAIC
Pack release shown on its page: May 2022. The current pack page explicitly labels
this pack CC0: https://creativecommons.org/publicdomain/zero/1.0/

The global Quaternius license page, https://quaternius.com/license.html, now
describes QAL v1.0 dated 28 August 2026 with a standalone-asset redistribution
restriction. That page says newer terms do not apply retroactively to earlier
releases. This record follows the pack-specific CC0 label; it does not claim all
Quaternius assets are CC0 or resolve the distinction for other packs.

Pinned official Drive files used for the GLB (download URL pattern:
https://drive.google.com/uc?export=download&id=<file-id>):
BirchTree_5.gltf, id 1_UdbvgKuhURdKP5R5Ppnsw7p3BQWAWeH, 3418 bytes,
  SHA-256 5b752e7b487fe952ca34a02e3e6117c881202179d301257346439188e671e49e
BirchTree_5.bin, id 1Ut5yJ3emg_DEjR2q21Gzat0d1VC2-YT_, 180720 bytes,
  SHA-256 7d1f1009a7609ae1b59b3e0131d63c9b8660aa0fac1aea01ebd7caaa2e6ddab5
BirchTree_Bark.jpg, id 1puC8NuyemENIPB40TOsKdqzp0EmUJe1g, 1015231 bytes,
  SHA-256 f796f02e47bc5afddd17dc2385bbef53a352628ceb348deb1188ef04fe5deff9
BirchTree_Leaves.png, id 1RPfkjEuuEwFno9gh3U0zQndzcB8DOr_S, 77836 bytes,
  SHA-256 8b674a02017d987f8ec0448bd2a52ad788d1235f91b7f00499b4ca071f8e69fe

Deterministic VibeLearn packaging embeds those four original files in one GLB,
retains the BirchTree_Bark and double-sided alpha-blended BirchTree_Leaves
materials, and removes only the optional bark normal-map reference. The original
normal PNG is 22721595 bytes (SHA-256
e30ee9c7561742523340d5657056f8392bc0f944da5145f0af7690cd1d2e6a11).
Output: quaternius-birch-tree-5.glb, 1276252 bytes,
  SHA-256 5e7b57f866ccb1e86bdf2611ac7286939aa29e663bad0b335b0c0d4b1cf826bd

This is a candidate for visual comparison, not art-direction acceptance.
"""

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


def _kenney_tree_assets() -> list[tuple[str, str, bytes, str]]:
    archive = _read_url(KENNEY_PACK_URL, KENNEY_PACK_BYTES)
    if len(archive) != KENNEY_PACK_BYTES or hashlib.sha256(archive).hexdigest() != KENNEY_PACK_SHA256:
        raise RuntimeError("Kenney Nature Kit archive size or SHA-256 verification failed")
    selected = []
    with zipfile.ZipFile(io.BytesIO(archive)) as pack:
        for source_name, target_name, expected_bytes, expected_sha in KENNEY_TREES:
            member = f"Models/GLTF format/{source_name}.glb"
            if pack.getinfo(member).file_size != expected_bytes:
                raise RuntimeError(f"Kenney {source_name} size verification failed")
            data = pack.read(member)
            digest = hashlib.sha256(data).hexdigest()
            if len(data) != expected_bytes or digest != expected_sha or data[:4] != b"glTF":
                raise RuntimeError(f"Kenney {source_name} GLB verification failed")
            selected.append((source_name, target_name, data, digest))
    return selected


def _pack_birch_glb(sources: dict[str, bytes]) -> bytes:
    """Embed the original bark/leaf maps; omit only the bulky bark normal map."""
    gltf = json.loads(sources["BirchTree_5.gltf"])
    if ([image.get("uri") for image in gltf["images"]] != [
        "BirchTree_Bark_Normal.png", "BirchTree_Bark.jpg", "BirchTree_Leaves.png"
    ] or [material.get("name") for material in gltf["materials"]] != [
        "BirchTree_Bark", "BirchTree_Leaves"
    ] or gltf["buffers"][0].get("uri") != "BirchTree_5.bin"):
        raise RuntimeError("Unexpected Quaternius BirchTree_5 glTF structure")
    binary = bytearray(sources["BirchTree_5.bin"])
    if len(binary) != gltf["buffers"][0]["byteLength"]:
        raise RuntimeError("Quaternius BirchTree_5 geometry buffer length changed")
    gltf["materials"][0].pop("normalTexture", None)
    gltf["images"] = gltf["images"][1:]
    gltf["textures"] = gltf["textures"][1:]
    for texture in gltf["textures"]:
        texture["source"] -= 1
    for material in gltf["materials"]:
        material["pbrMetallicRoughness"]["baseColorTexture"]["index"] -= 1
    for image in gltf["images"]:
        data = sources[image.pop("uri")]
        binary.extend(b"\0" * (-len(binary) % 4))
        image["bufferView"] = len(gltf["bufferViews"])
        gltf["bufferViews"].append({
            "buffer": 0, "byteOffset": len(binary), "byteLength": len(data)
        })
        binary.extend(data)
    binary.extend(b"\0" * (-len(binary) % 4))
    gltf["buffers"][0].pop("uri")
    gltf["buffers"][0]["byteLength"] = len(binary)
    body = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    body += b" " * (-len(body) % 4)
    length = 12 + 8 + len(body) + 8 + len(binary)
    return (b"glTF" + struct.pack("<II", 2, length)
            + struct.pack("<I4s", len(body), b"JSON") + body
            + struct.pack("<I4s", len(binary), b"BIN\0") + binary)


def _birch_asset() -> tuple[bytes, list[dict[str, str | int]]]:
    sources = {}
    provenance = []
    for name, file_id, expected_bytes, expected_sha in BIRCH_SOURCE_FILES:
        url = f"https://drive.google.com/uc?export=download&id={file_id}"
        data = _read_url(url, expected_bytes)
        digest = hashlib.sha256(data).hexdigest()
        if len(data) != expected_bytes or digest != expected_sha:
            raise RuntimeError(f"Quaternius {name} size or SHA-256 verification failed")
        sources[name] = data
        provenance.append({"name": name, "source_url": url, "bytes": len(data), "sha256": digest})
    glb = _pack_birch_glb(sources)
    if len(glb) != BIRCH_EXPECTED_BYTES or hashlib.sha256(glb).hexdigest() != BIRCH_EXPECTED_SHA256:
        raise RuntimeError("Packaged Quaternius BirchTree_5 GLB verification failed")
    return glb, provenance


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

    kenney_trees = _kenney_tree_assets()
    birch, birch_sources = _birch_asset()

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
    for _, target_name, data, _ in kenney_trees:
        (target / target_name).write_bytes(data)
    (target / KENNEY_LICENSE_TARGET).write_text(KENNEY_PROVENANCE, encoding="utf-8")
    (target / BIRCH_TARGET).write_bytes(birch)
    (target / BIRCH_LICENSE_TARGET).write_text(BIRCH_PROVENANCE, encoding="utf-8")

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
    report["assets"].extend(
        {
            "id": f"kenney.{source_name.replace('_', '-')}",
            "source_url": KENNEY_PACK_URL,
            "source_archive_sha256": KENNEY_PACK_SHA256,
            "source_member": f"Models/GLTF format/{source_name}.glb",
            "license": "CC0-1.0",
            "bytes": len(data),
            "sha256": digest,
            "target": f"web/assets/{target_name}",
        }
        for source_name, target_name, data, digest in kenney_trees
    )
    report["assets"].append({
        "id": "quaternius.stylized-nature.birch-tree-5",
        "pack_page": BIRCH_PACK_PAGE,
        "source_folder": BIRCH_SOURCE_FOLDER,
        "pack_page_license": "CC0-1.0",
        "current_global_license_page": "https://quaternius.com/license.html",
        "transformation": "embed original geometry/bark/leaves; omit bark normal map",
        "sources": birch_sources,
        "bytes": len(birch),
        "sha256": hashlib.sha256(birch).hexdigest(),
        "target": f"web/assets/{BIRCH_TARGET}",
    })
    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "game-assets-vendor.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )
    print("Pinned Robot, Blacksmith, three Kenney trees, and one Quaternius birch verified and self-hosted.")


if __name__ == "__main__":
    main()
