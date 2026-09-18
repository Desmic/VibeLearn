"""Exercise real Level 1 movement/camera controls after a persisted action and reload."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server
from tests.level1_chapter_browser import action,skip_opening_to_tutorial

ROOT=Path(__file__).resolve().parents[1]


def position(page):
    return page.evaluate("FirstWordsReview.runtime.world.player.position")


def distance(a,b):
    return ((a[0]-b[0])**2+(a[2]-b[2])**2)**.5


def touch(session,kind,x=None,y=None):
    points=[] if kind=='touchEnd' else [{'x':x,'y':y,'radiusX':4,'radiusY':4,'force':1,'id':1}]
    session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':points})


def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);trace=[]
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'controls.db');browser=p.chromium.launch()
        try:
            ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True)
            page=ctx.new_page();page.goto(url+'/first-words')
            skip_opening_to_tutorial(page,skip_controls=True)
            action(page,'Connect the power lead')
            page.reload()
            expect(page.locator('#loading')).to_be_hidden(timeout=15000)
            expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)
            expect(page.locator('.game-player-controls')).to_have_attribute('data-control-mode','third-person',timeout=15000)
            expect(page.locator('.game-move-stick')).to_be_visible()

            # Motion direction is an explicit runtime contract. Zip's rest state is
            # intentionally subdued (frozen standing pose), movement switches to
            # the declared run animation, and releasing input returns to calm idle.
            idle=page.evaluate('FirstWordsReview.runtime.world.playerAnimation')
            assert idle['alias']=='idle' and idle['speed']==0,idle
            trace.append({'action':'observe idle after reload','observation':idle,'assertion':'declared idle alias with zero speed','passed':True})
            page.keyboard.down('KeyW');page.wait_for_timeout(180)
            moving=page.evaluate('FirstWordsReview.runtime.world.playerAnimation')
            assert moving['alias']=='run' and moving['speed']>0,moving
            trace.append({'action':'hold KeyW','observation':moving,'assertion':'movement switches to declared run animation','passed':True})
            page.keyboard.up('KeyW');page.wait_for_timeout(180)
            idle_again=page.evaluate('FirstWordsReview.runtime.world.playerAnimation')
            assert idle_again['alias']=='idle' and idle_again['speed']==0,idle_again
            trace.append({'action':'release KeyW','observation':idle_again,'assertion':'movement returns to subdued idle','passed':True})

            # A reusable world prop must be physical. The token track sits immediately
            # left of the spawn; a sustained left input should stop at its collider
            # rather than letting the protagonist pass through the visible geometry.
            collision_start=position(page)
            page.keyboard.down('KeyA');page.wait_for_timeout(1100);page.keyboard.up('KeyA');page.wait_for_timeout(120)
            collision_stop=position(page)
            assert collision_stop[0]>-1.65,(collision_start,collision_stop)
            trace.append({'action':'hold KeyA into visible token-track prop','before':collision_start,'after':collision_stop,'assertion':'player stops before penetrating collider','passed':True})
            page.keyboard.down('KeyD');page.wait_for_timeout(650);page.keyboard.up('KeyD');page.wait_for_timeout(120)
            assert position(page)[0]>collision_stop[0]+.4

            # A non-text game button may retain focus after interaction/reload. That
            # must not suppress direct protagonist movement; only typing targets do.
            page.get_by_role('button',name='Scan the Moon lock',exact=True).focus()
            start=position(page)
            page.keyboard.down('KeyW');page.wait_for_timeout(450);page.keyboard.up('KeyW');page.wait_for_timeout(120)
            after_key=position(page);assert distance(start,after_key)>.08,(start,after_key)
            trace.append({'action':'move with KeyW while game button retains focus','before':start,'after':after_key,'passed':True})

            page.get_by_role('button',name='Move right',exact=True).focus();page.keyboard.press('Enter');page.wait_for_timeout(120)
            after_button=position(page);assert distance(after_key,after_button)>.02,(after_key,after_button)

            cdp=ctx.new_cdp_session(page);stick=page.locator('.game-move-stick');box=stick.bounding_box();assert box
            cx=box['x']+box['width']/2;cy=box['y']+box['height']/2;before_touch=position(page)
            touch(cdp,'touchStart',cx,cy-28);page.wait_for_timeout(450);touch(cdp,'touchEnd');page.wait_for_timeout(120)
            after_touch=position(page);assert distance(before_touch,after_touch)>.08,(before_touch,after_touch)
            trace.append({'action':'touch move stick','before':before_touch,'after':after_touch,'passed':True})

            world=page.locator('#world');world_box=world.bounding_box();assert world_box;yaw_before=page.evaluate('FirstWordsReview.runtime.world.player.yaw')
            x=world_box['x']+world_box['width']*.55;y=world_box['y']+world_box['height']*.45
            touch(cdp,'touchStart',x,y);page.wait_for_timeout(80);touch(cdp,'touchMove',x+70,y+10);page.wait_for_timeout(80);touch(cdp,'touchEnd');page.wait_for_timeout(120)
            yaw_after=page.evaluate('FirstWordsReview.runtime.world.player.yaw');assert abs(yaw_after-yaw_before)>2,(yaw_before,yaw_after)
            trace.append({'action':'touch drag world camera','before_yaw':yaw_before,'after_yaw':yaw_after,'passed':True})
            page.screenshot(path=str(out/'level1-controls-orbit-390.png'))
            dist_before=page.evaluate('FirstWordsReview.runtime.world.player.distance');page.get_by_role('button',name='Zoom camera in',exact=True).click();page.wait_for_timeout(80)
            assert page.evaluate('FirstWordsReview.runtime.world.player.distance')<dist_before
            page.screenshot(path=str(out/'level1-controls-zoom-390.png'))
            page.get_by_role('button',name='Recenter camera',exact=True).click();page.wait_for_timeout(80)
            page.screenshot(path=str(out/'level1-controls-after-save-390.png'))
            (out/'first-words-controls-interaction-trace.json').write_text(json.dumps({'schema':'vibelearn.interactive-trace.v1','suite':'first-words-controls','observations':trace},indent=2))
            print('Level 1 post-save keyboard/touch/camera controls passed');ctx.close()
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()