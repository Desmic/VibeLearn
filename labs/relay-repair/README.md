# Field assignment: repair an export worker

You own a background job worker. Its external export API sometimes commits a file
but loses the reply. Another worker may resume the same job. Repair `worker.py`
using only Python's standard library. Nothing in this lab calls a real service.

## Run it

Use Python 3.10 or newer. From this directory:

```sh
python -m unittest -v test_worker.py
```

The starter deliberately raises `NotImplementedError`. Implement `recover` until
the nine tests pass. Then add YOUR OWN changed-payload, expiry and network-failure
counterexamples. Explain why every retry is authorized; don't merely match tests.
`reference.py` is a separately labelled solution: opening it is assistance.

## What the game maps to

Pip = worker process. Saved ticket = durable business-intent ID. Parcel label =
canonical request parameters. Short ticket memory = service idempotency retention.
Order book = authoritative reconciliation API. A lit signal = resolved scenario,
not a claim of production skill or permanent mastery.

A new worker does not imply a new intent. Stop parameter mismatches before any
possible effect. While the key is retained, retry the same intent. At/after expiry,
reconcile. Return the existing result, use an explicitly authorized absence permit,
or stay pending and escalate uncertainty. Do not spin or sleep in the function.

## The important production difference

**A GET returning 404 is NOT a safe-retry permit.** An eventually consistent read,
a delayed in-flight request, or a second worker can invalidate an absence check.
This lab's `authorized_absent` state is an explicit, stronger contract: a fenced
one-time permit issued by the authoritative system and atomically consumed by
`authorized_retry`. The simulation rejects stale permits. Your actual API may
not offer this feature. In that case, keep the job pending and reconcile/escalate;
do not copy this branch with a plain `POST` and assume it is safe.

The service's effect, payload binding and retained result must be atomic under
concurrency. Persist the job ID before initial dispatch. Plan retention relative
to realistic retry and redelivery delays. Handle rate limits, bounded backoff with
jitter, authorization, cancellation, observability and operator escalation. A local
lock in one worker cannot coordinate unrelated workers or an external API.

## Apply it to your own project

Choose one side-effecting tool call in an agent orchestrator: create a file,
start a paid job, send a notification, or publish an artifact. Write its intent
boundary and retry contract. Inject a timeout AFTER the effect commits, then
restart the worker. Show that the resumed attempt doesn't create another effect.
Try two workers, changed arguments and expired retention. Document every guarantee
your service does NOT supply. Review before using it against live resources.

## Check transfer later

In two days, close the reference and explain how this would change for a webhook
consumer whose sender retries events out of order. Implement a disposable example.
Record what you could do without help and where you needed the reference. This is
a suggested retrieval task, not a scheduled reminder or app-verified outcome.

Passing this lab's tests checks bounded behavior, not deployment readiness,
concurrency safety under every interleaving, or course-equivalent mastery.

Sources: AWS Builders Library, Making retries safe with idempotent APIs;
https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/
