# T&G BnB - Project Overview

<!-- blueprint:source-hash 03ad2ca8f2d6635a706755cfde28cb145347b36c399d2838a5cb754b0c123dec -->

> Direct-booking website for one owner's UK holiday lets: nightly stays with an
> Airbnb-style booking flow, plus guest and owner dashboards. Not a marketplace.

## Problem

The owner needs his own site where guests see the full price up front in GBP and
book confirmed dates in a few steps, and where he manages properties,
availability, bookings, guests and payments himself. The current React +
Express/MongoDB prototype trusts client-sent prices, allows double bookings, has
unauthenticated uploads, no roles, no payments and no dashboards. The plan
replaces it (Rails backend) rather than patching it.

## Users

| Role | Access | Needs |
| --- | --- | --- |
| Visitor | Not signed in | Home page, stays search, listing pages, prices and availability. Cannot book, save or message. |
| Guest | Signed in; every public sign-up is a guest | Book, pay, manage trips, wishlists, messages, reviews, profile and settings. |
| Admin | Owner and staff; created by the owner, never by sign-up | Properties, calendar, prices, bookings, guests, payments, reviews, messages, occupancy and revenue. |

Market: UK only. Locale `en-GB`, GBP, Europe/London, dates as `5 Nov 2026` /
`05/11/2026`. Mostly phone users; every page works at 360px.

## Usage model

- Internet-facing, untrusted users, real payments.
- Scale: one owner, small portfolio, hundreds to low thousands of guests a year;
  one server, one database.
- Law: UK GDPR / DPA 2018 (privacy notice, data export, deletion); PECR (cookie
  and marketing consent, only essential cookies before consent); Consumer
  Contracts Regs and DMCC Act 2024 (total price incl. mandatory charges up front,
  clear cancellation terms); Scottish short-term let licence numbers; London
  entire-home 90-night limit.
- Security: server-side pricing, authorization on every endpoint, rate limits on
  sign-in and booking, signed idempotent Stripe webhooks, no secrets in the repo,
  audited admin actions. Card data never stored.
- Non-requirements: multi-region, multi-currency, marketplace features, offline
  mode.

## Features

Build order from `build-plan.md`. Headline: features 8-10 (server-quoted,
double-booking-proof reservation with Stripe).

**Pre-build (done by onboarding):** Rails API in `backend/` with PostgreSQL, UUID
PKs, `pgcrypto`/`citext`/`btree_gist`, CORS, `/up`, CI.

Milestone 1 - Accounts

1. **Email sign-up, sign-in, sign-out** - Rails 8 cookie sessions, current-user endpoint, React auth wired to Rails.
2. **Email verification and password reset** - via client SMTP, rate-limited.
3. **Profiles and roles** - profile and photo; guest/admin roles; owner creates admins.

Milestone 2 - Properties and discovery

4. **Property catalogue with seed data** - listings, photos, amenities, UK address, GBP; 50 existing listings seeded.
5. **Public listing page on Rails** - gallery, details, rules, policy, licence, total for chosen dates; area only until booked.
6. **Stays search on Rails** - destination, date availability, guests, price, type, amenities, sort, pagination, shareable URL.

Milestone 3 - Booking and payments

7. **Availability and booking rules** - blocked dates, min/max nights, guests, times; public calendar.
8. **Sign-in-gated reservation with server quote** - server price, return-to-listing after sign-in, DB-level double-booking block.
9. **Stripe payments** - cards with 3DS, Apple/Google Pay, signed webhooks, receipts, 15-minute holds.
10. **Instant Book and Request to Book** - confirm on payment, or authorise and owner accepts/declines within 24h.
11. **Cancellations and refunds** - Flexible/Moderate/Strict, guest and owner cancel, refund preview, Stripe refunds.

Milestone 4 - Customer dashboard

12. **Dashboard shell and guest overview** - sidebar / bottom bar, next-trip card, stats, to-review, recently viewed.
13. **Trips and trip detail** - tabs, status timeline, address and check-in info after confirmation, receipt, cancel, book again.
14. **Wishlists** - hearts, named lists, wishlist pages.
15. **Messaging** - conversations per booking or enquiry, inbox, unread counts.
16. **Reviews** - after checkout, category ratings, owner replies, ratings on cards and pages.
17. **Notifications** - in-app centre and booking emails with preferences.
18. **Account settings and privacy** - password, consents, payment history, data export, account deletion.

