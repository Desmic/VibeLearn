"""Connection ownership and forward-only SQLite migrations."""
import sqlite3
from contextlib import contextmanager
from pathlib import Path

MIGRATIONS = [
    """
    CREATE TABLE baseline_probe (id TEXT PRIMARY KEY, value TEXT NOT NULL);
    """,
    """
    CREATE TABLE learners (id TEXT PRIMARY KEY, profile TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id));
    CREATE TABLE attempts (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), revision INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft', 'submitted')), mode TEXT NOT NULL, response TEXT NOT NULL, snapshot TEXT NOT NULL, snapshot_digest TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX idx_attempts_learner ON attempts(learner_id);
    CREATE UNIQUE INDEX idx_attempts_one_draft ON attempts(learner_id) WHERE status='draft';
    CREATE TABLE commands (learner_id TEXT NOT NULL REFERENCES learners(id), command_id TEXT NOT NULL, request_digest TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(learner_id, command_id));
    """,
    """
    CREATE TABLE checkpoints (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), attempt_id TEXT NOT NULL REFERENCES attempts(id), kind TEXT NOT NULL, response TEXT NOT NULL, mode TEXT NOT NULL, assistance TEXT NOT NULL, snapshot_digest TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX idx_checkpoints_attempt ON checkpoints(learner_id, attempt_id);
    CREATE TABLE evidence (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id), checkpoint_id TEXT NOT NULL REFERENCES checkpoints(id), frame_id TEXT NOT NULL, frame_revision INTEGER NOT NULL, capsule TEXT NOT NULL, result TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX idx_evidence_learner ON evidence(learner_id);
    CREATE TABLE reviews (learner_id TEXT NOT NULL REFERENCES learners(id), frame_id TEXT NOT NULL, frame_revision INTEGER NOT NULL, evidence_id TEXT NOT NULL REFERENCES evidence(id), intent TEXT NOT NULL, PRIMARY KEY(learner_id, frame_id, frame_revision));
    """,

    """
    CREATE TABLE assistance (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), attempt_id TEXT NOT NULL REFERENCES attempts(id), kind TEXT NOT NULL, detail TEXT NOT NULL, affects_independence INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX idx_assistance_attempt ON assistance(learner_id, attempt_id);
    CREATE TABLE rewards (learner_id TEXT NOT NULL REFERENCES learners(id), family_id TEXT NOT NULL, attempt_id TEXT NOT NULL REFERENCES attempts(id), xp INTEGER NOT NULL CHECK(xp=10), policy TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(learner_id, family_id));
    """,

    """
    CREATE TRIGGER immutable_snapshot BEFORE UPDATE OF snapshot, snapshot_digest, learner_id ON attempts BEGIN SELECT RAISE(ABORT, 'Attempt context is immutable'); END;
    CREATE TRIGGER immutable_submission BEFORE UPDATE OF response ON attempts WHEN OLD.status='submitted' BEGIN SELECT RAISE(ABORT, 'Submitted response is immutable'); END;
    CREATE TRIGGER immutable_checkpoint BEFORE UPDATE ON checkpoints BEGIN SELECT RAISE(ABORT, 'Checkpoint is immutable'); END;
    CREATE TRIGGER immutable_evidence BEFORE UPDATE ON evidence BEGIN SELECT RAISE(ABORT, 'Evidence is immutable'); END;
    CREATE TRIGGER immutable_assistance BEFORE UPDATE ON assistance BEGIN SELECT RAISE(ABORT, 'Assistance is immutable'); END;
    """,

]


def connect(path):
    if is_postgres(path):
        from app.postgres import PostgresConnection
        return PostgresConnection(str(path))
    db = sqlite3.connect(str(path), timeout=10)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys = ON")
    return db


def migrate(path):
    if is_postgres(path):
        with transaction(path) as db:
            version = db.execute("SELECT max(version) FROM schema_migrations").fetchone()[0]
            if version != 1:
                raise RuntimeError("Apply the reviewed PostgreSQL migrations before starting this version.")
        return
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with transaction(path) as db:
        version = db.execute("PRAGMA user_version").fetchone()[0]
        if version > len(MIGRATIONS):
            raise RuntimeError("Database is newer than this application; keep the newer app.")
        for index in range(version, len(MIGRATIONS)):
            statement = ""
            for line in MIGRATIONS[index].splitlines():
                statement += line + "\n"
                if sqlite3.complete_statement(statement):
                    db.execute(statement)
                    statement = ""
            if statement.strip():
                raise RuntimeError("Incomplete migration statement")
            db.execute(f"PRAGMA user_version = {index + 1}")


@contextmanager
def transaction(path, learner=None, lock=False):
    db = connect(path)
    try:
        if is_postgres(path):
            db.begin(learner, lock)
        else:
            db.execute("BEGIN IMMEDIATE")
        yield db
        db.commit()
    except BaseException:
        db.rollback()
        raise
    finally:
        db.close()


def is_postgres(path):
    return str(path).startswith(("postgresql://", "postgres://"))


def family_evidence(db, learner, family):
    expression = "capsule::jsonb #>> '{snapshot,family_id}'" if getattr(db, "postgres", False) else "json_extract(capsule, '$.snapshot.family_id')"
    return db.execute(f"SELECT id FROM evidence WHERE learner_id=? AND {expression}=? LIMIT 1", (learner, family)).fetchone()
