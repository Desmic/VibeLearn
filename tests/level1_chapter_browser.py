"""Active tutorial + Level-1 chapter gate: teach -> succeed -> mission -> recover."""
import hashlib
import json
import re
import tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
from tests.browser_check import start_server, stop_server
from tests.first_words_browser import until

ROOT=Path(__file__).resolve().parents[1]


def skip_opening_to_tutorial(page, *, skip_controls=False):
    expect(page.locator('#rgi-intro')).to_be_visible(timeout=20000)
    page.get_by_role('button',name='Skip opening',exact=True).click()
    expect(page.locator('#rgi-intro')).to_have_count(0,timeout=15000)
    expect(page.locator('#adventure')).to_have_attribute('data-experience-mode','tutorial',timeout=15000)
    expect(page.locator('#stage-name')).to_have_text('TUTORIAL · MOVE',timeout=15000)
    expect(page.get_by_role('button',name='Skip control practice',exact=True)).to_be_visible(timeout=15000)
    expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)
    if skip_controls:
        page.get_by_role('button',name='Skip control practice',exact=True).click()
        expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 1/4',timeout=15000)
        expect(page.get_by_role('button',name='Connect the power lead',exact=True)).to_be_visible(timeout=15000)


def action(page,name,saved_text='Saved'):
    if name=='Connect the power lead' and page.get_by_role('button',name='Skip control practice',exact=True).is_visible():
        page.get_by_role('button',name='Skip control practice',exact=True).click()
    with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST') as saved:
        page.get_by_role('button',name=name,exact=True).click()
    assert saved.value.ok,saved.value.status
    expect(page.locator('#saved')).to_have_text(saved_text,timeout=15000)
    return saved.value.json()


def choose(page,open_label,choice):
    page.get_by_role('button',name=open_label,exact=True).click();expect(page.locator('#choice')).to_be_visible()
    with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST') as saved:
        page.get_by_role('button',name=choice,exact=True).click()
    assert saved.value.ok,saved.value.status
    expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)


def world_action(page,name):
    with page.expect_response(lambda r:'/api/commands/' in r.url and r.request.method=='POST') as saved:
        page.get_by_role('button',name=name,exact=True).click()
    assert saved.value.ok,saved.value.status
    expect(page.locator('#saved')).to_have_text('Saved',timeout=15000)


def generate(page, observations=None):
    previous=page.evaluate('FirstWordsReview.state')
    for index,label in enumerate(['Make first word']+['Next word']*3):
        attempt=action(page,label)
        state=attempt['word_machine_state']
        assert state['output'][:-1]==previous['output']
        assert state['context']==state['input']+state['output']
        assert state['output'][-1]==max(previous['candidates'],key=lambda item:item['chance'])['piece']
        if observations is not None:
            observations.append({'step':index+1,'attempt_id':attempt['id'],'revision':attempt['revision'],
                'before':previous,'after':state,'visible_context':page.locator('#context').inner_text(),
                'visible_output':page.locator('#output').inner_text()})
        previous=state
    return action(page,'Speak to gate →')


