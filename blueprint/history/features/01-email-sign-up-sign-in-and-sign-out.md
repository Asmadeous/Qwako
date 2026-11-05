# Feature: Email sign-up, sign-in and sign-out

**From build-plan:** feature 1
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/email-sign-up-sign-in-and-sign-out`

## Goal

Guests can create an account with name, email and password, sign in, stay
signed in across reloads, and sign out, all against the new Rails API using
Rails 8 database sessions in a signed httpOnly cookie. The React client's
auth moves off the Express API and localStorage tokens.

## In scope

- `users` and `sessions` tables, `User` and `Session` models, `Current`, and an
  `Authentication` concern, starting from `bin/rails g authentication`.
- Cookie support in API mode (cookies middleware plus `ActionController::Cookies`).
- JSON endpoints: sign up, sign in, sign out, current user (contracts below).
- Rate limiting on sign-in and sign-up.
- Client: a Rails axios instance; `useProvideAuth` loads the current user from
  Rails on start and signs up/in/out through Rails; no auth data in localStorage.
- Login and Register pages: visible labels, autocomplete hints, inline field
  errors, announced form errors, disabled button with progress while
  submitting, input kept on error (password field cleared on failed sign-in).
- Remove the Google button from Login and Register (it signs into Express).
- Hide the "Edit profile" control on `/account` (it writes to the legacy
  Express/Mongo user and crashes without the localStorage user).
- Backend tests for the model rules and every endpoint outcome.

## Out of scope

- Email verification and password reset (feature 2). Delete the generator's
  `PasswordsController`, `PasswordsMailer`, password views and routes.
- Profile editing, photo, roles, admin accounts (feature 3).
- Return-to-listing after sign-in (feature 8). Sign-in and sign-up keep
  redirecting to `/`.
- Google sign-in (feature 27).
- Porting bookings, places or uploads off Express. Those legacy calls stop
  authenticating once auth moves to Rails (see Open questions).
- Client test runner (none configured).

## Build loop

Build one small step at a time. `workflow.stepReview` is `feature`: produce one
review packet after all steps. `workflow.checkpointCommits` is `disabled`: offer
no step commits. `/complete` makes the final feature commit. Never accept a
review packet you have not read; split any diff that is too large to review.

## Build steps

- [x] **Step 1 - Users, sessions and cookie plumbing** - run
  `bin/rails g authentication`, then adapt: rename `email_address` to `email`
  as `citext` with a unique index; add `name`; UUID PK/FKs (generator default);
  delete password-reset parts; enable cookies in API mode; make
  `Authentication` JSON-only (no redirects) and resolve the session from the
  signed `session_id` cookie. Add `User` validations and email normalization.
  *Done when:* `bin/rails db:migrate` succeeds, `db/schema.rb` shows `users.email`
  citext unique and UUID keys, and model tests for the rules below pass.
- [x] **Step 2 - Auth endpoints** - `Api::V1::RegistrationsController#create`,
  `Api::V1::SessionsController#create/show/destroy`, routes under `/api/v1`,
  the shared error JSON shape, and `rate_limit` on both creates.
  *Done when:* request tests cover sign-up success and each 422, sign-in success,
  wrong password and unknown email (same 401), current user signed in and out,
  sign-out revoking the session (old cookie then reads `user: null`), 429 after
  the limit, and no response containing `password_digest`; `bin/rails test`,
  `bin/rubocop` and `bin/brakeman` are clean.
- [x] **Step 3 - Client auth on Rails** - add the Rails axios instance; rewrite
  `useProvideAuth` to call Rails, load `GET /session` on start (keeping
  `loading` true until it returns), and drop localStorage user/token and
  `googleLogin`; remove the `Authorization` header setup in `App.jsx`.
  *Done when:* with both servers running, signing up lands on `/` signed in,
  reload keeps the header avatar signed in, sign-out from `/account` returns to
  signed-out state, and localStorage holds no `user` or `token`.
