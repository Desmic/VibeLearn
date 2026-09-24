"""The served web asset set is derived from the import graph, not hand-listed (see app/assets.py)."""
import unittest
from pathlib import Path

from app.assets import ENTRY_PAGES, WEB, graph, missing_references, served_assets, served_names


class AssetGraphTests(unittest.TestCase):
    def test_every_routed_import_resolves_to_a_file(self):
        self.assertEqual([], missing_references())

    def test_served_set_covers_every_reachable_root_module(self):
        served = served_names()
        for name, children in graph().items():
            for child in children:
                if "/" not in child:
                    self.assertIn(child, served, f"{name} imports {child}, which no route serves")

    def test_shared_preference_module_is_served(self):
        # The regression this replaces: a new shared module was imported by the page but
        # absent from both hand-written lists, so it 404ed and the page never booted.
        self.assertIn('/preferences.js', served_assets())
        self.assertIn('preferences.js', graph()['first-words.js'])

    def test_no_served_module_is_unreachable_source(self):
        for path, (name, _mime) in served_assets().items():
            self.assertTrue((WEB / name).is_file(), f"{path} is served from a missing file")
            self.assertNotIn("/", name)

    def test_every_web_page_is_routed_or_explicitly_retired(self):
        # Adding a page is a decision, not an oversight: ENTRY_PAGES only lists what a
        # server routes, so an unreferenced new page fails here until it is declared.
        retired = {'word-machine.html'}
        self.assertEqual(set(), {p.name for p in Path(WEB).glob('*.html')}
                         - set(ENTRY_PAGES) - retired)


if __name__ == "__main__":
    unittest.main()
