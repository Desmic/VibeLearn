"""Offline, fail-closed selection of already-pinned asset candidates.

This does not fetch, generate, approve art, or bind a mesh to a game entity.
The caller owns semantic IDs and must explicitly opt into candidate assets.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
CATALOG = Path(__file__).with_name("asset_catalog.json")
STATUSES = {"candidate", "approved"}
IMPORTANCE = {"background", "supporting", "landmark", "hero"}


class AssetResolutionError(ValueError):
    pass


def _local_file(root: Path, value: str) -> Path:
    if not isinstance(value, str) or not value or "\\" in value:
        raise AssetResolutionError("asset path must be a nonempty repo-relative POSIX path")
    relative = Path(value)
    if relative.is_absolute() or ".." in relative.parts:
        raise AssetResolutionError(f"asset path escapes repository: {value}")
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise AssetResolutionError(f"asset path escapes repository: {value}")
    return path


def _gltf_dependency_paths(asset: dict, root: Path, main: Path) -> set[str]:
    try:
        document = json.loads(main.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise AssetResolutionError(f"{asset['id']}: glTF JSON invalid") from error
    if not isinstance(document, dict):
        raise AssetResolutionError(f"{asset['id']}: glTF document invalid")
    dependencies: set[str] = set()
    buffers, images = document.get("buffers", []), document.get("images", [])
    if not isinstance(buffers, list) or not isinstance(images, list):
        raise AssetResolutionError(f"{asset['id']}: glTF references invalid")
    for item in [*buffers, *images]:
        if not isinstance(item, dict) or "uri" not in item:
            # Embedded image bufferViews are covered by the pinned .bin.
            continue
        uri = item["uri"]
        if not isinstance(uri, str) or not uri or "\\" in uri:
            raise AssetResolutionError(f"{asset['id']}: invalid glTF dependency URI")
        parsed = urlsplit(uri)
        decoded = unquote(uri)
        if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment or decoded.startswith("/") or "/" in decoded or decoded in {".", ".."}:
            raise AssetResolutionError(f"{asset['id']}: remote or escaping glTF dependency: {uri}")
        dependency = (main.parent / decoded).resolve()
        if not dependency.is_relative_to(root.resolve()) or dependency.parent != main.parent:
            raise AssetResolutionError(f"{asset['id']}: glTF dependency escapes package: {uri}")
        dependencies.add(dependency.relative_to(root.resolve()).as_posix())
    return dependencies


def _validate_catalog(catalog: dict, root: Path) -> list[dict]:
    if not isinstance(catalog, dict) or catalog.get("version") != 1 or not isinstance(catalog.get("assets"), list):
        raise AssetResolutionError("unsupported asset catalog")
    seen: set[str] = set()
    for asset in catalog["assets"]:
        if not isinstance(asset, dict):
            raise AssetResolutionError("invalid asset entry")
        ident = asset.get("id")
        if not isinstance(ident, str) or not ident or ident in seen:
            raise AssetResolutionError(f"missing or duplicate asset id: {ident}")
        seen.add(ident)
        if asset.get("status") not in STATUSES:
            raise AssetResolutionError(f"{ident}: unsupported approval status")
        if asset.get("license_clearance") != "cleared" or not all(
            isinstance(asset.get(key), str) and asset[key]
            for key in ("license", "license_url", "source_url", "provenance")
        ):
            raise AssetResolutionError(f"{ident}: source/license not cleared")
        if not isinstance(asset.get("role"), str) or not asset["role"]:
            raise AssetResolutionError(f"{ident}: missing role")
        styles = asset.get("style_families")
        levels = asset.get("importance")
        if not isinstance(styles, list) or not styles or any(not isinstance(s, str) or not s for s in styles):
            raise AssetResolutionError(f"{ident}: missing style family")
        if not isinstance(levels, list) or not levels or not set(levels) <= IMPORTANCE:
            raise AssetResolutionError(f"{ident}: invalid importance")
        if type(asset.get("bytes")) is not int or asset["bytes"] <= 0:
            raise AssetResolutionError(f"{ident}: invalid byte budget metadata")
        runtime = asset.get("runtime")
        if not isinstance(runtime, dict) or any(type(runtime.get(k)) is not int or runtime[k] < 0
                                                for k in ("triangle_count", "embedded_texture_count")):
            raise AssetResolutionError(f"{ident}: missing runtime budget metadata")
        path = _local_file(root, asset.get("path"))
        provenance = _local_file(root, asset["provenance"])
        if not provenance.is_file() or not path.is_file():
            raise AssetResolutionError(f"{ident}: source/provenance file absent")
        proof = asset.get("provenance_sha256")
        if not isinstance(proof, str) or len(proof) != 64 or hashlib.sha256(provenance.read_bytes()).hexdigest() != proof.lower():
            raise AssetResolutionError(f"{ident}: provenance/license SHA256 mismatch")
        pin = asset.get("source_pin")
        pin_lengths = {"git-blob-sha1": 40, "archive-sha256": 64,
                       "packaged-output-sha256": 64, "source-md5": 32}
        if not isinstance(pin, dict) or pin.get("kind") not in pin_lengths or not isinstance(pin.get("value"), str) or len(pin["value"]) != pin_lengths[pin["kind"]]:
            raise AssetResolutionError(f"{ident}: source pin missing or invalid")
        components = asset.get("dependencies", [])
        if not isinstance(components, list):
            raise AssetResolutionError(f"{ident}: dependencies must be a list")
        if path.suffix.lower() == ".gltf":
            if any(not isinstance(item, dict) or not isinstance(item.get("path"), str) for item in components):
                raise AssetResolutionError(f"{ident}: invalid dependency record")
            declared = {item["path"] for item in components}
            if len(declared) != len(components) or declared != _gltf_dependency_paths(asset, root, path):
                raise AssetResolutionError(f"{ident}: undeclared or extra glTF dependency")
            if type(asset.get("main_bytes")) is not int or path.stat().st_size != asset["main_bytes"]:
                raise AssetResolutionError(f"{ident}: glTF byte count mismatch")
            license_path = _local_file(root, asset.get("license_record"))
            if not license_path.is_file() or hashlib.sha256(license_path.read_bytes()).hexdigest() != asset.get("license_sha256"):
                raise AssetResolutionError(f"{ident}: license record absent or changed")
            try:
                manifest = json.loads(provenance.read_text(encoding="utf-8"))
                source_files = {item["path"]: item for item in manifest["files"]}
            except (OSError, UnicodeError, json.JSONDecodeError, KeyError, TypeError) as error:
                raise AssetResolutionError(f"{ident}: source manifest invalid") from error
            if pin["kind"] != "archive-sha256" or pin["value"].lower() != manifest.get("archive_sha256"):
                raise AssetResolutionError(f"{ident}: source archive pin mismatch")
            for member in [path, license_path, *(_local_file(root, item["path"]) for item in components)]:
                if not member.is_file():
                    raise AssetResolutionError(f"{ident}: dependency absent")
                record = source_files.get(member.name)
                if not record or record.get("bytes") != member.stat().st_size or record.get("sha256") != hashlib.sha256(member.read_bytes()).hexdigest():
                    raise AssetResolutionError(f"{ident}: source manifest dependency mismatch")
        elif components:
            raise AssetResolutionError(f"{ident}: dependencies only supported for glTF packages")
        total_bytes = path.stat().st_size
        for item in components:
            if not isinstance(item, dict):
                raise AssetResolutionError(f"{ident}: invalid dependency record")
            dependent = _local_file(root, item.get("path"))
            if dependent.parent != path.parent or not dependent.is_file():
                raise AssetResolutionError(f"{ident}: dependency absent or outside package")
            if type(item.get("bytes")) is not int or dependent.stat().st_size != item["bytes"]:
                raise AssetResolutionError(f"{ident}: dependency byte count mismatch")
            expected = item.get("sha256")
            if not isinstance(expected, str) or len(expected) != 64 or hashlib.sha256(dependent.read_bytes()).hexdigest() != expected.lower():
                raise AssetResolutionError(f"{ident}: dependency SHA256 mismatch")
            total_bytes += item["bytes"]
        if total_bytes != asset["bytes"]:
            raise AssetResolutionError(f"{ident}: package byte count mismatch")
        digest = asset.get("sha256")
        if not isinstance(digest, str) or len(digest) != 64:
            raise AssetResolutionError(f"{ident}: missing SHA256")
        if hashlib.sha256(path.read_bytes()).hexdigest() != digest.lower():
            raise AssetResolutionError(f"{ident}: SHA256 mismatch")
        if pin["kind"] == "source-md5" and hashlib.md5(path.read_bytes()).hexdigest() != pin["value"].lower():
            raise AssetResolutionError(f"{ident}: source MD5 mismatch")
        if pin["kind"] == "git-blob-sha1":
            content = path.read_bytes()
            blob = hashlib.sha1(f"blob {len(content)}\0".encode() + content).hexdigest()
            if blob != pin["value"].lower():
                raise AssetResolutionError(f"{ident}: source Git blob mismatch")
        if pin["kind"] == "packaged-output-sha256" and pin["value"].lower() != digest.lower():
            raise AssetResolutionError(f"{ident}: source packaged output mismatch")
    return catalog["assets"]


def resolve(request: dict, *, catalog_path: Path = CATALOG, root: Path = ROOT) -> dict:
    """Return one verified candidate, or raise; no network, downloads or fallback.

    Required request fields: role, style_family, importance, max_bytes,
    max_triangles. Candidate assets require allow_candidate=True. The result
    retains status so downstream code cannot mistake a trial for art approval.
    """
    if not isinstance(request, dict):
        raise AssetResolutionError("request must be an object")
    for key in ("role", "style_family"):
        if not isinstance(request.get(key), str) or not request[key]:
            raise AssetResolutionError(f"request missing {key}")
    if request.get("importance") not in IMPORTANCE:
        raise AssetResolutionError("request importance is invalid")
    for key in ("max_bytes", "max_triangles"):
        if type(request.get(key)) is not int or request[key] < 0:
            raise AssetResolutionError(f"request {key} must be a nonnegative integer")
    if type(request.get("allow_candidate", False)) is not bool:
        raise AssetResolutionError("allow_candidate must be boolean")
    try:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise AssetResolutionError(f"catalog unavailable: {error}") from error
    assets = _validate_catalog(catalog, root)
    eligible = [a for a in assets if a["role"] == request["role"]
                and request["style_family"] in a["style_families"]
                and request["importance"] in a["importance"]
                and (a["status"] == "approved" or request.get("allow_candidate", False))
                and a["bytes"] <= request["max_bytes"]
                and a["runtime"]["triangle_count"] <= request["max_triangles"]]
    if not eligible:
        raise AssetResolutionError("no eligible verified asset for requested role/style/importance/status/budget")
    # Approved assets are preferred; then choose the smallest eligible payload.
    return dict(min(eligible, key=lambda a: (a["status"] != "approved", a["bytes"], a["id"])))


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Resolve one offline pinned asset")
    parser.add_argument("role")
    parser.add_argument("style_family")
    parser.add_argument("importance", choices=sorted(IMPORTANCE))
    parser.add_argument("--max-bytes", type=int, required=True)
    parser.add_argument("--max-triangles", type=int, required=True)
    parser.add_argument("--allow-candidate", action="store_true")
    args = parser.parse_args()
    found = resolve({"role": args.role, "style_family": args.style_family,
                     "importance": args.importance, "max_bytes": args.max_bytes,
                     "max_triangles": args.max_triangles, "allow_candidate": args.allow_candidate})
    print(json.dumps(found, indent=2))
