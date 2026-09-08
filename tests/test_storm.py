"""Bounded teaching semantics, real storage, and no premature transfer feedback."""
import copy
import importlib.util
import itertools
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4
from app import service,storm
from app.content import freeze,presented,STORM,digest
from app.storage import migrate,transaction

SAFE={'quick':'same','changed':'wait','late':'lookup','absent':'same','unknown':'wait','new_intent':'new'}
ROUTES={1:['send','send'],2:['original','send'],3:['inspect'],4:['send','hold'],5:['inspect','hold','reconnect','inspect','send']}

class StormModelTests(unittest.TestCase):
 def test_routes_and_recovery(self):
  for level,moves in ROUTES.items():
   self.assertTrue(storm.replay(freeze('LEARN',f'storm-{level:02d}'),{'moves':moves,'policy':{}})['complete'])
  snapshot=freeze('LEARN','storm-02')
  bad=['send'];self.assertEqual(storm.replay(snapshot,{'moves':bad,'policy':{}})['effects'],2)
  s=storm.replay(snapshot,{'moves':bad+['rewind','original','send'],'policy':{}})
  self.assertTrue(s['complete']);self.assertEqual(s['rewinds'],1);self.assertEqual(s['trail'][0]['effects'],2)
 def test_unknown_does_not_become_failure(self):
  s=storm.replay(freeze('LEARN','storm-01'),{'moves':['send'],'policy':{}})
  self.assertEqual((s['effects'],s['known'],s['complete']),(1,'unknown',False))
 def test_retention_and_payload_are_real(self):
  s=storm.replay(freeze('LEARN','storm-03'),{'moves':['send'],'policy':{}})
  self.assertEqual(s['effects'],2);self.assertFalse(s['complete'])
  s=storm.replay(freeze('LEARN','storm-04'),{'moves':['send'],'policy':{}})
  self.assertEqual((s['effects'],s['known']),(1,'conflict'))
 def test_two_legitimate_changed_order_strategies(self):
  for moves in [['inspect','hold'],['approve','send']]:
   self.assertTrue(storm.replay(freeze('LEARN','storm-04'),{'moves':moves,'policy':{}})['complete'])
 def test_two_legitimate_uncertainty_strategies(self):
  for moves in [['inspect','hold','reconnect','inspect','send'],['reconnect','inspect','send']]:
   self.assertTrue(storm.replay(freeze('LEARN','storm-05'),{'moves':moves,'policy':{}})['complete'])
 def test_any_first_ticket_is_retained_and_lucky_retry_cannot_clear(self):
  s=storm.replay(freeze('LEARN','storm-01'),{'moves':['fresh','send','send'],'policy':{}})
  self.assertEqual(s['effects'],1);self.assertTrue(s['complete'])
  s=storm.replay(freeze('LEARN','storm-05'),{'moves':['send'],'policy':{}})
  self.assertEqual(s['effects'],1);self.assertFalse(s['complete']);self.assertTrue(s['unsafe'])
 def test_all_4096_wirings_safety_liveness(self):
  winners=[]
  for values in itertools.product(storm.TOOLS,repeat=6):
   policy=dict(zip(storm.SOCKETS,values));rows=storm.trials(policy)
   if all(r['correct'] for r in rows):winners.append(policy)
  self.assertIn(SAFE,winners);self.assertGreater(len(winners),1)
  for winner in winners:
   self.assertEqual(winner['late'],'lookup');self.assertEqual(winner['unknown'],'wait')
   self.assertEqual(winner['changed'],'wait');self.assertEqual(winner['new_intent'],'new')
  self.assertFalse(all(r['correct'] for r in storm.trials({k:'wait' for k in storm.SOCKETS})))
  self.assertFalse(all(r['correct'] for r in storm.trials({k:'same' for k in storm.SOCKETS})))
 def test_changed_wiring_invalidates_test(self):
  game={'moves':[{'action':'test','policy':SAFE}],'policy':SAFE|{'late':'same'}}
  self.assertFalse(storm.replay(freeze('LEARN','storm-06'),game)['complete'])
 def test_transfer_answers_and_grades_are_withheld(self):
  for n in (7,8):
   snapshot=freeze('LEARN',f'storm-{n:02d}');public=presented(snapshot)
   self.assertTrue(all('answer' not in c and 'why' not in c for c in public['storm']['incidents']))
   plan={c['id']:c['answer'] for c in snapshot['storm']['incidents']};game={'moves':[],'policy':plan}
   before=storm.replay(snapshot,game);self.assertEqual(before['rows'],[]);self.assertFalse(before['complete'])
   after=storm.replay(snapshot,game,submitted=True);self.assertTrue(after['complete'])
 def test_invalid_shapes_and_impossible_actions(self):
  for game in [{'moves':['approve'],'policy':{}},{'moves':[],'policy':{'arbitrary':'x'}},{'moves':['send']*101,'policy':{}},{'moves':[{'x':1}],'policy':{}}]:
   with self.assertRaises(ValueError):storm.replay(freeze('LEARN','storm-01'),game)
  with self.assertRaises(ValueError):storm.replay(freeze('LEARN','storm-07'),{'moves':['send'],'policy':{}})
 def test_version_identity_and_missing_evidence(self):
  self.assertEqual(len({x['family_id'] for x in STORM}),8)
  self.assertEqual(storm.evaluate(freeze('LEARN','storm-07'),{'game':{'moves':[],'policy':{}}},'unknown')['outcome'],'not_observed')

