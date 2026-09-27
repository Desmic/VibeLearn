"""Current-route context recovery and cross-game shared opening, real PlayCanvas."""
import json
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'

def until(page,predicate,timeout=20):
    end=time.monotonic()+timeout
    while time.monotonic()<end:
        if page.evaluate(predicate):return
        time.sleep(.2)
    raise TimeoutError(f'condition did not become true: {predicate}')


def authoritative(context,url):
    r=context.request.get(url+'/api/state')
    assert r.ok, (r.status,r.text())
    obj=r.json();attempt=obj.get('attempt')
    return {'attempt_id':attempt.get('id') if attempt else None,
            'revision':attempt.get('revision') if attempt else None,
            'status':attempt.get('status') if attempt else None,
            'evidence_id':attempt.get('evidence',{}).get('id') if attempt and attempt.get('evidence') else None,
            'response':attempt.get('response') if attempt else None}


def loss(page,selector,status_host,active_selector):
    support=page.evaluate("""selector=>{
      const canvas=document.querySelector(selector),ext=canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context');
      if(!ext)return false;
      const events=[];window.__contextLoss=ext;window.__contextEvents=events;
      canvas.addEventListener('webglcontextlost',()=>events.push('lost'));
      canvas.addEventListener('webglcontextrestored',()=>events.push('restored'));
      ext.loseContext();return true;
    }""",selector)
    if not support:return {'support':'unassessed: WEBGL_lose_context unavailable'}
    until(page,"() => window.__contextEvents.includes('lost')")
    until(page,"() => FirstWordsReview.runtime.contextLost===true")
    expect(page.locator(status_host)).to_have_attribute('data-world-status','failed')
    expect(page.locator(active_selector)).to_be_disabled()
    lost={'events':page.evaluate('window.__contextEvents'),'status':'failed',
          'contextLost':page.evaluate('FirstWordsReview.runtime.contextLost'),
          'fallback_svg_count':page.locator('.rg-world>svg,.rgi-fallback').count(),
          'active_action_disabled':page.locator(active_selector).is_disabled()}
    page.evaluate('window.__contextLoss.restoreContext()')
    until(page,"() => window.__contextEvents.includes('restored')")
    until(page,"() => FirstWordsReview.runtime.contextLost===false")
    expect(page.locator(status_host)).to_have_attribute('data-world-status','ready')
    return {'support':'available','lost':lost,
            'restored':{'events':page.evaluate('window.__contextEvents'),'status':'ready',
                        'contextLost':page.evaluate('FirstWordsReview.runtime.contextLost')}}


def current_route(browser,url):
    context=browser.new_context(viewport={'width':390,'height':844})
    try:
        page=context.new_page();page.set_default_timeout(25000)
        page.goto(url+'/first-words')
        expect(page.locator('#rgi-intro')).to_be_visible()
        before={'step':page.locator('#rgi-intro').get_attribute('data-step'),
                'title':page.locator('#rgi-title').text_content(),
                'state':authoritative(context,url)}
        opening=loss(page,'#rgi-world canvas','#rgi-world','#rgi-world .rgi-target')
        after={'step':page.locator('#rgi-intro').get_attribute('data-step'),
               'title':page.locator('#rgi-title').text_content(),
               'state':authoritative(context,url)}
        assert before==after,(before,after)
        page.get_by_role('button',name='Skip opening',exact=True).click()
        expect(page.locator('#rgi-intro')).to_have_count(0)
        page.get_by_role('button',name='Skip control practice',exact=True).click()
        expect(page.get_by_role('button',name='Connect the loose power lead',exact=True)).to_be_visible()
        mission_before=authoritative(context,url)
        mission=loss(page,'#world canvas','#world','.tutorial-target-marker:not([hidden])')
        if mission.get('support')=='available':
            assert page.locator('#world').get_attribute('data-world-status')=='ready'
        mission_after=authoritative(context,url)
        assert mission_before==mission_after,(mission_before,mission_after)
        # Actual saved action remains usable after restoration.
        page.get_by_role('button',name='Connect the loose power lead',exact=True).click()
        until(page,"() => FirstWordsReview.state.powered===true")
        return {'opening':opening,'opening_before':before,'opening_after':after,
                'mission':mission,'mission_before':mission_before,'mission_after':mission_after,
                'recovered_action_powered':page.evaluate('FirstWordsReview.state.powered')}
    finally:context.close()


