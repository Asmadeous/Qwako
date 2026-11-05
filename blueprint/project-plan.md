# Project Plan: T&G BnB

> Owner-maintained planning document. Items marked **TODO** are open decisions the
> owner still has to make; items marked **Assumption** are working defaults that
> can be changed before the related feature is specced.

## 1. Problem - What problem are we solving?

T&G BnB is a UK short-stay booking marketplace (nightly stays, Airbnb-style):

- guests browse stays without an account, see the full price up front in
  pounds sterling, and book confirmed dates in a few steps;
- hosts list UK properties, control availability and pricing, and manage
  reservations and payouts;
- the T&G team moderates the marketplace from an admin dashboard.

The current product is a prototype: a React (Vite) site with an Express +
MongoDB API, 50 demo listings (mostly outside the UK, priced in local
currencies), a Stillform-style editorial home page, a filtered `/stays` page,
listing pages and a basic booking form. It has known gaps that this plan
replaces rather than patches:

- the client sends the booking price and the server trusts it;
- nothing prevents double bookings or checks guest limits;
- photo upload endpoints do not require login;
- the auth middleware throws for logged-out requests;
- search uses unescaped regular expressions;
- there are no roles, dashboards, payments, reviews, wishlists or messaging.

**Decisions:**

- The backend is rebuilt in Ruby on Rails with PostgreSQL and UUID primary keys.
- The product runs on the owner's own server; no third-party app hosting.
- RentNest (github.com/Sohag-Ali/RentNest_Frontend and RentNest_Backend) is used
  only as inspiration for scope and dashboard ideas; no code is copied from it.
  RentNest is a long-term-rental product (request -> approve -> pay); T&G BnB
  books nights on a calendar.

## 2. Users - Who is this for?

| Role | Who | Primary jobs |
| --- | --- | --- |
| Visitor | Anyone on the site, not signed in | Browse the home page, search stays, open listing pages, see prices and availability. Cannot book, save or message. |
| Guest (customer) | Signed-in traveller; every account is a guest by default | Book stays, pay, manage trips, save wishlists, message hosts, review stays, manage profile and settings. |
| Host | A guest who has turned on hosting (one account, two modes, as on Airbnb) | Create and manage listings, set availability and prices, accept or decline requests, message guests, get paid, reply to reviews. |
| Admin | T&G staff | Moderate users, listings, bookings, payments and reviews; change platform settings; see business metrics. |

Market: United Kingdom (England, Scotland, Wales, Northern Ireland). Locale
`en-GB`, currency GBP, time zone Europe/London, dates shown as `5 Nov 2026` /
`05/11/2026`. Most guests will use a phone; every page must work at 360px wide.

## 3. Features - What does the MVP need?

### Public site (no account needed)
- Editorial home page (already built; copy and imagery to be made UK-specific).
- Stays search: destination (town, city or postcode area), check-in/check-out
  dates (only stays free for those nights), guests, price range, property type,
  amenities, sort, pagination, shareable URL with all filters.
- Prices in search results and on listing pages show the **total price
  including all mandatory fees** (cleaning and service fees) for the chosen
  dates, as required by the Digital Markets, Competition and Consumers Act 2024
  rules on drip pricing. Without dates, show the nightly price and say fees are
  added.
- Listing page: photo gallery, title, area (exact address only after booking),
  description, amenities, house rules, sleeping arrangements, max guests,
  check-in/out times, cancellation policy, host card, ratings and reviews,
  availability calendar, price breakdown for chosen dates, and the short-term
  let licence number where one is required (Scotland).
- "Reserve" requires sign-in. A visitor who clicks it is sent to sign-in or
  sign-up and returned to the same listing with dates and guests kept.

### Accounts
- Sign up, sign in, sign out with email and password; Google sign-in later.
- Email verification and password reset by email.
- Profile: name, photo, phone (+44 format by default), bio, languages, location.
- One account can switch between guest mode and host mode.

### Booking and payments
- Server-side quote: nights x nightly price + cleaning fee + guest service fee
  = total, in GBP. VAT on T&G's own fees is shown when applicable (**TODO**).
- Booking rules: minimum/maximum nights, max guests, check-in/out times,
  advance notice, booking window.
