"""Persistent browser play session for critic agents (docs/ASTRA-REVIEW-WORKFLOW.md).

A critic must play a generated game end to end across many turns, with real
keyboard/mouse/drag input, viewport changes and a retained action trace. One-shot
test scripts tear their browser down when they exit, and a single-shot MCP browser
cannot hold a key or resize, so reviewers kept rebuilding the same driver by hand.
This is that driver, shared: the browser stays up between commands and every action
is appended to a trace file that is the review evidence.

Game-agnostic: it takes a URL, never a level, and reads no project source.

  python -m tools.play_session start --serve --url /first-words --root artifacts/play-session
  python -m tools.play_session step --root artifacts/play-session --file steps.json
  python -m tools.play_session step --root artifacts/play-session --steps '[{"action":"dump"}]'
  python -m tools.play_session stop --root artifacts/play-session
  python -m tools.play_session list
  python -m tools.play_session sweep

Headless WebGL is rasterised on the CPU here, and a page that repaints continuously costs
several cores for as long as it does — including while a critic thinks between steps, because
the game's own animation loop and this harness's frame probe both keep requesting frames. Two
sessions at once is what makes the machine crawl, so 'start' refuses a second one unless
--reclaim; batch 8-15 steps into one 'step' call instead of driving one action per call. Every
browser opened is recorded in artifacts/owned.jsonl and crossed out on stop, so a leak has an
owner and 'list' answers "what is still running" without enumerating processes — any live
session.json under artifacts counts as a claim even when the ledger predates it, and liveness
is the browser's own process, never its port, because stopped sessions leave ports to be
reused. Never wrap a browser run in `timeout`: killing the driver leaves its chromium
repainting forever.

Step actions: goto reload resize wait settle key hold type click clicktext clickrole
drag shot dump buttons eval lsget. `settle` waits for actually-rendered frames,
because headless software WebGL can run several times slower than real time and a
millisecond-timed input window starves movement. A `shot` path is relative to the
session `--root`, so every screenshot a review names lands in that review's own pack.
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    # Invoked as `python tools/play_session.py`, the script directory is `tools/`, so the
    # project package the disposable server lives in is otherwise unimportable.
    sys.path.insert(0, str(ROOT))
ACTIONS = {"goto", "reload", "resize", "wait", "settle", "key", "hold", "type",
           "click", "clicktext", "clickrole", "drag", "shot", "dump", "buttons",
           "eval", "lsget"}
STEP_KEYS = {"action", "wait", "timeout", "exact", "frames", "seconds", "segment_ms",
             "path", "via", "url", "key", "text", "target", "name", "x", "y",
             "width", "height", "from", "to", "expression"}

DUMP = """() => {
  const vis = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05
      && r.width > 0 && r.height > 0; };
  const texts = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el) || el.children.length) continue;
    const t = (el.textContent || '').trim(); const r = el.getBoundingClientRect();
    if (t) texts.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} ` +
      `[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] ` +
      `${t.slice(0, 240)}`);
  }
  return {title: document.title, url: location.href, texts: texts.slice(0, 80)};
}"""

BUTTONS = """() => {
  const out = [];
  for (const el of document.querySelectorAll('button,a,[role=button]')) {
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) < 0.05) continue;
    if (r.width < 4 || r.height < 4) continue;
    out.push({label: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 80),
      x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
      w: Math.round(r.width), h: Math.round(r.height), disabled: Boolean(el.disabled),
      onscreen: r.x >= 0 && r.y >= 0 && r.right <= innerWidth + 2 && r.bottom <= innerHeight + 2});
  }
  return out;
}"""

FRAMES = """() => {
  // Software WebGL burns about a core per repaint, so the probe that counts frames must not
  // keep requesting them after its caller has gone: it runs for a short window and re-arms
  // only when a settle polls it again.
  const s = window.__psf || (window.__psf = {n: 0, until: 0});
  const now = Date.now();
  if (now >= s.until) {
    s.until = now + 5000;
    const tick = () => { s.n++; if (Date.now() < s.until) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  return s.n; }"""


def session_file(root):
    return Path(root) / "session.json"


# Every browser this harness opens is written down when it opens and crossed out when it is
# reclaimed. Software-rasterised WebGL costs a core per session and an abandoned critic leaves
# its chromium repainting forever, so ownership has to be a file an operator can read — not
# something reconstructed by enumerating processes, which on this host takes minutes.
LEDGER = ROOT / "artifacts" / "owned.jsonl"


def _port_open(port, timeout=0.35):
    import socket
    try:
        with socket.create_connection(("127.0.0.1", int(port)), timeout=timeout):
            return True
    except (OSError, TypeError, ValueError):
        return False


def _pid_alive(pid):
    """Is this process still running? `os.kill(pid, 0)` is NOT a probe on Windows — it calls
    TerminateProcess there, so it would kill the very browser it was asked about."""
    if not pid:
        return False
    pid = int(pid)
    if sys.platform != "win32":
        import os
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False
    import ctypes
    kernel32 = ctypes.windll.kernel32
    handle = kernel32.OpenProcess(0x1000, False, pid)  # PROCESS_QUERY_LIMITED_INFORMATION
    if not handle:
        return False
    try:
        code = ctypes.c_ulong()
        if not kernel32.GetExitCodeProcess(handle, ctypes.byref(code)):
            return False
        return code.value == 259  # STILL_ACTIVE; an unreaped exit code is not a running process
    finally:
        kernel32.CloseHandle(handle)


def _devtools_alive(port):
    """Ask the DevTools endpoint rather than the port: a bare listener could be a recycled
    port, and a false 'live' here refuses a legitimate run."""
    if not port:
        return False
    import urllib.request
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{int(port)}/json/version", timeout=0.5) as ok:
            return b"Browser" in ok.read(512)
    except (OSError, ValueError):
        return False


def _root_key(root):
    """Ledger roots are recorded as written and must still match a discovered path."""
    try:
        return str(Path(root).resolve())
    except OSError:
        return str(root)


def record(op, session, owner="unknown"):
    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    entry = {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "op": op, "owner": owner,
             "root": session.get("root"), "cdp": session.get("port"),
             "pid": session.get("pid"), "server_pid": session.get("server_pid"),
             "url": session.get("url")}
    with LEDGER.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")


def live(pid=None, cdp=None, url=None):
    """A session holds the machine only while its own browser process is running."""
    return _pid_alive(pid) and (_devtools_alive(cdp) or _port_open(port_of(url)))


def claims():
    """Every browser this machine can still be blamed for, one entry per root, probed for life."""
    latest = {}
    if LEDGER.exists():
        for line in LEDGER.read_text(encoding="utf-8").splitlines():
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if entry.get("root"):
                latest[_root_key(entry["root"])] = entry
    # The ledger only knows what it was around to write down, and a session.json left by a
    # killed driver is a live chromium on a port regardless. Discovering the file keeps a
    # pre-ledger orphan from silently double-booking the machine behind 'start'.
    artifacts = ROOT / "artifacts"
    for path in artifacts.rglob("session.json") if artifacts.is_dir() else ():
        key = _root_key(path.parent)
        if key in latest:
            continue
        try:
            held = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        latest[key] = {"root": str(path.parent), "ts": "", "op": "started", "owner": "unrecorded",
                       "cdp": held.get("port"), "pid": held.get("pid"),
                       "server_pid": held.get("server_pid"), "url": held.get("url")}
    for entry in latest.values():
        # A port alone is not identity: the next session reuses 9333 after the last one stops,
        # and then a dead owner reads as a live one while `--reclaim` kills whoever is playing.
        entry["live"] = live(entry.get("pid"), entry.get("cdp"), entry.get("url"))
    return sorted(latest.values(), key=lambda entry: str(entry.get("ts")))


def port_of(url):
    from urllib.parse import urlsplit
    parts = urlsplit(url or "")
    return parts.port


def kill_tree(pid):
    if not pid:
        return
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True)
    else:
        subprocess.run(["kill", str(pid)], capture_output=True)


def reclaim(entry):
    for pid in (entry.get("pid"), entry.get("server_pid")):
        kill_tree(pid)
    # Drop the ownership token with the process it named, otherwise 'list' fills up with
    # corpses that look like sessions someone might still be driving.
    session_file(entry.get("root")).unlink(missing_ok=True)
    record("reclaimed", entry, owner="sweeper")


def refuse_or_reclaim(args, own_root):
    """One browser work unit at a time: a second one doubles the CPU rasterisation."""
    held = [entry for entry in claims()
            if entry.get("live") and Path(entry["root"]) != Path(own_root)]
    if not held:
        return
    if not args.reclaim:
        owners = ", ".join(f"{entry['root']} (owner {entry.get('owner')}, cdp {entry.get('cdp')})"
                           for entry in held)
        raise SystemExit(f"another play session already holds the machine: {owners} — "
                         "stop it, or pass --reclaim to take over a session you know is orphaned")
    for entry in held:
        reclaim(entry)
    print(json.dumps({"reclaimed": [entry["root"] for entry in held]}))


def load(root):
    path = session_file(root)
    if not path.exists():
        raise SystemExit(f"no session at {path} — run 'start' first")
    return json.loads(path.read_text(encoding="utf-8"))


def trace(root, entry):
    with (Path(root) / "action-trace.jsonl").open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")


def start(args):
    root = Path(args.root)
    refuse_or_reclaim(args, root)
    root.mkdir(parents=True, exist_ok=True)
    if session_file(root).exists():
        held = {"root": str(root), **json.loads(session_file(root).read_text(encoding="utf-8"))}
        if live(held.get("pid"), held.get("port"), held.get("url")):
            raise SystemExit(f"{root} already holds a live session — run 'stop' first")
        # Dead but still recorded: the owner died before 'stop'. Reap it rather than stacking
        # a second chromium on top of the orphan.
        reclaim(held)
        session_file(root).unlink(missing_ok=True)
    server = None
    base = args.url
    if args.serve:
        from tests.browser_check import start_server
        database = root / "session.sqlite3"
        if database.exists():
            raise SystemExit(f"refusing to reuse an existing learner DB: {database}")
        server, base = start_server(database)
    from playwright.sync_api import sync_playwright
    with sync_playwright() as playwright:
        executable = playwright.chromium.executable_path
    # Git Bash rewrites a leading-slash argument into a Windows path, so `--path /x` can
    # arrive as "C:/Program Files/Git/x". Pass `--path x`, or set MSYS_NO_PATHCONV=1.
    path = args.path.strip()
    if _port_open(args.port):
        # Two critics both defaulting to 9333 does not produce two browsers: the second one
        # waits on a port someone else owns and then reports a browser that never answered.
        import socket
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            args.port = probe.getsockname()[1]
    if path and not path.startswith("/"):
        path = "/" + path
    if path and (":" in path or "\\" in path):
        raise SystemExit(f"--path looks like a shell-mangled Windows path: {args.path!r} — "
                         "pass it without the leading slash, or set MSYS_NO_PATHCONV=1")
    entry = (base + path) if path else base
    flags = [executable, f"--remote-debugging-port={args.port}",
             f"--user-data-dir={root / 'profile'}", "--no-first-run", "--no-default-browser-check",
             f"--window-size={args.viewport[0]},{args.viewport[1]}"]
    if args.headless:
        # A generated game is WebGL: without software rasterisation a headless
        # critic sees a blank canvas, and the GPU sandbox is denied on this host.
        flags += ["--headless=new", "--disable-gpu-sandbox", "--use-angle=swiftshader",
                  "--enable-unsafe-swiftshader"]
    log = (root / "browser.log").open("w", encoding="utf-8")
    browser = subprocess.Popen(flags + [entry], stdout=log, stderr=subprocess.STDOUT,
                               creationflags=0x00000008 if sys.platform == "win32" else 0)
    deadline = time.monotonic() + args.timeout
    ready = False
    while time.monotonic() < deadline:
        if browser.poll() is not None:  # chrome exits at once when it cannot bind the port
            break
        try:
            import urllib.request
            with urllib.request.urlopen(f"http://127.0.0.1:{args.port}/json/version", timeout=2):
                ready = True
                break
        except Exception:
            pass
        time.sleep(0.5)
    if not ready:
        # A browser that never answered is abandoned here, so the disposable server started
        # for it must not be left listening — that is exactly how a failed run becomes a leak.
        browser.terminate()
        kill_tree(server.pid if server else None)
        raise SystemExit(f"DevTools port {args.port} never answered within {args.timeout}s — "
                         f"see {root / 'browser.log'}")
    session = {"port": args.port, "pid": browser.pid, "root": str(root), "url": entry,
               "server_pid": server.pid if server else None,
               "db": str(root / "session.sqlite3") if server else None}
    session_file(root).write_text(json.dumps(session, indent=1), encoding="utf-8")
    record("started", session, owner=args.owner)
    print(json.dumps({"started": str(root), "cdp": args.port, "url": entry}))


def run_step(page, step, root):
    kind = step["action"]
    pause = step.get("wait", 0.6)
    if kind == "goto":
        page.goto(step["url"], wait_until="domcontentloaded", timeout=step.get("timeout", 120000))
    elif kind == "reload":
        page.reload(wait_until="domcontentloaded")
    elif kind == "resize":
        page.set_viewport_size({"width": step["width"], "height": step["height"]})
    elif kind == "wait":
        page.wait_for_timeout(step["seconds"] * 1000)
    elif kind == "settle":
        start = page.evaluate(FRAMES)
        deadline = time.monotonic() + step.get("timeout", 60)
        while page.evaluate(FRAMES) - start < step.get("frames", 2):
            if time.monotonic() > deadline:
                return {"ok": False, "error": f"renderer starved: {step.get('frames', 2)} frames"}
            page.wait_for_timeout(40)
    elif kind == "key":
        page.keyboard.press(step["key"])
    elif kind == "hold":
        page.keyboard.down(step["key"])
        page.wait_for_timeout(step.get("seconds", 0.6) * 1000)
        page.keyboard.up(step["key"])
    elif kind == "type":
        page.locator(step["target"]).fill(step["text"])
    elif kind == "click":
        page.mouse.click(step["x"], step["y"])
    elif kind == "clicktext":
        page.get_by_text(step["text"], exact=step.get("exact", False)).first.click(timeout=step.get("timeout", 10000))
    elif kind == "clickrole":
        page.get_by_role("button", name=step["name"], exact=True).first.click(timeout=step.get("timeout", 10000))
    elif kind == "drag":
        page.mouse.move(*step["from"])
        page.mouse.down()
        for x, y in step.get("via", [step["to"]]):
            page.mouse.move(x, y)
            page.wait_for_timeout(step.get("segment_ms", 60))
        page.mouse.up()
    elif kind == "shot":
        path = Path(step["path"])
        # A bare name belongs to the session, not to whoever happened to run the command: the
        # evidence pack is read back from the session root, and a shot written to the cwd is
        # missing from it while the trace still claims success. Paths already written out to
        # the root stay as they are, because reviewers spell them both ways.
        if not path.is_absolute():
            anchored = (Path.cwd() / path).resolve()
            if Path(root).resolve() not in anchored.parents:
                path = root / path
        path.parent.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(path))
        return {"ok": True, "shot": str(path)}
    elif kind == "dump":
        return {"ok": True, **page.evaluate(DUMP)}
    elif kind == "buttons":
        return {"ok": True, "buttons": page.evaluate(BUTTONS)}
    elif kind == "eval":
        return {"ok": True, "value": page.evaluate(step["expression"])}
    elif kind == "lsget":
        return {"ok": True, "localStorage": page.evaluate(
            "() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, (localStorage.getItem(k) || '').slice(0, 300)])))")}
    page.wait_for_timeout(pause * 1000)
    return {"ok": True}


def step(args):
    session = load(args.root)
    root = Path(session.get("root") or args.root)
    steps = json.loads(Path(args.file).read_text(encoding="utf-8")) if args.file else json.loads(args.steps)
    from playwright.sync_api import sync_playwright
    results = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.connect_over_cdp(f"http://127.0.0.1:{session['port']}")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()
        for item in steps:
            unknown = set(item) - {"action"} - STEP_KEYS
            # A critic that guesses a key must learn the vocabulary in the same call: during
            # one cold pass six of twenty-one steps were spent rediscovering these names.
            hint = f" expected one of {sorted(ACTIONS)}" if item.get("action") not in ACTIONS else \
                   f" allowed keys for {item.get('action')}: {sorted(STEP_KEYS)}"
            if item.get("action") not in ACTIONS:
                result = {"ok": False, "error": f"unknown action {item.get('action')!r}"}
            elif unknown:
                result = {"ok": False, "error": f"{item['action']}: unknown key(s) {sorted(unknown)}"}
            else:
                try:
                    result = run_step(page, item, root)
                except Exception as error:  # a critic must see the failure, not a stack trace
                    result = {"ok": False, "error": f"{type(error).__name__}: {str(error)[:300]}"}
            if not result.get("ok"):
                result["error"] += hint
            # One root for the whole pack: the trace and the shots it names must sit together.
            trace(root, {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "step": item, "result": {
                k: v for k, v in result.items() if k in {"ok", "error", "shot"}}})
            results.append(result)
    print(json.dumps(results, ensure_ascii=False, indent=1))
    return 0 if all(r.get("ok") for r in results) else 1


def stop(args):
    session = load(args.root)
    reclaim(session)
    session_file(args.root).unlink(missing_ok=True)
    print(json.dumps({"stopped": str(args.root), "trace": str(Path(args.root) / "action-trace.jsonl")}))


def listing(args):
    """Who owns a browser on this machine right now — read from ledger and session files,
    never by enumerating processes, which costs minutes on this host."""
    rows = [{"root": entry.get("root"), "live": entry.get("live"), "owner": entry.get("owner"),
             "since": entry.get("ts"), "cdp": entry.get("cdp"), "pid": entry.get("pid"),
             "server_pid": entry.get("server_pid")} for entry in claims()]
    print(json.dumps(rows, indent=1))
    return 0


def sweep(args):
    """Reap every session the ledger still marks live but nobody is driving."""
    taken = []
    for entry in claims():
        if entry.get("live") and Path(entry["root"]) != Path(args.root):
            reclaim(entry)
            taken.append(entry["root"])
        elif entry.get("live"):
            stop(args)
            taken.append(entry["root"])
    print(json.dumps({"reclaimed": taken, "remaining_live": [e["root"] for e in claims() if e.get("live")]}))
    return 0


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("command", choices=["start", "step", "stop", "list", "sweep"])
    parser.add_argument("--root", default="artifacts/play-session")
    parser.add_argument("--serve", action="store_true", help="start the app on a fresh disposable DB")
    parser.add_argument("--url", default="http://127.0.0.1:8000", help="origin to play (with --serve, the port is reported)")
    parser.add_argument("--path", default="", help="entry path on that origin, e.g. /first-words")
    parser.add_argument("--port", type=int, default=9333, help="DevTools port")
    parser.add_argument("--viewport", type=int, nargs=2, default=[1280, 720])
    parser.add_argument("--windowed", dest="headless", action="store_false",
                        help="show a real window instead of headless (native computer-use critics)")
    parser.set_defaults(headless=True)
    parser.add_argument("--timeout", type=int, default=120, help="seconds to wait for the browser")
    parser.add_argument("--file", help="JSON list of steps")
    parser.add_argument("--steps", help="inline JSON list of steps")
    parser.add_argument("--owner", default="unknown",
                        help="who is driving, recorded in the ledger so a leak has a name")
    parser.add_argument("--reclaim", action="store_true",
                        help="start anyway, after killing sessions another owner left behind")
    args = parser.parse_args(argv)
    if args.command == "start":
        return start(args)
    if args.command == "step":
        if not (args.file or args.steps):
            raise SystemExit("step needs --file or --steps")
        return step(args)
    if args.command == "list":
        return listing(args)
    if args.command == "sweep":
        return sweep(args)
    stop(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
