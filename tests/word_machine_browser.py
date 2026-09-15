"""Real HTTP, Chromium and disposable SQLite coverage for the LLM workshop."""
import json
import tempfile
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parents[1]


def saved_action(page, name):
    page.get_by_role('button', name=name, exact=True).click()
    expect(page.locator('#save-state')).to_have_text('Saved', timeout=15000)


def generate(page):
    saved_action(page, 'Make the first piece')
    saved_action(page, 'Make the next piece')
    saved_action(page, 'Make the next piece')


def wait_until(page, predicate, seconds=20):
    deadline=time.monotonic()+seconds
    while time.monotonic()<deadline:
        if page.evaluate(predicate): return
        page.wait_for_timeout(100)
    raise AssertionError(f'Timed out: {predicate}')


def stats(page):
    return page.evaluate('WordMachineReview.runtime')


def main():
    out = ROOT / 'artifacts'
    out.mkdir(exist_ok=True)
    checks, errors = [], []
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        proc, url = start_server(Path(tmp) / 'word-machine.db')
        browser = p.chromium.launch()
        try:
            context = browser.new_context(viewport={'width':390, 'height':844}, has_touch=True)
            page = context.new_page()
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(url + '/word-machine')
            expect(page.locator('#rgi-intro')).to_be_visible(timeout=15000)
            expect(page.locator('#rgi-next')).to_be_enabled(timeout=15000)
            instance = stats(page)['instanceId']
            page.locator('#rgi-next').click()
            expect(page.locator('#rgi-fact')).to_contain_text('machine is awake')
            page.screenshot(path=str(out / 'word-machine-opening-390.png'))
            page.locator('#rgi-next').click()
            expect(page.locator('#save-state')).to_have_text('Saved', timeout=15000)
            assert stats(page)['instanceId'] == instance
            wait_until(page, '()=>WordMachineReview.runtime.world.assetsLoaded===1')
            saved_action(page, 'Make the first piece')
            expect(page.locator('#context')).to_contain_text('Go')
            page.reload()
            expect(page.locator('#save-state')).to_have_text('Saved', timeout=15000)
            expect(page.locator('#rgi-intro')).to_have_count(0)
            expect(page.locator('#world-words')).to_have_text('Go??')
            instance = stats(page)['instanceId']
            saved_action(page, 'Make the next piece')
            page.get_by_role('button', name='Look inside the machine').click()
            expect(page.locator('#inside-context')).to_contain_text('Go to')
            expect(page.get_by_label('Library illustrative score')).to_have_attribute('value','70')
            page.get_by_role('button', name='Close machine inspection').click()
            saved_action(page, 'Make the next piece')
            saved_action(page, 'Send the robot →')
            expect(page.locator('#goal')).to_have_text('That sounded right. Wrong door.')
            wait_until(page, '()=>!WordMachineReview.runtime.world.animating')
            assert page.evaluate('WordMachineReview.state.destination') == 'Library'
            checks.append('Opening wake action → same runtime; generated piece survives reload; optional scores; visible wrong delivery.')
            for width, height in [(360,800),(390,844),(430,932),(1280,720)]:
                page.set_viewport_size({'width':width,'height':height})
                page.wait_for_timeout(250)
                page.locator('[data-view="recenter"]').click()
                assert stats(page)['world']['player']['distance']==(19 if width/height<.9 else 13)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
                for selector in ['#actions button','.library','.garden','#output-label','#goal']:
                    for locator in page.locator(selector).all():
                        expect(locator).to_be_visible()
                        box=locator.bounding_box()
                        assert box['x']>=0 and box['y']>=0 and box['x']+box['width']<=width+1 and box['y']+box['height']<=height+1,(selector,box,width)
                overlap = page.evaluate('''() => {
                  const output=document.querySelector('#output-label').getBoundingClientRect(), tray=document.querySelector('#experiment').getBoundingClientRect();
                  return output.bottom>tray.top;
                }''')
                assert not overlap,'Output obstructs experiment'
                page.screenshot(path=str(out / f'word-machine-wrong-{width}.png'))
            page.set_viewport_size({'width':390,'height':844})
            before=stats(page)['world']['player']
            for control in ['in','out','recenter']:
                expect(page.locator(f'[data-view="{control}"]')).to_be_enabled()
                page.locator(f'[data-view="{control}"]').click()
                if control=='in':assert stats(page)['world']['player']['distance']<before['distance']
            page.locator('.game-runtime-stage').focus()
            page.keyboard.down('KeyW');page.wait_for_timeout(350);page.keyboard.up('KeyW')
            assert stats(page)['world']['player']['position']!=before['position']
            saved_action(page, 'Add the Garden clue')
            generate(page);saved_action(page, 'Send the robot →')
            expect(page.locator('#goal')).to_have_text('Mira got the flower!')
            saved_action(page, 'A new delivery →')
            page.get_by_role('button',name='Choose a clue',exact=True).click()
            saved_action(page, 'Add the Garden clue')
            generate(page);saved_action(page, 'Send the robot →')
            expect(page.locator('#goal')).to_have_text('That sounded right. Wrong door.')
            saved_action(page, 'Add the Library clue')
            generate(page);saved_action(page, 'Send the robot →')
            expect(page.locator('#goal')).to_have_text('Ivo got the book!')
            assert stats(page)['instanceId']==instance,'Save or round transition recreated the runtime'
            page.get_by_role('button',name='Open episode menu').click()
            page.get_by_role('button',name='Pause the scene',exact=True).click()
            expect(page.locator('#paused-banner')).to_be_visible()
            expect(page.get_by_role('button',name='Finish episode →',exact=True)).to_be_disabled()
            paused_player=stats(page)['world']['player']['position']
            page.locator('.game-runtime-stage').focus()
            page.keyboard.down('KeyW');page.wait_for_timeout(200);page.keyboard.up('KeyW')
            assert stats(page)['world']['player']['position']==paused_player
            page.locator('#paused-banner').click()
            expect(page.get_by_role('button',name='Finish episode →',exact=True)).to_be_enabled()
            state=page.evaluate('JSON.stringify(WordMachineReview.state)')
            player=stats(page)['world']['player']
            page.get_by_role('button',name='Open episode menu').click()
            page.get_by_role('button',name='Look at the opening again').click()
            expect(page.locator('#rgi-intro')).to_have_attribute('data-opening-replay','true')
            page.locator('#rgi-skip').click()
            assert page.evaluate('JSON.stringify(WordMachineReview.state)')==state
            assert stats(page)['world']['player']==player,'Opening replay changed saved presentation'
            page.get_by_role('button',name='Open episode menu').click()
            page.get_by_label('Reduce motion',exact=True).check()
            page.get_by_role('button',name='Look at the opening again').click()
            expect(page.locator('#rgi-pause')).to_be_hidden()
            page.locator('#rgi-skip').click()
            page.get_by_role('button',name='Finish episode →',exact=True).click()
            expect(page.locator('#save-state')).to_have_text('Episode saved · practice, not mastery',timeout=15000)
            page.reload()
            expect(page.locator('#save-state')).to_have_text('Episode saved · practice, not mastery',timeout=15000)
            page.screenshot(path=str(out/'word-machine-complete-390.png'))
            page.goto(url + '/')
            expect(page.locator('#rg-launch')).to_be_visible(timeout=15000)
            page.goto(url + '/word-machine')
            expect(page.locator('#save-state')).to_have_text('Episode saved · practice, not mastery',timeout=15000)
            checks.append('Both deliveries: copying Garden fails in case 2; corrected Library succeeds. Camera/movement work after saved action. Replay preserves state/view; reduced motion; immutable completion resumes.')
            # Same generic adapter, unrelated scene and presentation state. No backend edits.
            proof=page.evaluate('''async()=>{
              const {makeWorldPackage}=await import('/spec-game-world.js');
              const spec={schemaVersion:'1',id:'adapter-proof.orchard',version:'1',materials:{green:{diffuse:'#66bb88'}},entities:[{id:'seed',primitive:'sphere',material:'green',position:[0,0,0]}],cameras:{view:{position:[0,2,6],lookAt:[0,0,0],fov:45}},states:{start:{camera:'view'}}};
              const host=document.createElement('div');Object.assign(host.style,{width:'200px',height:'200px'});document.body.append(host);
              const pkg=makeWorldPackage(spec,value=>({transforms:{seed:{scale:[value,value,value]}}}));
              const world=pkg.createGameWorld(host,{reducedMotion:true});world.setMissionState(2);
              const result={available:world.available,adapter:world.stats().packageAdapter,canvas:!!host.querySelector('canvas')};world.dispose();host.remove();return result;
            }''')
            assert proof=={'available':True,'adapter':'world-spec','canvas':True},proof
            checks.append('Unrelated orchard scene instantiates through the same WorldSpec package adapter and PlayCanvas backend.')
            assert errors==[],errors
            context.close()
            for width,height in [(360,800),(430,932)]:
                phone=browser.new_context(viewport={'width':width,'height':height},has_touch=True,reduced_motion='reduce')
                phone_page=phone.new_page();phone_page.on('pageerror',lambda e:errors.append(str(e)))
                phone_page.goto(url+'/word-machine')
                expect(phone_page.locator('#rgi-next')).to_be_enabled(timeout=20000)
                phone_page.screenshot(path=str(out/f'word-machine-opening-{width}.png'))
                phone_page.locator('#rgi-next').click()
                expect(phone_page.locator('.rgi-target')).to_have_count(0)
                phone_page.locator('#rgi-next').click()
                generate(phone_page);saved_action(phone_page,'Send the robot →')
                expect(phone_page.locator('#goal')).to_have_text('That sounded right. Wrong door.')
                phone_page.screenshot(path=str(out/f'word-machine-first-wrong-{width}.png'))
                saved_action(phone_page,'Add the Garden clue');generate(phone_page);saved_action(phone_page,'Send the robot →')
                saved_action(phone_page,'A new delivery →')
                expect(phone_page.locator('#goal')).to_have_text('Find Ivo. Deliver the book.')
                phone_page.get_by_role('button',name='Choose a clue',exact=True).click()
                saved_action(phone_page,'Add the Library clue');generate(phone_page);saved_action(phone_page,'Send the robot →')
                phone_page.get_by_role('button',name='Finish episode →',exact=True).click()
                expect(phone_page.locator('#save-state')).to_have_text('Episode saved · practice, not mastery',timeout=15000)
                assert phone_page.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
                phone_page.screenshot(path=str(out/f'word-machine-complete-{width}.png'))
                phone.close()
            assert errors==[],errors
            checks.append('Fresh 360/430 touch-enabled reduced-motion contexts play the opening and both deliveries to saved completion; second goal fades the location answer.')
            for missing in ['/vendor/playcanvas.mjs','/assets/quaternius-animated-robot.glb']:
                failure_context=browser.new_context(viewport={'width':390,'height':844})
                failure_page=failure_context.new_page()
                commands=[]
                failure_page.on('request',lambda req:commands.append(req.url) if '/api/commands/' in req.url else None)
                failure_page.route('**'+missing,lambda route:route.abort())
                failure_page.goto(url+'/word-machine')
                expect(failure_page.get_by_role('button',name='Reload workshop')).to_be_visible(timeout=20000)
                expect(failure_page.locator('#rgi-intro')).to_have_count(0)
                assert not commands,'Unavailable world accepted gameplay'
                failure_context.close()
            checks.append('Controlled missing-engine and missing-model faults show Reload workshop and issue no gameplay commands.')
            (out/'word-machine-browser-report.json').write_text(json.dumps({'result':'passed','checks':checks,'page_errors':errors,'limits':'Automated Chromium with temporary SQLite; no physical phone, live hosted sign-in, novice study or mastery claim.'},indent=2))
        except Exception:
            if not page.is_closed():page.screenshot(path=str(out/'word-machine-failure.png'))
            raise
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
