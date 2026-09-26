"""Text enlargement probe against a disposable learner, never the review DB."""
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from tests.browser_check import start_server,stop_server,launch_browser
from tests.level1_chapter_browser import action,generate,skip_opening_to_tutorial
ROOT=Path(__file__).resolve().parents[1]
def overlaps(a,b):
    return a['x']<b['x']+b['width'] and a['x']+a['width']>b['x'] and a['y']<b['y']+b['height'] and a['y']+a['height']>b['y']
def main():
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'readability.db');browser=launch_browser(p)
        try:
            page=browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
            page.goto(url+'/first-words');skip_opening_to_tutorial(page,skip_controls=True)
            action(page,'Connect the power lead');action(page,'Scan the Moon lock');generate(page)
            expect(page.locator('#stage-name')).to_have_text('TUTORIAL · COMPLETE')
            page.evaluate('''()=>{const sizes=[...document.querySelectorAll('button,p,h1,h2,h3,span,small,a,label')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())).map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size] of sizes)e.style.fontSize=(size*2)+'px';}''')
            for width in [360,390,430]:
                page.set_viewport_size({'width':width,'height':844});page.wait_for_timeout(250)
                page.screenshot(path=str(ROOT/f'artifacts/first-words-text-200-{width}.png'))
                card=page.locator('#engine').bounding_box();mast=page.locator('.masthead').bounding_box()
                sheet='sheet' in (page.locator('#engine').get_attribute('class') or '').split()
                if sheet:
                    # I8 / B1 narrow-sheet clause: at 200% text a phone card is a flush
                    # bottom sheet, so what the probe guards is the height cap and the
                    # world band above it, not which half of the screen it occupies. The
                    # old upper-half assertion encoded the pre-I8 parked-card layout.
                    # The cap is the same as at normal text: a surface that no longer
                    # fits sheds its low rungs, it does not buy more of the world (I10).
                    assert abs(card['y']+card['height']-844)<=8,card
                    assert card['height']<=844*.40,card
                    assert card['x']<=8 and card['x']+card['width']>=width-8,card
                    assert card['y']>=844*.5,card   # the world keeps at least half the screen
                    # The sheet yields the direct-input chrome it sits on top of.
                    for selector in ['.game-view-tools','.game-move-stick','.game-controls-help']:
                        assert page.locator(f'#world {selector}').is_hidden(),(selector,card)
                    tools=stick=None
                else:
                    tools=page.locator('#world .game-view-tools').bounding_box();stick=page.locator('#world .game-move-stick').bounding_box()
                    assert not overlaps(card,tools),(card,tools)
                    assert not overlaps(card,stick),(card,stick)
                assert card['y']>=mast['y']+mast['height']-1,(card,mast)
                assert mast['height']<=64,(mast,width)
                for marker in page.locator('#markers>button:visible,#markers>span:visible').all():
                    box=marker.bounding_box();assert not overlaps(box,card),(box,card)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
                # I10: at the accessibility viewport the surface may give up a declared
                # low rung, never the question or a choice, and never by clipping.
                for selector in ['#goal','#actions button']:
                    box=page.locator(selector).bounding_box()
                    assert box,(width,selector,'the question or a choice vanished')
                    assert box['x']>=0 and box['x']+box['width']<=width and box['y']<844,(selector,box)
                    assert box['x']>=card['x']-1 and box['x']+box['width']<=card['x']+card['width']+1,(selector,box,card)
                undeclared=page.evaluate('''()=>{const card=document.querySelector('#engine');const out=[];
                    for(const el of card.querySelectorAll('h1,p,button,span')){
                      if(!el.textContent.trim()||el.getClientRects().length)continue;
                      if(!el.closest('[data-shed-item]')&&!el.matches('[data-shed-item]'))
                        out.push((el.id?'#'+el.id:el.tagName)+' '+(el.textContent||'').trim().slice(0,22));}
                    return out}''')
                assert not undeclared,(width,undeclared)
                # B3 at the accessibility viewport: a painted choice the player has to
                # scroll the card to see is not a choice they can make, whatever the
                # text size. This is the check the 100%-only gate could not see.
                scrolled=page.evaluate('''()=>{const out=[];for(const b of document.querySelectorAll('#actions button,.foot button')){
                    if(!b.textContent.trim()||!b.getClientRects().length)continue;const r=b.getBoundingClientRect();
                    for(let n=b.parentElement;n;n=n.parentElement){const cs=getComputedStyle(n);
                      if(cs.overflowY!=='visible'){const a=n.getBoundingClientRect();
                        if(r.top<a.top-2||r.bottom>a.bottom+2)out.push(b.textContent.trim().slice(0,26)+' past '+n.id);}
                      if(n.id==='engine')break;}}
                    return out}''')
                assert not scrolled,(width,scrolled)
                assert page.evaluate("getComputedStyle(document.querySelector('#engine')).overflowY==='auto'")
            print('200% text keeps the question and every choice painted inside a compact sheet')
        finally:browser.close();stop_server(proc)
if __name__=='__main__':main()
