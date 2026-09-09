"""Rendered first-minute/Signal-1 contract; machine UX evidence, not a child playtest."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parents[1]


def main():
    out = ROOT / 'artifacts'; out.mkdir(exist_ok=True)
    errors, checks = [], []
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        proc, url = start_server(Path(tmp) / 'onboarding.db')
        browser = p.chromium.launch()
        try:
            ctx = browser.new_context(viewport={'width':390,'height':844}, has_touch=True)
            page = ctx.new_page(); page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(url)
            expect(page.locator('#rgi-intro')).to_be_visible()
            expect(page.locator('#rgi-title')).to_have_text('Pip has one job: get the bridge moving.')
            page.screenshot(path=str(out/'onboarding-beat-1.png'), full_page=True)
            titles = [
                'One gear makes the bridge move.',
                'Pip already asked for the gear.',
                'The workshop may have finished. The reply did not.',
                'No reply does not mean “nothing happened.”',
                'Look first. Then choose.',
            ]
            for title in titles:
                page.locator('#rgi-next').click()
                expect(page.locator('#rgi-title')).to_have_text(title)
            expect(page.locator('#rgi-fact')).to_have_text('First action: inspect.')
            page.screenshot(path=str(out/'onboarding-beat-final.png'), full_page=True)
            page.locator('#rgi-next').click()

            coach = page.locator('.rgc1-coach')
            expect(coach).to_be_visible()
            expect(coach).to_contain_text('Where would the bridge gear come from?')
            expect(page.locator('.rg-observations')).to_have_count(0)
            expect(page.locator('[data-world-look="workshop"]')).to_be_enabled()
            expect(page.locator('[data-world-look="ticket"]')).to_be_disabled()
            expect(page.locator('[data-tool="retry"]')).to_be_disabled()
            expect(page.locator('.rg-console')).to_be_hidden()
            page.screenshot(path=str(out/'signal1-first-action.png'), full_page=True)

            page.locator('[data-world-look="workshop"]').click()
            expect(page.locator('#rg-effects')).to_have_text('1 gear')
            expect(coach).to_contain_text('Which order did Pip already send?')
            expect(page.locator('[data-world-look="ticket"]')).to_be_enabled()
            page.locator('[data-world-look="ticket"]').click()
            expect(coach).to_contain_text('The workshop may already have made the gear.')
            expect(page.locator('[data-tool="retry"]')).to_be_enabled()
            expect(page.locator('[data-tool="new"]')).to_be_enabled()
            expect(page.locator('.rgc1-dock')).to_be_visible()
            expect(page.locator('.rgc1-dock .rg-ticket')).to_be_visible()
            expect(page.locator('.rgc1-dock .rg-tools')).to_be_visible()
            expect(page.locator('.rg-console')).to_be_hidden()
            expect(page.locator('.rg-evidence')).to_be_hidden()
            page.screenshot(path=str(out/'signal1-first-choice.png'), full_page=True)
            checks.append('Signal 1 uses one scene-owned control surface, reveals one obvious inspection at a time, then exposes the first decision in a compact playfield action dock rather than a website panel stack')

            page.locator('[data-tool="new"]').click()
            expect(coach).to_contain_text('A NEW TICKET')
            page.locator('[data-tool="retry"]').click()
            expect(page.locator('[data-tool="rewind"]')).to_be_visible()
            expect(coach).to_contain_text('Two gears')
            page.screenshot(path=str(out/'signal1-visible-mistake.png'), full_page=True)
            page.locator('[data-tool="rewind"]').click()
            page.locator('[data-tool="retry"]').click()
            expect(page.locator('.rgc1-recap')).to_be_visible()
            expect(page.locator('.rgc1-recap')).to_contain_text('Idempotent retry')
            expect(page.locator('.rgc1-recap')).to_contain_text('The gear')
            expect(page.locator('.rgc1-recap')).to_contain_text('missing reply')
            checks.append('Wrong action produces a visible duplicate, rewind teaches recovery, and formal terminology appears after concrete success')
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            ctx.close()

            reduced = browser.new_context(viewport={'width':390,'height':844}, has_touch=True, reduced_motion='reduce')
            r = reduced.new_page(); r.on('pageerror', lambda e: errors.append(str(e))); r.goto(url)
            expect(r.locator('#rgi-intro')).to_have_count(0)
            expect(r.locator('#rgi-static')).to_be_visible()
            expect(r.locator('#rgi-static li')).to_have_count(6)
            expect(r.locator('#rgi-static')).to_contain_text('No reply does not mean')
            assert r.evaluate('document.documentElement.scrollWidth<=innerWidth')
            checks.append('Reduced-motion players receive the complete causal story without auto-animation or lost meaning')
            reduced.close()

            assert errors == [], errors
            (out/'onboarding-browser-report.json').write_text(json.dumps({
                'result':'passed','browser':browser.version,'checks':checks,'page_errors':errors,
                'review_method':'automated browser evidence; not child/young-adult enjoyment validation'
            }, indent=2), encoding='utf-8')
        finally:
            browser.close(); stop_server(proc)


if __name__ == '__main__':
    main()
