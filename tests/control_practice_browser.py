"""Control familiarity precedes speech repair without changing learning evidence."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT=Path(__file__).resolve().parents[1]


def main():
    trace=[]
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'practice.db');browser=p.chromium.launch()
        try:
            for width in (1280,390):
                ctx=browser.new_context(viewport={'width':width,'height':844},has_touch=width<500)
                page=ctx.new_page();page.goto(url+'/first-words')
                page.get_by_role('button',name='Skip opening',exact=True).click()
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · MOVE')
                trace.append({'width':width,'step':'move','focus':'move','passed':True})
                expect(page.locator('#world')).to_have_attribute('data-tutorial-focus','move')
                expect(page.get_by_role('button',name='Connect the loose power lead',exact=True)).to_be_hidden()
                page.screenshot(path=str(ROOT/f'artifacts/control-practice-move-{width}.png'))
                before=page.evaluate('JSON.stringify(FirstWordsReview.state)')
                expect(page.locator('#output')).to_be_hidden()
                if width<500:
                    page.get_by_role('button',name='Move right',exact=True).focus()
                    page.keyboard.press('Enter')
                else:
                    page.keyboard.down('KeyD');page.wait_for_timeout(180);page.keyboard.up('KeyD')
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · LOOK')
                trace.append({'width':width,'step':'look','focus':'look','passed':True})
                expect(page.locator('#world')).to_have_attribute('data-tutorial-focus','look')
                page.screenshot(path=str(ROOT/f'artifacts/control-practice-look-{width}.png'))
                page.reload()
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · LOOK')
                page.get_by_role('button',name='Zoom camera in',exact=True).click()
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · MENU')
                trace.append({'width':width,'step':'menu','focus':'menu','passed':True})
                expect(page.locator('#world')).to_have_attribute('data-tutorial-focus','menu')
                assert page.locator('#menu-open').evaluate("el=>el.classList.contains('tutorial-focus')")
                page.screenshot(path=str(ROOT/f'artifacts/control-practice-menu-prompt-{width}.png'))
                page.get_by_role('button',name='Open game menu',exact=True).click()
                page.screenshot(path=str(ROOT/f'artifacts/control-practice-menu-open-{width}.png'))
                expect(page.locator('#menu')).to_be_visible()
                page.get_by_role('button',name='Close game menu',exact=True).click()
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 1/4')
                expect(page.locator('#world')).to_have_attribute('data-tutorial-world-target','loose-plug')
                trace.append({'width':width,'step':'repair-handoff','target':'loose-plug','passed':True})
                assert page.evaluate('JSON.stringify(FirstWordsReview.state)')==before
                expect(page.get_by_role('button',name='Connect the loose power lead',exact=True)).to_be_visible()
                page.screenshot(path=str(ROOT/f'artifacts/control-practice-handoff-{width}.png'))
                with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST') as saved:
                    page.get_by_role('button',name='Connect the loose power lead',exact=True).click()
                assert saved.value.ok,saved.value.status
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 2/4')
                trace.append({'width':width,'step':'repair-connect-complete','next':'scan','passed':True})
                page.reload();expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 2/4')
                ctx.close()

            ctx=browser.new_context(viewport={'width':360,'height':800})
            page=ctx.new_page();page.goto(url+'/first-words')
            page.get_by_role('button',name='Skip opening',exact=True).click()
            expect(page.locator('#stage-name')).to_have_text('TUTORIAL · MOVE')
            before=page.evaluate('JSON.stringify(FirstWordsReview.state)')
            page.get_by_role('button',name='Skip control practice',exact=True).click()
            expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 1/4')
            assert page.evaluate('JSON.stringify(FirstWordsReview.state)')==before
            page.reload();expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 1/4')
            ctx.close()
            (ROOT/'artifacts'/'first-words-tutorial-interaction-trace.json').write_text(json.dumps({'schema':'vibelearn.interactive-trace.v1','suite':'first-words-tutorial','observations':trace},indent=2))
            print('Control practice: actual movement/camera/menu, reload, skip and evidence isolation passed',flush=True)
        finally:
            browser.close();stop_server(proc)


if __name__=='__main__':main()
