import copy
import json
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path
from uuid import uuid4
from app import service, word_machine, first_words
from app.content import freeze, CONTENT, MISSION_INDEX
from app.storage import migrate, transaction

FIRST=['connect','scan-moon']+['step']*4+['send']
EXIT=['next','scan-star','predict-star']+['step']*4+['send']

class FirstWordsTests(unittest.TestCase):
    def setUp(self):
        # Run the original contract unchanged against an explicitly pinned v1.
        self.content_patch=patch.dict(MISSION_INDEX,{first_words.MISSION_ID:first_words.build_content_v1(CONTENT)})
        self.content_patch.start();self.addCleanup(self.content_patch.stop)
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
        self.assertIsNone(result['transfer_observations']['loop_correct'])
        self.assertEqual(service.command(self.path,self.learner,'submit',body),self.attempt)
        with transaction(self.path) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM evidence').fetchone()[0],1)
            self.assertEqual(db.execute('SELECT count(*) FROM rewards').fetchone()[0],1)
            with self.assertRaises(Exception):db.execute("UPDATE evidence SET result='{}'")

    def test_first_rescue_is_a_guided_success_before_normal_failure(self):
        self.action('connect')
        with self.assertRaises(service.DomainError):self.action('step')
        self.action('scan-moon')
        for move in ['step']*4+['send']:self.action(move)
        state=self.attempt['word_machine_state']
        self.assertEqual(state['status'],'success')
        self.assertFalse(state['saw_wrong'])
        self.assertEqual(state['output'],['Open','the','Moon','gate'])
        self.assertIn('Zip is behind the Moon gate.',state['input'])

    def test_first_prediction_survives_wrong_context_repair_and_reload(self):
        for move in FIRST+['next','scan-moon','predict-moon']+['step']*4+['send']:self.action(move)
        self.assertEqual(self.attempt['word_machine_state']['status'],'wrong')
        for move in ['scan-star']+['step']*4+['send']:self.action(move)
        self.attempt=service.state(self.path,self.learner)['attempt'];self.action('finish')
        result=self.attempt['assessment']['transfer_observations']
        self.assertEqual(result['context_choice'],'moon')
        self.assertFalse(result['relevant_context']);self.assertIsNone(result['loop_correct'])
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

    def test_gate_prediction_required_but_second_quiz_is_not(self):
        for move in FIRST+['next','scan-star']:self.action(move)
        with self.assertRaises(service.DomainError):self.action('step')
        self.action('predict-star')
        with self.assertRaises(service.DomainError):self.action('predict-moon')
        self.action('step')
        self.assertIn('Open',self.attempt['word_machine_state']['context'])
        response=copy.deepcopy(self.attempt['response']);response['word_machine']['moves']=[]
        with self.assertRaises(service.DomainError):service.command(self.path,self.learner,'save',{'command_id':str(uuid4()),'expected_revision':self.attempt['revision'],'attempt_id':self.attempt['id'],'response':response})

    def test_wrong_human_prediction_does_not_override_current_context(self):
        for move in FIRST+['next','scan-star','predict-moon']+['step']*4+['send']:self.action(move)
        state=self.attempt['word_machine_state']
        self.assertEqual(state['status'],'success')
        self.assertEqual(state['output'],['Open','the','Star','gate'])
        self.action('finish');result=self.attempt['assessment']['transfer_observations']
        self.assertTrue(result['relevant_context'])
        self.assertEqual(result['predicted_destination'],'moon')
        self.assertFalse(result['prediction_matches_supplied_context'])

    def test_hints_and_unrelated_notice_do_not_claim_transfer(self):
        for move in FIRST+['next','scan-parade','hint','predict-star']+['step']*4+['send','scan-star']+['step']*4+['send']:self.action(move)
        self.action('finish');result=self.attempt['assessment']['transfer_observations']
        self.assertTrue(result['hint_before_prediction']);self.assertFalse(result['relevant_context']);self.assertFalse(result['prediction_matches_supplied_context'])
        self.assertIsNone(result['loop_correct'])

    def test_active_content_uses_direct_protagonist_language(self):
        snapshot=self.attempt['snapshot']
        self.assertIn('your voice',snapshot['intro'].lower())
        self.assertNotIn('help your friend',snapshot['intro'].lower())
        self.assertNotIn('help zip',snapshot['mission']['plain_objective'].lower())
        self.assertIn('your words',snapshot['mission']['plain_objective'].lower())

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

