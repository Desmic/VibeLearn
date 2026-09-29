"""The one reviewed birch model packages only its pinned geometry and color maps."""
import json
from pathlib import Path
import struct
import unittest

from tools import vendor_game_assets as vendor


ROOT = Path(__file__).resolve().parents[1]


class BirchAssetTests(unittest.TestCase):
    def test_glb_keeps_original_leaf_alpha_and_omits_bulky_normal_map(self):
        source = {
            "buffers": [{"uri": "BirchTree_5.bin", "byteLength": 4}],
            "bufferViews": [{"buffer": 0, "byteOffset": 0, "byteLength": 4}],
            "images": [
                {"uri": "BirchTree_Bark_Normal.png", "mimeType": "image/png"},
                {"uri": "BirchTree_Bark.jpg", "mimeType": "image/jpeg"},
                {"uri": "BirchTree_Leaves.png", "mimeType": "image/png"},
            ],
            "textures": [{"source": 0}, {"source": 1}, {"source": 2}],
            "materials": [
                {"name": "BirchTree_Bark", "normalTexture": {"index": 0},
                 "pbrMetallicRoughness": {"baseColorTexture": {"index": 1}}},
                {"name": "BirchTree_Leaves", "alphaMode": "BLEND", "doubleSided": True,
                 "pbrMetallicRoughness": {"baseColorTexture": {"index": 2}}},
            ],
        }
        payload = vendor._pack_birch_glb({
            "BirchTree_5.gltf": json.dumps(source).encode(),
            "BirchTree_5.bin": b"geom",
            "BirchTree_Bark.jpg": b"bark-jpg",
            "BirchTree_Leaves.png": b"leaf-png",
        })
        self.assertEqual(payload[:4], b"glTF")
        self.assertEqual(struct.unpack_from("<I", payload, 8)[0], len(payload))
        json_length = struct.unpack_from("<I", payload, 12)[0]
        packaged = json.loads(payload[20:20 + json_length])
        binary = payload[28 + json_length:]
        self.assertEqual([image.get("uri") for image in packaged["images"]], [None, None])
        self.assertEqual([image["bufferView"] for image in packaged["images"]], [1, 2])
        self.assertEqual([texture["source"] for texture in packaged["textures"]], [0, 1])
        self.assertNotIn("normalTexture", packaged["materials"][0])
        self.assertEqual(packaged["materials"][1]["alphaMode"], "BLEND")
        self.assertTrue(packaged["materials"][1]["doubleSided"])
        for index, original in ((1, b"bark-jpg"), (2, b"leaf-png")):
            view = packaged["bufferViews"][index]
            self.assertEqual(binary[view["byteOffset"]:view["byteOffset"] + view["byteLength"]], original)

    def test_single_candidate_routes_and_provenance_are_explicit(self):
        local = (ROOT / "app" / "server.py").read_text(encoding="utf-8")
        hosted = (ROOT / "app" / "hosted.py").read_text(encoding="utf-8")
        self.assertIn(f"/assets/{vendor.BIRCH_TARGET}", local)
        self.assertIn(f'"{vendor.BIRCH_TARGET}"', hosted)
        self.assertIn(vendor.BIRCH_LICENSE_TARGET, local)
        self.assertIn(vendor.BIRCH_LICENSE_TARGET, hosted)
        self.assertIn("CC0", vendor.BIRCH_PROVENANCE)
        self.assertIn("QAL", vendor.BIRCH_PROVENANCE)
        self.assertIn("5e7b57f866ccb1e86bdf2611ac7286939aa29e663bad0b335b0c0d4b1cf826bd",
                      vendor.BIRCH_PROVENANCE)
        self.assertEqual(len(vendor.BIRCH_SOURCE_FILES), 4)


if __name__ == "__main__":
    unittest.main()
