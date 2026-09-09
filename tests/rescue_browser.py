"""Real browser field play and sealed transfer, not a human-enjoyment measurement."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from tests.browser_check import start_server,stop_server

ROOT=Path(__file__).resolve().parents[1]
SAFE=['remember','match','reconcile','retry']

def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);errors=[];checks=[]
    with tempfile.TemporaryDirectory() as tmp,sync_playwright() as p:
        proc,url=start_server(Path(tmp)/'rescue.db');b=p.chromium.launch()
        ctx=b.new_context(viewport=dict(width=1440,height=1000));ctx.tracing.start(screenshots=True,snapshots=True,sources=True)
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
            expect(page.locator('#rgi-intro')).to_be_visible()
            expect(page.locator('#rgi-title')).to_have_text('Pip keeps the valley moving.')
            expect(page.locator('#rgi-body')).to_contain_text('bridge repair')
            shot('rescue-intro-01.png')
            for expected in [
                'The order was sent. The reply vanished.',
                'Retrying blindly can make two.',
                'Recover the truth. Restore seven signals.',
                'Software faces the same missing-reply problem.',
            ]:
                page.locator('#rgi-next').click();expect(page.locator('#rgi-title')).to_have_text(expected)
            expect(page.locator('#rgi-body')).to_contain_text('one intent lead to one safe result')
            shot('rescue-intro-05.png')
            page.locator('#rgi-next').click();expect(page.locator('#rg-feedback')).to_be_visible()
            checks.append('Five-beat opening establishes Pip, valley, lost reply, duplicate risk, player mission and real-software transfer before Signal 1')
            page.locator('#rg-map').click();expect(page.locator('#rg-launch')).to_be_visible()
            page.locator('#rg-options').click();expect(page.locator('#rg-replay-story')).to_be_visible()
            page.locator('#rg-replay-story').click();expect(page.locator('#rgi-intro')).to_be_visible()
            page.locator('#rgi-skip').click();expect(page.locator('#rgi-intro')).to_have_count(0)
            expect(page.locator('#rg-launch')).to_be_focused()
            checks.append('Opening is replayable from the game menu and skippable without losing access to Signal 1')
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
            assert state['attempt']['practice_xp']==70
            assert len(state['attempt']['response']['rescue']['moves'])==1
            with page.expect_download() as dl:page.locator('#rg-kit a').click()
            assert dl.value.suggested_filename=='relay-repair-kit.zip'
            checks.append('Constructed route rejects send-first program; draft recovery; sealed new export context; dropped submit acknowledgement retried exactly once; lab archive downloads')
            page.locator('#rg-map').click();expect(page.locator('#rg-launch')).to_be_visible()
            for width in (390,320):
                mc=b.new_context(viewport=dict(width=width,height=844),has_touch=True,reduced_motion='reduce')
                m=mc.new_page();m.on('pageerror',lambda e:errors.append(str(e)));m.goto(url)
                expect(m.locator('#rgi-static')).to_be_visible()
                expect(m.locator('#rgi-static')).to_contain_text('Pip keeps the valley moving.')
                expect(m.locator('#rgi-static')).to_contain_text('Retrying blindly can make two.')
                assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
                m.locator('#rg-launch').tap();expect(m.locator('[data-tool="retry"]')).to_be_visible()
                assert m.locator('[data-tool="retry"]').bounding_box()['y']<844
                assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
                m.screenshot(path=str(out/f'rescue-mobile-{width}.png'),full_page=True)
                before=m.locator('#rg-feedback').evaluate('n=>parseFloat(getComputedStyle(n).fontSize)')
                m.evaluate("document.documentElement.style.fontSize='200%'")
                assert m.locator('#rg-feedback').evaluate('n=>parseFloat(getComputedStyle(n).fontSize)')>=before*1.99
                assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
                m.locator('[data-tool="retry"]').tap();expect(m.locator('#rg-next')).to_be_enabled()
                m.screenshot(path=str(out/f'rescue-text-{width}.png'),full_page=True)
                m.evaluate("document.documentElement.style.fontSize=''")
                def advance_mobile():
                    old=m.locator('.rg-top>span').inner_text()
                    m.locator('#rg-next').tap();expect(m.locator('.rg-top>span')).not_to_have_text(old)
                def mobile_move(action):
                    m.locator(f'[data-tool="{action}"]').tap()
                    expect(m.locator('#rg-feedback')).not_to_have_text('Pip is trying your idea…')
                for route in [['remember','retry'],['match'],['inspect','collect'],['inspect','pause','inspect','retry']]:
                    advance_mobile()
                    for action in route:mobile_move(action)
                advance_mobile();expect(m.locator('#rg-run')).to_be_visible()
                for block in SAFE:m.locator(f'[data-block="{block}"]').tap()
                m.locator('#rg-run').tap();expect(m.locator('#rg-next')).to_be_enabled()
                m.evaluate("document.documentElement.style.fontSize='200%'")
                assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
                m.screenshot(path=str(out/f'rescue-machine-mobile-{width}.png'),full_page=True)
                m.evaluate("document.documentElement.style.fontSize=''");advance_mobile()
                expect(m.locator('.rg-incident')).to_be_visible()
                m.locator('#rg-clear-route').tap()
                for block in SAFE:m.locator(f'[data-block="{block}"]').tap()
                m.locator('#rg-aid').select_option('none');m.locator('#rg-run').tap()
                expect(m.locator('#rg-kit')).to_be_visible()
                assert m.evaluate('document.documentElement.scrollWidth<=innerWidth')
                isolated=m.evaluate("async()=> (await fetch('/api/state')).json()")
                assert isolated['learner_id']!=state['learner_id']
                assert all(mission['status']=='cleared' for mission in isolated['course']['rescue'])
                assert isolated['attempt']['assessment']['independence']=='declared_independent'
                mc.close()
            checks.append('Reduced-motion opening preserves all five causal beats; full seven-encounter 390/320px touch journeys; first action inside viewport; actual 200% text including construction workbench; isolated final transfer evidence')
            assert errors==[],errors
            (out/'rescue-browser-report.json').write_text(json.dumps(dict(result='passed',checks=checks,page_errors=errors,browser=b.version,review_method='internal_tool_assisted',audience_validation='not human tested',learning_scope='bounded transfer; no implementation/retention efficacy claim'),indent=2))
        finally:
            shot('rescue-last-screen.png');ctx.tracing.stop(path=str(out/'rescue-browser-trace.zip'));b.close();stop_server(proc)

if __name__=='__main__':main()