def complete_relay(page, *, recover=False, reload_predictions=False, on_committed=None):
    """Commit changed-case decisions before feedback, optionally retry a stale note."""
    action(page,'Answer the signal')
    choose(page,'Read the two relay notes',re.compile('18:00' if recover else '18:20'))
    choose(page,'Predict the message destination','Bell Yard')
    # The question supplies a hypothetical prefix; the live input must not
    # answer the next-input question before the learner commits that choice.
    before_input=page.evaluate('FirstWordsReview.state')
    expect(page.locator('#context')).to_have_text(
        before_input['relay_case']['base']+' '+before_input['relay_case']['notes'][before_input['relay_context']])
    choose(page,'Predict the next input',
           'The request and selected note, unchanged' if recover else 'The request, selected note, and Meet')
    committed=page.evaluate('FirstWordsReview.state')
    assert committed['relay_output']==[]
    assert committed['relay_stage']=='choosing'
    expect(page.locator('#output .empty')).to_have_count(3)
    expect(page.locator('#actions [role="status"]')).to_have_count(0)
    expect(page.get_by_role('button',name='Run the relay',exact=True)).to_be_visible()
    if reload_predictions:
        page.reload()
        expect(page.get_by_role('button',name='Run the relay',exact=True)).to_be_visible(timeout=20000)
        restored=page.evaluate('FirstWordsReview.state')
        for key in ('relay_context','relay_prediction','relay_input_prediction','relay_stage','relay_output'):
            assert restored[key]==committed[key],(key,restored,committed)
        expect(page.locator('#output .empty')).to_have_count(3)
        expect(page.locator('#actions [role="status"]')).to_have_count(0)
        expect(page.locator('#context')).to_have_text(
            committed['relay_case']['base']+' '+committed['relay_case']['notes'][committed['relay_context']])
    if on_committed:
        on_committed(page)
    result=action(page,'Run the relay')
    assert result['word_machine_state']['relay_output']==['Meet','at','Loft' if recover else 'Yard']
    expect(page.locator('#actions [role="status"]')).to_contain_text('The selected note produced')
    if recover:
        expect(page.locator('#goal')).to_have_text('No reply from that holding area.')
        expect(page.locator('#actions [role="status"]')).to_contain_text('not your destination prediction')
        expect(page.get_by_role('button',name='Send the message to Mira',exact=True)).to_have_count(0)
        choose(page,'Read the relay notes again',re.compile('18:20'))
        choose(page,'Predict the message destination','Bell Yard')
        choose(page,'Predict the next input','The request, selected note, and Meet')
        expect(page.locator('#output .empty')).to_have_count(3)
        action(page,'Run the relay')
    delivered=action(page,'Send the message to Mira')
    assert delivered['word_machine_state']['relay_stage']=='done'
    expect(page.locator('#goal')).to_have_text('Mira answers.')
    return {'first_committed':committed,'delivered_state':delivered['word_machine_state']}


