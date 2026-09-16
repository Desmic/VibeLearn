import copy
import json
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4
from app import service, word_machine, first_words
from app.content import freeze
from app.storage import migrate, transaction

FIRST=['connect']+['step']*4+['send','scan-moon']+['step']*4+['send']
EXIT=['next','scan-star','predict-star','loop-grows']+['step']*4+['send']

class FirstWordsTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name)/'test.db';migrate(self.path)
        _,self.learner=service.create_session(self.path)
        self.attempt=service.command(self.path,self.learner,'start',{'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':first_words.MISSION_ID})

    def action(self,move):
        response=copy.deepcopy(self.attempt['response'])
        if move!='finish':response['word_machine']['moves'].append(move)
        body={'command_id':str(uuid4()),'expected_revision':self.attempt['revision'],'attempt_id':self.attempt['id'],'response':response}
        self.attempt=service.command(self.path,self.learner,'submit' if move=='finish' else 'save',body)
        return body

    def test_rescue_exit_receipts_and_immutable_evidence(self):
        for move in FIRST:self.action(move)
        self.assertEqual(self.attempt['word_machine_state']['output'],['Open','the','Moon','gate'])
        for move in EXIT:self.action(move)
        body=self.action('finish');result=self.attempt['assessment']
        self.assertEqual(result['mastery'],'unknown');self.assertEqual(result['independence'],'assisted')
        self.assertTrue(result['transfer_observations']['relevant_context'])
        self.assertTrue(result['transfer_observations']['loop_correct'])
        self.assertEqual(service.command(self.path,self.learner,'submit',body),self.attempt)
        with transaction(self.path) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM evidence').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT count(*) FROM rewards').fetchone()[0],1)
            with self.assertRaises(Exception):db.execute("UPDATE evidence SET result='{}'")

    def test_first_rescue_can_inspect_before_making_the_plausible_mistake(self):
        for move in ['connect','scan-moon']+['step']*4+['send']:self.action(move)
        state=self.attempt['word_machine_state']
        self.assertEqual(state['status'],'success')
        self.assertFalse(state['saw_wrong'])
        self.assertEqual(state['output'],['Open','the','Moon','gate'])
        self.assertIn('Zip is behind the Moon gate.',state['input'])

    def test_first_predictions_survive_wrong_choice_repair_and_reload(self):
        for move in FIRST+['next','scan-moon','predict-moon','loop-same']+['step']*4+['send']:self.action(move)
        self.assertEqual(self.attempt['word_machine_state']['status'],'wrong')
        for move in ['scan-star']+['step']*4+['send']:self.action(move)
        self.attempt=service.state(self.path,self.learner)['attempt'];self.action('finish')
        result=self.attempt['assessment']['transfer_observations']
        self.assertEqual(result['context_choice'],'moon')
        self.assertFalse(result['relevant_context']);self.assertFalse(result['loop_correct'])
        self.assertTrue(result['prediction_matches_supplied_context'])

    def test_historical_draft_does_not_block_bellweather_level1(self):
        _,learner=service.create_session(self.path)
        legacy=service.command(self.path,learner,'start',{
            'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':'rescue-01'})
        self.assertEqual(legacy['snapshot']['mission']['id'],'rescue-01')
        level1=service.command(self.path,learner,'start',{
            'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':first_words.MISSION_ID})
        self.assertEqual(level1['snapshot']['mission']['id'],first_words.MISSION_ID)
        self.assertEqual(service.state(self.path,learner)['attempt']['id'],level1['id'])
        with transaction(self.path) as db:
            rows=db.execute("SELECT id, status, snapshot, response FROM attempts WHERE learner_id=? AND status='draft' ORDER BY rowid",(learner,)).fetchall()
            self.assertEqual(len(rows),2)
            self.assertEqual(json.loads(rows[0]['snapshot'])['mission']['id'],'rescue-01')
            self.assertEqual(json.loads(rows[0]['response']),legacy['response'])
            self.assertEqual(json.loads(rows[1]['snapshot'])['mission']['id'],first_words.MISSION_ID)
        with self.assertRaises(service.DomainError) as error:
            service.command(self.path,learner,'start',{
                'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':first_words.MISSION_ID})
        self.assertEqual(error.exception.code,'ACTIVE_ATTEMPT')

    def test_predictions_required_and_cannot_be_rewritten(self):
        for move in FIRST+['next','scan-star']:self.action(move)
        with self.assertRaises(service.DomainError):self.action('step')
        self.action('predict-star')
        with self.assertRaises(service.DomainError):self.action('predict-moon')
        with self.assertRaises(service.DomainError):self.action('step')
        self.action('loop-grows');self.action('step')
        self.assertIn('Open',self.attempt['word_machine_state']['context'])
        response=copy.deepcopy(self.attempt['response']);response['word_machine']['moves']=[]
        with self.assertRaises(service.DomainError):service.command(self.path,self.learner,'save',{'command_id':str(uuid4()),'expected_revision':self.attempt['revision'],'attempt_id':self.attempt['id'],'response':response})

    def test_hints_and_unrelated_notice_do_not_claim_transfer(self):
        for move in FIRST+['next','scan-parade','hint','predict-star','loop-grows']+['step']*4+['send','scan-star']+['step']*4+['send']:self.action(move)
        self.action('finish');result=self.attempt['assessment']['transfer_observations']
        self.assertTrue(result['hint_before_prediction']);self.assertFalse(result['relevant_context']);self.assertFalse(result['prediction_matches_supplied_context'])

    def test_old_content_and_rules_remain_pinned(self):
        old=freeze('LEARN',word_machine.MISSION_ID)
        self.assertNotEqual(old['family_id'],self.attempt['snapshot']['family_id'])
        self.assertEqual(old['competency']['id'],self.attempt['snapshot']['competency']['id'])
        self.assertEqual(word_machine.replay(old,{'moves':['step']*3})['output'],['Go','to','Library'])
        with self.assertRaises(ValueError):word_machine.replay(old,{'moves':['connect']})
        pinned=json.loads(json.dumps(freeze('LEARN',first_words.MISSION_ID)))
        self.assertTrue(word_machine.replay(pinned,{'moves':FIRST+EXIT})['complete'])

    def test_illegal_actions_receipts_stale_revision_and_learner_isolation(self):
        with self.assertRaises(service.DomainError):self.action('step')
        with self.assertRaises(service.DomainError):self.action('scan-moon')
        body=self.action('connect');self.assertEqual(service.command(self.path,self.learner,'save',body),self.attempt)
        body['command_id']=str(uuid4())
        with self.assertRaises(service.DomainError) as error:service.command(self.path,self.learner,'save',body)
        self.assertEqual(error.exception.code,'STALE_REVISION')
        _,other=service.create_session(self.path);body['expected_revision']=self.attempt['revision']
        with self.assertRaises(service.DomainError) as error:service.command(self.path,other,'save',body)
        self.assertEqual(error.exception.code,'NOT_FOUND')

if __name__=='__main__':unittest.main()