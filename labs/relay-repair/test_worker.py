"""Disposable service simulation. No network, real exports, payments or credentials."""
import importlib
import os
import unittest
from contracts import Job, Resolution
recover = importlib.import_module(os.environ.get('REPAIR_MODULE', 'worker')).recover

class SimulatedExports:
    def __init__(self, committed=True, retained=True, unknown=False, timeout=False):
        self.effects = int(committed); self.retained = retained; self.unknown = unknown
        self.timeout = timeout; self.keys=[]; self.lookups=0; self.permit='fenced:export-721:1'
    def request(self, key, payload):
        self.keys.append(key)
        if not(self.effects and self.retained and key == 'export-721'):
            self.effects += 1
        if self.timeout: raise TimeoutError('Reply lost after commit')
        return 'file-01'
    def reconcile(self, key):
        self.lookups += 1
        if self.unknown: return Resolution('unknown')
        return Resolution('committed','file-01') if self.effects else Resolution('authorized_absent',permit=self.permit)
    def authorized_retry(self, permit, key, payload):
        if permit != self.permit or self.effects:
            raise ConnectionError('Stale permit; reconcile again')
        self.permit=None;self.effects+=1;self.keys.append(key)
        return 'file-01'

class RepairTests(unittest.TestCase):
    def setUp(self): self.job=Job('export-721','dataset-A/csv',0,6*3600)
    def run_repair(self,svc,now=30,payload='dataset-A/csv'):
        return recover(self.job,payload,now,svc)
    def test_restart_reuses_durable_intent_not_new_worker_id(self):
        s=SimulatedExports();r=self.run_repair(s)
        self.assertEqual((r.status,s.effects,s.keys),('done',1,['export-721']))
    def test_changed_payload_stops_before_any_side_effect(self):
        s=SimulatedExports();r=self.run_repair(s,payload='dataset-B/parquet')
        self.assertEqual((r.status,s.keys,s.lookups),('conflict',[],0))
    def test_expiry_is_inclusive_at_exact_boundary(self):
        s=SimulatedExports(retained=False);r=self.run_repair(s,6*3600)
        self.assertEqual((r.status,s.effects,s.keys,s.lookups),('done',1,[],1))
    def test_late_committed_result_is_collected_not_repeated(self):
        s=SimulatedExports(retained=False);r=self.run_repair(s,9*3600)
        self.assertEqual((r.status,s.effects,s.keys),('done',1,[]))
    def test_authorized_absence_makes_progress_once(self):
        s=SimulatedExports(committed=False,retained=False);r=self.run_repair(s,9*3600)
        self.assertEqual((r.status,s.effects,s.keys),('done',1,['export-721']))
        self.assertEqual(self.run_repair(s,9*3600+1).status,'done');self.assertEqual(s.effects,1)
    def test_unknown_status_does_not_authorize_another_effect(self):
        s=SimulatedExports(retained=False,unknown=True);r=self.run_repair(s,9*3600)
        self.assertEqual((r.status,s.effects,s.keys),('pending',1,[]))
    def test_retained_key_does_not_need_available_status_service(self):
        s=SimulatedExports(unknown=True);r=self.run_repair(s)
        self.assertEqual((r.status,s.effects,s.lookups),('done',1,0))
    def test_lost_ack_is_pending_not_failed(self):
        s=SimulatedExports(timeout=True);r=self.run_repair(s)
        self.assertEqual((r.status,s.effects),('pending',1))
        s.timeout=False;self.assertEqual(self.run_repair(s).status,'done');self.assertEqual(s.effects,1)
    def test_unfenced_absence_does_not_authorize_retry(self):
        s=SimulatedExports(committed=False,retained=False)
        s.reconcile=lambda key:Resolution('authorized_absent')
        self.assertEqual(self.run_repair(s,9*3600).status,'pending');self.assertEqual(s.effects,0)

if __name__=='__main__':unittest.main()
