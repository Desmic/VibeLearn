"""Active player-entry contract: Bellweather -> First Words, PlayCanvas only."""
import tempfile
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT=Path(__file__).resolve().parents[1]
HEADERS={'Content-Type':'application/json','X-Learning-Command':'1'}


def main():
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'entry.db');browser=p.chromium.launch()
        try:
            # The root source must not boot the retired Relay Rescue/2D migration stack.
            request=browser.new_context().request
            root=request.get(url+'/')
            assert root.ok
            html=root.text()
            for retired in ('rescue-game.js','rescue.js','expedition.js','play-canvas-migrate.js','Relay Rescue'):
                assert retired not in html,retired
            assert 'BRING BACK THE WORDS' in html
            assert '/auth-game.js' in html

            legacy=request.get(url+'/word-machine',max_redirects=0)
            assert legacy.status==302,legacy.status
            assert legacy.headers.get('location')=='/first-words'

            # Local development has no auth gate, so root immediately enters Level 1.
            page=browser.new_page(viewport={'width':390,'height':844})
            page.goto(url+'/')
            page.wait_for_url('**/first-words',timeout=20000)
            expect(page.locator('#rgi-intro')).to_be_visible(timeout=20000)
            assert page.locator('#rescue-game').count()==0
            assert page.locator('svg').count()==0
            expect(page.locator('.vl-playcanvas-engine')).to_be_visible()
            page.screenshot(path=str(ROOT/'artifacts/level1-entry-390.png'))

            # A preserved historical draft must not suppress the Bellweather opening
            # or force the player back to the retired game.
            old=browser.new_context(viewport={'width':390,'height':844})
            state=old.request.post(url+'/api/session',headers=HEADERS,data={})
            assert state.ok
            started=old.request.post(url+'/api/commands/start',headers=HEADERS,data={
                'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':'rescue-01'})
            assert started.ok,started.text()
            legacy_id=started.json()['id']
            q=old.new_page();q.goto(url+'/first-words')
            expect(q.locator('#rgi-intro')).to_be_visible(timeout=20000)
            q.get_by_role('button',name='Skip opening',exact=True).click()
            expect(q.locator('#saved')).to_have_text('Saved',timeout=15000)
            current=old.request.get(url+'/api/state')
            assert current.ok
            active=current.json()['attempt']
            assert active['snapshot']['mission']['id']=='ai-01-first-words'
            assert active['id']!=legacy_id
            q.reload();expect(q.locator('#rgi-intro')).to_have_count(0);expect(q.locator('#saved')).to_have_text('Saved',timeout=15000)
            old.close()

            # If the real 3D engine cannot load, fail closed with recovery. Never
            # reveal the retired illustrated/SVG game while the engine is missing.
            failed_ctx=browser.new_context(viewport={'width':390,'height':844})
            failed=failed_ctx.new_page()
            failed.route('**/vendor/playcanvas.mjs',lambda route:route.abort())
            failed.goto(url+'/')
            failed.wait_for_url('**/first-words',timeout=20000)
            expect(failed.get_by_role('button',name='Reload Bellweather',exact=True)).to_be_visible(timeout=20000)
            assert failed.locator('#rescue-game').count()==0
            assert failed.locator('svg').count()==0
            assert failed.locator('.rg-world').count()==0
            failed.screenshot(path=str(ROOT/'artifacts/level1-no-fallback-390.png'))
            failed_ctx.close()
            # Exercise the hosted entry surface locally: missing engine imports
            # must not prevent sign-in controls or explicit 3D recovery from booting.
            entry_ctx=browser.new_context(viewport={'width':390,'height':844})
            entry=entry_ctx.new_page()
            entry.route('**/api/config',lambda route:route.fulfill(json={'hosted':True}))
            entry.route('**/api/state',lambda route:route.fulfill(status=401,json={'message':'Sign in'}))
            entry.route('**/vendor/playcanvas.mjs',lambda route:route.abort())
            entry.goto(url+'/')
            expect(entry.get_by_role('button',name='Retry 3D',exact=True)).to_be_visible(timeout=20000)
            expect(entry.locator('#login-email')).to_be_enabled()
            expect(entry.locator('#login-submit')).to_be_enabled()
            assert entry.locator('svg').count()==0
            entry_ctx.close()
            print('Level 1 entry, historical-draft continuity and no-fallback gate passed')
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
