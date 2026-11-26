import { BadgePercent, MessageSquare, ShieldCheck, Smartphone } from 'lucide-react';

import Section from './Section';

// What booking here gets a guest, all of it true of every booking on the site.
const POINTS = [
  {
    icon: BadgePercent,
    title: 'No booking-site fees',
    text: 'You pay the nightly price and the cleaning charge, nothing on top.',
  },
  {
    icon: Smartphone,
    title: 'M-Pesa or card',
    text: 'Pay securely through Paystack when you book.',
  },
  {
    icon: ShieldCheck,
    title: 'Clear cancellation',
    text: 'Each home shows its cancellation policy before you pay. If the owner cancels, you get all your money back.',
  },
  {
    icon: MessageSquare,
    title: 'Talk to the owner',
    text: 'Message the owner directly, before and during your stay.',
  },
];

const WhyDirect = () => (
  <Section id="why" title="Why book direct">
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {POINTS.map(({ icon: Icon, title, text }) => (
        <li key={title}>
          <span aria-hidden className="grid size-11 place-items-center rounded-full bg-ink text-sand">
            <Icon strokeWidth={1.75} className="size-5" />
          </span>
          <h3 className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink/75">{text}</p>
        </li>
      ))}
    </ul>
  </Section>
);

export default WhyDirect;
