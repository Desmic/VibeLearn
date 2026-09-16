"""Text enlargement probe against a disposable learner, never the review DB."""
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from tests.browser_check import start_server,stop_server
from tests.level1_chapter_browser import action,generate
ROOT=Path(__file__).resolve().parents[1]
def main():
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'readability.db');browser=p.chromium.launch()
        try:
            page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
            page.goto(url+'/first-words');page.get_by_role('button',name='Skip opening',exact=True).click()
            expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)
            action(page,'Connect the power lead');action(page,'Scan Zip’s Moon plaque');generate(page)
            page.evaluate('''()=>{const sizes=[...document.querySelectorAll('button,p,h1,h2,h3,span,small,a,label')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size] of sizes)e.style.fontSize=(size*2)+'px';}''')
            for width in [360,390,430]:
                page.set_viewport_size({'width':width,'height':844});page.wait_for_timeout(250)
                page.screenshot(path=str(ROOT/f'artifacts/first-words-text-200-{width}.png'))
                tray=page.locator('#controls').bounding_box();tools=page.locator('#world .game-view-tools').bounding_box();goal=page.locator('.mission').bounding_box();mast=page.locator('.masthead').bounding_box()
                assert tools['y']+tools['height']<=tray['y'],(tools,tray)
                assert tools['y']>=goal['y']+goal['height'],(tools,goal)
                assert goal['height']<=844*.18,(goal,width)
                assert tray['height']<=844*.33,(tray,width)
                assert tray['y']-(goal['y']+goal['height'])>=150,(goal,tray,width)
                assert mast['height']<=64,(mast,width)
                for marker in page.locator('#markers>span:visible').all():
                    box=marker.bounding_box();assert box['y']>=goal['y']+goal['height'],(box,goal)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                for selector in ['#goal','#actions button','#context']:
                    box=page.locator(selector).bounding_box();assert box['x']>=0 and box['x']+box['width']<=width and box['y']<844,(selector,box)
                assert page.evaluate("getComputedStyle(document.querySelector('.mission')).overflowY==='auto'")
                assert page.evaluate("getComputedStyle(document.querySelector('#controls')).overflowY==='auto'")
            print('200% text keeps compact scrollable HUD and a large playable world band')
        finally:browser.close();stop_server(proc)
if __name__=='__main__':main()