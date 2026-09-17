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
            log('Prologue: navigate');page.goto(url+'/first-words')
            expect(page.locator('#rgi-intro')).to_be_visible(timeout=20000)
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            expect(page.locator('#rgi-title')).to_have_text('Bellweather is alive.')
            expect(page.locator('#rgi-body')).to_contain_text('Zip is home with friends')
            page.screenshot(path=str(out/'prologue-home-390.png'),timeout=15000)

            log('Prologue: rupture');page.get_by_role('button',name='Continue →',exact=True).click()
            expect(page.locator('#rgi-title')).to_have_text('The sky cracks open.')
            until(page,"()=>FirstWordsReview.audio.ready && FirstWordsReview.audio.version==='bellweather-score-v2' && FirstWordsReview.audio.scheduledBars>0")
            until(page,"()=>FirstWordsReview.audio.phase==='danger'")
            page.get_by_role('button',name='Pause story motion').click()
            until(page,"()=>FirstWordsReview.audio.state==='suspended'")
            assert page.get_by_role('button',name='Continue →',exact=True).is_disabled()
            page.screenshot(path=str(out/'prologue-rupture-paused-390.png'),timeout=15000)
            page.get_by_role('button',name='Resume story motion').click()
            page.get_by_role('button',name='Toggle opening sound').click()
            assert page.evaluate('FirstWordsReview.audio.preferences.muted')
            until(page,'()=>!FirstWordsReview.runtime.world.animating')

            log('Prologue: limbo');page.get_by_role('button',name='Continue →',exact=True).click()
            expect(page.locator('#rgi-title')).to_have_text('Silence.')
            expect(page.locator('#rgi-body')).to_contain_text('Zip wakes alone')
            page.screenshot(path=str(out/'prologue-limbo-390.png'),timeout=15000)

            log('Prologue: prison reveal');page.get_by_role('button',name='Continue →',exact=True).click()
            expect(page.locator('#rgi-title')).to_have_text('This is not home.')
            expect(page.get_by_role('button',name='SEALED EXIT',exact=True)).to_be_visible()
            page.screenshot(path=str(out/'prologue-prison-reveal-390.png'),timeout=15000)

            log('Prologue: speech theft');page.get_by_role('button',name='Continue →',exact=True).click()
            expect(page.locator('#rgi-title')).to_have_text('It takes Zip’s voice.')
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            page.screenshot(path=str(out/'prologue-speech-theft-390.png'),timeout=15000)

            log('Prologue: repair handoff');page.get_by_role('button',name='Continue →',exact=True).click()
            expect(page.locator('#rgi-title')).to_have_text('Get the words back.')
            expect(page.get_by_role('button',name='REPAIR SOCKET',exact=True)).to_be_visible()
            instance=page.evaluate('FirstWordsReview.runtime.instanceId')
            page.screenshot(path=str(out/'prologue-repair-handoff-390.png'),timeout=15000)
            page.get_by_role('button',name='Take control →',exact=True).click()
            expect(page.get_by_role('button',name='Connect the power lead',exact=True)).to_be_visible(timeout=15000)
            expect(page.locator('#stage-name')).to_have_text('TUTORIAL · 1/3')
            expect(page.locator('#saved')).to_have_text('Saved')
            until(page,"()=>FirstWordsReview.audio.phase==='repair'")
            assert page.evaluate('FirstWordsReview.runtime.instanceId')==instance
            assert page.evaluate("FirstWordsReview.runtime.mode")=='mission'
            checks.append('Six causal prologue beats establish happy Bellweather, rupture, isolation, prison reveal, visible speech loss and repair handoff before the separate tutorial; the same runtime becomes direct-control mission play.')
            checks.append('The Bellweather score is not required before a gesture; the first Continue gesture unlocks bellweather-score-v2 and schedules bars before danger-phase assertions.')

            before=page.evaluate('JSON.stringify(FirstWordsReview.state)')
            log('Prologue: replay preserves draft');page.get_by_role('button',name='Open game menu').click();page.get_by_role('button',name='Replay the prologue',exact=True).click()
            page.get_by_role('button',name='Return to game',exact=True).click()
            assert page.evaluate('JSON.stringify(FirstWordsReview.state)')==before
            page.reload();expect(page.get_by_role('button',name='Connect the power lead',exact=True)).to_be_visible(timeout=15000);expect(page.locator('#rgi-intro')).to_have_count(0)
            checks.append('Explicit prologue replay is presentation-only; returning tutorial state resumes without replaying the prologue.')

            for width,height in [(360,800),(430,932),(1280,800)]:
                log(f'Prologue: fresh reduced-motion {width}')
                ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce',has_touch=width<500)
                q=ctx.new_page();q.set_default_timeout(15000);q.on('pageerror',lambda e:errors.append(str(e)));q.goto(url+'/first-words')
                expect(q.locator('#rgi-title')).to_have_text('Bellweather is alive.',timeout=20000)
                q.get_by_role('button',name='Continue →',exact=True).click();expect(q.locator('#rgi-title')).to_have_text('The sky cracks open.')
                q.get_by_role('button',name='Continue →',exact=True).click();expect(q.locator('#rgi-title')).to_have_text('Silence.')
                q.get_by_role('button',name='Continue →',exact=True).click();expect(q.get_by_role('button',name='SEALED EXIT',exact=True)).to_be_visible()
                q.get_by_role('button',name='Continue →',exact=True).click();expect(q.locator('#rgi-title')).to_have_text('It takes Zip’s voice.')
                q.get_by_role('button',name='Continue →',exact=True).click();expect(q.get_by_role('button',name='REPAIR SOCKET',exact=True)).to_be_visible()
                expect(q.get_by_role('button',name='Take control →',exact=True)).to_be_enabled()
                assert q.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
                for selector in ['#rgi-title','#rgi-body','#rgi-next','#rgi-skip']:
                    b=q.locator(selector).bounding_box();assert b and b['x']>=0 and b['y']>=0 and b['x']+b['width']<=width+1 and b['y']+b['height']<=height+1,(selector,b)
                q.screenshot(path=str(out/f'prologue-reduced-{width}.png'),timeout=15000)
                q.get_by_role('button',name='Skip opening',exact=True).click();expect(q.get_by_role('button',name='Connect the power lead',exact=True)).to_be_visible(timeout=15000);ctx.close()
            assert not errors,errors
            checks.append('Fresh 360/430/desktop reduced-motion preserves the same six story states and can skip safely into the separate tutorial without a 2D fallback.')
            (out/'first-words-opening-report.json').write_text(json.dumps({'result':'passed','checks':checks,'page_errors':errors,'scope':'Prologue only. Audio lifecycle and phase changes are automated after an explicit player gesture; subjective mix/appeal, physical-phone feel and human acceptance remain unassessed.'},indent=2))
            log('Prologue gate passed')
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()