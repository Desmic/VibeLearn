"""Opening-first gate. Does not play or certify the rest of Level 1."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server
from tests.first_words_browser import until

ROOT=Path(__file__).resolve().parents[1]

def log(message):print(message,flush=True)

def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);checks=[];errors=[]
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'opening.db');browser=p.chromium.launch()
        try:
            context=browser.new_context(viewport={'width':390,'height':844},has_touch=True)
            page=context.new_page();page.set_default_timeout(15000);page.on('pageerror',lambda e:errors.append(str(e)))
            log('Opening: navigate');page.goto(url+'/first-words')
            expect(page.locator('#rgi-intro')).to_be_visible(timeout=20000)
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            page.screenshot(path=str(out/'opening-home-390.png'),timeout=15000)
            log('Opening: friendship action');page.get_by_role('button',name='Give Zip a hand tap',exact=True).click()
            expect(page.locator('#rgi-fact')).to_contain_text('Best team')
            log('Opening: capture');page.get_by_role('button',name='Continue →',exact=True).click()
            page.get_by_role('button',name='Pause story motion').click()
            until(page,"()=>FirstWordsReview.audio.state==='suspended'")
            assert page.get_by_role('button',name='Continue →',exact=True).is_disabled()
            page.screenshot(path=str(out/'opening-capture-paused-390.png'),timeout=15000)
            log('Opening: resume');page.get_by_role('button',name='Resume story motion').click()
            page.get_by_role('button',name='Toggle opening sound').click()
            assert page.evaluate('FirstWordsReview.audio.preferences.muted')
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            log('Opening: Zip capture');page.get_by_role('button',name='Continue →',exact=True).click()
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            page.screenshot(path=str(out/'opening-zip-captured-390.png'),timeout=15000)
            instance=page.evaluate('FirstWordsReview.runtime.instanceId')
            log('Opening: tutorial handoff');page.get_by_role('button',name='Help Zip →',exact=True).click()
            expect(page.get_by_role('button',name='Connect the power lead',exact=True)).to_be_visible(timeout=15000)
            expect(page.locator('#saved')).to_have_text('Saved')
            assert page.evaluate('FirstWordsReview.runtime.instanceId')==instance
            before=page.evaluate('JSON.stringify(FirstWordsReview.state)')
            log('Opening: replay preserves draft');page.get_by_role('button',name='Open game menu').click();page.get_by_role('button',name='Replay the opening',exact=True).click()
            page.get_by_role('button',name='Return to game',exact=True).click()
            assert page.evaluate('JSON.stringify(FirstWordsReview.state)')==before
            page.reload();expect(page.get_by_role('button',name='Connect the power lead',exact=True)).to_be_visible(timeout=15000);expect(page.locator('#rgi-intro')).to_have_count(0)
            checks.append('Animated friendship/capture/Zip capture, pause and mute, same-runtime tutorial handoff, replay preserves draft and returning learner resumes without opening.')
            for width,height in [(360,800),(430,932),(1280,800)]:
                log(f'Opening: fresh reduced-motion {width}')
                ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce',has_touch=width<500)
                q=ctx.new_page();q.set_default_timeout(15000);q.on('pageerror',lambda e:errors.append(str(e)));q.goto(url+'/first-words')
                expect(q.get_by_role('button',name='Give Zip a hand tap',exact=True)).to_be_enabled(timeout=20000)
                q.get_by_role('button',name='Give Zip a hand tap',exact=True).click()
                q.get_by_role('button',name='Continue →',exact=True).click();q.get_by_role('button',name='Continue →',exact=True).click()
                expect(q.get_by_role('button',name='Help Zip →',exact=True)).to_be_enabled()
                assert q.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
                for selector in ['#rgi-title','#rgi-body','#rgi-next','#rgi-skip']:
                    b=q.locator(selector).bounding_box();assert b and b['x']>=0 and b['y']>=0 and b['x']+b['width']<=width+1 and b['y']+b['height']<=height+1,(selector,b)
                q.screenshot(path=str(out/f'opening-reduced-{width}.png'),timeout=15000)
                q.get_by_role('button',name='Skip opening',exact=True).click();expect(q.get_by_role('button',name='Connect the power lead',exact=True)).to_be_visible(timeout=15000);ctx.close()
            assert not errors,errors
            checks.append('Fresh 360/430/desktop reduced-motion still conveys final causal states and skips safely into tutorial; caption/control bounds and no page overflow.')
            (out/'first-words-opening-report.json').write_text(json.dumps({'result':'passed','checks':checks,'page_errors':errors,'scope':'Opening only. No complete-level, subjective sound quality, physical-phone or human-acceptance claim.'},indent=2))
            log('Opening gate passed')
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