def alternate_world(browser,url):
    context=browser.new_context(viewport={'width':390,'height':844})
    try:
        page=context.new_page();page.set_default_timeout(20000)
        page.route('**/harbor-opening-proof',lambda route:route.fulfill(content_type='text/html',body='''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/play-canvas.css"><link rel="stylesheet" href="/rescue-intro.css"><style>html,body,#fixture{margin:0;width:100%;height:100%;background:#102838}</style><script src="/game-world-status.js"></script></head><body><main id="fixture"></main></body></html>'''))
        page.goto(url+'/harbor-opening-proof')
        page.evaluate("""async()=>{
          const {createGameRuntime}=await import('/game-runtime.js');
          const {openGameOpening}=await import('/game-opening.js');
          const {createPlayCanvasWorld}=await import('/playcanvas-backend.js');
          const spec={schemaVersion:'1',id:'harbor.pressure-proof',version:'1',
            environment:{clearColor:'#183247',ambient:'#7894a6'},
            materials:{signal:{diffuse:'#e9c569'},metal:{diffuse:'#86a7b5'}},
            entities:[{id:'pressure-core',primitive:'sphere',material:'signal',position:[0,0,0],scale:[1,1,1]},
                      {id:'gauge-eye',parent:'pressure-core',primitive:'sphere',material:'metal',position:[0,.2,.5],scale:[.25,.25,.25]},
                      {id:'harbor-beacon',primitive:'cylinder',material:'signal',position:[2,1,-2]}],
            cameras:{dock:{position:[0,1,6],lookAt:[0,0,0],fov:45}},states:{opening:{camera:'dock'}}};
          const module={gameWorldManifest:{id:spec.id,version:spec.version,engine:'playcanvas'},
            createGameWorld(host){const w=createPlayCanvasWorld(host,spec,{interactive:false});window.__harborWorld=w;
              return {available:w.available,engine:'playcanvas',setMode(){},setBeat(){w.setState('opening')},
                setPaused:v=>w.setPaused(v),applyPresentation:p=>w.applyPatch(p),
                projectEntity:id=>w.projectEntity(id),pickSemanticAt:(x,y)=>w.pickEntityAt(x,y),
                stats:()=>w.stats(),replay:()=>w.replay(),dispose:()=>w.dispose()};}};
          const opening={id:'harbor.pressure-opening',title:'HARBOR RELAY',scenes:[
            {beat:0,title:'Check the pressure core',body:'A storm is coming.',action:{target:'pressure-core',label:'Inspect pressure core',patch:{transforms:{'pressure-core':{scale:[1.4,1.4,1.4]}}}},success:{fact:'The gauge is steady.'}},
            {beat:1,title:'The harbor holds',body:'The relay is ready.'}]};
          window.__harborExit=[];
          openGameOpening({root:document.querySelector('#fixture'),spec:opening,
            runtime:createGameRuntime(),worldModule:module,replay:true,reducedMotion:true,
            onExit:reason=>window.__harborExit.push(reason)});
        }""")
        expect(page.locator('#rgi-intro')).to_have_attribute('data-opening-id','harbor.pressure-opening')
        expect(page.locator('#rgi-world .vl-playcanvas-engine')).to_be_visible()
        expect(page.get_by_role('button',name='Inspect pressure core',exact=True)).to_be_visible()
        page.get_by_role('button',name='Inspect pressure core',exact=True).click()
        expect(page.locator('#rgi-fact')).to_have_text('The gauge is steady.')
        scale=page.evaluate("() => __harborWorld.entities.get('pressure-core').getLocalScale().x")
        assert abs(scale-1.4)<.01,scale
        page.get_by_role('button',name='Continue →',exact=True).click()
        expect(page.locator('#rgi-title')).to_have_text('The harbor holds')
        page.locator('#rgi-next').click()
        expect(page.locator('#rgi-intro')).to_have_count(0)
        return {'world_id':'harbor.pressure-proof','scale_after_action':scale,
                'exit':page.evaluate('window.__harborExit'),'canvas_remaining':page.locator('canvas').count()}
    finally:context.close()


def main():
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'renderer-probe.sqlite3')
        browser=p.chromium.launch()
        results={}
        try:
            results['current_route']=current_route(browser,url)
            results['alternate_world']=alternate_world(browser,url)
            if any(results['current_route'][phase]['support']!='available' for phase in ('opening','mission')):
                results['status']='unassessed: WEBGL_lose_context unavailable'
            else:results['status']='passed'
            (OUT/'opening-renderer-contract.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
            if results['status']!='passed':raise RuntimeError(results['status'])
            print('Shared opening and current-route WebGL loss/restoration passed')
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
