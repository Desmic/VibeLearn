-- Follow-up hardening applied to the hosted Supabase project on 7 September 2026.
-- Supabase migration history:
--   20260907102455_harden_hosted_schema_access
--   20260907102517_cover_hosted_foreign_keys
--
-- Keep this separate from hosted-schema.sql so the original bootstrap migration
-- remains traceable to migration 20260907073952_vibelearn_hosted_schema.

-- 20260907102455_harden_hosted_schema_access
-- The event trigger continues to invoke this postgres-owned helper internally, but
-- there is no reason for Data API roles or PUBLIC to call it directly as an RPC.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- schema_migrations is private already, but protect it with RLS as defense in depth
-- while preserving the app's startup SELECT through its restricted role.
ALTER TABLE vibelearn.schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibelearn.schema_migrations FORCE ROW LEVEL SECURITY;
CREATE POLICY schema_version_read ON vibelearn.schema_migrations
FOR SELECT TO vibelearn_app
USING (true);

-- 20260907102517_cover_hosted_foreign_keys
-- These indexes cover both the composite ownership FKs and their attempt_id prefix.
CREATE INDEX idx_assistance_attempt_owner
    ON vibelearn.assistance(attempt_id, learner_id);
CREATE INDEX idx_checkpoints_attempt_owner
    ON vibelearn.checkpoints(attempt_id, learner_id);
CREATE INDEX idx_evidence_attempt_owner
    ON vibelearn.evidence(attempt_id, learner_id);