class StormPersistenceTests(unittest.TestCase):
 def setUp(self):
  self.d=tempfile.TemporaryDirectory();self.addCleanup(self.d.cleanup);self.db=Path(self.d.name)/'test.sqlite3';migrate(self.db);_,self.learner=service.create_session(self.db)
 def start(self,n):return service.command(self.db,self.learner,'start',{'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':f'storm-{n:02d}'})
 def do(self,a,action,response=None,cid=None):return service.command(self.db,self.learner,action,{'command_id':cid or str(uuid4()),'expected_revision':a['revision'],'attempt_id':a['id'],'response':response or a['response']})
 def clear(self,n):
  a=self.start(n)
  for move in ROUTES.get(n,[]):
   response=copy.deepcopy(a['response']);response['game']['moves'].append(move);a=self.do(a,'save',response)
  if n==6:
   response=copy.deepcopy(a['response']);response['game']={'moves':[{'action':'test','policy':SAFE}],'policy':SAFE};a=self.do(a,'save',response)
  if n>=7:
   response=copy.deepcopy(a['response']);response['game']['policy']={c['id']:c['answer'] for c in freeze('LEARN',f'storm-{n:02d}')['storm']['incidents']};a=self.do(a,'save',response)
  return self.do(a,'submit')
 def test_real_full_campaign_and_independence(self):
  for n in range(1,9):
   a=self.clear(n);self.assertEqual(a['assessment']['outcome'],'correct')
   self.assertEqual(a['assessment']['independence'],'assisted' if n<7 else 'unknown')
  state=service.state(self.db,self.learner);self.assertTrue(all(m['status']=='cleared' for m in state['course']['storm']))
  self.assertEqual(state['attempt']['practice_xp'],80)
  self.assertEqual(state['course']['expedition'][1]['status'],'locked')
 def test_transfer_draft_no_feedback_and_stale_write(self):
  for n in range(1,7):self.clear(n)
  a=self.start(7);response=copy.deepcopy(a['response']);response['game']['policy']={'worker':'event'};response['aid_declaration']='none'
  b=self.do(a,'save',response);self.assertEqual(b['game_state']['rows'],[]);self.assertEqual(b['assistance'],[])
  with self.assertRaises(service.DomainError):self.do(a,'save',response)
  self.assertEqual(service.state(self.db,self.learner)['attempt']['response'],response)
 def test_forged_locks_isolation_and_append_only_moves(self):
  with self.assertRaises(service.DomainError):self.start(6)
  a=self.start(1);response=copy.deepcopy(a['response']);response['game']['moves']=['send'];a=self.do(a,'save',response)
  _,other=service.create_session(self.db)
  self.assertIsNone(service.state(self.db,other)['attempt'])
  with self.assertRaises(service.DomainError):service.command(self.db,other,'save',{'command_id':str(uuid4()),'expected_revision':a['revision'],'attempt_id':a['id'],'response':a['response']})
  response=copy.deepcopy(a['response']);response['game']['moves']=[]
  with self.assertRaises(service.DomainError):self.do(a,'save',response)
 def test_lost_ack_returns_same_receipt_and_immutable_submission(self):
  a=self.start(1);response=copy.deepcopy(a['response']);response['game']['moves']=['send'];cid=str(uuid4())
  one=self.do(a,'save',response,cid);two=self.do(a,'save',response,cid);self.assertEqual(one,two)
  response=copy.deepcopy(one['response']);response['game']['moves'].append('send');a=self.do(one,'save',response);cid=str(uuid4())
  first=self.do(a,'submit',cid=cid);again=self.do(a,'submit',cid=cid)
  self.assertEqual(first,again);self.assertEqual(first['practice_xp'],10)
  with self.assertRaises(service.DomainError):self.do(first,'save')
 def test_failed_transfer_stays_locked_and_repeat_is_exposed(self):
  for n in range(1,7):self.clear(n)
  a=self.start(7);response=copy.deepcopy(a['response']);response['game']['policy']={'worker':'delivery'}
  a=self.do(a,'submit',response);self.assertEqual(a['assessment']['outcome'],'incorrect')
  self.assertEqual(service.state(self.db,self.learner)['course']['storm'][7]['status'],'locked')
  b=self.start(7);self.assertTrue(any(x['kind']=='prior_family_exposure' for x in b['assistance']))

class RepairLabTests(unittest.TestCase):
 def test_starter_fails_and_reference_repair_passes(self):
  import io,json
  spec=importlib.util.spec_from_file_location('repair_lab',Path(__file__).resolve().parents[1]/'web/retry-lab.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
  result=unittest.TextTestRunner(stream=io.StringIO()).run(unittest.defaultTestLoader.loadTestsFromTestCase(m.RepairTests))
  self.assertFalse(result.wasSuccessful());self.assertGreaterEqual(len(result.failures),8)
  m.request_key=lambda j:json.dumps([j['tenant'],j['operation'],j['intent_id']],separators=(',',':'))
  def repaired(j,h,r):
   if j['original_payload']!=j['current_payload']:return 'hold'
   if h<j['retention_hours']:return 'send'
   return {'unchecked':'lookup','committed':'confirm','absent_final':'send','unavailable':'hold'}[r]
  m.next_action=repaired
  result=unittest.TextTestRunner(stream=io.StringIO()).run(unittest.defaultTestLoader.loadTestsFromTestCase(m.RepairTests));self.assertTrue(result.wasSuccessful())
