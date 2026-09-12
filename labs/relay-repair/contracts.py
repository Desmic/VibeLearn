"""A deliberately explicit service contract, not a real vendor SDK."""
from dataclasses import dataclass
from typing import Protocol, Literal

@dataclass(frozen=True)
class Job:
    intent_id: str  # Persisted before FIRST dispatch; never a worker/attempt ID.
    saved_payload: str  # In production: canonical, versioned request fingerprint.
    first_commit_window_start: float
    retention_seconds: float

@dataclass(frozen=True)
class Resolution:
    status: Literal['committed', 'authorized_absent', 'unknown']
    result: str | None = None
    permit: str | None = None  # Atomically fenced retry authority, not an HTTP 404.

@dataclass(frozen=True)
class Outcome:
    status: Literal['done', 'conflict', 'pending']
    result: str | None = None

class Service(Protocol):
    def request(self, key: str, payload: str) -> str: ...
    def reconcile(self, intent_id: str) -> Resolution: ...
    def authorized_retry(self, permit: str, key: str, payload: str) -> str: ...
