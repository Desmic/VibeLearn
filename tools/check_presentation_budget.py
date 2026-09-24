"""Measure screen-space UI budgets in a running game (docs/GAME-PRESENTATION-GUIDE.md).

Scenario-driven and game-agnostic: a JSON scenario lists play states (navigation,
clicks by accessible name, focal world entity). The tool measures real rendered
pages, never source. Exit code 1 when a budget is violated.

Usage:
  python -m tools.check_presentation_budget --scenario tests/fixtures/presentation-budget-first-words.json --out artifacts/presentation-budget.json
"""
import argparse
import json
import re
import subprocess
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
    "narrow_viewport_px": 700,     # B1 narrow-sheet clause: phone layout boundary
    "narrow_sheet_max": 0.45,      # B1: player-opened bottom sheet on a narrow viewport
    "narrow_sheet_height_max": 0.40,  # B1: sheet height as a share of screen height
    "sheet_anchor_gap_px": 8,      # B1: how flush a bottom sheet must sit
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
  // B3 reachability: the scroll exemption above is for *content* the player chose
  // to read (a dialog, a reference list). A decision option in a play state is
  // different: a painted choice the player cannot see is not a choice they can
  // make. So an option is unreachable when it sits outside the viewport *or*
  // outside the client box of its own scrolling container (the 23 September phone
  // sheet: a 32dvh card whose third route notice was scrolled out of itself and
  // "passed" B3 because the container technically contained it). Off-screen world
  // markers are the placement system's own parking, not a lost choice, so the
  // declared marker layer and the .skip a11y link are exempt.
  const unreachableActions = [];
  // I10: a surface whose every declared rung is already hidden and still cannot fit its
  // decision is an authored-text problem, not a layout one, and the report has to say
  // which. Without this the numbers read "shedding did not work" and a worker goes and
  // raises a ceiling - the one response the guide forbids.
  const ladderExhausted = (el) => {
    for (let n = el.parentElement; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.overflowY !== 'visible') {
        // A critical rung is instruction the fitter must not hide, so it cannot count as
        // "shedding ran out of things to shed" - it is the reason shedding ran out.
        const rungs = [...n.querySelectorAll('[data-shed-item]')]
          .filter(r => r.dataset.critical !== 'true');
        return rungs.length > 0 && rungs.every(r => r.classList.contains('shed'))
          && n.scrollHeight > n.clientHeight + 1;
      }
    }
    return false;
  };
  for (const el of document.querySelectorAll('button, [role="button"], a[href]')) {
    if (!visible(el) || !el.textContent.trim()) continue;
    if (el.closest('dialog') || el.classList.contains('skip')) continue;
    if (args.markers && el.closest(args.markers)) continue;
    const r = el.getBoundingClientRect();
    const outside = r.bottom > vh + budgets.clip_tolerance_px || r.top < -budgets.clip_tolerance_px
      || r.right > vw + budgets.clip_tolerance_px || r.left < -budgets.clip_tolerance_px;
    const hiddenByContainer = scrollClipped(el);
    if (outside || hiddenByContainer) {
      const ladder = hiddenByContainer && ladderExhausted(el)
        ? ' [I10 shed ladder exhausted: every sheddable rung on this surface is already hidden'
          + ' and it still overflows, so unranked content, an unshedable [data-critical] line or'
          + ' the authored text is eating the space - shorten it, the ceiling does not move]' : '';
      unreachableActions.push(((el.id ? '#' + el.id : el.tagName.toLowerCase()) + ' “' + el.textContent.trim().slice(0, 32) + '” '
        + Math.round(r.top) + '..' + Math.round(r.bottom) + '/' + vh) + (hiddenByContainer ? ' (scrolled out of its own panel)' : '') + ladder);
    }
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
  // B8 control surface (interaction model, guide I6): in a cinematic/story state the
  // only permitted painted controls are the corner system cluster and diegetic world
  // markers. Any other painted button/link is a stray menu-style control (the 22 Sep
  // "Take control / ← Back" bottom-bar defect class). Geometry-only budgets passed it.
  const strayControls = [];
  if (args.b8 && args.b8.enabled) {
    // The site-wide skip-to-content link (.skip) is a WCAG keyboard escape hatch
    // parked off-screen until focus — an accessibility affordance the guide permits
    // on every page, not a painted game control, so it is allow-listed here (as B3
    // already exempts it from clipping).
    const allow = args.b8.allow || ['.rgi-corner', '.rgi-markers', '#markers', '.skip'];
    for (const el of document.querySelectorAll('button, [role="button"], a[href]')) {
      if (!visible(el)) continue;
      if (allow.some(sel => el.closest(sel))) continue;
      strayControls.push((el.id ? '#' + el.id : el.tagName.toLowerCase()) + ' “' + el.textContent.trim().slice(0, 28) + '”');
    }
  }
  // I1/I3 double-carrier (guide B8 gameplay clause): a world verb may have only
  // one live surface at a time. If the same action value is painted BOTH on a
  // world marker (inside the declared marker layer) AND on a DOM control outside
  // it, a panel about the machine competes with the machine itself — the exact
  // obstructing-tutorial-card defect. This is measured in EVERY state that names
  // a marker layer, not only cinematics, because the failure lives in play.
  const dupCarriers = [];
  if (args.markers) {
    const worldActions = new Set();
    for (const el of document.querySelectorAll(args.markers)) {
      const a = el.getAttribute && el.getAttribute('data-action');
      if (a && visible(el)) worldActions.add(a);
    }
    for (const el of document.querySelectorAll('[data-action]')) {
      const a = el.getAttribute('data-action');
      if (!a || !visible(el)) continue;
      if (el.closest(args.markers)) continue;
      if (worldActions.has(a)) dupCarriers.push((el.id ? '#' + el.id : el.tagName.toLowerCase()) + ' action="' + a + '"');
    }
  }
  // B1 narrow-sheet clause (guide I8): on a narrow viewport a readable multi-option
  // decision cannot fit the desktop area budget, so the allowance is bought with
  // geometry instead: the surface must be a flush bottom sheet that yielded the
  // direct-input chrome it replaces, not a card floating over the scene.
  let sheet = null;
  if (args.sheet) {
    const el = document.querySelector(args.sheet);
    if (el && visible(el)) {
      const r = el.getBoundingClientRect();
      const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
      const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      sheet = {viewportWidth: vw, viewportHeight: vh, width: r.width, height: r.height,
        left: r.left, rightGap: vw - r.right, bottomGap: vh - r.bottom, share: (w * h) / (vw * vh),
        yielded: (args.yields || []).filter(sel => [...document.querySelectorAll(sel)].some(n => visible(n)))};
    }
  }
  // I9 carrier floor: every other budget here polices *over*-delivery; this one polices
  // the opposite failure. A beat's decision rides its world carriers, so a declared
  // carrier group that has vanished from the screen leaves the player nothing to read —
  // invisible to coverage, clipping and overlap checks, and exactly what a shrunken
  // viewport can cause by hiding labels that no longer fit.
  const carriers = [];
  for (const group of (args.carriers || [])) {
    const nodes = [...document.querySelectorAll(group.selector)].filter(el => visible(el));
    carriers.push({selector: group.selector, min: group.min, visible: nodes.length,
      names: nodes.slice(0, 6).map(el => ((el.getAttribute('aria-label') || el.textContent) || '').trim().slice(0, 30))});
  }
  return {coverage, panelOpen, clipped, longBlocks, disabledVisible, focal, presence, subjectCover, markerClash, strayControls, dupCarriers, unreachableActions, sheet, carriers, offenders: offenders.slice(0, 12)};
}"""

# Accessibility viewport (WCAG 1.4.4): a state may declare text_scale so the same beat
# is measured at the text size a low-vision player uses. Runs as its own step, before
# measurement, so the game's own layout pass re-places world markers at that size
# instead of being measured around a style the player would never see. Text-bearing
# nodes are stamped and restored, so scaled and unscaled states share one walk.
TEXT_SCALE = """(factor) => {
  const nodes = [...document.querySelectorAll('button,p,h1,h2,h3,span,small,a,label,li,blockquote')]
    .filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  for (const el of nodes) {
    if (el.dataset.budgetBase === undefined) {
      el.dataset.budgetBase = getComputedStyle(el).fontSize;
      el.dataset.budgetInline = el.style.fontSize;
    }
    el.style.fontSize = factor === 1 ? el.dataset.budgetInline
      : (parseFloat(el.dataset.budgetBase) * factor) + 'px';
  }
  return nodes.length;
}"""

# An allowance for a sheet belongs to a visible opening caused by this page's
# player click. A remembered button name from another navigation (or a sheet that
# closed and later opened itself) is not evidence of consent.
SHEET_VISIBLE = """(selector) => {
  const el = document.querySelector(selector);
  if (!el || !el.isConnected || el.hidden) return false;
  const style = getComputedStyle(el), rect = el.getBoundingClientRect();
  return style.display !== 'none' && style.visibility !== 'hidden'
    && Number(style.opacity) > .05 && rect.width > 1 && rect.height > 1;
}"""
SHEET_WITNESS = """({selector, name}) => {
  const el = document.querySelector(selector);
  if (!el) return false;
  const entries = window.__presentationOptIn ||= {};
  entries[selector]?.observer?.disconnect();
  const entry = {name, el, valid: true};
  entry.observer = new MutationObserver(() => {
    if (!el.isConnected || el.hidden || getComputedStyle(el).display === 'none'
      || getComputedStyle(el).visibility === 'hidden') entry.valid = false;
  });
  entry.observer.observe(el, {attributes: true, attributeFilter: ['hidden', 'class', 'style', 'aria-hidden']});
  entries[selector] = entry;
  return true;
}"""
SHEET_WITNESS_VALID = """({selector, name}) => {
  const entry = window.__presentationOptIn?.[selector];
  const el = document.querySelector(selector);
  return Boolean(entry?.valid && entry.name === name && entry.el === el && el?.isConnected
    && !el.hidden && getComputedStyle(el).display !== 'none'
    && getComputedStyle(el).visibility !== 'hidden');
}"""


def click_scenario_button(page, name, opt_in_targets, timeout=30000):
    """Click through the UI, recording only a newly opened declared sheet."""
    targets = opt_in_targets.get(name, ())
    before = {selector: page.evaluate(SHEET_VISIBLE, selector) for selector in targets}
    page.get_by_role("button", name=name, exact=True).first.click(timeout=timeout)
    for selector in targets:
        if not before[selector] and page.evaluate(SHEET_VISIBLE, selector):
            page.evaluate(SHEET_WITNESS, {"selector": selector, "name": name})


def witnessed_sheet_open(page, state):
    if not state.get("opened_by") or not state.get("sheet"):
        return False
    return page.evaluate(SHEET_WITNESS_VALID, {"selector": state["sheet"], "name": state["opened_by"]})


def apply_text_scale(page, scenario_state, previous_scale=1):
    """Apply a state's declared text_scale; return the scale now on the page."""
    scale = scenario_state.get("text_scale", 1)
    page.evaluate(TEXT_SCALE, scale)
    if scale != previous_scale:
        # The game re-places world markers on its own frames, so a changed text size
        # must settle before the numbers describe what a player is shown.
        page.wait_for_timeout(1200)
    return scale


