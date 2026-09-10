"""Rendered phone-first Echo Forge/Signal-1 contract; machine UX evidence, not a youth playtest."""
import json
import re
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parents[1]
PHONE_VIEWPORTS = ((360, 800), (390, 844), (430, 932))


def assert_phone_first_touch(browser, url, out, errors, width, height):
    ctx = browser.new_context(viewport={'width': width, 'height': height}, has_touch=True)
    page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(url)
    expect(page.locator('#rgi-intro')).to_be_visible()
    expect(page.locator('.rgi-three-canvas')).to_be_visible()
    expect(page.locator('#rgi-title')).to_have_text('Pip is almost home.')
    expect(page.locator('#rgi-body')).to_be_visible()
    expect(page.locator('#rgi-dialogue')).to_be_visible()
    expect(page.locator('#rgi-next')).to_be_visible()
    expect(page.locator('#rgi-back')).to_be_visible()
    expect(page.locator('#rgi-replay-beat')).to_be_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    world = page.locator('#rgi-world').bounding_box()
    back = page.locator('#rgi-back').bounding_box()
    nxt = page.locator('#rgi-next').bounding_box()
    replay = page.locator('#rgi-replay-beat').bounding_box()
    assert world and world['height'] >= height * .50
    assert back and back['height'] >= 44
    assert nxt and nxt['height'] >= 44
    assert replay and replay['height'] >= 44
    assert max(back['y'] + back['height'], nxt['y'] + nxt['height']) <= height + 1
    page.screenshot(path=str(out / f'onboarding-phone-{width}.png'), full_page=True)
    ctx.close()


