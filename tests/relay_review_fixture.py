"""Automated public-GUI setup, NOT native play evidence; isolated saved review DB."""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright
from tests.browser_check import start_server, stop_server
from tests.level1_chapter_browser import skip_opening_to_tutorial, complete_tutorial, action, choose, generate
from tests.relay_transfer_browser import commit_relay_for_review


def prepare(path):
    if path.exists():
        raise ValueError('Refusing to overwrite any existing learner database')
    path.parent.mkdir(parents=True,exist_ok=True)
    proc,url=start_server(path)
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch()
            try:
                page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
                page.goto(url+'/first-words')
                skip_opening_to_tutorial(page)
                complete_tutorial(page)
                action(page,'Begin Level 1 →')
                choose(page,"Supply today's notice · “Moon route closed. The tower bell answers the five-point lantern mark.”")
                choose(page,'The machine will say Star')
                generate(page)
                commit_relay_for_review(page)
                cookie=next(c for c in page.context.cookies() if c['name']=='learning_session')
                path.with_suffix('.session.json').write_text(json.dumps({'session':cookie['value'],
                    'provenance':'Automated public-GUI setup, NOT native play evidence.',
                    'checkpoint':'Relay predictions committed; Run the relay has not been clicked.'}),encoding='utf-8')
                page.screenshot(path=str(path.with_suffix('.automated-setup.png')))
                print('Automated setup complete; saved relay decisions await native layout review.',flush=True)
            finally:
                browser.close()
    finally:
        stop_server(proc)


def serve(path,port):
    from app.server import make_server
    token=json.loads(path.with_suffix('.session.json').read_text(encoding='utf-8'))['session']
    server=make_server(str(path),port)
    base=server.RequestHandlerClass
    class FixtureEntry(base):
        def do_GET(self):
            if self.path=='/review-start':
                if not self.allowed_host():
                    return self.send(403,{'error':'FORBIDDEN'})
                self.send_response(302)
                self.send_header('Set-Cookie',f'learning_session={token}; HttpOnly; SameSite=Strict; Path=/')
                self.send_header('Location','/first-words')
                self.send_header('Content-Length','0')
                self.send_header('Cache-Control','no-store')
                self.end_headers()
                return
            return super().do_GET()
    server.RequestHandlerClass=FixtureEntry
    print(f'Automated-setup review fixture at http://127.0.0.1:{server.server_port}/review-start',flush=True)
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db',required=True,type=Path)
    parser.add_argument('--port',type=int,default=8062)
    parser.add_argument('--serve',action='store_true')
    args=parser.parse_args()
    serve(args.db,args.port) if args.serve else prepare(args.db)
