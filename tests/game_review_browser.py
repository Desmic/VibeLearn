"""Critic-directed regression/3D evidence, not a human enjoyment measurement."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parent.parent


def main():
    artifacts=ROOT/'artifacts';artifacts.mkdir(exist_ok=True)
    checks=[];errors=[]
    with tempfile.TemporaryDirectory() as directory, sync_playwright() as p:
        process,url=start_server(Path(directory)/'review.sqlite3')
        browser=p.chromium.launch()
        context=browser.new_context(viewport={'width':1280,'height':900})
        context.tracing.start(screenshots=True,snapshots=True,sources=True)
        page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        requests=[];page.on('request',lambda request:requests.append(request.url))
        def shot(name):
            page.evaluate('scrollTo(0,0)');page.screenshot(path=str(artifacts/name),full_page=True)
        def action(name):
            page.locator(f'[data-action="{name}"]').click()
            expect(page.locator('#hud-save-value')).to_have_text('Synced')
        def pick(name):
            # A pointer cannot select a mesh behind the sticky HUD. Bring the
            # scene into view exactly as a player would, then use its projection.
            page.locator('.valley-canvas').evaluate("n => n.scrollIntoView({block:'center'})")
            point=page.evaluate('(name) => window.Expedition.scenePoint(name)', name)
            assert page.evaluate('(p) => document.elementFromPoint(p.x,p.y)?.classList.contains("valley-canvas")', point), point
            page.mouse.click(point['x'],point['y'])
        def finish():
            page.locator('#exp-submit').click();expect(page.locator('.exp-resolution')).to_be_visible()
            page.locator('#exp-continue').click();page.locator('#exp-launch').click()
        try:
            page.goto(url+'/?world=3d');page.locator('#exp-launch').click()
            expect(page.locator('.has-three canvas')).to_be_visible()
            page.wait_for_function('window.Expedition.sceneStats()?.drawCalls > 0')
            initial=page.evaluate('window.Expedition.sceneStats()')
            assert initial['revision']=='180' and initial['drawCalls']>0
            shot('review-three-first.png')
            # Actual projected 3D objects and pointer raycasts, not command mocks.
            pick('Send post')
            expect(page.locator('#exp-parts')).to_have_text('1 gear made')
            expect(page.locator('#exp-knowledge')).to_contain_text('No confirmation')
            expect(page.locator('#hud-save-value')).to_have_text('Synced')
            shot('review-three-send.png')
            canvas_count=page.locator('canvas.valley-canvas').count();assert canvas_count==1
            checks.append('Pinned Three.js rendered; selecting the send-post mesh commits one real action; uncertain knowledge remains distinct.')
            page.locator('[data-action="retry"]').focus();page.keyboard.press('Enter')
            expect(page.locator('#exp-knowledge')).to_contain_text('Gear confirmed')
            expect(page.locator('[data-action="collect"]')).to_be_focused()
            action('collect');finish()
            action('send');action('restart');pick('Journal')
            expect(page.locator('#exp-ticket')).to_have_text('order-01')
            action('retry');action('collect');finish()
            action('send');action('wait');action('inspect');action('collect');finish()
            checks.append('Journal object restores durable intent; keyboard focus follows the next meaningful action.')
            legends=page.locator('.exp-policy legend').all_text_contents()
            assert [x.split(' ')[0] for x in legends]==['1','2','3','4'],legends
            page.locator('[data-policy-field="identity"][data-policy-value="remember"]').click()
            page.locator('#campaign-button').click()
            expect(page.locator('#notice')).to_contain_text('Save your current move or rule')
            expect(page.locator('[data-policy-field="identity"][data-policy-value="remember"]')).to_have_attribute('aria-pressed','true')
            page.reload()
            expect(page.locator('[data-policy-field="identity"][data-policy-value="remember"]')).to_have_attribute('aria-pressed','true')
            expect(page.locator('#notice')).to_contain_text('Recovered unsaved progress')
            for key,value in {'payload':'reject','expiry':'check','unknown':'pause'}.items():page.locator(f'[data-policy-field="{key}"][data-policy-value="{value}"]').click()
            action('test');page.locator('#exp-submit').click()
            expect(page.locator('#exp-continue')).to_be_visible()
            expect(page.locator('.exp-policy')).not_to_be_visible()
            page.locator('summary',has_text='Inspect the completed storm engine').click()
            expect(page.locator('.exp-test-case.passed')).to_have_count(7)
            page.locator('summary',has_text='Inspect the completed storm engine').click()
            shot('review-three-ending.png')
            checks.append('Numbered boss rules stay ordered; unsaved choice survives map attempt/reload; ending precedes optional technical postmortem.')
            page.locator('#exp-continue').click();page.locator('#exp-launch').click()
            expect(page.locator('.has-three canvas')).to_be_visible()
            page.evaluate("document.querySelector('.valley-canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()")
            expect(page.locator('.has-three')).to_have_count(0)
            action('send');action('wait');action('inspect');action('retry');action('collect')
            expect(page.locator('#exp-submit')).to_be_enabled()
            checks.append('Actual WebGL context loss restores the illustrated scene; detour remains playable without 3D.')
            assert not [u for u in requests if not u.startswith(url)], requests
            checks.append('All learner-session network requests remain same-origin; no runtime CDN dependency.')
            fallback=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce',has_touch=True)
            fp=fallback.new_page();fp.route('**/valley3d.js',lambda route:route.abort('failed'))
            fp.goto(url+'/?world=3d');fp.locator('#exp-launch').click()
            expect(fp.locator('.valley-fallback')).to_be_visible();fp.locator('[data-action="send"]').tap()
            expect(fp.locator('#exp-parts')).to_have_text('1 gear made')
            assert fp.evaluate('document.documentElement.scrollWidth <= innerWidth')
            fp.screenshot(path=str(artifacts/'review-three-fallback-mobile.png'),full_page=True)
            fallback.close()
            checks.append('Renderer-load failure leaves a readable, touch-operable narrow-screen fallback.')
            assert errors==[],errors
            report={'result':'passed','method':'builder-directed automated browser probes and later screenshot/trace review; not a separate agent or youth playtest','browser':browser.version,'renderer':initial,'checks':checks,'page_errors':errors,'game_score':None,'educational_equivalence':'unvalidated'}
            (artifacts/'game-review-probes.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
        finally:
            shot('review-last-screen.png');context.tracing.stop(path=str(artifacts/'game-review-trace.zip'))
            browser.close();stop_server(process)


if __name__=='__main__': main()
