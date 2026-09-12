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
        ctx=b.new_context(viewport=dict(width=1440,height=1000));ctx.add_init_script(ONBOARDING_DONE);ctx.tracing.start(screenshots=True,snapshots=True,sources=True)
        page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        runtime_identity=[None]
        def shot(name):
            page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/name),full_page=True)
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
        def next_level(surface='field'):
            old=page.locator(MODE_LABEL).inner_text()
            page.locator('#rg-next').click();expect(page.locator(MODE_LABEL)).not_to_have_text(old)
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
            page.goto(url);expect(page.locator('#rg-launch')).to_be_visible()
            expect(page.locator('[data-mission="rescue-07"]')).to_be_disabled();shot('rescue-map.png')
            page.locator('#rg-launch').focus();page.keyboard.press('Enter')
            expect(page.locator('#rg-feedback')).to_be_visible();expect_story_world_continuity();shot('rescue-first.png')
            assert page.locator('[data-tool="retry"]').bounding_box()['y']<1000
            expect(page.locator('#rg-effects')).to_have_text('Not inspected')
            page.locator('[data-world-look="workshop"]').click();expect(page.locator('#rg-effects')).to_have_text('1 gear')
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
            checks.append('Signals 1-6 keep one PlayCanvas GameRuntime identity alive as the reasoning grows, while field encounters still cover duplicates, changed payload, expiry and unknown-to-authorized-absence recovery')
            build(['retry','remember','match','reconcile'])
            page.locator('#rg-run').click();expect(page.locator('.rg-case-tabs button')).to_have_count(6)
            expect(page.locator('#rg-next')).to_have_count(0);shot('rescue-route-failure.png')
            build(SAFE)
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
            after=draft_probe()
            stored_after=list(after['entries'].values())
            assert len(stored_after)==1 and stored_after[0]['response']['rescue']['draft']==SAFE, after
            assert after['rescue']['draft']==SAFE, after
            expect(page.locator('[data-slot="0"]')).to_contain_text('Recover the ticket')
            expect(page.locator('[data-slot="3"]')).to_contain_text('Send the request')
            page.locator('#rg-run').click();expect(page.locator('#rg-next')).to_be_enabled();shot('rescue-route-success.png')
            page.locator('.rg-sandbox summary').click();build(['remember','retry'])
            page.locator('#rg-storm-elapsed').fill('1')
            page.locator('#rg-sandbox-run').click();expect(page.locator('.rg-sandbox-result')).to_contain_text('Route holds')
            expect(page.locator('#rg-next')).to_have_count(0)
            page.locator('#rg-storm-elapsed').fill('25')
            page.locator('#rg-sandbox-run').click();expect(page.locator('.rg-sandbox-result')).to_contain_text('Repair needed')
            shot('rescue-playground.png')
            build(SAFE);page.locator('#rg-run').click();expect(page.locator('#rg-next')).to_be_enabled()
            page.locator('[data-slot="1"]').click();expect(page.locator('#rg-sync')).to_have_text('Saved')
            expect(page.locator('#rg-next')).to_be_enabled()
            page.locator('#rg-replay-case').click();expect(page.locator('.rg-live-route')).to_be_visible()
            build(['retry']);page.locator('[data-case="1"]').click();expect(page.locator('#rg-next')).to_be_disabled()
            build(SAFE);page.locator('#rg-run').click();expect(page.locator('#rg-next')).to_be_enabled()
            checks.append('Direct scene inspection; causal route playback; player-created quick/expired storms change the outcome without granting a boss clear; stale-result navigation remains invalidated')
            next_level('incident')
            expect(page.locator('.rg-results')).to_have_count(0)
            expect(page.locator('.rg-world .game-runtime-stage')).to_have_count(0)
            expect(page.locator('.rg-world .vl-playcanvas-engine')).to_have_count(0)
            build(SAFE);page.locator('#rg-aid').select_option('none')
            shot('rescue-transfer-before.png')
            def lose_ack(route):route.fetch();route.abort('failed')
            page.route('**/api/commands/submit',lose_ack,times=1)
            page.locator('#rg-run').click();expect(page.locator('#rg-retry-save')).to_be_visible()
            page.locator('#rg-retry-save').click();expect(page.locator('#rg-kit')).to_be_visible()
            expect(page.locator('.rg-case-tabs button')).to_have_count(6);shot('rescue-transfer-after.png')
            state=page.evaluate("async()=> (await fetch('/api/state')).json()")
            assert state['attempt']['assessment']['outcome']=='correct'
            assert state['attempt']['assessment']['independence']=='declared_independent'
            assert state['attempt']['practice_xp']==70
            assert len(state['attempt']['response']['rescue']['moves'])==1
            with page.expect_download() as dl:page.locator('#rg-kit a').click()
            assert dl.value.suggested_filename=='relay-repair-kit.zip'
            checks.append('Signal 7 deliberately exits the fantasy and removes the PlayCanvas runtime for sealed transfer; it commits before feedback, preserves explicit no-help declaration, survives one lost acknowledgement without duplicate evidence/XP, and exposes the separate local Python repair kit')
            result={'result':'passed','browser':b.version,'checks':checks,'page_errors':errors,'independent_critic_score':None,'acceptance':'critic_pending','audience_validation':'No human child/teen playtest; browser checks are not enjoyment evidence.'}
            (out/'rescue-browser.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
        finally:
            try:ctx.tracing.stop(path=str(out/'rescue-trace.zip'))
            except Exception:pass
            ctx.close();b.close();stop_server(proc)

if __name__=='__main__':main()