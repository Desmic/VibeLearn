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

Headless WebGL is CPU-rasterised only with `--software`, and a page that repaints
continuously then costs several cores for as long as it does — including while a critic
thinks between steps, because
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
drag shot dump buttons eval lsget expect. `settle` waits for actually-rendered frames,
because rasterisation can run several times slower than real time and a millisecond-timed
input window starves movement. A `shot` path is relative to the session `--root`, so every
screenshot a review names lands in that review's own pack. `expect` is the only step that
can certify a beat: every other action reports ok when its call did not throw, so a whole
replay can be green while the world never advanced.

Rasterisation defaults to the host's GPU path (`--use-angle=d3d11`, measured 60-144fps
here); `--software` forces the CPU path, which ran at about 9fps in an earlier sample.
`start` and every `step` connection set the page box over CDP and refuse evidence if
the page reports a different viewport than was asked for,
because `--window-size` is not the viewport and a review shot taken at the wrong box is not
phone or desktop evidence — and a trace recorded through that wrong box cannot be replayed
to re-certify the claim it made.
"""
import argparse
import json
import shutil
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
           "eval", "lsget", "expect"}
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

RENDERER = """() => { const c = document.querySelector('canvas');
  const gl = c && (c.getContext('webgl2') || c.getContext('webgl'));
  if (!gl) return null; const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  return dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER)); }"""

BUTTONS = """() => {  const out = [];
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

# A step that returns ok only means the call did not throw. One replay reported 110 clean
# steps while the world never advanced, which is how a review certifies a beat it never
# reached. This probe asks the page whether words a player can actually see contain a
# string; a 1x1 screen-reader node is deliberately too small to answer, so an `expect`
# cannot be satisfied by the channel guide rule I12 already forbids.
EXPECT = """(needle) => {
  const vis = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.05
      && r.width > 1 && r.height > 1; };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if ((node.nodeValue || '').includes(needle) && vis(node.parentElement)) return true;
  }
  return false;
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
        # taskkill can return "Access denied" for a browser this account started.
        # Stop-Process works on this host; traverse children first so a detached
        # Chromium GPU/renderer cannot survive its browser root.
        target = int(pid)
        script = (f"$target={target};$all=Get-CimInstance Win32_Process;"
                  "$ids=New-Object 'System.Collections.Generic.List[int]';$ids.Add($target);"
                  "for($i=0;$i -lt $ids.Count;$i++){"
                  "$all|Where-Object ParentProcessId -eq $ids[$i]|ForEach-Object {$ids.Add([int]$_.ProcessId)}};"
                  "for($i=$ids.Count-1;$i -ge 0;$i--){"
                  "Stop-Process -Id $ids[$i] -Force -ErrorAction SilentlyContinue};"
                  "if(Get-Process -Id $target -ErrorAction SilentlyContinue){exit 1}")
        shell = shutil.which("pwsh") or shutil.which("powershell")
        if not shell:
            raise RuntimeError("PowerShell is required to stop a Windows browser process tree")
        result = subprocess.run([shell, "-NoProfile", "-Command", script],
                                capture_output=True, text=True, timeout=20)
        if result.returncode:
            raise RuntimeError(f"could not stop process tree {target}: {result.stderr.strip()}")
    else:
        import os
        import signal
        try:
            os.kill(int(pid), signal.SIGTERM)
        except ProcessLookupError:
            pass


def reclaim(entry):
    for pid in (entry.get("pid"), entry.get("server_pid")):
        kill_tree(pid)
    if any(_pid_alive(pid) for pid in (entry.get("pid"), entry.get("server_pid"))):
        raise RuntimeError(f"session processes still live; refusing to mark {entry.get('root')} stopped")
    # Drop the ownership token with the process it named, otherwise 'list' fills up with
    # corpses that look like sessions someone might still be driving.
    session_file(entry.get("root")).unlink(missing_ok=True)
    record("reclaimed", entry, owner="sweeper")


def refuse_or_reclaim(args, own_root):
    """One browser work unit at a time: a second one doubles the CPU rasterisation."""
    held = [entry for entry in claims()
            if entry.get("live") and _root_key(entry["root"]) != _root_key(own_root)]
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
    root = Path(args.root).resolve()
    # Reject a mangled entry path before anything is created or spent: Git Bash rewrites a
    # leading-slash argument into a Windows path, so `--path /x` can arrive as
    # "C:/Program Files/Git/x". Pass `--path x`, or set MSYS_NO_PATHCONV=1.
    if ":" in args.path or "\\" in args.path:
        raise SystemExit(f"--path looks like a shell-mangled Windows path: {args.path!r} — "
                         "pass it without the leading slash, or set MSYS_NO_PATHCONV=1")
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
    server = browser = connected = log = None
    playwright = None
    try:
        base = args.url
        if args.serve:
            from tests.browser_check import start_server
            database = root / "session.sqlite3"
            if database.exists():
                raise SystemExit(f"refusing to reuse an existing learner DB: {database}")
            server, base = start_server(database)
        from playwright.sync_api import sync_playwright
        playwright = sync_playwright().start()
        executable = playwright.chromium.executable_path
        # Git Bash rewrites are already rejected above; here a bare path just gains its slash.
        path = args.path.strip()
        if _port_open(args.port):
            import socket
            with socket.socket() as probe:
                probe.bind(("127.0.0.1", 0))
                args.port = probe.getsockname()[1]
        if path and not path.startswith("/"):
            path = "/" + path
        entry = (base + path) if path else base
        flags = [executable, f"--remote-debugging-port={args.port}",
                 f"--user-data-dir={root / 'profile'}", "--no-first-run", "--no-default-browser-check",
                 f"--window-size={args.viewport[0]},{args.viewport[1]}"]
        if args.headless:
            flags += ["--headless=new", "--disable-gpu-sandbox"]
            if args.software:
                flags += ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
            elif sys.platform == "win32":
                flags += ["--use-angle=d3d11"]
        log = (root / "browser.log").open("w", encoding="utf-8")
        browser = subprocess.Popen(flags + [entry], stdin=subprocess.DEVNULL,
                                   stdout=log, stderr=subprocess.STDOUT,
                                   creationflags=0x00000008 if sys.platform == "win32" else 0)
        deadline = time.monotonic() + args.timeout
        ready = False
        while time.monotonic() < deadline:
            if browser.poll() is not None:
                break
            try:
                import urllib.request
                with urllib.request.urlopen(f"http://127.0.0.1:{args.port}/json/version", timeout=2):
                    ready = True
                    break
            except Exception:
                time.sleep(0.5)
        if not ready:
            raise SystemExit(f"DevTools port {args.port} never answered within {args.timeout}s — "
                             f"see {root / 'browser.log'}")
        session = {"port": args.port, "pid": browser.pid, "root": str(root), "url": entry,
                   "server_pid": server.pid if server else None,
                   "db": str(root / "session.sqlite3") if server else None}
        # `--window-size` is not the viewport; verify the page box before accepting evidence.
        connected = playwright.chromium.connect_over_cdp(f"http://127.0.0.1:{args.port}",
                                                          timeout=10000)
        context = connected.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()
        page.set_default_timeout(10000)
        page.set_viewport_size({"width": args.viewport[0], "height": args.viewport[1]})
        session["viewport"] = page.evaluate("() => [innerWidth, innerHeight]")
        for _ in range(4):
            time.sleep(1.5)
            session["renderer"] = page.evaluate(RENDERER)
            if session["renderer"]:
                break
        if session["viewport"] != [args.viewport[0], args.viewport[1]]:
            raise SystemExit(f"page reports {session['viewport']}, asked for {args.viewport} — "
                             "evidence taken at this size would not be the size under review")
        session_file(root).write_text(json.dumps(session, indent=1), encoding="utf-8")
        record("started", session, owner=args.owner)
        print(json.dumps({"started": str(root), "cdp": args.port, "url": entry,
                          "viewport": session["viewport"], "renderer": session["renderer"]}))
    except BaseException:
        # A failed preflight must not leave a browser or disposable server burning resources.
        if browser is not None and browser.poll() is None:
            kill_tree(browser.pid)
            if browser.poll() is None:
                browser.terminate()
        if server is not None and server.poll() is None:
            server.terminate()
            server.wait(timeout=10)
        if server is not None:
            server.stdout.close()
        session_file(root).unlink(missing_ok=True)
        raise
    finally:
        if connected is not None:
            connected.close()
        if log is not None:
            log.close()
        if playwright is not None:
            playwright.stop()


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
    elif kind == "expect":
        if not page.evaluate(EXPECT, step["text"]):
            return {"ok": False,
                    "error": f"nothing a player can see contains {str(step['text'])[:80]!r}"}
        return {"ok": True}
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
        # CDP emulation belongs to the connection. Closing the start connection
        # restores Chromium's larger native page box, so every new step connection
        # must reapply and verify the requested viewport before an action or shot.
        if session.get("viewport"):
            width, height = session["viewport"]
            page.set_viewport_size({"width": width, "height": height})
            actual = page.evaluate("() => [innerWidth, innerHeight]")
            if actual != [width, height]:
                raise SystemExit(f"step page reports {actual}, session requires {[width, height]} — "
                                 "refusing evidence at the wrong viewport")
        for item in steps:
            unknown = set(item) - {"action"} - STEP_KEYS
            # A critic that guesses a key must learn the vocabulary in the same call: during
            # one cold pass six of twenty-one steps were spent rediscovering these names.
            # The hint belongs to a vocabulary failure only — appending it to a substantive
            # one buries the finding under a list of key names.
            hint = ""
            if item.get("action") not in ACTIONS:
                hint = f" expected one of {sorted(ACTIONS)}"
                result = {"ok": False, "error": f"unknown action {item.get('action')!r}"}
            elif unknown:
                hint = f" allowed keys for {item.get('action')}: {sorted(STEP_KEYS)}"
                result = {"ok": False, "error": f"{item['action']}: unknown key(s) {sorted(unknown)}"}
            else:
                try:
                    result = run_step(page, item, root)
                    if result.get("ok") and item["action"] == "resize":
                        wanted = [item["width"], item["height"]]
                        actual = page.evaluate("() => [innerWidth, innerHeight]")
                        if actual != wanted:
                            result = {"ok": False, "error": f"resize reports {actual}, asked for {wanted}"}
                        else:
                            session["viewport"] = wanted
                            session_file(root).write_text(json.dumps(session, indent=1), encoding="utf-8")
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
    parser.add_argument("--software", action="store_true",
                        help="force SwiftShader rasterisation instead of the GPU path (60fps here)")
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
