"""Direct world-input proof for the PlayCanvas first-touch story.

This is interaction/runtime evidence, not a delight score. The primary path taps
rendered geometry; the existing primary button remains the accessible fallback.
"""
import json
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

from tests.browser_check import start_server, stop_server

ROOT = Path(__file__).resolve().parents[1]


def main():
    out = ROOT / "artifacts"
    out.mkdir(exist_ok=True)
    errors = []
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        proc, url = start_server(Path(tmp) / "playcanvas-story-input.db")
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True)
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        try:
            page.goto(url)
            expect(page.locator("#rgi-intro")).to_be_visible()
            expect(page.locator("#rgi-title")).to_have_text("Pip is almost home.")
            canvas = page.locator(".vl-playcanvas-engine")
            expect(canvas).to_be_visible()

            # Establish the world, then the first causal discovery must be a real
            # renderer interaction rather than six consecutive Continue clicks.
            page.locator("#rgi-next").click()
            expect(page.locator("#rgi-title")).to_have_text("One tiny gear stops everything.")
            expect(page.locator("#rgi-next")).to_have_attribute("data-story-action", "broken-gear")
            expect(page.locator("#rgi-next")).to_contain_text("Inspect broken gear")

            box = canvas.bounding_box()
            assert box and box["width"] > 1 and box["height"] > 1, box
            page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] * .43)
            expect(page.locator("#rgi-title")).to_have_text("Pip sends one promise.")
            expect(page.locator("#rgi-intro")).to_have_attribute("data-last-world-action", "broken-gear")
            expect(page.locator("#rgi-next")).to_have_attribute("data-story-action", "forge")
            expect(page.locator("#rgi-next")).to_contain_text("Send order-01")

            # Keyboard/touch accessibility fallback remains fully usable.
            page.locator("#rgi-next").focus()
            page.keyboard.press("Enter")
            expect(page.locator("#rgi-title")).to_have_text("Lightning takes the answer.")
            expect(page.locator("#rgi-next")).to_have_attribute("data-story-action", "signal")
            expect(page.locator("#rgi-next")).to_contain_text("Trace the lost reply")

            page.screenshot(path=str(out / "playcanvas-story-world-action.png"), full_page=True)
            assert errors == [], errors
            print(json.dumps({
                "result": "passed",
                "browser": browser.version,
                "checks": [
                    "The first causal inspection advances by tapping rendered PlayCanvas geometry.",
                    "Story actions expose semantic target ids without making renderer state authoritative.",
                    "The same action remains keyboard-operable through the accessible primary-button fallback."
                ],
                "page_errors": errors,
                "review_method": "automated interaction evidence; not a delight or youth-playtest score"
            }, indent=2))
        finally:
            context.close()
            browser.close()
            stop_server(proc)


if __name__ == "__main__":
    main()
