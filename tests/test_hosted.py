import json
import logging
import re
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4
from app.hosted import ACCESS_COOKIE, COOKIE, create_app
from app.storage import migrate, transaction
from tests.test_pilot_auth import AuthFixture


class HostedTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory();self.path = Path(self.temp.name) / "hosted.sqlite3";migrate(self.path)
        with transaction(self.path) as db: db.execute("CREATE TABLE hosted_sessions (token_hash TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), expires_at TEXT NOT NULL)")
        self.auth = AuthFixture();self.config = {"TESTING": True, "DATABASE_URL": self.path, "APP_ORIGIN": "https://pilot.example.test", "ALLOWED_EMAILS": "owner@example.test"}
        self.app = create_app(self.config, self.auth);self.client = self.app.test_client()

    def tearDown(self): self.temp.cleanup()
    def post(self,path,body): return self.client.post(path,json=body,base_url=self.config["APP_ORIGIN"],headers={"X-Learning-Command":"1"})
    def login(self): return self.post("/api/auth/login", {"email": "owner@example.test", "password": "test-password"})

    def test_hosted_configuration_fails_closed(self):
        bad=self.config|{"APP_ORIGIN":"http://pilot.example.test"}
        with self.assertRaises(ValueError):create_app(bad,self.auth)
        bad=self.config|{"ALLOWED_EMAILS":""}
        with self.assertRaises(ValueError):create_app(bad,self.auth)

    def test_login_scope_and_secure_cookies(self):
        self.assertEqual(self.post("/api/auth/login",{"email":"stranger@example.test","password":"test-password"}).status_code,401)
        response=self.login();self.assertEqual(response.status_code,200);self.assertEqual(response.json["next"],"/first-words")
        cookies=response.headers.getlist("Set-Cookie");self.assertTrue(any("Secure" in c and "HttpOnly" in c and "SameSite=Lax" in c for c in cookies))
        self.assertEqual(self.post("/api/session",{}).status_code,200)

    def test_login_error_reference_matches_safe_request_log(self):
        with self.assertLogs("vibelearn.requests") as logs: response = self.post("/api/auth/login", {"email": "owner@example.test", "password": "private-wrong-password"})
        reference = response.json["request_id"];self.assertEqual(response.headers["X-Request-ID"], reference);self.assertIn(reference, logs.output[0]);self.assertNotIn("private-wrong-password", logs.output[0]);self.assertNotIn("owner@example.test", logs.output[0]);self.assertEqual(response.status_code, 401)

    def test_reset_scope_validation_and_session_revocation(self):
        for email in ("stranger@example.test", "owner@example.test"): self.assertEqual(self.post("/api/auth/request-reset", {"email": email}).status_code, 200)
        self.assertEqual(self.auth.reset_requests, [("owner@example.test", self.config["APP_ORIGIN"])]);self.login()
        body = {"access_token": "invalid", "refresh_token": "test-refresh", "password": "new-password"};self.assertEqual(self.post("/api/auth/reset-password", body).status_code, 400);self.assertEqual(self.post("/api/session", {}).status_code, 200);body["access_token"] = "test-recovery"
        with self.assertLogs("vibelearn.requests") as logs: self.assertEqual(self.post("/api/auth/reset-password", body).status_code, 200)
        for secret in body.values(): self.assertNotIn(secret, str(logs.output))
        self.assertEqual(self.post("/api/session", {}).status_code, 401)
        with transaction(self.path) as db: self.assertEqual(db.execute("SELECT count(*) FROM hosted_sessions").fetchone()[0], 0)

    def test_bellweather_login_password_recovery_and_direct_level1_route_in_real_browser(self):
        import threading
        from werkzeug.serving import make_server
        from playwright.sync_api import sync_playwright, expect
        server = make_server("127.0.0.1", 0, self.app, ssl_context="adhoc");origin = f"https://127.0.0.1:{server.server_port}";server.app = create_app(self.config | {"APP_ORIGIN": origin}, self.auth)
        thread = threading.Thread(target=server.serve_forever, daemon=True);thread.start()
        try:
            with sync_playwright() as playwright:
                browser = playwright.chromium.launch()
                try:
                    page = browser.new_page(ignore_https_errors=True, viewport={"width": 390, "height": 844});page.goto(origin)
                    expect(page.locator('#auth-world')).to_have_attribute('data-engine','playcanvas',timeout=20000);expect(page.locator('#auth-world .vl-playcanvas-engine')).to_be_visible();self.assertEqual(page.locator('#rescue-game').count(),0);self.assertEqual(page.locator('svg').count(),0)
                    expect(page.locator('.entry-story')).to_contain_text('Tonight begins');self.assertNotIn('Your friend is waiting',page.locator('.entry-story').inner_text())
                    artifacts=Path(__file__).resolve().parents[1]/'artifacts';artifacts.mkdir(exist_ok=True);page.screenshot(path=str(artifacts/'login-bellweather-phone-390.png'));page.set_viewport_size({'width':1440,'height':1000});page.screenshot(path=str(artifacts/'login-bellweather-desktop.png'));page.set_viewport_size({'width':390,'height':844})
                    password=page.locator('#login-password');password.fill('wrong-disposable-password');page.locator('#login-email').fill('owner@example.test');toggle=page.locator('[data-password-toggle="login-password"]');toggle.click();expect(password).to_have_attribute('type','text');expect(toggle).to_have_attribute('aria-pressed','true');toggle.click();expect(password).to_have_attribute('type','password')
                    page.get_by_role('button',name=re.compile('Enter the story')).click();expect(page.locator('#entry-status')).to_contain_text('Reference:');expect(page.get_by_role('button',name=re.compile('Enter the story'))).to_be_enabled();self.assertLessEqual(page.evaluate('document.documentElement.scrollWidth'),390)
                    page.get_by_role('button',name='Forgot password?',exact=True).click();expect(page.locator('#entry-status')).to_contain_text('reset link')
                    page.goto(origin+'/#type=recovery&access_token=test-recovery&refresh_token=test-refresh');expect(page.locator('#password-reset')).to_be_visible();self.assertNotIn('access_token',page.url)
                    reset=page.locator('#new-password');reset.fill('new-disposable-password');reset_toggle=page.locator('[data-password-toggle="new-password"]');reset_toggle.click();expect(reset).to_have_attribute('type','text');reset_toggle.click();expect(reset).to_have_attribute('type','password');page.get_by_role('button',name=re.compile('Restore access')).click();expect(page.locator('#sign-in')).to_be_visible();expect(page.locator('#entry-status')).to_contain_text('Password updated')
                    page.locator('#login-email').fill('owner@example.test');page.locator('#login-password').fill('test-password');page.get_by_role('button',name=re.compile('Enter the story')).click();page.wait_for_url('**/first-words',timeout=15000);expect(page.locator('#rgi-intro')).to_be_visible(timeout=20000);expect(page.locator('#rgi-world .vl-playcanvas-engine')).to_be_visible();self.assertEqual(page.locator('#rescue-game').count(),0);self.assertEqual(page.locator('svg').count(),0)
                    page.get_by_role('button',name='Skip opening',exact=True).click();expect(page.locator('#engine')).to_be_visible(timeout=15000);expect(page.get_by_role('button',name='Connect the power lead',exact=True)).to_be_visible();page.reload();expect(page.locator('#engine')).to_be_visible(timeout=15000);expect(page.locator('#rgi-intro')).to_have_count(0)
                finally: browser.close()
        finally: server.shutdown();thread.join(timeout=5);server.server_close()

    def test_no_anonymous_session_or_cookie_forgery(self):
        self.assertEqual(self.post("/api/session", {}).status_code, 401);self.client.set_cookie(ACCESS_COOKIE, "forged", domain="pilot.example.test");self.client.set_cookie(COOKIE, "forged", domain="pilot.example.test");self.assertEqual(self.post("/api/session", {}).status_code, 401)
        with transaction(self.path) as db: self.assertEqual(db.execute("SELECT count(*) FROM learners").fetchone()[0], 0)

    def test_host_and_origin_are_checked_even_with_forwarded_headers(self):
        headers={"Host":"evil.example.test","Origin":self.config["APP_ORIGIN"],"X-Learning-Command":"1"};self.assertEqual(self.client.post('/api/session',json={},headers=headers).status_code,403)
        headers={"Host":"pilot.example.test","Origin":"https://evil.example.test","X-Learning-Command":"1"};self.assertEqual(self.client.post('/api/session',json={},headers=headers).status_code,403)

    def test_changed_identity_cannot_use_another_session(self):
        self.login();session=self.client.get_cookie(COOKIE);access=self.client.get_cookie(ACCESS_COOKIE);self.client.delete_cookie(COOKIE,domain='pilot.example.test');self.client.delete_cookie(ACCESS_COOKIE,domain='pilot.example.test')
        self.auth.user='other-id';self.auth.email='owner@example.test';self.client.set_cookie(COOKIE,session.value,domain='pilot.example.test');self.client.set_cookie(ACCESS_COOKIE,access.value,domain='pilot.example.test');self.assertEqual(self.post('/api/session',{}).status_code,401)

    def test_expired_session_cannot_resume(self):
        self.login();cookie=self.client.get_cookie(COOKIE);self.assertIsNotNone(cookie)
        with transaction(self.path) as db:db.execute("UPDATE hosted_sessions SET expires_at='2000-01-01T00:00:00+00:00'")
        self.assertEqual(self.post('/api/session',{}).status_code,401)

    def test_logout_revokes_replayed_cookie_pair(self):
        self.login();session=self.client.get_cookie(COOKIE);access=self.client.get_cookie(ACCESS_COOKIE);self.assertEqual(self.post('/api/auth/logout',{}).status_code,200)
        self.client.set_cookie(COOKIE,session.value,domain='pilot.example.test');self.client.set_cookie(ACCESS_COOKIE,access.value,domain='pilot.example.test');self.assertEqual(self.post('/api/session',{}).status_code,401)

    def test_saved_answer_survives_relogin(self):
        self.login();start=self.post('/api/commands/start',{'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':'ai-01-first-words'});attempt=start.json
        saved=self.post('/api/commands/action',{'command_id':str(uuid4()),'expected_revision':attempt['revision'],'attempt_id':attempt['id'],'action':'connect'});self.assertEqual(saved.status_code,200);self.post('/api/auth/logout',{});self.login();state=self.client.get('/api/state',base_url=self.config['APP_ORIGIN']);self.assertEqual(state.json['attempt']['word_machine_state']['powered'],True)

    def test_two_authorized_learners_are_isolated(self):
        first=self.login();self.assertEqual(first.status_code,200);one=self.post('/api/commands/start',{'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':'ai-01-first-words'}).json
        other=create_app(self.config,AuthFixture(user='other-user',email='owner@example.test')).test_client();other.post('/api/auth/login',json={'email':'owner@example.test','password':'test-password'},base_url=self.config['APP_ORIGIN'],headers={'X-Learning-Command':'1'});state=other.get('/api/state',base_url=self.config['APP_ORIGIN']);self.assertIsNone(state.json['attempt']);self.assertNotEqual(one['learner_id'],state.json['learner']['id'])

    def test_active_level1_assets_and_authenticated_commands(self):
        active=['/first-words','/first-words.html','/first-words-boot.js','/first-words.js','/first-words-world.js','/workshop-props.js','/spec-game-world.js','/vendor/playcanvas.mjs','/assets/quaternius-animated-robot.glb']
        for path in active:
            response=self.client.get(path,base_url=self.config['APP_ORIGIN']);self.assertEqual(response.status_code,200,path);self.assertIn("script-src 'self'",response.headers['Content-Security-Policy'])
        retired=['/rescue-game.js','/rescue.js','/expedition.js','/play-canvas-migrate.js','/vendor/three.module.js']
        for path in retired:self.assertEqual(self.client.get(path,base_url=self.config['APP_ORIGIN']).status_code,404,path)
        self.assertEqual(self.client.get('/word-machine',base_url=self.config['APP_ORIGIN']).status_code,302)
        body={'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':'ai-01-first-words'};self.assertEqual(self.post('/api/commands/start',body).status_code,401);login=self.login();self.assertEqual(login.json['next'],'/first-words');response=self.post('/api/commands/start',body);self.assertEqual(response.status_code,200);self.assertEqual(response.json['snapshot']['mission']['id'],'ai-01-first-words');self.assertEqual(response.json['word_machine_state']['pieces'],0)

    def test_phase1_hosted_acceptance_contract_survives_app_restart(self):
        self.login();started=self.post('/api/commands/start',{'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':'rescue-01'}).json;self.assertIsNotNone(started)
        restarted=create_app(self.config,self.auth).test_client();for_cookie=self.client.get_cookie(COOKIE);for_access=self.client.get_cookie(ACCESS_COOKIE);restarted.set_cookie(COOKIE,for_cookie.value,domain='pilot.example.test');restarted.set_cookie(ACCESS_COOKIE,for_access.value,domain='pilot.example.test');self.assertEqual(restarted.get('/api/state',base_url=self.config['APP_ORIGIN']).status_code,200);self.assertEqual(restarted.post('/api/auth/logout',json={},base_url=self.config['APP_ORIGIN'],headers={'X-Learning-Command':'1'}).status_code,200)


if __name__ == '__main__':unittest.main()
