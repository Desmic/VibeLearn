-- PostgreSQL schema for the private hosted pilot. Apply through Supabase migrations.
CREATE SCHEMA vibelearn;
REVOKE ALL ON SCHEMA vibelearn FROM PUBLIC, anon, authenticated;
CREATE ROLE vibelearn_app NOLOGIN NOSUPERUSER NOBYPASSRLS;
GRANT vibelearn_app TO postgres;
GRANT USAGE ON SCHEMA vibelearn TO vibelearn_app;
SET LOCAL search_path = vibelearn, pg_catalog;
CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY);
INSERT INTO schema_migrations VALUES (1);
GRANT SELECT ON schema_migrations TO vibelearn_app;

    CREATE TABLE learners (id TEXT PRIMARY KEY, profile TEXT NOT NULL, created_at TEXT NOT NULL);

    CREATE TABLE attempts (rowid BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE, id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), revision INTEGER NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft', 'submitted')), mode TEXT NOT NULL, response TEXT NOT NULL, snapshot TEXT NOT NULL, snapshot_digest TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
    CREATE INDEX idx_attempts_learner ON attempts(learner_id);
    CREATE UNIQUE INDEX idx_attempts_one_draft ON attempts(learner_id) WHERE status='draft';
    CREATE TABLE commands (learner_id TEXT NOT NULL REFERENCES learners(id), command_id TEXT NOT NULL, request_digest TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(learner_id, command_id));
    

    CREATE TABLE checkpoints (rowid BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE, id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), attempt_id TEXT NOT NULL REFERENCES attempts(id), kind TEXT NOT NULL, response TEXT NOT NULL, mode TEXT NOT NULL, assistance TEXT NOT NULL, snapshot_digest TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX idx_checkpoints_attempt ON checkpoints(learner_id, attempt_id);
    CREATE TABLE evidence (id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id), checkpoint_id TEXT NOT NULL REFERENCES checkpoints(id), frame_id TEXT NOT NULL, frame_revision INTEGER NOT NULL, capsule TEXT NOT NULL, result TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX idx_evidence_learner ON evidence(learner_id);
    CREATE TABLE reviews (learner_id TEXT NOT NULL REFERENCES learners(id), frame_id TEXT NOT NULL, frame_revision INTEGER NOT NULL, evidence_id TEXT NOT NULL REFERENCES evidence(id), intent TEXT NOT NULL, PRIMARY KEY(learner_id, frame_id, frame_revision));
    

    CREATE TABLE assistance (rowid BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE, id TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), attempt_id TEXT NOT NULL REFERENCES attempts(id), kind TEXT NOT NULL, detail TEXT NOT NULL, affects_independence INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX idx_assistance_attempt ON assistance(learner_id, attempt_id);
    CREATE TABLE rewards (learner_id TEXT NOT NULL REFERENCES learners(id), family_id TEXT NOT NULL, attempt_id TEXT NOT NULL REFERENCES attempts(id), xp INTEGER NOT NULL CHECK(xp=10), policy TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(learner_id, family_id));
    