- [x] **Step 4 - Login and Register forms** - labels, `autocomplete`
  (`name`, `email`, `current-password` / `new-password`), field errors from the
  422 `details` tied to inputs with `aria-describedby` and `aria-invalid`, a
  `role="alert"` form error for 401/429/network errors, focus moved to the first
  invalid field, disabled submit with progress text, Google buttons removed,
  "Edit profile" hidden on `/account`. *Done when:* in the browser at 360px and
  desktop, a duplicate email shows the field error under Email, a wrong password
  shows the form error and clears only the password, double-clicking submit sends
  one request, and `yarn build` passes.

## Files / areas

- `backend/config/application.rb` (cookies middleware), `config/routes.rb`
- `backend/db/migrate/*_create_users.rb`, `*_create_sessions.rb`, `db/schema.rb`
- `backend/app/models/user.rb`, `session.rb`, `current.rb`
- `backend/app/controllers/application_controller.rb`,
  `controllers/concerns/authentication.rb`,
  `controllers/api/v1/registrations_controller.rb`,
  `controllers/api/v1/sessions_controller.rb`
- `backend/test/models/user_test.rb`, `test/fixtures/users.yml`,
  `test/integration/` or `test/controllers/api/v1/` request tests,
  `config/environments/test.rb` (cache store for rate limits)
- `client/src/utils/axios.js`, `client/hooks/index.js`,
  `client/src/providers/UserProvider.jsx`, `client/src/App.jsx`,
  `client/src/pages/LoginPage.jsx`, `RegisterPage.jsx`, `ProfilePage.jsx`
- `AGENTS.md` (client env var `VITE_API_URL`), `coding-standards.md` (the two
  axios instances, the error shape once built)

## Data / contracts

**users**: `id` uuid PK; `email` citext not null, unique index, stored stripped
and lowercased; `name` string not null; `password_digest` string not null;
timestamps. Validation: email present, `URI::MailTo::EMAIL_REGEXP`, unique;
name present, at most 100 characters after stripping; password 8 to 72
characters (bcrypt limit) on create. A unique-index race maps to the same 422
as the uniqueness validation.

**sessions**: `id` uuid PK; `user_id` uuid FK not null, indexed, cascade on
user delete; `ip_address`, `user_agent` strings; timestamps. A session is valid
while its row exists; sign-out deletes the row.

**Cookie**: `session_id`, signed, httpOnly, `SameSite=Lax`, `Secure` in
production, permanent (generator default). It carries only the session id. The
CSRF defence is `SameSite=Lax` plus the CORS allowlist; sign-out is `DELETE`.

**User JSON** (only these keys): `{ "id": "<uuid>", "email": "...", "name": "..." }`

**Error JSON** (all API errors):
`{ "error": { "code": "<snake_case>", "message": "<user-facing text>", "details": { "<field>": ["..."] } } }`
(`details` only for `validation_failed`).

| Method and path | Body | Success | Errors |
| --- | --- | --- | --- |
| `POST /api/v1/registrations` | `{ "user": { "name", "email", "password" } }` | 201 `{ "user": {...} }`, session cookie set | 422 `validation_failed` with `details`; 429 `rate_limited` |
| `POST /api/v1/session` | `{ "email", "password" }` | 200 `{ "user": {...} }`, new session row and cookie | 401 `invalid_credentials` "Email or password is incorrect." for unknown email and wrong password alike; 429 `rate_limited` |
| `GET /api/v1/session` | none | 200 `{ "user": {...} }` or 200 `{ "user": null }` | none |
| `DELETE /api/v1/session` | none | 204, row deleted, cookie cleared; also 204 when signed out | none |

Rate limit: 10 requests per 3 minutes per IP on each create, using Rails 8
`rate_limit`; the test environment must use a store where it actually counts.

