"""Current-route context recovery and cross-game shared opening, real PlayCanvas."""
import json
import sys
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
    actions=page.locator(active_selector)
    assert actions.count()>0,'No active action controls to guard during context loss'
    for i in range(actions.count()):expect(actions.nth(i)).to_be_disabled()
    lost={'events':page.evaluate('window.__contextEvents'),'status':'failed',
          'contextLost':page.evaluate('FirstWordsReview.runtime.contextLost'),
          'fallback_svg_count':page.locator('.rg-world>svg,.rgi-fallback').count(),
          'active_action_disabled':all(actions.nth(i).is_disabled() for i in range(actions.count()))}
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
        opening_cost=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
          const s=getGameRuntime().world.stats();return {worldVersion:s.worldVersion,
            drawCalls:s.lastRenderedDrawCalls,batches:s.batchCount,renderedFrames:s.renderedFrameCount};}""")
        opening=loss(page,'#rgi-world canvas','#rgi-world','#rgi-world .rgi-target')
        after={'step':page.locator('#rgi-intro').get_attribute('data-step'),
               'title':page.locator('#rgi-title').text_content(),
               'state':authoritative(context,url)}
        assert before==after,(before,after)
        # The story-explore shot belongs to the opening, including a paused
        # aspect change. A temporarily hidden host must not look like portrait.
        page.get_by_role('button',name='Pause story motion',exact=True).click()
        page.set_viewport_size({'width':1280,'height':720})
        until(page,"""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
          const v=getGameRuntime().world.getPlayerView();return v?.pitch===14&&v?.distance===9;}""")
        paused_frames=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
          return getGameRuntime().world.stats().renderedFrameCount;}""")
        page.evaluate("document.querySelector('#rgi-world').style.display='none'")
        page.wait_for_timeout(250)
        desktop_hidden=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
          const v=getGameRuntime().world.getPlayerView();return [v.pitch,v.distance];}""")
        assert desktop_hidden==[14,9],desktop_hidden
        hidden_frames=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
          return getGameRuntime().world.stats().renderedFrameCount;}""")
        assert hidden_frames-paused_frames<=1,(paused_frames,hidden_frames)
        page.evaluate("document.querySelector('#rgi-world').style.display=''")
        page.set_viewport_size({'width':390,'height':844})
        until(page,"""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
          const v=getGameRuntime().world.getPlayerView();return v?.pitch===20&&v?.distance===15.5;}""")
        expect(page.locator('.rgi-marker[data-entity="singer-head"]')).to_be_visible()
        for name in ('Wake garden lightwell','Light skybridge relay'):
            marker=page.locator('.rgi-target').filter(has_text=name)
            expect(marker).to_have_count(1)
            expect(marker).to_be_hidden()
        page.get_by_role('button',name='Resume story motion',exact=True).click()
        for name in ('Wake garden lightwell','Light skybridge relay'):
            expect(page.get_by_role('button',name=name,exact=True)).to_be_visible()
        # A scene-authored phone home view must survive a real drag + recenter.
        page.mouse.move(191,592);page.mouse.down();page.mouse.move(280,592,steps=4);page.mouse.up()
        garden=page.get_by_role('button',name='Wake garden lightwell',exact=True)
        expect(garden).to_be_visible()
        expect(garden).to_be_enabled()
        drag_cue=page.evaluate("""()=>{
          const buttons=[...document.querySelectorAll('#rgi-intro .rgi-target:not([hidden])')];
          const garden=buttons.find(b=>b.textContent==='Wake garden lightwell');
          const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
          const hit=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
          const g=rect(garden),others=buttons.filter(b=>b!==garden).map(rect);
          const obstacles=['.rgi-band','.rgi-corner','.game-view-tools','.game-move-stick']
            .map(s=>document.querySelector('#rgi-intro '+s)).filter(el=>el&&el.getClientRects().length).map(rect);
          return {edge:garden.dataset.edge||'',description:garden.getAttribute('aria-description'),
            bounds:g,inside:g.left>=0&&g.right<=innerWidth&&g.top>=0&&g.bottom<=innerHeight,
            hit:document.elementFromPoint((g.left+g.right)/2,(g.top+g.bottom)/2)===garden,
            overlap:[...others,...obstacles].some(r=>hit(g,r))};}""")
        assert drag_cue['edge'] and drag_cue['description'] and drag_cue['inside'] and drag_cue['hit'] and not drag_cue['overlap'],drag_cue
        assert drag_cue['bounds']['height']>=44,drag_cue
        for _ in range(2):
            page.mouse.wheel(0,300)
            for name in ('Wake garden lightwell','Light skybridge relay'):
                expect(page.get_by_role('button',name=name,exact=True)).to_be_visible()
        page.keyboard.press('r')
        recentered=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
          const v=getGameRuntime().world.getPlayerView();return [v.pitch,v.distance,v.position];}""")
        assert recentered[:2]==[20,15.5],recentered
        for name in ('Wake garden lightwell','Light skybridge relay'):
            expect(page.get_by_role('button',name=name,exact=True)).to_be_visible()
        page.get_by_role('button',name='Skip opening',exact=True).click()
        expect(page.locator('#rgi-intro')).to_have_count(0)
        expect(page.locator('#detail')).to_contain_text("The Warden stole Zip's natural voice")
        chamber=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
          const {worldSpec}=await import('/first-words-world.js');
          const s=getGameRuntime().world.stats(),floor=worldSpec.entities.find(e=>e.id==='prison-floor');
          const parent=worldSpec.entities.find(e=>e.id===floor.parent);
          const z=(parent.position?.[2]||0)+(floor.position?.[2]||0);
          return {clear:s.cameraClearColor,eye:s.player?.presentedCamera?.eye,
            floorFront:z+floor.scale[2]/2,floorBack:z-floor.scale[2]/2};}""")
        assert all(abs(a-b)<.002 for a,b in zip(chamber['clear'],[12/255,18/255,32/255])),chamber
        assert chamber['eye'] and chamber['floorBack']<chamber['eye'][2]<chamber['floorFront'],chamber
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
                'drag_cue':drag_cue,'recentered':recentered,'chamber':chamber,
                'opening_cost':opening_cost,'paused_frames':paused_frames,'hidden_frames':hidden_frames,
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
          const {companionRobot}=await import('/rescue-world-props.js');
          const spec={schemaVersion:'1',id:'harbor.pressure-proof',version:'1',
            environment:{clearColor:'#183247',ambient:'#7894a6'},
            materials:{signal:{diffuse:'#e9c569'},metal:{diffuse:'#86a7b5'},
              copper:{diffuse:'#c77e64'},shell:{diffuse:'#e7d6b5'},frame:{diffuse:'#414f62'},
              visor:{diffuse:'#233d55'},eyes:{diffuse:'#f8dc94'},trim:{diffuse:'#dbb971'}},
            entities:[{id:'pressure-core',primitive:'sphere',material:'signal',position:[0,0,0],scale:[1,1,1]},
                      {id:'gauge-eye',parent:'pressure-core',primitive:'sphere',material:'metal',position:[0,.2,.5],scale:[.25,.25,.25]},
                      {id:'harbor-beacon',primitive:'cylinder',material:'signal',position:[1.1,.5,0]},
                      ...companionRobot('observatory-guide',[20,0,0],{color:'copper',height:2.2,solid:true,
                        shell:{plate:'shell',frame:'frame',visor:'visor',eyes:'eyes',trim:'trim'}})],
            cameras:{dock:{position:[0,1,6],lookAt:[0,0,0],fov:45}},
            states:{opening:{camera:'dock',environment:{clearColor:'#aecde2',ambient:'#aabbcc'}},
              chamber:{camera:'dock',environment:{clearColor:'#101820',ambient:'#304050'}}}};
          const module={worldSpec:spec,gameWorldManifest:{id:spec.id,version:spec.version,engine:'playcanvas'},
            createGameWorld(host){const w=createPlayCanvasWorld(host,spec,{interactive:false});window.__harborWorld=w;
              return {available:w.available,engine:'playcanvas',setMode(){},setBeat(){w.setState('opening')},
                setPaused:v=>w.setPaused(v),releaseInputs:()=>w.releaseInputs(),
                applyPresentation:p=>w.applyPatch(p),applyOverlay:p=>w.applyPatch(p),
                projectEntity:id=>w.projectEntity(id),pickSemanticAt:(x,y)=>w.pickEntityAt(x,y),
                stats:()=>w.stats(),replay:()=>w.replay(),dispose:()=>w.dispose()};}};
          const opening={id:'harbor.pressure-opening',title:'HARBOR RELAY',scenes:[
            {beat:0,title:'Choose the harbor response',body:'A storm is coming.',
              markers:[{entity:'gauge-eye',label:'GAUGE'},
                {entity:'harbor-beacon',target:'harbor-beacon',label:'Light harbor beacon'}],choices:[
              {target:'pressure-core',label:'Tune pressure core',patch:{transforms:{'pressure-core':{scale:[1.4,1.4,1.4]}}},
                carry:{transforms:{'pressure-core':{scale:[1.4,1.4,1.4]}}},success:{fact:'The gauge is steady.'},
                inspection:{target:'gauge-eye',anchor:'gauge-eye',label:'Look at pressure trace',markers:[],
                  patch:{camera:'dock'},success:{fact:'The pressure trace points to shelter.'}}},
              {target:'harbor-beacon',label:'Light harbor beacon',patch:{transforms:{'harbor-beacon':{scale:[1.5,1.5,1.5]}}},success:{fact:'The beacon is bright.'}}
            ]},
            {beat:1,title:'The harbor holds',body:'The relay is ready.'}]};
          window.__harborExit=[];window.__harborSaved={revision:9,firstChoice:'unaltered'};
          window.__openHarbor=(replay=true)=>openGameOpening({root:document.querySelector('#fixture'),spec:opening,
            runtime:createGameRuntime(),worldModule:module,replay,reducedMotion:false,
            onExit:reason=>window.__harborExit.push(reason)});
          window.__openHarbor();
        }""")
        expect(page.locator('#rgi-intro')).to_have_attribute('data-opening-id','harbor.pressure-opening')
        expect(page.locator('#rgi-world .vl-playcanvas-engine')).to_be_visible()
        contact=page.evaluate("""()=>{const w=__harborWorld;
          const feet=['observatory-guide-foot-1','observatory-guide-foot1'].map(id=>{
            const aabb=w.entities.get(id).render.meshInstances[0].aabb;
            return aabb.center.y-aabb.halfExtents.y;});
          const torso=w.colliderSnapshot().find(c=>c.id==='observatory-guide');
          return{feet,torso};}""")
        assert contact['torso'] and abs(contact['torso']['min'][1])<.02,contact
        assert all(abs(y)<.04 for y in contact['feet']),contact
        environment=page.evaluate("""()=>{const read=()=>__harborWorld.stats().cameraClearColor;
          const bright=read();__harborWorld.setState('chamber');const dark=read();
          __harborWorld.setState('opening');return {bright,dark,restored:read()};}""")
        assert environment['bright']==environment['restored'],environment
        assert environment['dark']!=environment['bright'],environment
        expect(page.get_by_role('button',name='Tune pressure core',exact=True)).to_be_visible()
        expect(page.get_by_role('button',name='Light harbor beacon',exact=True)).to_be_visible()
        page.evaluate("() => __harborWorld.applyPatch({transforms:{'harbor-beacon':{position:[50,.5,0]}}})")
        far=page.get_by_role('button',name='Light harbor beacon',exact=True)
        expect(far).to_be_visible()
        page.wait_for_function("() => ['left','right'].includes(document.querySelector('.rgi-target[data-entity=\"harbor-beacon\"]')?.dataset.edge)")
        assert far.get_attribute('data-edge') in ('left','right')
        assert far.get_attribute('aria-description')
        page.evaluate("() => __harborWorld.applyPatch({transforms:{'harbor-beacon':{position:[1.1,.5,0]}}})")
        # A child mesh routes to its authored parent choice, not an ID prefix.
        point=page.evaluate("() => __harborWorld.projectEntity('gauge-eye')")
        page.mouse.click(point['x'],point['y'])
        expect(page.locator('#rgi-fact')).to_have_text('The gauge is steady.')
        expect(page.locator('.rgi-marker[data-entity="harbor-beacon"]')).to_have_count(0)
        expect(page.get_by_role('button',name='Look at pressure trace',exact=True)).to_be_visible()
        page.locator('#rgi-world').click(position={'x':10,'y':10})
        expect(page.locator('#rgi-title')).to_have_text('Choose the harbor response')
        expect(page.locator('#rgi-next')).to_be_hidden()
        page.get_by_role('button',name='Pause story motion',exact=True).click()
        expect(page.get_by_role('button',name='Look at pressure trace',exact=True)).to_be_hidden()
        page.set_viewport_size({'width':1280,'height':720})
        page.set_viewport_size({'width':390,'height':844})
        page.get_by_role('button',name='Resume story motion',exact=True).click()
        look=page.get_by_role('button',name='Look at pressure trace',exact=True)
        expect(look).to_be_visible()
        expect(look).to_be_enabled()
        tabbed=False
        for _ in range(12):
            page.keyboard.press('Tab')
            if look.evaluate('el=>document.activeElement===el'):
                tabbed=True;break
        assert tabbed,'inspection must be reachable from the current keyboard focus'
        page.keyboard.press('Shift+Tab')
        page.keyboard.press('Tab')
        assert look.evaluate('el=>document.activeElement===el'),'inspection must remain in keyboard order'
        page.keyboard.press('Enter')
        expect(page.locator('#rgi-fact')).to_have_text('The pressure trace points to shelter.')
        expect(page.locator('.rgi-marker')).to_have_count(0)
        scale=page.evaluate("() => __harborWorld.entities.get('pressure-core').getLocalScale().x")
        assert abs(scale-1.4)<.01,scale
        page.locator('#rgi-world').click(position={'x':10,'y':10})
        expect(page.locator('#rgi-title')).to_have_text('The harbor holds')
        page.get_by_role('button',name='Previous scene',exact=True).click()
        expect(page.locator('#rgi-fact')).to_have_text('The pressure trace points to shelter.')
        expect(page.get_by_role('button',name='Look at pressure trace',exact=True)).to_have_count(0)
        assert (abs(page.evaluate("() => __harborWorld.entities.get('pressure-core').getLocalScale().x")-1.4)<.01), (
            'Previous must restore the inspected branch transform, not restart its response')
        page.get_by_role('button',name='Replay scene',exact=True).click()
        expect(page.get_by_role('button',name='Look at pressure trace',exact=True)).to_have_count(0)
        assert (abs(page.evaluate("() => __harborWorld.entities.get('pressure-core').getLocalScale().x")-1)<.01), (
            'Replay scene must clear the branch transform as well as the action')
        expect(page.get_by_role('button',name='Light harbor beacon',exact=True)).to_be_visible()
        page.evaluate("() => __harborWorld.applyPatch({transforms:{'harbor-beacon':{position:[0,.5,10]}}})")
        behind=page.get_by_role('button',name='Light harbor beacon',exact=True)
        expect(behind).to_be_visible()
        page.wait_for_function("() => document.querySelector('.rgi-target[data-entity=\"harbor-beacon\"]')?.dataset.edge === 'behind'")
        assert behind.get_attribute('data-edge')=='behind',behind.get_attribute('data-edge')
        assert behind.get_attribute('aria-description')
        page.get_by_role('button',name='Light harbor beacon',exact=True).click()
        expect(page.locator('#rgi-fact')).to_have_text('The beacon is bright.')
        assert page.locator('#rgi-intro').get_attribute('data-chosen-path')=='harbor-beacon'
        beacon=page.evaluate("() => __harborWorld.entities.get('harbor-beacon').getLocalScale().x")
        assert abs(beacon-1.5)<.01,beacon
        page.locator('#rgi-world').click(position={'x':10,'y':10})
        expect(page.locator('#rgi-title')).to_have_text('The harbor holds')
        page.locator('#rgi-world').click(position={'x':10,'y':10})
        expect(page.locator('#rgi-intro')).to_have_count(0)
        saved=page.evaluate('JSON.stringify(__harborSaved)')
        page.evaluate('window.__openHarbor(true)')
        page.get_by_role('button',name='Tune pressure core',exact=True).click()
        expect(page.get_by_role('button',name='Look at pressure trace',exact=True)).to_be_visible()
        page.get_by_role('button',name='Return to game',exact=True).click()
        expect(page.locator('#rgi-intro')).to_have_count(0)
        assert page.evaluate('JSON.stringify(__harborSaved)')==saved
        page.evaluate('window.__openHarbor(true)')
        choice=page.get_by_role('button',name='Tune pressure core',exact=True)
        choice.focus();page.keyboard.press('Space')
        look=page.get_by_role('button',name='Look at pressure trace',exact=True)
        expect(look).to_be_visible()
        look.focus();page.keyboard.press('Space')
        expect(page.locator('#rgi-fact')).to_have_text('The pressure trace points to shelter.')
        page.keyboard.press('Escape')
        expect(page.locator('#rgi-intro')).to_have_count(0)
        assert page.evaluate('JSON.stringify(__harborSaved)')==saved
        page.evaluate('window.__openHarbor(false)')
        page.get_by_role('button',name='Tune pressure core',exact=True).click()
        expect(page.get_by_role('button',name='Look at pressure trace',exact=True)).to_be_visible()
        page.get_by_role('button',name='Skip opening',exact=True).click()
        expect(page.locator('#rgi-intro')).to_have_count(0)
        assert page.evaluate('JSON.stringify(__harborSaved)')==saved
        return {'world_id':'harbor.pressure-proof','pressure_scale_after_first_choice':scale,'beacon_scale_after_replay_choice':beacon,
                'environment':environment,'companion_contact':contact,'exit':page.evaluate('window.__harborExit'),
                'saved_unchanged':True,'canvas_remaining':page.locator('canvas').count()}
    finally:context.close()


def alternate_timeline_carry(browser,url):
    context=browser.new_context(viewport={'width':390,'height':844})
    try:
        page=context.new_page();page.set_default_timeout(15000)
        page.route('**/harbor-timeline-proof',lambda route:route.fulfill(content_type='text/html',body='''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/play-canvas.css"><link rel="stylesheet" href="/rescue-intro.css"><style>html,body,#fixture{margin:0;width:100%;height:100%;background:#102838}</style><script src="/game-world-status.js"></script></head><body><main id="fixture"></main></body></html>'''))
        page.goto(url+'/harbor-timeline-proof')
        page.evaluate("""async()=>{
          const {createGameRuntime}=await import('/game-runtime.js');
          const {openGameOpening}=await import('/game-opening.js');
          const {makeWorldPackage}=await import('/spec-game-world.js');
          const spec={schemaVersion:'1',id:'harbor.timeline-proof',version:'1',
            environment:{clearColor:'#183247',ambient:'#7894a6'},
            materials:{signal:{diffuse:'#e9c569'}},
            entities:[{id:'harbor-beacon',primitive:'sphere',material:'signal',position:[0,0,0]},
                      {id:'pressure-core',primitive:'sphere',material:'signal',position:[1,0,0]},
                      {id:'harbor-carry',primitive:'sphere',material:'signal',position:[0,1,0],enabled:false},
                      {id:'storm-signal',primitive:'sphere',material:'signal',position:[0,2,0],enabled:false}],
            cameras:{dock:{position:[0,1,6],lookAt:[0,0,0],fov:45}},states:{opening:{camera:'dock'}}};
          const present=state=>Number(state?.storyBeat??state)===0?
            {camera:'dock',hide:['harbor-carry','storm-signal']}:
            {camera:'dock',hide:['harbor-carry','storm-signal'],timeline:{duration:700,
              cues:[{at:250,patch:{show:['storm-signal']}}]}};
          const module={...makeWorldPackage(spec,present,{cinematic:true}),worldSpec:spec};
          const opening={id:'harbor.timeline-opening',title:'Harbor signal',waitForMotion:true,scenes:[
            {beat:0,title:'Choose a signal',choices:[
              {target:'harbor-beacon',label:'Light harbor beacon',patch:{show:['harbor-carry']},
                carry:{show:['harbor-carry']},success:{fact:'The beacon answers.'}},
              {target:'pressure-core',label:'Tune pressure core',patch:{},success:{fact:'The core answers.'}}]},
            {beat:1,carryChoiceFrom:0,title:'A storm arrives',body:'The harbor signal survives.'}]};
          window.__timelineRuntime=createGameRuntime();
          openGameOpening({root:document.querySelector('#fixture'),spec:opening,
            runtime:window.__timelineRuntime,worldModule:module,replay:true,reducedMotion:false});
        }""")
        page.get_by_role('button',name='Light harbor beacon',exact=True).click()
        expect(page.locator('#rgi-fact')).to_have_text('The beacon answers.')
        page.locator('#rgi-world').click(position={'x':10,'y':10})
        expect(page.locator('#rgi-title')).to_have_text('A storm arrives')
        page.wait_for_function("() => Boolean(__timelineRuntime.world.projectEntity('storm-signal')?.visible)")
        page.wait_for_function('() => !__timelineRuntime.world.stats().animating')
        assert page.evaluate("() => Boolean(__timelineRuntime.world.projectEntity('harbor-carry')?.visible)")
        assert not page.evaluate('() => __timelineRuntime.world.stats().animating')
        return {'world_id':'harbor.timeline-proof','branch_carry_visible':True,'authored_cue_visible':True}
    finally:context.close()


def companion_movement(browser,url):
    """An unrelated authored companion must stop attempted movement, not just expose a collider."""
    context=browser.new_context(viewport={'width':800,'height':600})
    try:
        page=context.new_page();page.set_default_timeout(15000)
        page.route('**/companion-contact-proof',lambda route:route.fulfill(content_type='text/html',body='''<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/play-canvas.css"><style>html,body,#world{margin:0;width:100%;height:100%;background:#102838}</style></head><body><main id="world"></main></body></html>'''))
        page.goto(url+'/companion-contact-proof')
        page.evaluate("""async()=>{
          const {createPlayCanvasWorld}=await import('/playcanvas-backend.js');
          const {companionRobot}=await import('/rescue-world-props.js');
          const {characterControlProfile}=await import('/game-character-spec.js');
          const spec={schemaVersion:'1',id:'observatory.contact-proof',version:'1',
            environment:{clearColor:'#183247',ambient:'#7894a6'},
            materials:{copper:{diffuse:'#c77e64'},shell:{diffuse:'#e7d6b5'},frame:{diffuse:'#414f62'},
              visor:{diffuse:'#233d55'},eyes:{diffuse:'#f8dc94'},trim:{diffuse:'#dbb971'}},
            entities:[{id:'visitor',primitive:'sphere',material:'shell',position:[0,.8,2],scale:[.4,.8,.4]},
              ...companionRobot('observatory-guide',[0,0,0],{color:'copper',height:2.2,solid:true,
                shell:{plate:'shell',frame:'frame',visor:'visor',eyes:'eyes',trim:'trim'}})],
            cameras:{dock:{position:[0,3,7],lookAt:[0,1,0],fov:50}},
            states:{dock:{camera:'dock'}},
            player:characterControlProfile({entity:'visitor',spawn:[0,0,2],speed:3,
              surfaces:[{bounds:[-4,4,-4,4],height:0}],body:{radius:.25,height:1.5},
              camera:{yaw:0,pitch:22,distance:5,minDistance:2.8,maxDistance:10,targetHeight:1.1}})};
          const host=document.querySelector('#world');window.__contactWorld=createPlayCanvasWorld(host,spec,{interactive:true});
          __contactWorld.setControlMode('third-person','contact-proof');
        }""")
        assert page.evaluate('() => __contactWorld.available')
        start=page.evaluate('() => __contactWorld.getPlayerView().position')
        page.locator('#world').focus()
        page.keyboard.down('w');page.wait_for_timeout(1100);page.keyboard.up('w')
        forward=page.evaluate('() => __contactWorld.getPlayerView().position')
        assert forward[2]<start[2]-.5,(start,forward)
        assert forward[2]>.5,(start,forward,'solid torso did not stop forward movement')
        page.keyboard.down('d');page.wait_for_timeout(350);page.keyboard.up('d')
        lateral=page.evaluate('() => __contactWorld.getPlayerView().position')
        assert lateral[0]>forward[0]+.3,(forward,lateral,'controls may be frozen rather than blocked by torso')
        page.evaluate('() => __contactWorld.dispose()')
        return {'start':start,'forward_stopped':forward,'lateral_recovery':lateral}
    finally:context.close()


def main():
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'renderer-probe.sqlite3')
        browser=p.chromium.launch()
        results={}
        try:
            if '--alternate-only' in sys.argv:
                results['alternate_world']=alternate_world(browser,url)
                print(json.dumps(results,ensure_ascii=True))
                return
            if '--contact-only' in sys.argv:
                results['companion_movement']=companion_movement(browser,url)
                print(json.dumps(results,ensure_ascii=True))
                return
            results['current_route']=current_route(browser,url)
            results['alternate_world']=alternate_world(browser,url)
            results['alternate_timeline_carry']=alternate_timeline_carry(browser,url)
            results['companion_movement']=companion_movement(browser,url)
            if any(results['current_route'][phase]['support']!='available' for phase in ('opening','mission')):
                results['status']='unassessed: WEBGL_lose_context unavailable'
            else:results['status']='passed'
            (OUT/'opening-renderer-contract.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
            if results['status']!='passed':raise RuntimeError(results['status'])
            print('Shared opening and current-route WebGL loss/restoration passed')
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
