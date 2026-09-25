"""Evidence-pack rules of the shared critic harness (docs/ASTRA-REVIEW-WORKFLOW.md)."""
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from tools import play_session


class FakePage:
    def screenshot(self, path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Path(path).write_bytes(b"png")

    def wait_for_timeout(self, milliseconds):
        pass


class ShotPathTests(unittest.TestCase):
    """A review's screenshots must be inside the pack its trace names."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.root = self.tmp / "session"
        self.root.mkdir()
        self.previous = os.getcwd()
        os.chdir(self.tmp)
        self.addCleanup(os.chdir, self.previous)
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        self.page = FakePage()

    def shoot(self, path):
        result = play_session.run_step(self.page, {"action": "shot", "path": path}, self.root)
        return Path(result["shot"])

    def test_bare_name_lands_in_the_session_root(self):
        self.assertEqual(self.shoot("beat.png"), self.root / "beat.png")
        self.assertTrue((self.root / "beat.png").exists())
        self.assertFalse((self.tmp / "beat.png").exists())

    def test_nested_name_stays_under_the_session_root(self):
        self.assertEqual(self.shoot("shots/beat.png"), self.root / "shots" / "beat.png")
        self.assertTrue((self.root / "shots" / "beat.png").exists())

    def test_path_already_written_to_the_root_is_not_prefixed_twice(self):
        self.assertEqual(Path(self.shoot("session/beat.png")).resolve(),
                         (self.tmp / "session" / "beat.png").resolve())
        self.assertFalse((self.root / "session").exists())

    def test_absolute_path_is_left_alone(self):
        elsewhere = self.tmp / "elsewhere" / "beat.png"
        self.assertEqual(self.shoot(str(elsewhere)), elsewhere)
        self.assertTrue(elsewhere.exists())


class ClaimDiscoveryTests(unittest.TestCase):
    """A browser a dead driver left behind has to be visible without enumerating processes."""

    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.addCleanup(shutil.rmtree, self.tmp, ignore_errors=True)
        session = self.tmp / "artifacts" / "orphan"
        session.mkdir(parents=True)
        (session / "session.json").write_text(json.dumps(
            {"port": 9342, "pid": 1234, "root": str(session), "server_pid": 5678,
             "url": "http://127.0.0.1:50590/first-words"}), encoding="utf-8")
        self.patch = [
            mock.patch.object(play_session, "ROOT", self.tmp),
            mock.patch.object(play_session, "LEDGER", self.tmp / "owned.jsonl"),
            mock.patch.object(play_session, "_devtools_alive", lambda port: port == 9342),
            mock.patch.object(play_session, "_port_open", lambda port, timeout=0.35: False),
        ]
        for patcher in self.patch:
            patcher.start()
            self.addCleanup(patcher.stop)

    def test_unrecorded_session_counts_as_a_live_claim(self):
        rows = play_session.claims()
        self.assertEqual(len(rows), 1)
        self.assertTrue(rows[0]["live"])
        self.assertEqual(rows[0]["owner"], "unrecorded")

    def test_start_refuses_to_double_book_the_machine_for_it(self):
        args = mock.Mock(reclaim=False)
        with self.assertRaises(SystemExit) as caught:
            play_session.refuse_or_reclaim(args, self.tmp / "artifacts" / "mine")
        self.assertIn("orphan", str(caught.exception))

    def test_reclaiming_clears_the_ownership_token(self):
        entry = play_session.claims()[0]
        with mock.patch.object(play_session, "kill_tree", lambda pid: None):
            play_session.reclaim(entry)
        self.assertFalse((self.tmp / "artifacts" / "orphan" / "session.json").exists())


if __name__ == "__main__":
    unittest.main()
