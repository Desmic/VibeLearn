"""Real persistence plus executable game-model invariants; never a fun score."""
import copy
import itertools
import tempfile
import unittest
from pathlib import Path
from uuid import uuid4
from app import service
from app.content import CONTENT, CAMPAIGN, EXPEDITION, freeze, digest
from app.expedition import replay, policy_cases, evaluate_game, validate_game, POLICY_OPTIONS
from app.storage import migrate, transaction

SAFE = {"identity": "remember", "payload": "reject", "expiry": "check", "unknown": "pause"}
ROUTES = {1: ["send", "retry", "collect"], 2: ["send", "restart", "restore", "retry", "collect"], 3: ["send", "wait", "inspect", "collect"], 5: ["send", "wait", "inspect", "retry", "collect"]}


class ExpeditionModelTests(unittest.TestCase):
    def test_five_distinct_families_do_not_rewrite_historical_content(self):
        self.assertEqual(len(EXPEDITION), 5)
        self.assertEqual(len(CAMPAIGN), 4)
        self.assertEqual(CONTENT["activity"]["revision"], 1)
        self.assertEqual(CAMPAIGN[0]["activity"]["revision"], 2)
        self.assertFalse({x['family_id'] for x in CAMPAIGN} & {x['family_id'] for x in EXPEDITION})
        self.assertEqual(len({x['frame']['id'] for x in EXPEDITION}), 5)

    def test_direct_routes_collect_exactly_one_gear(self):
        for level, route in ROUTES.items():
            with self.subTest(level=level):
                result = replay(freeze('LEARN', f'expedition-{level:02d}'), {'moves': route, 'policy': {}})
                self.assertTrue(result['complete']); self.assertEqual(result['parts'], 1)

    def test_world_truth_is_not_courier_knowledge(self):
        state = replay(freeze('LEARN', 'expedition-01'), {'moves': ['send'], 'policy': {}})
        self.assertEqual(state['parts'], 1); self.assertEqual(state['known'], 'unknown')
        self.assertNotIn('collect', state['available'])

    def test_new_identity_duplicates_and_rewind_retains_history(self):
        snapshot = freeze('LEARN', 'expedition-02')
        failed = ['send', 'restart', 'retry']
        self.assertEqual(replay(snapshot, {'moves': failed, 'policy': {}})['parts'], 2)
        result = replay(snapshot, {'moves': failed + ['rewind'] + ROUTES[2], 'policy': {}})
        self.assertTrue(result['complete']); self.assertEqual(result['rewinds'], 1)
        self.assertEqual(result['trail'][2]['parts'], 2)

    def test_expired_same_ticket_is_not_infinite_deduplication(self):
        result = replay(freeze('LEARN', 'expedition-03'), {'moves': ['send', 'wait', 'retry'], 'policy': {}})
        self.assertEqual(result['parts'], 2); self.assertFalse(result['complete'])
        self.assertEqual(result['available'], ['rewind'])

    def test_remix_changes_memory_and_missing_request_not_just_story(self):
        original = replay(freeze('LEARN', 'expedition-03'), {'moves': ['send', 'wait', 'inspect'], 'policy': {}})
        remix = replay(freeze('LEARN', 'expedition-05'), {'moves': ['send', 'wait', 'inspect'], 'policy': {}})
        self.assertEqual((original['parts'], original['known'], original['retention']), (1, 'confirmed', 24))
        self.assertEqual((remix['parts'], remix['known'], remix['retention']), (0, 'absent', 2))
        self.assertIn('collect', original['available']); self.assertNotIn('collect', remix['available'])
        self.assertIn('retry', remix['available'])

    def test_unknown_moves_and_impossible_sequences_fail_closed(self):
        for moves in [['collect'], ['send', 'collect'], ['send', 'restart'], ['explode']]:
            with self.subTest(moves=moves), self.assertRaises(ValueError):
                replay(freeze('LEARN', 'expedition-01'), {'moves': moves, 'policy': {}})
        with self.assertRaises(ValueError):
            validate_game({'moves': ['send'] * 81, 'policy': {}})

    def test_only_safe_policy_passes_exhaustive_option_matrix(self):
        keys = list(POLICY_OPTIONS)
        winners = []
        for values in itertools.product(*(POLICY_OPTIONS[k] for k in keys)):
            policy = dict(zip(keys, values))
            if all(row['correct'] for row in policy_cases(policy)):
                winners.append(policy)
        self.assertEqual(winners, [SAFE])

    def test_retry_forever_fails_even_with_correct_legacy_counts(self):
        game = {'moves': [{'action': 'test', 'policy': SAFE | {'expiry': 'repeat'}}], 'policy': SAFE | {'expiry': 'repeat'}}
        result = evaluate_game(freeze('LEARN', 'expedition-04'), {'prediction': '2,1,2', 'diagnosis': 'Just retry forever.', 'game': game}, 'assisted')
        self.assertNotEqual(result['outcome'], 'correct'); self.assertLess(result['score'], 1)
        self.assertFalse(next(row for row in result['rows'] if row['run'] == 'At the 24-hour boundary')['correct'])

    def test_changed_policy_must_be_tested_again(self):
        game = {'moves': [{'action': 'test', 'policy': SAFE}], 'policy': SAFE | {'unknown': 'repeat'}}
        state = replay(freeze('LEARN', 'expedition-04'), game)
        self.assertFalse(state['tested']); self.assertFalse(state['complete'])

    def test_missing_evidence_is_not_failure(self):
        result = evaluate_game(freeze('LEARN', 'expedition-01'), {}, 'unknown')
        self.assertEqual(result['outcome'], 'not_observed'); self.assertIsNone(result['score'])


class ExpeditionPersistenceTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(); self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'expedition.sqlite3'; migrate(self.path)
        _, self.learner = service.create_session(self.path)

    def start(self, level):
        return service.command(self.path, self.learner, 'start', {'command_id': str(uuid4()), 'expected_revision': 0, 'mode': 'LEARN', 'mission_id': f'expedition-{level:02d}'})

    def command(self, attempt, action, response=None, command_id=None):
        return service.command(self.path, self.learner, action, {'command_id': command_id or str(uuid4()), 'expected_revision': attempt['revision'], 'attempt_id': attempt['id'], 'response': response or attempt['response']})

    def move(self, attempt, move):
        response = copy.deepcopy(attempt['response']); response['game']['moves'].append(move)
        if isinstance(move, dict): response['game']['policy'] = copy.deepcopy(move['policy'])
        return self.command(attempt, 'save', response)

    def clear(self, level):
        attempt = self.start(level)
        for move in ROUTES.get(level, [{'action': 'test', 'policy': SAFE}]): attempt = self.move(attempt, move)
        return self.command(attempt, 'submit')

    def test_real_sequential_progress_and_server_locks(self):
        with self.assertRaises(service.DomainError) as error: self.start(4)
        self.assertEqual(error.exception.code, 'MISSION_LOCKED')
        for level in range(1, 6):
            self.assertEqual(self.clear(level)['assessment']['outcome'], 'correct')
        state = service.state(self.path, self.learner)
        self.assertTrue(all(m['status'] == 'cleared' for m in state['course']['expedition']))
        self.assertEqual([m['status'] for m in state['course']['campaign']], ['unlocked', 'locked', 'locked', 'locked'])

    def test_resume_and_feedback_semantics_are_persisted(self):
        attempt = self.start(1)
        self.assertEqual(attempt['response']['aid_declaration'], 'unknown')
        attempt = self.move(attempt, 'send')
        restored = service.state(self.path, self.learner)['attempt']
        self.assertEqual(restored['game_state'], attempt['game_state'])
        self.assertEqual(restored['checkpoints'][0]['response']['game']['moves'], [])
        for move in ['retry', 'collect']: attempt = self.move(attempt, move)
        result = self.command(attempt, 'submit')
        self.assertEqual(result['assessment']['independence'], 'assisted')
        self.assertEqual(result['assessment']['mastery'], 'provisional')
        self.assertEqual(result['checkpoints'][0]['assessment']['outcome'], 'not_observed')

    def test_saved_moves_cannot_be_erased_even_by_a_forged_request(self):
        attempt = self.move(self.start(1), 'send')
        response = copy.deepcopy(attempt['response']); response['game']['moves'] = []
        with self.assertRaises(service.DomainError): self.command(attempt, 'save', response)
        self.assertEqual(service.state(self.path, self.learner)['attempt']['game_state']['parts'], 1)

    def test_lost_ack_replays_one_move_and_submits_one_reward(self):
        attempt = self.start(1)
        response = copy.deepcopy(attempt['response']); response['game']['moves'].append('send')
        command_id = str(uuid4())
        saved = self.command(attempt, 'save', response, command_id)
        replayed = self.command(attempt, 'save', response, command_id)
        self.assertEqual(saved, replayed)
        for move in ['retry', 'collect']: saved = self.move(saved, move)
        command_id = str(uuid4()); first = self.command(saved, 'submit', command_id=command_id)
        second = self.command(saved, 'submit', command_id=command_id)
        self.assertEqual(first['evidence'], second['evidence']); self.assertEqual(first['practice_xp'], 10)

    def test_wrong_result_can_earn_practice_xp_but_never_unlocks(self):
        result = self.command(self.move(self.start(1), 'send'), 'submit')
        self.assertEqual(result['assessment']['outcome'], 'incorrect')
        self.assertEqual(result['reward'], 10)
        self.assertEqual(service.state(self.path, self.learner)['course']['expedition'][1]['status'], 'locked')

    def test_second_learner_cannot_read_or_change_game(self):
        attempt = self.move(self.start(1), 'send'); _, other = service.create_session(self.path)
        self.assertIsNone(service.state(self.path, other)['attempt'])
        with self.assertRaises(service.DomainError) as error:
            service.command(self.path, other, 'save', {'command_id': str(uuid4()), 'expected_revision': attempt['revision'], 'attempt_id': attempt['id'], 'response': attempt['response']})
        self.assertEqual(error.exception.status, 404)
