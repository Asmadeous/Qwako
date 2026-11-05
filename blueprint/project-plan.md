# Project Plan: T&G BnB

> Owner-maintained planning document. Items marked **TODO** are open decisions the
> owner still has to make; items marked **Assumption** are working defaults that
> can be changed before the related feature is specced.

## 1. Problem - What problem are we solving?

Travellers who want a short stay in Kenya and beyond have to piece the trip
together from social media posts, WhatsApp chats and agents, with no reliable
availability, unclear total prices and no protection when something goes wrong.
Hosts juggle bookings by hand and risk double bookings.

T&G BnB is a short-stay booking marketplace (nightly stays, Airbnb-style):

- guests browse hand-picked stays without an account, see the full price in the
  stay's local currency, and book confirmed dates in a few steps;
- hosts list properties, control availability and pricing, and manage
  reservations and earnings;
- the T&G team moderates the marketplace from an admin dashboard.

The current product is a working prototype: a React (Vite) site deployed on
Vercel with an Express + MongoDB API, 50 seeded listings, a Stillform-style
editorial home page, a filtered `/stays` page, listing pages and a basic booking
form. It has known gaps that this plan replaces rather than patches:

- the client sends the booking price and the server trusts it;
- nothing prevents double bookings or checks guest limits;
- photo upload endpoints do not require login;
- the auth middleware throws for logged-out requests;
- search uses unescaped regular expressions;
- there are no roles, dashboards, payments, reviews, wishlists or messaging.

**Decision:** the backend is rebuilt in Ruby on Rails with PostgreSQL and UUID
primary keys. RentNest (github.com/Sohag-Ali/RentNest_Frontend and
RentNest_Backend) is used only as inspiration for scope and dashboard ideas; no
code is copied from it. RentNest is a long-term-rental product
(request -> approve -> pay); T&G BnB books nights on a calendar.

## 2. Users - Who is this for?

| Role | Who | Primary jobs |
| --- | --- | --- |
| Visitor | Anyone on the site, not signed in | Browse the home page, search stays, open listing pages, see prices and availability. Cannot book, save or message. |
| Guest (customer) | Signed-in traveller; every account is a guest by default | Book stays, pay, manage trips, save wishlists, message hosts, review stays, manage profile and settings. |
| Host | A guest who has turned on hosting (one account, two modes, as on Airbnb) | Create and manage listings, set availability and prices, accept or decline requests, message guests, track earnings, reply to reviews. |
| Admin | T&G staff | Moderate users, listings, bookings, payments and reviews; change platform settings; see business metrics. |

Primary markets: Kenya first (Nairobi, coast, Rift Valley), plus international
stays already in the catalogue. Most guests will use a phone; the dashboard must
work well at 360px wide.

## 3. Features - What does the MVP need?

### Public site (no account needed)
- Editorial home page (already built) linking into search and featured stays.
- Stays search: destination text, check-in/check-out dates (only stays free for
  those nights), guests, price range, property type, amenities, sort, pagination,
  shareable URL with all filters.
- Listing page: photo gallery, title, location (area only until booked),
  description, amenities, house rules, sleeping arrangements, max guests,
  check-in/out times, cancellation policy, host card, ratings and reviews,
  availability calendar, price breakdown for chosen dates.
- "Reserve" requires sign-in. A visitor who clicks it is sent to sign-in or
  sign-up and returned to the same listing with dates and guests kept.

### Accounts
- Sign up, sign in, sign out with email and password; Google sign-in later.
- Email verification and password reset by email.
- Profile: name, photo, phone, bio, languages, location.
- One account can switch between guest mode and host mode.

### Booking and payments
- Server-side quote: nights x nightly price + cleaning fee + guest service fee
  (+ taxes when configured) = total, all in the listing's currency.
- Booking rules: minimum/maximum nights, max guests, check-in/out times,
  advance notice, booking window.
- Two booking types per listing: **Instant Book** (confirmed on payment) and
  **Request to Book** (host has 24 hours to accept; payment captured or charged
  on acceptance).
- Double bookings are impossible at the database level.
- Payments: M-Pesa and card. Unpaid holds expire after 15 minutes and free the
  dates.
- Receipts for every payment.
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
  (revealed after confirmation), host contact and message button, price
  breakdown, payment status, receipt download, cancel (with refund preview),
  "Book again", leave a review after checkout.
- **Wishlists:** heart button on cards and listing pages; named lists; dashboard
  page with lists and stays.
- **Messages:** inbox of conversations with hosts (one per booking or
  pre-booking inquiry), unread badges.
- **Reviews:** stays waiting for a review, reviews written, reviews hosts wrote
  about the guest.
