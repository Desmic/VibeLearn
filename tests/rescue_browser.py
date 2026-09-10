"""Real browser field play and sealed transfer, not a human-enjoyment measurement."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from tests.browser_check import start_server,stop_server

ROOT=Path(__file__).resolve().parents[1]
SAFE=['remember','match','reconcile','retry']
ONBOARDING_DONE="localStorage.setItem('vibelearn.relay-rescue.intro.v3','seen');localStorage.setItem('vibelearn.relay-rescue.signal1-guide.done.v2','yes');"

def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);errors=[];checks=[]
    with tempfile.TemporaryDirectory() as tmp,sync_playwright() as p:
        proc,url=start_server(Path(tmp)/'rescue.db');b=p.chromium.launch()
        ctx=b.new_context(viewport=dict(width=1440,height=1000));ctx.add_init_script(ONBOARDING_DONE);ctx.tracing.start(screenshots=True,snapshots=True,sources=True)
        page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        def shot(name):
            page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/name),full_page=True)
        def move(action):
            page.locator(f'[data-tool="{action}"]').click()
            expect(page.locator('#rg-feedback')).not_to_have_text('Pip is trying your idea…')
            expect(page.locator('#rg-sync')).to_have_text('Saved')
        def next_level():
            old=page.locator('.rg-top>span').inner_text()
            page.locator('#rg-next').click();expect(page.locator('.rg-top>span')).not_to_have_text(old)
            expect(page.locator('#rg-feedback')).to_be_visible()
        def build(program):
            page.locator('#rg-clear-route').click()
            for block in program:page.locator(f'[data-block="{block}"]').click()
        try:
            page.goto(url);expect(page.locator('#rg-launch')).to_be_visible()
            expect(page.locator('[data-mission="rescue-07"]')).to_be_disabled();shot('rescue-map.png')
            page.locator('#rg-launch').focus();page.keyboard.press('Enter')
            expect(page.locator('#rg-feedback')).to_be_visible();shot('rescue-first.png')
            assert page.locator('[data-tool="retry"]').bounding_box()['y']<1000
            expect(page.locator('#rg-effects')).to_have_text('Not inspected')
            page.locator('[data-world-look="workshop"]').click();expect(page.locator('#rg-effects')).to_have_text('1 gear')
            move('new');move('retry');expect(page.locator('[data-tool="rewind"]')).to_be_visible();shot('rescue-setback.png')
            move('rewind');move('retry');next_level()
            move('retry');expect(page.locator('#rg-effects')).to_have_text('2 gears')
            move('rewind');move('remember');move('retry');next_level()
            page.locator('[data-look="parcel"]').click();expect(page.locator('#rg-feedback')).to_contain_text('three large gears')
            move('match');next_level()
            move('remember');move('retry');expect(page.locator('#rg-effects')).to_have_text('2 gears')
            move('rewind');move('inspect');move('collect');next_level()
            move('inspect');expect(page.locator('#rg-knowledge')).to_contain_text('Unknown')
            move('pause');expect(page.locator('#rg-knowledge')).to_contain_text('restored')
            move('inspect');expect(page.locator('#rg-knowledge')).to_contain_text('Absent')
            move('retry');next_level()
            expect(page.locator('#rg-run')).to_be_visible()
            checks.append('Five real field encounters, optional evidence inspection, duplicates, rewind, changed payload, expiry and unknown-to-authorized-absence recovery')
            build(['retry','remember','match','reconcile'])
            page.locator('#rg-run').click();expect(page.locator('.rg-case-tabs button')).to_have_count(6)
            expect(page.locator('#rg-next')).to_have_count(0);shot('rescue-route-failure.png')
            build(SAFE)
            page.locator('#rg-map').click();expect(page.locator('#notice')).to_contain_text('Save your current')
            page.reload();expect(page.locator('[data-slot="0"]')).to_contain_text('Recover the ticket')
            expect(page.locator('[data-slot="3"]')).to_contain_text('Send the request')
            page.locator('#rg-run').click();expect(page.locator('#rg-next')).to_be_enabled();shot('rescue-route-success.png')
            # Own a counterfactual: the same two-block route is safe before expiry,
            # unsafe afterward. Playground experiments cannot clear the real boss.
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
            # Changing a route and navigating an old result must not restore a stale clear.
            build(['retry']);page.locator('[data-case="1"]').click();expect(page.locator('#rg-next')).to_be_disabled()
            build(SAFE);page.locator('#rg-run').click();expect(page.locator('#rg-next')).to_be_enabled()
            checks.append('Direct scene inspection; causal route playback; player-created quick/expired storms change the outcome without granting a boss clear; stale-result navigation remains invalidated')
            next_level();expect(page.locator('.rg-incident')).to_be_visible()
            expect(page.locator('.rg-results')).to_have_count(0)
            build(SAFE);page.locator('#rg-aid').select_option('none')
            shot('rescue-transfer-before.png')
            # Commit at the real service, lose its response, retry SAME submission.
            def lose_ack(route):route.fetch();route.abort('failed')
            page.route('**/api/commands/submit',lose_ack,times=1)
            page.locator('#rg-run').click();expect(page.locator('#rg-retry-save')).to_be_visible()
            page.locator('#rg-retry-save').click();expect(page.locator('#rg-kit')).to_be_visible()
            expect(page.locator('.rg-case-tabs button')).to_have_count(6);shot('rescue-transfer-after.png')
            state=page.evaluate("async()=> (await fetch('/api/state')).json()")
            assert state['attempt']['assessment']['outcome']=='correct'
            assert state['attempt']['assessment']['independence']=='declared_independent'
            assert state['attempt']['assessment']['scope'].startswith('Sealed policy tested')
            assert state['attempt']['assessment']['reasoning']['outcome']=='not_observed'
            assert state['attempt']['assessment']['score']==1
            expect(page.locator('#rg-evidence-json')).to_contain_text('declared_independent')
            expect(page.locator('#rg-evidence-json')).to_contain_text('not_observed')
            expect(page.locator('#rg-evidence-json')).to_contain_text('repair-kit')
            checks.append('Constructed route and sealed transfer preserve unknown/current help/prior exposure distinctions; dropped submit acknowledgement replays one server command')
            ctx.tracing.stop(path=str(out/'rescue-browser-trace.zip'))
            ctx.close()

            for width in (390,320):
                c=b.new_context(viewport=dict(width=width,height=844),has_touch=True,reduced_motion='reduce');c.add_init_script(ONBOARDING_DONE)
                m=c.new_page();m.on('pageerror',lambda e:errors.append(str(e)));m.goto(url);expect(m.locator('#rg-launch')).to_be_visible();m.locator('#rg-launch').click();expect(m.locator('#rg-feedback')).to_be_visible()
                assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
                expect(m.locator('[data-world-look="workshop"]')).to_be_visible()
                m.locator('[data-world-look="workshop"]').click();expect(m.locator('#rg-effects')).to_have_text('1 gear')
                m.locator('[data-tool="retry"]').click();expect(m.locator('#rg-sync')).to_have_text('Saved')
                assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
                m.screenshot(path=str(out/f'rescue-mobile-{width}.png'),full_page=True);c.close()
            checks.append('Reduced-motion full journey; 390/320 touch layouts; no horizontal overflow')
            assert not errors,errors
            (out/'rescue-browser-report.json').write_text(json.dumps(dict(result='passed',checks=checks,page_errors=errors,browser=b.version,review_method='internal_tool_assisted',audience_validation='not human tested',learning_scope='bounded transfer; no implementation/retention efficacy claim'),indent=2))
        finally:
            b.close();stop_server(proc)
if __name__=='__main__':main()
