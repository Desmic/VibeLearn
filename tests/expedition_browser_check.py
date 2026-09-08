"""Real Chromium playthrough on disposable local storage; no successful API mocks."""
import json
import os
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parent.parent


def main():
    artifacts = ROOT / 'artifacts'; artifacts.mkdir(exist_ok=True)
    checks, errors = [], []
    with tempfile.TemporaryDirectory() as directory, sync_playwright() as p:
        process, url = start_server(Path(directory) / 'expedition.sqlite3')
        browser = p.chromium.launch(executable_path=os.environ.get("VIBELEARN_CHROMIUM_EXECUTABLE") or None)
        context = browser.new_context(viewport={'width': 1440, 'height': 1000})
        context.tracing.start(screenshots=True, snapshots=True, sources=True)
        page = context.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
        def shot(name):
            page.evaluate('window.scrollTo(0, 0)'); page.screenshot(path=str(artifacts / name), full_page=True)
        def move(action):
            page.locator(f'[data-action="{action}"]').click()
            expect(page.locator('#hud-save-value')).to_have_text('Synced')
            expect(page.locator('#exp-feedback')).not_to_contain_text('making the move')
        def clear():
            page.locator('#exp-submit').click()
            expect(page.locator('.exp-resolution')).to_be_visible()
            page.locator('#exp-continue').click()
            expect(page.locator('#exp-launch')).to_be_visible()
        try:
            page.goto(url + "/?play=expedition")
            expect(page.locator('#exp-launch')).to_have_text('Help Pip↗')
            expect(page.locator('[data-exp-mission]')).to_have_count(5)
            expect(page.locator('[data-exp-mission="expedition-04"]')).to_be_disabled()
            shot('expedition-map.png')
            page.locator('#exp-xp').click()
            assert page.locator('#hud-xp').evaluate("n => getComputedStyle(n).visibility") == 'hidden'
            page.locator('#exp-launch').focus(); page.keyboard.press('Enter')
            expect(page.locator('[data-action="send"]')).to_be_visible()
            move('send')
            expect(page.locator('#exp-parts')).to_have_text('1 gear made')
            expect(page.locator('#exp-knowledge')).to_contain_text('No confirmation')
            shot('expedition-first-move.png')
            checks.append('keyboard launch; direct send changes the scene; truth and courier knowledge differ; XP hidden without disabling play')
            page.reload()
            expect(page.locator('#exp-parts')).to_have_text('1 gear made')
            expect(page.locator('#exp-knowledge')).to_contain_text('No confirmation')
            port = int(url.rsplit(':', 1)[1]); stop_server(process)
            process, _ = start_server(Path(directory) / 'expedition.sqlite3', port)
            page.reload(); expect(page.locator('[data-action="retry"]')).to_be_visible()
            move('retry'); move('collect'); clear()
            expect(page.locator('[data-exp-mission="expedition-02"]')).to_have_attribute('data-status', 'unlocked')
            checks.append('save, reload and actual process restart preserve move and knowledge; clearing unlocks only the next stop')
            page.locator('#exp-launch').click()
            move('send'); move('restart'); move('retry')
            expect(page.locator('#exp-parts')).to_have_text('2 gears made')
            expect(page.locator('#exp-submit')).to_be_disabled()
            shot('expedition-setback.png')
            move('rewind'); move('send'); move('restart'); move('restore'); move('retry'); move('collect'); clear()
            checks.append('new worker identity causes a visible duplicate; rewind preserves failure history and allows safe recovery')
            page.locator('#exp-launch').click(); move('send'); move('wait'); move('inspect'); move('collect'); clear()
            page.locator('#exp-launch').click()
            for key, value in {'identity':'remember', 'payload':'reject', 'expiry':'repeat', 'unknown':'pause'}.items():
                page.locator(f'[data-policy-field="{key}"][data-policy-value="{value}"]').click()
            move('test')
            expect(page.locator('.exp-test-case.failed')).to_have_count(4)
            expect(page.locator('#exp-submit')).to_be_disabled()
            shot('expedition-unsafe-policy.png')
            page.locator('[data-policy-field="expiry"][data-policy-value="check"]').click()
            move('test'); expect(page.locator('.exp-test-case.passed')).to_have_count(7)
            page.locator('#exp-submit').click(); expect(page.locator('.exp-world')).to_have_class('exp-world is-restored')
            shot('expedition-ending.png')
            page.locator('#exp-continue').click(); expect(page.locator('#exp-launch')).to_contain_text('Take the detour')
            checks.append('retry-forever fails four counterexamples; safe rule passes seven; bridge ending changes the world and unlocks real detour')
            page.locator('#exp-launch').click(); move('send'); move('wait'); move('inspect')
            expect(page.locator('#exp-parts')).to_have_text('0 gears made')
            expect(page.locator('#exp-knowledge')).to_contain_text('Order proven absent')
            dropped = {'done': False}
            def lose_ack(route):
                if not dropped['done']:
                    dropped['done'] = True; route.fetch(); route.abort('failed')
                else: route.continue_()
            page.route('**/api/commands/save', lose_ack)
            page.locator('[data-action="retry"]').click()
            expect(page.locator('#exp-retry-save')).to_be_visible()
            page.locator('#exp-retry-save').click()
            expect(page.locator('#exp-parts')).to_have_text('1 gear made')
            page.unroute('**/api/commands/save', lose_ack)
            move('collect'); clear()
            checks.append('detour has two-hour memory and actually absent initial order; dropped acknowledgement retries one command without duplicating moves')
            state = page.evaluate("async () => (await fetch('/api/state')).json()")
            assert all(m['status'] == 'cleared' for m in state['course']['expedition'])
            assert state['attempt']['assessment']['independence'] == 'assisted'
            assert state['attempt']['practice_xp'] == 50
            for width in [390, 320]:
                mobile = browser.new_context(viewport={'width':width,'height':844}, reduced_motion='reduce', has_touch=True)
                mp = mobile.new_page(); mp.on('pageerror', lambda e: errors.append(str(e))); mp.goto(url + "/?play=expedition")
                expect(mp.locator('#exp-launch')).to_be_visible(); mp.locator('#exp-launch').click()
                expect(mp.locator('[data-action="send"]')).to_be_visible()
                mp.locator('[data-action="send"]').tap()
                expect(mp.locator('#exp-parts')).to_have_text('1 gear made')
                assert mp.evaluate('document.documentElement.scrollWidth <= innerWidth')
                assert mp.locator('.exp-message').evaluate("n => getComputedStyle(n).animationName") == 'none'
                mp.screenshot(path=str(artifacts / f'expedition-mobile-{width}.png'), full_page=True)
                if width == 390:
                    before_text = mp.locator("#exp-feedback").evaluate("n => parseFloat(getComputedStyle(n).fontSize)")
                    mp.evaluate("document.documentElement.style.fontSize='200%'")
                    assert mp.locator("#exp-feedback").evaluate("n => parseFloat(getComputedStyle(n).fontSize)") >= before_text * 1.99
                    mp.evaluate('window.scrollTo(0, 0)')
                    mp.screenshot(path=str(artifacts / 'expedition-text-200.png'), full_page=True)
                    overflow = mp.evaluate("""() => [...document.querySelectorAll('body *')].map(n => {
                        const r=n.getBoundingClientRect(); return {tag:n.tagName, id:n.id,
                        className:n.getAttribute('class'), left:r.left, right:r.right, width:r.width};
                    }).filter(n => n.width && (n.left < -1 || n.right > innerWidth + 1))""")
                    (artifacts/'expedition-overflow-diagnostic.json').write_text(json.dumps(overflow, indent=2))
                    assert mp.evaluate('document.documentElement.scrollWidth <= innerWidth'), overflow
                    mp.locator('[data-action="retry"]').tap()
                    expect(mp.locator('#exp-knowledge')).to_contain_text('Gear confirmed')
                    mp.locator('[data-action="collect"]').tap()
                    expect(mp.locator('#exp-submit')).to_be_enabled()
                isolated = mp.evaluate("async () => (await fetch('/api/state')).json()")
                assert isolated['learner_id'] != state['learner_id']
                assert isolated['course']['expedition'][1]['status'] == 'locked'
                mobile.close()
            checks.append('fresh isolated touch sessions at 390px and 320px; reduced motion; enlarged root text; no horizontal overflow')
            assert errors == [], errors
            report = {'result':'passed','browser':browser.version,'checks':checks,'page_errors':errors,'independent_critic_score':None,'acceptance':'independent_critic_pending','audience_validation':'No child or young-adult playtest; machine checks are not enjoyment evidence.'}
            (artifacts/'expedition-browser-report.json').write_text(json.dumps(report, indent=2))
            print(json.dumps(report, indent=2))
        finally:
            shot('expedition-last-screen.png')
            context.tracing.stop(path=str(artifacts/'expedition-browser-trace.zip'))
            browser.close(); stop_server(process)


if __name__ == '__main__': main()