def evaluate_state(page, scenario_state, budgets):
    b8 = {"enabled": bool(scenario_state.get("cinematic"))}
    if scenario_state.get("control_allow"):
        b8["allow"] = scenario_state["control_allow"]
    return page.evaluate(MEASURE, {
        "focal": scenario_state.get("focal"),
        "presence": scenario_state.get("presence"),
        "subject": scenario_state.get("subject"),
        "markers": scenario_state.get("markers"),
        "sheet": scenario_state.get("sheet"),
        "yields": scenario_state.get("yields"),
        "carriers": scenario_state.get("carriers", []),
        "b8": b8,
        "budgets": budgets,
    })


def violations(state_name, metrics, budgets, panel_allowed, scenario_state=None, player_opened=False):
    scenario_state = scenario_state or {}
    found = []
    # panel_allowed: the scenario state declares an explicitly player-opened
    # focused panel (guide B1: opt-in panels get the raised budget). An open
    # <dialog> is detected automatically; anchored opt-in cards are not.
    sheet = metrics.get("sheet")
    declared_sheet = bool(scenario_state.get("narrow_sheet"))
    if declared_sheet:
        # The narrow-sheet allowance is bought with geometry and opt-in proof, so the
        # claim is verified before the raised ceiling is ever applied (guide I8).
        if not sheet:
            found.append(f"{state_name}: B1 narrow_sheet declared but '{scenario_state.get('sheet')}' is not "
                         "painted — the sheet must be the measured surface")
        else:
            if sheet["viewportWidth"] >= budgets["narrow_viewport_px"]:
                found.append(f"{state_name}: B1 narrow_sheet claimed at {sheet['viewportWidth']}px wide — the "
                             f"clause is for viewports under {budgets['narrow_viewport_px']}px")
            if sheet["bottomGap"] > budgets["sheet_anchor_gap_px"]:
                found.append(f"{state_name}: B1 narrow_sheet floats {sheet['bottomGap']:.0f}px above the bottom "
                             "edge — a sheet sits flush instead of covering the scene (guide I8)")
            if sheet["left"] > budgets["sheet_anchor_gap_px"] or sheet["rightGap"] > budgets["sheet_anchor_gap_px"]:
                found.append(f"{state_name}: B1 narrow_sheet is not full-bleed (left {sheet['left']:.0f}px, "
                             f"right gap {sheet['rightGap']:.0f}px)")
            if sheet["yielded"]:
                found.append(f"{state_name}: B1 narrow_sheet still paints the direct-input chrome it replaces: "
                             f"{sheet['yielded'][:3]}")
            height_max = budgets["narrow_sheet_height_max"] * sheet["viewportHeight"]
            if sheet["height"] > height_max:
                found.append(f"{state_name}: B1 narrow_sheet is {sheet['height']:.0f}px tall on a "
                             f"{sheet['viewportHeight']:.0f}px viewport — a sheet takes at most "
                             f"{budgets['narrow_sheet_height_max']:.0%} of the screen height (guide I8)")
        if not scenario_state.get("opened_by"):
            found.append(f"{state_name}: B1 narrow_sheet names no 'opened_by' — the scenario must state which "
                         "opt-in control the player clicked")
        elif not player_opened:
            found.append(f"{state_name}: B1 narrow_sheet claims a player-opened sheet, but no step clicked "
                         f"'{scenario_state['opened_by']}' — an auto-summoned card may not buy the raised "
                         "budget (guide I8)")
    limit = (budgets["narrow_sheet_max"] if declared_sheet
             else budgets["panel_coverage_max"] if (metrics["panelOpen"] or panel_allowed)
             else budgets["coverage_max"])
    if metrics["coverage"] > limit:
        hint = "" if (declared_sheet or not (panel_allowed and sheet)) else (
            " — on a narrow viewport an opened surface must be a flush bottom sheet that yielded its touch "
            "chrome (guide B1 narrow-sheet clause, I8)")
        found.append(f"{state_name}: B1 coverage {metrics['coverage']:.1%} > {limit:.0%}{hint}")
    if metrics["clipped"]:
        found.append(f"{state_name}: B3 clipped elements: {metrics['clipped'][:4]}")
    if metrics.get("unreachableActions"):
        found.append(f"{state_name}: B3 unreachable action — a painted choice needs scrolling to reach "
                     f"(guide: a decision must be visible at the moment of deciding): {metrics['unreachableActions'][:4]}")
    if metrics["longBlocks"]:
        found.append(f"{state_name}: B4 text blocks over {budgets['words_max']} words: {metrics['longBlocks'][:4]}")
    if metrics["disabledVisible"]:
        found.append(f"{state_name}: P3 visible non-actionable controls: {metrics['disabledVisible'][:4]}")
    focal = metrics.get("focal")
    if scenario_state.get("focal") and (not focal or not focal.get("point", {}).get("visible")):
        found.append(f"{state_name}: B2 focal entity could not be measured visibly")
    elif focal and focal.get("covered"):
        found.append(f"{state_name}: B2 focal entity covered by {focal['covered'][:4]}")
    presence = metrics.get("presence")
    if scenario_state.get("presence") and (not presence or not presence.get("visible")):
        found.append(f"{state_name}: B6 story subject could not be measured visibly")
    elif presence and presence["share"] < budgets["presence_min_share"]:
        found.append(f"{state_name}: B6 subject presence {presence['share']:.1%} < {budgets['presence_min_share']:.0%}")
    if metrics.get("markerClash"):
        found.append(f"{state_name}: B7 world markers overlap: {metrics['markerClash'][:4]}")
    if metrics.get("dupCarriers"):
        found.append(f"{state_name}: B8/I1 world verb on two live surfaces (marker + DOM control): {metrics['dupCarriers'][:4]}")
    cover = metrics.get("subjectCover")
    if scenario_state.get("subject") and not cover:
        found.append(f"{state_name}: B7 subject clearance could not be measured")
    elif cover and cover["covers"]:
        found.append(f"{state_name}: B7 markers cover the scene subject: {cover['covers'][:4]}")
    if scenario_state.get("cinematic"):
        stray = metrics.get("strayControls") or []
        # I6 accessibility carve-out: reduced-motion play may paint exactly one
        # explicit advance control (no auto-advance); motion-allowed play, zero.
        max_stray = 1 if scenario_state.get("reduced_motion") else 0
        if len(stray) > max_stray:
            found.append(f"{state_name}: B8 non-diegetic control in cinematic frame (guide I6): {stray[:4]}")
    for group in metrics.get("carriers") or []:
        if group["visible"] < group["min"]:
            found.append(f"{state_name}: I9 carrier floor — '{group['selector']}' paints {group['visible']} of "
                         f"{group['min']} required carriers, so part of the beat's decision has no readable "
                         f"surface at this viewport (seen: {group['names'][:4]})")
    return found


