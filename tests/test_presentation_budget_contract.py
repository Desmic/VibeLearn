"""Contract tests for the presentation budget checker (no browser needed)."""
import json
import unittest
from pathlib import Path

from tools.check_presentation_budget import (BUDGETS, MEASURE, SHED_DIAGNOSTIC, TEXT_SCALE,
                                             attach_shed_diagnostic, click_scenario_button,
                                             resolve_state_budgets, violations,
                                             witnessed_sheet_open)

_LITERALS = {'"', "'", '`'}
_OPEN = {'(': ')', '{': '}', '[': ']'}


def _unclosed(code):
    """Delimiter balance for the injected script, skipping string and comment bodies.

    A typo in MEASURE is invisible to Python and only explodes after the scenario has
    driven a real browser for minutes, so fail it here instead.
    """
    stack, index, line = [], 0, 1
    while index < len(code):
        char = code[index]
        if char == '\n':
            line += 1
            index += 1
            continue
        if char in _LITERALS:
            quote, index = char, index + 1
            while index < len(code):
                if code[index] == '\\':
                    index += 2
                    continue
                if code[index] == quote:
                    break
                if code[index] == '\n':
                    line += 1
                index += 1
            index += 1
            continue
        if code.startswith('//', index):
            index = code.find('\n', index)
            index = len(code) if index < 0 else index
            continue
        if code.startswith('/*', index):
            end = code.find('*/', index + 2)
            line += code.count('\n', index, end)
            index = len(code) if end < 0 else end + 2
            continue
        if char in _OPEN:
            stack.append((char, line))
        elif char in ')}]':
            if not stack or _OPEN[stack[-1][0]] != char:
                return f'stray {char!r} on line {line}'
            stack.pop()
        index += 1
    return f'unclosed {stack[-1][0]!r} from line {stack[-1][1]}' if stack else None


def _metrics(**overrides):
    base = {'coverage': 0.05, 'panelOpen': False, 'clipped': [], 'longBlocks': [], 'disabledVisible': [],
            'focal': None, 'presence': None, 'subjectCover': None, 'markerClash': [], 'strayControls': [],
            'dupCarriers': [], 'unreachableActions': [], 'sheet': None, 'carriers': []}
    return {**base, **overrides}


def _sheet(**overrides):
    # A phone sheet that earned its allowance: flush, full-bleed, under the height
    # cap, and it gave up the direct-input chrome it sits on top of.
    base = {'viewportWidth': 390, 'viewportHeight': 844, 'width': 390, 'height': 258,
            'left': 0, 'rightGap': 0, 'bottomGap': 0, 'share': 0.28, 'yielded': []}
    return {**base, **overrides}


_SHEET_STATE = {'narrow_sheet': True, 'sheet': '#engine', 'opened_by': 'Open the message machine'}