- Two booking types per listing: **Instant Book** (confirmed on payment) and
  **Request to Book** (card authorised at request; host has 24 hours to accept;
  captured on acceptance, released on decline or expiry).
- Double bookings are impossible at the database level.
- Payments with **Stripe**: cards with 3-D Secure (Strong Customer
  Authentication), Apple Pay and Google Pay. Unpaid holds expire after
  15 minutes and free the dates.
- Host payouts through **Stripe Connect** (Express accounts): hosts complete
  Stripe's identity and bank checks during onboarding; T&G never holds guest
  money itself. Payout released after check-in.
- Receipts for every payment (with T&G's VAT number if registered).
- Cancellations under the listing's policy (Flexible, Moderate, Strict) with
  automatic refund calculation; hosts can also cancel (guest fully refunded).

### Customer (guest) dashboard - must be complete
- **Overview:** next trip card with photo, dates, countdown and quick actions;
  counts of upcoming trips, saved stays and unread messages; pending reviews;
  recently viewed stays.
- **Trips:** Upcoming / Past / Cancelled tabs; each card shows photo, title,
  dates, guests, status and total.
- **Trip detail:** status timeline (requested -> confirmed -> checked in ->
  completed), full address and map link, check-in instructions and Wi-Fi details
  (revealed after confirmation), host message button, price breakdown, payment
  status, receipt download, cancel (with refund preview), "Book again", leave a
  review after checkout.
- **Wishlists:** heart button on cards and listing pages; named lists; dashboard
  page with lists and stays.
- **Messages:** inbox of conversations with hosts (one per booking or
  pre-booking enquiry), unread badges.
- **Reviews:** stays waiting for a review, reviews written, reviews hosts wrote
  about the guest.
- **Payments:** payment history with status and receipts; saved cards managed
  through Stripe.
- **Notifications:** in-app notification centre plus email.
- **Profile and settings:** edit profile, change password, notification and
  marketing-email preferences, download my data, delete account.

### Host dashboard
- Today view: arrivals and departures today, pending requests, unread messages.
- Listings: create (step-by-step wizard), edit, publish/unpublish, photos with
  ordering and cover photo, amenities, rules, fees, policy, booking type, and
  compliance fields (Scottish licence number; London entire-home night count).
- Calendar: per-listing month view with booked, blocked and available nights;
  block/unblock ranges.
- Reservations: upcoming, pending requests (accept/decline), past, cancelled;
  reservation detail with guest info.
- Payouts: Stripe Connect onboarding status, earnings by month and booking,
  upcoming and paid payouts.
- Reviews: reviews received, reply publicly, review the guest.

### Admin dashboard
- Overview: bookings, revenue, new users, active listings, occupancy; trend
  charts; items needing attention.
- Users: search/filter, view profile and activity, suspend or ban, change roles.
- Listings: moderation queue (new/edited listings go live after approval),
  unlist, feature on home page; flag London entire homes approaching 90 booked
  nights in a calendar year.
- Bookings: search, view detail, cancel on behalf, resolve disputes.
- Payments: list, filter, view Stripe references, issue refunds.
- Reviews: hide abusive reviews, view reports.
- Settings: guest service fee %, host fee %, cancellation policy definitions,
  featured listings, VAT settings.
- Audit log of every admin action.

### Trust, safety, legal and support
- Report a listing, review or user.
- Address and contact details hidden until a booking is confirmed.
- Cookie consent banner for any non-essential cookies (PECR); only essential
  cookies are set before consent.
- Info pages: About, Contact (form), FAQ, Terms, Privacy notice, Cookie policy,
  Cancellation policy.

### Explicit non-goals for the MVP
- Native mobile apps (the web app must be mobile-first instead).
- Map-based search (Phase 2).
- Dynamic or AI pricing, smart locks, channel manager (iCal sync is Phase 2).
- Experiences/tours, co-hosting, languages other than English.
- Currencies other than GBP.

## 4. Data - What are we storing?

All tables use **UUID primary keys** (`gen_random_uuid()` via `pgcrypto`) and
UUID foreign keys. Money is stored as integer pence plus a currency code
(`GBP`); never as floats.

- **users** - email (unique, citext), password_digest, name, phone, avatar,
  bio, languages, roles (guest default, host flag, admin flag), status (active,
  suspended, banned), email_verified_at, marketing_consent_at,
  stripe_customer_id, last_sign_in_at.
- **sessions** - user, token digest, user agent, IP, expires_at (Rails 8
  authentication).
- **host accounts** - user, stripe_connect_account_id, onboarding status,
  payouts_enabled.
- **listings** - host, title, slug, description, property type, room type,
  address lines, town/city, county, postcode, nation (England, Scotland, Wales,
  NI), latitude/longitude, max guests, bedrooms, beds, bathrooms, nightly price,
  cleaning fee, minimum/maximum nights, check-in/out times, booking type
  (instant/request), cancellation policy, house rules, licence number,
  status (draft, pending review, published, unlisted, rejected), featured flag,
  rating average, review count.
- **listing photos** - Active Storage attachments with position and cover flag.
- **amenities** and **listing amenities** - catalogue plus join table.
- **availability blocks** - listing, date range, reason.
- **bookings** - listing, guest, check-in, check-out, guests count, nightly
  price snapshot, nights, cleaning fee, service fee, VAT, total, status
  (pending payment, requested, confirmed, declined, expired, cancelled by
  guest, cancelled by host, completed), expires_at, cancellation details.
  PostgreSQL exclusion constraint on `(listing_id, daterange(check_in,
  check_out))` for active statuses.
- **payments** - booking, Stripe PaymentIntent id, amount, status (requires
  action, authorised, succeeded, failed, refunded, partially refunded),
  idempotency key.
- **refunds** - payment, amount, reason, Stripe refund id, status.
- **payouts** - host, booking, Stripe transfer id, amount, status.
- **stripe events** - event id (unique), type, processed_at (webhook
  idempotency).
- **reviews** - booking, author, subject (listing or guest), overall rating,
  category ratings (cleanliness, accuracy, check-in, communication, location,
  value), comment, host reply, published_at (double-blind release), hidden flag.
- **wishlists** and **wishlist items**.
- **conversations**, **conversation participants**, **messages** (read_at).
- **notifications** - user, type, payload, read_at; **notification preferences**.
- **reports** - reporter, reportable (polymorphic), reason, status.
- **platform settings** - key/value with typed values.
- **audit logs** - admin, action, target, changes, IP.

Card details are never stored by T&G; Stripe holds them.

**TODO:** the 50 current demo listings are mostly outside the UK. Replace them
with UK demo listings for launch, or import them as unpublished drafts.

## 5. Tech - What stack are we using?

| Layer | Choice | Notes |
| --- | --- | --- |
| Backend | Ruby on Rails 8 (API mode), Ruby 3.3 | `rails new backend --api -d postgresql`; lives in `backend/` in this repo. |
| Database | PostgreSQL 16 | UUID PKs via generator default `primary_key_type: :uuid`; `pgcrypto`, `citext`, `btree_gist` extensions. |
| Auth | Rails 8 authentication (has_secure_password + DB sessions) with signed, httpOnly, Secure, SameSite=Lax cookies | Frontend and API share one origin, so cookies stay first-party. Google sign-in via OmniAuth later. |
| Authorization | Pundit policies | Guest/host/admin rules in one place. |
| Background jobs | Solid Queue (inside Puma at first) | Hold expiry, emails, review release, payout release. |
| Email | Action Mailer over SMTP | **TODO:** mail provider or the server's own SMTP relay. |
| Files | Active Storage on the server's disk (persistent volume, backed up) | Move to S3-compatible storage only if needed. |
| Payments | Stripe Payments + Stripe Connect Express | Needs the owner's Stripe account (UK). |
| API | JSON REST under `/api/v1`, consistent error envelope, pagination | OpenAPI document kept in the repo. |
| Frontend | Existing React 18 + Vite + Tailwind + Radix/shadcn-style components | Built to static files and served from the same server; data fetching moves to TanStack Query; forms with React Hook Form + Zod. |
| Tests | Rails Minitest (models, requests, policies) + Vitest + Playwright for key flows | Blueprint `/check` runs the real app. |
| CI | GitHub Actions | Lint, tests, build. |

The Express API in `api/` and the MongoDB database are retired at the
production cutover.

## 6. Monetize - How will this make money?

- Guest service fee: **Assumption** 10% of the subtotal, included in the total
  shown up front.
- Host service fee: **Assumption** 3% deducted from payouts (Stripe Connect
  application fee).
- Featured placement for listings (later).
- Both percentages are admin settings, not code constants.

**TODO:** confirm fee levels and VAT registration (VAT applies to T&G's fees if
registered).

## 7. UI/UX - How should this look and feel?

- **Brand:** T&G BnB. The public site keeps the Stillform-inspired editorial
  style: sand `#EDE6D6` and ink `#2A2725`, Instrument Serif headings, Familjen
  Grotesk body text. Action colour is blue `#2563EB` (owner's request). Home
  page copy and photos to be made UK-specific.
- **Dashboards** use the same palette and fonts in a calmer, denser layout:
  - left sidebar navigation on desktop (collapsible), bottom tab bar on mobile;
  - top bar with mode switch (Guest / Host / Admin when allowed),
    notifications bell and avatar menu;
  - overview pages lead with the one most important thing (next trip, today's
    arrivals, items needing admin attention), then small stat cards, then lists;
  - tables with search, filters, sortable columns and pagination for host and
    admin; cards for guest trips;
  - every list has designed empty, loading (skeleton) and error states;
  - status shown with consistent badges (pending, confirmed, cancelled...).
- References for dashboard patterns (ideas, not copies): Airbnb Trips and Host
  "Today", Booking.com account dashboard, shadcn/ui dashboard and sidebar
  blocks, RentNest tenant/landlord/admin dashboards.
- UK English spelling and formats throughout (£, dd/mm/yyyy, postcodes).
- Accessibility: WCAG 2.2 AA contrast, keyboard navigation, focus rings, alt
  text, reduced-motion support (already in the home page).

## 8. Deployment - Where and how will this ship?

- **Hosting:** the owner's own server. **Assumption:** a Linux server with
  Docker, deployed with **Kamal 2** (ships with Rails 8):
  - one Rails container (Puma + Solid Queue) that also serves the built React
    app from `public/`, so the site and API share one domain;
  - PostgreSQL 16 as a Kamal accessory on the same server, data on a persistent
    volume;
  - Active Storage files on a persistent volume;
  - kamal-proxy handles HTTPS with Let's Encrypt and zero-downtime deploys.
- **TODO from the owner:** server OS and specs, SSH access for deploys, domain
  name, whether PostgreSQL should run on the same server or elsewhere, and
  where off-server backups go.
- Health check `GET /up`. Daily `pg_dump` and file backups copied off the
  server. Error monitoring **TODO** (Sentry, Honeybadger, or server logs only).
- Env vars and secrets (names only, via Kamal secrets): `RAILS_MASTER_KEY`,
  `DATABASE_URL` / `POSTGRES_PASSWORD`, `STRIPE_SECRET_KEY`,
  `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_*`, `APP_HOST`.
- Deployment is done with Kamal to our server only; Blueprint's `/release`
  skill is not used. The Kamal setup is its own build-plan feature, and every
  real deploy needs the owner's explicit approval.

## 9. Usage model and constraints

- Internet-facing UK marketplace with untrusted users; payments involved.
- Expected scale at launch: hundreds of listings and low thousands of users;
  one server, one database.
- Law and regulation that shapes features:
  - UK GDPR and the Data Protection Act 2018: privacy notice, lawful basis,
    data export and deletion on request, minimal personal data;
  - PECR: consent for non-essential cookies and marketing emails;
  - Consumer Contracts Regulations and DMCC Act 2024: clear total price up front
    (no drip pricing), clear cancellation terms;
  - short-term letting rules: Scottish short-term let licence numbers on
    listings; London entire-home lets limited to 90 nights a year without
    planning permission; **TODO:** follow the planned registration scheme for
    England;
  - payments regulation handled by using Stripe Connect rather than holding
    guest money.
- Security requirements: server-side pricing, authorization on every endpoint,
  rate limiting on auth and booking endpoints, signed Stripe webhooks with
  idempotency, no secrets in the repo, admin actions audited.
- Non-requirements for the MVP: multi-region, multi-currency, multi-tenant
  white-labelling, offline mode.
