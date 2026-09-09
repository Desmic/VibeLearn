"""Fetch a pinned renderer at build time; no third-party requests in learner sessions.

The content IDs were read from the official mrdoob/three.js r180 release using
GitHub's API. An existing verified copy works offline. Never accept an unverified
response, silently float a dependency, or weaken the application's CSP.
"""
import hashlib
import json
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
COMMIT = '0af9729d0c143a86a1d725d6e2c3ad83301f3f34'
FILES = {
    'three.module.min.js': ('build/three.module.min.js', '20d3c112761a519c7780a5ccc9f72a40937fa83b'),
    'three.core.min.js': ('build/three.core.min.js', '70c40977daa0f6e1e312c6b58e9bfe49cb5a87a4'),
    'THREE-LICENSE.txt': ('LICENSE', 'cf781430404b0ae0ba7d8dea3457a3515dd7c9b9'),
}


def blob_id(data):
    return hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()


def main():
    target = ROOT / 'web' / 'vendor'; target.mkdir(exist_ok=True)
    report = {'version': '0.180.0', 'upstream_commit': COMMIT, 'files': {}}
    for name, (upstream, expected) in FILES.items():
        path = target / name
        data = path.read_bytes() if path.exists() else b''
        if blob_id(data) != expected:
            request = urllib.request.Request(
                f'https://raw.githubusercontent.com/mrdoob/three.js/{COMMIT}/{upstream}',
                headers={'User-Agent': 'VibeLearn-pinned-build'})
            with urllib.request.urlopen(request, timeout=30) as response:
                data = response.read(1_000_001)
            if len(data) > 1_000_000 or blob_id(data) != expected:
                raise RuntimeError(f'Pinned Three.js content verification failed: {name}')
            temporary = path.with_suffix('.tmp'); temporary.write_bytes(data); temporary.replace(path)
        report['files'][name] = {'git_blob': expected, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    (ROOT / 'artifacts').mkdir(exist_ok=True)
    (ROOT / 'artifacts/three-vendor.json').write_text(json.dumps(report, indent=2))
    print('Pinned Three.js 0.180.0 verified; learner runtime remains self-hosted.')


if __name__ == '__main__': main()
