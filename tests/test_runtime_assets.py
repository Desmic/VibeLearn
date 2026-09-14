"""The asset-preparation command used by Render must produce the transfer lab."""
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from zipfile import ZipFile

import manage
from tools import package_repair


class RuntimeAssetsTests(unittest.TestCase):
    def test_vendor_prepares_downloadable_lab_without_ci_build(self):
        original = package_repair.ROOT / 'labs' / 'relay-repair'
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'web').mkdir()
            lab = root / 'labs' / 'relay-repair'
            lab.mkdir(parents=True)
            for name in package_repair.FILES:
                (lab / name).write_bytes((original / name).read_bytes())
            # External library downloads are independent of the local lab build.
            # Exercise the real Render entry point and real archive generation.
            with patch.object(sys, 'argv', ['manage.py', 'vendor']), \
                    patch.object(manage.subprocess, 'call', return_value=0), \
                    patch.object(package_repair, 'ROOT', root):
                self.assertEqual(manage.main(), 0)
            with ZipFile(root / 'web' / 'relay-repair-kit.zip') as archive:
                self.assertEqual(set(archive.namelist()),
                                 {f'relay-repair/{n}' for n in package_repair.FILES})
                for name in package_repair.FILES:
                    self.assertEqual(archive.read(f'relay-repair/{name}'),
                                     (original / name).read_bytes())
