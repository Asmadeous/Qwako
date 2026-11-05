# T&G BnB

The direct-booking website for one owner's UK holiday lets. Guests browse stays
and book nights; the owner manages properties and bookings.

- `backend/` - Rails 8.1 API (Ruby 4.0, PostgreSQL), JSON under `/api/v1`,
  cookie sessions, Active Storage for photos.
- `client/` - React 18 + Vite + Tailwind site.

## Getting started

Requirements: Ruby 4.0, PostgreSQL, Node 20+ and Yarn.

```bash
cd backend
bin/setup --skip-server   # gems, databases, migrations
bin/rails db:seed         # amenities, 50 listings, a dev admin
bin/rails server          # http://localhost:3000
```

```bash
cd client
yarn install
yarn dev                  # http://localhost:5173
```

The Vite dev server proxies `/api/v1` and `/rails` to Rails, so the client talks
to the API same-origin. Set `RAILS_API_URL` if Rails runs elsewhere.

In development the seed creates the admin `admin@tgbnb.test` with password
`admin-dev-password`. Override them with `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD`; production seeds no admin unless both are set.

## Checks

Run these from `backend/`:

```bash
bin/rails test
bin/rubocop
bin/brakeman --no-pager
bin/bundler-audit
```

Build the client with `yarn build` from `client/`.

## Features today

- Email sign-up, sign-in and sign-out with Rails cookie sessions.
- Search and filter stays, and view a listing page with photos, amenities and
  house rules.
- Book nights with a price calculated by the server. The database refuses
  overlapping bookings. See your bookings.
- Edit your profile, photo and password.
- Admins create and edit listings and upload photos.

The roadmap lives in `blueprint/build-plan.md`.
