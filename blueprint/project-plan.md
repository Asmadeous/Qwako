# Project Plan: T&G BnB

> Owner-maintained planning document. Items marked **TODO** are open decisions;
> items marked **Assumption** are working defaults that can be changed before the
> related feature is specced.

## 1. Problem - What problem are we solving?

T&G BnB is the direct-booking website for one client and his own UK
properties: nightly stays with an Airbnb-style booking experience. It is not a
marketplace: there are no third-party hosts, no host sign-ups and no platform
fees.

- Guests browse the properties without an account, see the full price up front
  in pounds sterling, and book confirmed dates in a few steps.
- The owner (and any staff he adds) manages properties, availability, prices,
  bookings, guests and payments from an admin dashboard.

The current code is a prototype: a React (Vite) site with an Express + MongoDB
API, 50 demo listings, a Stillform-style editorial home page, a filtered
`/stays` page, listing pages and a basic booking form. Known gaps that this plan
replaces rather than patches:

- the client sends the booking price and the server trusts it;
- nothing prevents double bookings or checks guest limits;
- photo upload endpoints do not require login;
- the auth middleware throws for logged-out requests;
- search uses unescaped regular expressions;
- there are no roles, dashboards, payments, reviews, wishlists or messaging.

**Decisions:**

- The backend is rebuilt in Ruby on Rails with PostgreSQL and UUID primary keys.
- The site runs on the client's own server, deployed by the client's team. This
  project delivers the code plus a Dockerfile and deployment notes; it needs no
  server access.
- Email goes through the client's own SMTP server.
- The 50 existing listings become the seed data.
- RentNest (github.com/Sohag-Ali/RentNest_Frontend and RentNest_Backend) is
  inspiration only; no code is copied. RentNest is long-term rentals
  (request -> approve -> pay); T&G BnB books nights on a calendar.

## 2. Users - Who is this for?

| Role | Who | Primary jobs |
| --- | --- | --- |
| Visitor | Anyone on the site, not signed in | Browse the home page, search stays, open listing pages, see prices and availability. Cannot book, save or message. |
| Guest (customer) | Signed-in traveller; every sign-up is a guest | Book stays, pay, manage trips, save wishlists, message the owner, review stays, manage profile and settings. |
| Admin | The owner and his staff | Manage properties, calendar, prices, bookings, guests, payments, reviews and messages; see occupancy and revenue. |

Market: United Kingdom. Locale `en-GB`, currency GBP, time zone Europe/London,
dates shown as `5 Nov 2026` / `05/11/2026`. Most guests use a phone; every page
must work at 360px wide.

## 3. Features - What does the MVP need?

### Public site (no account needed)
- Editorial home page (already built; copy and imagery to be made UK-specific).
- Stays search: destination (town, city or postcode area), check-in/check-out
  dates (only stays free for those nights), guests, price range, property type,
  amenities, sort, pagination, shareable URL with all filters.
- Prices show the **total including all mandatory charges** (such as cleaning)
  for the chosen dates, as the DMCC Act 2024 drip-pricing rules require.
  Without dates, show the nightly price and say which charges are added.
- Listing page: photo gallery, title, area (exact address only after booking),
  description, amenities, house rules, sleeping arrangements, max guests,
  check-in/out times, cancellation policy, ratings and reviews, availability
  calendar, price breakdown for chosen dates, and the short-term let licence
  number where one is required (Scotland).
- "Reserve" requires sign-in. A visitor who clicks it is sent to sign-in or
  sign-up and returned to the same listing with dates and guests kept.

### Accounts
- Sign up, sign in, sign out with email and password; Google sign-in later.
- Email verification and password reset by email.
- Profile: name, photo, phone (+44 format by default), location.
- Admin accounts are created by the owner, never by public sign-up.

### Booking and payments
- Server-side quote: nights x nightly price + cleaning charge = total, in GBP.
  No service fees.
- Booking rules per property: minimum/maximum nights, max guests, check-in/out
  times, advance notice, booking window.
- Two booking types per property: **Instant Book** (confirmed on payment) and
  **Request to Book** (card authorised at request; the owner has 24 hours to
  accept; captured on acceptance, released on decline or expiry).
- Double bookings are impossible at the database level.
- Payments with **Stripe** paid straight into the client's Stripe account:
  cards with 3-D Secure, Apple Pay and Google Pay. Unpaid holds expire after
  15 minutes and free the dates.
- Receipts for every payment.
- Cancellations under the property's policy (Flexible, Moderate, Strict) with
  automatic refund calculation; the owner can also cancel (guest fully
  refunded).

