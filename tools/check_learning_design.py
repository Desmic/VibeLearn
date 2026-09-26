"""Validate learning/attention design before prototyping; never certify learning."""
import argparse
import hashlib
import json
import re
from pathlib import Path


REVIEW_QUESTIONS = (
    'progression', 'concept_fidelity', 'decision_necessity',
    'attention_and_access', 'research_application',
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def text_fields(value, fields, where):
    require(isinstance(value, dict), f'{where}: object required')
    for field in fields:
        require(isinstance(value.get(field), str) and value[field].strip(),
                f'{where}: {field} required')


def records(value, where):
    require(isinstance(value, list) and value, f'{where}: nonempty list required')
    result = {}
    for item in value:
        text_fields(item, ('id',), where)
        require(item['id'] not in result, f'{where}: duplicate id {item["id"]}')
        result[item['id']] = item
    return result


def design_digest(design):
    return hashlib.sha256(json.dumps(design, sort_keys=True,
        separators=(',', ':'), ensure_ascii=False).encode('utf-8')).hexdigest()


def validate_design(design):
    text_fields(design, ('schema', 'id', 'version', 'author', 'audience',
                         'starting_knowledge', 'learning_promise', 'scope_limits'), 'design')
    require(design['schema'] == 'vibelearn.learning-design.v1', 'unsupported learning design')
    outcomes = records(design.get('outcomes'), 'outcomes')
    for oid, outcome in outcomes.items():
        text_fields(outcome, ('observable_capability', 'misconception', 'success_evidence'), oid)
        deps = outcome.get('prerequisites')
        require(isinstance(deps, list) and all(isinstance(d, str) and d in outcomes
                and d != oid for d in deps), f'{oid}: invalid prerequisites')
    steps = records(design.get('sequence'), 'sequence')
    introduced, practiced, transferred = set(), set(), set()
    for sid, step in steps.items():
        text_fields(step, ('phase', 'role', 'player_goal', 'decision', 'feedback',
                          'recovery', 'assistance', 'completion_evidence'), sid)
        require(step['phase'] in ('entry', 'prologue', 'tutorial', 'mission', 'payoff'),
                f'{sid}: invalid phase')
        require(step['role'] in ('orientation', 'introduce', 'practice', 'transfer'),
                f'{sid}: invalid role')
        refs = step.get('outcomes')
        require(isinstance(refs, list) and all(isinstance(o, str) and o in outcomes for o in refs),
                f'{sid}: unknown outcome')
        require(bool(refs) or step['role'] == 'orientation', f'{sid}: learning outcome required')
        require(not refs or step['role'] != 'orientation', f'{sid}: orientation cannot claim learning')
        for oid in refs:
            require(set(outcomes[oid]['prerequisites']) <= practiced,
                    f'{sid}: prerequisites must be practiced before {oid}')
        if step['role'] == 'introduce':
            require(not set(refs) & introduced, f'{sid}: outcome introduced twice')
            introduced.update(refs)
        elif step['role'] in ('practice', 'transfer'):
            require(set(refs) <= introduced, f'{sid}: outcome used before introduction')
            if step['role'] == 'practice':
                practiced.update(refs)
            else:
                require(set(refs) <= practiced, f'{sid}: transfer before practice')
                text_fields(step, ('changed_situation', 'shortcut_probe', 'evidence_limit'), sid)
                require(step.get('commit_before_feedback') is True,
                        f'{sid}: transfer decisions must precede answer feedback')
                transferred.update(refs)
        if step['role'] != 'orientation':
            text_fields(step.get('worked_example'), ('situation', 'starting_state', 'player_action',
                        'visible_result', 'why', 'misconception_response'), f'{sid} worked example')
            boundary = step.get('assessment_boundary')
            text_fields(boundary, ('claim', 'before_answer_feedback', 'preserve', 'model_independence'),
                        f'{sid} assessment boundary')
            claims = {'introduce': 'guided_observation', 'practice': 'assisted_practice',
                      'transfer': 'bounded_first_decisions'}
            require(boundary['claim'] == claims[step['role']], f'{sid}: claim exceeds teaching role')
        surfaces = records(step.get('surfaces'), f'{sid} surfaces')
        focus = step.get('primary_focus')
        require(isinstance(focus, str) and focus.strip(), f'{sid}: primary_focus required')
        # Critical content belongs to a perceivable object/character or an explicit
        # inspect interaction. HTML is allowed; a detached dashboard is not.
        for uid, surface in surfaces.items():
            text_fields(surface, ('kind', 'anchor', 'presentation', 'focus_transition', 'purpose', 'reveal', 'dismiss',
                                  'offscreen_recovery', 'keyboard', 'touch', 'readability'), uid)
            require(surface['kind'] in ('world_anchor', 'object_inspection',
                    'character_dialogue', 'system_overlay', 'accessibility_alternative'),
                    f'{uid}: unsupported surface kind')
            require(type(surface.get('critical')) is bool, f'{uid}: critical must be boolean')
            require(surface['presentation'] in ('object_local', 'contextual_inspection', 'scene_focus', 'global_overlay', 'accessible_view'), f'{uid}: invalid presentation')
            if surface['critical']:
                require(surface['presentation'] in ('object_local', 'contextual_inspection', 'scene_focus'), f'{uid}: detached critical presentation')
                require(surface['kind'] not in ('system_overlay', 'accessibility_alternative'),
                        f'{uid}: primary gameplay cannot depend on a detached overlay')
                require(surface['anchor'] == focus, f'{uid}: critical information splits primary focus')
        for field in ('goal_surface', 'action_surface', 'feedback_surface'):
            ref = step.get(field)
            require(isinstance(ref, str) and ref in surfaces and surfaces[ref]['critical'],
                    f'{sid}: {field} must reference a critical surface')
    require(set(outcomes) <= transferred, 'every promised outcome needs introduced, practiced transfer')
    if 'prototype_scope' in design:
        scope = design['prototype_scope']
        text_fields(scope, ('purpose', 'not_authorized_by_design_pass'), 'prototype scope')
        refs = scope.get('steps')
        require(isinstance(refs, list) and refs and len(set(refs)) == len(refs)
                and all(s in steps for s in refs), 'prototype scope needs unique design steps')
    decisions = records(design.get('research_decisions'), 'research_decisions')
    for rid, decision in decisions.items():
        text_fields(decision, ('source_locator', 'observation', 'adaptation', 'failure_probe', 'verification', 'cost', 'exclusions', 'limit'), rid)
        lanes = decision.get('review_lanes')
        require(isinstance(lanes, list) and lanes and all(l in ('learning', 'gameplay', 'art_world', 'story') for l in lanes), f'{rid}: review lanes required')
        refs = decision.get('steps')
        require(isinstance(refs, list) and refs and all(isinstance(s, str) and s in steps for s in refs),
                f'{rid}: research must map to actual sequence steps')
    require(any('art_world' in d['review_lanes'] for d in decisions.values()), 'research needs an art/world application')
    return {'status': 'structurally_valid', 'design_sha256': design_digest(design),
            'quality': 'unassessed', 'runtime_alignment': 'unassessed'}


def check_design_gate(design, review=None, *, stage='prototype', candidate=None, evidence_root=None):
    result = validate_design(design)
    require(stage in ('structure', 'prototype', 'implementation', 'release'), 'invalid design gate stage')
    if stage == 'structure':
        return result
    require(isinstance(review, dict), 'design review required before prototype or release')
    require(review.get('schema') == 'vibelearn.learning-design-review.v1', 'unsupported design review')
    require(review.get('design_sha256') == result['design_sha256'], 'stale design review')
    text_fields(review, ('reviewer', 'context_separation'), 'review')
    require(review['reviewer'] != design['author'], 'author cannot approve own design')
    require(review.get('verdict') == 'pass' and review.get('blockers') == [],
            'learning design is unresolved or needs revision')
    findings = review.get('findings')
    require(isinstance(findings, dict), 'design review findings required')
    for question in REVIEW_QUESTIONS:
        finding = findings.get(question)
        text_fields(finding, ('reason', 'counterexample'), question)
        require(finding.get('verdict') == 'pass', f'{question}: design finding must pass')
    if 'prototype_scope' in design:
        allowed_steps = design['prototype_scope']['steps'] if stage == 'prototype' else [s['id'] for s in design['sequence']]
        require(review.get('approved_steps') == allowed_steps, 'design approval does not cover requested scope')
        required_approval = {'prototype': 'prototype', 'implementation': 'implementation',
                             'release': 'release_design'}[stage]
        require(review.get('approval_stage') == required_approval,
                f'design approval does not authorize {stage}')
    else:
        allowed_steps = [s['id'] for s in design['sequence']]
        if stage == 'implementation':
            require(review.get('approved_steps') == allowed_steps and
                    review.get('approval_stage') == 'implementation',
                    'design approval does not cover full implementation')
    if stage == 'release':
        alignment = review.get('runtime_alignment')
        require(isinstance(alignment, dict) and alignment.get('candidate_sha') == candidate
                and isinstance(candidate, str) and re.fullmatch(r'[0-9a-f]{40}', candidate),
                'design alignment must bind exact runtime candidate')
        require(alignment.get('verdict') == 'pass', 'runtime design alignment has not passed')
        require(alignment.get('method') == 'native_gui_play', 'alignment requires native GUI play')
        # Reuse the existing assignment/result/execution validation boundary.
        # An arbitrary hash-matching file is not a native play receipt.
        from tools.validate_critic_result import validate_result
        from tools.native_play_execution import validate_native_artifacts
        from tools.materialize_critic_capsule import validate_capsule
        require(evidence_root is not None, 'runtime alignment evidence root required')
        root = Path(evidence_root).resolve()
        bundle = alignment.get('native_review')
        text_fields(bundle, ('assignment_ref', 'result_ref', 'receipt_ref', 'capsule_dir'), 'native review')
        def read_record(ref):
            path = (root / ref).resolve()
            require(not Path(ref).is_absolute() and path.is_relative_to(root) and path.is_file(),
                    'missing or unsafe native review record')
            value = load(path)
            require(isinstance(value, dict), 'native review record must be an object')
            return value
        assignment = read_record(bundle['assignment_ref'])
        receipt = read_record(bundle['receipt_ref'])
        raw_result = read_record(bundle['result_ref'])
        require(assignment.get('candidate_sha') == candidate and
                assignment.get('learning_design_sha256') == result['design_sha256'],
                'native assignment must bind candidate and design digest')
        require(assignment.get('pass') == 'intent_comparison', 'alignment must follow cold observation')
        payload = {k: v for k, v in assignment.items() if k != 'assignment_id'}
        assignment_id = 'sha256:' + hashlib.sha256(json.dumps(payload, sort_keys=True,
                                separators=(',', ':')).encode('utf-8')).hexdigest()
        require(assignment.get('assignment_id') == assignment_id, 'native assignment digest mismatch')
        capsule_path = (root / bundle['capsule_dir']).resolve()
        require(not Path(bundle['capsule_dir']).is_absolute() and capsule_path.is_relative_to(root),
                'unsafe capsule path')
        capsule = validate_capsule(capsule_path)
        require(load(capsule_path / 'assignment.json') == assignment and
                capsule['capsule_id'] == receipt.get('capsule_id'), 'native capsule does not match review')
        normalized = validate_result(assignment, raw_result, receipt)
        require({'cold_observer_report', 'source_inspection'} <=
                {e['modality'] for e in normalized['used_evidence']},
                'alignment must use cold observations and exact design source')
        require(normalized['verdict'] == 'pass' and normalized.get('native_coverage'),
                'alignment needs a passing validated native critic result')
        used_source_refs = {e['ref'] for e in normalized['used_evidence'] if e['modality'] == 'source_inspection'}
        supplied_design = False
        for item in capsule['evidence']:
            if item['modality'] != 'source_inspection' or item['ref'] not in used_source_refs:
                continue
            try:
                value = load(capsule_path / item['capsule_ref'])
            except ValueError:
                continue
            supplied_design |= isinstance(value, dict) and design_digest(value) == result['design_sha256']
        require(supplied_design, 'exact learning design must be supplied and used after cold observation')
        execution = receipt['native_execution']
        validate_native_artifacts(execution, root)
        capture_rules = assignment['execution_requirements'].get('capture_rules', {})
        checkpoints = execution['checkpoints']
        observed = records(alignment.get('steps'), 'runtime alignment steps')
        require(set(observed) == {s['id'] for s in design['sequence']},
                'runtime alignment must cover every design step')
        used_checkpoints, used_captures, used_actions = set(), set(), set()
        previous_action_index = -1
        action_indices = {}
        counts = {}
        for index, event in enumerate(execution['events']):
            if event['kind'] == 'input':
                action = event['action']
                counts[action] = counts.get(action, 0) + 1
                action_indices[(action, counts[action])] = index
        for step in design['sequence']:
            sid = step['id']
            observation = observed[sid]
            text_fields(observation, ('observation', 'before_checkpoint', 'after_checkpoint', 'shortcut_attempt'), sid)
            require(observation.get('verdict') == 'pass', f'{sid}: runtime alignment failed')
            rules = []
            for relation in ('before', 'after'):
                checkpoint = observation[relation + '_checkpoint']
                require(checkpoint not in used_checkpoints and checkpoint in checkpoints,
                        f'{sid}: absent or reused native checkpoint')
                used_checkpoints.add(checkpoint)
                capture = checkpoints[checkpoint]
                require(capture not in used_captures, f'{sid}: reused native capture')
                used_captures.add(capture)
                rule = capture_rules.get(checkpoint, {})
                require(rule.get('modality') == 'screenshot' and rule.get('relation') == relation,
                        f'{sid}: needs action-relative visual capture')
                rules.append(rule)
            require((rules[0]['action'], rules[0]['occurrence']) ==
                    (rules[1]['action'], rules[1]['occurrence']),
                    f'{sid}: before/after captures must surround the same action')
            action_key = (rules[0]['action'], rules[0]['occurrence'])
            require(action_key not in used_actions, f'{sid}: reused native action')
            used_actions.add(action_key)
            action_index = action_indices[action_key]
            require(action_index > previous_action_index, f'{sid}: native steps are out of design order')
            previous_action_index = action_index
    return {**result, 'status': 'allowed', 'stage': stage,
            'quality': 'reviewed_design', 'allowed_steps': allowed_steps, 'runtime_alignment': 'reviewed' if stage == 'release' else 'unassessed'}


def load(path):
    try:
        return json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError, ValueError) as exc:
        raise ValueError(f'cannot read design input: {exc}') from exc


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--design', type=Path, default=Path('design/learning-design.json'))
    parser.add_argument('--review', type=Path)
    parser.add_argument('--stage', choices=('structure', 'prototype', 'implementation', 'release'), default='prototype')
    parser.add_argument('--candidate')
    parser.add_argument('--evidence-root', type=Path)
    args = parser.parse_args(argv)
    try:
        result = check_design_gate(load(args.design), load(args.review) if args.review else None,
                                   stage=args.stage, candidate=args.candidate, evidence_root=args.evidence_root)
    except ValueError as exc:
        print(json.dumps({'status': 'blocked', 'error': str(exc)}))
        return 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