def main():
    out = ROOT / 'artifacts'; out.mkdir(exist_ok=True)
    errors, checks = [], []
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        proc, url = start_server(Path(tmp) / 'onboarding.db')
        browser = p.chromium.launch()
        try:
            for width, height in PHONE_VIEWPORTS:
                assert_phone_first_touch(browser, url, out, errors, width, height)
            checks.append('First touch keeps the 3D world dominant, story copy readable, and primary/secondary controls touchable across representative 360–430px Android/iPhone portrait sizes')

            ctx = browser.new_context(viewport={'width':390,'height':844}, has_touch=True)
            page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(url)
            expect(page.locator('#rgi-intro')).to_be_visible()
            expect(page.locator('#rgi-title')).to_have_text('Pip is almost home.')
            expect(page.locator('#rgi-back')).to_be_disabled()
            expect(page.locator('#rgi-next')).to_be_enabled()
            expect(page.locator('.rgi-three-canvas')).to_be_visible()
            # Fresh first-touch story is user-paced; it must not move while the player reads.
            page.wait_for_timeout(3600)
            expect(page.locator('#rgi-title')).to_have_text('Pip is almost home.')
            page.screenshot(path=str(out/'onboarding-echo-forge-01.png'), full_page=True)

            # Back/forward is real scene navigation, not a restart-only escape hatch.
            page.locator('#rgi-next').click()
            expect(page.locator('#rgi-title')).to_have_text('One tiny gear stops everything.')
            expect(page.locator('#rgi-back')).to_be_enabled()
            page.locator('#rgi-back').click()
            expect(page.locator('#rgi-title')).to_have_text('Pip is almost home.')
            page.locator('#rgi-next').click()
            page.locator('#rgi-pause').click(); expect(page.locator('#rgi-pause')).to_have_text('Resume motion')
            page.locator('#rgi-pause').click(); expect(page.locator('#rgi-pause')).to_have_text('Pause motion')

            titles = [
                'Pip sends one promise.',
                'The gear survives. The reply does not.',
                '“Just send another” has a cost.',
                'The storm wakes something for you.',
            ]
            for title in titles:
                page.locator('#rgi-next').click()
                expect(page.locator('#rgi-title')).to_have_text(title)
            expect(page.locator('#rgi-fact')).to_have_text('First move: inspect the Echo Forge.')
            expect(page.locator('#rgi-dialogue')).to_contain_text('Help me find out what happened')
            expect(page.locator('.rgi-progress .current')).to_have_count(1)
            page.screenshot(path=str(out/'onboarding-echo-forge-06.png'), full_page=True)
            checks.append('The Echo Forge opening is a single user-paced story world with real Back/Continue controls, optional motion pause/replay, no forced autoplay, and a visible six-scene progression')
            page.locator('#rgi-next').click()

            coach = page.locator('.rgc1-coach')
            expect(coach).to_be_visible()
            expect(coach).to_contain_text('Where would the bridge gear have been made?')
            expect(page.locator('.rg-observations')).to_have_count(0)
            expect(page.locator('[data-world-look="workshop"]')).to_be_enabled()
            expect(page.locator('[data-world-look="workshop"]')).to_have_text('Echo Forge')
            expect(page.locator('[data-world-look="ticket"]')).to_be_disabled()
            expect(page.locator('[data-tool="retry"]')).to_be_disabled()
            expect(page.locator('.rgc1-mission-canvas')).to_be_visible()
            expect(page.locator('.rg-world')).to_have_class(re.compile(r'rgc1-three-ready'))
            expect(page.locator('.rg-console')).to_be_hidden()
            forge_target = page.locator('[data-world-look="workshop"]').bounding_box()
            assert forge_target and forge_target['height'] >= 44 and forge_target['width'] >= 96
            page.screenshot(path=str(out/'signal1-echo-forge-first-action.png'), full_page=True)

            page.locator('[data-world-look="workshop"]').click()
            expect(page.locator('#rg-effects')).to_have_text('1 gear')
            expect(coach).to_contain_text('Which order did Pip already send?')
            expect(page.locator('[data-world-look="ticket"]')).to_be_enabled()
            page.locator('[data-world-look="ticket"]').click()
            expect(coach).to_contain_text('The Echo Forge may already have made the gear.')
            expect(page.locator('[data-tool="retry"]')).to_be_enabled()
            expect(page.locator('[data-tool="new"]')).to_be_enabled()
            expect(page.locator('.rgc1-dock')).to_be_visible()
            expect(page.locator('.rgc1-dock .rg-ticket')).to_be_visible()
            expect(page.locator('.rgc1-dock .rg-tools')).to_be_visible()
            expect(page.locator('.rg-console')).to_be_hidden()
            expect(page.locator('.rg-evidence')).to_be_hidden()
            page.screenshot(path=str(out/'signal1-echo-forge-first-choice.png'), full_page=True)
            checks.append('Signal 1 continues inside the same Echo Forge 3D world and reveals one obvious action at a time before the first meaningful choice')

            page.locator('[data-tool="new"]').click()
            expect(coach).to_contain_text('A NEW TICKET')
            page.locator('[data-tool="retry"]').click()
            expect(page.locator('[data-tool="rewind"]')).to_be_visible()
            expect(coach).to_contain_text('Two gears')
            page.screenshot(path=str(out/'signal1-echo-forge-visible-mistake.png'), full_page=True)
            page.locator('[data-tool="rewind"]').click()
            page.locator('[data-tool="retry"]').click()
            expect(page.locator('.rgc1-recap')).to_be_visible()
            expect(page.locator('.rgc1-recap')).to_contain_text('Idempotent retry')
            expect(page.locator('.rgc1-recap')).to_contain_text('Echo Forge')
            expect(page.locator('.rgc1-recap')).to_contain_text('missing reply')
            checks.append('Wrong identity visibly creates the second gear, rewind recovers, and formal terminology is named only after concrete success')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            ctx.close()

            reduced = browser.new_context(viewport={'width':390,'height':844}, has_touch=True, reduced_motion='reduce')
            r = reduced.new_page(); r.on('pageerror', lambda e: errors.append(str(e))); r.goto(url)
            expect(r.locator('#rgi-intro')).to_be_visible()
            expect(r.locator('#rgi-pause')).to_be_hidden()
            expect(r.locator('#rgi-back')).to_be_disabled()
            for _ in range(5): r.locator('#rgi-next').click()
            expect(r.locator('#rgi-title')).to_have_text('The storm wakes something for you.')
            expect(r.locator('#rgi-fact')).to_have_text('First move: inspect the Echo Forge.')
            r.locator('#rgi-back').click(); expect(r.locator('#rgi-title')).to_have_text('“Just send another” has a cost.')
            assert r.evaluate('document.documentElement.scrollWidth<=innerWidth')
            checks.append('Reduced-motion players keep the same reversible six-scene causal story with no forced motion or lost meaning')
            reduced.close()

            assert errors == [], errors
            (out/'onboarding-browser-report.json').write_text(json.dumps({
                'result':'passed','browser':browser.version,'checks':checks,'page_errors':errors,
                'phone_viewports':[{'width':w,'height':h} for w,h in PHONE_VIEWPORTS],
                'review_method':'automated browser evidence; not child/young-adult enjoyment validation'
            }, indent=2), encoding='utf-8')
        finally:
            browser.close(); stop_server(proc)


if __name__ == '__main__':
    main()
