"""Evidence-pack rules of the shared critic harness (docs/ASTRA-REVIEW-WORKFLOW.md)."""
import json
import os
import shutil
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from tools import play_session


class ViewportPersistenceTests(unittest.TestCase):
    def test_each_step_connection_reapplies_viewport_and_resize_persists(self):
        class Page:
            def __init__(self):
                self.size = [484, 644]  # Chromium's native box after CDP disconnects.

            def set_viewport_size(self, size):
                self.size = [size['width'], size['height']]

            def evaluate(self, expression):
                return self.size

            def wait_for_timeout(self, milliseconds):
                pass

        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'session.json').write_text(json.dumps(
                {'root': str(root), 'port': 9500, 'viewport': [390, 844]}), encoding='utf-8')
            pages = [Page(), Page()]
            browsers = [SimpleNamespace(contexts=[SimpleNamespace(pages=[page])]) for page in pages]
            chromium = SimpleNamespace(connect_over_cdp=mock.Mock(side_effect=browsers))
            manager = mock.MagicMock()
            manager.__enter__.return_value = SimpleNamespace(chromium=chromium)
            with mock.patch('playwright.sync_api.sync_playwright', return_value=manager), \
                 mock.patch('builtins.print'):
                first = SimpleNamespace(root=str(root), file=None,
                                        steps=json.dumps([{'action': 'resize', 'width': 360, 'height': 800}]))
                self.assertEqual(play_session.step(first), 0)
                self.assertEqual(pages[0].size, [360, 800])
                self.assertEqual(json.loads((root / 'session.json').read_text())['viewport'], [360, 800])
                second = SimpleNamespace(root=str(root), file=None,
                                         steps=json.dumps([{'action': 'eval', 'expression': '()=>[innerWidth,innerHeight]'}]))
                self.assertEqual(play_session.step(second), 0)
                self.assertEqual(pages[1].size, [360, 800])


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
            mock.patch.object(play_session, "_pid_alive", lambda pid: pid == 1234),
        ]
        for patcher in self.patch:
            patcher.start()
            self.addCleanup(patcher.stop)

    def test_unrecorded_session_counts_as_a_live_claim(self):
        rows = play_session.claims()
        self.assertEqual(len(rows), 1)
        self.assertTrue(rows[0]["live"])
        self.assertEqual(rows[0]["owner"], "unrecorded")

    def test_a_port_answered_by_the_next_browser_is_not_a_live_claim(self):
        """A stopped session's port gets reused: identity is the browser process, not the port."""
        with mock.patch.object(play_session, "_pid_alive", lambda pid: False):
            rows = play_session.claims()
            self.assertFalse(rows[0]["live"])
            play_session.refuse_or_reclaim(mock.Mock(reclaim=False),
                                           self.tmp / "artifacts" / "mine")

    def test_start_refuses_to_double_book_the_machine_for_it(self):
        args = mock.Mock(reclaim=False)
        with self.assertRaises(SystemExit) as caught:
            play_session.refuse_or_reclaim(args, self.tmp / "artifacts" / "mine")
        self.assertIn("orphan", str(caught.exception))

    def test_reclaiming_clears_the_ownership_token(self):
        entry = play_session.claims()[0]
        alive = {1234: True, 5678: True}
        with mock.patch.object(play_session, "kill_tree", lambda pid: alive.__setitem__(pid, False)), \
             mock.patch.object(play_session, "_pid_alive", lambda pid: alive.get(pid, False)):
            play_session.reclaim(entry)
        self.assertFalse((self.tmp / "artifacts" / "orphan" / "session.json").exists())

    def test_failed_kill_keeps_the_ownership_token(self):
        entry = play_session.claims()[0]
        with mock.patch.object(play_session, "kill_tree", lambda pid: None):
            with self.assertRaisesRegex(RuntimeError, "still live"):
                play_session.reclaim(entry)
        self.assertTrue((self.tmp / "artifacts" / "orphan" / "session.json").exists())


class ExpectStepTests(unittest.TestCase):
    """`ok` must mean the page shows it, not that the call returned."""

    class Page:
        def __init__(self, visible):
            self.visible = visible
            self.calls = []

        def evaluate(self, script, arg=None):
            self.calls.append(arg)
            return self.visible

        def wait_for_timeout(self, milliseconds):
            pass

    def run_expect(self, visible):
        page = self.Page(visible)
        return play_session.run_step(page, {"action": "expect", "text": "a beat"},
                                     Path("session")), page

    def test_visible_words_pass(self):
        result, page = self.run_expect(True)
        self.assertEqual(result, {"ok": True})
        self.assertEqual(page.calls, ["a beat"])

    def test_a_step_that_changed_nothing_fails_with_the_words_it_missed(self):
        result, _ = self.run_expect(False)
        self.assertFalse(result["ok"])
        self.assertIn("a beat", result["error"])

    def test_expect_is_in_the_vocabulary_a_critic_is_told(self):
        self.assertIn("expect", play_session.ACTIONS)
        self.assertIn("text", play_session.STEP_KEYS)


if __name__ == "__main__":
    unittest.main()
