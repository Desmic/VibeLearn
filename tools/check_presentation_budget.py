"""Measure screen-space UI budgets in a running game (docs/GAME-PRESENTATION-GUIDE.md).

Scenario-driven and game-agnostic: a JSON scenario lists play states (navigation,
clicks by accessible name, focal world entity). The tool measures real rendered
pages, never source. Exit code 1 when a budget is violated.

Usage:
  python -m tools.check_presentation_budget --scenario tests/fixtures/presentation-budget-first-words.json --out artifacts/presentation-budget.json
"""
import argparse
import json
import sys
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

BUDGETS = {
    "coverage_max": 0.15,          # B1: screen-space UI share of viewport
    "panel_coverage_max": 0.22,    # B1 in a player-opened focused panel
    "clip_tolerance_px": 2,        # B3: containment
    "words_max": 24,               # B4/P2: per visible text block
    "focal_margin_px": 24,         # B2: focal clearance ring
    "disabled_visible_max": 0,     # P3: no visible non-actionable controls
    "presence_min_share": 0.12,    # B6: story subject screen presence
    "marker_overlap_px": 4,        # B7: anchored labels must not pile up
    "subject_cover_max": 0.08,     # B7: marker share of the subject's screen box
}

MEASURE = """async (args) => {
  const {budgets} = args;
  const vw = innerWidth, vh = innerHeight;
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
    for (let n = el; n; n = n.parentElement) if (n.className && String(n.className).includes('sr-only')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const isWorld = (el) => {
    let n = el;
    while (n) { if (n.tagName === 'CANVAS') return true; n = n.parentElement; }
    return false;
  };
  const uiElements = [];
  const canvasEl = document.querySelector('canvas');
  for (const el of document.querySelectorAll('body *:not(canvas):not(canvas *)')) {
    if (!visible(el) || isWorld(el) || el.closest('dialog:not([open])')) continue;
    if (canvasEl && canvasEl !== el && el.contains(canvasEl)) continue; // page shell behind the world
    const cs = getComputedStyle(el);
    const painted = el.tagName === 'BUTTON' || el.tagName === 'IMG' || el.tagName === 'SVG'
      || (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent')
      || (cs.backgroundImage && cs.backgroundImage !== 'none')
      || [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (painted) uiElements.push(el);
  }
  // B1 coverage: union of painted UI rects rasterized on a grid (no double count,
  // independent of pointer-events). A finer grid reduces per-rect round-up bias.
  const cols = 160, rows = 90;
  const grid = new Uint8Array(cols * rows);
  for (const el of uiElements) {
    const r = el.getBoundingClientRect();
    const c0 = Math.max(0, Math.floor(r.left / vw * cols)), c1 = Math.min(cols - 1, Math.ceil(r.right / vw * cols) - 1);
    const r0 = Math.max(0, Math.floor(r.top / vh * rows)), r1 = Math.min(rows - 1, Math.ceil(r.bottom / vh * rows) - 1);
    for (let c = c0; c <= c1; c++) for (let r2 = r0; r2 <= r1; r2++) grid[c * rows + r2] = 1;
  }
  let ui = 0;
  for (const v of grid) ui += v;
  const coverage = ui / (cols * rows);
  let panelOpen = false;
  document.querySelectorAll('dialog[open]').forEach(d => { if (visible(d)) panelOpen = true; });
  // B3 containment + B4 text blocks + P3 disabled controls + top offenders.
  const clipped = [], longBlocks = [], disabledVisible = [], offenders = [];
  const label = (el) => el.tagName + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  // B3 containment is per scroll surface: content deliberately scrolled outside
  // its own opt-in panel is contained by the panel, not clipped by the viewport.
  const scrollClipped = (el) => {
    const r = el.getBoundingClientRect();
    for (let n = el.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowY !== 'visible' || cs.overflowX !== 'visible') {
        const a = n.getBoundingClientRect();
        if (r.top < a.top - budgets.clip_tolerance_px || r.bottom > a.bottom + budgets.clip_tolerance_px
          || r.left < a.left - budgets.clip_tolerance_px || r.right > a.right + budgets.clip_tolerance_px) return true;
      }
    }
    return false;
  };
  for (const el of uiElements) {
    const r = el.getBoundingClientRect();
    offenders.push({el: label(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height), area: Math.round(Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)))});
    if ((r.bottom > vh + budgets.clip_tolerance_px || r.top < -budgets.clip_tolerance_px
        || r.right > vw + budgets.clip_tolerance_px || r.left < -budgets.clip_tolerance_px)
        && !scrollClipped(el)) {
      if (!el.closest('dialog') && !el.classList.contains('skip')) clipped.push(label(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (ownText && !el.closest('dialog') && !el.closest('.masthead')) {
      const words = el.textContent.trim().split(/\\s+/).length;
      if (words > budgets.words_max) longBlocks.push({tag: label(el), words});
    }
    if (el.tagName === 'BUTTON' && el.disabled) disabledVisible.push(el.textContent.trim().slice(0, 40));
  }
  offenders.sort((a, b) => b.area - a.area);
  // B2 focal clearance: 3x3 ring around the projected focal point.
  // Plain data in, dynamic import inside the injected function: the page CSP
  // forbids eval(), so expression-string injection is not an option.
  let focal = null;
  let presence = null;
  let subjectCover = null;
  if (args.focal || args.presence || args.subject) {
    const {getGameRuntime} = await import('/game-runtime.js');
    const w = getGameRuntime().world;
    const r = document.querySelector('canvas').getBoundingClientRect();
    if (args.focal && w?.projectEntity) {
      const p = w.projectEntity(args.focal);
      if (p) {
        const point = {x: p.x + r.left, y: p.y + r.top, inFront: p.inFront, visible: p.visible};
        if (point.visible) {
          const hits = [];
          for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
            const x = point.x + dx * budgets.focal_margin_px * 2, y = point.y + dy * budgets.focal_margin_px * 2;
            if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
            const el = document.elementFromPoint(x, y);
            if (el && !isWorld(el) && visible(el)) hits.push(el.tagName + (el.id ? '#' + el.id : ''));
          }
          focal = {point, covered: hits};
        } else focal = {point, covered: null};
      }
    }
    if (args.presence && w?.projectEntity) {
      const base = w.projectEntity(args.presence.entity);
      const top = w.projectEntity(args.presence.entity, [0, args.presence.height, 0]);
      if (base && top) presence = {share: Math.abs(top.y - base.y) / r.height, visible: base.visible && top.visible};
    }
    // B7 subject occlusion: projected body box of the scene's subject entity;
    // anchored labels must not cover it (review 210a663: markers buried the
    // receiver, the emotional subject of the payoff beat).
    if (args.subject && w?.projectEntity) {
      const s = args.subject;
      const proj = o => w.projectEntity(s.entity, o);
      const pts = [proj(s.top || [0, 1, 0]), proj(s.bottom || [0, -1, 0]), proj(s.left || [-0.9, 0, 0]), proj(s.right || [0.9, 0, 0])];
      if (pts.every(p => p && p.inFront)) {
        const [t, b, l, rt] = pts;
        const box = {left: Math.min(l.x, rt.x) + r.left, top: Math.min(t.y, b.y) + r.top,
                     right: Math.max(l.x, rt.x) + r.left, bottom: Math.max(t.y, b.y) + r.top};
        const boxArea = (box.right - box.left) * (box.bottom - box.top);
        const covers = [];
        for (const el of document.querySelectorAll(s.markers || '#markers [data-anchor]')) {
          if (el.closest('[aria-hidden="true"]') || !visible(el)) continue;
          const q = el.getBoundingClientRect();
          const area = Math.max(0, Math.min(q.right, box.right) - Math.max(q.left, box.left))
            * Math.max(0, Math.min(q.bottom, box.bottom) - Math.max(q.top, box.top));
          if (boxArea > 0 && area / boxArea > budgets.subject_cover_max) {
            covers.push((el.id ? '#' + el.id : el.textContent.trim().slice(0, 24)) + ' ' + Math.round(area / boxArea * 100) + '%');
          }
        }
        subjectCover = {box, covers};
      }
    }
  }
  // B7 marker pile-up: visible anchored labels must not overlap each other;
  // decorative aria-hidden world glyphs are excluded.
  const markerClash = [];
  if (args.markers) {
    const rects = [...document.querySelectorAll(args.markers)]
      .filter(el => !el.closest('[aria-hidden="true"]') && visible(el))
      .map(el => ({name: (el.id ? '#' + el.id : el.tagName.toLowerCase()) + ' “' + el.textContent.trim().slice(0, 18) + '”', r: el.getBoundingClientRect()}));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i].r, b = rects[j].r;
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > budgets.marker_overlap_px
        && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > budgets.marker_overlap_px) {
        markerClash.push(rects[i].name + ' ∩ ' + rects[j].name);
      }
    }
  }
  return {coverage, panelOpen, clipped, longBlocks, disabledVisible, focal, presence, subjectCover, markerClash, offenders: offenders.slice(0, 12)};
}"""