- **Payments:** payment history with status and receipts.
- **Notifications:** in-app notification centre plus email.
- **Profile and settings:** edit profile, change password, notification
  preferences, preferred display currency (future), delete account.

### Host dashboard
- Today view: check-ins and check-outs today, pending requests, unread messages.
- Listings: create (step-by-step wizard), edit, publish/unpublish, photos with
  ordering and cover photo, amenities, rules, fees, policy, booking type.
- Calendar: per-listing month view with booked, blocked and available nights;
  block/unblock ranges; per-night price overrides (later).
- Reservations: upcoming, pending requests (accept/decline), past, cancelled;
  reservation detail with guest info.
- Earnings: totals by month, per-booking payouts, upcoming payouts.
- Reviews: reviews received, reply publicly, review the guest.

### Admin dashboard
- Overview: bookings, revenue, new users, active listings, occupancy; trend
  charts; items needing attention.
- Users: search/filter, view profile and activity, suspend or ban, change roles.
- Listings: moderation queue (new/edited listings go live after approval),
  unlist, feature on home page.
- Bookings: search, view detail, cancel on behalf, resolve disputes.
- Payments: list, filter, view provider references, issue refunds.
- Reviews: hide abusive reviews, view reports.
- Settings: guest service fee %, host fee %, supported currencies, cancellation
  policy definitions, featured listings.
- Audit log of every admin action.

### Trust, safety and support
- Report a listing, review or user.
- Address and contact details hidden until a booking is confirmed.
- Info pages: About, Contact (form), FAQ, Terms, Privacy, Cancellation policy.

### Explicit non-goals for the MVP
- Native mobile apps (the web app must be mobile-first instead).
- Map-based search (Phase 2).
- Dynamic or AI pricing, smart locks, channel manager (iCal sync is Phase 2).
- Experiences/tours, co-hosting, multi-language UI.
- Automated host payouts (admin marks payouts as paid in the MVP).

## 4. Data - What are we storing?

All tables use **UUID primary keys** (`gen_random_uuid()` via `pgcrypto`) and
UUID foreign keys. Money is stored as integer minor units plus an ISO 4217
currency code; never as floats.

- **users** - email (unique, citext), password_digest, name, phone, avatar,
  bio, languages, roles (guest default, host flag, admin flag), status (active,
  suspended, banned), email_verified_at, last_sign_in_at.
- **sessions** - user, token digest, user agent, IP, expires_at (Rails 8
  authentication).
- **listings** - host, title, slug, description, property type, room type,
  address line, area/neighbourhood, city, country, latitude/longitude, max
  guests, bedrooms, beds, bathrooms, nightly price, cleaning fee, currency,
  minimum/maximum nights, check-in/out times, booking type (instant/request),
  cancellation policy, house rules, status (draft, pending review, published,
  unlisted, rejected), featured flag, rating average, review count.
- **listing photos** - Active Storage attachments with position and cover flag.
- **amenities** and **listing amenities** - catalogue plus join table.
- **availability blocks** - listing, date range, reason (host block,
  maintenance).
- **bookings** - listing, guest, check-in, check-out, guests count, nightly
  price snapshot, nights, cleaning fee, service fee, taxes, total, currency,
  status (pending payment, requested, confirmed, declined, expired,
  cancelled by guest, cancelled by host, completed), expires_at,
  cancellation details. PostgreSQL exclusion constraint on
  `(listing_id, daterange(check_in, check_out))` for active statuses.
- **payments** - booking, provider (mpesa, card provider), provider reference,
  amount, currency, status (pending, succeeded, failed, refunded, partially
  refunded), raw webhook payload, idempotency key.
- **refunds** - payment, amount, reason, status.
- **payouts** - host, bookings, amount, currency, status (scheduled, paid).
- **reviews** - booking, author, subject (listing or guest), overall rating,
  category ratings (cleanliness, accuracy, check-in, communication, location,
  value), comment, host reply, published_at (double-blind release), hidden flag.
- **wishlists** and **wishlist items**.
- **conversations**, **conversation participants**, **messages** (read_at).
- **notifications** - user, type, payload, read_at; **notification preferences**.
- **reports** - reporter, reportable (polymorphic), reason, status.
- **platform settings** - key/value with typed values.
- **audit logs** - admin, action, target, changes, IP.

Migration: the 50 listings and existing users are imported once from MongoDB.
Passwords are bcrypt hashes and can be carried over.

## 5. Tech - What stack are we using?

