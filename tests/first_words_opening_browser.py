"""Opening-first gate. Does not play or certify the rest of Level 1."""
import base64
import json
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server
from tests.first_words_browser import until

ROOT=Path(__file__).resolve().parents[1]

def log(message):print(message,flush=True)

def tap_world(page):
    # Ambient advancement: a tap anywhere on the story world moves the beat on.
    # Top-left corner is outside markers, corner controls and the caption band.
    box=page.locator('#rgi-world').bounding_box()
    page.mouse.click(box['x']+10,box['y']+10)

def hold(page):
    # Pause owns the beat for evidence work: no auto-advance while held.
    page.get_by_role('button',name='Pause story motion',exact=True).click()

def release(page):
    page.get_by_role('button',name='Resume story motion',exact=True).click()
    until(page,'()=>!FirstWordsReview.runtime.world.animating')

def advance_beat(page,title):
    # Reduced-motion play never auto-advances; a tap on the world moves it on.
    until(page,'()=>!FirstWordsReview.runtime.world.animating')
    tap_world(page)
    expect(page.locator('#rgi-title')).to_have_text(title,timeout=20000)

# Loudness of the game's own master-bus capture, decoded in the page. A preference flag
# is not evidence that a control does anything; the sample count above a floor is.
LOUDNESS="""async (spec) => {
  const decode=async dataUrl=>{
    const bin=atob(dataUrl.split(',')[1]);
    const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    const buf=await new OfflineAudioContext(1,1,48000).decodeAudioData(bytes.buffer);
    const d=buf.getChannelData(0);
    let peak=0,sum=0,audible=0;
    for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>peak)peak=v;sum+=v*v;if(v>0.002)audible++;}
    return {seconds:+buf.duration.toFixed(2),peak:+peak.toFixed(5),
            rms:+Math.sqrt(sum/d.length).toFixed(5),audibleFraction:+(audible/d.length).toFixed(4)};
  };
  if(spec.dataUrl)return await decode(spec.dataUrl);
  await FirstWordsReview.audioCapture.start();
  await new Promise(r=>setTimeout(r,spec.seconds*1000));
  const cap=await FirstWordsReview.audioCapture.stop();
  return {...await decode(cap.dataUrl),bytes:cap.bytes};
}"""

def loudness(page,**spec):
    value=page.evaluate(LOUDNESS,spec)
    assert 'peak' in value,value
    return value

