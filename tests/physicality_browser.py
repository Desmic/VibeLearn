"""Continuous, timestamped physicality evidence using real keyboard/camera input."""
import json
import math
import tempfile
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server, wait_frames, launch_browser
from tests.level1_chapter_browser import skip_opening_to_tutorial, complete_tutorial

ROOT = Path(__file__).resolve().parents[1]


def player(page):
    return page.evaluate('FirstWordsReview.runtime.world.player')


def label(page, text):
    page.evaluate('(text)=>window.__probeLabel=text', text)


def hold(page, key, duration):
    # duration milliseconds is translated into rendered frames so slow
    # software-WebGL rendering cannot starve movement integration.
    page.keyboard.down(key)
    try:
        wait_frames(page, max(1, round(duration / 100)))
    finally:
        page.keyboard.up(key)
    page.wait_for_timeout(120)


def step(page, key):
    # One keyboard-driven step: hold the key until a rendered frame actually
    # integrates the input. A real keypress still produces the movement; the
    # wait makes setup walking deterministic on frame-starved renderers, while
    # a genuinely blocked position times out instead of drifting silently.
    before = player(page)['position']
    page.keyboard.down(key)
    deadline = time.monotonic() + 3
    while player(page)['position'] == before:
        if time.monotonic() >= deadline:
            page.keyboard.up(key)
            return False
        wait_frames(page, 1)
    page.keyboard.up(key)
    return True


def walk_to(page, x, z):
    # Setups use normal movement, never teleport/restore presentation state.
    page.get_by_role('button', name='Recenter camera', exact=True).click()
    wait_frames(page, 1)
    for axis, target, negative, positive in ((0, x, 'KeyA', 'KeyD'), (2, z, 'KeyW', 'KeyS')):
        deadline = time.monotonic() + 90
        while abs(player(page)['position'][axis] - target) > .18:
            assert time.monotonic() < deadline, (target, player(page))
            current = player(page)['position'][axis]
            key = negative if current > target else positive
            if not step(page, key):
                # Key held for seconds without one unit of movement: a real
                # obstruction. Live collider geometry pinpoints what occupies
                # the attempted step so setup walks cannot mask a physicality
                # regression or a stray collider.
                stuck = player(page)
                near = [c for c in page.evaluate('FirstWordsReview.colliders')
                        if c['min'][0] - .8 < stuck['position'][0] < c['max'][0] + .8
                        and c['min'][2] - .8 < stuck['position'][2] < c['max'][2] + .8]
                raise AssertionError((target, stuck, near))
            page.wait_for_timeout(60)


def stationary_under_input(page, key):
    before = player(page)['position']
    hold(page, key, 650)
    after = player(page)['position']
    assert math.dist(before, after) < .08, (before, after)
    return after


def move_until(page, key, reached):
    deadline = time.monotonic() + 40
    page.keyboard.down(key)
    try:
        while not reached(player(page)['position']):
            assert time.monotonic() < deadline, player(page)
            page.wait_for_timeout(100)
    finally:
        page.keyboard.up(key)