**Client env**: the Rails instance base URL is `${VITE_API_URL || ''}/api/v1`
with `withCredentials: true`. In development Vite proxies `/api/v1` to Rails
(`RAILS_API_URL`, default `http://localhost:3000`), so calls are same-origin as
in production; `VITE_API_URL` is only an override. `VITE_BASE_URL` keeps
pointing at the legacy API. (Revised during implementation: the existing `/api`
proxy would otherwise have sent `/api/v1` to Express.)

## Testing

- Test gate on: `cd backend && bin/rails test`. Required tests: `User`
  normalization, uniqueness (case-insensitive), name and password rules; every
  endpoint row above, including revocation, 429 and absence of
  `password_digest`. Use `travel_to` or a fresh store so rate-limit tests are
  deterministic.
- Client has no runner: verify steps 3-4 in the browser (both dev servers,
  360px and desktop) plus `yarn build`.
- Do not claim Secure-cookie behaviour in production; it is not observable
  locally.

## Notes for the AI

- The trusted actor is `Current.session.user` from the signed cookie; never a
  client-supplied user id.
- Generic 401 text for both unknown email and wrong password; still run
  `authenticate_by` so timing does not reveal which.
- `ActionController::API` has no cookies; add `ActionDispatch::Cookies` to the
  middleware and include `ActionController::Cookies`. Do not add session-store
  middleware.
- Strip the generator's HTML redirects and `allow_unauthenticated_access` page
  wording; respond JSON everywhere.
- Keep the second axios instance in `src/utils/axios.js`, not ad hoc.
- Do not touch `api/` (Express).
- UK English in all UI text ("Sign in", "Sign up", "Sign out").

## Open questions

These have working defaults in the spec; confirm or change them at review.

1. **Legacy features stop authenticating.** Once auth is on Rails, Express-only
   flows that need a login (booking from a listing, `/account/places`,
   `/account/bookings`) fail until features 8, 13 and 20 rebuild them. The site
   is pre-launch, so the spec accepts this. Alternative: keep Express auth in
   parallel, which means two account systems.
2. **Password length 8-72** and **name up to 100** characters are not in the
   plan. 8 is the common NCSC/NIST floor; 72 is bcrypt's limit.
3. **Session lifetime** uses the Rails 8 default (permanent signed cookie,
   revoked on sign-out). The plan's `sessions.token` / `expires_at` are not
   added; say if you want a fixed expiry (for example 30 days) now.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":10152,"specSha256":"b56e39b1d6f6775e138213324e102bcd51c86674e5d6b5ad212f9e9aad99dbe5","branch":"refs/heads/feature/email-sign-up-sign-in-and-sign-out","head":"373ca58649483d6e16508861dbaccfe1a0a1a713","baseRef":"refs/heads/main","baseCommit":"0a955126ec1a21939df102a9d4f7b46f1fb0d4bd","sourceTree":"bcbbdaba25ca773d8693666c7eb79e9a8f0bc12c","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 373ca58649483d6e16508861dbaccfe1a0a1a713
**Base commit:** 0a955126ec1a21939df102a9d4f7b46f1fb0d4bd
**Base ref:** main
**Spec hash:** b56e39b1d6f6775e138213324e102bcd51c86674e5d6b5ad212f9e9aad99dbe5
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-11-05T23:27:35Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-05T23:31:41Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

### Handoff

Review the active spec and the complete `0a955126ec1a21939df102a9d4f7b46f1fb0d4bd..373ca58649483d6e16508861dbaccfe1a0a1a713` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

### Commands