class FirstWordsV2Tests(unittest.TestCase):
    action = FirstWordsTests.action

    def setUp(self):
        self.content_patch=patch.dict(MISSION_INDEX,{first_words.MISSION_ID:first_words.build_content_v2(CONTENT)})
        self.content_patch.start();self.addCleanup(self.content_patch.stop)
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name)/'test.db';migrate(self.path)
        _,self.learner=service.create_session(self.path)
        self.attempt=service.command(self.path,self.learner,'start',{'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':first_words.MISSION_ID})

    def relay(self,context='yard',prediction='yard',input_prediction='growing'):
        for move in ['relay-context-'+context,'relay-predict-'+prediction,'relay-input-'+input_prediction,'relay-run']:
            self.action(move)

    def test_gate_presentation_and_actions_use_pinned_v2_rule_effects(self):
        snapshot=freeze('LEARN',first_words.MISSION_ID)
        rules=snapshot['word_machine']['rules']
        # This frozen variant appends two pieces per step and needs a full
        # sentence before send. Replaying against today's v1 rules would show
        # only 'Open the' and incorrectly omit the legal send action.
        rules['actions']['step']['effects'][0]['value']=2
        rules['actions']['step']['when']=first_words.both(
            rules['actions']['step']['when'],
            {'op':'lt','left':first_words.field('pieces'),'right':3})
        view=word_machine.replay(snapshot,{'moves':['connect','scan-moon','step','step']})
        self.assertEqual(view['pieces'],4)
        self.assertEqual(view['output'],['Open','the','Moon','gate'])
        self.assertEqual(view['context'][-4:],view['output'])
        self.assertIn('send',view['available_actions'])
        self.assertNotIn('step',view['available_actions'])
        after=word_machine.replay(snapshot,{'moves':['connect','scan-moon','step','step','send']})
        self.assertEqual(after['status'],'success')
        self.assertIn('next',after['available_actions'])

    def test_new_case_required_and_choices_locked_before_feedback(self):
        self.assertEqual(self.attempt['snapshot']['word_machine']['version'],'first-words-2')
        for move in FIRST+EXIT:self.action(move)
        self.assertFalse(self.attempt['word_machine_state']['complete'])
        with self.assertRaises(service.DomainError):self.action('finish')
        self.action('relay-start');self.action('relay-context-yard')
        with self.assertRaises(service.DomainError):self.action('relay-run')
        self.action('relay-predict-loft')
        with self.assertRaises(service.DomainError):self.action('relay-context-loft')
        with self.assertRaises(service.DomainError):self.action('relay-predict-yard')
        with self.assertRaises(service.DomainError):self.action('relay-run')
        self.action('relay-input-original')
        self.assertEqual(self.attempt['word_machine_state']['relay_output'],[])
        self.attempt=service.state(self.path,self.learner)['attempt']
        self.assertEqual(self.attempt['word_machine_state']['relay_prediction'],'loft')
        self.action('relay-run')
        self.assertEqual(self.attempt['word_machine_state']['relay_output'],['Meet','at','Bell','Yard'])
        self.action('relay-finish');self.action('finish')
        result=self.attempt['assessment'];observation=result['relay_transfer_observations']
        self.assertFalse(observation['prediction_matches_supplied_context'])
        self.assertFalse(observation['input_prediction_correct'])
        self.assertTrue(observation['first_decisions_before_case_feedback'])
        self.assertNotIn('source_inference',result['transfer_observations'])
        self.assertEqual(result['mastery'],'unknown');self.assertEqual(result['independence'],'assisted')
        self.assertEqual(observation['assistance'],'unknown')

    def test_recovery_cannot_replace_first_changed_case_choices(self):
        for move in FIRST+EXIT+['relay-start']:self.action(move)
        self.relay('loft','loft','original')
        with self.assertRaises(service.DomainError):self.action('relay-finish')
        self.attempt=service.state(self.path,self.learner)['attempt']
        self.relay();self.action('relay-finish');body=self.action('finish')
        observation=self.attempt['assessment']['relay_transfer_observations']
        self.assertEqual(observation['context_choice'],'loft')
        self.assertFalse(observation['relevant_context'])
        self.assertTrue(observation['prediction_matches_supplied_context'])
        self.assertFalse(observation['input_prediction_correct'])
        self.assertEqual(observation['final_context'],'yard')
        self.assertEqual(service.command(self.path,self.learner,'submit',body),self.attempt)
        with transaction(self.path) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM evidence').fetchone()[0],1)
            with self.assertRaises(Exception):db.execute("UPDATE evidence SET result='{}'")

    def test_unobserved_changed_case_is_not_correct_and_ids_are_preserved(self):
        from app.assessment import evaluate
        snapshot=freeze('LEARN',first_words.MISSION_ID)
        old=first_words.build_content_v1(CONTENT)
        for name in ('activity','frame','binding','rubric'):
            self.assertEqual(snapshot[name]['id'],old[name]['id'])
            self.assertEqual(snapshot[name]['revision'],2)
        self.assertEqual(snapshot['family_id'],old['family_id'])
        result=evaluate(snapshot,self.attempt['response'],[])
        observation=result['relay_transfer_observations']
        self.assertIsNone(observation['relevant_context'])
        self.assertIsNone(observation['input_prediction_correct'])
        self.assertFalse(observation['first_decisions_before_case_feedback'])
        self.assertEqual(result['mastery'],'unknown')

    def test_v1_mid_command_resumes_under_v2_catalog_with_identical_result(self):
        from app.assessment import evaluate
        _,self.learner=service.create_session(self.path)
        with patch.dict(MISSION_INDEX,{first_words.MISSION_ID:first_words.build_content_v1(CONTENT)}):
            self.attempt=service.command(self.path,self.learner,'start',{'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':first_words.MISSION_ID})
            for move in FIRST+EXIT[:4]:self.action(move)
        saved_snapshot=copy.deepcopy(self.attempt['snapshot'])
        self.attempt=service.state(self.path,self.learner)['attempt']
        self.assertEqual(self.attempt['snapshot'],saved_snapshot)
        self.assertEqual(self.attempt['snapshot']['word_machine']['version'],'first-words-1')
        for move in EXIT[4:]:self.action(move)
        self.assertTrue(self.attempt['word_machine_state']['complete'])
        self.assertNotIn('relay-start',self.attempt['word_machine_state']['available_actions'])
        self.action('finish')
        self.assertNotIn('relay_transfer_observations',self.attempt['assessment'])
        with transaction(self.path) as db:
            row=db.execute('SELECT capsule,result FROM evidence WHERE attempt_id=?',(self.attempt['id'],)).fetchone()
        capsule=json.loads(row['capsule'])
        recomputed=evaluate(capsule['snapshot'],capsule['response'],capsule['assistance'])
        self.assertEqual(recomputed,json.loads(row['result']))


