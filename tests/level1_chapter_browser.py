"""Active whole-Level-1 chapter gate: teach -> succeed -> challenge -> recover."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server
from tests.first_words_browser import until

ROOT=Path(__file__).resolve().parents[1]


def action(page,name):
    with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST') as saved:
        page.get_by_role('button',name=name,exact=True).click()
    assert saved.value.ok,saved.value.status
    expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)


def choose(page,open_label,choice):
    page.get_by_role('button',name=open_label,exact=True).click();expect(page.locator('#choice')).to_be_visible()
    with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST') as saved:
        page.get_by_role('button',name=choice,exact=True).click()
    assert saved.value.ok,saved.value.status
    expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)


def generate(page):
    action(page,'Make first word')
    for _ in range(3):action(page,'Next word')
    action(page,'Speak to gate →')


def complete_guided_rescue(page):
    action(page,'Connect the power lead')
    expect(page.locator('#stage-name')).to_have_text('TUTORIAL · 2/3')
    expect(page.get_by_role('button',name='Scan Zip’s Moon plaque',exact=True)).to_be_visible()
    expect(page.get_by_role('button',name='Generate from this input',exact=True)).to_have_count(0)
    expect(page.get_by_role('button',name='Inspect the speech engine')).to_be_hidden()
    action(page,'Scan Zip’s Moon plaque')
    expect(page.locator('#stage-name')).to_have_text('TUTORIAL · 3/3')
    expect(page.locator('#detail')).to_contain_text('Make first word')
    generate(page);until(page,'()=>!FirstWordsReview.runtime.world.animating')
    expect(page.locator('#goal')).to_have_text('Zip is free.')
    expect(page.locator('#detail')).to_have_text('Nice. Zip can speak again.')


def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);errors=[];checks=[]
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'level1-chapter.db');browser=p.chromium.launch()
        try:
            page=browser.new_page(viewport={'width':390,'height':844},has_touch=True)
            page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url+'/first-words')
            page.get_by_role('button',name='Skip opening',exact=True).click();expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)
            expect(page.locator('#stage-name')).to_have_text('TUTORIAL · 1/3')
            complete_guided_rescue(page)
            page.screenshot(path=str(out/'level1-first-success-390.png'))
            checks.append('Tutorial gives one obvious action at a time, hides optional inspection, and gives a guaranteed first rescue before normal failure.')

            action(page,'Continue with Zip →')
            expect(page.locator('#stage-name')).to_have_text('TOWER ROUTE · CHALLENGE')
            expect(page.get_by_role('button',name='Inspect the speech engine')).to_be_visible()
            # Route boards remain tappable when they happen to be in frame, but
            # Level 1 never requires camera hunting. The explicit route-sign list
            # is the canonical easy path into the context-selection challenge.
            choose(page,'Check route signs','Old sign · “Take the Moon gate.”')
            expect(page.locator('#context')).to_contain_text('Old route')
            choose(page,'Predict the gate','Moon')
            expect(page.get_by_role('button',name='Predict the next input',exact=True)).to_have_count(0)
            generate(page);expect(page.locator('#goal')).to_have_text('Wrong route.')
            page.screenshot(path=str(out/'level1-transfer-wrong-390.png'))
            choose(page,'Check route signs','Today’s notice · “Moon route closed. The tower bell answers the five-point lantern mark.”')
            expect(page.locator('#context')).to_contain_text('five-point lantern mark')
            generate(page);until(page,'()=>!FirstWordsReview.runtime.world.animating')
            expect(page.locator('#goal')).to_have_text('Route found.')
            action(page,'Finish Level 1 →');expect(page.locator('#goal')).to_have_text('The tower is open.',timeout=15000)
            expect(page.locator('#ending')).not_to_be_visible();page.screenshot(path=str(out/'level1-ending-world-390.png'))
            page.get_by_role('button',name='Look toward the printing loft',exact=True).click();expect(page.locator('#ending')).to_be_visible()
            expect(page.locator('#reflection')).to_contain_text('first context choice was stale')
            expect(page.locator('#reflection')).to_contain_text('watched each new word')
            page.get_by_role('button',name='Stay in Bellweather',exact=True).click();page.reload();expect(page.locator('#goal')).to_have_text('The tower is open.',timeout=15000)
            checks.append('Changed-context challenge permits a normal wrong choice, preserves it, then recovers through the same simple route-sign control; world boards remain optional shortcuts.')

            for width in (360,430):
                ctx=browser.new_context(viewport={'width':width,'height':844},has_touch=True,reduced_motion='reduce');q=ctx.new_page();q.goto(url+'/first-words')
                q.get_by_role('button',name='Skip opening',exact=True).click();expect(q.locator('#saved')).to_have_text('Saved',timeout=15000)
                complete_guided_rescue(q);action(q,'Continue with Zip →')
                choose(q,'Check route signs','Today’s notice · “Moon route closed. The tower bell answers the five-point lantern mark.”')
                choose(q,'Predict the gate','Star');generate(q);action(q,'Finish Level 1 →');expect(q.locator('#goal')).to_have_text('The tower is open.',timeout=15000)
                assert q.evaluate('document.documentElement.scrollWidth<=innerWidth')
                q.screenshot(path=str(out/f'level1-complete-{width}-reduced.png'));ctx.close()
            checks.append('360/430 reduced-motion players follow the same tutorial and solve transfer without requiring camera or movement skill.')
            assert not errors,errors
            (out/'level1-chapter-report.json').write_text(json.dumps({'result':'passed','checks':checks,'page_errors':errors,'limits':'Automated Chromium emulation is not a novice human or physical-phone acceptance study.'},indent=2))
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()