-- Preserve unfinished historical attempts while allowing the active Bellweather
-- Level 1 to start. This changes only draft uniqueness; no history is rewritten.
SET search_path = vibelearn, pg_catalog;

DROP INDEX IF EXISTS vibelearn.idx_attempts_one_draft;

CREATE UNIQUE INDEX idx_attempts_one_draft_per_mission
ON vibelearn.attempts (
  learner_id,
  ((snapshot::jsonb #>> '{mission,id}'))
)
WHERE status = 'draft';
