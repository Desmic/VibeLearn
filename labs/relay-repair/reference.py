"""Reference solution. Reading this is assistance, not an independent assessment."""
from contracts import Job, Service, Outcome

def recover(job: Job, requested_payload: str, now: float, service: Service) -> Outcome:
    if requested_payload != job.saved_payload:
        return Outcome('conflict')
    try:
        if now - job.first_commit_window_start < job.retention_seconds:
            return Outcome('done', service.request(job.intent_id, requested_payload))
        state = service.reconcile(job.intent_id)
        if state.status == 'committed':
            return Outcome('done', state.result)
        if state.status == 'authorized_absent' and state.permit:
            return Outcome('done', service.authorized_retry(state.permit, job.intent_id, requested_payload))
        return Outcome('pending')
    except (TimeoutError, ConnectionError):
        # A timeout may follow a commit. Keep the identity and uncertainty.
        return Outcome('pending')