SHED_DIAGNOSTIC = """(sheet)=>{
          const s=document.querySelector(sheet); if(!s) return 'no sheet node to inspect';
          const rows=[];
          const walk=(el,depth)=>{for(const n of el.children){
            if(depth>2)continue;
            const r=n.getBoundingClientRect(),c=getComputedStyle(n);
            const rank=n.dataset.shedItem;
            rows.push(`${'  '.repeat(depth)}${n.tagName.toLowerCase()}${n.id?'#'+n.id:''}`
              +` ${rank?'rank '+rank:'UNRANKED'}`
              +(n.classList.contains('shed')&&rank?' (shed)':'')
              +(n.dataset.critical==='true'?' (CRITICAL - instruction, never shed)':'')
              +` h=${Math.round(r.height)} fs=${c.fontSize}`
              +` ${c.display==='none'?'display:none':''}`
              +` ${(n.textContent||'').trim().slice(0,26)}`);
            walk(n,depth+1);}};
          walk(s,0);
          return `client ${s.clientHeight} / content ${s.scrollHeight}:\\n  `+rows.join('\\n  ');
        }"""


def attach_shed_diagnostic(state_name, state_violations, read_surface):
    """Put the cause next to the complaint, on the run that found it.

    Rebuilding this by hand cost four full re-walks of the scenario, so it is wired to
    the violation itself rather than to a flag someone has to remember to pass.
    """
    if not any("B3 unreachable" in line for line in state_violations):
        return state_violations
    return state_violations + [f"{state_name}: bounded surface at this text size — " + read_surface()]


