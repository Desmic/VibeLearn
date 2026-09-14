"""Opening package reuse, engine recovery and presentation/progression boundaries."""
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT=Path(__file__).resolve().parents[1]

def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp,sync_playwright() as p:
        proc,url=start_server(Path(tmp)/'opening-contract.db');browser=p.chromium.launch()
        try:
            context=browser.new_context(viewport={'width':390,'height':844},has_touch=True)
            page=context.new_page()
            page.route('**/vendor/playcanvas.mjs',lambda route:route.abort())
            page.goto(url)
            expect(page.get_by_text('The 3D world could not load.',exact=True)).to_be_visible()
            expect(page.locator('.rg-world>svg,.rgi-fallback')).to_have_count(0)
            page.screenshot(path=str(out/'opening-engine-recovery.png'),full_page=True)
            page.unroute('**/vendor/playcanvas.mjs')
            page.get_by_role('button',name='Retry 3D world').click()
            expect(page.locator('#rgi-intro')).to_be_visible()
            expect(page.locator('#rgi-world .vl-playcanvas-engine')).to_be_visible()
            page.evaluate("() => {window.openingContext=document.querySelector('#rgi-world canvas').getContext('webgl2').getExtension('WEBGL_lose_context');openingContext.loseContext();}")
            expect(page.locator('#rgi-world')).to_have_attribute('data-world-status','failed')
            expect(page.locator('#rgi-next')).to_be_disabled()
            expect(page.locator('#rgi-intro')).to_have_attribute('data-step','0')
            page.evaluate('openingContext.restoreContext()')
            expect(page.locator('#rgi-world')).to_have_attribute('data-world-status','ready')
            expect(page.locator('#rgi-next')).to_be_enabled()
            page.locator('#rgi-next').click()
            expect(page.locator('#rgi-fact')).to_contain_text('You lit the way')
            page.evaluate('openingContext.loseContext()')
            expect(page.locator('#rgi-world')).to_have_attribute('data-world-status','failed')
            page.evaluate('openingContext.restoreContext()')
            expect(page.locator('#rgi-world')).to_have_attribute('data-world-status','ready')
            expect(page.locator('#rgi-fact')).to_contain_text('You lit the way')
            expect(page.locator('#rgi-next')).to_have_text('Continue →')
            page.locator('#rgi-skip').click()
            expect(page.locator('.rgc1-coach')).to_be_visible()
            page.reload()
            expect(page.locator('.rgc1-coach')).to_be_visible()
            expect(page.locator('#rgi-intro')).to_have_count(0)
            # A lost engine context blocks gameplay; restoration keeps the saved attempt.
            before=page.evaluate('JSON.stringify(RescueGame.response())')
            page.evaluate("""() => {const c=document.querySelector('.vl-playcanvas-engine'); window.contextRecovery=c.getContext('webgl2').getExtension('WEBGL_lose_context');contextRecovery.loseContext();}""")
            expect(page.get_by_text('The 3D world could not load.',exact=True)).to_be_visible()
            expect(page.locator('.rg-world>svg')).to_have_count(0)
            assert page.evaluate('JSON.stringify(RescueGame.response())')==before
            page.evaluate('contextRecovery.restoreContext()')
            expect(page.locator('.rg-world')).to_have_attribute('data-world-status','ready')
            # Different content/world uses the same opening controller and engine compiler.
            await_result=page.evaluate("""async () => {
              const {openGameOpening,shouldOpenGame}=await import('/game-opening.js');
              const {createGameRuntime}=await import('/game-runtime.js');
              const {createPlayCanvasWorld}=await import('/playcanvas-backend.js');
              if(shouldOpenGame({missions:[{status:'cleared'}]}))throw Error('Cleared campaign replayed automatically');
              if(shouldOpenGame({attempt:{status:'draft'}}))throw Error('Draft interrupted');
              const spec={schemaVersion:'1',id:'test.seed-garden',version:'1',environment:{clearColor:'#112c24'},materials:{seed:{diffuse:'#e9c569'}},lights:[],entities:[{id:'seed',primitive:'sphere',material:'seed',position:[0,0,0],scale:[1,1,1]}],cameras:{garden:{position:[0,1,5],lookAt:[0,0,0],fov:45}},states:{opening:{camera:'garden'}}};
              const module={gameWorldManifest:{id:'test.seed-garden',version:'1',engine:'playcanvas'},createGameWorld(host){const e=createPlayCanvasWorld(host,spec);return {...e,available:e.available,engine:'playcanvas',setBeat(){e.setState('opening');},setMode(){},setPaused(v){e.setPaused(v);},applyPresentation(p){e.applyPatch(p);},projectEntity(id){return e.projectEntity(id);},dispose(){e.dispose();}};}};
              const host=document.createElement('section');document.body.append(host);
              openGameOpening({root:host,runtime:createGameRuntime(),worldModule:module,replay:true,spec:{id:'seed-garden.opening',title:'SEED GARDEN',scenes:[{beat:0,title:'Wake one seed.',body:'Give this garden its first new leaf.',action:{target:'seed',label:'Grow the seed',patch:{transforms:{seed:{scale:[1.5,1.5,1.5]}}}},success:{fact:'A first leaf!'}}]},onExit(){host.remove();}});
              return true;
            }""")
            assert await_result
            expect(page.locator('#rgi-intro')).to_have_attribute('data-opening-id','seed-garden.opening')
            page.locator('#rgi-next').click()
            expect(page.locator('#rgi-fact')).to_have_text('A first leaf!')
            page.screenshot(path=str(out/'opening-reusable-seed-garden.png'),full_page=True)
            page.locator('#rgi-next').click()
            expect(page.locator('#rgi-intro')).to_have_count(0)
            assert page.evaluate('JSON.stringify(RescueGame.response())')==before
            (out/'opening-contract.json').write_text(json.dumps({'result':'passed','checks':['missing engine: recovery instead of 2D','retry restores 3D','skip starts tutorial and survives reload','context loss blocks gameplay without progress change','unrelated opening spec and world reuse shared controller/backend']}))
            context.close()
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
