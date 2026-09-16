"""Exercise real Level 1 movement/camera controls after a persisted action and reload."""
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server
from tests.first_words_browser import action

ROOT=Path(__file__).resolve().parents[1]


def position(page):
    return page.evaluate("FirstWordsReview.runtime.world.player.position")


def distance(a,b):
    return ((a[0]-b[0])**2+(a[2]-b[2])**2)**.5


def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'controls.db');browser=p.chromium.launch()
        try:
            ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True)
            page=ctx.new_page();page.goto(url+'/first-words')
            page.get_by_role('button',name='Skip opening',exact=True).click()
            expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)
            action(page,'Connect the power lead')
            page.reload();expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)
            expect(page.locator('.game-move-stick')).to_be_visible()

            # Keyboard movement is a real state change after reload, not just a key listener.
            start=position(page)
            page.keyboard.down('KeyW');page.wait_for_timeout(450);page.keyboard.up('KeyW');page.wait_for_timeout(120)
            after_key=position(page)
            assert distance(start,after_key)>.08,(start,after_key)

            # Accessible directional controls still work after the save/reload boundary.
            page.get_by_role('button',name='Move right',exact=True).focus();page.keyboard.press('Enter');page.wait_for_timeout(120)
            after_button=position(page)
            assert distance(after_key,after_button)>.02,(after_key,after_button)

            # Touch stick: hold off-centre long enough for multiple animation frames.
            stick=page.locator('.game-move-stick');box=stick.bounding_box();assert box
            cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
            before_touch=position(page)
            stick.dispatch_event('pointerdown',{'pointerId':41,'pointerType':'touch','isPrimary':True,'clientX':cx,'clientY':cy-28,'button':0,'buttons':1})
            page.wait_for_timeout(450)
            stick.dispatch_event('pointerup',{'pointerId':41,'pointerType':'touch','isPrimary':True,'clientX':cx,'clientY':cy-28,'button':0,'buttons':0})
            page.wait_for_timeout(120)
            after_touch=position(page)
            assert distance(before_touch,after_touch)>.08,(before_touch,after_touch)

            # Dragging the actual world changes camera yaw; zoom/recenter stay usable.
            world=page.locator('#world');world_box=world.bounding_box();assert world_box
            yaw_before=page.evaluate('FirstWordsReview.runtime.world.player.yaw')
            x=world_box['x']+world_box['width']*.55;y=world_box['y']+world_box['height']*.45
            world.dispatch_event('pointerdown',{'pointerId':52,'pointerType':'touch','isPrimary':True,'clientX':x,'clientY':y,'button':0,'buttons':1})
            world.dispatch_event('pointermove',{'pointerId':52,'pointerType':'touch','isPrimary':True,'clientX':x+70,'clientY':y+10,'button':0,'buttons':1})
            world.dispatch_event('pointerup',{'pointerId':52,'pointerType':'touch','isPrimary':True,'clientX':x+70,'clientY':y+10,'button':0,'buttons':0})
            page.wait_for_timeout(120)
            yaw_after=page.evaluate('FirstWordsReview.runtime.world.player.yaw')
            assert abs(yaw_after-yaw_before)>2,(yaw_before,yaw_after)
            dist_before=page.evaluate('FirstWordsReview.runtime.world.player.distance')
            page.get_by_role('button',name='Zoom camera in',exact=True).click();page.wait_for_timeout(80)
            assert page.evaluate('FirstWordsReview.runtime.world.player.distance')<dist_before
            page.get_by_role('button',name='Recenter camera',exact=True).click();page.wait_for_timeout(80)
            page.screenshot(path=str(out/'level1-controls-after-save-390.png'))
            print('Level 1 post-save keyboard/touch/camera controls passed')
            ctx.close()
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