def shed_diagnostic(page, scenario_state):
    """Why a bounded surface could not fit, from the run that just measured it.

    A B3 overflow has two very different causes — a rung nobody ranked, or authored text
    that is simply too long for the fixed ceiling — and telling them apart used to mean
    re-driving minutes of real play with a hand-written probe. This rides the same page,
    so the answer is in the report the violation already produced.
    """
    try:
        return page.evaluate(SHED_DIAGNOSTIC, scenario_state.get("sheet") or "#engine")
    except Exception as error:  # noqa: BLE001 - a diagnostic must never mask the real failure
        return f"diagnostic unavailable: {error}"


def diagnose(page, scenario_state):
    """What the page actually looked like, for a failed wait.

    A beat that never reaches its expected shape otherwise costs a whole scenario
    re-run to find out why, so the timeout itself carries the evidence. Scenario
    selectors only - the tool stays game-agnostic.
    """
    selectors = [scenario_state.get(key) for key in ("markers", "sheet") if scenario_state.get(key)]
    try:
        return page.evaluate("""(report)=>{
          const lines=[];
          for(const sel of report.selectors){
            const nodes=[...document.querySelectorAll(sel)];
            // Group by shape and visibility instead of truncating: the class that is
            // missing is usually buried past the first few nodes.
            const groups=new Map();
            for(const n of nodes){
              const r=n.getBoundingClientRect();
              const key=`${[...n.classList].join('.')||n.tagName} ${n.hidden?'hidden':`${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.x)},${Math.round(r.y)}`}`;
              const g=groups.get(key)||{count:0,sample:n};
              g.count+=1;groups.set(key,g);
            }
            lines.push(`${sel}: ${nodes.length} node(s)`);
            for(const [key,g] of groups)lines.push(`  ${g.count}x ${key}${g.count===1&&g.sample.getAttribute('aria-label')?` “${g.sample.getAttribute('aria-label').slice(0,44)}”`:''}`);
          }
          const buttons=[...document.querySelectorAll('button')].filter(b=>b.offsetParent);
          lines.push(`live buttons: ${buttons.slice(0,8).map(b=>b.getAttribute('aria-label')||b.textContent.trim().slice(0,40)).join(' | ')||'none'}`);
          const heads=[...document.querySelectorAll('h1')].filter(h=>h.offsetParent);
          lines.push(`headings: ${heads.slice(0,3).map(h=>h.textContent.trim().slice(0,60)).join(' / ')||'none'}`);
          return lines.join('\\n  ');
        }""", {"selectors": selectors})
    except Exception as error:  # noqa: BLE001 - a diagnostic must never mask the real failure
        return f"diagnostic unavailable: {error}"


