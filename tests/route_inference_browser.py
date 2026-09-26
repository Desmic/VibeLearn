"""Focused live route-machine check for source inference and input history."""
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

from tests.browser_check import launch_browser, start_server, stop_server
from tests.level1_chapter_browser import (
    action, choose, complete_tutorial, open_card, skip_opening_to_tutorial, supply_sign,
)


def main():
    with tempfile.TemporaryDirectory() as temp, sync_playwright() as playwright:
        server, url = start_server(Path(temp) / 'route-inference.db')
        browser = launch_browser(playwright)
        try:
            page = browser.new_page(viewport={'width': 390, 'height': 844}, has_touch=True)
            page.goto(url + '/first-words')
            skip_opening_to_tutorial(page, skip_controls=True)
            complete_tutorial(page)
            action(page, 'Begin Level 1 →')
            supply_sign(page, 'the parade notice', 'parade notice', 'parade notice')
            action(page, 'Make first word')
            before = page.evaluate('FirstWordsReview.state')
            assert before['output'] == ['Open'] and before['loop_prediction'] == 'none'
            assert page.locator('#context').inner_text() == ' '.join(before['input'])
            choose(page, 'Next input: request and sign only')
            committed = page.evaluate('FirstWordsReview.state')
            assert committed['loop_prediction'] == 'same'
            assert committed['context'] == committed['input'] + ['Open']
            page.reload()
            expect(page.locator('#stage-name')).to_have_text('LEVEL 1 · SOURCE', timeout=15000)
            assert page.evaluate('FirstWordsReview.state.loop_prediction') == 'same'
            open_card(page)
            for name in ('No gate', 'Ask for a hint'):
                option = page.get_by_role('button', name=name, exact=True)
                expect(option).to_be_visible()
                box = option.bounding_box()
                assert box and box['y'] >= 0 and box['y'] + box['height'] <= 844, (name, box)
            action(page, 'Ask for a hint')
            expect(page.locator('[data-learning-hint="route"]')).to_contain_text('supplied sign')
            choose(page, 'No gate')
            expect(page.locator('[data-learning-hint="route"]')).to_have_count(0)
            expect(page.locator('[data-learning-hint="source-feedback"]')).to_contain_text('no gate')
            for _ in range(3):
                action(page, 'Next word')
            state = page.evaluate('FirstWordsReview.state')
            assert state['output'] == ['Open', 'the', 'Moon', 'gate']
            assert state['source_inference'] == 'no-gate'
            action(page, 'Speak to gate →')
            expect(page.locator('#stage-name')).to_have_text('LEVEL 1 · RECOVER')
            expect(page.locator('#actions [role="status"]').first).to_contain_text('supplied sign named no gate')
            if page.locator('#engine').is_visible():
                page.get_by_role('button', name='Put the machine away').click()
            supply_sign(page, "today's route notice", "today's notice", "today's notice")
            for name in ('Make first word', 'Next word', 'Next word', 'Next word'):
                action(page, name)
            recovered = page.evaluate('FirstWordsReview.state')
            assert recovered['output'] == ['Open', 'the', 'Star', 'gate']
            assert recovered['loop_prediction'] == 'same' and recovered['source_inference'] == 'no-gate'
            desktop = browser.new_page(viewport={'width': 1280, 'height': 720})
            desktop.goto(url + '/first-words')
            skip_opening_to_tutorial(desktop, skip_controls=True)
            complete_tutorial(desktop)
            action(desktop, 'Begin Level 1 →')
            supply_sign(desktop, 'the parade notice', 'parade notice', 'parade notice')
            action(desktop, 'Make first word')
            choose(desktop, 'Next input: request and sign only')
            rect = desktop.locator('#engine').bounding_box()
            assert rect and rect['x'] > 750 and rect['y'] >= 0 and rect['y'] + rect['height'] <= 720
            print('Route inference browser check passed: pause, reload, hint, no-gate, toy Moon, recovery, desktop focal clearance')
        finally:
            browser.close()
            stop_server(server)


if __name__ == '__main__':
    main()