class PresentationBudgetContract(unittest.TestCase):
    def test_requested_world_measurements_cannot_disappear(self):
        requested = {"focal": "zip", "presence": {"entity": "zip", "height": 2},
                     "subject": {"entity": "zip"}}
        problems = violations("play", _metrics(), BUDGETS, False, requested)
        self.assertTrue(any("B2 focal entity could not" in problem for problem in problems))
        self.assertTrue(any("B6 story subject could not" in problem for problem in problems))
        self.assertTrue(any("B7 subject clearance could not" in problem for problem in problems))
        hidden = _metrics(focal={"point": {"visible": False}, "covered": None},
                          presence={"share": .3, "visible": False})
        problems = violations("play", hidden, BUDGETS, False, requested)
        self.assertTrue(any("B2 focal entity could not" in problem for problem in problems))
        self.assertTrue(any("B6 story subject could not" in problem for problem in problems))

    def test_sheet_allowance_requires_current_visible_player_opening(self):
        from playwright.sync_api import sync_playwright
        html = """<button onclick="document.querySelector('#engine').hidden=false">Open machine</button>
        <button onclick="document.querySelector('#engine').hidden=false">Auto show</button>
        <div id="engine" hidden><button onclick="this.parentElement.hidden=true">Close</button></div>"""
        state = {"opened_by": "Open machine", "sheet": "#engine"}
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page()
            page.set_content(html)
            self.assertFalse(witnessed_sheet_open(page, state))
            click_scenario_button(page, "Open machine", {"Open machine": {"#engine"}})
            self.assertTrue(witnessed_sheet_open(page, state))
            page.get_by_role("button", name="Close").click()
            page.get_by_role("button", name="Auto show").click()
            self.assertFalse(witnessed_sheet_open(page, state))
            page.goto("about:blank")
            page.set_content(html)
            page.get_by_role("button", name="Auto show").click()
            self.assertFalse(witnessed_sheet_open(page, state))
            click_scenario_button(page, "Open machine", {"Open machine": {"#engine"}})
            self.assertFalse(witnessed_sheet_open(page, state))
            browser.close()

    def test_injected_measurement_script_is_balanced(self):
        self.assertIsNone(_unclosed(MEASURE))

    def test_injected_text_scale_script_is_balanced(self):
        self.assertIsNone(_unclosed(TEXT_SCALE))

    def test_injected_shed_diagnostic_script_is_balanced(self):
        self.assertIsNone(_unclosed(SHED_DIAGNOSTIC))

    def test_a_b3_overflow_carries_its_own_cause(self):
        # The two fixes for an overflowing surface (rank what is unranked, or shorten the
        # sentence) are opposite, and telling them apart used to mean re-driving minutes
        # of real play. The diagnostic rides the violation, not a flag.
        overflow = ['x: B3 unreachable action — a painted choice needs scrolling']
        seen = []
        wired = attach_shed_diagnostic('x', overflow, lambda: seen.append(1) or 'client 286 / content 346')
        self.assertEqual(len(wired), 2)
        self.assertIn('client 286 / content 346', wired[1])
        self.assertEqual(seen, [1])
        # A clean state must not pay for the page read, and a different complaint must
        # not get an answer to a question nobody asked.
        quiet = attach_shed_diagnostic('y', [], lambda: self.fail('read on a clean state'))
        self.assertEqual(quiet, [])
        other = attach_shed_diagnostic('z', ['z: B2 focal entity covered'], lambda: 'unused')
        self.assertEqual(other, ['z: B2 focal entity covered'])

    def test_every_state_needs_a_named_capture(self):
        # The scenario contract is what makes the critic's eyes mandatory: a measured
        # state with no screenshot cannot be judged on composition.
        scenario = json.loads(Path('tests/fixtures/presentation-budget-first-words.json')
                             .read_text(encoding='utf-8'))
        missing = [state['name'] for state in scenario['states'] if not state.get('screenshot')]
        self.assertEqual(missing, [])

    def test_b3_reachability_flags_a_scrolled_out_decision_option(self):
        found = violations('mission-recover-opened',
                           _metrics(unreachableActions=["button “Supply today's notice ..” 694..779/720"]),
                           BUDGETS, True, {})
        self.assertEqual(len(found), 1)
        self.assertIn('B3 unreachable action', found[0])

    def test_a_reachable_panel_does_not_report_reachability(self):
        self.assertEqual(violations('mission-panel-opened', _metrics(), BUDGETS, True, {}), [])

    def test_a_flush_player_opened_phone_sheet_may_exceed_the_panel_budget(self):
        # 34% of a 390x844 screen is unreadable at 22%, and the veto defect was the
        # card floating over the character — which the geometry conditions forbid.
        metrics = _metrics(coverage=0.34, sheet=_sheet())
        self.assertEqual(violations('mission-decision-phone-sheet', metrics, BUDGETS, True,
                                    _SHEET_STATE, player_opened=True), [])

    def test_narrow_sheet_needs_a_control_the_player_actually_clicked(self):
        for state, opened in (({**_SHEET_STATE, 'opened_by': ''}, False),
                              (_SHEET_STATE, False)):
            found = violations('x', _metrics(coverage=0.34, sheet=_sheet()), BUDGETS, True, state, opened)
            self.assertTrue(any('opened_by' in v or 'no step clicked' in v for v in found), found)

    def test_narrow_sheet_rejects_a_card_floating_over_the_scene(self):
        for geometry, phrase in (({'bottomGap': 140}, 'flush'), ({'left': 40, 'rightGap': 40}, 'full-bleed'),
                                 ({'height': 420}, 'screen height'), ({'viewportWidth': 900}, 'narrow'),
                                 ({'yielded': ['.game-move-stick']}, 'direct-input')):
            found = violations('x', _metrics(coverage=0.34, sheet=_sheet(**geometry)), BUDGETS, True,
                               _SHEET_STATE, player_opened=True)
            self.assertTrue(any(phrase in v for v in found), (geometry, found))

    def test_narrow_sheet_may_not_be_claimed_by_a_surface_that_is_not_painted(self):
        found = violations('x', _metrics(coverage=0.34), BUDGETS, True, _SHEET_STATE, player_opened=True)
        self.assertTrue(any('is not painted' in v for v in found), found)

    def test_focal_clearance_and_reachability_stay_hard_inside_a_sheet(self):
        metrics = _metrics(coverage=0.34, sheet=_sheet(),
                           focal={'point': {}, 'covered': ['HEADER']},
                           unreachableActions=["button “Supply today's notice ..” 694..779/844"])
        found = violations('x', metrics, BUDGETS, True, _SHEET_STATE, player_opened=True)
        self.assertEqual(len(found), 2, found)


    def test_narrow_viewport_panel_states_declare_their_sheet_contract(self):
        # A phone panel is only ever legitimate as a measured sheet, so the scenario
        # itself has to carry the claim: otherwise the state is an unasked card.
        scenario = json.loads(Path('tests/fixtures/presentation-budget-first-words.json')
                             .read_text(encoding='utf-8'))
        for state in scenario['states']:
            width = (state.get('viewport') or state.get('resize') or [1280])[0]
            if width < BUDGETS['narrow_viewport_px'] and state.get('panel_open'):
                self.assertTrue(state.get('narrow_sheet'), state['name'])
                for key in ('sheet', 'yields', 'opened_by'):
                    self.assertIn(key, state, state['name'])

    def test_every_raised_coverage_budget_states_why(self):
        scenario = json.loads(Path('tests/fixtures/presentation-budget-first-words.json')
                             .read_text(encoding='utf-8'))
        unjustified = [state['name'] for state in scenario['states']
                       if state.get('coverage_max', BUDGETS['coverage_max']) > BUDGETS['coverage_max']
                       and not (state.get('coverage_max_reason') or state.get('panel_open') or state.get('cinematic'))]
        self.assertEqual(unjustified, [])


    def test_i9_flags_a_beat_whose_world_carriers_vanished(self):
        # The 23 September phone defect: coverage, clipping and overlap all passed while
        # every route board label was hidden, leaving the mission's decision with no
        # readable surface. Only a floor on carrier count can see that.
        metrics = _metrics(carriers=[{'selector': '.notice-marker', 'min': 3, 'visible': 0, 'names': []}])
        found = violations('mission-decision-phone-folded', metrics, BUDGETS, False,
                           {'carriers': [{'selector': '.notice-marker', 'min': 3}]})
        self.assertEqual(len(found), 1)
        self.assertIn('I9 carrier floor', found[0])

    def test_i9_passes_when_every_carrier_is_on_screen(self):
        metrics = _metrics(carriers=[{'selector': '.notice-marker', 'min': 3, 'visible': 3,
                                      'names': ['OLD SIGN', 'PARADE NOTICE', 'TODAY']},
                                     {'selector': '#machine-toggle', 'min': 1, 'visible': 1,
                                      'names': ['Find the current route']}])
        self.assertEqual(violations('x', metrics, BUDGETS, False, {}), [])

    def test_the_decision_states_of_this_game_declare_their_carrier_floor(self):
        # A rule nobody asserts is a rule nobody follows: the beats where the world
        # carries the choice must state how many carriers they owe at every viewport.
        scenario = json.loads(Path('tests/fixtures/presentation-budget-first-words.json')
                             .read_text(encoding='utf-8'))
        declared = {state['name'] for state in scenario['states'] if state.get('carriers')}
        for name in ('mission-decision-phone-folded', 'mission-decision-phone-sheet'):
            self.assertIn(name, declared)
        for state in scenario['states']:
            for group in state.get('carriers', []):
                self.assertTrue(group.get('selector'), state['name'])
                self.assertGreaterEqual(group.get('min', 0), 1, state['name'])

    # --- B1 at the accessibility viewport (WCAG 1.4.4) -------------------------------
    def test_no_text_size_buys_a_taller_sheet(self):
        # The budget is what keeps the world playable; enlarging text may not spend it.
        # A surface that no longer fits sheds its low rungs instead (guide I10).
        for state in ({'name': 'x', 'narrow_sheet_height_max': 0.5},
                      {'name': 'x', 'narrow_sheet_max': 0.6, 'text_scale': 2,
                       'narrow_sheet_height_max_reason': 'big text'}):
            _, found = resolve_state_budgets(state, BUDGETS)
            self.assertTrue(any('shed its low rungs' in v for v in found), state)

    def test_an_enlarged_text_sheet_still_owes_b3_and_b2(self):
        # Growing or shrinking nothing: at any text size a choice must be reachable and
        # the focal entity clear, measured against the same standard ceilings.
        metrics = _metrics(coverage=0.39, sheet=_sheet(height=330),
                           unreachableActions=["button “Supply today's notice · “Mo” 840..950/844"])
        state = {**_SHEET_STATE, 'text_scale': 2}
        found = violations('x', metrics, BUDGETS, True, state, player_opened=True)
        self.assertTrue(any('B3 unreachable action' in v for v in found), found)

    def test_every_phone_sheet_beat_is_also_measured_at_the_accessibility_viewport(self):
        # A rule with no enlarged-text state in the scenario is a rule nobody checks.
        scenario = json.loads(Path('tests/fixtures/presentation-budget-first-words.json')
                             .read_text(encoding='utf-8'))
        scaled = {state.get('twin_of', state['name']) for state in scenario['states']
                  if state.get('text_scale', 1) > 1}
        for state in scenario['states']:
            if state.get('narrow_sheet') and state.get('panel_open') and state.get('text_scale', 1) == 1:
                self.assertIn(state['name'], scaled, state['name'])


if __name__ == '__main__':
    unittest.main()
