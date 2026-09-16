"""Pinned rescue episode: authored next-piece model and bounded predictions."""
from copy import deepcopy
from app.game_rules import GameRulesEngine, GameRulesError
from app.word_machine import build_content as workshop_content, identity, field, eq, both, set_to

MISSION_ID = 'ai-01-first-words'
VERSION = 'first-words-1'

def either(*args):
    return {'op': 'or', 'args': list(args)}

def integer(maximum, initial=0):
    return {'type': 'integer', 'min': 0, 'max': maximum, 'initial': initial}

def enum(values, initial):
    return {'type': 'enum', 'values': values, 'initial': initial}

CORRECT = either(both(eq('round', 0), eq('clue', 'moon')), both(eq('round', 1), eq('clue', 'star')))
READY = both(eq('powered', True), eq('status', 'building'))
RULES = {
    'schemaVersion': '1', 'id': 'ai.first-words', 'version': VERSION,
    'state': {
        'round': integer(1), 'pieces': integer(4),
        'powered': {'type': 'boolean', 'initial': False},
        'status': enum(['building', 'wrong', 'success'], 'building'),
        'clue': enum(['none', 'moon', 'star', 'parade'], 'none'),
        'prediction': enum(['none', 'moon', 'star', 'sun'], 'none'),
        # Retained for immutable first-words-1 snapshot compatibility. New Level 1
        # runs demonstrate the growing input visually instead of forcing a second
        # quiz before the learner has enjoyed their first success.
        'loop_prediction': enum(['none', 'grows', 'same'], 'none'),
        'hinted': {'type': 'boolean', 'initial': False},
        'saw_wrong': {'type': 'boolean', 'initial': False},
    }, 'invariants': [], 'actions': {
        'connect': {'when': eq('powered', False), 'effects': [set_to('powered', True)], 'emits': ['voice-powered']},
        # Tutorial round: scan the obvious Moon clue first, then make words. The
        # changed-context round is the first place where a wrong hypothesis is a
        # normal part of play. This keeps Level 1 easy to enter without reducing
        # the depth available in later episodes.
        'step': {'when': both(
            READY,
            {'op': 'lt', 'left': field('pieces'), 'right': 4},
            either(
                both(eq('round', 0), eq('clue', 'moon')),
                both(eq('round', 1), {'op': 'ne', 'left': field('prediction'), 'right': 'none'}),
            ),
        ), 'effects': [{'op': 'add', 'field': 'pieces', 'value': 1}], 'emits': ['piece-appended']},
        'send': {'when': both(READY, eq('pieces', 4)), 'branches': [
            {'when': CORRECT, 'effects': [set_to('status', 'success')], 'emits': ['gate-opened']},
            {'when': {'op': 'not', 'arg': CORRECT}, 'effects': [set_to('status', 'wrong'), set_to('saw_wrong', True)], 'emits': ['wrong-gate']},
        ]},
        'rewind': {'when': both(eq('powered', True), {'op': 'ne', 'left': field('status'), 'right': 'success'}), 'effects': [set_to('pieces', 0), set_to('status', 'building')], 'emits': ['generation-rewound']},
        'next': {'when': both(eq('round', 0), eq('status', 'success')), 'effects': [set_to('round', 1), set_to('pieces', 0), set_to('clue', 'none'), set_to('status', 'building')], 'emits': ['exit-reached']},
        'hint': {'when': both(eq('round', 1), eq('hinted', False)), 'effects': [set_to('hinted', True)], 'emits': ['hint-revealed']},
    }, 'objectives': {'complete': {'when': both(eq('round', 1), eq('status', 'success'))}},
}
for clue in ('moon', 'star', 'parade'):
    RULES['actions']['scan-' + clue] = {
        'when': both(
            eq('powered', True),
            {'op': 'ne', 'left': field('status'), 'right': 'success'},
            either(both(eq('round', 0), clue == 'moon'), eq('round', 1)),
        ),
        'effects': [set_to('clue', clue), set_to('pieces', 0), set_to('status', 'building')],
        'emits': ['context-changed'],
    }
for prediction in ('moon', 'star', 'sun'):
    RULES['actions']['predict-' + prediction] = {
        'when': both(eq('round', 1), eq('prediction', 'none'), {'op': 'ne', 'left': field('clue'), 'right': 'none'}, eq('pieces', 0)),
        'effects': [set_to('prediction', prediction)], 'emits': ['prediction-recorded']
    }
# Legacy first-words-1 drafts may already contain this optional prediction. Keep
# accepting/replaying it, but new UI does not require it to continue.
for prediction in ('grows', 'same'):
    RULES['actions']['loop-' + prediction] = {
        'when': both(eq('round', 1), eq('loop_prediction', 'none'), {'op': 'ne', 'left': field('prediction'), 'right': 'none'}, eq('pieces', 0)),
        'effects': [set_to('loop_prediction', prediction)], 'emits': ['loop-prediction-recorded']
    }

