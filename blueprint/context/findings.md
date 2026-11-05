# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P2] fixed - Sign-in and sign-up accept cross-site form posts (login CSRF)

**File:** backend/app/controllers/api/v1/sessions_controller.rb:11
**Found:** 2026-11-06 by /audit independent (scope: current; lens: security)
**Why it matters:** `SameSite=Lax` plus the CORS allowlist stops cross-site
requests that *carry* the cookie, but it does not stop a cross-site page from
*setting* it. A rolled-back probe confirmed that `POST /api/v1/session` with an
`application/x-www-form-urlencoded` body and `Origin: https://evil.example`
returns 200 and sets `session_id`. `POST /api/v1/registrations` behaves the same
way with `user[...]` fields and returns 201. A plain HTML form needs no CORS
preflight, and browsers store a Lax cookie from a top-level navigation response.
An attacker page can therefore sign a victim into the attacker's account (or
into a newly created one). The impact today is small because accounts only hold
name and email. It grows once bookings and payments run on Rails sessions,
because a victim's booking details would land in the attacker's account. The
spec's CSRF posture is implemented as written; this is a gap in that posture.
**Suggested fix:** In `ApplicationController`, reject non-GET API requests whose
media type is not `application/json` (for example 415 using `render_error`). An
alternative is to reject a present `Origin` header that is not same-origin or on
the CORS allowlist. Add one request test that posts form-encoded credentials and
expects rejection. No current requirement would be lost because the client
always sends JSON.
**Resolution:** Fixed 2026-11-06. `ApplicationController#verify_request_origin` rejects non-GET requests whose `Origin` is neither same-origin nor on the CORS allowlist (403 `forbidden_origin`). Test: "cross-site form posts cannot sign in or sign up".

### F-02 [P3] fixed - A non-object `user` param raises NoMethodError (500) instead of the error JSON

**File:** backend/app/controllers/api/v1/registrations_controller.rb:20
**Found:** 2026-11-06 by /audit independent (scope: current; lens: quality)
**Why it matters:** `params.fetch(:user, {}).permit(...)` assumes `user` is an
object. A rolled-back probe with `{"user":"x"}` or `{"user":["a"]}` raised
`NoMethodError`, which surfaces as a 500. That breaks the spec's statement that
all API errors use the shared error JSON shape. There is no security impact.
Mass assignment is safe: a probe that sent `id` and `password_digest` got a
server-generated id and ignored both fields.
**Suggested fix:** Use `params.expect(user: %i[name email password])` (Rails 8),
which returns 400 for a wrong shape. Alternatively, guard with
`is_a?(ActionController::Parameters)` and fall through to the 422 path. Add a
request test for a string `user`.
**Resolution:** Fixed 2026-11-06. Registrations permit `user` only when it is a parameters object, so other shapes fall through to the 422 path. Test: "sign-up with a non-object user param is a validation failure, not a 500".

### F-03 [P3] fixed - The unique-index race rescue is untested

**File:** backend/app/controllers/api/v1/registrations_controller.rb:25
**Found:** 2026-11-06 by /audit independent (scope: current; lens: tests)
**Why it matters:** The spec requires that "A unique-index race maps to the same
422 as the uniqueness validation". The model test proves that the database
raises `RecordNotUnique`. No test exercises the controller's `rescue`, so a
regression in that branch (wrong attribute, 500, or a session started for an
unsaved user) would go unnoticed.
**Suggested fix:** Add a request test that stubs `User#save` to raise
`ActiveRecord::RecordNotUnique`. Assert a 422 `validation_failed` response with
`details.email` and no new `Session` row.
**Resolution:** Fixed 2026-11-06. Test: "a sign-up that loses the unique-index race still gets the 422" (asserts `details.email` and no new session).

### F-04 [P3] fixed - A new sign-in or sign-up leaves the previous session row valid

**File:** backend/app/controllers/concerns/authentication.rb:31
**Found:** 2026-11-06 by /audit independent (scope: current; lens: security)
**Why it matters:** `start_new_session_for` creates a new row and overwrites the
cookie. It never deletes the session the browser was already using. Cookies are
permanent and rows never expire (spec open question 3), so each re-sign-in in the
same browser leaves an orphaned row. That row stays a valid credential for
anyone holding the old cookie, and the `sessions` table grows without bound.
This matches the Rails generator default, so it is hygiene rather than a defect.
**Suggested fix:** In `start_new_session_for`, call `resume_session&.destroy`
before creating the new row. Track expiry and cleanup with the session-lifetime
decision in open question 3.
**Resolution:** Fixed 2026-11-06. `start_new_session_for` destroys the resumed session first. Test: "signing in again in the same browser replaces the old session". Session expiry stays open with spec question 3.

### F-05 [P3] fixed - Dead legacy profile-edit code still reads auth from localStorage

**File:** client/hooks/index.js:88
**Found:** 2026-11-06 by /audit independent (scope: current; lens: quality)
**Why it matters:** "Edit profile" is no longer rendered, but `updateUser` still
does `JSON.parse(getItemFromLocalStorage('user')).email`, which throws now that
the user is never stored there. `uploadPicture` (line 75) and
`client/src/components/ui/EditProfileDialog.jsx` are unused. Together they keep
a localStorage-auth path that conflicts with the new standard, and that path
would crash if the dialog were re-enabled before feature 3.
**Suggested fix:** Remove `updateUser` and `uploadPicture` from the hook's return
value, remove the `getItemFromLocalStorage` import, and delete or park
`EditProfileDialog.jsx` until feature 3 rebuilds profile editing on Rails.
Requirement lost: None, because the control is already hidden.
**Resolution:** Fixed 2026-11-06. `updateUser` and `uploadPicture` are gone; `EditProfileDialog` now saves through `updateProfile` (`PATCH /api/v1/profile`) and reads no localStorage.
