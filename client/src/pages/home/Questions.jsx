import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePlaces } from '../../../hooks';
import Section from './Section';

// Answers taken from each home's own settings, so they stay right as homes change.
const Questions = () => {
  const { places } = usePlaces();
  if (places.length === 0) return null;
  const perHome = (line) =>
    places.length === 1 ? line(places[0]) : (
      <ul className="grid gap-2">
        {places.map((home) => (
          <li key={home.id}>
            <span className="font-semibold">{home.title}:</span> {line(home)}
          </li>
        ))}
      </ul>
    );

  const items = [
    {
      q: 'When can I check in and out?',
      a: perHome((home) => `Check in from ${home.check_in_time}, check out by ${home.check_out_time}.`),
    },
    {
      q: 'How do I pay?',
      a: 'By M-Pesa or card through Paystack when you book. Your dates are held for 15 minutes while you pay.',
    },
    {
      q: 'What if I need to cancel?',
      a: (
        <>
          {perHome((home) => home.cancellation_policy_text)}
          <p className="mt-2">If the owner cancels, you get all your money back.</p>
        </>
      ),
    },
    {
      q: 'How do I find the home?',
      a: 'Once your booking is confirmed, your booking page shows the exact spot on a map with directions, and the check-in instructions.',
    },
  ];

  return (
    <Section id="questions" title="Questions">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="divide-y divide-ink/15 border-y border-ink/15">
          {items.map(({ q, a }) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="text-2xl leading-none text-ink/50 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="mt-3 max-w-2xl leading-relaxed text-ink/80">{a}</div>
            </details>
          ))}
        </div>
        <div className="self-start rounded-2xl bg-ink p-6 text-sand">
          <h3 className="text-2xl font-bold tracking-tight">Something else?</h3>
          <p className="mt-2 text-sm text-sand/70">Send us a message and we'll get back to you.</p>
          <Link to="/contact" className={cn(buttonVariants(), 'mt-5 bg-sand text-ink hover:bg-sand/90')}>
            Contact us
          </Link>
        </div>
      </div>
    </Section>
  );
};

export default Questions;
