"""The web files the servers are allowed to serve, derived from the pages they route.

Both servers used to carry their own hand-written list of every module, so a shared
module that a page imported reached the browser as a 404 and the failure surfaced
later as a stalled browser test instead of a build error. The import graph is the
source of truth now: a module is servable exactly when a served page can reach it,
and a routed import with no file behind it is a build failure rather than a runtime 404.
"""
import functools
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web"

# The documents the local and hosted servers route. The vendor and model routes keep
# their own explicit name lists in each server.
ENTRY_PAGES = ("index.html", "first-words.html")

REFS = {
    ".html": re.compile(r"""(?:src|href)\s*=\s*["']([^"'\s]+?)["']"""),
    ".js": re.compile(r"""(?:\bfrom|\bimport|\brequire)\s*\(?\s*["']([^"'\s]+?)["']"""),
    ".css": re.compile(r"""url\(\s*["']?([^"')\s]+?)["']?\s*\)"""),
}

# Anything with a scheme, a fragment, or a protocol-relative URL is not a local file;
# an extension-less path like /first-words is a route, not an asset.
NOT_A_FILE = re.compile(r"^(?:#|//|[A-Za-z][A-Za-z0-9+.-]*:)")
SERVABLE_SUFFIXES = {".html": "text/html", ".js": "text/javascript", ".css": "text/css"}
# Third-party drops and shipped models are leaves: they are reachable, but their own
# contents are not ours to parse and each has a dedicated route with a name list.
VENDORED = ("vendor/", "assets/")


def _locate(origin, ref):
    """Resolve one written reference to a web-relative name, or None if it isn't one."""
    if NOT_A_FILE.match(ref) or Path(ref).suffix not in SERVABLE_SUFFIXES:
        return None
    target = (WEB / ref.lstrip("/")) if ref.startswith("/") else (origin.parent / ref)
    resolved = target.resolve()
    return None if WEB not in resolved.parents else resolved.relative_to(WEB).as_posix()


def references(path):
    """(reachable names, unanswerable references) for one web source file."""
    found, missing = [], []
    text = path.read_text(encoding="utf-8")
    for match in REFS.get(path.suffix, re.compile("(?!)")).finditer(text):
        ref = match.group(1)
        name = _locate(path, ref)
        if name is None:
            if not NOT_A_FILE.match(ref) and Path(ref).suffix in SERVABLE_SUFFIXES:
                missing.append(f"{path.relative_to(WEB).as_posix()} -> {ref}")
            continue
        if not (WEB / name).is_file():
            missing.append(f"{path.relative_to(WEB).as_posix()} -> {ref}")
        else:
            found.append(name)
    return sorted(set(found)), sorted(set(missing))


def _walk():
    graph, missing, pending = {}, [], [n for n in ENTRY_PAGES if (WEB / n).is_file()]
    reached = set(pending)
    while pending:
        name = pending.pop()
        if name.startswith(VENDORED):
            graph[name] = []
            continue
        children, unresolved = references(WEB / name)
        graph[name] = children
        missing.extend(unresolved)
        for child in children:
            if child not in reached:
                reached.add(child)
                pending.append(child)
    return graph, sorted(set(missing))


@functools.lru_cache(maxsize=1)
def graph():
    """name -> served-relative imports, for every file reachable from a routed page."""
    return _walk()[0]


@functools.lru_cache(maxsize=1)
def missing_references():
    """Routed imports with no file behind them — each one would be a browser 404."""
    return _walk()[1]


def served_names():
    """The root-level source files a flat "/<asset>" route may return."""
    return frozenset(name for name, _mime in served_assets().values())


def served_assets():
    """path -> (filename, mime) for the flat allowlist both servers expose.

    Only root-level source lives here; vendored runtime and model files are served by
    their own routes, and a page is reachable through its own route, not this map.
    """
    return {f"/{name}": (name, SERVABLE_SUFFIXES[Path(name).suffix])
            for name in graph()
            if "/" not in name and Path(name).suffix in SERVABLE_SUFFIXES
            and name not in ENTRY_PAGES}