def evaluate_state(page, scenario_state, budgets):
    return page.evaluate(MEASURE, {
        "focal": scenario_state.get("focal"),
        "presence": scenario_state.get("presence"),
        "subject": scenario_state.get("subject"),
        "markers": scenario_state.get("markers"),
        "budgets": budgets,
    })


def violations(state_name, metrics, budgets, panel_allowed):
    found = []
    # panel_allowed: the scenario state declares an explicitly player-opened
    # focused panel (guide B1: opt-in panels get the raised budget). An open
    # <dialog> is detected automatically; anchored opt-in cards are not.
    limit = budgets["panel_coverage_max"] if (metrics["panelOpen"] or panel_allowed) else budgets["coverage_max"]
    if metrics["coverage"] > limit:
        found.append(f"{state_name}: B1 coverage {metrics['coverage']:.1%} > {limit:.0%}")
    if metrics["clipped"]:
        found.append(f"{state_name}: B3 clipped elements: {metrics['clipped'][:4]}")
    if metrics["longBlocks"]:
        found.append(f"{state_name}: B4 text blocks over {budgets['words_max']} words: {metrics['longBlocks'][:4]}")
    if metrics["disabledVisible"]:
        found.append(f"{state_name}: P3 visible non-actionable controls: {metrics['disabledVisible'][:4]}")
    focal = metrics.get("focal")
    if focal and focal.get("covered"):
        found.append(f"{state_name}: B2 focal entity covered by {focal['covered'][:4]}")
    presence = metrics.get("presence")
    if presence and presence["share"] < budgets["presence_min_share"]:
        found.append(f"{state_name}: B6 subject presence {presence['share']:.1%} < {budgets['presence_min_share']:.0%}")
    if metrics.get("markerClash"):
        found.append(f"{state_name}: B7 world markers overlap: {metrics['markerClash'][:4]}")
    cover = metrics.get("subjectCover")
    if cover and cover["covers"]:
        found.append(f"{state_name}: B7 markers cover the scene subject: {cover['covers'][:4]}")
    return found


