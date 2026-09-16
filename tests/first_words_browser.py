"""Real browser/HTTP/SQLite Level 1 gates. Test data is always disposable."""
import json
import re
import tempfile
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT=Path(__file__).resolve().parents[1]

def until(page,expression,seconds=25):
    deadline=time.monotonic()+seconds
    while time.monotonic()<deadline:
        if page.evaluate(expression):return
        page.wait_for_timeout(80)
    raise AssertionError(expression)

def action(page,name):
    local_choices={'Read the route notices','Check the route notices','Predict the gate','What goes into the next step?'}
    if name in local_choices:
        page.get_by_role('button',name=name,exact=True).click()
        expect(page.locator('#choice')).to_be_visible()
    else:
        with page.expect_response(lambda response:'/api/commands/' in response.url and response.request.method=='POST') as saved:
            page.get_by_role('button',name=name,exact=True).click()
        assert saved.value.ok, saved.value.status
        expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)

def generate(page):
    action(page,'Make the first piece')
    for _ in range(3):action(page,'Make the next piece')
    action(page,'Speak to the gate →')

def check_missing_assets(browser,url):
    for missing in ['/vendor/playcanvas.mjs','/assets/quaternius-animated-robot.glb']:
        ctx=browser.new_context();q=ctx.new_page();commands=[]
        q.on('request',lambda req:commands.append(req.url) if '/api/commands/' in req.url else None)
        print('Checking missing asset: '+missing,flush=True)
        q.route('**'+missing,lambda route:route.abort());q.goto(url+'/first-words')
        try:expect(q.get_by_role('button',name='Reload Bellweather',exact=True)).to_be_visible(timeout=20000)
        except Exception:
            print(q.locator('body').inner_text(),flush=True)
            q.screenshot(path=str(ROOT/'artifacts/first-words-assets-failure.png'));raise
        assert not commands;ctx.close()