class FirstWordsV3Tests(unittest.TestCase):
    action = FirstWordsTests.action

    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name)/'test.db';migrate(self.path)
        _,self.learner=service.create_session(self.path)
        self.attempt=service.command(self.path,self.learner,'start',{
            'command_id':str(uuid4()),'expected_revision':0,'mode':'LEARN','mission_id':first_words.MISSION_ID})

    def test_first_word_precedes_growing_input_choice_and_gate_choice(self):
        self.assertEqual(self.attempt['snapshot']['word_machine']['version'],'first-words-3')
        for move in FIRST+['next','scan-parade']:self.action(move)
        state=self.attempt['word_machine_state']
        self.assertIn('step',state['available_actions'])
        self.assertNotIn('infer-moon',state['available_actions'])
        with self.assertRaises(service.DomainError):self.action('loop-grows')
        self.action('step')
        state=self.attempt['word_machine_state']
        self.assertEqual(state['output'],['Open'])
        self.assertIn('loop-grows',state['available_actions'])
        self.assertNotIn('step',state['available_actions'])
        self.assertNotIn('infer-moon',state['available_actions'])
        self.action('loop-same')
        self.attempt=service.state(self.path,self.learner)['attempt']
        state=self.attempt['word_machine_state']
        self.assertEqual(state['loop_prediction'],'same')
        self.assertEqual(state['context'],state['input']+['Open'])
        self.assertIn('infer-no-gate',state['available_actions'])
        with self.assertRaises(service.DomainError):self.action('loop-grows')
        self.action('infer-no-gate')
        with self.assertRaises(service.DomainError):self.action('infer-moon')
        for move in ['step']*3+['send']:self.action(move)
        state=self.attempt['word_machine_state']
        self.assertEqual(state['output'],['Open','the','Moon','gate'])
        self.assertEqual(state['status'],'wrong')
        self.action('scan-star')
        self.assertEqual(self.attempt['word_machine_state']['loop_prediction'],'same')
        for move in ['step']*4+['send']:self.action(move)
        self.action('relay-start')
        for move in ['relay-context-yard','relay-predict-yard','relay-input-growing','relay-run','relay-finish']:
            self.action(move)
        self.action('finish')
        result=self.attempt['assessment']['transfer_observations']
        self.assertEqual(result['loop_prediction'],'same')
        self.assertFalse(result['loop_correct'])
        self.assertIsNone(result['predicted_destination'])
        self.assertEqual(result['source_inference'],'no-gate')
        self.assertEqual(result['source_support'],'no-gate')
        self.assertTrue(result['inference_matches_source'])
        self.assertEqual(result['context_choice'],'parade')
        self.assertEqual(self.attempt['assessment']['mastery'],'unknown')

    def test_wrong_source_inference_stays_first_after_recovery(self):
        for move in FIRST+['next','scan-parade','step','loop-grows','infer-moon']+['step']*3+['send']:
            self.action(move)
        self.assertEqual(self.attempt['word_machine_state']['output'],['Open','the','Moon','gate'])
        self.assertEqual(self.attempt['word_machine_state']['status'],'wrong')
        for move in ['scan-star']+['step']*4+['send','relay-start','relay-context-yard',
                     'relay-predict-yard','relay-input-growing','relay-run','relay-finish']:
            self.action(move)
        self.action('finish')
        result=self.attempt['assessment']['transfer_observations']
        self.assertEqual(result['context_choice'],'parade')
        self.assertEqual(result['source_support'],'no-gate')
        self.assertEqual(result['source_inference'],'moon')
        self.assertFalse(result['inference_matches_source'])
        self.assertIsNone(result['prediction_matches_supplied_context'])
        self.assertEqual(self.attempt['word_machine_state']['output'],['Open','the','Star','gate'])
        self.assertEqual(self.attempt['assessment']['mastery'],'unknown')

    def test_existing_v2_replay_still_uses_old_action_order(self):
        old=first_words.build_content_v2(CONTENT)
        old_view=word_machine.replay(old,{'moves':FIRST+['next','scan-star','predict-star','step']})
        self.assertEqual(old_view['output'],['Open'])
        self.assertEqual(old_view['loop_prediction'],'none')
        self.assertIn('step',old_view['available_actions'])

if __name__=='__main__':unittest.main()