Milestone 5 - Admin dashboard

19. **Admin overview** - arrivals/departures, pending requests, occupancy, revenue, trends.
20. **Property management** - create/edit/publish, photos, prices, rules, check-in details.
21. **Calendar** - month view across properties, block/unblock.
22. **Bookings, guests and payments** - accept/decline, detail, cancel, refunds, guest and payment lists.
23. **Admin messages and reviews** - inbox, replies, hide abusive reviews.
24. **Settings, staff and audit log** - staff admins, policies, featured properties, admin action log.

Milestone 6 - Launch readiness

25. **Legal pages, cookie consent, contact form**.
26. **Production packaging** - Dockerfile (API + React build), `.env.example`, `DEPLOY.md`.
27. **Google sign-in** - OmniAuth Google for guests.
28. **Security hardening** - rate-limit review, error logging, backup and restore notes.

Later (not MVP): map search, iCal sync, per-night pricing and discounts,
multi-language, mobile apps.

## Data model

All tables: `id uuid` PK (`gen_random_uuid()`), UUID FKs, `created_at` /
`updated_at`. Money is integer pence (`*_pence`). Field names below are the
working contract; each feature spec locks the ones it introduces.

### User (feature 1, 3)
- `email` citext, unique, not null; `password_digest` string
- `name` string; `phone` string (+44 default format); avatar (Active Storage)
- `role` enum `guest | admin`, default `guest`
- `status` enum `active | suspended`, default `active`
- `email_verified_at`, `marketing_consent_at`, `last_sign_in_at` datetime
- `stripe_customer_id` string
- has_many sessions, bookings, wishlists, reviews, notifications

### Session (feature 1)
- `user_id`; `user_agent` string; `ip_address` string
- Plan also lists `token` and `expires_at`. > TODO: feature 1 decides whether
  to extend the Rails 8 generator's session shape with these.

### Listing (feature 4)
- `title`, `slug` (unique), `description` text, `property_type` string
- `address_line1`, `address_line2`, `town`, `county`, `postcode`, `nation`
  (England, Scotland, Wales, Northern Ireland); `latitude`, `longitude` decimal
- `max_guests`, `bedrooms`, `beds`, `bathrooms` integer
- `nightly_price_pence`, `cleaning_charge_pence` integer
- `min_nights`, `max_nights` integer; `check_in_time`, `check_out_time` time
- `booking_type` enum `instant | request`
- `cancellation_policy` enum `flexible | moderate | strict`
- `house_rules`, `check_in_instructions`, `wifi_details` text (last two
  revealed only after confirmation); `licence_number` string
- `status` enum `draft | published | unlisted`; `featured` boolean
- `rating_average` decimal, `review_count` integer (cached)
- Advance notice and booking window rules (feature 7). > TODO: columns not
  named in the plan.

### ListingPhoto (feature 4, 20)
- `listing_id`; Active Storage attachment; `position` integer; `cover` boolean
- Seeds keep remote image URLs. > TODO: needs a URL column or equivalent.

### Amenity, ListingAmenity (feature 4)
- Amenity: `name` unique, `icon`; join table `listing_id`, `amenity_id` unique pair

### AvailabilityBlock (feature 7, 21)
- `listing_id`; `starts_on`, `ends_on` date; `reason` string

### Booking (feature 8-11)
- `listing_id`, `guest_id` (User); `check_in`, `check_out` date; `guests_count`
- Snapshots: `nightly_price_pence`, `nights`, `cleaning_charge_pence`, `total_pence`
- `status` enum `pending_payment | requested | confirmed | declined | expired |
  cancelled_by_guest | cancelled_by_owner | completed`
- `expires_at` datetime (15-min hold, 24h request window); cancellation fields
  (`cancelled_at`, reason, refund amount)
- Exclusion constraint on `(listing_id, daterange(check_in, check_out))` for
  active statuses (`btree_gist`). Quote = nights x nightly + cleaning; no fees.

### Payment, Refund, StripeEvent (feature 9, 11)
- Payment: `booking_id`, `stripe_payment_intent_id` unique, `amount_pence`,
  `status`, `idempotency_key` unique
- Refund: `payment_id`, `stripe_refund_id`, `amount_pence`, `status`
- StripeEvent: `stripe_event_id` unique, `event_type`, `processed_at`

### Review (feature 16, 23)
- `booking_id` (one per booking), `author_id`; `overall` and category ratings
  `cleanliness`, `accuracy`, `check_in`, `communication`, `location`, `value`
  (1-5); `comment` text; `owner_reply` text; `hidden` boolean

