# Build Plan

Features in build order. Each item is one `/feature` spec; details live in the
spec, not here. Do not renumber completed items.

**Pre-build (not features):** scaffold the Rails 8 API in `backend/` with
PostgreSQL, UUID primary keys by default, `pgcrypto`/`citext`/`btree_gist`
extensions, CORS, health check and CI; then run `/onboard` and `/overview`.

## Milestone 1 - Accounts

- [x] 1. **Email sign-up, sign-in and sign-out** - Rails 8 cookie sessions, current-user endpoint, React auth wired to Rails.
- [ ] 2. **Email verification and password reset** - emails sent through the client's SMTP server, rate-limited.
- [ ] 3. **Profiles and roles** - edit profile and photo; guest and admin roles; admin accounts created by the owner.

## Milestone 2 - Properties and discovery

- [ ] 4. **Property catalogue with seed data** - listing, photo and amenity tables with UK address fields and GBP prices; the 50 existing listings as seeds.
- [ ] 5. **Public listing page on Rails** - gallery, details, amenities, rules, policy, licence number, total price for chosen dates; area only until booked.
- [ ] 6. **Stays search on Rails** - destination, dates availability, guests, price, type, amenities, sort, pagination, shareable URL.

## Milestone 3 - Booking and payments

- [ ] 7. **Availability and booking rules** - blocked dates; min/max nights, guests, check-in/out times; public calendar of free nights.
- [ ] 8. **Sign-in-gated reservation with server quote** - price from the server, return-to-listing after sign-in, double bookings blocked by the database.
- [ ] 9. **Stripe payments** - card with 3-D Secure, Apple Pay and Google Pay; signed webhooks; receipts; expiring holds.
- [ ] 10. **Instant Book and Request to Book** - confirm on payment, or authorise and let the owner accept/decline within 24 hours.
- [ ] 11. **Cancellations and refunds** - Flexible/Moderate/Strict policies, guest and owner cancellation, refund preview and Stripe refunds.

## Milestone 4 - Customer dashboard

- [ ] 12. **Dashboard shell and guest overview** - sidebar/bottom-bar layout, next-trip card, stats, stays to review, recently viewed.
- [ ] 13. **Trips and trip detail** - upcoming/past/cancelled, status timeline, address and check-in info after confirmation, receipt, cancel, book again.
- [ ] 14. **Wishlists** - heart on cards and listing pages, named lists, wishlist pages.
- [ ] 15. **Messaging** - guest-owner conversations per booking or enquiry, inbox, unread counts.
- [ ] 16. **Reviews** - reviews after checkout, category ratings, owner replies, ratings on cards and listing pages.
- [ ] 17. **Notifications** - in-app notification centre and booking emails, with preferences.
- [ ] 18. **Account settings and privacy** - password change, notification and marketing consent, payment history, download my data, delete account.

## Milestone 5 - Admin dashboard (owner)

- [ ] 19. **Admin overview** - today's arrivals/departures, pending requests, occupancy and revenue, trend charts.
- [ ] 20. **Property management** - create/edit/publish properties, photos, prices, rules, check-in details.
- [ ] 21. **Calendar** - month view across properties; block/unblock nights.
- [ ] 22. **Bookings, guests and payments** - accept/decline, booking detail, cancel, refunds, guest list, payment list.
- [ ] 23. **Admin messages and reviews** - guest inbox, review replies, hide abusive reviews.
- [ ] 24. **Settings, staff accounts and audit log** - staff admins, policies, featured properties, log of admin actions.

## Milestone 6 - Launch readiness

- [ ] 25. **Legal pages, cookie consent and contact form** - About, Contact, FAQ, Terms, Privacy, Cookie policy, Cancellation policy, consent banner.
- [ ] 26. **Production packaging** - Dockerfile serving API and React build, `.env.example`, `DEPLOY.md`; remove the Express API and MongoDB.
- [ ] 27. **Google sign-in** - OmniAuth Google for guests.
- [ ] 28. **Security hardening** - rate limits review, error logging, backup and restore notes.

## Later (not in MVP)

- Map search, iCal sync, per-night price overrides and discounts, multi-language UI, mobile apps.
