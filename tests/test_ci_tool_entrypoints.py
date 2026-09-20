"""Exercise the actual CI tool entrypoints without an ambient PYTHONPATH."""
import os
from pathlib import Path
import re
import shlex
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]


class CiToolEntrypointTests(unittest.TestCase):
    def test_workflow_tools_start_without_pythonpath(self):
        commands = set()
        for name in ('verify.yml', 'promote-preview.yml'):
            source = (ROOT / '.github' / 'workflows' / name).read_text(encoding='utf-8')
            commands.update(re.findall(
                r'^\s*python ((?:-m tools\.[a-z_]+)|(?:tools/[a-z_]+\.py))',
                source, re.MULTILINE))
        self.assertTrue(commands, 'No CI tool entrypoints found')
        env = {key: value for key, value in os.environ.items()
               if key.upper() != 'PYTHONPATH'}
        for command in sorted(commands):
            with self.subTest(command=command):
                result = subprocess.run(
                    [sys.executable, *shlex.split(command), '--help'],
                    cwd=ROOT, env=env, capture_output=True, text=True, timeout=30)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
                self.assertIn('usage:', result.stdout.lower())


if __name__ == '__main__':
    unittest.main()
