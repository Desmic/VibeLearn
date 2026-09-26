"""Focused live reading and commitment check for the situated Level 1 repair."""
import json
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

from tests.browser_check import launch_browser, start_server, stop_server
from tests.level1_chapter_browser import action, choose, complete_tutorial, open_card, skip_opening_to_tutorial
from tests.first_words_browser import until
from tools.check_presentation_budget import BUDGETS, TEXT_SCALE, evaluate_state


def required(page, *claims):
    state = {'required_content': [{'selector': selector, 'includes': list(phrases)}
                                  for selector, phrases in claims]}
    rows = evaluate_state(page, state, BUDGETS)['requiredContent']
    assert all(row['painted'] and not row['missing'] for row in rows), rows
    return rows


def main():
    out = Path('artifacts/situated-repair-play')
    out.mkdir(parents=True, exist_ok=True)
    observations = []
    with tempfile.TemporaryDirectory() as temp, sync_playwright() as playwright:
        server, url = start_server(Path(temp) / 'situated.db')
        browser = launch_browser(playwright)
        try:
            page = browser.new_page(viewport={'width': 390, 'height': 844}, has_touch=True)
            page.goto(url + '/first-words')
            skip_opening_to_tutorial(page, skip_controls=True)
            complete_tutorial(page)
            action(page, 'Begin Level 1 →')
            page.get_by_role('button', name='Inspect the parade notice').click()
            page.get_by_role('button', name='Carry parade notice').click()
            expect(page.locator('#carried-source')).to_be_visible()
            open_card(page)
            moves = page.evaluate('FirstWordsReview.state.moves')
            page.get_by_role('button', name='Place parade notice in machine slot').click()
            expect(page.locator('#slotted-source')).to_be_visible()
            assert page.evaluate('FirstWordsReview.state.moves') == moves
            page.get_by_role('button', name='Remove from slot').click()
            assert page.evaluate('FirstWordsReview.state.moves') == moves
            page.reload()
            until(page, '()=>window.FirstWordsReview&&FirstWordsReview.state.round===1')
            assert page.evaluate('FirstWordsReview.state.clue') == 'none'
            page.get_by_role('button', name='Inspect the parade notice').click()
            page.get_by_role('button', name='Carry parade notice').click()
            open_card(page)
            page.get_by_role('button', name='Place parade notice in machine slot').click()
            action(page, 'Commit source')
            assert page.evaluate('FirstWordsReview.state.clue') == 'parade'
            action(page, 'Make first word')
            open_card(page)
            page.get_by_role('button', name='Request and sign only').click()
            page.get_by_role('button', name='Request, sign, and Open').click()
            assert page.evaluate('FirstWordsReview.state.loop_prediction') == 'none'
            page.reload()
            until(page, '()=>window.FirstWordsReview&&FirstWordsReview.state.round===1')
            assert page.evaluate('FirstWordsReview.state.loop_prediction') == 'none'
            open_card(page)
            choose(page, 'Request and sign only')
            assert page.evaluate('FirstWordsReview.state.loop_prediction') == 'same'
            for width, height, scale in ((390, 844, 1), (360, 800, 1), (1280, 720, 1), (390, 844, 2)):
                page.set_viewport_size({'width': width, 'height': height})
                page.evaluate(TEXT_SCALE, scale)
                page.wait_for_timeout(700)
                open_card(page)
                page.screenshot(path=str(out / f'route-correction-{width}-{scale}x.png'))
                rows = required(page,
                                ('#goal', ('Open joins the next input.',)),
                                ('#detail', ('left out Open', 'request, sign, and Open')))
                observations.append({'phase': 'route-correction', 'viewport': [width, height], 'scale': scale, 'required': rows})
            page.evaluate(TEXT_SCALE, 1)
            page.set_viewport_size({'width': 390, 'height': 844})
            page.get_by_role('button', name='Use the full input →').click()
            for width, height, scale in ((390, 844, 1), (360, 800, 1), (1280, 720, 1), (390, 844, 2)):
                page.set_viewport_size({'width': width, 'height': height})
                page.evaluate(TEXT_SCALE, scale)
                page.wait_for_timeout(700)
                open_card(page)
                page.screenshot(path=str(out / f'parade-question-{width}-{scale}x.png'))
                rows = required(page,
                                ('#goal', ('Which gate does this sign support?',)),
                                ('#slotted-source', ('The lantern parade starts at sunset.',)))
                for label in ('Moon', 'Star', 'Sun', 'No gate', 'Check my prediction'):
                    box = page.locator('#actions').get_by_role('button', name=label, exact=True).bounding_box()
                    assert box and box['y'] >= 0 and box['y'] + box['height'] <= height, (label, box, height)
                observations.append({'phase': 'source-question', 'viewport': [width, height], 'scale': scale, 'required': rows})
            page.evaluate(TEXT_SCALE, 1)
            page.set_viewport_size({'width': 390, 'height': 844})
            choose(page, 'No gate')
            assert page.evaluate('FirstWordsReview.state.source_inference') == 'no-gate'
            for _ in range(3):
                action(page, 'Next word')
            wrong = action(page, 'Speak to gate →')['word_machine_state']
            assert wrong['output'] == ['Open', 'the', 'Moon', 'gate']
            assert wrong['status'] == 'wrong'
            open_card(page)
            expect(page.locator('#actions [role="status"]').first).to_contain_text('no gate')
            page.screenshot(path=str(out / 'parade-no-gate-recovery-390.png'))
            page.reload()
            until(page, '()=>window.FirstWordsReview&&FirstWordsReview.state.round===1')
            restored = page.evaluate('FirstWordsReview.state')
            assert restored['loop_prediction'] == 'same' and restored['source_inference'] == 'no-gate'
            assert restored['status'] == 'wrong'
            observations.append({'parade_after_reload': {k: restored[k] for k in ('clue', 'loop_prediction', 'source_inference', 'output', 'status')}})
            print('Situated repair browser check passed: reversible source/choice, full question and correction at phone/desktop/200%, parade/no-gate output independence and reload')
            (out / 'observations.json').write_text(json.dumps(observations, indent=2), encoding='utf-8')
        finally:
            browser.close()
            stop_server(server)


if __name__ == '__main__':
    main()
