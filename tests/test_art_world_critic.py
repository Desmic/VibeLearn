"""Art/world review cannot be dropped or certified by screenshots alone."""
import tempfile
import unittest
from pathlib import Path

from tools.build_critic_assignments import PASS_SPECS, build_assignments
from tools.critic_execution_receipt import build_receipt
from tools.ingest_critic_results import PASS_ORDER, ingest
from tools.materialize_critic_capsule import materialize
from tools.validate_critic_result import validate_result
from tools.art_world_rubric import ART_WORLD_CRITERIA


class ArtWorldCriticTests(unittest.TestCase):
    def index(self, modalities):
        return {'schema':'vibelearn.review-evidence-index.v1','candidate_sha':'a'*40,
                'technical_result':'success','receipts':[{
                    'suite':'post-ci','receipt_ref':'post-ci/receipt.json',
                    'evidence':[{'ref':m+'.json','modality':m,'candidate_sha':'a'*40} for m in modalities]}]}

    def test_missing_cold_report_or_interaction_blocks_even_with_motion_and_screens(self):
        for missing in ('cold_observer_report','interactive_trace'):
            with self.subTest(missing=missing):
                modalities={'cold_observer_report','interactive_trace','motion_video','screenshot'}-{missing}
                assignment=build_assignments(self.index(modalities))['art_world_direction']
                self.assertEqual(assignment['status'],'blocked_missing_evidence')
                self.assertEqual(assignment['missing_evidence'],[[missing]])

    def test_scope_includes_all_playable_roles_without_creator_source(self):
        assignment=build_assignments(self.index(['cold_observer_report','interactive_trace']))['art_world_direction']
        self.assertEqual(assignment['status'],'ready')
        self.assertEqual(set(assignment['suite_roles']),{'opening','tutorial','controls','chapter','post-ci'})
        self.assertNotIn('source_inspection',assignment['allowed_modalities'])
        self.assertIn('screenshot',assignment['allowed_modalities'])
        self.assertIn('motion_video',assignment['allowed_modalities'])

    def test_ingestion_and_release_order_cannot_omit_any_assignment_profile(self):
        self.assertEqual(set(PASS_ORDER),set(PASS_SPECS))
        self.assertEqual(len(PASS_ORDER),len(set(PASS_ORDER)))
        self.assertLess(PASS_ORDER.index('cold_observer'),PASS_ORDER.index('art_world_direction'))

    def bundle(self, root, assignment, used):
        for item in assignment['allowed_evidence']:
            path=root/item['ref'];path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text('Controlled contract fixture; no actual play attestation.',encoding='utf-8')
        capsule=materialize(assignment,root,root/'capsule')
        receipt=build_receipt(assignment,'test-harness','art-session',assignment['allowed_evidence'],
                              ['assignment'],capsule_id=capsule['capsule_id'])
        result={'schema':'vibelearn.critic-result.v1','candidate_sha':'a'*40,
            'assignment_id':assignment['assignment_id'],'execution_receipt_id':receipt['receipt_id'],
            'pass':'art_world_direction','verdict':'pass',
            'context_attestation':{'allowed_context_only':True,'observations_before_interpretation':True,
                                   'notes':'Controlled protocol fixture only.'},
            'observations':['Synthetic geometry observation.'],'interpretation':'Synthetic scoped conclusion.',
            'uncertainties':[],'counterexample_attempt':'Synthetic alternate angle check.',
            'blockers':[],'used_evidence':used}
        result['dimensions'] = {name: {
            'status':'pass', 'observation':'Synthetic dimension observation.',
            'evidence':list(used), 'counterexample_attempt':'Synthetic alternate view.'
        } for name in ART_WORLD_CRITERIA}
        return result,receipt

    def test_art_dimensions_cannot_be_omitted_unknown_or_use_unsupplied_evidence(self):
        assignment=build_assignments(self.index(['cold_observer_report','interactive_trace']))['art_world_direction']
        self.assertEqual(assignment['required_dimensions'], ART_WORLD_CRITERIA)
        with tempfile.TemporaryDirectory() as temp:
            for change, message in (
                ('omitted', 'every required dimension'),
                ('unknown', 'weakest dimension'),
                ('foreign', 'belong to used_evidence'),
                ('counterexample', 'counterexample attempt'),
            ):
                with self.subTest(change=change):
                    result,receipt=self.bundle(Path(temp)/change,assignment,assignment['allowed_evidence'])
                    dimension=result['dimensions']['spatial_composition']
                    if change=='omitted': del result['dimensions']['spatial_composition']
                    if change=='unknown': dimension['status']='unassessed'
                    if change=='foreign': dimension['evidence']=[{'ref':'foreign.json'}]
                    if change=='counterexample': dimension['counterexample_attempt']=''
                    with self.assertRaisesRegex(ValueError,message):
                        validate_result(assignment,result,receipt)

    def test_unassessed_art_stays_unresolved_and_findings_survive_normalization(self):
        assignment=build_assignments(self.index(['cold_observer_report','interactive_trace']))['art_world_direction']
        with tempfile.TemporaryDirectory() as temp:
            result,receipt=self.bundle(Path(temp),assignment,assignment['allowed_evidence'])
            result['dimensions']['device_composition']={
                'status':'unassessed','observation':'Phone was not inspected.','evidence':[]}
            result['verdict']='unresolved'
            normalized=validate_result(assignment,result,receipt)
            self.assertEqual(normalized['dimensions'],result['dimensions'])

    def test_screenshot_only_result_cannot_pass_a_ready_art_assignment(self):
        assignment=build_assignments(self.index(['cold_observer_report','interactive_trace','screenshot']))['art_world_direction']
        used=[e for e in assignment['allowed_evidence'] if e['modality']=='screenshot']
        with tempfile.TemporaryDirectory() as temp:
            result,receipt=self.bundle(Path(temp),assignment,used)
            with self.assertRaisesRegex(ValueError,'required evidence modality: cold_observer_report'):
                validate_result(assignment,result,receipt)
            result['used_evidence'] += [e for e in assignment['allowed_evidence'] if e['modality']=='cold_observer_report']
            with self.assertRaisesRegex(ValueError,'required evidence modality: interactive_trace'):
                validate_result(assignment,result,receipt)

    def test_complete_art_result_is_ingested_instead_of_silently_discarded(self):
        index=self.index(['cold_observer_report','interactive_trace','screenshot'])
        assignment=build_assignments(index)['art_world_direction']
        with tempfile.TemporaryDirectory() as temp:
            result,receipt=self.bundle(Path(temp),assignment,assignment['allowed_evidence'])
            workspace,normalized=ingest(index,{'art_world_direction':result},{'art_world_direction':receipt})
        self.assertIn('art_world_direction',workspace['critic_passes'])
        self.assertEqual(normalized['art_world_direction']['verdict'],'pass')
