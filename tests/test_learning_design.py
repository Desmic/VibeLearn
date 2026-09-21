"""Adversarial authoring/release checks, including a different learning domain."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from tools.check_learning_design import check_design_gate, design_digest, validate_design, REVIEW_QUESTIONS
from tools.check_release_gate import gate

ROOT = Path(__file__).resolve().parents[1]


def example_design():
    # Reuse only the contract's surface structure; replace the learning domain,
    # verbs, embodiment and sequence. This is a fixture, not reviewed content.
    source = json.loads((ROOT/'design/learning-design.json').read_text(encoding='utf-8'))
    source.pop('prototype_scope', None)
    base = copy.deepcopy(source['sequence'][3])
    base.update(primary_focus='mixing-bench', outcomes=['ratio'])
    base['surfaces'][0]['anchor'] = 'mixing-bench'
    steps = []
    for sid, role, decision in [('demonstrate','introduce','Mix one blue measure and two yellow.'),
                                ('mix','practice','Choose amounts for the same mixture at double volume.'),
                                ('new-order','transfer','Scale the ratio to a previously unseen order.')]:
        step = copy.deepcopy(base)
        step.update(id=sid,role=role,phase='tutorial' if role != 'transfer' else 'mission',
                    player_goal='Mix the requested color.',decision=decision,
                    feedback='The mixture changes beside the measures that produced it.')
        step['worked_example'] = dict(situation='A customer orders green paint.',
            starting_state='Reference uses one measure blue and two yellow.',
            player_action=decision, visible_result='The mixed color is compared with the reference.',
            why='Scale both amounts by the same factor.',
            misconception_response='Adding equal amounts changes the ratio; compare the resulting shades.')
        step['assessment_boundary'] = dict(claim={'introduce':'guided_observation','practice':'assisted_practice','transfer':'bounded_first_decisions'}[role],
            before_answer_feedback='Commit chosen quantities before comparing the resulting shade.',
            preserve='Keep first amounts, case and assistance.',
            model_independence='Predicted shade never changes the mixture calculated from the amounts.')
        if role == 'transfer':
            step.update(changed_situation='Different required volume and container shapes.',
                        shortcut_probe='Try fixed measure counts and container size cues.',
                        commit_before_feedback=True,evidence_limit='One transfer is not retention.')
        steps.append(step)
    source.update(id='paint-ratios',learning_promise='Preserve a mixture ratio while scaling quantities.',
                  outcomes=[dict(id='ratio',prerequisites=[],observable_capability='Scale both quantities together.',
                                 misconception='Add the same amount to both.',success_evidence='New ratio choice before mixing.')],
                  sequence=steps)
    for decision in source['research_decisions']:
        decision['steps'] = ['mix','new-order']
    return source


def approved_design_review(design):
    return dict(schema='vibelearn.learning-design-review.v1',design_sha256=design_digest(design),
                reviewer='fixture-reviewer',context_separation='Fixture isolated session',verdict='pass',blockers=[],
                findings={q:dict(verdict='pass',reason='Fixture reasoning',counterexample='Fixture attempted bypass')
                          for q in REVIEW_QUESTIONS})


class LearningDesignTests(unittest.TestCase):
    def setUp(self):
        self.design = example_design()

    def test_different_domain_validates_without_claiming_quality(self):
        result = validate_design(self.design)
        self.assertEqual(result['quality'],'unassessed')
        self.assertEqual(result['runtime_alignment'],'unassessed')

    def test_abstract_claims_without_worked_examples_are_rejected(self):
        del self.design['sequence'][1]['worked_example']
        with self.assertRaisesRegex(ValueError,'worked example'):
            validate_design(self.design)
        self.design = example_design()
        self.design['sequence'][0]['assessment_boundary']['claim'] = 'bounded_first_decisions'
        with self.assertRaisesRegex(ValueError,'claim exceeds'):
            validate_design(self.design)

    def test_missing_practice_and_answer_first_transfer_fail(self):
        self.design['sequence'].pop(1)
        with self.assertRaisesRegex(ValueError,'transfer before practice'):
            validate_design(self.design)
        self.design = example_design()
        self.design['sequence'][-1]['commit_before_feedback'] = False
        with self.assertRaisesRegex(ValueError,'precede answer feedback'):
            validate_design(self.design)

    def test_prerequisite_cycle_and_unknown_outcome_fail(self):
        self.design['outcomes'][0]['prerequisites'] = ['ratio']
        with self.assertRaisesRegex(ValueError,'prerequisites'):
            validate_design(self.design)
        self.design = example_design()
        self.design['sequence'][0]['outcomes'] = ['missing']
        with self.assertRaisesRegex(ValueError,'unknown outcome'):
            validate_design(self.design)

    def test_detached_hud_cannot_pass_by_sharing_object_name(self):
        step = self.design['sequence'][1]
        corner = copy.deepcopy(step['surfaces'][0])
        corner.update(id='corner-goal',presentation='global_overlay')
        step['surfaces'].append(corner)
        step['goal_surface'] = 'corner-goal'
        with self.assertRaisesRegex(ValueError,'detached critical presentation'):
            validate_design(self.design)

    def test_secondary_menu_and_accessible_alternative_are_allowed(self):
        step = self.design['sequence'][1]
        for id,kind,presentation in [('menu','system_overlay','global_overlay'),
                                      ('accessible','accessibility_alternative','accessible_view')]:
            surface = copy.deepcopy(step['surfaces'][0])
            surface.update(id=id,kind=kind,presentation=presentation,critical=False,anchor='screen')
            step['surfaces'].append(surface)
        validate_design(self.design)

    def test_research_must_reach_a_real_encounter_and_art_world(self):
        self.design['research_decisions'][0]['steps'] = ['not-built']
        with self.assertRaisesRegex(ValueError,'actual sequence'):
            validate_design(self.design)
        self.design = example_design()
        for decision in self.design['research_decisions']:
            decision['review_lanes'] = ['learning']
        with self.assertRaisesRegex(ValueError,'art/world'):
            validate_design(self.design)

    def test_prototype_requires_independent_current_review(self):
        with self.assertRaisesRegex(ValueError,'review required'):
            check_design_gate(self.design)
        review = approved_design_review(self.design)
        self.assertEqual(check_design_gate(self.design,review)['status'],'allowed')
        review['reviewer'] = self.design['author']
        with self.assertRaisesRegex(ValueError,'own design'):
            check_design_gate(self.design,review)
        review = approved_design_review(self.design)
        self.design['sequence'][1]['decision'] = 'Changed choice'
        with self.assertRaisesRegex(ValueError,'stale'):
            check_design_gate(self.design,review)

    def test_one_failed_lane_blocks_design(self):
        review = approved_design_review(self.design)
        review['findings']['attention_and_access']['verdict'] = 'needs_revision'
        with self.assertRaisesRegex(ValueError,'must pass'):
            check_design_gate(self.design,review)

    def test_release_policy_cannot_be_waived_by_preview_override(self):
        status = dict(schema='vibelearn.quality-status.v1',policy={'learning_design_required':True})
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(ValueError,'learning design required'):
                gate('a'*40,'preview',status,None,Path(temp),explicit_preview_override=True)
            with self.assertRaisesRegex(ValueError,'design review required'):
                gate('a'*40,'preview',status,None,Path(temp),explicit_preview_override=True,
                     learning_design=self.design)

    def test_release_requires_real_native_contract_and_step_captures(self):
        from tools.critic_execution_receipt import build_receipt
        from tools.materialize_critic_capsule import materialize
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            candidate = 'a'*40
            design = self.design
            review = approved_design_review(design)
            rules, checkpoints, events, observations = {}, {}, [], []
            for index, step in enumerate(design['sequence'],1):
                for relation in ('before','after'):
                    name = step['id']+'-'+relation
                    ref = name+'.png'
                    body = ('fixture capture '+name).encode()
                    (root/ref).write_bytes(body)
                    events.append(dict(kind='observation',ref=ref,sha256=hashlib.sha256(body).hexdigest(),modality='screenshot'))
                    checkpoints[name] = ref
                    rules[name] = dict(modality='screenshot',action='click',occurrence=index,relation=relation)
                    if relation == 'before':
                        events.append(dict(kind='input',action='click',outcome='succeeded'))
                observations.append(dict(id=step['id'],verdict='pass',observation='Fixture observed interaction',
                                         before_checkpoint=step['id']+'-before',after_checkpoint=step['id']+'-after',
                                         shortcut_attempt='Fixture attempted alternate choice'))
            evidence = [dict(ref='cold.json',modality='cold_observer_report',candidate_sha=candidate),
                        dict(ref='source.json',modality='source_inspection',candidate_sha=candidate)]
            for item in evidence:
                (root/item['ref']).write_text(json.dumps(design) if item['modality']=='source_inspection' else 'Fixture evidence',encoding='utf-8')
            assignment = dict(schema='vibelearn.critic-assignment.v1',candidate_sha=candidate,
                              learning_design_sha256=design_digest(design),status='ready',expected_output_modality='critic_report',
                              **{'pass':'intent_comparison'},allowed_evidence=evidence,forbidden_context=[],
                              required_evidence_groups=[['cold_observer_report'],['source_inspection']],
                              execution_requirements=dict(mode='native_gui',max_inputs=3,
                                  required_capabilities=['screenshot','click'],required_checkpoints=list(checkpoints),
                                  capture_rules=rules))
            assignment['assignment_id'] = 'sha256:'+hashlib.sha256(json.dumps(assignment,sort_keys=True,separators=(',',':')).encode()).hexdigest()
            execution = dict(schema='vibelearn.native-play.v1',candidate_sha=candidate,
                             assignment_id=assignment['assignment_id'],session_id='fixture',model='fixture',
                             verified_capabilities=['screenshot','click'],events=events,checkpoints=checkpoints)
            capsule = materialize(assignment,root,root/'capsule')
            receipt = build_receipt(assignment,'fixture-harness','fixture',evidence,
                                    capsule_id=capsule['capsule_id'],native_execution=execution)
            raw = dict(schema='vibelearn.critic-result.v1',candidate_sha=candidate,
                       assignment_id=assignment['assignment_id'],execution_receipt_id=receipt['receipt_id'],
                       **{'pass':'intent_comparison'},verdict='pass',
                       context_attestation=dict(allowed_context_only=True,observations_before_interpretation=True,notes='Fixture'),
                       observations=['Fixture'],interpretation='Fixture',uncertainties=[],counterexample_attempt='Fixture',
                       blockers=[],used_evidence=evidence)
            for name,value in [('assignment',assignment),('receipt',receipt),('result',raw)]:
                (root/(name+'.json')).write_text(json.dumps(value),encoding='utf-8')
            review['runtime_alignment'] = dict(candidate_sha=candidate,verdict='pass',method='native_gui_play',steps=observations,
                native_review=dict(assignment_ref='assignment.json',receipt_ref='receipt.json',result_ref='result.json',capsule_dir='capsule'))
            self.assertEqual(check_design_gate(design,review,stage='release',candidate=candidate,evidence_root=root)['status'],'allowed')
            with self.assertRaisesRegex(ValueError,'exact runtime candidate'):
                check_design_gate(design,review,stage='release',candidate='z'*40,evidence_root=root)
            review['runtime_alignment']['steps'][1]['before_checkpoint'] = observations[0]['before_checkpoint']
            with self.assertRaisesRegex(ValueError,'reused native checkpoint'):
                check_design_gate(design,review,stage='release',candidate=candidate,evidence_root=root)
            review['runtime_alignment']['steps'][1]['before_checkpoint'] = 'mix-before'
            execution['checkpoints']['mix-before'] = 'demonstrate-before.png'
            execution['checkpoints']['mix-after'] = 'demonstrate-after.png'
            for relation in ('before','after'):
                assignment['execution_requirements']['capture_rules']['mix-'+relation]['occurrence'] = 1
            payload={k:v for k,v in assignment.items() if k != 'assignment_id'}
            assignment['assignment_id']='sha256:'+hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(',',':')).encode()).hexdigest()
            execution['assignment_id']=assignment['assignment_id']
            capsule = materialize(assignment,root,root/'aliased-capsule')
            receipt = build_receipt(assignment,'fixture-harness','fixture',evidence,
                                    capsule_id=capsule['capsule_id'],native_execution=execution)
            raw.update(assignment_id=assignment['assignment_id'],execution_receipt_id=receipt['receipt_id'])
            for name,value in [('assignment',assignment),('receipt',receipt),('result',raw)]:
                (root/(name+'.json')).write_text(json.dumps(value),encoding='utf-8')
            review['runtime_alignment']['native_review']['capsule_dir']='aliased-capsule'
            with self.assertRaisesRegex(ValueError,'reused native capture'):
                check_design_gate(design,review,stage='release',candidate=candidate,evidence_root=root)
            (root/'mix-before.png').write_bytes(b'changed')
            with self.assertRaisesRegex(ValueError,'capture digest mismatch'):
                check_design_gate(design,review,stage='release',candidate=candidate,evidence_root=root)

    def test_arbitrary_file_with_a_hash_cannot_certify_native_play(self):
        review = approved_design_review(self.design)
        review['runtime_alignment'] = dict(candidate_sha='a'*40,verdict='pass',method='native_gui_play',steps=[])
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaisesRegex(ValueError,'native review'):
                check_design_gate(self.design,review,stage='release',candidate='a'*40,evidence_root=Path(temp))

    def test_scoped_prototype_review_does_not_authorize_release(self):
        self.design['prototype_scope'] = dict(steps=['demonstrate','mix'],purpose='Test one loop',not_authorized_by_design_pass='No release')
        review = approved_design_review(self.design)
        review.update(approval_stage='prototype',approved_steps=['demonstrate','mix'])
        self.assertEqual(check_design_gate(self.design,review)['allowed_steps'],['demonstrate','mix'])
        with self.assertRaisesRegex(ValueError,'scope'):
            check_design_gate(self.design,review,stage='release',candidate='a'*40)

    def test_failed_design_review_blocks_prototype(self):
        review = approved_design_review(self.design)
        review.update(verdict='needs_revision',blockers=['Ambiguous teaching sequence'])
        with self.assertRaisesRegex(ValueError,'needs revision'):
            check_design_gate(self.design,review)


if __name__ == '__main__':
    unittest.main()