### Wishlist, WishlistItem (feature 14)
- Wishlist: `user_id`, `name`; item: `wishlist_id`, `listing_id` unique pair

### Conversation, Message (feature 15, 23)
- Conversation: `guest_id`, optional `booking_id`, optional `listing_id` (enquiry)
- Message: `conversation_id`, `sender_id`, `body` text, `read_at`

### Notification, NotificationPreference (feature 17)
- Notification: `user_id`, `kind`, `payload` jsonb, `read_at`
- Preference: `user_id`, per-kind email/in-app flags

### Setting, AuditLog (feature 24)
- Setting: `key` unique, `value` jsonb
- AuditLog: `admin_id`, `action`, `target_type`, `target_id`, `changes` jsonb, `ip_address`

## Tech stack

- **Rails 8.1 API mode, Ruby 4.0** (`backend/`) - JSON REST under `/api/v1`, consistent errors, pagination.
- **PostgreSQL** (local 18) - UUID PKs; `pgcrypto`, `citext`, `btree_gist`.
- **Rails 8 authentication** - has_secure_password + DB sessions, signed httpOnly Secure SameSite=Lax cookies; one origin in production.
- **Pundit** - guest and admin authorization.
- **Solid Queue (in Puma)** - hold expiry, emails, booking completion.
- **Action Mailer over client SMTP**; **Active Storage on local disk**.
- **Stripe** (client's own account) - PaymentIntents, 3DS, wallets, refunds, webhooks.
- **React 18 + Vite + Tailwind + Radix/shadcn** (`client/`) - built to static files served by Rails; TanStack Query, React Hook Form + Zod for new work.
- **Tests** - Minitest (backend), Vitest and Playwright planned for client.
- **CI** - GitHub Actions (`.github/workflows/backend.yml`).
- The Express + MongoDB prototype was removed on 2026-11-06; Rails serves all data.

## Monetization

Owner earns nightly rate plus cleaning charge. No platform or service fees.
> TODO: VAT registration decides whether receipts show VAT.

## UI/UX

- Public pages: Stillform-inspired editorial style; sand `#EDE6D6`, ink
  `#2A2725`, Instrument Serif headings, Familjen Grotesk body, blue `#2563EB`
  actions.
- Dashboards: warm neutrals, Swiss layout, gold highlight accent, green free /
  grey booked nights; collapsible left sidebar on desktop, bottom tab bar on
  mobile; top bar with bell and avatar menu; overview leads with the key item,
  then stats, then lists/charts; admin tables with search, filters, sort,
  pagination; designed empty, skeleton and error states; text status badges;
  saving buttons disable with progress; 44px targets.
- WCAG 2.2 AA, keyboard nav, focus rings, alt text, reduced motion. UK English.
- Current client routes: `/` home, `/stays` search, `/place/:id` listing,
  `/login`, `/register`, `/account`, `/account/places[/new|/:id]`,
  `/account/bookings[/:id]`. > TODO: dashboard and info-page routes are not named
  in the plan; each feature spec defines its routes.

## Deployment

- Client's team deploys to the client's own server; this project ships code,
  a production `Dockerfile` (Rails serving API + React build on one domain,
  health `GET /up`), `.env.example` and `DEPLOY.md` (feature 26).
- Env vars: `RAILS_MASTER_KEY`, `DATABASE_URL`, `STRIPE_SECRET_KEY`,
  `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `SMTP_ADDRESS`,
  `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `MAIL_FROM`, `APP_HOST`.
  Dev only: `CORS_ORIGINS` (default `http://localhost:5173`).
- Persistent volume for Active Storage files; database backups.
- Blueprint `/release` is not used.

## Open questions

- Plan says Ruby 3.3 and PostgreSQL 16; the scaffold uses Ruby 4.0.2, Rails
  8.1 and local PostgreSQL 18. Update the plan or pin versions.
- Rails generated separate production `cache` and `queue` databases, while the
  plan names one `DATABASE_URL`. Resolve in feature 26.
- Sessions: plan lists `token` and `expires_at`; the Rails 8 generator does not.
- Seed photos keep remote URLs but photos are Active Storage attachments.
- Advance notice and booking window have no named fields.
- Features 3 and 24 both cover owner-created admin accounts; confirm the split.
- VAT on receipts (section 6).
