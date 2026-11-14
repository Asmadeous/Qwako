import { Link } from 'react-router-dom';

import { POLICIES } from '@/utils/format';

const Page = ({ title, updated, children }) => (
  <article className="mx-auto w-full max-w-3xl px-4 pt-24 pb-24 md:pt-28">
    <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight">{title}</h1>
    <p className="mt-3 text-sm text-ink/60">Last updated {updated}</p>
    <div className="mt-10 grid gap-8 text-pretty leading-relaxed text-ink/85 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-2 [&_ul]:grid [&_ul]:gap-1">
      {children}
    </div>
  </article>
);

export const PrivacyPage = () => (
  <Page title="Privacy notice" updated="13 Nov 2026">
    <section>
      <h2>Who we are</h2>
      <p className="mt-2">
        T&amp;G BnB lets you book the owner's holiday homes in Kenya directly. The owner is the data controller for the
        personal data on this site, under Kenya's Data Protection Act 2019. Questions:{' '}
        <Link to="/contact" className="underline underline-offset-4">contact us</Link>.
      </p>
    </section>
    <section>
      <h2>What we collect and why</h2>
      <ul>
        <li>Your name, email, and phone if you add it: to run your account and contact you about your stay.</li>
        <li>Your bookings and messages: to provide the stay and answer your questions.</li>
        <li>
          Payment records (amount, date, reference, M-Pesa or card): to confirm and refund bookings. Paystack handles
          card and M-Pesa details; we never see or store them.
        </li>
        <li>Your reviews: shown on the home's page with your first name.</li>
        <li>Offers and news: only if you agree, and you can stop at any time in Settings.</li>
      </ul>
    </section>
    <section>
      <h2>Cookies</h2>
      <p className="mt-2">
        We set one cookie, which keeps you signed in. There are no tracking or advertising cookies. The site also
        remembers the homes you recently viewed on your own device.
      </p>
    </section>
    <section>
      <h2>Who we share it with</h2>
      <ul>
        <li>Paystack, to take payments and send refunds.</li>
        <li>Our email provider, to send booking emails.</li>
        <li>Our hosting providers (Render and Vercel), which store the site and its database.</li>
      </ul>
      <p className="mt-2">We never sell your data.</p>
    </section>
    <section>
      <h2>How long we keep it</h2>
      <p className="mt-2">
        Account details are kept until you close your account. Booking and payment records are kept for seven years for
        tax purposes, without your name and contact details once your account is closed.
      </p>
    </section>
    <section>
      <h2>Your rights</h2>
      <p className="mt-2">
        You can see, correct, download and delete your data. In your account, Settings has "Download my data" and "Close
        my account". You can also complain to the Office of the Data Protection Commissioner (odpc.go.ke).
      </p>
    </section>
  </Page>
);

export const TermsPage = () => (
  <Page title="Terms of booking" updated="13 Nov 2026">
    <section>
      <h2>Prices</h2>
      <p className="mt-2">
        Prices are in Kenyan shillings. The total shown before you pay is everything you pay: nights plus any cleaning
        charge. There are no booking or service fees.
      </p>
    </section>
    <section>
      <h2>Booking and paying</h2>
      <p className="mt-2">
        You pay in full by M-Pesa or card through Paystack. Your dates are held for 15 minutes while you pay. Some homes
        take requests: you pay, and the owner accepts or declines within 24 hours. If they decline or don't reply, you
        get all your money back.
      </p>
    </section>
    <section>
      <h2>Cancelling</h2>
      <p className="mt-2">Each home shows its cancellation policy on its page and on your booking:</p>
      <ul>
        {Object.values(POLICIES).map((p) => (
          <li key={p.label}>
            <strong>{p.label}:</strong> {p.text}
          </li>
        ))}
      </ul>
      <p className="mt-2">
        If the owner cancels, you get all your money back. Refunds go back to the M-Pesa number or card you paid with,
        usually within a few days.
      </p>
    </section>
    <section>
      <h2>Changing dates</h2>
      <p className="mt-2">
        You can move your stay to other free dates before check-in, for the same number of nights or fewer. A shorter
        stay refunds the difference. To stay longer, book the extra nights separately.
      </p>
    </section>
    <section>
      <h2>During your stay</h2>
      <p className="mt-2">
        Check-in and check-out times and house rules are on each home's page. Please follow them; the number of guests
        can't be more than you booked for.
      </p>
    </section>
    <section>
      <h2>Reviews</h2>
      <p className="mt-2">
        After your stay you can review it. We hide reviews that are abusive or not about the stay; we don't hide reviews
        for being negative.
      </p>
    </section>
  </Page>
);
