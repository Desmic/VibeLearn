"""Active player-entry contract: Bellweather -> First Words, PlayCanvas only."""
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT=Path(__file__).resolve().parents[1]


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

            # If the real 3D engine cannot load, fail closed with recovery. Never
            # reveal the retired illustrated/SVG game while the engine is missing.
            failed=browser.new_context(viewport={'width':390,'height':844}).new_page()
            failed.route('**/vendor/playcanvas.mjs',lambda route:route.abort())
            failed.goto(url+'/first-words')
            expect(failed.get_by_role('button',name='Reload Bellweather',exact=True)).to_be_visible(timeout=20000)
            assert failed.locator('#rescue-game').count()==0
            assert failed.locator('svg').count()==0
            assert failed.locator('.rg-world').count()==0
            failed.screenshot(path=str(ROOT/'artifacts/level1-no-fallback-390.png'))
            print('Level 1 entry and no-fallback gate passed')
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
