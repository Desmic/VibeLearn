"""Real browser + real HTTP process + real temporary DB. Never uses learner data."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent


def start_server(database, port=0):
    process = subprocess.Popen(
        [sys.executable, "-u", "-m", "app.server", "--db", str(database), "--port", str(port)],
        cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, encoding="utf-8",
    )
    line = process.stdout.readline().strip()
    if "http://" not in line:
        process.terminate()
        raise RuntimeError(f"Server failed to start: {line}")
    return process, line.split(" at ")[1]


def stop_server(process):
    if process.poll() is None:
        process.terminate()
        process.wait(timeout=10)
    process.stdout.close()


def select_outcome(page, run, charges):
    page.get_by_role("button", name=f"{run}: {charges} total charge{'s' if charges != 1 else ''}", exact=True).click()


def launch(page, mission_id, mode=None):
    page.locator(f'[data-mission-id="{mission_id}"]').click()
    if mode:
        page.locator("#start-mode").select_option(mode)
    page.get_by_role("button", name="Launch mission", exact=True).click()
    expect(page.locator("#episode")).to_be_visible()


def main():
    artifacts = ROOT / "artifacts"
    artifacts.mkdir(exist_ok=True)
    checks = []
    with tempfile.TemporaryDirectory() as directory, sync_playwright() as playwright:
        database = Path(directory) / "browser.sqlite3"
        process, url = start_server(database)
        browser = None
        try:
            browser = playwright.chromium.launch()
            context = browser.new_context(viewport={"width": 1440, "height": 1000})
            page = context.new_page()
            page_errors = []
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            page.goto(url)
            expect(page).to_have_title("vibeLearn · Reliable agents")

            # Fresh player sees a true progression path: tutorial only, then locked future missions.
            expect(page.locator("#entry")).to_be_visible()
            expect(page.locator(".mission-node")).to_have_count(4)
            expect(page.locator('[data-mission-id="retry-01-replay"]')).to_have_attribute("data-status", "unlocked")
            for mission in ("retry-02-identity", "retry-03-retention", "retry-04-boss"):
                expect(page.locator(f'[data-mission-id="{mission}"]')).to_be_disabled()
            expect(page.locator("#campaign-clear-count")).to_have_text("0 / 4 cleared")
            expect(page.locator("#campaign-xp")).to_contain_text("0 XP")
            page.screenshot(path=str(artifacts / "game-campaign.png"), full_page=True)
            checks.append("fresh campaign starts with one easy unlocked mission and visible future path")

            # Server-side lock, not merely a disabled map node.
            forged = page.evaluate("""async () => {
                const response = await fetch('/api/commands/start', {method:'POST', headers:{'Content-Type':'application/json','X-Learning-Command':'1'}, body:JSON.stringify({command_id:crypto.randomUUID(), expected_revision:0, mode:'LEARN', mission_id:'retry-03-retention'})});
                return {status:response.status, body:await response.json()};
            }""")
            assert forged["status"] == 403 and forged["body"]["error"] == "MISSION_LOCKED"
            checks.append("locked future missions are enforced on the server")

            # Level 1: one mechanic, one decision, no source or play-style complexity.
            launch(page, "retry-01-replay")
            expect(page.locator("#hud-level")).to_have_text("LV 1")
            expect(page.locator("#hud-difficulty")).to_have_text("Tutorial")
            expect(page.locator("#prediction-board .decision-row")).to_have_count(1)
            expect(page.locator("#diagnosis-wrap")).to_be_hidden()
            expect(page.locator("#dock-source")).to_be_hidden()
            expect(page.locator("#dock-mode")).to_be_disabled()
            expect(page.locator("#dock-save")).to_be_disabled()
            select_outcome(page, "A", 1)
            expect(page.get_by_role("button", name="A: 1 total charge", exact=True)).to_have_attribute("aria-pressed", "true")
            expect(page.locator("#hud-save-value")).to_have_text("Unsaved")
            expect(page.locator("#dock-save")).to_be_enabled()
            page.screenshot(path=str(artifacts / "game-level1.png"), full_page=True)

            # HUD Save -> real database -> full browser reload -> exact decision restored.
            page.get_by_role("button", name="Save", exact=True).click()
            expect(page.locator("#save-status")).to_have_text("Progress saved to local database")
            expect(page.locator("#hud-save-value")).to_have_text("Synced")
            page.reload()
            expect(page.locator("#hud-level")).to_have_text("LV 1")
            expect(page.get_by_role("button", name="A: 1 total charge", exact=True)).to_have_attribute("aria-pressed", "true")
            checks.append("HUD save and browser reload resume exact Level 1 progress")

            page.get_by_role("button", name="Lock in answer", exact=True).click()
            expect(page.locator("#recap-kicker")).to_have_text("MISSION CLEAR")
            expect(page.locator("#recap-title")).to_have_text("1 of 1 outcomes correct")
            expect(page.locator("#reward-message")).to_contain_text("+10 XP")
            expect(page.locator("#hud-xp-value")).to_have_text("10")
            page.locator("#repeat").click()
            expect(page.locator('[data-mission-id="retry-01-replay"]')).to_have_attribute("data-status", "cleared")
            expect(page.locator('[data-mission-id="retry-02-identity"]')).to_have_attribute("data-status", "unlocked")
            expect(page.locator('[data-mission-id="retry-03-retention"]')).to_be_disabled()
            checks.append("easy clear gives immediate XP and unlocks only the next mission")

            # Level 2: contrasting identity failure, still one decision and LEARN-only.
            launch(page, "retry-02-identity")
            expect(page.locator("#hud-level")).to_have_text("LV 2")
            expect(page.locator("#prediction-board .decision-row")).to_have_count(1)
            expect(page.locator("#dock-source")).to_be_hidden()
            expect(page.locator("#dock-mode")).to_be_disabled()
            select_outcome(page, "A", 2)
            page.get_by_role("button", name="Lock in answer", exact=True).click()
            expect(page.locator("#recap-kicker")).to_have_text("MISSION CLEAR")
            expect(page.locator("#hud-xp-value")).to_have_text("20")
            page.locator("#repeat").click()
            expect(page.locator('[data-mission-id="retry-03-retention"]')).to_have_attribute("data-status", "unlocked")
            expect(page.locator('[data-mission-id="retry-04-boss"]')).to_be_disabled()
            checks.append("Level 2 adds a variation without increasing interface complexity")

            # Level 3: two decisions + first short explanation + optional assisted tools.
            launch(page, "retry-03-retention")
            expect(page.locator("#hud-level")).to_have_text("LV 3")
            expect(page.locator("#prediction-board .decision-row")).to_have_count(2)
            expect(page.locator("#diagnosis-wrap")).to_be_visible()
            expect(page.locator("#dock-source")).to_be_visible()
            expect(page.locator("#dock-mode")).to_be_enabled()
            select_outcome(page, "A", 1)
            select_outcome(page, "B", 2)
            page.locator("#diagnosis").fill("The same intent key protects the retry only while its stored result is still retained.")

            # Intel is present in HUD but gated in LEARN; PAIR unlocks it and records assistance.
            page.locator("#dock-source").click()
            expect(page.locator("#source")).to_be_disabled()
            page.get_by_role("button", name="Close intel panel", exact=True).click()
            page.locator("#dock-mode").click()
            page.locator("#working-mode").select_option("PAIR")
            page.get_by_role("button", name="Apply style", exact=True).click()
            expect(page.locator("#mode-label")).to_have_text("PAIR")
            page.locator("#dock-source").click()
            expect(page.locator("#source")).to_be_enabled()
            page.get_by_role("button", name="Reveal intel source", exact=True).click()
            expect(page.locator("#source-link")).to_have_attribute("href", "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/")
            page.get_by_role("button", name="Close intel panel", exact=True).click()
            checks.append("secondary help/source controls live in HUD drawers and preserve aid semantics")

            # Saved Level 3 progress survives an actual server process restart.
            page.locator("#dock-save").click()
            expect(page.locator("#hud-save-value")).to_have_text("Synced")
            port = int(url.rsplit(":", 1)[1])
            stop_server(process)
            process, _ = start_server(database, port)
            page.reload()
            expect(page.locator("#hud-level")).to_have_text("LV 3")
            expect(page.get_by_role("button", name="A: 1 total charge", exact=True)).to_have_attribute("aria-pressed", "true")
            expect(page.get_by_role("button", name="B: 2 total charges", exact=True)).to_have_attribute("aria-pressed", "true")
            expect(page.locator("#diagnosis")).to_have_value("The same intent key protects the retry only while its stored result is still retained.")
            checks.append("HUD decisions and diagnosis survive actual process restart")

            page.get_by_role("button", name="Lock in answer", exact=True).click()
            expect(page.locator("#recap-kicker")).to_have_text("MISSION CLEAR")
            page.locator("#repeat").click()
            expect(page.locator('[data-mission-id="retry-04-boss"]')).to_have_attribute("data-status", "unlocked")
            checks.append("Level 3 combines prior rules and unlocks the boss")

            # Boss recombines all mechanics and requires the full architecture diagnosis.
            launch(page, "retry-04-boss", "LEARN")
            expect(page.locator("#hud-level")).to_have_text("BOSS")
            expect(page.locator("#prediction-board .decision-row")).to_have_count(3)
            select_outcome(page, "A", 2)
            select_outcome(page, "B", 1)
            select_outcome(page, "C", 2)
            page.locator("#diagnosis").fill("Persist a business-intent key across retries, bind it to the payload, and reconcile uncertain late calls after the retention contract expires.")

            # Keyboard, narrow mobile, 200% text, and reduced motion all remain viable.
            page.locator("#diagnosis").focus()
            page.keyboard.press("Tab")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.set_viewport_size({"width": 390, "height": 844})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.screenshot(path=str(artifacts / "game-boss-mobile.png"), full_page=True)
            page.evaluate("document.documentElement.style.fontSize='200%'")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.evaluate("document.documentElement.style.fontSize=''")
            page.set_viewport_size({"width": 1440, "height": 1000})
            checks.append("HUD game shell survives keyboard, 390px viewport and 200% text")

            # Drop the submit acknowledgement after a real commit, then retry the same command.
            def lose_ack(route):
                route.fetch()
                route.abort("failed")
            page.route("**/api/commands/submit", lose_ack, times=1)
            page.get_by_role("button", name="Lock in answer", exact=True).click()
            expect(page.locator("#save-status")).to_have_text("Not saved · answer retained")
            expect(page.locator("#diagnosis")).to_have_value("Persist a business-intent key across retries, bind it to the payload, and reconcile uncertain late calls after the retention contract expires.")
            page.get_by_role("button", name="Lock in answer", exact=True).click()
            expect(page.locator("#recap-title")).to_have_text("3 of 3 outcomes correct")
            expect(page.locator("#recap-kicker")).to_have_text("MISSION CLEAR")
            expect(page.locator("#hud-xp-value")).to_have_text("40")
            page.locator("#checkpoint-details summary").click()
            expect(page.locator("#checkpoint-list")).to_contain_text("submission")
            page.locator("#evidence-details summary").click()
            expect(page.locator("#evidence-json")).to_contain_text("snapshot_digest")
            page.screenshot(path=str(artifacts / "game-boss-clear.png"), full_page=True)
            checks.append("boss clear retries lost acknowledgement without duplicate evidence or XP")

            page.locator("#repeat").click()
            expect(page.locator("#campaign-clear-count")).to_have_text("4 / 4 cleared")
            expect(page.locator("#campaign-xp")).to_contain_text("40 XP")
            checks.append("full chapter progression reaches four clears with visible macro progress")

            # A separate browser remains a fresh learner and cannot mutate the first learner's state.
            first_state = page.evaluate("async () => await (await fetch('/api/state')).json()")
            other = browser.new_context(viewport={"width": 390, "height": 844})
            other_page = other.new_page()
            other_page.goto(url)
            expect(other_page.locator("#campaign-clear-count")).to_have_text("0 / 4 cleared")
            expect(other_page.locator('[data-mission-id="retry-02-identity"]')).to_be_disabled()
            other_state = other_page.evaluate("async () => await (await fetch('/api/state')).json()")
            assert first_state["learner_id"] != other_state["learner_id"]
            cross = other_page.evaluate("""async (attempt) => {
                const response = await fetch('/api/commands/save', {method:'POST', headers:{'Content-Type':'application/json','X-Learning-Command':'1'}, body:JSON.stringify({command_id:crypto.randomUUID(), expected_revision:attempt.revision, attempt_id:attempt.id, response:attempt.response})});
                return response.status;
            }""", first_state["attempt"])
            assert cross == 404
            assert other_page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            other.close()
            checks.append("fresh second browser has isolated campaign progression and cannot cross-write")

            reduced = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
            reduced_page = reduced.new_page()
            reduced_page.goto(url)
            assert reduced_page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
            transition = reduced_page.locator(".mission-node").first.evaluate("node => getComputedStyle(node).transitionDuration")
            assert transition in ("0s", "0ms")
            reduced.close()
            checks.append("reduced-motion preference disables game transitions")

            assert page_errors == [], page_errors
            report = {
                "phase": "game-hud-campaign-v1",
                "browser": browser.version,
                "checks": checks,
                "result": "passed",
                "page_errors": page_errors,
                "fault_injection": "One dropped response after a real HTTP commit; one actual process restart; no successful API mocks.",
                "screenshots": ["game-campaign.png", "game-level1.png", "game-boss-mobile.png", "game-boss-clear.png"],
            }
            (artifacts / "browser-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
            print(json.dumps(report, indent=2))
        finally:
            if browser:
                browser.close()
            stop_server(process)


if __name__ == "__main__":
    main()
