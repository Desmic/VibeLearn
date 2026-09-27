"""Live v5 route encounter: one insertion, deliberate inference, inspectable continuation."""
import json
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

from tools.check_presentation_budget import BUDGETS, TEXT_SCALE, evaluate_state
from tests.browser_check import launch_browser, start_server, stop_server
from tests.level1_chapter_browser import (
    action, choose, complete_tutorial, open_card, skip_opening_to_tutorial, supply_sign, world_action,
)
from tests.first_words_browser import until

ROOT=Path(__file__).resolve().parents[1]
FEATURE_PROBE='''async()=>{
  const {getGameRuntime}=await import('/game-runtime.js');
  const {probeWorldFeature}=await import('/world-feature-visibility.js');
  const w=getGameRuntime().world;
  const features=[
    {entity:'moon-mark-crescent-14',acceptedHits:['moon-mark-crescent-14','moon-mark-crescent-15']},
    {entity:'star-mark-line-0',acceptedHits:['star-mark-line-0','star-mark-line-1']},
    {entity:'sun-mark-disk',acceptedHits:['sun-mark-disk']}
  ];
  const overlayAt=(x,y)=>{const el=document.elementFromPoint(x,y);return el?.tagName==='CANVAS'?null:el?.id||el?.tagName||null};
  return await Promise.all(features.map(feature=>probeWorldFeature(w,feature,overlayAt)));
}'''


