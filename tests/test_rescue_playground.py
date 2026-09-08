"""Player-created practice cannot certify an official or untested route."""
import copy
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4
from app import rescue, service
from app.content import freeze
from app.storage import migrate

SAFE = ['remember', 'match', 'reconcile', 'retry']
def log(moves, draft): return {'moves': moves, 'draft': draft}

class PlaygroundTests(unittest.TestCase):
    def test_same_route_changes_outcome_without_unlocking(self):
        storm = {'program':['remember','retry'], 'elapsed':1, 'retention':24,
                 'record':'committed', 'changed':False, 'worker':True}
        snapshot = freeze('LEARN','rescue-06')
        quick = rescue.replay(snapshot, log([{'storm':storm}], storm['program']))
        late = rescue.replay(snapshot, log([{'storm':dict(storm,elapsed=25)}], storm['program']))
        self.assertTrue(quick['sandbox']['correct'])
        self.assertFalse(late['sandbox']['correct'])
        self.assertFalse(quick['complete']); self.assertEqual(quick['rows'], [])
        grade = rescue.evaluate(snapshot, {'rescue':log([{'storm':storm}],storm['program'])}, 'assisted')
        self.assertEqual(grade['outcome'],'not_observed'); self.assertIsNone(grade['score'])

    def test_ranges_and_pinned_capability_fail_closed(self):
        storm = {'program':SAFE, 'elapsed':25, 'retention':24,
                 'record':'absent', 'changed':False, 'worker':True}
        for bad in [dict(storm,elapsed=-1),dict(storm,retention=0),dict(storm,record='404'),dict(storm,changed=1)]:
            with self.assertRaises(ValueError): rescue.validate_storm(bad)
        old = freeze('LEARN','rescue-06'); old['rescue'].pop('sandbox_enabled')
        with self.assertRaises(ValueError): rescue.replay(old,log([{'storm':storm}],SAFE))
        with self.assertRaises(ValueError): rescue.replay(freeze('LEARN','rescue-07'),log([{'storm':storm}],SAFE))

    def test_recording_untested_revision_is_unknown_not_a_clear(self):
        with tempfile.TemporaryDirectory() as tmp:
            db=Path(tmp)/'practice.sqlite3';migrate(db);_,learner=service.create_session(db)
            def start(level):
                return service.command(db,learner,'start',dict(command_id=str(uuid4()),expected_revision=0,mode='LEARN',mission_id=f'rescue-{level:02}'))
            def command(attempt,action,response=None):
                return service.command(db,learner,action,dict(command_id=str(uuid4()),expected_revision=attempt['revision'],attempt_id=attempt['id'],response=response or attempt['response']))
            routes={1:['retry'],2:['remember','retry'],3:['match'],4:['inspect','collect'],5:['inspect','pause','inspect','retry']}
            for level,route in routes.items():
                a=start(level)
                for move in route:
                    r=copy.deepcopy(a['response']);r['rescue']['moves'].append(move);a=command(a,'save',r)
                command(a,'submit')
            a=start(6);r=copy.deepcopy(a['response']);r['rescue']=log([{'program':SAFE}],SAFE)
            a=command(a,'save',r);r=copy.deepcopy(a['response']);r['rescue']['draft']=['retry']
            result=command(a,'submit',r)
            self.assertEqual(result['assessment']['outcome'],'not_observed')
            self.assertIsNone(result['assessment']['score'])
            self.assertEqual(service.state(db,learner)['course']['rescue'][6]['status'],'locked')
