"""YOUR REPAIR. Run: python -m unittest -v test_worker.py"""
from contracts import Job, Service, Outcome

def recover(job: Job, requested_payload: str, now: float, service: Service) -> Outcome:
    """Return done/conflict/pending without creating an unapproved duplicate.

    No loops or sleep required. A scheduler can revisit pending jobs later.
    Handle parameter mismatch BEFORE another request can create an effect.
    The 'authorized_absent' contract is stronger than an ordinary missing record.
    """
    raise NotImplementedError('Implement the recovery decision from the contract.')
