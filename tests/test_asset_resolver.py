"""Offline corpus selection; no asset service, browser or game-runtime changes."""
import copy
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from tools.asset_resolver import AssetResolutionError, CATALOG, ROOT, resolve


ROBOT = {"role": "character.robot", "importance": "hero",
         "max_bytes": 500_000, "max_triangles": 4_000, "allow_candidate": True}


class AssetResolverTests(unittest.TestCase):
    def altered_catalog(self, change):
        data = copy.deepcopy(json.loads(CATALOG.read_text(encoding="utf-8")))
        change(data)
        temporary = tempfile.TemporaryDirectory()
        path = Path(temporary.name) / "catalog.json"
        path.write_text(json.dumps(data), encoding="utf-8")
        self.addCleanup(temporary.cleanup)
        return path

    def staged_package(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        root = Path(temporary.name)
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        paths = set()
        for asset in data["assets"]:
            paths.update([asset["path"], asset["provenance"]])
            if asset.get("license_record"):
                paths.add(asset["license_record"])
            paths.update(item["path"] for item in asset.get("dependencies", []))
        for name in paths:
            destination = root / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ROOT / name, destination)
        catalog_path = root / "catalog.json"
        catalog_path.write_text(json.dumps(data), encoding="utf-8")
        return root, catalog_path

    def test_same_semantic_request_on_distinct_world_profiles(self):
        # Style compatibility is a candidate tag, never an art-direction pass.
        bellweather = resolve({**ROBOT, "style_family": "graphic-techno-fantasy"})
        harbor = resolve({**ROBOT, "style_family": "harbor-industrial"})
        self.assertEqual(bellweather["id"], "quaternius.animated-robot")
        self.assertEqual(harbor["id"], bellweather["id"])
        self.assertEqual(bellweather["status"], "candidate")
        # Another actual corpus member can fill a different role under the
        # same request boundary without tying the resolver to Bellweather IDs.
        tree = resolve({"role": "foliage.tree", "style_family": "harbor-industrial",
                        "importance": "supporting", "max_bytes": 50_000,
                        "max_triangles": 500, "allow_candidate": True})
        self.assertEqual(tree["id"], "kenney.tree-oak")

    def test_candidate_requires_explicit_opt_in(self):
        with self.assertRaisesRegex(AssetResolutionError, "no eligible"):
            resolve({**ROBOT, "style_family": "graphic-techno-fantasy",
                     "allow_candidate": False})

    def test_no_eligible_asset_or_style_match_is_failure(self):
        for request in [
            {**ROBOT, "role": "foliage.moonflower", "style_family": "graphic-techno-fantasy"},
            {**ROBOT, "style_family": "medieval-village"},
            {**ROBOT, "style_family": "graphic-techno-fantasy", "max_bytes": 100_000},
            {**ROBOT, "style_family": "graphic-techno-fantasy", "max_triangles": 2_000},
        ]:
            with self.subTest(request=request), self.assertRaisesRegex(AssetResolutionError, "no eligible"):
                resolve(request)

    def test_bad_hash_is_hard_failure_not_implicit_fallback(self):
        def tamper(data):
            data["assets"][0]["sha256"] = "0" * 64
        path = self.altered_catalog(tamper)
        with self.assertRaisesRegex(AssetResolutionError, "SHA256 mismatch"):
            resolve({**ROBOT, "style_family": "graphic-techno-fantasy"}, catalog_path=path)

    def test_changed_license_record_or_source_pin_is_rejected(self):
        for mutation, message in [
            (lambda d: d["assets"][0].update(provenance_sha256="0" * 64), "provenance/license SHA256 mismatch"),
            (lambda d: d["assets"][0]["source_pin"].update(value="0" * 40), "source Git blob mismatch"),
        ]:
            with self.subTest(message=message):
                path = self.altered_catalog(mutation)
                with self.assertRaisesRegex(AssetResolutionError, message):
                    resolve({**ROBOT, "style_family": "graphic-techno-fantasy"}, catalog_path=path)

    def test_absent_or_uncleared_source_is_rejected(self):
        for mutation, message in [
            (lambda d: d["assets"][0].update(path="web/assets/absent.glb"), "absent"),
            (lambda d: d["assets"][0].update(license_clearance="unknown"), "not cleared"),
            (lambda d: d["assets"][0].update(path="../outside.glb"), "escapes repository"),
        ]:
            with self.subTest(message=message):
                path = self.altered_catalog(mutation)
                with self.assertRaisesRegex(AssetResolutionError, message):
                    resolve({**ROBOT, "style_family": "graphic-techno-fantasy"}, catalog_path=path)

    def test_runtime_budget_for_existing_landmark_and_sky(self):
        landmark = resolve({"role": "foliage.tree", "style_family": "graphic-techno-fantasy",
                            "importance": "landmark", "max_bytes": 1_300_000,
                            "max_triangles": 5_000, "allow_candidate": True})
        sky = resolve({"role": "environment.sky", "style_family": "graphic-techno-fantasy",
                       "importance": "background", "max_bytes": 1_100_000,
                       "max_triangles": 0, "allow_candidate": True})
        self.assertEqual(landmark["runtime"]["triangle_count"], 4520)
        self.assertEqual(sky["path"], "web/lab/assets/syferfontein_0d_clear_puresky_1k.hdr")

    def test_six_real_kaykit_candidates_count_full_packages(self):
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        kaykit = [asset for asset in data["assets"] if asset["id"].startswith("kaykit.")]
        self.assertEqual(len(kaykit), 6)
        self.assertTrue(all(asset["status"] == "candidate" for asset in kaykit))
        for asset in kaykit:
            with self.subTest(asset=asset["id"]):
                self.assertEqual(asset["bytes"], asset["main_bytes"] + sum(d["bytes"] for d in asset["dependencies"]))
                self.assertEqual({Path(d["path"]).name for d in asset["dependencies"]},
                                 {Path(asset["path"]).stem + ".bin", "forest_texture.png"})
        request = {"role": "foliage.tree", "style_family": "low-poly-toy",
                   "importance": "supporting", "max_bytes": 59_928,
                   "max_triangles": 400, "allow_candidate": True}
        chosen = resolve(request)
        self.assertEqual(chosen["id"], "kaykit.forest.tree-2-a-color1")
        self.assertEqual(chosen["bytes"], 59_928)
        with self.assertRaisesRegex(AssetResolutionError, "no eligible"):
            resolve({**request, "max_bytes": 59_927})
        with self.assertRaisesRegex(AssetResolutionError, "no eligible"):
            resolve({**request, "style_family": "graphic-techno-fantasy", "importance": "hero",
                     "max_bytes": 2_000_000, "max_triangles": 10_000})
        for role in ("foliage.shrub", "foliage.grass", "terrain.rock"):
            with self.subTest(role=role):
                item = resolve({**request, "role": role, "importance": "background",
                                "max_bytes": 100_000, "max_triangles": 1_000})
                self.assertTrue(item["id"].startswith("kaykit.forest."))

    def test_gltf_rejects_undeclared_remote_or_escaping_references(self):
        for uri, message in [
            ("other.bin", "undeclared or extra"),
            ("https://example.com/other.bin", "remote or escaping"),
            ("../other.bin", "remote or escaping"),
            ("%2e%2e%2fother.bin", "remote or escaping"),
        ]:
            with self.subTest(uri=uri):
                root, catalog_path = self.staged_package()
                model = root / "web/lab/asset-kit-assets/Tree_2_A_Color1.gltf"
                document = json.loads(model.read_text(encoding="utf-8"))
                document["buffers"][0]["uri"] = uri
                model.write_text(json.dumps(document), encoding="utf-8")
                with self.assertRaisesRegex(AssetResolutionError, message):
                    resolve({**ROBOT, "style_family": "graphic-techno-fantasy"},
                            catalog_path=catalog_path, root=root)

    def test_gltf_rejects_missing_or_changed_dependencies(self):
        for mutation, message in [
            (lambda p: p.unlink(), "dependency absent"),
            (lambda p: p.write_bytes(b"tampered"), "source manifest dependency mismatch"),
        ]:
            with self.subTest(message=message):
                root, catalog_path = self.staged_package()
                mutation(root / "web/lab/asset-kit-assets/forest_texture.png")
                with self.assertRaisesRegex(AssetResolutionError, message):
                    resolve({**ROBOT, "style_family": "graphic-techno-fantasy"},
                            catalog_path=catalog_path, root=root)

    def test_gltf_rejects_changed_license(self):
        root, catalog_path = self.staged_package()
        (root / "web/lab/asset-kit-assets/License.txt").write_text("changed", encoding="utf-8")
        with self.assertRaisesRegex(AssetResolutionError, "license record absent or changed"):
            resolve({**ROBOT, "style_family": "graphic-techno-fantasy"},
                    catalog_path=catalog_path, root=root)


if __name__ == "__main__":
    unittest.main()
