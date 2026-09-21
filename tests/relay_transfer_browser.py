"""Focused changed-case cue/reload/recovery gate on a disposable fresh v2 save."""
import json
import tempfile
import re
from pathlib import Path

from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server
from tests.level1_chapter_browser import (
    skip_opening_to_tutorial, complete_tutorial, action, choose, generate, complete_relay,
)

ROOT = Path(__file__).resolve().parents[1]


def assert_commitment_layout(page, selector):
    for width,height in [(390,844),(1280,800)]:
        page.set_viewport_size({'width':width,'height':height})
        note=page.locator(selector)
        expect(note).to_be_visible()
        expect(page.locator('#actions > button').first).to_be_visible()
        bounds=page.evaluate('''selector=>{
          const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,bottom:r.bottom};};
          return {actions:rect(document.querySelector('#actions')),
            buttons:[...document.querySelectorAll('#actions > button')].map(e=>rect(e)),
            note:rect(document.querySelector(selector))};
        }''',selector)
        for button in bounds['buttons']:
            assert button['width']>=bounds['actions']['width']-2,(button,bounds)
            assert bounds['note']['y']>=button['bottom']-1,(button,bounds)
    page.set_viewport_size({'width':390,'height':844})


def commit_relay_for_review(page):
    action(page,'Answer the signal')
    choose(page,re.compile('18:20'))
    choose(page,'Predict: message goes to the Bell Yard')
    choose(page,'Predict: each step also receives Meet')
    expect(page.get_by_role('button',name='Run the relay →',exact=True)).to_be_visible()
    expect(page.locator('#output .empty')).to_have_count(4)
    assert_commitment_layout(page,'[data-relay-commitment]')


def main():
    with tempfile.TemporaryDirectory() as temp, sync_playwright() as p:
        proc, url = start_server(Path(temp)/'relay-focused.db')
        browser = p.chromium.launch()
        errors = []
        try:
            page = browser.new_page(viewport={'width':390,'height':844}, reduced_motion='reduce')
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url+'/first-words')
            skip_opening_to_tutorial(page)
            complete_tutorial(page)
            action(page,'Begin Level 1 →')
            choose(page,"Supply today's notice · “Moon route closed. The tower bell answers the five-point lantern mark.”")
            choose(page,'Predict: the machine will say Star')
            summary=page.locator('[data-route-commitment]')
            expect(summary).to_contain_text('Star')
            expect(page.locator('#output .empty')).to_have_count(4)
            assert_commitment_layout(page,'[data-route-commitment]')
            page.reload()
            expect(summary).to_contain_text('Star',timeout=20000)
            expect(page.get_by_role('button',name='Predict: each step also receives every generated word',exact=True)).to_be_visible()
            assert page.evaluate('FirstWordsReview.state.prediction')=='star'
            expect(page.locator('#output .empty')).to_have_count(4)
            assert_commitment_layout(page,'[data-route-commitment]')
            generate(page)
            observations = complete_relay(page, recover=True, reload_predictions=True,
                on_committed=lambda p:assert_commitment_layout(p,'[data-relay-commitment]'))
            submitted = action(page,'Finish Level 1 →','Level saved · practice recorded')
            transfer = submitted['assessment']['relay_transfer_observations']
            assert transfer['context_choice']=='loft'
            assert transfer['predicted_destination']=='yard'
            assert transfer['input_prediction']=='original'
            assert transfer['input_prediction_correct'] is False
            assert transfer['prediction_matches_supplied_context'] is False
            assert transfer['first_decisions_before_case_feedback'] is True
            assert transfer['final_context']=='yard'
            assert submitted['assessment']['mastery']=='unknown'
            expect(page.locator('#goal')).to_have_text('Mira heard you.')
            assert not errors,errors
            (ROOT/'artifacts'/'relay-focused-report.json').write_text(json.dumps({
                'result':'passed','observations':observations,'assessment':submitted['assessment'],
                'page_errors':errors,'checks':['Route prediction remains visible before feedback and after reload.',
                    'Primary actions span the action row above commitment text at 390 and 1280 widths.',
                    'Input HUD does not supply hypothetical generated prefix before prediction.',
                    'Output and feedback remain absent before run, including after reload.',
                    'Wrong first choices remain in assessment after successful retry.']
            },indent=2),encoding='utf-8')
            print('Relay cue withholding, committed reload and first-decision retention passed')
        finally:
            browser.close()
            stop_server(proc)


if __name__=='__main__':
    main()
