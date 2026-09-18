import tempfile
import unittest
from pathlib import Path

from tools.build_evidence_receipt import build_receipt, modality_for


class EvidenceReceiptTests(unittest.TestCase):
    def test_modalities_are_inferred_from_review_artifacts(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            for name in (
                "cold-observer-opening-packet.json",
                "cold-observer-opening-report.json",
                "prologue-motion-390.webm",
                "prologue-home-390.png",
                "first-words-opening-report.json",
                "opening-trace.zip",
                "controls-interaction-trace.json",
                "learning-replay.json",
                "opening-audio.wav",
                "ignore.bin",
            ):
                (root/name).write_bytes(b"x")
            sha="a"*40
            receipt=build_receipt(root,sha,"first-words-opening")
            by_name={item["ref"]:item["modality"] for item in receipt["evidence"]}
            self.assertEqual(by_name["cold-observer-opening-packet.json"],"review_assignment")
            self.assertEqual(by_name["cold-observer-opening-report.json"],"cold_observer_report")
            self.assertEqual(by_name["prologue-motion-390.webm"],"motion_video")
            self.assertEqual(by_name["prologue-home-390.png"],"screenshot")
            self.assertEqual(by_name["first-words-opening-report.json"],"runtime_trace")
            self.assertEqual(by_name["opening-trace.zip"],"interactive_trace")
            self.assertEqual(by_name["controls-interaction-trace.json"],"interactive_trace")
            self.assertEqual(by_name["learning-replay.json"],"authoritative_replay")
            self.assertEqual(by_name["opening-audio.wav"],"audio_capture")
            self.assertNotIn("ignore.bin",by_name)
            self.assertEqual(receipt["candidate_sha"],sha)
            self.assertEqual(receipt["suite"],"first-words-opening")

    def test_invalid_candidate_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(ValueError,"40-character"):
                build_receipt(Path(temp),"abc","foundation")

    def test_modality_for_unknown_file_is_none(self):
        self.assertIsNone(modality_for(Path("notes.csv")))


if __name__=="__main__":
    unittest.main()
