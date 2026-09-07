"""A populated prior-increment database, not just an empty schema upgrade."""
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from app import service
from app.assessment import evaluate, review_need
from app.content import freeze, digest
from app.storage import MIGRATIONS, migrate


class MigrationTests(unittest.TestCase):
    def test_phase1b_history_survives_phase1c_upgrade(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "phase1b.sqlite3"
            db = sqlite3.connect(path)
            for script in MIGRATIONS[:3]:
                db.executescript(script)
            db.execute("PRAGMA user_version=3")
            stamp = "2026-09-06T00:00:00+00:00"
            response = {"prediction": "2,1,2", "diagnosis": "Historical repair", "aid_declaration": "none"}
            snapshot = freeze("BUILD")
            result = evaluate(snapshot, response, ["BUILD mode"])
            capsule = {"snapshot": snapshot, "snapshot_digest": digest(snapshot), "response": response, "assistance": ["BUILD mode"], "mode_at_submission": "BUILD"}
            db.execute("INSERT INTO learners VALUES ('learner', '{}', ?)", (stamp,))
            db.execute("INSERT INTO attempts VALUES ('attempt', 'learner', 2, 'submitted', 'BUILD', ?, ?, ?, ?, ?)", (json.dumps(response), json.dumps(snapshot), digest(snapshot), stamp, stamp))
            db.execute("INSERT INTO checkpoints VALUES ('checkpoint', 'learner', 'attempt', 'submission', ?, 'BUILD', ?, ?, ?)", (json.dumps(response), json.dumps(["BUILD mode"]), digest(snapshot), stamp))
            db.execute("INSERT INTO evidence VALUES ('evidence', 'learner', 'attempt', 'checkpoint', ?, 1, ?, ?, ?)", (snapshot["frame"]["id"], json.dumps(capsule), json.dumps(result), stamp))
            intent = review_need(snapshot, result, stamp)
            db.execute("INSERT INTO reviews VALUES ('learner', ?, 1, 'evidence', ?)", (snapshot["frame"]["id"], json.dumps(intent)))
            db.commit()
            db.close()
            migrate(path)
            restored = service.state(path, "learner")["attempt"]
            self.assertEqual(restored["response"], response)
            self.assertEqual(restored["evidence"]["capsule"], capsule)
            self.assertEqual(restored["assessment"], result)
            self.assertEqual(restored["review"], intent)
            self.assertEqual(restored["checkpoints"][0]["assessment"]["independence"], "assisted")
            self.assertEqual(restored["reward"], 0)  # Migration must not invent rewards.
