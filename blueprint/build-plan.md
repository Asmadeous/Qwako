# Build Plan

Features in build order. Each item is one `/feature` spec; details live in the
spec, not here. Do not renumber completed items.

**Pre-build (not features):** scaffold the Rails 8 API in `backend/` with
PostgreSQL, UUID primary keys by default, `pgcrypto`/`citext`/`btree_gist`
extensions, CORS, health check, and CI; then run `/onboard` and `/overview`.

## Milestone 1 - Accounts

- [ ] 1. **Email sign-up, sign-in and sign-out** - Rails 8 cookie sessions, current-user endpoint, React auth wired to Rails.
- [ ] 2. **Email verification and password reset** - verification link, reset by email, rate-limited.
- [ ] 3. **Profiles and modes** - edit profile and photo; every user is a guest, can turn on hosting; admin role.

## Milestone 2 - Listings and discovery

- [ ] 4. **Listing catalogue import** - listing, photo and amenity tables; one-off import of the 50 MongoDB listings and users.
- [ ] 5. **Public listing page on Rails** - gallery, details, amenities, rules, policy, host card, local-currency prices; area only until booked.
- [ ] 6. **Stays search on Rails** - destination, dates availability, guests, price, type, amenities, sort, pagination, shareable URL.
- [ ] 7. **Host listing wizard** - create, edit, submit for review, publish/unpublish, photo upload and ordering.

## Milestone 3 - Booking and payments

- [ ] 8. **Availability calendar and booking rules** - host blocks dates; min/max nights, guests, check-in/out times; public calendar of free nights.
- [ ] 9. **Sign-in-gated reservation with server quote** - price breakdown from the server, return-to-listing after sign-in, double bookings blocked by the database.
- [ ] 10. **Instant Book and Request to Book** - confirm on payment, or host accepts/declines within 24 hours; expiring holds.
- [ ] 11. **M-Pesa payments** - STK Push, verified callbacks, receipts, booking confirmed on success.
- [ ] 12. **Card payments** - card checkout with the chosen provider, webhooks, receipts.
- [ ] 13. **Cancellations and refunds** - Flexible/Moderate/Strict policies, guest and host cancellation, refund preview and processing.

## Milestone 4 - Customer dashboard

- [ ] 14. **Dashboard shell and guest overview** - sidebar/bottom-bar layout, mode switch, next-trip card, stats, pending reviews, recently viewed.
- [ ] 15. **Trips and trip detail** - upcoming/past/cancelled, status timeline, address and check-in info after confirmation, receipt, cancel, book again.
- [ ] 16. **Wishlists** - heart on cards and listing pages, named lists, wishlist pages.
- [ ] 17. **Messaging** - guest-host conversations per booking or inquiry, inbox, unread counts.
- [ ] 18. **Reviews** - double-blind reviews after checkout, category ratings, host replies, ratings on cards and listing pages.
- [ ] 19. **Notifications** - in-app notification centre and booking emails, with preferences.
- [ ] 20. **Account settings and payment history** - password change, notification settings, payments list with receipts, delete account.

## Milestone 5 - Launch on Rails

- [ ] 21. **Production cutover** - deploy Rails and PostgreSQL, final data import, point the Vercel `/api` rewrite to Rails, retire the Express API.

## Milestone 6 - Host dashboard

- [ ] 22. **Host today view and reservations** - today's check-ins/outs, pending requests, reservation list and detail.
- [ ] 23. **Host calendar** - month view per listing with booked, blocked and free nights; block/unblock ranges.
- [ ] 24. **Host earnings and payouts** - earnings by month and booking, payout status.

## Milestone 7 - Admin dashboard

- [ ] 25. **Admin overview** - KPIs, trend charts, items needing attention.
- [ ] 26. **Admin users** - search, view, suspend/ban, change roles.
- [ ] 27. **Admin listing moderation** - approval queue, unlist, feature on home page.
- [ ] 28. **Admin bookings, payments and refunds** - search, detail, cancel on behalf, refunds, mark payouts paid.
- [ ] 29. **Admin reviews and reports** - hide reviews, handle user reports.
- [ ] 30. **Platform settings and audit log** - fees, currencies, policies, featured stays; log of every admin action.

## Milestone 8 - Trust and polish

- [ ] 31. **Info pages and contact form** - About, Contact, FAQ, Terms, Privacy, Cancellation policy.
- [ ] 32. **Google sign-in** - OmniAuth Google for guests and hosts.
- [ ] 33. **Security and operations hardening** - rate limits review, error monitoring, backups, abuse reporting checks.

## Later (not in MVP)

- Map search, iCal calendar sync, per-night price overrides and discounts, display-currency conversion, multi-language UI, automated payouts, mobile apps.
