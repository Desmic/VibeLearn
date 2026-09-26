"""Focused live changed-case source and generated-history check."""
import tempfile
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

from tests.browser_check import launch_browser, start_server, stop_server
from tests.level1_chapter_browser import action, choose, complete_tutorial, generate, open_card, skip_opening_to_tutorial


def carry_note(page, key, label):
    if page.locator('#engine').is_visible():
        page.get_by_role('button', name='Put the machine away').click()
    marker=page.locator(f'[data-relay-source="{key}"]')
    expect(marker).to_be_visible(timeout=15000)
    marker.click()
    expect(page.locator('#source-text')).to_be_visible()
    carry_box=page.locator('#source-stage').bounding_box()
    assert carry_box and carry_box['y']>=64 and carry_box['y']+carry_box['height']<=page.viewport_size['height'],carry_box
    assert label.lower() in page.locator('#source-stage').inner_text().lower()
    page.locator('#source-stage').click()
    choose(page, f'Insert {label.lower()}')


def run_note(page, key, label, inference, history):
    carry_note(page, key, label)
    choose(page, inference)
    action(page, 'Make first relay word')
    state=page.evaluate('FirstWordsReview.state')
    assert state['relay_output']==['Meet'] and 'Meet' not in state['relay_input'][-1]
    action(page, 'Make next relay word')
    state=page.evaluate('FirstWordsReview.state')
    assert state['relay_output']==['Meet','at'] and state['relay_input'][-2:]!=['Meet','at']
    expect(page.locator('#output')).to_be_visible()
    expect(page.locator('#output')).to_contain_text('Meet')
    expect(page.locator('#output')).to_contain_text('at')
    choose(page, history)
    return action(page, 'Run the relay →')


def main():
    with tempfile.TemporaryDirectory() as temp, sync_playwright() as playwright:
        server,url=start_server(Path(temp)/'relay-history.db')
        browser=launch_browser(playwright)
        try:
            page=browser.new_page(viewport={'width':390,'height':844},has_touch=True)
            page.goto(url+'/first-words')
            skip_opening_to_tutorial(page,skip_controls=True)
            complete_tutorial(page)
            action(page,'Begin Level 1 →')
            from tests.level1_chapter_browser import supply_sign
            supply_sign(page,"today's route notice","today's notice","today's notice")
            generate(page,gate_prediction='Star')
            action(page,'Answer the signal')
            if page.locator('#engine').is_visible():page.get_by_role('button',name='Put the machine away').click()
            before_staging=page.evaluate('FirstWordsReview.state.moves')
            page.locator('[data-relay-source="loft"]').click()
            page.locator('#source-stage').click()
            expect(page.locator('#machine-toggle')).to_contain_text('18:00 MIRA NOTE')
            assert page.evaluate('FirstWordsReview.state.relay_context')=='none'
            carry_note(page,'tavi','18:30 Tavi note')
            assert page.evaluate('FirstWordsReview.state.moves')==before_staging+1
            choose(page,'No Mira location')
            action(page,'Make first relay word')
            state=page.evaluate('FirstWordsReview.state')
            assert state['relay_output']==['Meet']
            assert ' Meet at' not in page.locator('#context').inner_text()
            action(page,'Make next relay word')
            state=page.evaluate('FirstWordsReview.state')
            assert state['relay_output']==['Meet','at']
            expect(page.locator('#output')).to_be_visible()
            choose(page,'Request, note, and at only')
            committed=page.evaluate('FirstWordsReview.state')
            page.reload();open_card(page)
            restored=page.evaluate('FirstWordsReview.state')
            for key in ('relay_context','relay_inference','relay_pieces','relay_input_prediction','relay_output'):
                assert restored[key]==committed[key],key
            wrong=action(page,'Run the relay →')['word_machine_state']
            assert wrong['relay_output']==['Meet','at','Sun','Court']
            expect(page.locator('#actions [role="status"]').first).to_contain_text('did not locate Mira')
            assert 'relay-finish' not in wrong['available_actions']
            result=run_note(page,'yard','18:20 Mira note','Bell Yard','Request, note, Meet, and at')
            assert result['word_machine_state']['relay_output']==['Meet','at','Bell','Yard']
            action(page,'Send the message to Mira')
            saved=action(page,'Finish Level 1 →','Level saved · practice recorded')
            observations=saved['assessment']['relay_transfer_observations']
            assert observations['context_choice']=='tavi'
            assert observations['source_inference']=='no-mira'
            assert observations['input_prediction']=='latest'
            assert not observations['input_prediction_correct']
            assert observations['final_context']=='yard'
            desktop=browser.new_page(viewport={'width':1280,'height':720})
            desktop.goto(url+'/first-words')
            skip_opening_to_tutorial(desktop,skip_controls=True)
            complete_tutorial(desktop)
            action(desktop,'Begin Level 1 →')
            supply_sign(desktop,"today's route notice","today's notice","today's notice")
            generate(desktop,gate_prediction='Star')
            action(desktop,'Answer the signal')
            if desktop.locator('#engine').is_visible():desktop.get_by_role('button',name='Put the machine away').click()
            for key in ('loft','yard','tavi'):
                expect(desktop.locator(f'[data-relay-source="{key}"]')).to_be_visible()
            carry_note(desktop,'loft','18:00 Mira note')
            choose(desktop,'Lantern Loft')
            action(desktop,'Make first relay word')
            action(desktop,'Make next relay word')
            expect(desktop.locator('#output')).to_be_visible()
            assert desktop.evaluate('FirstWordsReview.state.relay_input')[-2:]!=['Meet','at']
            print('Relay history browser check passed: phone source inspection/no-Mira/history/reload/recovery and desktop note visibility/generated-history pause')
        finally:
            browser.close();stop_server(server)


if __name__=='__main__':main()