- `git rev-parse HEAD` / `git merge-base main HEAD` / `sha256sum blueprint/context/current-feature.md` / `git status --short`: pass (fresh; only review.md differed)
- `cd backend && bin/rails test`: pass (23 runs, 84 assertions, 0 failures, 0 errors, 0 skips)
- `cd backend && bin/rubocop`: pass (32 files, no offenses)
- `cd backend && bin/brakeman --no-pager -q`: pass (0 security warnings)
- `cd backend && bin/bundler-audit`: pass (no vulnerabilities in the local advisory DB; not updated)
- `cd client && yarn build`: pass (pre-existing Tailwind and react-toastify warnings only)
- `RAILS_ENV=test bin/rails runner <scratch probe>` (two probes, each in a transaction rolled back): ran. It confirmed that a cross-site form-encoded sign-in returns 200 and sets `session_id` (F-01), that `{"user":"x"}` raises NoMethodError (F-02), and that extra `id`/`password_digest` params are ignored.

### Evidence

- Reviewed the full `0a95512..373ca58` delta (31 files), excluding review.md and findings.md: backend models, migrations, schema, Authentication concern, ApplicationController, both API controllers, routes, config, tests, the client hook, axios, Vite proxy, Login/Register/Profile pages, AuthField, AGENTS.md and coding-standards.md.
- Cookie: signed, httpOnly, SameSite=Lax, `secure: Rails.env.production?` (plus `force_ssl`), permanent, carrying only the session id. The test asserts httponly and SameSite=Lax.
- Revocation: `DELETE /session` destroys the row. The test replays the old cookie and gets `user: null`.
- Enumeration and timing: `authenticate_by` hashes on unknown email. Wrong password and unknown email give identical 401 bodies (tested). Sign-up reveals a taken email by design (spec), behind the rate limit.
- Rate limit: 10 per 3 minutes per IP on both creates, using a memory_store in test cleared per test. Both 429s are tested. Production uses solid_cache_store.
- JSON exposure: `user_json` allowlists id, email and name. Tests assert exact keys and no `password` in the body.
- Mass assignment: strong params permit only name, email and password.
- Generator password-reset parts are absent from `app/`.
- Client: the session loads on start with `loading` held; localStorage user and token are cleared; there is no Authorization header; labels, autocomplete, aria-invalid/aria-describedby, role=alert, focus on the first invalid field, a double-submit guard, and the password is cleared on invalid_credentials.
- Done-when coverage: every Step 2 request outcome is tested. Step 1 model rules are tested. Steps 3 and 4 are browser-only, with no client runner.

### Findings

- F-01 [P2] open: login CSRF through cross-site form posts to sign-in and sign-up
- F-02 [P3] open: a non-object `user` param causes a 500
- F-03 [P3] open: the unique-index race rescue is untested
- F-04 [P3] open: re-sign-in leaves the previous session row valid
- F-05 [P3] open: dead updateUser/uploadPicture/EditProfileDialog still read localStorage

### Remaining risk

- `/check` was not run (not required). Browser done-whens for Steps 3 and 4 (360px and desktop, duplicate-email field error, double-click sends one request, reload persistence) were not re-observed by this reviewer.
- No client test runner, so client auth-flow logic has only build evidence.
- Secure-cookie behaviour and rate-limit IP attribution behind the production proxy (`request.remote_ip`, trusted proxies) are not observable locally.
- The pre-existing `config/initializers/cors.rb` (outside the delta) defaults `CORS_ORIGINS` to `http://localhost:5173` with credentials when unset in production.
- bundler-audit used the local advisory database without updating it, so it is not a current vulnerability scan.
- Session rows never expire (spec open question 3 still open).

## Try it now

With PostgreSQL running: start Rails (`cd backend && bin/rails server`) and the
client (`cd client && yarn dev`), then open http://localhost:5173.

1. Go to `/register`, create an account. You land on `/` signed in (avatar in
   the header). Reload: you stay signed in.
2. Open `/account` and press **Sign out**. The header shows the signed-out icon.
3. Go to `/register` again with the same email in different capitals: the error
   "Email is already registered" appears under Email and focus moves there.
4. Go to `/login` with the right email and a wrong password: "Email or password
   is incorrect." appears, the email stays, the password clears.

Listings and bookings still need the legacy Express API (`cd api && yarn start`).