CASES = [
    {'base': 'Open a gate.', 'target': 'Moon', 'notes': {'moon': 'Zip is behind the Moon gate.'}, 'prior': [{'piece': 'Sun', 'chance': 75}, {'piece': 'Moon', 'chance': 25}]},
    {'base': 'Open the route to the tower.', 'target': 'Star', 'notes': {
        'moon': 'Old route: take the Moon gate.',
        'star': 'TODAY: Moon route closed. The tower bell answers the five-point lantern mark.',
        'parade': 'The lantern parade starts at sunset.'
    }, 'prior': [{'piece': 'Moon', 'chance': 70}, {'piece': 'Star', 'chance': 30}]},
]

def build_content(template):
    item = workshop_content(template)
    for name in ('activity', 'frame', 'binding', 'rubric'):
        item[name]['id'] = identity('ai.first-words.' + name)
    item['family_id'] = identity('ai.first-words.family')
    item['frame'].update(
        name='Choose context and predict a continuation in a changed gate problem',
        coverage='Guided first success followed by one changed-context prediction before feedback',
    )
    item['rubric']['criteria'][0]['coverage'] = 'Chapter completion; transfer observations reported separately, never mastery.'
    item.update(
        title='The First Words',
        intro='The Warden has taken Zip’s voice. Help your friend speak and escape.',
        prompt='Repair Zip’s words. Give the engine the clue it needs.',
        hints=['Scan the clue that describes the route now.', 'The engine only receives the context you choose.'],
    )
    item['mission'].update(id=MISSION_ID, title='The First Words', objective='Free Zip and reach the tower', plain_objective='Help Zip speak. Open the gate.')
    item['policies']['assessment'] = VERSION
    item['validation'].update(scope='Guided rescue and changed-context exit experiment', basis='Pending exact-build checks and user review.')
    item['word_machine'] = {'version': VERSION, 'rules': deepcopy(RULES), 'cases': deepcopy(CASES)}
    return item

def replay(snapshot, value):
    config = snapshot['word_machine']
    if config['version'] != VERSION:
        raise ValueError('Unsupported rescue episode version')
    engine = GameRulesEngine(config['rules'])
    result = engine.replay(value['moves'])
    s = result.state
    case = config['cases'][s['round']]
    candidates = deepcopy(case['prior'])
    if s['clue'] in ('moon', 'star'):
        candidates = [{'piece': s['clue'].title(), 'chance': 90}, {'piece': 'Sun', 'chance': 10}]
    destination = candidates[0]['piece']
    output = ['Open', 'the', destination, 'gate'][:s['pieces']]
    context = [case['base']]
    if s['clue'] != 'none':
        context.append(case['notes'][s['clue']])
    if s['pieces'] != 2:
        candidates = [{'piece': ['Open', 'the', '', 'gate', 'End'][s['pieces']], 'chance': 100}]
    legal = []
    for action in config['rules']['actions']:
        try:
            engine.apply(s, action)
            legal.append(action)
        except GameRulesError:
            pass
    first_input = None
    for action in value['moves']:
        if action == 'next':
            first_input = 'none'
        elif first_input is not None and action.startswith('scan-'):
            first_input = action.removeprefix('scan-')
        elif first_input is not None and action.startswith('predict-'):
            break
    return {**s, 'case': case, 'context': context + output, 'input': context, 'output': output,
            'candidates': candidates, 'destination': destination, 'available_actions': legal,
            'complete': result.objectives['complete'], 'moves': len(value['moves']),
            'events': list(result.events[-1:]), 'prediction_input': first_input,
            'model_label': 'Illustrative whole-word toy · highest score chosen'}

def evaluate(snapshot, response, independence):
    s = replay(snapshot, response['word_machine'])
    prediction_destination = {'star': 'Star', 'moon': 'Moon', 'parade': 'Moon'}.get(s['prediction_input'])
    moves = response['word_machine']['moves']
    prediction_index = next((i for i, move in enumerate(moves) if move.startswith('predict-')), len(moves))
    helped = 'hint' in moves[:prediction_index]
    loop_prediction = s.get('loop_prediction', 'none')
    transfer = {
        'context_choice': s['prediction_input'],
        'relevant_context': s['prediction_input'] == 'star',
        'predicted_destination': s['prediction'],
        'prediction_matches_supplied_context': s['prediction'].title() == prediction_destination,
        'loop_prediction': loop_prediction,
        'loop_correct': None if loop_prediction == 'none' else loop_prediction == 'grows',
        'hint_before_prediction': helped,
        'scope': 'First context/gate prediction on a changed task after guided practice; not independent mastery.',
    }
    return {'outcome': 'correct' if s['complete'] else 'not_observed', 'score': 1 if s['complete'] else None,
            'correct_count': int(s['complete']), 'total_count': 1, 'criterion': 'context_practice',
            'rows': [{'run': 'Rescue Zip and exit', 'actual': 'complete' if s['complete'] else 'unfinished', 'expected': 'complete', 'correct': s['complete'], 'reason': 'Authoritative action replay opens both required gates.'}],
            'independence': independence, 'mastery': 'unknown', 'transfer_observations': transfer,
            'reasoning': {'outcome': 'not_observed', 'score': None, 'message': 'The changed-context prediction is bounded; free explanation and delayed recall are unassessed.'},
            'scope': 'Guided toy practice and one bounded transfer observation. Completion is not mastery.', 'validation': snapshot['validation']}