def wait_for_eval(page, expression, timeout_ms):
    # CSP (script-src 'self') blocks wait_for_function; poll via evaluate
    # like the browser tests' until() helper.
    deadline = time.monotonic() + timeout_ms / 1000
    while not page.evaluate(expression):
        if time.monotonic() > deadline:
            raise TimeoutError(f"wait_eval timed out: {expression}")
        page.wait_for_timeout(120)


def wait_for_text(page, text, timeout_ms):
    # Any visible element may carry the line: opt-in presentation duplicates text
    # on hidden surfaces, so ".first" would lock onto an invisible copy.
    matches = page.get_by_text(text).locator('visible=true')
    deadline = time.monotonic() + timeout_ms / 1000
    while matches.count() == 0:
        if time.monotonic() > deadline:
            raise TimeoutError(f"wait_text timed out with no visible match: {text}")
        page.wait_for_timeout(120)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=ROOT / "artifacts/presentation-budget.json")
    parser.add_argument("--url", help="Base URL of a running server; starts a disposable one when omitted")
    parser.add_argument("--report-only", action="store_true", help="Always exit 0; still write the report")
    args = parser.parse_args()
    scenario = json.loads(args.scenario.read_text(encoding="utf-8"))
    budgets = {**BUDGETS, **scenario.get("budgets", {})}
    states, all_violations = [], []
    from tests.browser_check import start_server, stop_server

    proc = None
    with tempfile.TemporaryDirectory() as temp, sync_playwright() as playwright:
        try:
            if args.url:
                base = args.url
            else:
                proc, base = start_server(Path(temp) / "budget.sqlite3")
            browser = playwright.chromium.launch()
            context = browser.new_context(viewport={"width": 1280, "height": 720})
            page = context.new_page()
            page.set_default_timeout(20000)
            for state in scenario["states"]:
                if state.get("viewport"):
                    context.close()
                    context = browser.new_context(viewport={"width": state["viewport"][0], "height": state["viewport"][1]})
                    page = context.new_page()
                    page.set_default_timeout(20000)
                if state.get("goto"):
                    page.goto(base + scenario.get("path", "/"))
                # "steps" plays an interleaved click/wait chain so a scenario can
                # reach deep play states, not just the first screen of a chunk.
                for step in state.get("steps", []):
                    if "click" in step:
                        page.get_by_role("button", name=step["click"], exact=True).first.click(timeout=step.get("timeout", 30000))
                    elif "wait_text" in step:
                        wait_for_text(page, step["wait_text"], step.get("timeout", 30000))
                    elif "wait_eval" in step:
                        wait_for_eval(page, step["wait_eval"], step.get("timeout", 45000))
                for click in state.get("clicks", []):
                    page.get_by_role("button", name=click, exact=True).first.click()
                if state.get("wait_eval"):
                    wait_for_eval(page, state["wait_eval"], 30000)
                if state.get("wait_text"):
                    wait_for_text(page, state["wait_text"], 20000)
                page.wait_for_timeout(350)
                metrics = evaluate_state(page, state, budgets)
                if state.get("screenshot"):
                    # Reusable evidence: the exact measured play state as a capture.
                    shot = ROOT / state["screenshot"]
                    shot.parent.mkdir(parents=True, exist_ok=True)
                    page.screenshot(path=str(shot))
                state_budgets = dict(budgets)
                if state.get("coverage_max"):
                    # Touch viewports may raise B1 for direct-input affordances only
                    # (guide B1 note); the raised limit must be justified in the scenario.
                    state_budgets["coverage_max"] = state["coverage_max"]
                states.append({"name": state["name"], "budget_coverage_max": state_budgets["coverage_max"], **metrics})
                all_violations.extend(violations(state["name"], metrics, state_budgets, bool(state.get("panel_open"))))
                print(f"{state['name']}: coverage={metrics['coverage']:.1%} clipped={len(metrics['clipped'])} "
                      f"long={len(metrics['longBlocks'])} disabled={len(metrics['disabledVisible'])} "
                      f"focal={'n/a' if not metrics['focal'] else len(metrics['focal']['covered'] or [])} "
                      f"presence={'n/a' if not metrics['presence'] else format(metrics['presence']['share'], '.1%')} "
                      f"markerClash={len(metrics['markerClash'])} "
                      f"subjectCover={'n/a' if not metrics['subjectCover'] else len(metrics['subjectCover']['covers'])}")
            browser.close()
        finally:
            if proc:
                stop_server(proc)
    report = {
        "tool": "check_presentation_budget",
        "scenario": str(args.scenario.relative_to(ROOT)) if args.scenario.is_relative_to(ROOT) else str(args.scenario),
        "budgets": budgets,
        "states": states,
        "violations": all_violations,
        "result": "passed" if not all_violations else "violated",
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps({"result": report["result"], "violations": all_violations}, indent=2))
    return 0 if not all_violations or args.report_only else 1


if __name__ == "__main__":
    raise SystemExit(main())