def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);checks=[];errors=[]
    def observe_graphics(message):
        if 'GL_INVALID_FRAMEBUFFER_OPERATION' in message.text or 'Framebuffer is incomplete' in message.text:
            errors.append(message.text)
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'opening.db');browser=p.chromium.launch()
        try:
            context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,record_video_dir=str(Path(temp)/'video'),record_video_size={'width':390,'height':844})
            page=context.new_page();page.set_default_timeout(15000);page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('console',observe_graphics)
            log('Prologue: navigate');page.goto(url+'/first-words')
            expect(page.locator('#rgi-intro')).to_be_visible(timeout=20000)
            expect(page.locator('#adventure')).to_have_attribute('data-experience-mode','opening')
            expect(page.locator('#engine')).to_be_hidden()
            expect(page.locator('#controls')).to_be_hidden()
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            expect(page.locator('#rgi-title')).to_have_text('One lantern. Three friends.')
            speech=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');return Object.fromEntries(['zip-speech','mira-speech','zip-speech-link','zip-silence'].map(id=>[id,getGameRuntime().world.projectEntity(id)?.visible||false]));}""")
            assert speech=={'zip-speech':True,'mira-speech':True,'zip-speech-link':True,'zip-silence':False},speech
            delivery=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');const w=getGameRuntime().world;return ['bellworker-a-parcel','bellworker-b-parcel'].map(id=>w.projectEntity(id)?.visible||false);}""")
            assert delivery==[False,True],delivery
            # Resize the existing story world: do not restore a gameplay spawn
            # over the cinematic actor placement when switching aspect ratios.
            for width,height in [(1280,720),(390,844)]:
                page.set_viewport_size({'width':width,'height':height})
                until(page,"""async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);const {getGameRuntime}=await import('/game-runtime.js');return Boolean(getGameRuntime().world.projectEntity('zip')?.visible);}""")

            expect(page.locator('#rgi-body')).to_contain_text('for the three of you')
            page.screenshot(path=str(out/'prologue-home-390.png'),timeout=15000)
            before_lantern=page.evaluate('JSON.stringify(FirstWordsReview.state)')
            page.get_by_role('button',name='Send up our lantern',exact=True).click()
            expect(page.locator('#rgi-dialogue')).to_contain_text('All three of us')
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            assert page.evaluate('JSON.stringify(FirstWordsReview.state)')==before_lantern
            until(page,"()=>FirstWordsReview.audio.ready")
            capture_started=page.evaluate("()=>FirstWordsReview.audioCapture.start()")
            assert capture_started['state']=='recording',capture_started
            page.screenshot(path=str(out/'prologue-lantern-release-390.png'),timeout=15000)

            log('Prologue: visible cause');expect(page.locator('#rgi-title')).to_have_text('A shadow over Bellweather.',timeout=45000)
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            hold(page)
            cause_before=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
                const w=getGameRuntime().world;return {
                  warden:w.projectEntity('warden'),
                  link:w.projectEntity('warden-rift-link-pulse-3'),
                  rift:w.projectEntity('rift')
                };}""")
            assert cause_before['warden'] and cause_before['warden']['visible'],cause_before
            assert cause_before['link'] and cause_before['link']['visible'],cause_before
            assert cause_before['rift'] is None,cause_before
            page.screenshot(path=str(out/'prologue-threat-cause-390.png'),timeout=15000)
            # The plain beat offers no persistent control; the tap moves it on.
            expect(page.locator('#rgi-next')).to_be_hidden()
            release(page);tap_world(page)

            log('Prologue: rupture effect');expect(page.locator('#rgi-title')).to_have_text('The sky cracks open.',timeout=45000)
            until(page,"""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
                return Boolean(getGameRuntime().world.projectEntity('rift')?.visible);
            }""")
            until(page,"()=>FirstWordsReview.audio.ready && FirstWordsReview.audio.version==='bellweather-score-v2' && FirstWordsReview.audio.scheduledBars>0")
            until(page,"()=>FirstWordsReview.audio.phase==='danger'")
            hold(page)
            until(page,"()=>FirstWordsReview.audio.state==='suspended'")
            expect(page.locator('#rgi-next')).to_be_hidden()
            # A paused beat holds indefinitely - well past the ambient dwell -
            # so the player is never run off a scene mid-reading.
            page.wait_for_timeout(15000)
            expect(page.locator('#rgi-title')).to_have_text('The sky cracks open.')
            page.screenshot(path=str(out/'prologue-rupture-paused-390.png'),timeout=15000)
            release(page)
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            vanished=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
                const w=getGameRuntime().world;return ['zip','singer','friend-a'].map(id=>w.projectEntity(id));}""")
            assert vanished==[None,None,None],vanished
            page.screenshot(path=str(out/'prologue-rupture-complete-390.png'),timeout=15000)
            # Rewind on the same runtime after individual actors were hidden.
            # Menu replay creates a new runtime and cannot prove this reset.
            hold(page)
            page.locator('#rgi-back').click()
            page.locator('#rgi-back').click()
            restored=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');return ['zip','singer','friend-a','bellworker-a','bellworker-b','bellworker-b-parcel'].map(id=>getGameRuntime().world.projectEntity(id)!==null);}""")
            assert all(restored),restored
            # Released at the (already completed) home beat: the ambient timer
            # walks shadow -> rupture -> limbo with no further input at all,
            # which is the whole point of the presentation contract.
            release(page)
            expect(page.locator('#rgi-title')).to_have_text('A shadow over Bellweather.',timeout=90000)
            expect(page.locator('#rgi-title')).to_have_text('The sky cracks open.',timeout=90000)


            log('Prologue: limbo');expect(page.locator('#rgi-title')).to_have_text('Silence.',timeout=90000)
            expect(page.locator('#rgi-body')).to_contain_text('Zip wakes alone')
            hold(page)
            page.screenshot(path=str(out/'prologue-limbo-390.png'),timeout=15000)
            release(page);tap_world(page)

            log('Prologue: prison reveal');expect(page.locator('#rgi-title')).to_have_text('This is not home.',timeout=45000)
            hold(page)
            early=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
                const w=getGameRuntime().world;return ['moon','sun','notice-old'].map(id=>w.projectEntity(id));}""")
            assert early==[None,None,None],early
            page.screenshot(path=str(out/'prologue-reveal-early-paused-390.png'),timeout=15000)
            release(page)
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            expect(page.get_by_role('button',name='SEALED EXIT',exact=True)).to_be_visible()
            page.screenshot(path=str(out/'prologue-prison-reveal-390.png'),timeout=15000)
            tap_world(page)

            log('Prologue: speech target');expect(page.locator('#rgi-title')).to_have_text('It finds your voice.',timeout=45000)
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            hold(page)
            targeted=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
                const w=getGameRuntime().world;return {
                  socket:w.projectEntity('zip-voice-socket'),
                  attached:w.projectEntity('zip-voice'),
                  link:w.projectEntity('voice-extract-link-pulse-2'),
                  removed:w.projectEntity('stolen-voice')
                };}""")
            assert targeted['socket'] and targeted['socket']['visible'],targeted
            assert targeted['attached'] and targeted['attached']['visible'],targeted
            assert targeted['link'] and targeted['link']['visible'],targeted
            assert targeted['removed'] is None,targeted
            page.screenshot(path=str(out/'prologue-speech-targeted-390.png'),timeout=15000)
            release(page);tap_world(page)

            log('Prologue: speech removal');expect(page.locator('#rgi-title')).to_have_text('It tears the module free.',timeout=45000)
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            hold(page)
            removal=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');
                const w=getGameRuntime().world;return {
                  socket:w.projectEntity('zip-voice-socket'),
                  attached:w.projectEntity('zip-voice'),
                  module:w.projectEntity('stolen-voice'),
                  warden:w.projectEntity('warden')
                };}""")
            assert removal['socket'] and removal['socket']['visible'],removal
            assert removal['attached'] is None,removal
            assert removal['module'] and removal['module']['visible'],removal
            assert removal['warden'] and removal['warden']['visible'],removal
            speech=page.evaluate("""async()=>{const {getGameRuntime}=await import('/game-runtime.js');return Object.fromEntries(['zip-speech','mira-speech','zip-speech-link','zip-silence'].map(id=>[id,getGameRuntime().world.projectEntity(id)?.visible||false]));}""")
            assert speech=={'zip-speech':False,'mira-speech':False,'zip-speech-link':False,'zip-silence':True},speech
            page.screenshot(path=str(out/'prologue-speech-removed-390.png'),timeout=15000)
            captured=page.evaluate("()=>FirstWordsReview.audioCapture.stop()")
            assert captured and captured['bytes']>1000,captured
            payload=captured['dataUrl'].split(',',1)[1]
            (out/'prologue-event-audio.webm').write_bytes(base64.b64decode(payload))
            assert (out/'prologue-event-audio.webm').stat().st_size==captured['bytes']
            # The score was audible before the mute, so a silent reading afterwards is the
            # preference working rather than a capture that never carried sound.
            heard=loudness(page,dataUrl=captured['dataUrl'])
            assert heard['peak']>0.01 and heard['audibleFraction']>0.05,heard
            page.locator('#opening-mute').click()
            assert page.evaluate('FirstWordsReview.audio.preferences.muted')
            expect(page.locator('#opening-mute')).to_have_attribute('aria-label','Unmute all sound')
            # Both mute surfaces render one reading of the same global preference. The
            # masthead copy is hidden during the opening, so compare it through the DOM.
            assert page.evaluate("""()=>{const a=document.querySelector('#mute'),b=document.querySelector('#opening-mute');
                return a.textContent===b.textContent&&a.getAttribute('aria-label')===b.getAttribute('aria-label')
                  &&a.getAttribute('aria-pressed')===b.getAttribute('aria-pressed');}""")
            release(page);tap_world(page)
            # A suspended context is silent whatever the preference says: prove it was running.
            until(page,"()=>FirstWordsReview.audio.state==='running'&&FirstWordsReview.audio.scheduledBars>0")
            # The bus intentionally fades with a 0.12s time constant. Measure the
            # steady muted state after that ramp, not the audible transition into it.
            page.wait_for_timeout(1000)
            muted=loudness(page,seconds=3)
            assert muted['peak']<heard['peak']/50 and muted['rms']<heard['rms']/50,(heard,muted)

            log('Prologue: repair handoff');expect(page.locator('#rgi-title')).to_have_text('Get the words back.',timeout=45000)
            expect(page.get_by_role('button',name='REPAIR SOCKET',exact=True)).to_be_visible()
            instance=page.evaluate('FirstWordsReview.runtime.instanceId')
            page.screenshot(path=str(out/'prologue-repair-handoff-390.png'),timeout=15000)
            # Rule I6: the handoff is ambient. Motion play paints NO "Take control"
            # button; a tap on the world hands control to the player (the reduced-motion
            # single control below is the only place that affordance is visible).
            expect(page.locator('#rgi-next')).to_be_hidden()
            until(page,'()=>!FirstWordsReview.runtime.world.animating')
            tap_world(page)
            expect(page.locator('#rgi-intro')).to_have_count(0,timeout=20000)
            expect(page.locator('#adventure')).to_have_attribute('data-experience-mode','tutorial')
            expect(page.locator('#welcome')).to_be_hidden()
            expect(page.locator('#engine')).to_be_visible()
            expect(page.locator('#controls')).to_be_hidden()
            expect(page.locator('#stage-name')).to_have_text('TUTORIAL · MOVE')
            page.get_by_role('button',name='Skip control practice',exact=True).click()
            # Speech repair is diegetic: the panel folds behind the world toggle and
            # the POWER LEAD world marker carries the verb (no obstructing card).
            expect(page.locator('#engine')).to_be_hidden()
            expect(page.get_by_role('button',name='Connect the loose power lead',exact=True)).to_be_visible(timeout=15000)
            expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 1/4')
            expect(page.locator('#saved')).to_have_text('Saved')
            until(page,"()=>FirstWordsReview.audio.phase==='repair'")
            assert page.evaluate('FirstWordsReview.runtime.instanceId')==instance
            assert page.evaluate("FirstWordsReview.runtime.mode")=='mission'
            checks.append('Eight causal prologue beats separate normal Bellweather, visible Warden cause, rupture effect, isolation, prison reveal, speech targeting, capability removal and repair handoff before the separate tutorial; the same runtime becomes direct-control mission play.')
            checks.append('The Bellweather score is not required before a gesture; the first story advance unlocks bellweather-score-v2 and schedules bars before danger-phase assertions.')
            checks.append('Plain story beats carry no persistent advance control: they advance ambiently once motion settles, a paused beat holds indefinitely, a world tap moves a beat on immediately, story actions are performed on their diegetic world marker (never a bottom button), the final handoff is ambient (a world tap hands control over, no painted button in motion play), and reduced-motion play never auto-advances but paints exactly one explicit control (WCAG 2.2.4).')

            before=page.evaluate('JSON.stringify(FirstWordsReview.state)')
            log('Prologue: replay preserves draft');page.get_by_role('button',name='Open game menu').click();page.get_by_role('button',name='Replay the prologue',exact=True).click()
            page.get_by_role('button',name='Return to game',exact=True).click()
            assert page.evaluate('JSON.stringify(FirstWordsReview.state)')==before
            page.reload();expect(page.get_by_role('button',name='Connect the loose power lead',exact=True)).to_be_visible(timeout=15000);expect(page.locator('#rgi-intro')).to_have_count(0)
            # Muting is a device preference, not page state: it survives the reload and the
            # control that resumes must say so.
            until(page,'()=>!!window.FirstWordsReview')
            assert page.evaluate('FirstWordsReview.audio.preferences.muted') is True
            expect(page.locator('#mute')).to_have_attribute('aria-label','Unmute all sound')
            checks.append('Explicit prologue replay is presentation-only; returning tutorial state resumes without replaying the prologue.')

            for width,height in [(360,800),(430,932),(1280,800)]:
                log(f'Prologue: fresh reduced-motion {width}')
                ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce',has_touch=width<500)
                q=ctx.new_page();q.set_default_timeout(15000);q.on('pageerror',lambda e:errors.append(str(e)));q.on('console',observe_graphics);q.goto(url+'/first-words')
                expect(q.locator('#rgi-title')).to_have_text('One lantern. Three friends.',timeout=20000)
                q.get_by_role('button',name='Send up our lantern',exact=True).click()
                expect(q.locator('#rgi-dialogue')).to_contain_text('All three of us')
                clearance=q.evaluate("""async()=>{
                    const {getGameRuntime}=await import('/game-runtime.js');
                    const point=getGameRuntime().world.projectEntity('friendship-lantern');
                    const top=document.querySelector('#rgi-world').getBoundingClientRect().top;
                    const nodes=[...document.querySelectorAll('#rgi-body,#rgi-fact')].filter(n=>n.textContent.trim());
                    const rects=nodes.map(n=>n.getBoundingClientRect());
                    const textBounds={left:Math.min(...rects.map(r=>r.left)),right:Math.max(...rects.map(r=>r.right)),top:Math.min(...rects.map(r=>r.top)),bottom:Math.max(...rects.map(r=>r.bottom))};
                    return {visible:point?.visible,lanternX:point?.x||0,lanternY:top+(point?.y||0),captionLeft:textBounds.left,captionRight:textBounds.right,captionTop:textBounds.top,captionBottom:textBounds.bottom};
                }""")
                horizontal_clear=clearance['lanternX']<clearance['captionLeft']-16 or clearance['lanternX']>clearance['captionRight']+16
                # The subtitle band owns the bottom; the focal lantern rises above it.
                vertical_clear=clearance['lanternY']<clearance['captionTop']-16
                assert clearance['visible'] and (horizontal_clear or vertical_clear),clearance
                q.screenshot(path=str(out/f'prologue-lantern-release-{width}.png'),timeout=15000)
                # WCAG 2.2.4: reduced motion never auto-advances (the beat waits for
                # input indefinitely), so rule I6 paints exactly one explicit control.
                expect(q.locator('#rgi-next')).to_be_visible()
                expect(q.get_by_role('button',name='Continue →',exact=True)).to_be_enabled()
                q.wait_for_timeout(12000)
                expect(q.locator('#rgi-title')).to_have_text('One lantern. Three friends.')
                advance_beat(q,'A shadow over Bellweather.')
                q.screenshot(path=str(out/f'prologue-threat-reduced-{width}.png'),timeout=15000)
                advance_beat(q,'The sky cracks open.')
                q.screenshot(path=str(out/f'prologue-rupture-reduced-{width}.png'),timeout=15000)
                advance_beat(q,'Silence.')
                advance_beat(q,'This is not home.')
                expect(q.get_by_role('button',name='SEALED EXIT',exact=True)).to_be_visible()
                advance_beat(q,'It finds your voice.')
                advance_beat(q,'It tears the module free.')
                advance_beat(q,'Get the words back.')
                expect(q.get_by_role('button',name='REPAIR SOCKET',exact=True)).to_be_visible()
                expect(q.get_by_role('button',name='Take control →',exact=True)).to_be_enabled()
                assert q.evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight')
                for selector in ['#rgi-title','#rgi-body','#rgi-next','#rgi-skip']:
                    b=q.locator(selector).bounding_box();assert b and b['x']>=0 and b['y']>=0 and b['x']+b['width']<=width+1 and b['y']+b['height']<=height+1,(selector,b)
                q.screenshot(path=str(out/f'prologue-reduced-{width}.png'),timeout=15000)
                q.get_by_role('button',name='Skip opening',exact=True).click();expect(q.get_by_role('button',name='Skip control practice',exact=True)).to_be_visible(timeout=15000);ctx.close()
            video=page.video
            context.close()
            video.save_as(str(out/'prologue-motion-390.webm'))
            assert (out/'prologue-motion-390.webm').exists()

            # Separate cold-observer motion evidence: same rendered sequence, but
            # explanatory scene captions are visually suppressed so reviewers
            # must first infer world/causality from staging, animation and effects.
            blind_ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True,record_video_dir=str(Path(temp)/'blind-video'),record_video_size={'width':390,'height':844})
            # Install blindness in the document response, before its first paint.
            # Hiding existing nodes after goto leaked opening captions into video.
            def blind_document(route):
                response=route.fetch()
                html=response.text()
                assert '</head>' in html
                style='<link rel="stylesheet" href="/blind-review.css">'
                route.fulfill(response=response,body=html.replace('</head>',style+'</head>',1))
            blind_ctx.route('**/blind-review.css',lambda route:route.fulfill(status=200,content_type='text/css',body='.rgi-kicker,#rgi-title,#rgi-body,#rgi-dialogue,#rgi-fact{visibility:hidden!important}'))
            blind_ctx.route('**/first-words',blind_document)
            blind=blind_ctx.new_page();blind.set_default_timeout(15000);blind.goto(url+'/first-words')
            expect(blind.locator('#rgi-intro')).to_be_visible(timeout=20000)
            expect(blind.locator('#rgi-title')).to_be_hidden()
            until(blind,'()=>!FirstWordsReview.runtime.world.animating')
            blind.get_by_role('button',name='Send up our lantern',exact=True).click();until(blind,'()=>!FirstWordsReview.runtime.world.animating')
            # Rule I6: ambient pacing then carries the WHOLE captioned sequence with
            # zero further input - plain beats auto-advance and the final handoff
            # ambient-closes into the tutorial. Motion play shows no advance control.
            expect(blind.locator('#rgi-next')).to_be_hidden()
            expect(blind.locator('#rgi-intro')).to_have_count(0,timeout=420000)
            expect(blind.locator('#adventure')).to_have_attribute('data-experience-mode','tutorial')
            blind_video=blind.video
            blind_ctx.close()
            blind_video.save_as(str(out/'prologue-caption-blind-390.webm'))
            assert (out/'prologue-caption-blind-390.webm').exists()

            assert not errors,errors
            checks.append('Fresh 360/430/desktop reduced-motion preserves the same eight story states and can skip safely into the separate tutorial without a 2D fallback.')
            checks.append('A separate 390px motion capture suppresses explanatory scene captions for cold-observer visual-comprehension review.')
            cold_packet={
                'schema':'vibelearn.cold-observer-evidence.v1',
                'candidate_source':'GitHub Actions exact SHA supplies candidate identity',
                'review_instruction':'Experience this as a new player. Describe only what the running experience communicates before reading story/design intent.',
                'intentionally_omitted':['story treatment','storyboard rationale','intended causal explanation','creator critique scores'],
                'evidence':{
                    'motion_video':'prologue-motion-390.webm',
                    'caption_blind_motion':'prologue-caption-blind-390.webm',
                    'audio_capture':'prologue-event-audio.webm',
                    'phone_frames':['prologue-home-390.png','prologue-lantern-release-390.png','prologue-threat-cause-390.png','prologue-rupture-paused-390.png','prologue-rupture-complete-390.png','prologue-limbo-390.png','prologue-prison-reveal-390.png','prologue-speech-targeted-390.png','prologue-speech-removed-390.png','prologue-repair-handoff-390.png'],
                    'reduced_motion_frames':['prologue-threat-reduced-360.png','prologue-threat-reduced-430.png','prologue-threat-reduced-1280.png','prologue-rupture-reduced-360.png','prologue-rupture-reduced-430.png','prologue-rupture-reduced-1280.png'],
                    'experience_modes':['opening','tutorial'],
                    'device':'Chromium emulation 390x844 touch plus reduced-motion 360/430/1280'
                },
                'questions':[
                    'What kind of place is shown before the disruption?',
                    'Who appears important and what relationships are visible?',
                    'What ordinary activity makes the place feel inhabited?',
                    'What causes the major disruption, if a cause is perceptible?',
                    'What visibly changes in the world and characters?',
                    'What object or capability appears to be taken later?',
                    'At the handoff, who do you control and what should you do next?',
                    'List anything confusing or inferred only from text.'
                ]
            }
            (out/'cold-observer-opening-packet.json').write_text(json.dumps(cold_packet,indent=2))
            (out/'first-words-opening-report.json').write_text(json.dumps({'result':'passed','checks':checks,'page_errors':errors,'scope':'Prologue only. Motion evidence, actual WebAudio event capture and a context-restricted cold-observer packet are preserved. Audio lifecycle/phase changes are automated; subjective audio quality still requires listening, and physical-phone feel/human acceptance remain unassessed.'},indent=2))
            log('Prologue gate passed')
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
