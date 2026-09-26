"""Control familiarity precedes speech repair without changing learning evidence."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server, launch_browser
from tests.level1_chapter_browser import action,world_action

ROOT=Path(__file__).resolve().parents[1]


def check_marker_control_clearance(page,ctx,width,trace):
    # Walk away from the repair target using real input. Its off-screen cue must
    # not steal touches intended for either the movement stick or camera tools.
    page.keyboard.down('KeyW')
    try:
        # Poll through evaluate: wait_for_function uses eval under this older
        # Playwright version, which the game's strict CSP correctly rejects.
        for _ in range(120):
            page.wait_for_timeout(100)
            if page.evaluate('FirstWordsReview.runtime.world.player.position[2]') < -36.4:
                break
        else:
            raise AssertionError('Walking did not reach the closed-gate approach')
    finally:
        page.keyboard.up('KeyW')
    marker=page.get_by_role('button',name='Connect the loose power lead',exact=True)
    expect(marker).to_be_visible()
    page.wait_for_timeout(100)
    probe=page.evaluate('''() => {
      const marker=document.querySelector('.tutorial-target-marker:not([hidden])');
      const rect=marker.getBoundingClientRect();
      const backward=document.querySelector('[aria-label="Move backward"]');
      const b=backward.getBoundingClientRect();
      const point={x:b.x+b.width/2,y:b.y+b.height/2};
      const hit=document.elementFromPoint(point.x,point.y);
      const controls=[...document.querySelectorAll('.game-move-stick,.game-view-tools')]
        .map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height);
      return {marker:rect.toJSON(),point,hit:hit?.getAttribute('aria-label'),
        overlaps:controls.some(r=>rect.left<r.right&&rect.right>r.left&&rect.top<r.bottom&&rect.bottom>r.top),
        inside:rect.left>=0&&rect.right<=innerWidth};
    }''')
    page.screenshot(path=str(ROOT/f'artifacts/tutorial-marker-clearance-{width}.png'))
    assert probe['inside'] and not probe['overlaps'],probe
    assert probe['hit']=='Move backward',probe
    before=page.evaluate('({position:FirstWordsReview.runtime.world.player.position,state:JSON.stringify(FirstWordsReview.state)})')
    cdp=ctx.new_cdp_session(page)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[dict(probe['point'],radiusX=4,radiusY=4,force=1,id=1)]})
    try:
        page.wait_for_timeout(350)
    finally:
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        cdp.detach()
    after=page.evaluate('({position:FirstWordsReview.runtime.world.player.position,state:JSON.stringify(FirstWordsReview.state)})')
    assert after['position'][2]>before['position'][2]+.05,(before,after)
    assert after['state']==before['state'],(before,after)
    trace.append({'width':width,'step':'offscreen-target-control-clearance','probe':probe,
                  'action':'touch backward movement control','before':before['position'],
                  'after':after['position'],'learning_state_unchanged':True,'passed':True})


def main():
    trace=[]
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'practice.db');browser=launch_browser(p)
        try:
            for width in (1280,390,360,430):
                ctx=browser.new_context(viewport={'width':width,'height':844},has_touch=width<500)
                page=ctx.new_page();page.goto(url+'/first-words')
                page.on('pageerror',lambda error: print('control-practice page error:',error,flush=True))
                page.get_by_role('button',name='Skip opening',exact=True).click()
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · MOVE',timeout=45000)
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
                    # Software WebGL can take longer than 180 ms per frame. Keep
                    # the key held until the game observes movement, then release.
                    page.keyboard.down('KeyD')
                    try:expect(page.locator('#stage-name')).to_have_text('TUTORIAL · LOOK',timeout=30000)
                    finally:page.keyboard.up('KeyD')
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · LOOK',timeout=30000)
                trace.append({'width':width,'step':'look','focus':'look','passed':True})
                expect(page.locator('#world')).to_have_attribute('data-tutorial-focus','look')
                page.screenshot(path=str(ROOT/f'artifacts/control-practice-look-{width}.png'))
                page.reload()
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · LOOK',timeout=30000)
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
                expect(page.locator('#engine')).to_be_hidden()   # diegetic: panel stays folded, the world marker carries the verb
                page.screenshot(path=str(ROOT/f'artifacts/control-practice-handoff-{width}.png'))
                if width<500:
                    check_marker_control_clearance(page,ctx,width,trace)
                with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST') as saved:
                    page.get_by_role('button',name='Connect the loose power lead',exact=True).click()
                assert saved.value.ok,saved.value.status
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 2/4')
                trace.append({'width':width,'step':'repair-connect-complete','next':'scan','passed':True})
                page.reload();expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 2/4')
                # Scan and speak share the same physical anchor. Only the current
                # tutorial action may occupy it, including after a saved reload.
                expect(page.locator('.tutorial-target-marker:not([hidden])')).to_have_count(1)
                world_action(page,'Scan the Moon lock in the world')
                for index in range(4):
                    # The optional panel is folded during the actual world action.
                    # The carried device must show the input and every prior word
                    # before the player can make the next one, even on a narrow view.
                    state=page.evaluate('FirstWordsReview.state')
                    expect(page.locator('#engine')).to_be_hidden()
                    expect(page.locator('#learning-readout')).to_be_visible(timeout=15000)
                    expect(page.locator('#readout-request')).to_have_text(state['input'][0])
                    expect(page.locator('#readout-supplied')).to_have_text(state['input'][1])
                    expect(page.locator('#readout-words')).to_have_text(
                        ' '.join(state['output']) if state['output'] else 'No words yet')
                    box=page.locator('#learning-readout').bounding_box()
                    assert box and box['x']>=0 and box['x']+box['width']<=width and box['y']>=0 and box['y']+box['height']<=844,(width,index,box)
                    world_action(page,'Use the speech engine in the world')
                expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 4/4')
                expect(page.get_by_role('button',name='Scan the Moon lock in the world',exact=True)).to_be_hidden()
                expect(page.get_by_role('button',name='Speak the completed command to the Moon gate',exact=True)).to_be_visible()
                expect(page.locator('.tutorial-target-marker:not([hidden])')).to_have_count(1)
                trace.append({'width':width,'step':'shared-anchor-current-action-only','passed':True})
                ctx.close()

            ctx=browser.new_context(viewport={'width':360,'height':800})
            page=ctx.new_page();page.goto(url+'/first-words')
            page.get_by_role('button',name='Skip opening',exact=True).click()
            expect(page.locator('#stage-name')).to_have_text('TUTORIAL · MOVE',timeout=20000)
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
