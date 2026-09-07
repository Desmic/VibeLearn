# Private Render + Supabase pilot

This increment makes the first episode deployable using Render Free and Supabase
Free. It does not implement later course generation or collaborative code execution.
The source starts from `26acf22d1ceceec4724b9c824065ecee05ea7cac`.

## Implementation

- `app/hosted.py`: Flask WSGI app, served by Gunicorn. Requires PostgreSQL, TLS,
  an exact HTTPS origin, and an email allowlist. There is no anonymous session
  creation in hosted mode and no trust in arbitrary forwarded host headers.
- `app/auth.py`: Supabase password sign-in and server-side `get_user` verification
  on each authenticated request, using a fresh non-persisting client. Anonymous
  identities and unconfirmed email accounts are rejected. No service-role key.
- Sessions: Secure, HttpOnly, SameSite=Strict cookies. Access lasts at most one
  hour, then the learner signs in again; there is no refresh-token persistence.
  Hashed application sessions revoke access immediately on logout, including
  replayed cookie pairs. This is app logout, not global Supabase-device logout.
- `app/postgres.py`: one transaction per command, per-learner transaction advisory
  locking, bounded query/lock timeouts, and prepared statements disabled for pooler
  compatibility. Every transaction assumes the restricted `vibelearn_app` role.
- `db/hosted-schema.sql`: private `vibelearn` schema, forced RLS on learner tables,
  ownership-preserving references, explicit insertion order, immutable history,
  and command/reward deduplication. No anonymous or Data API table access.
- The domain code stays in Python. SQLite local mode and its historical migrations
  remain intact. Existing anonymous SQLite data is not automatically assigned to a
  hosted account; any future transfer needs an explicit ownership mapping.
- `render.yaml`: one free Python service in Singapore; no paid database, worker,
  disk, cron service, or other paid resource is provisioned.

## Supabase state

The existing Free project in `ap-south-1` now has migration
`20260907073952_vibelearn_hosted_schema`. The SQL source is `db/hosted-schema.sql`.
It was applied atomically through the connected Supabase migration tool. CLI
bootstrap was unavailable in the editing environment; the migration identity above
comes from Supabase's actual migration history, not an invented timestamp.

The `vibelearn_app` role is deliberately NOLOGIN. A deployment login still needs
to be created and granted that role, with its password entered privately in Render.
Do not reuse or reset an existing administrator password. An operator can create a
dedicated `vibelearn_login` role, grant `vibelearn_app`, and set its password securely.
No database password was created, retrieved, or committed during preparation.

The project had no application tables in `public`; this migration leaves it alone.
The security advisor reports two existing execute-grant warnings on
`public.rls_auto_enable()`, which is outside the new schema. These require inspection
before a broader rollout; they were not silently altered as part of this migration:
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Render setup — pending connection and deployment

1. Connect Render and select this repository/branch. Keep the service on `free`.
2. Create the dedicated database login described above. Use Supabase's Connect
   dialog to obtain the actual shared pooler hostname and session-pooling URL
   (port 5432, IPv4 compatible). Require TLS with `sslmode=require` or stronger.
3. Set `DATABASE_URL`, `APP_ORIGIN` (the exact assigned HTTPS origin),
   `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `ALLOWED_EMAILS` privately in
   Render. `.env.example` contains placeholders. Never paste passwords into chat.
4. Set up a confirmed Supabase Auth account for the allowlisted email in the
   Supabase dashboard. The app uses that user's password, not the project/database
   password. Account creation/recovery is dashboard-managed for this private pilot;
   no public signup or password-reset UI is implemented.
5. Build with `pip install -r requirements.lock`; start with the Gunicorn command in
   `render.yaml`. Apply migrations separately before startup: the runtime verifies
   schema version but cannot create or alter tables.
6. Confirm `/api/health`, sign in as the intended user, save an answer, reload,
   restart the service, and verify the same draft. Check a second authorized
   account cannot access the first account's attempt. Log out and verify access
   is revoked. Inspect narrow-screen and keyboard behavior on the real deployment.

The source checkout currently has no runtime database credential and no confirmed
Render connection. The Supabase management connector does not automatically give
the running Python process a database connection or an end-user Auth session.

## Observed verification

- `python manage.py build`: passed (Python compilation and JS syntax).
- `python manage.py test`: 39 tests passed locally; six real PostgreSQL application
  tests skipped because `TEST_DATABASE_URL` is unavailable. The eight new hosted
  HTTP/session tests use an explicitly simulated Auth provider and real SQLite;
  these are contract checks, not a live Supabase sign-in claim.
- `db/verify-hosted-boundaries.sql` executed against the actual Supabase PostgreSQL
  database with the restricted role: RLS read/write isolation, composite ownership
  references, submitted-response immutability, denied history writes, reward
  deduplication, JSON lookup, and denied unscoped reads passed. All fixtures rolled
  back. This does not replace the Python/psycopg end-to-end suite.
- `python manage.py browser`: blocked locally by the missing pinned Chromium
  binary. The cloud browser also previously rejected localhost access. No new
  browser scenarios or visual acceptance are claimed.
- `.github/workflows/verify.yml` runs the real PostgreSQL application tests against
  disposable PostgreSQL 17 and the existing ten-scenario browser suite. Workflow
  results must be observed before claiming those gates passed.
- GitHub publication was blocked by automatic approval review: explicit approval
  was required to upload the changed code/deployment files and create repository
  objects. The user subsequently approved publishing the deployment branch and a
  draft pull request. CI results and Render activation must still be verified.
- Direct Supabase host resolution is unavailable from this editing runtime.
  Local PostgreSQL installation also failed due to environment permissions.

## Recovery and production limits

Until hosted acceptance, keep the existing local application/data as the known
baseline. The hosted schema is additive and independent of SQLite. If deployment
fails, stop the new service and repair it; do not delete learner tables or roll back
the database by deleting migrations. Restore code using a known-good Git revision
only after checking schema compatibility. Back up PostgreSQL and any future stored
artifact bytes and test restoration before relying on the pilot for valuable data.

The pilot is allowlisted. Full account lifecycle, self-service deletion/export,
production monitoring, managed backup policy, and background jobs are not complete.
Render Free sleeps on idle. No paid upgrade or claim of production readiness is
part of this change. Keep provider-specific auth/storage at explicit boundaries so
the Python app and PostgreSQL data can move to a cheaper host later.