def record_commands(page, observations, contracts):
    # Actual HTTP command results, not reconstructed client-state replay.
    def record(response):
        if '/api/commands/' not in response.url or response.request.method!='POST' or not response.ok:
            return
        attempt=response.json()
        snapshot=attempt['snapshot']
        digest=hashlib.sha256(json.dumps(snapshot,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        contracts.setdefault(digest,{key:snapshot[key] for key in
            ('competency','frame','binding','rubric','assumptions','source','validation','policies','word_machine')})
        observations.append({'command':response.url.rsplit('/',1)[-1],
            'attempt_id':attempt['id'],'revision':attempt['revision'],'status':attempt['status'],
            'snapshot_sha256':digest,'response':attempt['response'],
            'state':attempt['word_machine_state'],'assessment':attempt.get('assessment')})
    page.on('response',record)


def complete_tutorial(page):
    if page.get_by_role('button',name='Skip control practice',exact=True).is_visible():
        page.get_by_role('button',name='Skip control practice',exact=True).click()
        expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 1/4')
    expect(page.get_by_role('button',name='Connect the loose power lead',exact=True)).to_be_visible()
    world_action(page,'Connect the loose power lead')
    expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 2/4')
    expect(page.get_by_role('button',name='Scan the Moon lock in the world',exact=True)).to_be_visible()
    expect(page.get_by_role('button',name='Inspect the speech engine')).to_be_hidden()
    world_action(page,'Scan the Moon lock in the world')
    expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 3/4')
    expect(page.get_by_role('button',name='Use the speech engine in the world',exact=True)).to_be_visible()
    for _ in range(4):
        world_action(page,'Use the speech engine in the world')
    expect(page.locator('#stage-name')).to_have_text('TUTORIAL · REPAIR 4/4')
    expect(page.get_by_role('button',name='Speak the completed command to the Moon gate',exact=True)).to_be_visible()
    world_action(page,'Speak the completed command to the Moon gate')
    until(page,'()=>!FirstWordsReview.runtime.world.animating')
    expect(page.locator('#stage-name')).to_have_text('TUTORIAL · COMPLETE')
    expect(page.locator('#goal')).to_have_text('You can speak again.')
    expect(page.locator('#detail')).to_contain_text('real mission')


def main():
    out=ROOT/'artifacts';out.mkdir(exist_ok=True);errors=[];checks=[];trace=[];replay=[]
    commands=[];contracts={};comparisons=[];generation=[]
    with tempfile.TemporaryDirectory() as temp,sync_playwright() as p:
        proc,url=start_server(Path(temp)/'level1-chapter.db');browser=p.chromium.launch()
        try:
            page=browser.new_page(viewport={'width':390,'height':844},has_touch=True)
            record_commands(page,commands,contracts)
            page.on('pageerror',lambda e:errors.append(str(e)));page.goto(url+'/first-words')
            skip_opening_to_tutorial(page)
            trace.append({'phase':'opening-to-tutorial','mode':page.locator('#adventure').get_attribute('data-experience-mode'),'passed':True})
            complete_tutorial(page)
            tutorial_state=page.evaluate('FirstWordsReview.state')
            replay.append({'phase':'tutorial-success','state':tutorial_state})
            page.screenshot(path=str(out/'tutorial-first-success-390.png'))
            checks.append('Separate tutorial gives one obvious action at a time, hides optional inspection, restores speech and opens the first door before Level 1 begins.')

            action(page,'Begin Level 1 →')
            expect(page.locator('#stage-name')).to_have_text('LEVEL 1 · FIRST MISSION')
            trace.append({'phase':'tutorial-to-level1','mode':page.locator('#adventure').get_attribute('data-experience-mode'),'passed':True})
            expect(page.get_by_role('button',name='Inspect the speech engine')).to_be_visible()
            choose(page,'Check route signs','Old sign · “Take the Moon gate.”')
            expect(page.locator('#context')).to_contain_text('Old route')
            replay.append({'phase':'stale-context-selected','state':page.evaluate('FirstWordsReview.state')})
            choose(page,'Predict the gate','Moon')
            expect(page.get_by_role('button',name='Predict the next input',exact=True)).to_have_count(0)
            replay.append({'phase':'moon-prediction','state':page.evaluate('FirstWordsReview.state')})
            generate(page,generation);expect(page.locator('#stage-name')).to_have_text('LEVEL 1 · RECOVER');expect(page.locator('#goal')).to_have_text('Wrong route.')
            replay.append({'phase':'stale-context-failure','state':page.evaluate('FirstWordsReview.state')})
            page.screenshot(path=str(out/'level1-transfer-wrong-390.png'))
            choose(page,'Check route signs','Current notice · “Moon route closed. The tower bell answers the five-point lantern mark.”')
            expect(page.locator('#context')).to_contain_text('five-point lantern mark')
            replay.append({'phase':'current-context-selected','state':page.evaluate('FirstWordsReview.state')})
            generate(page,generation);until(page,'()=>!FirstWordsReview.runtime.world.animating')
            expect(page.locator('#stage-name')).to_have_text('LEVEL 1 · A SIGNAL')
            replay.append({'phase':'changed-context-success','state':page.evaluate('FirstWordsReview.state')})
            expect(page.locator('#goal')).to_have_text('Someone is still out there.')
            relay=complete_relay(page,recover=True,reload_predictions=True)
            replay.append({'phase':'changed-relay-first-decisions-and-recovery',**relay})
            submitted=action(page,'Finish Level 1 →','Level saved · practice recorded')
            transfer=submitted['assessment']['relay_transfer_observations']
            assert transfer['context_choice']=='loft' and transfer['predicted_destination']=='yard'
            assert transfer['input_prediction']=='original' and transfer['input_prediction_correct'] is False
            assert transfer['prediction_matches_supplied_context'] is False
            assert transfer['first_decisions_before_case_feedback'] is True
            assert transfer['final_context']=='yard' and transfer['case_feedback_observed'] is True
            assert submitted['assessment']['mastery']=='unknown'
            expect(page.locator('#goal')).to_have_text('Mira heard you.',timeout=15000)
            expect(page.locator('#ending')).not_to_be_visible();page.screenshot(path=str(out/'level1-ending-world-390.png'))
            page.get_by_role('button',name='Look deeper into the prison',exact=True).click();expect(page.locator('#ending')).to_be_visible()
            expect(page.locator('#reflection')).to_contain_text('first context choice was stale')
            expect(page.locator('#reflection')).to_contain_text('watched each new word')
            page.get_by_role('button',name='Stay here',exact=True).click();page.reload();expect(page.locator('#goal')).to_have_text('Mira heard you.',timeout=15000)
            checks.append('Level 1 begins only after tutorial completion, permits a normal wrong context choice, preserves it, then recovers through the current route clue and ends in the prison world.')
            checks.append('Changed relay case withholds output and feedback until both predictions are committed; reload preserves those decisions, and later successful correction retains the first incorrect decisions in authoritative assessment.')

            # Identical context and viewport; intervene on prediction or hint use.
            for prediction,hint in [('Moon',False),('Star',False),('Star',True)]:
                ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True,reduced_motion='reduce')
                q=ctx.new_page();record_commands(q,commands,contracts);q.goto(url+'/first-words')
                skip_opening_to_tutorial(q);complete_tutorial(q);action(q,'Begin Level 1 →')
                choose(q,'Check route signs','Current notice · “Moon route closed. The tower bell answers the five-point lantern mark.”')
                before_hint=q.evaluate('FirstWordsReview.state')
                if hint:
                    action(q,'Ask for a hint')
                    expect(q.locator('[data-learning-hint]')).to_contain_text('engine uses the sign you selected')
                    q.reload()
                    expect(q.locator('[data-learning-hint]')).to_be_visible(timeout=15000)
                after_hint=q.evaluate('FirstWordsReview.state')
                visible_hint=q.locator('[data-learning-hint]').inner_text() if hint else None
                choose(q,'Predict the gate',prediction)
                expect(q.locator('[data-learning-hint]')).to_have_count(0)
                steps=[];generated=generate(q,steps)
                complete_relay(q)
                submitted=action(q,'Finish Level 1 →','Level saved · practice recorded')
                assessment=submitted['assessment']
                assert assessment['mastery']=='unknown'
                assert assessment['reasoning']['outcome']=='not_observed'
                assert assessment['transfer_observations']['hint_before_prediction']==hint
                assert assessment['transfer_observations']['prediction_matches_supplied_context']==(prediction=='Star')
                comparisons.append({'prediction':prediction,'hint_requested':hint,'before_hint':before_hint,
                    'after_hint':after_hint,'visible_hint':visible_hint,'generation':steps,'final_state':generated['word_machine_state'],
                    'assessment':assessment,'attempt_id':submitted['id'],'revision':submitted['revision']})
                ctx.close()
            for trial in comparisons[1:]:
                assert trial['before_hint']['input']==comparisons[0]['before_hint']['input']
                assert trial['final_state']['output']==comparisons[0]['final_state']['output']
                assert trial['assessment']['score']==comparisons[0]['assessment']['score']
            checks.append('Fixed-context browser interventions preserve generation and completion score while server assessment records incorrect prediction and hint use separately; mastery remains unknown.')

            for width in (360,430,1280):
                height=844 if width<500 else 800
                ctx=browser.new_context(viewport={'width':width,'height':height},has_touch=width<500,reduced_motion='reduce');q=ctx.new_page();q.goto(url+'/first-words')
                skip_opening_to_tutorial(q)
                complete_tutorial(q);action(q,'Begin Level 1 →')
                choose(q,'Check route signs','Current notice · “Moon route closed. The tower bell answers the five-point lantern mark.”')
                choose(q,'Predict the gate','Star');generate(q);complete_relay(q);action(q,'Finish Level 1 →','Level saved · practice recorded');expect(q.locator('#goal')).to_have_text('Mira heard you.',timeout=15000)
                assert q.evaluate('document.documentElement.scrollWidth<=innerWidth')
                q.screenshot(path=str(out/f'level1-complete-{width}-reduced.png'));ctx.close()
            checks.append('360/430 phone and 1280 desktop reduced-motion players follow the same separate tutorial and solve Level 1 without requiring camera skill.')
            assert not errors,errors
            (out/'first-words-chapter-interaction-trace.json').write_text(json.dumps({'schema':'vibelearn.interactive-trace.v1','suite':'first-words-chapter','observations':trace},indent=2))
            (out/'level1-authoritative-replay.json').write_text(json.dumps({'schema':'vibelearn.authoritative-replay.v1','suite':'first-words-chapter','observations':replay,
                'pinned_learning_contracts':contracts,'http_command_results':commands,'intermediate_generation':generation,'fixed_context_comparisons':comparisons,
                'limits':['Authored deterministic whole-word illustration, not a trained autoregressive model.',
                    'Observed accumulation and candidate selection do not prove arbitrary generated-token interventions alter later selection.',
                    'Completion can follow trial-and-error; explanation, delayed recall and independent mastery remain unassessed.'],
                'claim':'stale context can fail; changed current context can recover without human prediction controlling model output'},indent=2))
            (out/'level1-chapter-report.json').write_text(json.dumps({'result':'passed','checks':checks,'page_errors':errors,'limits':'Automated Chromium emulation is not a novice human or physical-phone acceptance study.'},indent=2))
        finally:
            browser.close();stop_server(proc)

if __name__=='__main__':main()