def main():
    evidence=[]
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as playwright:
        process,url=start_server(Path(temp)/'situated-route.db')
        browser=launch_browser(playwright)
        try:
            page=browser.new_page(viewport={'width':390,'height':844},has_touch=True)
            page.goto(url+'/first-words')
            skip_opening_to_tutorial(page,skip_controls=True)
            complete_tutorial(page)
            action(page,'Begin Level 1 →')
            assert all(item['visible'] for item in page.evaluate(FEATURE_PROBE))
            page.screenshot(path=str(ROOT/'artifacts'/'route-junction-phone-draft.png'))
            page.set_viewport_size({'width':1280,'height':720})
            assert all(item['visible'] for item in page.evaluate(FEATURE_PROBE))
            page.screenshot(path=str(ROOT/'artifacts'/'route-junction-desktop-draft.png'))
            page.set_viewport_size({'width':390,'height':844})
            page.get_by_role('button',name='Inspect the old route sign').click()
            assert all(item['visible'] for item in page.evaluate(FEATURE_PROBE))
            hidden=page.evaluate('''async()=>{
              const {getGameRuntime}=await import('/game-runtime.js');
              const {probeWorldFeature}=await import('/world-feature-visibility.js');
              const w=getGameRuntime().world;
              w.applyPresentation({transforms:{'notice-today':{position:[3.2,0,-16]}}});
              try{return await probeWorldFeature(w,{entity:'sun-mark-disk',acceptedHits:['sun-mark-disk']});}
              finally{w.applyPresentation({transforms:{'notice-today':{position:[6,0,-16.2]}}});}
            }''')
            assert not hidden['visible'] and hidden['reason']=='occluded',hidden
            expect(page.locator('#source-route-frame')).to_be_visible()
            for gate in ('moon','sun','star'):
                expect(page.locator(f'#markers > [data-round="1"][data-anchor="{gate}-label"]')).to_be_visible()
            page.screenshot(path=str(ROOT/'artifacts'/'route-source-inspection-draft.png'))
            assert page.evaluate('FirstWordsReview.state.clue')=='none'
            page.get_by_role('button',name='Stage old sign').click()
            expect(page.locator('#carried-source')).to_contain_text('OLD SIGN')
            assert page.evaluate('FirstWordsReview.state.clue')=='none'
            page.get_by_role('button',name="Inspect today's route notice").click()
            expect(page.locator('#source-inspection')).to_be_visible()
            expect(page.locator('#carried-source')).to_contain_text('OLD SIGN')
            page.get_by_role('button',name='Close sign inspection').click()
            page.screenshot(path=str(ROOT/'artifacts'/'route-junction-draft.png'))
            page.reload()
            expect(page.locator('#carried-source')).to_contain_text('OLD SIGN')
            page.get_by_role('button',name='Put down pending old sign').click()
            page.reload()
            expect(page.locator('#carried-source')).to_be_hidden()
            page.get_by_role('button',name="Inspect today's route notice").click()
            page.get_by_role('button',name="Stage today's notice").click()
            page.reload()
            expect(page.locator('#carried-source')).to_contain_text("TODAY'S NOTICE")
            page.get_by_role('button',name='Inspect the old route sign').click()
            page.get_by_role('button',name='Stage old sign').click()
            with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST') as saved:
                page.get_by_role('button',name='Insert and commit old sign at the message machine').click()
            attempt=saved.value.json()
            assert attempt['word_machine_state']['clue']=='moon'
            assert attempt['snapshot']['word_machine']['version']=='first-words-5'
            expect(page.locator('#slotted-source')).to_contain_text('IN MACHINE')
            assert 'NAMED' not in page.locator('#slotted-source').inner_text()
            evidence.append({'phase':'one-device-insertion','revision':attempt['revision'],
                             'input':attempt['word_machine_state']['input']})
            world_action(page,'Make first word at the message machine')
            choose(page,'Request and sign only')
            expect(page.locator('#context')).to_contain_text('Open')
            expect(page.get_by_role('button',name='Use the full input →')).to_be_visible()
            page.get_by_role('button',name='Use the full input →').click()
            open_card(page)
            page.get_by_role('button',name='Sun',exact=True).click()
            assert page.evaluate('FirstWordsReview.state.source_inference')=='none'
            page.reload()
            open_card(page)
            assert page.evaluate('FirstWordsReview.state.source_inference')=='none'
            choose(page,'Moon')
            assert page.evaluate('FirstWordsReview.state.source_inference')=='moon'
            expect(page.locator('#slotted-source')).to_contain_text('MOON NAMED')
            state=page.evaluate('FirstWordsReview.state')
            assert state['output']==['Open']
            evidence.append({'phase':'inference-committed','revision':state['moves'],
                             'output':state['output'],'source_inference':state['source_inference']})
            page.get_by_role('button',name='Run continuation',exact=True).click()
            until(page,'FirstWordsReview.state.pieces>=2',seconds=20)
            expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)
            review_button=page.get_by_role('button',name='Review generated inputs',exact=True)
            review_button.focus()
            assert review_button.evaluate('(el)=>document.activeElement===el')
            held=page.evaluate('FirstWordsReview.state')
            page.wait_for_timeout(1600)
            assert page.evaluate('FirstWordsReview.state.pieces')==held['pieces'], (held['pieces'],page.evaluate('FirstWordsReview.state.pieces'),page.evaluate('FirstWordsReview.continuation'))
            assert page.get_by_role('button',name='Resume continuation',exact=True).count(),page.locator('#actions').inner_text()
            page.get_by_role('button',name='Resume continuation',exact=True).click()
            review_button=page.get_by_role('button',name='Review generated inputs',exact=True)
            review_button.focus()
            assert review_button.evaluate('(el)=>document.activeElement===el')
            held=page.evaluate('FirstWordsReview.state')
            page.wait_for_timeout(1600)
            assert page.evaluate('FirstWordsReview.state.pieces')==held['pieces']
            review_button.click()
            expect(page.get_by_role('button',name='Previous input',exact=True)).to_be_visible()
            expect(page.locator('#context')).to_contain_text(held['output'][0])
            page.reload()
            open_card(page)
            assert page.evaluate('FirstWordsReview.state.pieces')==held['pieces']
            page.wait_for_timeout(1500)
            assert page.evaluate('FirstWordsReview.state.pieces')==held['pieces']
            expect(page.get_by_role('button',name='Resume continuation',exact=True)).to_be_visible()
            evidence.append({'phase':'paused-reload','pieces':held['pieces'],'revision':held['moves'],
                             'input':held['input'],'output':held['output']})
            page.get_by_role('button',name='Resume continuation',exact=True).click()
            until(page,'FirstWordsReview.state.pieces===4',seconds=25)
            final=page.evaluate('FirstWordsReview.state')
            assert final['context']==final['input']+final['output']
            action(page,'Speak command to gate')
            wrong=page.evaluate('FirstWordsReview.state')
            assert wrong['status']=='wrong' and wrong['output']==['Open','the','Moon','gate']
            expect(page.get_by_text('MOON SHUT',exact=False)).to_be_visible()
            page.screenshot(path=str(ROOT/'artifacts'/'route-failure-draft.png'))
            evidence.append({'phase':'world-consequence','status':wrong['status'],
                             'output':wrong['output'],'source_inference':wrong['source_inference']})
            page.get_by_role('button',name='Put the machine away').click()
            page.screenshot(path=str(ROOT/'artifacts'/'route-recovery-draft.png'))
            assert page.get_by_role('button',name="Inspect today's route notice").count(),page.locator('#markers').inner_text()
            page.get_by_role('button',name="Inspect today's route notice").click()
            page.get_by_role('button',name="Stage today's notice").click()
            page.reload()
            expect(page.locator('#carried-source')).to_contain_text("TODAY'S NOTICE")
            with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST'):
                page.get_by_role('button',name="Insert and commit today's notice at the message machine").click()
            recovered=page.evaluate('FirstWordsReview.state')
            page.screenshot(path=str(ROOT/'artifacts'/'route-retry-inserted-draft.png'))
            evidence.append({'phase':'recovery-source','pieces':recovered['pieces'],
                             'status':recovered['status'],'available_actions':recovered['available_actions']})
            assert recovered['clue']=='star' and recovered['pieces']==0,recovered
            expect(page.get_by_role('button',name='Make first word at the message machine',exact=True)).to_be_visible()
            page.evaluate('''async()=>{const {getGameRuntime}=await import('/game-runtime.js');getGameRuntime().world.applyPresentation({transition:{entity:'route-machine',from:[-3,0,-15],to:[-3,0,-15],duration:1500,finish:{}}});}''')
            assert page.evaluate('FirstWordsReview.runtime.world.animating')
            before=page.evaluate('FirstWordsReview.state.moves')
            with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST') as retry_saved:
                page.get_by_role('button',name='Make first word at the message machine',exact=True).click()
            retry=retry_saved.value.json()['word_machine_state']
            assert retry['pieces']==1 and retry['moves']==before+1,(before,retry)
            assert retry['source_inference']=='moon',retry
            page.set_viewport_size({'width':390,'height':844})
            page.reload()
            expect(page.locator('#readout-source-row')).to_be_visible()
            expect(page.locator('#readout-source-row')).to_contain_text("TODAY'S NOTICE")
            expect(page.locator('#readout-source-row')).to_contain_text('STAR NAMED')
            expect(page.locator('#slotted-source')).to_be_hidden()
            group=evaluate_state(page,{
                'required_content':[
                    {'selector':'#readout-request-row','includes':['Open the route']},
                    {'selector':'#readout-supplied','includes':['five-point lantern mark']},
                    {'selector':'#readout-source-row','includes':["TODAY'S NOTICE",'IN MACHINE','STAR NAMED']},
                    {'selector':'#readout-words','includes':['Open']},
                ],
                'associated_carriers':[{'carrier':'#learning-readout','target':'#machine-toggle','max_gap_px':140}],
            },BUDGETS)
            assert all(item['painted'] and not item['missing'] for item in group['requiredContent']),group['requiredContent']
            assert group['associatedCarriers'][0]['associated'],group['associatedCarriers']
            expect(page.get_by_role('button',name='Inspect the old route sign')).to_be_hidden()
            page.screenshot(path=str(ROOT/'artifacts'/'route-retry-prefix-phone-draft.png'))
            page.evaluate(TEXT_SCALE,2)
            page.wait_for_timeout(1200)
            enlarged=evaluate_state(page,{
                'required_content':[{'selector':'#slotted-source','includes':["TODAY'S NOTICE",'STAR NAMED']}],
                'associated_carriers':[{'carrier':'#slotted-source','target':'#machine-toggle','max_gap_px':140}],
            },BUDGETS)
            page.screenshot(path=str(ROOT/'artifacts'/'route-retry-prefix-phone-200text-draft.png'))
            assert all(item['painted'] and not item['missing'] for item in enlarged['requiredContent']),enlarged['requiredContent']
            assert enlarged['associatedCarriers'][0]['associated'],enlarged['associatedCarriers']
            open_card(page)
            expect(page.locator('#context')).to_contain_text('five-point lantern mark')
            expect(page.locator('#output')).to_contain_text('Open')
            page.get_by_role('button',name='Put the machine away').click()
            page.evaluate(TEXT_SCALE,1)
            page.wait_for_timeout(1200)
            open_card(page)
            resume=page.get_by_role('button',name='Resume continuation',exact=True)
            (resume if resume.count() else page.get_by_role('button',name='Run continuation',exact=True)).click()
            until(page,'FirstWordsReview.state.pieces===4',seconds=25)
            page.get_by_role('button',name='Put the machine away').click()
            expect(page.locator('#readout-source-row')).to_be_visible()
            expect(page.locator('#slotted-source')).to_be_hidden()
            completed=evaluate_state(page,{
                'required_content':[{'selector':'#readout-source-row','includes':["TODAY'S NOTICE",'STAR NAMED']},
                                    {'selector':'#readout-words','includes':['Open the Star gate']}],
                'associated_carriers':[{'carrier':'#learning-readout','target':'#machine-toggle','max_gap_px':140}],
            },BUDGETS)
            assert all(item['painted'] and not item['missing'] for item in completed['requiredContent']),completed['requiredContent']
            assert completed['associatedCarriers'][0]['associated'],completed['associatedCarriers']
            page.screenshot(path=str(ROOT/'artifacts'/'route-retry-complete-phone-draft.png'))
            (ROOT/'artifacts'/'situated-route-browser.json').write_text(json.dumps(evidence,indent=2),encoding='utf-8')
            print(json.dumps({'status':'passed','phases':[x['phase'] for x in evidence]}))
        finally:
            browser.close()
            stop_server(process)


if __name__=='__main__':
    main()
