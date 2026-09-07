"""Real browser + real HTTP process + real temporary DB. Never uses learner data."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parent.parent


def start_server(database, port=0):
    process = subprocess.Popen([sys.executable, "-u", "-m", "app.server", "--db", str(database), "--port", str(port)], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, encoding="utf-8")
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
            page.get_by_role("button", name="Begin investigation").click()
            expect(page.locator("#prediction")).to_be_visible()
            expect(page.locator("#source")).to_be_disabled()
            assert not page.locator("#source-link").get_attribute("href")
            page.get_by_role("button", name="Submit & reflect").click()
            expect(page.locator("#notice")).to_contain_text("Enter three comma-separated")
            expect(page.locator("#recap")).to_be_hidden()
            checks.append("missing answer rejected without feedback")
            page.locator("#prediction").fill("1, 1, 1")
            page.locator("#diagnosis").fill("Persist an intent key across worker restarts. Bind its payload and reconcile after retention.")
            page.locator("#aid-declaration").select_option("none")
            page.get_by_role("button", name="Save draft", exact=True).click()
            expect(page.locator("#save-status")).to_have_text("Saved to local database")
            page.reload()
            expect(page.locator("#prediction")).to_have_value("1, 1, 1")
            expect(page.locator("#diagnosis")).to_have_value("Persist an intent key across worker restarts. Bind its payload and reconcile after retention.")
            checks.append("real database save and browser reload")

            # Keep typing while a real save request is in flight.
            def edit_during_save(route):
                page.locator("#diagnosis").fill("A newer edit typed while the database save is in flight.")
                route.continue_()
            page.route("**/api/commands/save", edit_during_save, times=1)
            page.get_by_role("button", name="Save draft", exact=True).click()
            expect(page.locator("#save-status")).to_have_text("New edits retained · save again when ready")
            expect(page.locator("#diagnosis")).to_have_value("A newer edit typed while the database save is in flight.")
            checks.append("typing during an in-flight save is not overwritten by its response")

            # A real stopped server, not a fake successful API response.
            port = int(url.rsplit(":", 1)[1])
            stop_server(process)
            page.locator("#diagnosis").fill("This edit must survive a failed request and restart.")
            page.get_by_role("button", name="Save draft", exact=True).click()
            expect(page.locator("#save-status")).to_have_text("Not saved · answer retained")
            expect(page.locator("#diagnosis")).to_have_value("This edit must survive a failed request and restart.")
            process, _ = start_server(database, port)
            page.reload()
            expect(page.locator("#diagnosis")).to_have_value("This edit must survive a failed request and restart.")
            expect(page.locator("#notice")).to_contain_text("Recovered an unsaved answer")
            page.get_by_role("button", name="Save draft", exact=True).click()
            expect(page.locator("#save-status")).to_have_text("Saved to local database")
            checks.append("failed real request preserves draft across restart and reload")

            # Source restriction verified through actual HTTP as well as disabled UI.
            denial = page.evaluate("""async () => {
                const state = await (await fetch('/api/state')).json();
                const response = await fetch('/api/commands/source', {method:'POST', headers:{'Content-Type':'application/json','X-Learning-Command':'1'}, body:JSON.stringify({command_id:crypto.randomUUID(), expected_revision:state.attempt.revision, attempt_id:state.attempt.id, response:state.attempt.response})});
                return {status:response.status, body:await response.json()};
            }""")
            assert denial["status"] == 403 and denial["body"]["error"] == "AID_RESTRICTED"
            page.get_by_role("button", name="Reveal hint 1 of 3", exact=True).click()
            expect(page.locator("#hints li")).to_have_count(1)
            saved = page.evaluate("async () => await (await fetch('/api/state')).json()")
            assert saved["attempt"]["checkpoints"][0]["response"]["prediction"] == "1, 1, 1"
            assert saved["attempt"]["checkpoints"][0]["assistance"] == []
            assert "assessment" not in saved["attempt"]["checkpoints"][0]
            page.get_by_role("button", name="Reveal hint 2 of 3", exact=True).focus()
            page.keyboard.press("Enter")
            expect(page.locator("#hints li")).to_have_count(2)
            page.locator("#working-mode").select_option("PAIR")
            page.get_by_role("button", name="Apply mode", exact=True).click()
            expect(page.locator("#mode-label")).to_have_text("PAIR")
            page.get_by_role("button", name="Open source companion").click()
            expect(page.locator("#source-link")).to_have_attribute("href", "https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/")
            checks.append("pre-hint checkpoint, progressive help and server-enforced source gate")
            page.locator("#working-mode").select_option("LEARN")
            page.get_by_role("button", name="Apply mode", exact=True).click()
            expect(page.locator("#mode-label")).to_have_text("LEARN")
            expect(page.locator("#assistance-status")).to_contain_text("Assisted practice")
            page.locator("#prediction").fill("2, 1, 2")
            page.locator("#diagnosis").fill("Persist the business intent key, bind the payload, and reconcile uncertain calls after the retention window.")
            page.locator("#prediction").focus()
            page.keyboard.press("Tab")
            expect(page.locator("#diagnosis")).to_be_focused()
            page.set_viewport_size({"width": 390, "height": 844})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.evaluate("scrollTo(0,0)")
            page.screenshot(path=str(artifacts / "phase1-mobile.png"), full_page=True)
            page.evaluate("document.documentElement.style.fontSize='200%'")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            page.evaluate("document.documentElement.style.fontSize=''")
            page.set_viewport_size({"width": 1440, "height": 1000})
            page.evaluate("document.activeElement.blur(); scrollTo(0,0)")
            page.screenshot(path=str(artifacts / "phase1-workspace.png"), full_page=True)
            checks.append("keyboard Tab/Enter, 390px layout and 200% text enlargement")

            # Drop an acknowledgement AFTER a real backend commit, then retry.
            def lose_ack(route):
                route.fetch()
                route.abort("failed")
            page.route("**/api/commands/submit", lose_ack, times=1)
            page.get_by_role("button", name="Submit & reflect").click()
            expect(page.locator("#save-status")).to_have_text("Not saved · answer retained")
            expect(page.locator("#diagnosis")).to_have_value("Persist the business intent key, bind the payload, and reconcile uncertain calls after the retention window.")
            page.get_by_role("button", name="Submit & reflect").click()
            expect(page.locator("#recap-title")).to_have_text("3 of 3 trace predictions match")
            expect(page.locator("#evidence-condition")).to_have_text("assisted")
            expect(page.locator("#reward-message")).to_contain_text("+10 practice XP")
            expect(page.locator("#reasoning-status")).to_contain_text("not been graded")
            page.locator("#checkpoint-details summary").click()
            expect(page.locator("#checkpoint-list")).to_contain_text("declared_independent")
            page.locator("#evidence-details summary").click()
            expect(page.locator("#evidence-json")).to_contain_text("snapshot_digest")
            page.locator("#evidence-details summary").click()
            checks.append("real commit with lost acknowledgement retries without duplicate submission or XP")
            stop_server(process)
            process, _ = start_server(database, port)
            page.reload()
            expect(page.locator("#recap-title")).to_have_text("3 of 3 trace predictions match")
            expect(page.locator("#practice-label")).to_contain_text("10 practice XP")
            expect(page.locator("#review-due")).to_contain_text("Review after")
            page.locator("#recap").scroll_into_view_if_needed()
            page.screenshot(path=str(artifacts / "phase1-recap.png"))
            checks.append("evidence, reward and future review survive actual process restart")

            # Another browser session resolves a different learner on the server.
            other = browser.new_context(viewport={"width": 390, "height": 844})
            other_page = other.new_page()
            other_page.goto(url)
            other_page.locator("#start-mode").select_option("BUILD")
            other_page.get_by_role("button", name="Begin investigation").click()
            expect(other_page.locator("#worked-example")).to_contain_text("A commits twice")
            expect(other_page.locator("#prediction")).to_have_value("")
            a_state = page.evaluate("async () => await (await fetch('/api/state')).json()")
            b_state = other_page.evaluate("async () => await (await fetch('/api/state')).json()")
            assert a_state["learner_id"] != b_state["learner_id"]
            assert b_state["attempt"]["practice_xp"] == 0
            cross = other_page.evaluate("""async (attempt) => {
                const response = await fetch('/api/commands/save', {method:'POST', headers:{'Content-Type':'application/json','X-Learning-Command':'1'}, body:JSON.stringify({command_id:crypto.randomUUID(), expected_revision:attempt.revision, attempt_id:attempt.id, response:attempt.response})}); return response.status;
            }""", a_state["attempt"])
            assert cross == 404
            assert other_page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            other.close()
            checks.append("separate real browser learner and BUILD disclosure; cross-learner command rejected")

            page.get_by_role("button", name="Revisit this trace").click()
            expect(page.locator("#prediction")).to_have_value("")
            page.locator("#prediction").fill("2,1,2")
            page.locator("#diagnosis").fill("This familiar trace cannot be independent evidence again.")
            page.get_by_role("button", name="Submit & reflect").click()
            expect(page.locator("#reward-message")).to_have_text("Familiar practice, retained for reflection")
            expect(page.locator("#practice-label")).to_contain_text("10 practice XP")
            checks.append("repeat practice retains history without extra reward or clean evidence")
            assert page_errors == [], page_errors
            report = {"phase": "1C", "browser": browser.version, "checks": checks, "result": "passed", "page_errors": page_errors, "fault_injection": "One dropped response after real HTTP commit; actual stopped server for outage test. No successful API mocks.", "webmcp": "unavailable in Chromium 138; optional support not live-verified"}
            (artifacts / "browser-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
            print(json.dumps(report, indent=2))
        finally:
            if browser:
                browser.close()
            stop_server(process)


if __name__ == "__main__":
    main()