CREATE TABLE hosted_sessions (token_hash TEXT PRIMARY KEY, learner_id TEXT NOT NULL REFERENCES learners(id), expires_at TEXT NOT NULL);
CREATE INDEX idx_hosted_sessions_learner ON hosted_sessions(learner_id);
ALTER TABLE attempts ADD CONSTRAINT attempts_owner_key UNIQUE (id, learner_id);
ALTER TABLE checkpoints ADD CONSTRAINT checkpoints_owner_key UNIQUE (id, learner_id);
ALTER TABLE evidence ADD CONSTRAINT evidence_owner_key UNIQUE (id, learner_id);
ALTER TABLE checkpoints ADD FOREIGN KEY (attempt_id, learner_id) REFERENCES attempts(id, learner_id);
ALTER TABLE assistance ADD FOREIGN KEY (attempt_id, learner_id) REFERENCES attempts(id, learner_id);
ALTER TABLE evidence ADD FOREIGN KEY (attempt_id, learner_id) REFERENCES attempts(id, learner_id);
ALTER TABLE evidence ADD FOREIGN KEY (checkpoint_id, learner_id) REFERENCES checkpoints(id, learner_id);
ALTER TABLE reviews ADD FOREIGN KEY (evidence_id, learner_id) REFERENCES evidence(id, learner_id);
ALTER TABLE rewards ADD FOREIGN KEY (attempt_id, learner_id) REFERENCES attempts(id, learner_id);
CREATE INDEX idx_attempts_latest ON attempts(learner_id, rowid DESC);
CREATE INDEX idx_checkpoints_order ON checkpoints(learner_id, attempt_id, rowid);
CREATE INDEX idx_assistance_order ON assistance(learner_id, attempt_id, rowid);
CREATE INDEX idx_evidence_family ON evidence(learner_id, ((capsule::jsonb #>> '{snapshot,family_id}')));
CREATE INDEX idx_evidence_checkpoint ON evidence(checkpoint_id, learner_id);
CREATE INDEX idx_reviews_evidence ON reviews(evidence_id, learner_id);
CREATE INDEX idx_rewards_attempt ON rewards(attempt_id, learner_id);
CREATE FUNCTION vibelearn.reject_history_change() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    RAISE EXCEPTION 'Learning history is immutable' USING ERRCODE = '23514';
END;
$$;
CREATE FUNCTION vibelearn.protect_attempt() RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.learner_id IS DISTINCT FROM OLD.learner_id
       OR NEW.snapshot IS DISTINCT FROM OLD.snapshot OR NEW.snapshot_digest IS DISTINCT FROM OLD.snapshot_digest
       OR NEW.created_at IS DISTINCT FROM OLD.created_at OR NEW.rowid IS DISTINCT FROM OLD.rowid THEN
       RAISE EXCEPTION 'Attempt context is immutable' USING ERRCODE = '23514';
    END IF;
    IF OLD.status = 'submitted' AND (NEW.response IS DISTINCT FROM OLD.response OR NEW.status IS DISTINCT FROM OLD.status OR NEW.mode IS DISTINCT FROM OLD.mode) THEN
       RAISE EXCEPTION 'Submitted response is immutable' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER immutable_attempt BEFORE UPDATE ON attempts FOR EACH ROW EXECUTE FUNCTION vibelearn.protect_attempt();
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA vibelearn FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA vibelearn TO vibelearn_app;
CREATE TRIGGER immutable_checkpoints BEFORE UPDATE OR DELETE ON checkpoints FOR EACH ROW EXECUTE FUNCTION vibelearn.reject_history_change();
CREATE TRIGGER immutable_evidence BEFORE UPDATE OR DELETE ON evidence FOR EACH ROW EXECUTE FUNCTION vibelearn.reject_history_change();
CREATE TRIGGER immutable_assistance BEFORE UPDATE OR DELETE ON assistance FOR EACH ROW EXECUTE FUNCTION vibelearn.reject_history_change();
CREATE TRIGGER immutable_commands BEFORE UPDATE OR DELETE ON commands FOR EACH ROW EXECUTE FUNCTION vibelearn.reject_history_change();
CREATE TRIGGER immutable_rewards BEFORE UPDATE OR DELETE ON rewards FOR EACH ROW EXECUTE FUNCTION vibelearn.reject_history_change();
ALTER TABLE learners ENABLE ROW LEVEL SECURITY;
ALTER TABLE learners FORCE ROW LEVEL SECURITY;
CREATE POLICY learner_scope ON learners TO vibelearn_app
USING (id = (SELECT current_setting('app.learner_id', true)))
WITH CHECK (id = (SELECT current_setting('app.learner_id', true)));
GRANT SELECT, INSERT ON learners TO vibelearn_app;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts FORCE ROW LEVEL SECURITY;
CREATE POLICY learner_scope ON attempts TO vibelearn_app
USING (learner_id = (SELECT current_setting('app.learner_id', true)))
WITH CHECK (learner_id = (SELECT current_setting('app.learner_id', true)));
GRANT SELECT, INSERT ON attempts TO vibelearn_app;
ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE commands FORCE ROW LEVEL SECURITY;
CREATE POLICY learner_scope ON commands TO vibelearn_app
USING (learner_id = (SELECT current_setting('app.learner_id', true)))
WITH CHECK (learner_id = (SELECT current_setting('app.learner_id', true)));
GRANT SELECT, INSERT ON commands TO vibelearn_app;
ALTER TABLE checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoints FORCE ROW LEVEL SECURITY;
CREATE POLICY learner_scope ON checkpoints TO vibelearn_app
USING (learner_id = (SELECT current_setting('app.learner_id', true)))
WITH CHECK (learner_id = (SELECT current_setting('app.learner_id', true)));
GRANT SELECT, INSERT ON checkpoints TO vibelearn_app;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence FORCE ROW LEVEL SECURITY;
CREATE POLICY learner_scope ON evidence TO vibelearn_app
USING (learner_id = (SELECT current_setting('app.learner_id', true)))
WITH CHECK (learner_id = (SELECT current_setting('app.learner_id', true)));
GRANT SELECT, INSERT ON evidence TO vibelearn_app;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews FORCE ROW LEVEL SECURITY;
CREATE POLICY learner_scope ON reviews TO vibelearn_app
USING (learner_id = (SELECT current_setting('app.learner_id', true)))
WITH CHECK (learner_id = (SELECT current_setting('app.learner_id', true)));
GRANT SELECT, INSERT ON reviews TO vibelearn_app;
ALTER TABLE assistance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance FORCE ROW LEVEL SECURITY;
CREATE POLICY learner_scope ON assistance TO vibelearn_app
USING (learner_id = (SELECT current_setting('app.learner_id', true)))
WITH CHECK (learner_id = (SELECT current_setting('app.learner_id', true)));
GRANT SELECT, INSERT ON assistance TO vibelearn_app;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards FORCE ROW LEVEL SECURITY;
CREATE POLICY learner_scope ON rewards TO vibelearn_app
USING (learner_id = (SELECT current_setting('app.learner_id', true)))
WITH CHECK (learner_id = (SELECT current_setting('app.learner_id', true)));
GRANT SELECT, INSERT ON rewards TO vibelearn_app;
ALTER TABLE hosted_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosted_sessions FORCE ROW LEVEL SECURITY;
CREATE POLICY learner_scope ON hosted_sessions TO vibelearn_app
USING (learner_id = (SELECT current_setting('app.learner_id', true)))
WITH CHECK (learner_id = (SELECT current_setting('app.learner_id', true)));
GRANT SELECT, INSERT ON hosted_sessions TO vibelearn_app;
GRANT UPDATE (revision, status, mode, response, updated_at) ON attempts TO vibelearn_app;
GRANT UPDATE (evidence_id, intent) ON reviews TO vibelearn_app;
GRANT DELETE ON hosted_sessions TO vibelearn_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA vibelearn TO vibelearn_app;
REVOKE ALL ON ALL TABLES IN SCHEMA vibelearn FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA vibelearn FROM PUBLIC, anon, authenticated;
-- The schema is private: no Data API grants or exposed SECURITY DEFINER routines.
