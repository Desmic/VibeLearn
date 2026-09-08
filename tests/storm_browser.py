"""Real UI and adverse-path evidence for the Stormworks candidate. No fun score."""
import json
import tempfile
import time
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
from tests.browser_check import start_server,stop_server
ROOT=Path(__file__).resolve().parents[1]
SAFE={'quick':'same','changed':'wait','late':'lookup','absent':'same','unknown':'wait','new_intent':'new'}
ANSWERS={'worker':'event','timeout':'same','late':'wait','absent':'same','changed':'wait'}

def main():
 artifacts=ROOT/'artifacts';artifacts.mkdir(exist_ok=True);checks=[];errors=[]
 with tempfile.TemporaryDirectory() as d,sync_playwright() as p:
  db=Path(d)/'storm.sqlite3';process,url=start_server(db)
  browser=p.chromium.launch();ctx=browser.new_context(viewport={'width':1440,'height':960},accept_downloads=True,reduced_motion='reduce')
  ctx.tracing.start(screenshots=True,snapshots=True,sources=True);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  def shot(name):page.evaluate('scrollTo(0,0)');page.screenshot(path=str(artifacts/name),full_page=True)
  def click_action(a):
   with page.expect_response(lambda r:r.url.endswith('/api/commands/save') and r.request.method=='POST') as r:page.locator(f'[data-act="{a}"]').click()
   assert r.value.status==200
   expect(page.locator('#sync')).to_have_text('Saved')
  def next_stop(n):
   expect(page.locator('#next')).to_be_visible();page.locator('#next').click()
   expect(page.locator('.mission-title .eyebrow')).to_contain_text(f'{n} / 6' if n<7 else f'{n-6} / 2')
   expect(page.locator('#next')).to_have_count(0);expect(page.locator('#sync')).to_have_text('Saved')
  def wire(plan):
   for k,v in plan.items():page.locator(f'[data-tool="{v}"]').click();page.locator(f'[data-socket="{k}"]').click()
  def incidents(answers):
   for i,(k,v) in enumerate(answers.items()):
    page.locator(f'[data-incident="{i}"]').click();page.locator(f'[data-choice="{v}"]').click()
  try:
   start=time.monotonic();page.goto(url+'/storm');expect(page.locator('#launch')).to_be_visible()
   expect(page.locator('[data-mission]')).to_have_count(8);expect(page.locator('[data-mission="storm-06"]')).to_be_disabled();shot('storm-map.png')
   page.locator('#launch').focus();page.keyboard.press('Enter');expect(page.locator('[data-act="send"]')).to_be_visible()
   box=page.locator('[data-act="send"]').bounding_box();assert box['y']+box['height']<=960
   click_action('send');first=time.monotonic()-start
   expect(page.locator('#effects')).to_have_text('1 item');expect(page.locator('#knowledge')).to_contain_text('No confirmed outcome');shot('storm-first-action.png')
   click_action('fresh');click_action('send');expect(page.locator('#effects')).to_have_text('2 items');shot('storm-setback.png')
   click_action('rewind');click_action('send');click_action('send');expect(page.locator('#next')).to_be_visible()
   checks.append('First meaningful action visible without scrolling; unknown reply distinguished; intentional duplicate and rewind; clear saved without an extra submission form.')
   next_stop(2)
   # The server commits before the response is deliberately dropped.
   def lost(route):route.fetch();route.abort('failed')
   page.route('**/api/commands/save',lost,times=1);page.locator('[data-act="original"]').click();expect(page.locator('#retry-save')).to_be_visible()
   page.reload();expect(page.locator('#ticket')).to_have_text('order-7');expect(page.locator('.recovery')).to_have_count(0)
   port=int(url.rsplit(':',1)[1]);stop_server(process);process,_=start_server(db,port)
   page.reload();expect(page.locator('#ticket')).to_have_text('order-7');click_action('send');next_stop(3)
   click_action('inspect');next_stop(4);click_action('send');expect(page.locator('#knowledge')).to_contain_text('Different order details');shot('storm-payload-conflict.png');click_action('hold');next_stop(5)
   click_action('inspect');expect(page.locator('#knowledge')).to_contain_text('No confirmed outcome');shot('storm-unknown.png');click_action('hold');expect(page.locator('#knowledge')).to_contain_text('Pending');click_action('reconnect');click_action('inspect');expect(page.locator('#knowledge')).to_contain_text('Proven absent');click_action('send');expect(page.locator('.evidence')).to_contain_text('Guided simulation')
   checks.append('Real committed lost acknowledgement, reload and process restart preserve state; payload conflict and unavailable records taught concretely before the boss.')
   next_stop(6);wire({k:'same' for k in SAFE});page.locator('#run-trials').click();expect(page.locator('#trial-verdict')).to_contain_text('trials passed');expect(page.locator('#power')).to_be_disabled();shot('storm-engine-failed.png')
   wire(SAFE)
   page.locator('#map').click();expect(page.locator('#notice')).to_contain_text('Save this move or plan');page.reload();expect(page.locator('[data-socket="late"]')).to_contain_text('Read order records')
   expect(page.locator('#notice')).to_contain_text('recovered');page.locator('#run-trials').click();expect(page.locator('#trial-verdict')).to_contain_text('All six trials passed');shot('storm-engine-passed.png')
   page.locator('#power').click();expect(page.locator('#next')).to_contain_text('real world');shot('storm-harbour-restored.png')
   checks.append('Player-built routing plan: blind retries fail, different tools repair it; unsaved wiring survives navigation/reload; harbour payoff follows verified strategy.')
   next_stop(7);expect(page.locator('#guide')).to_be_disabled();incidents(ANSWERS|{'worker':'delivery'})
   page.locator('#save').click();expect(page.locator('#sync')).to_have_text('Saved')
   before=page.evaluate("async()=>await(await fetch('/api/state')).json()")
   assert before['attempt']['game_state']['rows']==[] and before['attempt']['assistance']==[]
   assert all('answer' not in c and 'why' not in c for c in before['attempt']['snapshot']['storm']['incidents'])
   shot('storm-real-incident.png');page.locator('#commit').click();expect(page.locator('#next')).to_contain_text('Revisit')
   failed=page.evaluate("async()=>await(await fetch('/api/state')).json()")
   assert failed['attempt']['assessment']['outcome']=='partially_correct' and failed['course']['storm'][7]['status']=='locked'
   page.locator('#next').click();expect(page.locator('#incident-facts')).to_be_visible();incidents(ANSWERS);page.locator('#aid').select_option('none')
   page.locator('#commit').click();expect(page.locator('.resolution')).to_contain_text('5 / 5 incident decisions correct');shot('storm-transfer-debrief.png')
   result=page.evaluate("async()=>await(await fetch('/api/state')).json()")
   assert result['attempt']['assessment']['independence']=='previously_exposed'
   with page.expect_download() as download:page.locator('#export').click()
   saved=artifacts/'storm-runbook-example.json';download.value.save_as(saved)
   report=json.loads(saved.read_text());assert report['unverified'] and report['production_checklist']
   assert (page.request.get(url+'/retry-lab.py')).status==200
   checks.append('Real-system incident choices have no answer/result leakage before commit; wrong plan blocks next assignment; repeat labelled previously exposed; runnable lab and honest runbook exported.')
   next_stop(8);incidents({'vm':'lookup','second':'new','tenant':'scoped'});page.locator('#commit').click();expect(page.locator('.resolution')).to_contain_text('3 / 3 incident decisions correct')
   final=page.evaluate("async()=>await(await fetch('/api/state')).json()")
   assert final['attempt']['practice_xp']==80 and all(m['status']=='cleared' for m in final['course']['storm'])
   assert final['attempt']['assessment']['independence']=='unknown'
   for width in (390,320):
    mobile=browser.new_context(viewport={'width':width,'height':844},has_touch=True,reduced_motion='reduce');mp=mobile.new_page();mp.on('pageerror',lambda e:errors.append(str(e)));mp.goto(url+'/storm');mp.locator('#launch').tap();expect(mp.locator('[data-act="send"]')).to_be_visible()
    mp.locator('[data-act="send"]').tap();expect(mp.locator('#effects')).to_have_text('1 item');mp.evaluate('scrollTo(0,0)');mp.screenshot(path=str(artifacts/f'storm-mobile-{width}.png'),full_page=True)
    assert mp.evaluate('document.documentElement.scrollWidth<=innerWidth')
    if width==390:
     previous=mp.locator('#feedback').evaluate('n=>parseFloat(getComputedStyle(n).fontSize)');mp.evaluate("document.documentElement.style.fontSize='200%'")
     assert mp.locator('#feedback').evaluate('n=>parseFloat(getComputedStyle(n).fontSize)')>=1.99*previous
     mp.screenshot(path=str(artifacts/'storm-mobile-200.png'),full_page=True)
     assert mp.evaluate('document.documentElement.scrollWidth<=innerWidth')
     mp.locator('[data-act="send"]').tap();expect(mp.locator('#next')).to_be_visible()
    other=mp.evaluate("async()=>await(await fetch('/api/state')).json()")
    assert other['learner_id']!=final['learner_id'] and other['course']['storm'][1]['status']=='locked';mobile.close()
   checks.append('Night shift changes context/retention/identity demands; default hidden XP does not gate play; isolated touch, reduced motion, 320/390px and actual 200% text checked.')
   assert errors==[],errors
   result={'result':'passed','browser':browser.version,'checks':checks,'page_errors':errors,'automated_first_action_seconds':round(first,2),'timing_limit':'Automation only, not a human onboarding measurement','review_method':'internal_tool_assisted; no independent agent or youth testing','game_score':None,'learner_implementation_skill':'not observed','course_equivalence':'not established'}
   (artifacts/'storm-browser-report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
  finally:
   shot('storm-last-screen.png');ctx.tracing.stop(path=str(artifacts/'storm-trace.zip'));browser.close();stop_server(process)

if __name__=='__main__':main()
