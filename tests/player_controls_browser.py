"""Real-browser control, full-viewport and presentation isolation regression gate."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT=Path(__file__).resolve().parents[1]
VIEWPORTS=((390,844),(360,800),(430,932),(1440,1000),(844,390))

def player(page):
    return page.evaluate("async()=> (await import('/game-runtime.js')).getGameRuntime().stats().world.player")

def exposed_canvas_point(page):
    return page.evaluate('''() => {
      for(let y=innerHeight*.4;y<innerHeight*.7;y+=24)for(let x=innerWidth*.3;x<innerWidth*.8;x+=24){
        if(document.elementFromPoint(x,y)?.tagName==='CANVAS')return {x,y};
      }
      throw Error('World has no exposed drag area');
    }''')

def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);checks=[];errors=[]
    with tempfile.TemporaryDirectory() as tmp,sync_playwright() as p:
        proc,url=start_server(Path(tmp)/'player-controls.db');browser=p.chromium.launch()
        try:
            for width,height in VIEWPORTS:
                context=browser.new_context(viewport={'width':width,'height':height},has_touch=width<900,reduced_motion='reduce')
                page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
                try:
                    page.goto(url)
                    # Each viewport is a cold browser context. Engine imports and
                    # software-rendered startup on CI can exceed Playwright's
                    # default 5 seconds; keep a bounded readiness gate, separate
                    # from the interaction assertions below.
                    expect(page.locator('#rgi-world')).to_have_attribute('data-world-status','ready',timeout=15000)
                    story_before=page.locator('#rgi-fact').inner_text()
                    point=exposed_canvas_point(page)
                    page.mouse.move(**point);page.mouse.down();page.mouse.move(point['x']+40,point['y']+8,steps=8);page.mouse.up()
                    assert page.locator('#rgi-fact').inner_text()==story_before,'Camera drag triggered a story action'
                    page.locator('#rgi-skip').click()
                    expect(page.locator('.game-runtime-stage')).to_have_attribute('data-camera-mode','third-person')
                    initial=player(page)
                    assert page.evaluate("async()=> (await import('/game-runtime.js')).getGameRuntime().world.projectEntity('keeper-coat')?.visible"), 'Third-person avatar is not rendered in view'
                    world=page.locator('.rg-world').bounding_box()
                    assert all(abs(world[k]-v)<2 for k,v in [('x',0),('y',0),('width',width),('height',height)]),world
                    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight'), 'Document scrolls during play'
                    assert page.locator('.rg-objective h1').evaluate('el=>{const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return r.width>0&&r.height>0&&r.right<=p.right&&r.bottom<=p.bottom;}'), 'Primary objective is clipped'
                    before=page.evaluate('JSON.stringify(RescueGame.response())')
                    point=exposed_canvas_point(page)
                    page.mouse.move(**point);page.mouse.down();page.mouse.move(point['x']+54,point['y']+12,steps=8);page.mouse.up()
                    rotated=player(page);assert abs(rotated['yaw']-initial['yaw'])>5,(initial,rotated)
                    page.locator('[data-view="in"]').click();assert player(page)['distance']<initial['distance']
                    page.locator('[data-view="recenter"]').click();assert player(page)['yaw']==initial['yaw']
                    page.locator('.game-runtime-stage').focus();page.keyboard.down('KeyW');page.wait_for_timeout(450);page.keyboard.up('KeyW')
                    moved=player(page);assert moved['position']!=initial['position'],(moved,initial)
                    assert page.evaluate('JSON.stringify(RescueGame.response())')==before,'Camera/movement mutated evidence'
                    page.locator('#rg-options').click();page.keyboard.down('KeyW');page.wait_for_timeout(180);page.keyboard.up('KeyW')
                    assert player(page)['position']==moved['position'],'Open menu did not suspend movement'
                    page.locator('#rg-options').click()
                    page.locator('[data-world-look="workshop"]').click()
                    expect(page.locator('[data-world-look="ticket"]')).to_be_enabled()
                    assert player(page)['position']==moved['position'],'HUD update reset player position'
                    assert player(page)['yaw']==moved['yaw'],'HUD update reset camera'
                    page.locator('#rg-options').click();page.locator('#rg-replay-story').click();expect(page.locator('#rgi-intro')).to_be_visible()
                    page.locator('#rgi-skip').click()
                    assert player(page)['position']==moved['position'],'Replay changed player position'
                    expect(page.locator('[data-world-look="ticket"]')).to_be_enabled()
                    if width<800:
                        stick=page.locator('.game-move-stick').bounding_box();assert stick
                        page.mouse.move(stick['x']+stick['width']/2,stick['y']+12);page.mouse.down();page.wait_for_timeout(300);page.mouse.up()
                        assert player(page)['position']!=moved['position'],'Movement stick does not move avatar'
                    page.screenshot(path=str(out/f'player-controls-{width}x{height}.png'))
                    checks.append(f'{width}x{height}: full viewport; exposed world; orbit/zoom/recenter; movement; evidence isolation; menu release; same-level/replay preservation')
                except Exception:
                    page.screenshot(path=str(out/f'player-controls-failure-{width}x{height}.png'))
                    raise
                finally:context.close()
            assert errors==[],errors
            (out/'player-controls-browser-report.json').write_text(json.dumps({'result':'passed','checks':checks,'page_errors':errors,'review_method':'automated Chromium interaction; not a physical-device or user acceptance test'},indent=2))
        finally:browser.close();stop_server(proc)

if __name__=='__main__':main()
