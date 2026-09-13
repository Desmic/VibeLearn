"""Real browser field play and sealed transfer, not a human-enjoyment measurement."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from tests.browser_check import start_server,stop_server

ROOT=Path(__file__).resolve().parents[1]
SAFE=['remember','match','reconcile','retry']
ONBOARDING_DONE="localStorage.setItem('vibelearn.relay-rescue.intro.v3','seen');localStorage.setItem('vibelearn.relay-rescue.signal1-guide.done.v3','yes');"
MODE_LABEL='header.rg-top > span:first-of-type'

def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);errors=[];checks=[]
    with tempfile.TemporaryDirectory() as tmp,sync_playwright() as p:
        proc,url=start_server(Path(tmp)/'rescue.db');b=p.chromium.launch()
        ctx=b.new_context(viewport=dict(width=1440,height=1000));ctx.tracing.start(screenshots=True,snapshots=True,sources=True)
        page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        runtime_identity=[None]
        def shot(name):
            page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/name),full_page=True)
        def world_shot(name):
            page.evaluate('scrollTo(0,0)');page.locator('.rg-world.play-canvas-builder-world').screenshot(path=str(out/name))
        def move(action):
            page.locator(f'[data-tool="{action}"]').click()
            expect(page.locator('#rg-feedback')).not_to_have_text('Pip is trying your idea…')
            expect(page.locator('#rg-sync')).to_have_text('Saved')
        def expect_story_world_continuity():
            world=page.locator('.rg-world.play-canvas-ready')
            expect(world).to_be_visible()
            expect(world).to_have_attribute('data-game-engine','playcanvas')
            stage=world.locator('.game-runtime-stage')
            canvas=world.locator('.vl-playcanvas-engine')
            expect(stage).to_have_count(1)
            expect(stage).to_have_attribute('data-game-runtime-version','1')
            expect(canvas).to_have_count(1)
            expect(canvas).to_be_visible()
            expect(canvas).to_have_attribute('data-vibelearn-engine','playcanvas')
            expect(canvas).to_have_attribute('data-playcanvas-engine','2.22.1')
            expect(canvas).to_have_attribute('data-game-runtime-version','1')
            stage_id=stage.get_attribute('data-game-runtime-instance')
            canvas_id=canvas.get_attribute('data-game-runtime-instance')
            assert stage_id and canvas_id==stage_id,(stage_id,canvas_id)
            if runtime_identity[0] is None:runtime_identity[0]=stage_id
            else:assert stage_id==runtime_identity[0],(runtime_identity[0],stage_id)
        def expect_transfer_world():
            surface=page.locator('.play-canvas-transfer-surface')
            expect(surface).to_be_visible()
            expect(surface).to_have_attribute('data-play-canvas-backend','playcanvas')
            canvas=surface.locator('.vl-playcanvas-engine')
            expect(canvas).to_have_count(1)
            expect(canvas).to_be_visible()
            expect(canvas).to_have_attribute('data-vibelearn-engine','playcanvas')
            expect(canvas).to_have_attribute('data-playcanvas-engine','2.22.1')
            expect(surface.locator('.play-canvas-route-circuit')).to_be_visible()
            expect(surface.locator('.play-canvas-route-nodes .rg-slot')).to_have_count(4)
            expect(surface.locator('.play-canvas-toolbelt [data-block]')).to_have_count(6)
            expect(surface.locator('.play-canvas-transfer-run #rg-run')).to_be_visible()
            return surface
        def next_level(surface='field'):
            old=page.locator(MODE_LABEL).inner_text()
            page.locator('#rg-next').click();expect(page.locator(MODE_LABEL)).not_to_have_text(old,timeout=15000)
            if surface=='field':
                expect(page.locator('#rg-feedback')).to_be_visible()
            elif surface=='build':
                expect(page.locator('#rg-feedback')).to_have_count(0)
                expect(page.locator('#rg-run')).to_be_visible()
            elif surface=='incident':
                expect(page.locator('#rg-feedback')).to_have_count(0)
                expect(page.locator('.rg-incident')).to_be_visible()
                expect(page.locator('#rg-run')).to_be_visible()
            else:
                raise AssertionError(f'unknown rescue surface: {surface}')
        def expect_transfer_controls():
            # Geometry and real pointer hit testing catch overlapping controls;
            # select_option alone would bypass the reported interception defect.
            controls=['#rg-aid','#rg-clear-route']
            boxes=[]
            for selector in controls:
                control=page.locator(selector)
                expect(control).to_be_visible()
                expect(control).to_be_enabled()
                control.scroll_into_view_if_needed()
                assert control.evaluate('''el => {
                  const r=el.getBoundingClientRect();
                  return [.15,.5,.85].every(x => [.15,.5,.85].every(y => {
                    const hit=document.elementFromPoint(r.left+r.width*x,r.top+r.height*y);
                    return hit===el || el.contains(hit);
                  }));
                }'''),f'{selector} pointer area is intercepted'
                boxes.append(control.bounding_box())
            a,b=boxes
            assert (a['x']+a['width']<=b['x'] or b['x']+b['width']<=a['x'] or
                    a['y']+a['height']<=b['y'] or b['y']+b['height']<=a['y']),boxes
            # The transparent full-surface workbench must not blur the world or
            # the incident facts behind it. Facts must fit below the controls
            # and above the route, including the compact phone layout.
            assert page.locator('.play-canvas-transfer-surface .rg-workbench').evaluate(
                "el => getComputedStyle(el).backdropFilter === 'none'")
            assert page.locator('.play-canvas-transfer-surface').evaluate('''surface => {
              const incident=surface.querySelector('.rg-incident').getBoundingClientRect();
              const header=surface.querySelector('.play-canvas-transfer-header').getBoundingClientRect();
              const nodes=[...surface.querySelectorAll('.rg-slot')].map(el=>el.getBoundingClientRect());
              return header.bottom<=incident.top && nodes.every(r=>incident.bottom<=r.top) &&
                [...surface.querySelectorAll('.rg-incident-grid small,.rg-incident-grid b')].every(el=>{
                  const r=el.getBoundingClientRect();
                  return r.top>=incident.top && r.bottom<=incident.bottom &&
                    r.left>=incident.left && r.right<=incident.right;
                });
            }'''),'Incident facts are clipped or overlap another HUD region'
        def build(program):
            page.locator('#rg-clear-route').click()
            for block in program:page.locator(f'[data-block="{block}"]').click()
        def draft_probe():
            return page.evaluate("""() => {
              const entries={};
              for(let i=0;i<localStorage.length;i++){
                const key=localStorage.key(i);
                if(key?.startsWith('learning-draft:')){
                  try{entries[key]=JSON.parse(localStorage.getItem(key));}catch(error){entries[key]={parseError:String(error)}}
                }
              }
              return {rescue:window.RescueGame?.response?.(),entries};
            }""")
        try:
            page.goto(url);expect(page.locator('#rgi-intro')).to_be_visible()
            expect(page.locator('[data-mission="rescue-07"]')).to_be_disabled();shot('rescue-map.png')
            page.locator('#rgi-skip').focus();page.keyboard.press('Enter')
            expect(page.locator('.rgc1-coach')).to_be_visible();expect_story_world_continuity();shot('rescue-first.png')
            expect(page.locator('#rg-effects')).to_have_text('Not inspected')
            page.locator('[data-world-look="workshop"]').click();expect(page.locator('#rg-effects')).to_have_text('1 gear')
            page.locator('[data-world-look="ticket"]').click()
            expect(page.locator('[data-tool="retry"]')).to_be_visible()
            assert page.locator('[data-tool="retry"]').bounding_box()['y']<1000
            move('new');move('retry');expect(page.locator('[data-tool="rewind"]')).to_be_visible();shot('rescue-setback.png')
            move('rewind');move('retry');next_level();expect_story_world_continuity()
            move('retry');expect(page.locator('#rg-effects')).to_have_text('2 gears')
            move('rewind');move('remember');move('retry');next_level();expect_story_world_continuity()
            page.locator('[data-look="parcel"]').click();expect(page.locator('#rg-feedback')).to_contain_text('three large gears')
            move('match');next_level();expect_story_world_continuity()
            move('remember');move('retry');expect(page.locator('#rg-effects')).to_have_text('2 gears')
            move('rewind');move('inspect');move('collect');next_level();expect_story_world_continuity()
            move('inspect');expect(page.locator('#rg-knowledge')).to_contain_text('Unknown')
            move('pause');expect(page.locator('#rg-knowledge')).to_contain_text('restored')
            move('inspect');expect(page.locator('#rg-knowledge')).to_contain_text('Absent')
            move('retry');next_level('build');expect_story_world_continuity()
            expect(page.locator('.play-canvas-route-circuit')).to_be_visible()
            expect(page.locator('.play-canvas-route-nodes .rg-slot')).to_have_count(4)
            expect(page.locator('.play-canvas-toolbelt [data-block]')).to_have_count(6)
            expect(page.locator('.play-canvas-route-run #rg-run')).to_be_visible()
            checks.append('Signals 1-6 keep one PlayCanvas GameRuntime identity alive as reasoning grows; Signal 6 stages the unchanged four-node route and six semantic tools as an in-world circuit rather than a separate workbench page')
            build(['retry','remember','match','reconcile'])
            # Route edits call RescueGame's lexical render function. The migration
            # observer must restore the spatial HUD before the player runs anything.
            expect(page.locator('.play-canvas-route-circuit')).to_be_visible()
            expect(page.locator('.play-canvas-route-nodes .rg-slot')).to_have_count(4)
            page.locator('#rg-run').click();expect(page.locator('.rg-case-tabs button')).to_have_count(6)
            expect(page.locator('.play-canvas-storm-outcome')).to_be_visible()
            expect(page.locator('.play-canvas-route-circuit > .play-canvas-route-playback')).to_be_visible()
            expect(page.locator('#rg-next')).to_have_count(0);shot('rescue-route-failure.png')
            page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(180)
            expect(page.locator('.play-canvas-route-circuit')).to_be_visible()
            assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')
            world_shot('rescue-route-failure-phone-390.png')
            page.set_viewport_size({'width':1440,'height':1000});page.wait_for_timeout(180)
            build(SAFE)
            expect(page.locator('.play-canvas-route-circuit')).to_be_visible()
            page.locator('#rg-map').click();expect(page.locator('#notice')).to_contain_text('Save your current')
            before=draft_probe()
            assert before['rescue']['draft']==SAFE, before
            stored=list(before['entries'].values())
            assert len(stored)==1 and stored[0]['response']['rescue']['draft']==SAFE, before
            page.reload()
            # boot() must resolve the learner/attempt before it can address the scoped
            # localStorage key. Wait for the user-visible recovery contract, then keep
            # the strong assertion that RescueGame itself contains the recovered plan.
            expect(page.locator('#notice')).to_contain_text('Recovered unsaved progress')
            expect(page.locator('[data-slot="0"]')).to_contain_text('Recover the ticket')
            expect_story_world_continuity()
            expect(page.locator('.play-canvas-route-circuit')).to_be_visible()
            after=draft_probe()
            stored_after=list(after['entries'].values())
            assert len(stored_after)==1 and stored_after[0]['response']['rescue']['draft']==SAFE, after
            assert after['rescue']['draft']==SAFE, after
            expect(page.locator('[data-slot="0"]')).to_contain_text('Recover the ticket')
            expect(page.locator('[data-slot="3"]')).to_contain_text('Send the request')
            page.locator('#rg-run').click();expect(page.locator('#rg-next')).to_be_enabled();shot('rescue-route-success.png')
            expect(page.locator('.play-canvas-route-circuit > .play-canvas-route-playback')).to_be_visible()
            page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(180)
            assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')
            world_shot('rescue-route-success-phone-390.png')
            page.set_viewport_size({'width':1440,'height':1000});page.wait_for_timeout(180)
            checks.append('Signal 6 route playback remains inside the live world and is captured at 390px without horizontal overflow')
            page.locator('.rg-sandbox summary').click();build(['remember','retry'])
            expect(page.locator('.play-canvas-route-circuit')).to_be_visible()
            page.locator('#rg-storm-elapsed').fill('1')
            page.locator('#rg-sandbox-run').click();expect(page.locator('.rg-sandbox-result')).to_contain_text('Route holds')
            expect(page.locator('#rg-next')).to_have_count(0)
            page.locator('#rg-storm-elapsed').fill('25')
            page.locator('#rg-sandbox-run').click();expect(page.locator('.rg-sandbox-result')).to_contain_text('Repair needed')
            shot('rescue-playground.png')
            build(SAFE);expect(page.locator('.play-canvas-route-circuit')).to_be_visible();page.locator('#rg-run').click();expect(page.locator('#rg-next')).to_be_enabled()
            page.locator('[data-slot="1"]').click();expect(page.locator('#rg-sync')).to_have_text('Saved')
            expect(page.locator('#rg-next')).to_be_enabled()
            page.locator('#rg-replay-case').click();expect(page.locator('.rg-live-route')).to_be_visible()
            build(['retry']);expect(page.locator('.play-canvas-route-circuit')).to_be_visible();page.locator('[data-case="1"]').click();expect(page.locator('#rg-next')).to_be_disabled()
            build(SAFE);expect(page.locator('.play-canvas-route-circuit')).to_be_visible();page.locator('#rg-run').click();expect(page.locator('#rg-next')).to_be_enabled()
            checks.append('Direct scene inspection; causal route playback; player-created quick/expired storms change the outcome without granting a boss clear; stale-result navigation remains invalidated')
            next_level('incident')
            expect(page.locator('.rg-results')).to_have_count(0)
            transfer=expect_transfer_world()
            expect_transfer_controls()
            build(SAFE)
            # Building the real-world policy rerenders internally too; the player
            # must remain in the export-yard world throughout construction.
            transfer=expect_transfer_world()
            page.locator('#rg-aid').select_option('none')
            shot('rescue-transfer-before.png')
            page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(180)
            transfer=expect_transfer_world()
            expect_transfer_controls()
            build(SAFE)
            transfer=expect_transfer_world()
            expect_transfer_controls()
            page.locator('#rg-aid').select_option('none')
            assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')
            transfer.screenshot(path=str(out/'rescue-transfer-before-phone-390.png'))
            page.set_viewport_size({'width':1440,'height':1000});page.wait_for_timeout(180)
            def lose_ack(route):route.fetch();route.abort('failed')
            page.route('**/api/commands/submit',lose_ack,times=1)
            page.locator('#rg-run').click();expect(page.locator('#rg-retry-save')).to_be_visible()
            page.locator('#rg-retry-save').click();expect(page.locator('#rg-kit')).to_be_visible()
            expect(page.locator('.rg-case-tabs button')).to_have_count(6)
            expect(page.locator('.play-canvas-transfer-surface')).to_be_visible()
            expect(page.locator('.play-canvas-transfer-surface .vl-playcanvas-engine')).to_be_visible()
            expect(page.locator('.play-canvas-transfer-surface .rg-clear')).to_be_visible()
            shot('rescue-transfer-after.png')
            state=page.evaluate("async()=> (await fetch('/api/state')).json()")
            assert state['attempt']['assessment']['outcome']=='correct'
            assert state['attempt']['assessment']['independence']=='declared_independent'
            assert state['attempt']['practice_xp']==70
            assert len(state['attempt']['response']['rescue']['moves'])==1
            with page.expect_download() as dl:page.locator('#rg-kit a').click()
            assert dl.value.suggested_filename=='relay-repair-kit.zip'
            page.set_viewport_size({'width':390,'height':844})
            completion=page.locator('.play-canvas-transfer-surface .rg-clear')
            expect(completion.locator('#rg-next')).to_be_enabled()
            assert completion.evaluate('''el => {
              const panel=el.getBoundingClientRect();
              const button=el.querySelector('#rg-next').getBoundingClientRect();
              return button.top>=panel.top && button.bottom<=panel.bottom &&
                button.left>=panel.left && button.right<=panel.right;
            }'''),'Transfer completion clips the return control'
            page.locator('.play-canvas-transfer-surface').screenshot(path=str(out/'rescue-transfer-after-phone-390.png'))
            completion.locator('#rg-next').click()
            expect(page.locator('#rg-launch')).to_be_visible()
            checks.append('Signal 7 changes context into a distinct PlayCanvas export-yard while preserving the exact four route slots, six semantic tools, explicit no-help declaration and sealed server-owned transfer. Route edits stay spatialized through internal rerenders; one lost acknowledgement still cannot duplicate evidence/XP; incident results and the Python repair kit remain post-action evidence outside the live interaction surface')
            result={'result':'passed','browser':b.version,'checks':checks,'page_errors':errors,'independent_critic_score':None,'acceptance':'critic_pending','audience_validation':'No human child/teen playtest; browser checks are not enjoyment evidence.'}
            (out/'rescue-browser.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
        finally:
            try:ctx.tracing.stop(path=str(out/'rescue-trace.zip'))
            except Exception:pass
            ctx.close();b.close();stop_server(proc)

if __name__=='__main__':main()
