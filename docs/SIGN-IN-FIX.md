# Pilot sign-in and password recovery

This increment keeps the existing Supabase Python SDK. No new dependencies,
database migration, account deletion, or custom identity provider was introduced.

## Behavior

- Show/hide password is keyboard accessible and preserves the typed value. Submitting
  hides the password again; a rejected login preserves it for correction.
- Failed sign-ins return a request reference. Render stderr receives structured
  auth_failure and request_completed entries with that reference, operation, fixed
  provider error classification/status, and timing. No email, password, token,
  cookie, provider exception message, body, or query string is logged by this code.
- Only an actual email_not_confirmed provider error mentions confirmation. Other
  rejected sign-ins direct the learner to check credentials or reset the password.
- Forgot password uses Supabase reset_password_for_email. Unknown/non-allowlisted
  emails receive the same generic result without sending a recovery request.
- Email links return to the exact live origin. The SDK uses implicit recovery
  because this app does not persist a PKCE verifier. Tokens arrive in the URL
  fragment, are removed immediately from browser history and kept only in memory.
- Password completion uses SDK set_session/get_user/update_user. The verified,
  confirmed, non-anonymous account must be allowlisted. Success revokes all local
  app sessions for that learner and clears cookies; the learner signs in again.
  Supabase's own Auth session lifecycle remains provider-managed.

## Verification

Build, unit/HTTP checks and the ten existing real browser scenarios pass locally.
The new HTTPS browser test uses a disposable SQLite database and a simulated Auth
provider; it covers keyboard visibility toggling, rejected login reference, 390px
layout, requesting recovery, token removal and reset completion. Adapter unit tests
cover safe provider-error logging and rejecting an unallowlisted reset identity.
These contract checks do not establish live email delivery or a successful learner
password reset. Six real PostgreSQL application tests require disposable CI Postgres.

Render's existing logs showed repeated POST /api/auth/login 401 responses without
provider diagnostics. The user's email was confirmed and password set. Those old
401s do not establish the precise provider failure. A broader Supabase Auth log
view was blocked by automatic approval review because it might expose other users.
Use the new request reference in the app's Render logs for narrow diagnosis.

## Configuration and recovery

Supabase Site URL changed from http://localhost:3000 to
https://vibelearn-4xws.onrender.com for this pilot. The UI reset form and email links
require the updated deployment. Supabase enforces email/password rules and provider
rate limits; no email provider or paid resource was added. Email delivery and
successful password entry require the learner's participation.

To recover from a code regression, redeploy the previous branch commit. Existing
learner data is unchanged. If rolling back before the recovery handler was added,
do not send new recovery links until a compatible handler is restored.