def main(*,rescue_only=False,assets_only=False):
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);checks=[];errors=[]
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'first-words.db');browser=p.chromium.launch()
        try:
            if assets_only:
                check_missing_assets(browser,url);return
            context=browser.new_context(viewport={'width':390,'height':844},has_touch=True)
            page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
            page.goto(url+'/first-words');expect(page.locator('#rgi-intro')).to_be_visible(timeout=20000)
            instance=page.evaluate('FirstWordsReview.runtime.instanceId')
            page.get_by_role('button',name='Give Zip a hand tap',exact=True).click()
            expect(page.locator('#rgi-fact')).to_contain_text('Best team')
            page.get_by_role('button',name='Continue →',exact=True).click()
            page.get_by_role('button',name='Pause story motion').click()
            until(page,"()=>document.querySelector('#rgi-intro').classList.contains('rgi-paused')")
            until(page,"()=>FirstWordsReview.audio.state==='suspended'")
            page.get_by_role('button',name='Resume story motion').click()
            page.get_by_role('button',name='Continue →',exact=True).click()
            page.get_by_role('button',name='Help Zip →',exact=True).click()
            expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)
            assert page.evaluate('FirstWordsReview.runtime.instanceId')==instance
            checks.append('Three animated opening beats, pause/resume audio, same runtime into saved Level 1.')
            action(page,'Connect the power lead');action(page,'Make the first piece')
            expect(page.locator('#context')).to_contain_text('Open a gate. Open')
            page.reload();expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)
            expect(page.locator('#rgi-intro')).to_have_count(0)
            for _ in range(3):action(page,'Make the next piece')
            action(page,'Speak to the gate →');expect(page.locator('#goal')).to_contain_text('wrong gate')
            expect(page.locator('#world')).to_have_attribute('aria-label',re.compile('Zip is behind the Moon gate'))
            page.screenshot(path=str(out/'first-words-wrong-390.png'))
            for width,height in [(360,800),(390,844),(430,932),(1280,800)]:
                page.set_viewport_size({'width':width,'height':height});page.get_by_role('button',name='Recenter camera',exact=True).click()
                page.wait_for_timeout(180)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
                for selector in ['#goal','#controls','#actions button']:
                    for item in page.locator(selector).all():
                        b=item.bounding_box();assert b and b['x']>=0 and b['y']>=0 and b['x']+b['width']<=width+1 and b['y']+b['height']<=height+1,(selector,b)
                before=page.evaluate('FirstWordsReview.runtime.world.player.distance')
                page.get_by_role('button',name='Zoom camera in',exact=True).click()
                assert page.evaluate('FirstWordsReview.runtime.world.player.distance')<before
                page.get_by_role('button',name='Zoom camera out',exact=True).click()
                page.screenshot(path=str(out/f'first-words-framing-{width}.png'))
            page.set_viewport_size({'width':390,'height':844});page.get_by_role('button',name='Recenter camera',exact=True).click()
            action(page,'Scan Zip’s Moon plaque');action(page,'Make the first piece');action(page,'Make the next piece')
            page.get_by_role('button',name='Inspect the speech engine').click();expect(page.get_by_label('Moon illustrative score')).to_have_attribute('value','90')
            page.get_by_role('button',name='Close inspection').click()
            action(page,'Make the next piece');action(page,'Make the next piece');action(page,'Speak to the gate →')
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            expect(page.locator('#goal')).to_contain_text('Zip is free')
            expect(page.locator('#world')).to_have_attribute('aria-label',re.compile('Zip is free'))
            expect(page.locator('#scene-description')).to_have_text(re.compile(r'^Zip is free\.'))
            page.screenshot(path=str(out/'first-words-reunion-390.png'))
            checks.append('Power, growing input survives reload, wrong hatch, scan changes scores, animated reunion; post-save camera controls at four viewport sizes.')
            if rescue_only:
                page.reload();expect(page.locator('#goal')).to_contain_text('Zip is free',timeout=15000)
                expect(page.locator('#scene-description')).to_have_text(re.compile(r'^Zip is free\.'))
                assert not errors,errors
                (out/'first-words-rescue-report.json').write_text(json.dumps({'result':'passed','checks':checks+['Accessible reunion description survives reload.'],'page_errors':errors},indent=2))
                return
            action(page,'Head for the tower →')
            expect(page.locator('[data-anchor=star-label]')).to_be_visible()
            action(page,'Read the route notices')
            page.get_by_role('button',name='Old sign · “Take the Moon gate.”',exact=True).click()
            expect(page.locator('#saved')).to_have_text('Saved')
            action(page,'Predict the gate');page.get_by_role('button',name='Moon',exact=True).click();expect(page.locator('#saved')).to_have_text('Saved')
            action(page,'What goes into the next step?');page.get_by_role('button',name='The original input, unchanged',exact=True).click();expect(page.locator('#saved')).to_have_text('Saved')
            generate(page);expect(page.locator('#goal')).to_contain_text('wrong gate')
            action(page,'Check the route notices');page.get_by_role('button',name='Today’s notice · “Moon route closed. Use the Star gate.”',exact=True).click();expect(page.locator('#saved')).to_have_text('Saved')
            before=page.evaluate('JSON.stringify(FirstWordsReview.state)')
            page.get_by_role('button',name='Open game menu').click();page.get_by_role('button',name='Replay the opening',exact=True).click();page.get_by_role('button',name='Return to game',exact=True).click()
            assert page.evaluate('JSON.stringify(FirstWordsReview.state)')==before
            generate(page);until(page,'()=>!FirstWordsReview.runtime.world.animating')
            page.get_by_role('button',name='Finish Level 1 →',exact=True).click()
            expect(page.locator('#ending')).to_be_visible(timeout=15000)
            expect(page.locator('#reflection')).to_contain_text('first choice used a stale')
            expect(page.locator('#reflection')).to_contain_text('does not start again')
            page.screenshot(path=str(out/'first-words-ending-390.png'))
            page.get_by_role('button',name='Stay in Bellweather',exact=True).click()
            page.reload();expect(page.locator('#ending')).to_be_visible(timeout=15000)
            page.get_by_role('button',name='Stay in Bellweather',exact=True).click()
            checks.append('Exit predictions before feedback, wrong-context repair preserves first answers, isolated replay, completion and reload.')
            page.get_by_role('button',name='Open game menu').click();page.get_by_label('Music',exact=True).uncheck();page.get_by_label('Sound effects',exact=True).uncheck();page.get_by_label('Reduced motion',exact=True).check()
            page.get_by_role('button',name='Close game menu').click()
            assert page.evaluate('FirstWordsReview.audio.preferences.music') is False
            assert page.evaluate('FirstWordsReview.audio.preferences.effects') is False
            page.reload();expect(page.locator('#ending')).to_be_visible(timeout=15000);page.get_by_role('button',name='Stay in Bellweather',exact=True).click()
            assert page.evaluate('FirstWordsReview.audio.preferences.music') is False
            checks.append('Separate remembered music/effects controls; reduced-motion rebuild retains completed progress.')
            for width in [360,430]:
                phone=browser.new_context(viewport={'width':width,'height':844},has_touch=True,reduced_motion='reduce')
                q=phone.new_page();q.on('pageerror',lambda e:errors.append(str(e)));q.goto(url+'/first-words')
                q.get_by_role('button',name='Skip opening',exact=True).click();expect(q.locator('#saved')).to_have_text('Saved',timeout=15000)
                action(q,'Connect the power lead');generate(q);action(q,'Scan Zip’s Moon plaque');generate(q);action(q,'Head for the tower →');action(q,'Read the route notices')
                q.get_by_role('button',name='Today’s notice · “Moon route closed. Use the Star gate.”',exact=True).click();expect(q.locator('#saved')).to_have_text('Saved')
                action(q,'Predict the gate');q.get_by_role('button',name='Star',exact=True).click();expect(q.locator('#saved')).to_have_text('Saved')
                action(q,'What goes into the next step?');q.get_by_role('button',name='The input plus the new piece “Open”',exact=True).click();expect(q.locator('#saved')).to_have_text('Saved')
                generate(q);q.get_by_role('button',name='Finish Level 1 →',exact=True).click();expect(q.locator('#ending')).to_be_visible(timeout=15000)
                expect(q.locator('#reflection')).to_contain_text('current route notice');phone.close()
            checks.append('Fresh 360/430 reduced-motion learners finish the entire level with correct first predictions.')
            context.close()
            check_missing_assets(browser,url)
            assert not errors,errors
            (out/'first-words-browser-report.json').write_text(json.dumps({'result':'passed','checks':checks,'page_errors':errors,'limits':'Temporary SQLite; Chromium viewport/touch emulation, not physical devices or human acceptance. Audio lifecycle checked; perceived mix needs listening review.'},indent=2))
        except Exception:
            if not assets_only and not page.is_closed():page.screenshot(path=str(out/'first-words-browser-failure.png'))
            raise
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()


