#!/usr/bin/env python3
"""Stormworks / real-world repair lab / Python 3.10+ / standard library only.

RUN
  python retry_lab.py --demo     # Observe an actual local duplicate effect.
  python retry_lab.py --test     # Initially FAILS. Repair the two TODO functions.

YOUR JOB
A restarted worker must finish one intent without creating duplicate effects.
Repair request_key and next_action. Do not modify the tests to make them pass.
Read the observations: a timeout is not evidence that an operation failed.

The demo uses a temporary SQLite database, not a network, account, payment API
or real customer data. All code below is readable. No dependency installation.

AFTER PASSING
1. Explain why a local DB transaction cannot include an arbitrary remote charge.
2. Adapt the dispatcher to YOUR provider's identity, retention and reconciliation
   contracts. An ordinary 404 is NOT the strong absence guarantee in this lab.
3. Add concurrency, crash-between-steps, response loss, backoff/jitter, payload
   canonicalization, tenant isolation, observability and retention tests.
4. Repeat on a new problem after a delay. Game completion did not measure that.

SOURCES / verify your provider, do not copy a universal 24-hour assumption:
https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
https://docs.stripe.com/api/idempotent_requests

These tasks practise a bounded dispatcher; they are not production-ready billing
code, proof of exactly-once distributed execution, or educational certification.
"""
import argparse
import hashlib
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path


def request_key(job: dict) -> str:
    """TODO: return an unambiguous, stable, scoped key for this business intent.

    Fields: tenant, operation, intent_id, worker_id. The job is stored before the
    first call. The worker can change. Different authorized intents may have
    identical parameters. Ambiguous concatenation can also cause collisions.
    """
    return job['worker_id']  # BUG: worker identity is not business intent.


def next_action(job: dict, elapsed_hours: float, record: str) -> str:
    """TODO: choose send / lookup / confirm / hold.

    job contains retention_hours, original_payload, current_payload.
    record is one of:
      unchecked: no authoritative lookup has happened;
      committed: authoritative record confirms THIS intent;
      absent_final: provider guarantees no effect AND no earlier call in flight;
      unavailable: cannot determine the intent's status.

    'send' ALWAYS means resend the same persisted intent key and same parameters,
    never create a fresh ID to escape an error. Changed parameters need 'hold'.
    At or beyond retention, do not trust the old key alone.
    """
    return 'send'  # BUG: a blind retry after retention can duplicate an effect.


def sample_job(**changes):
    value = {'tenant':'a', 'operation':'reserve', 'intent_id':'17', 'worker_id':'worker-1',
             'retention_hours':8, 'original_payload':{'item':'book','qty':1},
             'current_payload':{'item':'book','qty':1}}
    value.update(changes)
    return value


class Receiver:
    """Actual local ACID effect + cache. NOT atomic with an external API.

    This local receiver models expiration by time. A separate durable effects
    table demonstrates why the retry cache is not the authoritative order store.
    """
    def __init__(self, path):
        self.db = sqlite3.connect(path)
        self.db.executescript('''
          CREATE TABLE IF NOT EXISTS retry_cache (key TEXT PRIMARY KEY, hash TEXT, at REAL, result INTEGER);
          CREATE TABLE IF NOT EXISTS effects (id INTEGER PRIMARY KEY, intent TEXT, payload TEXT);
        ''')

    def send(self, key, payload, now, retention=8):
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
        with self.db:
            self.db.execute('BEGIN IMMEDIATE')
            row = self.db.execute('SELECT hash, at, result FROM retry_cache WHERE key=?',(key,)).fetchone()
            if row and now-row[1] < retention:
                if row[0] != digest:
                    raise ValueError('Same key, different parameters: resolve the intent.')
                return row[2]
            result = self.db.execute('INSERT INTO effects(intent,payload) VALUES (?,?)',(key,json.dumps(payload))).lastrowid
            self.db.execute('INSERT OR REPLACE INTO retry_cache VALUES (?,?,?,?)',(key,digest,now,result))
            return result

    def count(self):
        return self.db.execute('SELECT COUNT(*) FROM effects').fetchone()[0]

    def close(self):
        self.db.close()


class RepairTests(unittest.TestCase):
    def test_restart_preserves_identity(self):
        self.assertEqual(request_key(sample_job()), request_key(sample_job(worker_id='worker-2')))

    def test_second_authorized_intent_is_distinct(self):
        self.assertNotEqual(request_key(sample_job()), request_key(sample_job(intent_id='18')))

    def test_tenant_and_operation_scope(self):
        key=request_key(sample_job())
        self.assertNotEqual(key,request_key(sample_job(tenant='b')))
        self.assertNotEqual(key,request_key(sample_job(operation='cancel')))

    def test_key_encoding_is_unambiguous(self):
        self.assertNotEqual(request_key(sample_job(tenant='a:b',operation='c')),
                            request_key(sample_job(tenant='a',operation='b:c')))

    def test_same_key_prevents_actual_local_duplicate(self):
        with tempfile.TemporaryDirectory() as d:
            receiver=Receiver(Path(d)/'receiver.sqlite3')
            try:
                one=sample_job();two=sample_job(worker_id='worker-2')
                receiver.send(request_key(one),one['original_payload'],0)
                receiver.send(request_key(two),two['current_payload'],.1)
                self.assertEqual(receiver.count(),1)
            finally: receiver.close()

    def test_matching_payload_inside_retention_can_send(self):
        self.assertEqual(next_action(sample_job(),.1,'unchecked'),'send')

    def test_exact_boundary_needs_lookup(self):
        self.assertEqual(next_action(sample_job(),8,'unchecked'),'lookup')

    def test_changed_parameters_need_resolution(self):
        self.assertEqual(next_action(sample_job(current_payload={'item':'book','qty':2}),.1,'unchecked'),'hold')

    def test_committed_late_intent_is_confirmed_not_resent(self):
        self.assertEqual(next_action(sample_job(),9,'committed'),'confirm')

    def test_unknown_late_intent_stays_pending(self):
        self.assertEqual(next_action(sample_job(),9,'unavailable'),'hold')

    def test_authoritative_final_absence_permits_progress(self):
        self.assertEqual(next_action(sample_job(),9,'absent_final'),'send')


def demo():
    with tempfile.TemporaryDirectory() as d:
        r=Receiver(Path(d)/'demo.sqlite3')
        try:
            job=sample_job(); payload=job['original_payload']
            r.send('worker-1',payload,0)
            print('The first effect committed; pretend its reply was lost.')
            r.send('worker-2',payload,.1)
            print(f'Retry with a different worker key: {r.count()} effects. One intent became two.')
            r.send('worker-2',payload,.2)
            print(f'Same retained key: still {r.count()} effects.')
            r.send('worker-2',payload,9)
            print(f'Same key after its 8-hour retention: {r.count()} effects. Identity alone is not enough.')
            print('Repair the two functions, run --test, then explain the retention and uncertainty boundaries.')
        finally:r.close()


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__,formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--demo',action='store_true');parser.add_argument('--test',action='store_true')
    args=parser.parse_args()
    if args.demo:demo()
    elif args.test:unittest.main(argv=['retry_lab.py'],verbosity=2)
    else:parser.print_help()
