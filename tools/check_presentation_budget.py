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
}

MEASURE = """(args) => {
  const {focalExpr, budgets} = args;
  const vw = innerWidth, vh = innerHeight;
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
    if (el.className && String(el.className).includes('sr-only')) return false;
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
  // independent of pointer-events).
  const cols = 96, rows = 54;
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
  // B3 containment + B4 text blocks + P3 disabled controls.
  const clipped = [], longBlocks = [], disabledVisible = [];
  for (const el of uiElements) {
    const r = el.getBoundingClientRect();
    if (r.bottom > vh + budgets.clip_tolerance_px || r.top < -budgets.clip_tolerance_px
        || r.right > vw + budgets.clip_tolerance_px || r.left < -budgets.clip_tolerance_px) {
      if (!el.closest('dialog')) clipped.push(el.tagName + (el.id ? '#' + el.id : '') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
    const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (ownText && !el.closest('dialog') && !el.closest('.masthead')) {
      const words = el.textContent.trim().split(/\\s+/).length;
      if (words > budgets.words_max) longBlocks.push({tag: el.tagName + (el.id ? '#' + el.id : '.' + String(el.className || '').split(' ')[0]), words});
    }
    if (el.tagName === 'BUTTON' && el.disabled) disabledVisible.push(el.textContent.trim().slice(0, 40));
  }
  // B2 focal clearance: 3x3 ring around the projected focal point.
  let focal = null;
  return Promise.resolve(focalExpr ? eval(focalExpr)() : null).then(async (point) => {
    if (point && point.visible) {
      const hits = [];
      for (const [dx, dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]) {
        const x = point.x + dx * budgets.focal_margin_px * 2, y = point.y + dy * budgets.focal_margin_px * 2;
        if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
        const el = document.elementFromPoint(x, y);
        if (el && !isWorld(el) && visible(el)) hits.push(el.tagName + (el.id ? '#' + el.id : ''));
      }
      focal = {point, covered: hits};
    } else if (point) focal = {point, covered: null};
    return {coverage, panelOpen, clipped, longBlocks, disabledVisible, focal};
  });
}"""


def evaluate_state(page, scenario_state, budgets):
    focal_expr = None
    if scenario_state.get("focal"):
        entity = json.dumps(scenario_state["focal"])
        focal_expr = (
            "async()=>{const{getGameRuntime}=await import('/game-runtime.js');"
            f"const p=getGameRuntime().world.projectEntity({entity});"
            "if(!p)return null;const r=document.querySelector('canvas').getBoundingClientRect();"
            "return {x:p.x+r.left,y:p.y+r.top,inFront:p.inFront,visible:p.visible};}"
        )
    return page.evaluate(MEASURE, {"focalExpr": focal_expr, "budgets": budgets})


def violations(state_name, metrics, budgets, panel_allowed):
    found = []
    limit = budgets["panel_coverage_max"] if metrics["panelOpen"] else budgets["coverage_max"]
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
    return found


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
                for click in state.get("clicks", []):
                    page.get_by_role("button", name=click, exact=True).first.click()
                if state.get("wait_text"):
                    page.get_by_text(state["wait_text"]).first.wait_for(state="visible")
                page.wait_for_timeout(350)
                metrics = evaluate_state(page, state, budgets)
                states.append({"name": state["name"], **metrics})
                all_violations.extend(violations(state["name"], metrics, budgets, False))
                print(f"{state['name']}: coverage={metrics['coverage']:.1%} clipped={len(metrics['clipped'])} "
                      f"long={len(metrics['longBlocks'])} disabled={len(metrics['disabledVisible'])} "
                      f"focal={'n/a' if not metrics['focal'] else len(metrics['focal']['covered'] or [])}")
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