def wait_for_eval(page, expression, timeout_ms, scenario_state=None):
    # CSP (script-src 'self') blocks wait_for_function; poll via evaluate
    # like the browser tests' until() helper.
    deadline = time.monotonic() + timeout_ms / 1000
    while not page.evaluate(expression):
        if time.monotonic() > deadline:
            raise TimeoutError(f"wait_eval timed out: {expression}\n  page at timeout:\n  {diagnose(page, scenario_state or {})}")
        page.wait_for_timeout(120)


def wait_for_text(page, text, timeout_ms, scenario_state=None):
    # Any visible element may carry the line: opt-in presentation duplicates text
    # on hidden surfaces, so ".first" would lock onto an invisible copy.
    matches = page.get_by_text(text).locator('visible=true')
    deadline = time.monotonic() + timeout_ms / 1000
    while matches.count() == 0:
        if time.monotonic() > deadline:
            raise TimeoutError(f"wait_text timed out with no visible match: {text}\n  page at timeout:\n  {diagnose(page, scenario_state or {})}")
        page.wait_for_timeout(120)


def resolve_state_budgets(state, budgets):
    """Apply a scenario state's declared budget raises, or say why it may not.

    Every raised ceiling is bought with a stated reason. The narrow-sheet figures are not
    among them: text size never moves B1, because a sheet that grows for large text takes
    the play space back (guide I10 — the surface sheds its low rungs instead).
    """
    resolved, found = dict(budgets), []
    name = state["name"]
    if state.get("coverage_max"):
        # Touch viewports may raise B1 for direct-input affordances only
        # (guide B1 note); the raised limit must be justified in the scenario.
        raised = state["coverage_max"] > budgets["coverage_max"]
        justified = raised and (state.get("coverage_max_reason") or state.get("panel_open")
            or state.get("panel_open_reason") or state.get("cinematic"))
        if raised and not justified:
            found.append(f"{name}: B1 raises coverage_max to "
                f"{state['coverage_max']:.0%} with no reason — only a player-opened panel, "
                "a cinematic or a touch direct-input allowance may exceed the base budget")
        else:
            resolved["coverage_max"] = state["coverage_max"]
    if state.get("narrow_sheet_height_max") or state.get("narrow_sheet_max"):
        found.append(f"{name}: B1 narrow-sheet budget raised — a bottom sheet's ceiling is "
            "fixed at every text size, so an overflowing surface must shed its low rungs "
            "(guide I8/I10) instead of asking for more of the play space")
    return resolved, found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=ROOT / "artifacts/presentation-budget.json")
    parser.add_argument("--url", help="Base URL of a running server; starts a disposable one when omitted")
    parser.add_argument("--report-only", action="store_true", help="Always exit 0; still write the report")
    parser.add_argument("--candidate", help="Exact committed candidate SHA for review evidence; omit during draft checks")
    parser.add_argument("--only", help="Comma-separated state names to measure. States share one page, "
                                       "so pass a contiguous prefix whose first state has 'goto'.")
    args = parser.parse_args()
    if args.candidate and not re.fullmatch(r"[0-9a-f]{40}", args.candidate):
        parser.error("--candidate needs an exact 40-character lowercase SHA")
    if args.candidate:
        git = ["git", "-c", f"safe.directory={ROOT.as_posix()}"]
        head = subprocess.run([*git, "rev-parse", "HEAD"], cwd=ROOT,
                              capture_output=True, text=True, check=True).stdout.strip()
        if args.candidate != head:
            parser.error("--candidate must equal the checked-out commit")
        if subprocess.run([*git, "diff", "--quiet", "HEAD"], cwd=ROOT).returncode:
            parser.error("--candidate needs a clean tracked working tree")
    scenario = json.loads(args.scenario.read_text(encoding="utf-8"))
    if args.only:
        # Selecting states must actually select them: replaying the whole scenario to
        # re-check one beat costs minutes and hides which state was asked for.
        wanted = [name.strip() for name in args.only.split(",") if name.strip()]
        scenario["states"] = [state for state in scenario["states"] if state["name"] in wanted]
        missing = set(wanted) - {state["name"] for state in scenario["states"]}
        if missing:
            raise SystemExit(f"--only names are not in the scenario: {sorted(missing)}")
        if not scenario["states"][0].get("goto"):
            raise SystemExit("the first selected state needs 'goto': a fresh page would be "
                             "measured at about:blank instead of where the walk left it")
    budgets = {**BUDGETS, **scenario.get("budgets", {})}
    opt_in_targets = {}
    for state in scenario["states"]:
        if state.get("opened_by") and state.get("sheet"):
            opt_in_targets.setdefault(state["opened_by"], set()).add(state["sheet"])
        if state.get("text_scale", 1) != 1:
            scale = state.get("text_scale")
            if not isinstance(scale, (int, float)) or scale < 1.5:
                raise SystemExit(f"{state['name']}: text_scale must be a number of at least 1.5 — "
                                 "the accessibility viewport is an enlarged one, not a cosmetic knob")
        for group in state.get("carriers", []):
            # A malformed carrier claim must fail before the scenario drives a real
            # browser for minutes, not silently measure nothing.
            if not group.get("selector") or not isinstance(group.get("min"), int) or group["min"] < 1:
                raise SystemExit(f"{state['name']}: a carriers entry needs 'selector' and an integer 'min' >= 1")
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
            scale_applied = 1
            for state in scenario["states"]:
                if state.get("viewport"):
                    context.close()
                    context = browser.new_context(viewport={"width": state["viewport"][0], "height": state["viewport"][1]})
                    page = context.new_page()
                    page.set_default_timeout(20000)
                    scale_applied = 1  # a fresh page starts at the build's own text sizes
                # "resize" changes the viewport in place so a deep play state can also
                # be measured on a narrow screen without losing the learner session
                # (a new context would restart the attempt at the prologue).
                if state.get("resize"):
                    page.set_viewport_size({"width": state["resize"][0], "height": state["resize"][1]})
                    page.wait_for_timeout(600)
                if state.get("goto"):
                    page.goto(base + scenario.get("path", "/"))
                # Live the beat at the declared text size, not only measure it there:
                # the walk itself runs at the accessibility viewport, and the stamp is
                # re-applied before measuring because the game re-renders its card.
                scale_applied = apply_text_scale(page, state, scale_applied)
                # "steps" plays an interleaved click/wait chain so a scenario can
                # reach deep play states, not just the first screen of a chunk.
                for step in state.get("steps", []):
                    if "click" in step:
                        click_scenario_button(page, step["click"], opt_in_targets, step.get("timeout", 30000))
                    elif "wait_text" in step:
                        wait_for_text(page, step["wait_text"], step.get("timeout", 30000), state)
                    elif "wait_eval" in step:
                        wait_for_eval(page, step["wait_eval"], step.get("timeout", 45000), state)
                for click in state.get("clicks", []):
                    click_scenario_button(page, click, opt_in_targets)
                if state.get("wait_eval"):
                    # A measured beat on a software-rendered phone viewport can settle slower
                    # than a desktop one; the scenario may raise the allowance, never the tool.
                    wait_for_eval(page, state["wait_eval"], state.get("wait_timeout", 30000), state)
                if state.get("wait_text"):
                    wait_for_text(page, state["wait_text"], 20000, state)
                page.wait_for_timeout(350)
                scale_applied = apply_text_scale(page, state, scale_applied)
                metrics = evaluate_state(page, state, budgets)
                if state.get("screenshot"):
                    # Reusable evidence: the exact measured play state as a capture.
                    shot = ROOT / state["screenshot"]
                    shot.parent.mkdir(parents=True, exist_ok=True)
                    page.screenshot(path=str(shot))
                else:
                    # A state nobody can look at is a state nobody reviewed: the
                    # numeric report alone cannot certify composition, so every
                    # measured state must leave a capture for the critic pass.
                    all_violations.append(f"{state['name']}: evidence gap — the scenario "
                        "measures this state with no 'screenshot' capture, so no critic can "
                        "judge what the numbers did not express")
                state_budgets, raised = resolve_state_budgets(state, budgets)
                all_violations.extend(raised)
                states.append({"name": state["name"], "text_scale": state.get("text_scale", 1),
                    "budget_coverage_max": state_budgets["coverage_max"], **metrics})
                state_violations = violations(state["name"], metrics, state_budgets, bool(state.get("panel_open")),
                    state, witnessed_sheet_open(page, state))
                # Attach the cause to the violation instead of leaving the next worker to
                # rebuild it: an unranked child and an over-long sentence look the same
                # from the outside and need opposite fixes.
                all_violations.extend(attach_shed_diagnostic(
                    state["name"], state_violations, lambda: shed_diagnostic(page, state)))
                carrier_summary = ",".join(f"{group['visible']}/{group['min']}" for group in metrics.get("carriers") or []) or "n/a"
                print(f"{state['name']}: coverage={metrics['coverage']:.1%} "
                      f"text={state.get('text_scale', 1)}x clipped={len(metrics['clipped'])} "
                      f"long={len(metrics['longBlocks'])} disabled={len(metrics['disabledVisible'])} "
                      f"focal={'n/a' if not metrics['focal'] else len(metrics['focal']['covered'] or [])} "
                      f"presence={'n/a' if not metrics['presence'] else format(metrics['presence']['share'], '.1%')} "
                      f"markerClash={len(metrics['markerClash'])} "
                      f"unreachable={len(metrics['unreachableActions'])}"
                      f"{' -> '+str(metrics['unreachableActions'][:2]) if metrics['unreachableActions'] else ''} "
                      f"carriers={carrier_summary} "
                      f"stray={len(metrics['strayControls'])} dup={len(metrics['dupCarriers'])} "
                      f"subjectCover={'n/a' if not metrics['subjectCover'] else len(metrics['subjectCover']['covers'])}")
            browser.close()
        finally:
            if proc:
                stop_server(proc)
    report = {
        "tool": "check_presentation_budget",
        "candidate_sha": args.candidate,
        "scenario_complete": args.only is None,
        "scenario": str(args.scenario.relative_to(ROOT)) if args.scenario.is_relative_to(ROOT) else str(args.scenario),
        "expected_state_names": [state["name"] for state in scenario["states"]],
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