def main():
    out = ROOT/'artifacts'; out.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temp, sync_playwright() as p:
        proc, url = start_server(Path(temp)/'physicality.db')
        browser = launch_browser(p)
        ctx = browser.new_context(viewport={'width':1280,'height':800},
            record_video_dir=str(Path(temp)/'video'), record_video_size={'width':1280,'height':800})
        page = ctx.new_page(); video = page.video
        observations = []
        try:
            page.goto(url+'/first-words')
            skip_opening_to_tutorial(page, skip_controls=True)
            layout = page.evaluate("""async()=>{
              const {worldSpec:s}=await import('/first-words-world.js');
              const pc=await import('/vendor/playcanvas.mjs');
              const nodes=new Map(s.entities.map(d=>[d.id,new pc.Entity(d.id)]));
              for(const d of s.entities){const n=nodes.get(d.id);
                if(d.parent)nodes.get(d.parent).addChild(n);
                n.setLocalPosition(...(d.position||[0,0,0]));
                n.setLocalEulerAngles(...(d.rotation||[0,0,0]));
                n.setLocalScale(...(d.scale||[1,1,1]));}
              const bounds=id=>{const d=s.entities.find(d=>d.id===id),m=nodes.get(id).getWorldTransform();
                const h=d.collider.halfExtents||[.5,.5,.5],o=d.collider.offset||[0,0,0],points=[];
                for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
                  const v=m.transformPoint(new pc.Vec3(o[0]+x*h[0],o[1]+y*h[1],o[2]+z*h[2]));points.push([v.x,v.y,v.z]);}
                return {min:[0,1,2].map(i=>Math.min(...points.map(v=>v[i]))),max:[0,1,2].map(i=>Math.max(...points.map(v=>v[i])))};};
              return {spawn:s.player.spawn,body:s.player.body,surface:s.player.surfaces[0],
                prop:bounds('words'),gate:bounds('moon-door')};
            }""")
            page.evaluate("""()=>{
              window.__probeLabel='start';window.__probeSamples=[];
              const badge=document.createElement('div');document.body.append(badge);
              Object.assign(badge.style,{position:'fixed',top:'0',left:'35%',zIndex:99999,
                background:'#000',color:'#fff',font:'12px monospace',pointerEvents:'none'});
              window.__probeTimer=setInterval(()=>{const t=Math.round(performance.now());
                const p=FirstWordsReview.runtime?.world?.player;
                badge.textContent=window.__probeLabel+' | '+t+' ms';
                if(p)window.__probeSamples.push({t,label:window.__probeLabel,...p});},100);
            }""")
            prop = layout['prop']; radius = layout['body']['radius']
            center_x = (prop['min'][0]+prop['max'][0])/2
            center_z = (prop['min'][2]+prop['max'][2])/2
            label(page, 'prop: east approach and sustained contact')
            walk_to(page, layout['spawn'][0], center_z)
            move_until(page, 'KeyA', lambda p:p[0]<prop['max'][0]+radius+.2)
            east = stationary_under_input(page, 'KeyA')
            assert east[0] >= prop['max'][0]+radius-.08, east
            assert east[0] < prop['max'][0]+radius+.25, east
            page.screenshot(path=str(out/'physicality-prop-east.png'))
            label(page, 'prop: south approach and sustained contact')
            walk_to(page, layout['spawn'][0], prop['max'][2]+radius+.7)
            walk_to(page, center_x, prop['max'][2]+radius+.7)
            move_until(page, 'KeyW', lambda p:p[2]<prop['max'][2]+radius+.2)
            south = stationary_under_input(page, 'KeyW')
            assert south[2] >= prop['max'][2]+radius-.08, south
            page.screenshot(path=str(out/'physicality-prop-south.png'))
            observations.append({'probe':'prop contact from two faces','east':east,'south':south,
                'limits':'Position stability alone does not prove visually aligned contact; inspect the synchronized video.'})

            label(page, 'closed gate: approach and continued forward input')
            walk_to(page, layout['spawn'][0], layout['spawn'][2])
            move_until(page, 'KeyW', lambda p:p[2]<layout['surface']['bounds'][2]+.15)
            closed = stationary_under_input(page, 'KeyW')
            assert closed[2] > layout['gate']['max'][2], closed
            page.screenshot(path=str(out/'physicality-gate-closed.png'))
            observations.append({'probe':'closed route','position':closed,
                'limits':'Surface boundary stops approach before gate collider; not proof of gate-collider contact.'})

            label(page, 'open gate: normal tutorial actions')
            complete_tutorial(page)
            label(page, 'open gate: traverse same threshold')
            move_until(page, 'KeyW', lambda p:p[2]<layout['gate']['min'][2]-radius-1)
            opened = player(page)['position']
            assert opened[2] < layout['gate']['min'][2]-radius, opened
            page.screenshot(path=str(out/'physicality-gate-crossed.png'))
            observations.append({'probe':'opened route traversal','before':closed,'after':opened})

            label(page, 'right wall: approach and continued input')
            walk_to(page, 0, sum(layout['surface']['bounds'][2:])/2)
            move_until(page, 'KeyD', lambda p:p[0]>layout['surface']['bounds'][1]-.15)
            wall = stationary_under_input(page, 'KeyD')
            assert wall[0] <= layout['surface']['bounds'][1], wall
            page.screenshot(path=str(out/'physicality-wall-contact.png'))
            observations.append({'probe':'side boundary','position':wall,
                'limits':'Walkable-surface boundary also restricts travel; do not infer collider-only causality.'})
            label(page, 'wall: continuous camera orbit and zoom')
            for start,end in (((880,410),(270,440)),((270,440),(1060,440))):
                page.mouse.move(*start);page.mouse.down()
                for i in range(1,61):
                    page.mouse.move(start[0]+(end[0]-start[0])*i/60,start[1]+(end[1]-start[1])*i/60)
                    page.wait_for_timeout(30)
                page.mouse.up()
                page.get_by_role('button',name='Zoom camera in',exact=True).click()
                page.screenshot(path=str(out/f'physicality-wall-orbit-{end[0]}.png'))
            samples = page.evaluate('window.__probeSamples')
            camera_samples=[s for s in samples if s['label']=='wall: continuous camera orbit and zoom']
            assert len(camera_samples)>10
            assert all(s['presentedCamera']['clearanceSatisfied'] for s in camera_samples), camera_samples
            observations.append({'probe':'continuous movement/camera samples','sample_count':len(samples),
                'clock':'performance.now milliseconds; same label/time burned into video'})
            print('Physicality: real-input contact, closed/open traversal and continuous camera evidence captured',flush=True)
        finally:
            if not page.is_closed():
                samples=page.evaluate('window.__probeSamples||[]')
                (out/'physicality-interaction-trace.json').write_text(json.dumps({
                    'schema':'vibelearn.interactive-trace.v1','suite':'first-words-controls',
                    'observations':observations,'samples':samples},indent=2),encoding='utf-8')
            ctx.close();video.save_as(str(out/'physicality-motion-1280.webm'))
            browser.close();stop_server(proc)


if __name__=='__main__':
    main()
