"""Text enlargement probe against a disposable learner, never the review DB."""
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from tests.browser_check import start_server,stop_server
from tests.level1_chapter_browser import action,generate,skip_opening_to_tutorial
ROOT=Path(__file__).resolve().parents[1]
def overlaps(a,b):
    return a['x']<b['x']+b['width'] and a['x']+a['width']>b['x'] and a['y']<b['y']+b['height'] and a['y']+a['height']>b['y']
def main():
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'readability.db');browser=p.chromium.launch()
        try:
            page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
            page.goto(url+'/first-words');skip_opening_to_tutorial(page,skip_controls=True)
            action(page,'Connect the power lead');action(page,'Scan the Moon lock');generate(page)
            expect(page.locator('#stage-name')).to_have_text('TUTORIAL · COMPLETE')
            page.evaluate('''()=>{const sizes=[...document.querySelectorAll('button,p,h1,h2,h3,span,small,a,label')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size] of sizes)e.style.fontSize=(size*2)+'px';}''')
            for width in [360,390,430]:
                page.set_viewport_size({'width':width,'height':844});page.wait_for_timeout(250)
                page.screenshot(path=str(ROOT/f'artifacts/first-words-text-200-{width}.png'))
                card=page.locator('#engine').bounding_box();tools=page.locator('#world .game-view-tools').bounding_box();stick=page.locator('#world .game-move-stick').bounding_box();mast=page.locator('.masthead').bounding_box()
                assert card['y']+card['height']<=844*.5,card
                assert not overlaps(card,tools),(card,tools)
                assert not overlaps(card,stick),(card,stick)
                assert card['y']>=mast['y']+mast['height']-1,(card,mast)
                assert mast['height']<=64,(mast,width)
                for marker in page.locator('#markers>button:visible,#markers>span:visible').all():
                    box=marker.bounding_box();assert not overlaps(box,card),(box,card)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                for selector in ['#goal','#actions button','#context']:
                    box=page.locator(selector).bounding_box();assert box['x']>=0 and box['x']+box['width']<=width and box['y']<844,(selector,box)
                    assert box['x']>=card['x']-1 and box['x']+box['width']<=card['x']+card['width']+1,(selector,box,card)
                assert page.evaluate("getComputedStyle(document.querySelector('#engine')).overflowY==='auto'")
            print('200% text keeps compact scrollable HUD and a large playable world band')
        finally:browser.close();stop_server(proc)
if __name__=='__main__':main()