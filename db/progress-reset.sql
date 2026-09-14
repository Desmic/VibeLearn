-- Explicit, learner-scoped reset for the private pilot.
-- The app role still cannot DELETE history directly. This routine is the only
-- supported destructive path and requires app.learner_id to be set by the app.
SET LOCAL search_path = vibelearn, pg_catalog;

CREATE OR REPLACE FUNCTION vibelearn.reject_history_change() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE'
       AND current_setting('app.reset_progress', true) = OLD.learner_id
       AND current_setting('app.learner_id', true) = OLD.learner_id THEN
        RETURN OLD;
    END IF;
    RAISE EXCEPTION 'Learning history is immutable' USING ERRCODE = '23514';
END;
$$;

CREATE OR REPLACE FUNCTION vibelearn.reset_current_learner_progress() RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    learner text := current_setting('app.learner_id', true);
BEGIN
    IF learner IS NULL OR learner = '' THEN
        RAISE EXCEPTION 'Learner context required' USING ERRCODE = '42501';
    END IF;

    PERFORM set_config('app.reset_progress', learner, true);

    DELETE FROM vibelearn.reviews WHERE learner_id = learner;
    DELETE FROM vibelearn.rewards WHERE learner_id = learner;
    DELETE FROM vibelearn.evidence WHERE learner_id = learner;
    DELETE FROM vibelearn.assistance WHERE learner_id = learner;
    DELETE FROM vibelearn.checkpoints WHERE learner_id = learner;
    DELETE FROM vibelearn.commands WHERE learner_id = learner;
    DELETE FROM vibelearn.attempts WHERE learner_id = learner;
END;
$$;

REVOKE ALL ON FUNCTION vibelearn.reset_current_learner_progress() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION vibelearn.reset_current_learner_progress() TO vibelearn_app;