### Customer (guest) dashboard - must be complete
- **Overview:** next trip card with photo, dates, countdown and quick actions;
  counts of upcoming trips, saved stays and unread messages; stays waiting for
  a review; recently viewed stays.
- **Trips:** Upcoming / Past / Cancelled tabs; each card shows photo, title,
  dates, guests, status and total.
- **Trip detail:** status timeline (requested -> confirmed -> checked in ->
  completed), full address and map link, check-in instructions and Wi-Fi details
  (revealed after confirmation), message button, price breakdown, payment
  status, receipt download, cancel (with refund preview), "Book again", leave a
  review after checkout.
- **Wishlists:** heart button on cards and listing pages; named lists; dashboard
  page with lists and stays.
- **Messages:** conversations with the owner (one per booking or pre-booking
  enquiry), unread badges.
- **Reviews:** stays waiting for a review and reviews written.
- **Payments:** payment history with status and receipts.
- **Notifications:** in-app notification centre plus email.
- **Profile and settings:** edit profile, change password, notification and
  marketing-email preferences, download my data, delete account.

### Admin dashboard (owner)
- **Overview:** today's arrivals and departures, pending requests, unread
  messages, occupancy and revenue this month, trend charts.
- **Properties:** create (step-by-step), edit, publish/unpublish, photos with
  ordering and cover photo, amenities, rules, prices, cleaning charge, booking
  rules, policy, booking type, licence number.
- **Calendar:** month view across properties with booked, blocked and free
  nights; block/unblock ranges.
- **Bookings:** search and filter; accept/decline requests; booking detail with
  guest info; cancel; issue refunds.
- **Guests:** search, view a guest's bookings and messages, suspend an account.
- **Payments:** list, filter, Stripe references, refunds, totals.
- **Messages:** inbox of guest conversations.
- **Reviews:** read reviews, reply publicly, hide abusive ones.
- **Settings:** staff accounts, cancellation policy definitions, check-in
  instructions templates, featured properties on the home page.
- **Audit log** of admin actions (who changed what and when).

### Trust, legal and support
- Address and contact details hidden until a booking is confirmed.
- Cookie consent banner for any non-essential cookies (PECR); only essential
  cookies are set before consent.
- Info pages: About, Contact (form), FAQ, Terms, Privacy notice, Cookie policy,
  Cancellation policy.

### Explicit non-goals for the MVP
- Third-party hosts, host sign-up, platform fees or payouts.
- Native mobile apps (the web app is mobile-first instead).
- Map-based search, iCal/channel sync, dynamic pricing (Phase 2).
- Languages other than English; currencies other than GBP.

## 4. Data - What are we storing?

All tables use **UUID primary keys** (`gen_random_uuid()` via `pgcrypto`) and
UUID foreign keys. Money is stored as integer pence; never as floats.

- **users** - email (unique, citext), password_digest, name, phone, avatar,
  role (guest, admin), status (active, suspended), email_verified_at,
  marketing_consent_at, stripe_customer_id, last_sign_in_at.
- **sessions** - user, token, user agent, IP, expires_at (Rails 8
  authentication).
- **listings** - title, slug, description, property type, address lines,
  town/city, county, postcode, nation, latitude/longitude, max guests,
  bedrooms, beds, bathrooms, nightly price, cleaning charge, minimum/maximum
  nights, check-in/out times, booking type (instant/request), cancellation
  policy, house rules, check-in instructions, Wi-Fi details, licence number,
  status (draft, published, unlisted), featured flag, rating average, review
  count.
- **listing photos** - Active Storage attachments with position and cover flag
  (seed listings keep their image URLs).
- **amenities** and **listing amenities**.
- **availability blocks** - listing, date range, reason.
- **bookings** - listing, guest, check-in, check-out, guests count, nightly
  price snapshot, nights, cleaning charge, total, status (pending payment,
  requested, confirmed, declined, expired, cancelled by guest, cancelled by
  owner, completed), expires_at, cancellation details. PostgreSQL exclusion
  constraint on `(listing_id, daterange(check_in, check_out))` for active
  statuses.
- **payments** - booking, Stripe PaymentIntent id, amount, status,
  idempotency key; **refunds**; **stripe events** (webhook idempotency).
- **reviews** - booking, author, overall and category ratings (cleanliness,
  accuracy, check-in, communication, location, value), comment, owner reply,
  hidden flag.
- **wishlists** and **wishlist items**.
- **conversations** and **messages** (read_at).
- **notifications** and **notification preferences**.
- **settings** - key/value.
- **audit logs** - admin, action, target, changes, IP.

Card details are never stored; Stripe holds them.

