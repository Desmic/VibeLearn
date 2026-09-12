BEGIN;
SET LOCAL ROLE vibelearn_app;
SET LOCAL search_path = vibelearn, pg_catalog;
DO $$
DECLARE
    learner_a text := gen_random_uuid()::text;
    learner_b text := gen_random_uuid()::text;
    attempt_a text := gen_random_uuid()::text;
    checkpoint_a text := gen_random_uuid()::text;
    evidence_a text := gen_random_uuid()::text;
    stamp text := now()::text;
BEGIN
    PERFORM set_config('app.learner_id', learner_a, true);
    INSERT INTO learners(id, profile, created_at) VALUES (learner_a, '{}', stamp);
    INSERT INTO attempts(id,learner_id,revision,status,mode,response,snapshot,snapshot_digest,created_at,updated_at)
    VALUES(attempt_a,learner_a,1,'draft','LEARN','{}','{}','test-digest',stamp,stamp);
    INSERT INTO checkpoints(id,learner_id,attempt_id,kind,response,mode,assistance,snapshot_digest,created_at)
    VALUES(checkpoint_a,learner_a,attempt_a,'submission','{}','LEARN','[]','test-digest',stamp);
    INSERT INTO evidence(id,learner_id,attempt_id,checkpoint_id,frame_id,frame_revision,capsule,result,created_at)
    VALUES(evidence_a,learner_a,attempt_a,checkpoint_a,'test-frame',1,'{"snapshot":{"family_id":"test-family"}}','{}',stamp);
    INSERT INTO rewards(learner_id,family_id,attempt_id,xp,policy,created_at)
    VALUES(learner_a,'test-family',attempt_a,10,'test',stamp) ON CONFLICT(learner_id,family_id) DO NOTHING;
    INSERT INTO rewards(learner_id,family_id,attempt_id,xp,policy,created_at)
    VALUES(learner_a,'test-family',attempt_a,10,'test',stamp) ON CONFLICT(learner_id,family_id) DO NOTHING;
    IF (SELECT sum(xp) FROM rewards WHERE learner_id=learner_a) <> 10 THEN RAISE EXCEPTION 'Reward deduplication failed'; END IF;
    IF NOT EXISTS(SELECT 1 FROM evidence WHERE capsule::jsonb #>> '{snapshot,family_id}' = 'test-family') THEN RAISE EXCEPTION 'JSON lookup failed'; END IF;
    UPDATE attempts SET status='submitted', revision=2 WHERE id=attempt_a;
    BEGIN
        UPDATE attempts SET response='{"tampered":true}' WHERE id=attempt_a;
        RAISE EXCEPTION 'Submission mutation was permitted';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
        UPDATE evidence SET result='{"tampered":true}' WHERE id=evidence_a;
        RAISE EXCEPTION 'History mutation was permitted';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    PERFORM set_config('app.learner_id',learner_b,true);
    INSERT INTO learners(id, profile, created_at) VALUES (learner_b, '{}', stamp);
    IF EXISTS(SELECT 1 FROM attempts WHERE id=attempt_a) OR EXISTS(SELECT 1 FROM evidence WHERE id=evidence_a) THEN RAISE EXCEPTION 'Learner isolation failed'; END IF;
    BEGIN
        INSERT INTO rewards(learner_id,family_id,attempt_id,xp,policy,created_at)
        VALUES(learner_a,'forged',attempt_a,10,'test',stamp);
        RAISE EXCEPTION 'RLS ownership check failed';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
        INSERT INTO rewards(learner_id,family_id,attempt_id,xp,policy,created_at)
        VALUES(learner_b,'forged',attempt_a,10,'test',stamp);
        RAISE EXCEPTION 'Composite ownership reference failed';
    EXCEPTION WHEN foreign_key_violation THEN NULL;
    END;
    PERFORM set_config('app.learner_id','',true);
    IF EXISTS(SELECT 1 FROM learners WHERE id in (learner_a,learner_b)) THEN RAISE EXCEPTION 'Unscoped read allowed'; END IF;
END;
$$;
ROLLBACK;
SELECT 'passed; all fixtures rolled back' AS hosted_database_boundary_checks;
