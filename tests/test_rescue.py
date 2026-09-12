"""Investigation, executable route, fresh transfer and real persistence invariants."""
import copy
import itertools
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4
from app import rescue,service
from app.content import freeze,CONTENT,EXPEDITION,RESCUE
from app.storage import migrate

SAFE=['remember','match','reconcile','retry']
ROUTES={1:['retry'],2:['remember','retry'],3:['match'],4:['inspect','collect'],5:['inspect','pause','inspect','retry']}
def log(moves=None,draft=None):return {'moves':moves or [],'draft':draft or []}

class RescueModelTests(unittest.TestCase):
    def test_historical_ids_and_new_families_remain_distinct(self):
        self.assertEqual(CONTENT['activity']['revision'],1)
        self.assertEqual(len({m['family_id'] for m in RESCUE}),7)
        self.assertFalse({m['family_id'] for m in RESCUE}&{m['family_id'] for m in EXPEDITION})
    def test_all_five_field_routes_complete_with_one_or_no_new_effect(self):
        for level,route in ROUTES.items():
            s=rescue.replay(freeze('LEARN',f'rescue-{level:02}'),log(route))
            self.assertTrue(s['complete'],s);self.assertLessEqual(s['effects'],1)
    def test_player_cannot_assume_unknown_equals_no_effect(self):
        s=rescue.replay(freeze('LEARN','rescue-01'))
        self.assertEqual(s['effects'],1);self.assertIsNone(s['visible_effects']);self.assertEqual(s['knowledge'],'No confirmation')
    def test_new_ticket_then_retry_visibly_duplicates(self):
        s=rescue.replay(freeze('LEARN','rescue-01'),log(['new','retry']))
        self.assertTrue(s['failed']);self.assertEqual(s['visible_effects'],2)
    def test_rewind_preserves_history_but_resets_rehearsal(self):
        s=rescue.replay(freeze('LEARN','rescue-01'),log(['new','retry','rewind','retry']))
        self.assertTrue(s['complete']);self.assertEqual(s['rewinds'],1);self.assertEqual(s['moves'],4)
    def test_wrong_parcel_needs_conflict_not_another_id(self):
        for moves in [['retry'],['new','retry']]:
            self.assertTrue(rescue.replay(freeze('LEARN','rescue-03'),log(moves))['failed'])
    def test_expiry_cannot_be_fixed_by_restoring_ticket(self):
        s=rescue.replay(freeze('LEARN','rescue-04'),log(['remember','retry']))
        self.assertTrue(s['failed']);self.assertEqual(s['effects'],2)
    def test_unavailable_record_must_be_resolved_before_retry(self):
        for moves in [['retry'],['inspect','retry'],['inspect','pause','retry']]:
            self.assertTrue(rescue.replay(freeze('LEARN','rescue-05'),log(moves))['failed'])
    def test_safe_pause_does_not_earn_missing_delivery_clear(self):
        s=rescue.replay(freeze('LEARN','rescue-05'),log(['inspect','pause']))
        self.assertFalse(s['complete']);self.assertEqual(s['effects'],0)
    def test_program_is_executed_in_order_and_stops_at_send(self):
        s=freeze('LEARN','rescue-06')
        self.assertTrue(rescue.replay(s,log([{'program':SAFE}],SAFE))['complete'])
        wrong=['retry','remember','match','reconcile']
        self.assertFalse(rescue.replay(s,log([{'program':wrong}],wrong))['complete'])
    def test_multiple_valid_program_orders_support_real_construction(self):
        winners=[p for p in itertools.permutations(SAFE) if all(rescue.execute(p,c)['correct'] for c in rescue.program_cases())]
        self.assertGreater(len(winners),1);self.assertLess(len(winners),24)
    def test_edited_program_does_not_reuse_old_passing_test(self):
        s=rescue.replay(freeze('LEARN','rescue-06'),log([{'program':SAFE}],['retry']))
        self.assertFalse(s['complete'])
    def test_transfer_does_not_expose_results_before_commit(self):
        snap=freeze('LEARN','rescue-07');data=log([{'program':SAFE}],SAFE)
        self.assertEqual(rescue.replay(snap,data)['rows'],[])
        self.assertFalse(rescue.replay(snap,data)['complete'])
        self.assertTrue(rescue.replay(snap,data,reveal=True)['complete'])
    def test_transfer_cannot_run_unlimited_trial_programs_in_one_attempt(self):
        with self.assertRaises(ValueError):rescue.replay(freeze('LEARN','rescue-07'),log([{'program':SAFE}]*2,SAFE))
    def test_missing_data_is_not_a_zero_grade(self):
        r=rescue.evaluate(freeze('LEARN','rescue-07'),{},'unknown')
        self.assertEqual(r['outcome'],'not_observed');self.assertIsNone(r['score'])
    def test_arbitrary_code_and_impossible_actions_fail_closed(self):
        for v in [log(['eval']),log([{'program':['__import__']}]),log([{'look':[]}]),{'moves':[]},log([],['exec'])]:
            with self.assertRaises(ValueError):rescue.validate(v)
        with self.assertRaises(ValueError):rescue.replay(freeze('LEARN','rescue-01'),log(['pause']))
    def test_reference_repair_kit_passes_its_nine_external_service_tests(self):
        path=Path(__file__).resolve().parents[1]/'labs'/'relay-repair'
        r=subprocess.run([sys.executable,'-m','unittest','-q','test_worker'],cwd=path,env={**os.environ,'REPAIR_MODULE':'reference'},capture_output=True,text=True)
        self.assertEqual(r.returncode,0,r.stdout+r.stderr)

class RescuePersistenceTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.db=Path(self.tmp.name)/'r.sqlite3';migrate(self.db);_,self.learner=service.create_session(self.db)
    def start(self,n):return service.command(self.db,self.learner,'start',dict(command_id=str(uuid4()),expected_revision=0,mode='LEARN',mission_id=f'rescue-{n:02}'))
    def cmd(self,a,action,response=None,cid=None):return service.command(self.db,self.learner,action,dict(command_id=cid or str(uuid4()),expected_revision=a['revision'],attempt_id=a['id'],response=response or a['response']))
    def move(self,a,m,action='save'):
        r=copy.deepcopy(a['response']);r['rescue']['moves'].append(m)
        if isinstance(m,dict) and 'program'in m:r['rescue']['draft']=m['program']
        return self.cmd(a,action,r)
    def reach(self,n):
        for level in range(1,n):
            a=self.start(level)
            for m in ROUTES.get(level,[{'program':SAFE}]):a=self.move(a,m)
            self.cmd(a,'submit')
        return self.start(n)
    def test_locks_and_separate_history(self):
        with self.assertRaises(service.DomainError) as e:self.start(7)
        self.assertEqual(e.exception.code,'MISSION_LOCKED')
        a=self.move(self.start(1),'retry');self.cmd(a,'submit')
        st=service.state(self.db,self.learner)
        self.assertEqual(st['course']['rescue'][1]['status'],'unlocked')
        self.assertEqual(st['course']['expedition'][1]['status'],'locked')
    def test_feedback_seals_original_unknown_before_assisted_result(self):
        a=self.cmd(self.move(self.start(1),'retry'),'submit')
        self.assertEqual(a['assessment']['independence'],'assisted')
        self.assertEqual(a['checkpoints'][0]['assessment']['outcome'],'not_observed')
    def test_moves_cannot_be_forged_away(self):
        a=self.move(self.start(1),'new');r=copy.deepcopy(a['response']);r['rescue']['moves']=[]
        with self.assertRaises(service.DomainError):self.cmd(a,'save',r)
    def test_passing_training_cannot_claim_fresh_transfer(self):
        a=self.reach(7);self.assertEqual(a['assistance'],[])
        a=self.move(a,{'program':SAFE},'submit')
        self.assertEqual(a['assessment']['outcome'],'correct');self.assertEqual(a['assessment']['independence'],'unknown')
        self.assertEqual(a['assessment']['mastery'],'provisional')
    def test_transfer_first_commit_and_replay_exposure_are_distinct(self):
        a=self.reach(7);r=copy.deepcopy(a['response']);r['aid_declaration']='none'
        a=self.cmd(a,'save',r);a=self.move(a,{'program':SAFE},'submit')
        self.assertEqual(a['assessment']['independence'],'declared_independent')
        a=self.start(7);r=copy.deepcopy(a['response']);r['aid_declaration']='none';a=self.cmd(a,'save',r)
        a=self.move(a,{'program':SAFE},'submit')
        self.assertEqual(a['assessment']['independence'],'previously_exposed');self.assertEqual(a['reward'],0)
    def test_hint_is_recorded_before_transfer_result(self):
        a=self.cmd(self.reach(7),'hint');a=self.move(a,{'program':SAFE},'submit')
        self.assertEqual(a['assessment']['independence'],'assisted')
    def test_saved_draft_does_not_run_a_program(self):
        a=self.reach(6);r=copy.deepcopy(a['response']);r['rescue']['draft']=SAFE
        a=self.cmd(a,'save',r);self.assertEqual(a['rescue_state']['rows'],[])
        self.assertEqual(service.state(self.db,self.learner)['attempt']['response']['rescue']['draft'],SAFE)
    def test_duplicate_submission_is_one_evidence_and_one_reward(self):
        a=self.move(self.start(1),'retry');cid=str(uuid4());one=self.cmd(a,'submit',cid=cid);two=self.cmd(a,'submit',cid=cid)
        self.assertEqual(one['evidence'],two['evidence']);self.assertEqual(two['practice_xp'],10)
    def test_isolation_and_submitted_immutability(self):
        a=self.cmd(self.move(self.start(1),'retry'),'submit');_,other=service.create_session(self.db)
        self.assertIsNone(service.state(self.db,other)['attempt'])
        with self.assertRaises(service.DomainError):self.cmd(a,'save')
        with self.assertRaises(service.DomainError):service.command(self.db,other,'save',dict(command_id=str(uuid4()),expected_revision=a['revision'],attempt_id=a['id'],response=a['response']))
