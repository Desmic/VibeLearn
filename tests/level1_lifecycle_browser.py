"""Hosted Bellweather lifecycle gate: reset and sign-out must remain usable in-game."""
import tempfile
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from werkzeug.serving import make_server
from app.hosted import create_app
from app.storage import migrate, transaction
from tests.test_hosted import AuthFixture

ROOT=Path(__file__).resolve().parents[1]


def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temp:
        path=Path(temp)/'lifecycle.sqlite3';migrate(path)
        with transaction(path) as db:db.execute('CREATE TABLE hosted_sessions (token_hash TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), expires_at TEXT NOT NULL)')
        auth=AuthFixture();base={"TESTING":True,"DATABASE_URL":path,"APP_ORIGIN":"https://placeholder.test","ALLOWED_EMAILS":"owner@example.test"}
        seed=create_app(base,auth);server=make_server('127.0.0.1',0,seed,ssl_context='adhoc');origin=f'https://127.0.0.1:{server.server_port}';server.app=create_app(base|{'APP_ORIGIN':origin},auth)
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        try:
            with sync_playwright() as p:
                browser=p.chromium.launch()
                try:
                    page=browser.new_page(ignore_https_errors=True,viewport={'width':390,'height':844});page.goto(origin)
                    page.locator('#login-email').fill('owner@example.test');page.locator('#login-password').fill('test-password');page.get_by_role('button',name='Continue to The First Words →',exact=True).click()
                    page.wait_for_url('**/first-words',timeout=15000);expect(page.locator('#rgi-intro')).to_be_visible(timeout=20000)
                    page.get_by_role('button',name='Skip opening',exact=True).click();expect(page.get_by_role('button',name='Connect power lead',exact=True)).to_be_visible(timeout=15000)
                    page.get_by_role('button',name='Connect power lead',exact=True).click();expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)

                    page.get_by_role('button',name='Open game menu').click();expect(page.get_by_role('button',name='Reset game progress',exact=True)).to_be_visible();expect(page.get_by_role('button',name='Sign out',exact=True)).to_be_visible()
                    page.get_by_role('button',name='Reset game progress',exact=True).click();expect(page.locator('#reset-confirm')).to_be_visible();expect(page.locator('#reset-confirm')).to_contain_text('clears your saved game attempts')
                    page.get_by_role('button',name='Reset and restart',exact=True).click();page.wait_for_url('**/first-words',timeout=15000);expect(page.locator('#rgi-intro')).to_be_visible(timeout=20000)
                    state=page.request.get(origin+'/api/state');assert state.status==200;assert state.json()['attempt'] is None,state.json()
                    page.screenshot(path=str(out/'level1-reset-restarts-opening-390.png'))

                    page.get_by_role('button',name='Skip opening',exact=True).click();expect(page.get_by_role('button',name='Connect power lead',exact=True)).to_be_visible(timeout=15000)
                    page.get_by_role('button',name='Open game menu').click();page.get_by_role('button',name='Sign out',exact=True).click();page.wait_for_url(origin+'/',timeout=15000);expect(page.locator('#sign-in')).to_be_visible();expect(page.locator('#login-submit')).to_be_visible()
                    state=page.request.get(origin+'/api/state');assert state.status==401,state.status
                    page.screenshot(path=str(out/'level1-logout-back-to-auth-390.png'))
                    print('Hosted reset and logout lifecycle passed')
                finally:browser.close()
        finally:server.shutdown();thread.join(timeout=5);server.server_close()

if __name__=='__main__':main()