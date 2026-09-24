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

Step actions: goto reload resize wait settle key hold type click clicktext clickrole
drag shot dump buttons eval lsget. `settle` waits for actually-rendered frames,
because headless software WebGL can run several times slower than real time and a
millisecond-timed input window starves movement.
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

FRAMES = """() => { if (window.__psf) return window.__psf.n;
  window.__psf = {n: 0}; const tick = () => { window.__psf.n++; requestAnimationFrame(tick); };
  requestAnimationFrame(tick); return 0; }"""


def session_file(root):
    return Path(root) / "session.json"


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
    root.mkdir(parents=True, exist_ok=True)
    if session_file(root).exists():
        raise SystemExit(f"{root} already holds a session — run 'stop' first")
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
        try:
            import urllib.request
            with urllib.request.urlopen(f"http://127.0.0.1:{args.port}/json/version", timeout=2):
                ready = True
                break
        except Exception:
            time.sleep(0.5)
    if not ready:
        browser.terminate()
        raise SystemExit(f"DevTools port {args.port} never answered within {args.timeout}s — "
                         f"see {root / 'browser.log'}")
    session_file(root).write_text(json.dumps({
        "port": args.port, "pid": browser.pid, "root": str(root), "url": entry,
        "server_pid": server.pid if server else None,
        "db": str(root / "session.sqlite3") if server else None,
    }, indent=1), encoding="utf-8")
    print(json.dumps({"started": str(root), "cdp": args.port, "url": entry}))


def run_step(page, step):
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
                    result = run_step(page, item)
                except Exception as error:  # a critic must see the failure, not a stack trace
                    result = {"ok": False, "error": f"{type(error).__name__}: {str(error)[:300]}"}
            if not result.get("ok"):
                result["error"] += hint
            trace(args.root, {"ts": time.strftime("%Y-%m-%dT%H:%M:%S"), "step": item, "result": {
                k: v for k, v in result.items() if k in {"ok", "error", "shot"}}})
            results.append(result)
    print(json.dumps(results, ensure_ascii=False, indent=1))
    return 0 if all(r.get("ok") for r in results) else 1


def stop(args):
    session = load(args.root)
    for pid in (session.get("pid"), session.get("server_pid")):
        if not pid:
            continue
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True) \
            if sys.platform == "win32" else subprocess.run(["kill", str(pid)], capture_output=True)
    session_file(args.root).unlink(missing_ok=True)
    print(json.dumps({"stopped": str(args.root), "trace": str(Path(args.root) / "action-trace.jsonl")}))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("command", choices=["start", "step", "stop"])
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
    args = parser.parse_args(argv)
    if args.command == "start":
        return start(args)
    if args.command == "step":
        if not (args.file or args.steps):
            raise SystemExit("step needs --file or --steps")
        return step(args)
    stop(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
