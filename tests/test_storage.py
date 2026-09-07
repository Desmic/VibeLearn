import tempfile
import unittest
from pathlib import Path
from app.storage import migrate, transaction


class StorageTests(unittest.TestCase):
    def test_committed_write_survives_new_connection_and_migration(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "test.sqlite3"
            migrate(path)
            with transaction(path) as db:
                db.execute("INSERT INTO baseline_probe VALUES (?, ?)", ("probe", "retained"))
            migrate(path)
            with transaction(path) as db:
                self.assertEqual(db.execute("SELECT value FROM baseline_probe WHERE id='probe'").fetchone()[0], "retained")

    def test_failed_transaction_is_rolled_back(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "test.sqlite3"
            migrate(path)
            with self.assertRaises(RuntimeError):
                with transaction(path) as db:
                    db.execute("INSERT INTO baseline_probe VALUES ('rollback', 'no')")
                    raise RuntimeError("interrupted")
            with transaction(path) as db:
                self.assertEqual(db.execute("SELECT COUNT(*) FROM baseline_probe").fetchone()[0], 0)

    def test_schema_one_fixture_migrates_without_losing_prior_data(self):
        from app.storage import MIGRATIONS
        import sqlite3
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "old.sqlite3"
            db = sqlite3.connect(path)
            db.executescript(MIGRATIONS[0])
            db.execute("PRAGMA user_version=1")
            db.execute("INSERT INTO baseline_probe VALUES ('old', 'preserve me')")
            db.commit()
            db.close()
            migrate(path)
            with transaction(path) as db:
                self.assertEqual(db.execute("PRAGMA user_version").fetchone()[0], len(MIGRATIONS))
                self.assertEqual(db.execute("SELECT value FROM baseline_probe").fetchone()[0], "preserve me")
                self.assertEqual(db.execute("PRAGMA foreign_key_check").fetchall(), [])
