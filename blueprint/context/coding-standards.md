# Coding Standards

> Tuned by `/onboard` for this repo: a Rails 8 API in `backend/` and a React +
> Vite client in `client/`.

## Backend (Rails, `backend/`)

- Rails 8.1 in API mode, Ruby 4.0, PostgreSQL. Follow Rails conventions over
  custom structure.
- JSON REST endpoints under `/api/v1` (`Api::V1::` controllers in
  `app/controllers/api/v1/`).
- Errors use `render_error` in `ApplicationController`:
  `{ "error": { "code", "message", "details"? } }`, where `details` maps field
  names to full messages for `validation_failed` (422). Render records with an
  explicit attribute allowlist (for example `user_json`), never `to_json` on a
  model.
- Auth: `Current.user` from the signed `session_id` cookie. Controllers require
  sign-in by default; opt out with `allow_unauthenticated_access`.
- > TODO: settle pagination format in the first feature that returns a list.
- Every table uses UUID primary and foreign keys (the generator default is set in
  `config/application.rb`). Use `t.references ..., type: :uuid`.
- Money is integer pence (`*_pence` columns), never floats or decimals.
- Emails are `citext`. Booking overlap is prevented by a PostgreSQL exclusion
  constraint, not by application checks alone.
- Schema changes only through migrations (`bin/rails g migration`), never by
  editing `db/schema.rb`. Run `bin/rails db:migrate` and commit the updated
  schema with the migration.
- Strong parameters for all writes. Validate in models; enforce critical
  invariants (uniqueness, foreign keys, not-null, exclusions) in the database too.
- Authorization with Pundit policies on every endpoint once roles exist. Scope
  user-owned queries by the signed-in user (`Current.user`), never by a
  client-supplied id. Prices, totals and availability are computed on the server.
- Auth uses Rails 8 authentication (has_secure_password + database sessions) with
  signed httpOnly, Secure, SameSite=Lax cookies.
- Background work through Active Job on Solid Queue; email through Action Mailer.
- Time zone is Europe/London (`config.time_zone = "London"`). Dates are `Date`,
  instants are `Time.zone` values.
- Style: rubocop-rails-omakase (`bin/rubocop`). Brakeman and bundler-audit must
  stay clean.

## Client (React, `client/`)

- React 18 function components and hooks, JavaScript (`.jsx`), no TypeScript.
- Vite build; import from `src` with the `@/` alias.
- Pages in `src/pages/`, shared components in `src/components/ui/`, context
  providers in `src/providers/`, helpers in `src/utils/`.
- HTTP through the one shared instance `api` in `src/utils/axios.js` (Rails
  `/api/v1`, cookies included). Use its `fieldErrorsFrom`/`errorMessageFrom`
  helpers for error JSON. Do not create ad-hoc axios clients. Never store auth data in localStorage.
- Planned for new data and form code (introduce with the first feature that
  needs it, not before): TanStack Query for server data, React Hook Form + Zod
  for forms.
- Prettier with `singleQuote` and the Tailwind class-sorting plugin.

## Naming

- Ruby: snake_case methods and files, CamelCase classes, SCREAMING_SNAKE_CASE
  constants.
- React: PascalCase component files (`PlaceCard.jsx`), camelCase functions and
  helpers.

## Styling

- Tailwind CSS v3 with `tailwind.config.cjs`; shadcn-style components in
  `src/components/ui/`.
- Public pages: sand `#EDE6D6`, ink `#2A2725`, Instrument Serif headings
  (`font-serif`), Familjen Grotesk body (`font-grotesk`), blue `#2563EB` for
  actions.
- Mobile first: every page works at 360px; 44px touch targets; visible labels;
  WCAG 2.2 AA.
- UK English and formats: GBP (`£`), `en-GB` dates, UK postcodes.
- No inline styles except for values computed at runtime.

## Error Handling

- API errors return a consistent JSON body with an appropriate HTTP status;
  never leak stack traces or internal messages.
- Client shows a user-friendly message (toast or inline field error) and keeps
  the user's input.

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, server actions. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Client test files, once Vitest exists, live next to source files.
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding: the backend uses Minitest (`bin/rails test`) with fixtures in
`test/fixtures/`, and `travel_to` for time-dependent logic. Model, policy and
service tests cover pricing, availability and permission rules; request tests
cover endpoint contracts. The client has no runner yet; Vitest is the planned
choice. Ruby test files live under `backend/test/` mirroring `app/`.

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- Browser automation is separately opt-in through `/tests browser`. That setup
  reuses a compatible runner or prefers Playwright for supported projects, then
  documents the exact command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity, real authenticated-profile
  behavior, browser chrome, or another claim the test does not observe.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use the available dev server, browser
  screenshots, build output, API output, or manual evidence instead.
- Browser tests are not part of the default Verify command or CI unless the user
  separately chooses that slower gate.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
