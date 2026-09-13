"""Fetch a pinned renderer at build time; no third-party requests in learner sessions.

The content IDs were read from the official mrdoob/three.js r180 release using
GitHub's API. An existing verified copy works offline. Never accept an unverified
response, silently float a dependency, or weaken the application's CSP.
"""
import hashlib
import json
from pathlib import Path
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
COMMIT = '0af9729d0c143a86a1d725d6e2c3ad83301f3f34'
FILES = {
    'three.module.min.js': ('build/three.module.min.js', '20d3c112761a519c7780a5ccc9f72a40937fa83b'),
    'three.core.min.js': ('build/three.core.min.js', '70c40977daa0f6e1e312c6b58e9bfe49cb5a87a4'),
    'THREE-LICENSE.txt': ('LICENSE', 'cf781430404b0ae0ba7d8dea3457a3515dd7c9b9'),
}
FETCH_ATTEMPTS = 3
FETCH_BACKOFF_SECONDS = (0.5, 1.5)


def blob_id(data):
    return hashlib.sha1(f'blob {len(data)}\0'.encode() + data).hexdigest()


def fetch_pinned(url, *, limit=1_000_000):
    """Retry transport failures only; immutable content verification still decides success."""
    last_error = None
    for attempt in range(FETCH_ATTEMPTS):
        request = urllib.request.Request(url, headers={'User-Agent': 'VibeLearn-pinned-build'})
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read(limit + 1)
        except (urllib.error.URLError, ConnectionError, TimeoutError, OSError) as error:
            last_error = error
            if attempt >= FETCH_ATTEMPTS - 1:
                break
            time.sleep(FETCH_BACKOFF_SECONDS[min(attempt, len(FETCH_BACKOFF_SECONDS) - 1)])
    raise RuntimeError(f'Pinned Three.js fetch failed after {FETCH_ATTEMPTS} attempts') from last_error


def main():
    target = ROOT / 'web' / 'vendor'; target.mkdir(exist_ok=True)
    report = {'version': '0.180.0', 'upstream_commit': COMMIT, 'files': {}}
    for name, (upstream, expected) in FILES.items():
        path = target / name
        data = path.read_bytes() if path.exists() else b''
        if blob_id(data) != expected:
            data = fetch_pinned(
                f'https://raw.githubusercontent.com/mrdoob/three.js/{COMMIT}/{upstream}'
            )
            if len(data) > 1_000_000 or blob_id(data) != expected:
                raise RuntimeError(f'Pinned Three.js content verification failed: {name}')
            temporary = path.with_suffix('.tmp'); temporary.write_bytes(data); temporary.replace(path)
        report['files'][name] = {'git_blob': expected, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}
    (ROOT / 'artifacts').mkdir(exist_ok=True)
    (ROOT / 'artifacts/three-vendor.json').write_text(json.dumps(report, indent=2))
    print('Pinned Three.js 0.180.0 verified; learner runtime remains self-hosted.')


if __name__ == '__main__': main()