| Layer | Choice | Notes |
| --- | --- | --- |
| Backend | Ruby on Rails 8 (API mode), Ruby 3.3 | `rails new backend --api -d postgresql`; lives in `backend/` in this repo. |
| Database | PostgreSQL 16 | UUID PKs via generator default `primary_key_type: :uuid`; `pgcrypto`, `citext`, `btree_gist` extensions. |
| Auth | Rails 8 authentication (has_secure_password + DB sessions) with signed, httpOnly, Secure cookies | Frontend calls the API through a same-origin `/api` rewrite on Vercel, so cookies stay first-party. Google sign-in via OmniAuth later. |
| Authorization | Pundit policies | Guest/host/admin rules in one place. |
| Background jobs | Solid Queue | Hold expiry, emails, review release, payout scheduling. |
| Email | Action Mailer | **TODO:** provider (Resend, Postmark or SendGrid). |
| Files | Active Storage | **TODO:** Cloudinary or S3-compatible storage. |
| Payments | M-Pesa Daraja (STK Push) + card provider | **TODO:** card provider (Paystack covers KES cards and M-Pesa in one account; Stripe covers international cards). Needs the owner's merchant accounts. |
| API | JSON REST, versioned under `/api/v1`, consistent error envelope, pagination | OpenAPI document kept in the repo. |
| Frontend | Existing React 18 + Vite + Tailwind + Radix/shadcn-style components | Kept and extended; data fetching moves to TanStack Query; forms with React Hook Form + Zod. |
| Tests | Rails Minitest (models, requests, policies) + Vitest + Playwright for key flows | Blueprint `/check` runs the real app. |
| CI | GitHub Actions | Lint, tests, build. |

The Express API in `api/` keeps serving the live site until the Rails cutover
feature, then it is removed.

## 6. Monetize - How will this make money?

- Guest service fee: **Assumption** 10% of the subtotal, shown before payment.
- Host service fee: **Assumption** 3% deducted from payouts.
- Featured placement for listings (later).
- Both percentages are admin settings, not code constants.

**TODO:** confirm fee levels and whether taxes or the Kenya tourism levy must be
collected and shown.

## 7. UI/UX - How should this look and feel?

- **Brand:** T&G BnB. The public site keeps the Stillform-inspired editorial
  style: sand `#EDE6D6` and ink `#2A2725`, Instrument Serif headings, Familjen
  Grotesk body text. Action colour is blue `#2563EB` (owner's request).
- **Dashboards** use the same palette and fonts in a calmer, denser layout:
  - left sidebar navigation on desktop (collapsible), bottom tab bar on mobile;
  - top bar with mode switch (Guest / Host / Admin when allowed),
    notifications bell and avatar menu;
  - overview pages lead with the one most important thing (next trip, today's
    check-ins, items needing admin attention), then small stat cards, then lists;
  - tables with search, filters, sortable columns and pagination for host and
    admin; cards for guest trips;
  - every list has designed empty, loading (skeleton) and error states;
  - status shown with consistent badges (pending, confirmed, cancelled...).
- References for dashboard patterns (ideas, not copies): Airbnb Trips and Host
  "Today", Booking.com account dashboard, shadcn/ui dashboard and sidebar
  blocks, RentNest tenant/landlord/admin dashboards.
- Prices always show the stay's currency (KES, EUR, USD...).
- Accessibility: WCAG 2.2 AA contrast, keyboard navigation, focus rings, alt
  text, reduced-motion support (already in the home page).

## 8. Deployment - Where and how will this ship?

- **Frontend:** Vercel project `qwako` (live at tg-bnb.vercel.app). Build
  `yarn build`, output `client/dist`. `/api/*` rewrites to the Rails API.
- **Backend:** **Assumption** Render web service for Rails (Puma), Render
  PostgreSQL, Solid Queue running in the web process at first. Health check
  `GET /up`. **TODO:** confirm Render, or choose Fly.io/Heroku.
- Env vars (names only): `DATABASE_URL`, `RAILS_MASTER_KEY`, `FRONTEND_URL`,
  `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`,
  `MPESA_PASSKEY`, `MPESA_CALLBACK_URL`, card provider keys, mail provider key,
  storage keys.
- Environments: local (PostgreSQL in the dev container), preview, production.
- Daily database backups; error monitoring (**TODO:** Sentry or Honeybadger).
- Domain: **TODO:** custom domain for T&G BnB.

## 9. Usage model and constraints

- Internet-facing marketplace with untrusted users; payments involved.
- Expected scale at launch: hundreds of listings and low thousands of users;
  design for one region, single database.
- Kenya Data Protection Act 2019 applies: privacy notice, consent for marketing
  emails, account deletion, minimal personal data.
- Security requirements: server-side pricing, authorization on every endpoint,
  rate limiting on auth and booking endpoints, verified payment webhooks with
  idempotency, no secrets in the repo, admin actions audited.
- Non-requirements for the MVP: multi-region, multi-tenant white-labelling,
  offline mode.