**Seed data:** the 50 existing listings (titles, descriptions, photos,
amenities, guest limits) are loaded by `db/seeds.rb`, with prices converted to
GBP, plus one admin account and one demo guest with sample bookings for
development.

## 5. Tech - What stack are we using?

| Layer | Choice | Notes |
| --- | --- | --- |
| Backend | Ruby on Rails 8 (API mode), Ruby 3.3 | Lives in `backend/` in this repo. |
| Database | PostgreSQL 16 | UUID PKs by default (`primary_key_type: :uuid`); `pgcrypto`, `citext`, `btree_gist` extensions. |
| Auth | Rails 8 authentication (has_secure_password + DB sessions), signed httpOnly Secure SameSite=Lax cookies | Site and API share one origin. Google sign-in later. |
| Authorization | Pundit policies | Guest and admin rules in one place. |
| Background jobs | Solid Queue (inside Puma) | Hold expiry, emails, booking completion. |
| Email | Action Mailer over the client's SMTP server | `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`. |
| Files | Active Storage on local disk (persistent volume) | |
| Payments | Stripe (client's own account) | |
| API | JSON REST under `/api/v1`, consistent error format, pagination | |
| Frontend | Existing React 18 + Vite + Tailwind + Radix/shadcn-style components | Built to static files and served by Rails; TanStack Query for data; React Hook Form + Zod for forms. |
| Tests | Rails Minitest + Vitest + Playwright for key flows | |
| CI | GitHub Actions | Lint, tests, build. |

The Express API in `api/` and MongoDB are removed once Rails covers everything.

## 6. Monetize - How will this make money?

The client earns the nightly rate and cleaning charge for his own properties.
There are no platform or service fees. **TODO:** whether the client is
VAT-registered (holiday lets are standard-rated for VAT), which decides whether
receipts show VAT.

## 7. UI/UX - How should this look and feel?

- **Brand:** T&G BnB. Public pages keep the Stillform-inspired editorial style:
  sand `#EDE6D6` and ink `#2A2725`, Instrument Serif headings, Familjen Grotesk
  body text, blue `#2563EB` for actions (owner's request).
- **Dashboards** follow UI/UX Pro Max's hospitality guidance (warm neutrals,
  clean Swiss-style layout, gold accent for highlights; green for free nights,
  grey for booked):
  - left sidebar on desktop (collapsible), bottom tab bar on mobile;
  - top bar with notifications bell and avatar menu;
  - each overview leads with the most important thing (next trip for guests;
    today's arrivals for the owner), then stat cards, then lists and charts;
  - tables with search, filters, sorting and pagination for admin; cards for
    guest trips;
  - every list has designed empty, loading (skeleton) and error states;
  - consistent status badges with text, never colour alone;
  - buttons disable and show progress while saving; visible form labels;
    44px touch targets.
- References (ideas only): Airbnb Trips and Host "Today", Booking.com account
  dashboard, shadcn/ui dashboard blocks, RentNest dashboards.
- UK English spelling and formats (£, dd/mm/yyyy, postcodes).
- Accessibility: WCAG 2.2 AA, keyboard navigation, focus rings, alt text,
  reduced-motion support.

## 8. Deployment - Where and how will this ship?

- The client's team deploys to the client's own server. This project provides:
  - a production `Dockerfile` (Rails serving the API and the built React app on
    one domain, health check `GET /up`);
  - `.env.example` listing every variable by name;
  - `DEPLOY.md` covering build, database setup, migrations, seeds, SMTP,
    Stripe webhook URL, file storage volume and backups.
- Env vars (names only): `RAILS_MASTER_KEY`, `DATABASE_URL`,
  `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `SMTP_ADDRESS`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`,
  `APP_HOST`.
- Blueprint's `/release` skill is not used.

## 9. Usage model and constraints

- Internet-facing site with untrusted users; payments involved.
- Scale: one owner, a small portfolio of properties, hundreds to low thousands
  of guests a year; one server, one database.
- Law that shapes features: UK GDPR and Data Protection Act 2018 (privacy
  notice, data export and deletion); PECR (cookie and marketing consent);
  Consumer Contracts Regulations and DMCC Act 2024 (total price up front, clear
  cancellation terms); Scottish short-term let licence numbers; London
  entire-home lets limited to 90 nights a year without planning permission.
- Security: server-side pricing, authorization on every endpoint, rate limiting
  on sign-in and booking endpoints, signed Stripe webhooks with idempotency, no
  secrets in the repo, admin actions audited.
- Non-requirements: multi-region, multi-currency, marketplace features,
  offline mode.
