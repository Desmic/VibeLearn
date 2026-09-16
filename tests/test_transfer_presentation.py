import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class TransferPresentationTests(unittest.TestCase):
    def test_sealed_transfer_stays_world_first_and_context_correct(self):
        source = (ROOT / "web" / "play-canvas-migrate.js").read_text(encoding="utf-8")
        self.assertIn("blockHelp.hidden=true", source)
        self.assertIn("note.hidden=true", source)
        self.assertIn("Help used?", source)
        self.assertIn("Worker → export service", source)
        self.assertIn("Export recovery: resumed worker to external export service", source)
        self.assertIn("✓ INCIDENT STABLE", source)
        self.assertIn("Export recovery holds.", source)
        self.assertIn("durable job intent", source)
        self.assertIn("Incident tests found a counterexample.", source)
        self.assertIn("play-canvas-transfer-run", source)


if __name__ == "__main__":
    unittest.main()
