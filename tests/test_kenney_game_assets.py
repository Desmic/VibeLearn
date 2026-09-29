"""The selected Kenney models stay pinned and reachable on both transports."""
import hashlib
import io
from pathlib import Path
import unittest
from unittest.mock import patch
import zipfile

from tools import vendor_game_assets as vendor


ROOT = Path(__file__).resolve().parents[1]


class KenneyGameAssetTests(unittest.TestCase):
    def test_selected_pack_members_verify_without_extracting_the_whole_pack(self):
        members = {
            "tree_detailed": b"glTF-detailed",
            "tree_oak": b"glTF-oak",
            "tree_thin": b"glTF-thin",
        }
        stream = io.BytesIO()
        with zipfile.ZipFile(stream, "w") as archive:
            for name, data in members.items():
                archive.writestr(f"Models/GLTF format/{name}.glb", data)
            archive.writestr("Models/GLTF format/unselected.glb", b"glTF-unselected")
        payload = stream.getvalue()
        selected = tuple(
            (name, f"kenney-{name.replace('_', '-')}.glb", len(data), hashlib.sha256(data).hexdigest())
            for name, data in members.items()
        )
        with (patch.object(vendor, "_read_url", return_value=payload),
              patch.object(vendor, "KENNEY_PACK_BYTES", len(payload)),
              patch.object(vendor, "KENNEY_PACK_SHA256", hashlib.sha256(payload).hexdigest()),
              patch.object(vendor, "KENNEY_TREES", selected)):
            extracted = vendor._kenney_tree_assets()
            self.assertEqual([name for _, name, _, _ in extracted],
                             [item[1] for item in selected])
            self.assertEqual([data for _, _, data, _ in extracted], list(members.values()))
            with patch.object(vendor, "KENNEY_PACK_SHA256", "0" * 64):
                with self.assertRaisesRegex(RuntimeError, "archive size or SHA-256"):
                    vendor._kenney_tree_assets()
            with patch.object(vendor, "KENNEY_TREES", selected[:-1] +
                              (("tree_thin", selected[-1][1], len(members["tree_thin"]), "0" * 64),)):
                with self.assertRaisesRegex(RuntimeError, "GLB verification"):
                    vendor._kenney_tree_assets()

    def test_three_selected_models_are_allowlisted_on_local_and_hosted_routes(self):
        local = (ROOT / "app" / "server.py").read_text(encoding="utf-8")
        hosted = (ROOT / "app" / "hosted.py").read_text(encoding="utf-8")
        for _, name, _, _ in vendor.KENNEY_TREES:
            self.assertIn(f"/assets/{name}", local)
            self.assertIn(f'"{name}"', hosted)
        self.assertIn(vendor.KENNEY_LICENSE_TARGET, local)
        self.assertIn(vendor.KENNEY_LICENSE_TARGET, hosted)


if __name__ == "__main__":
    unittest.main()
