import { Car, DoorOpen, PawPrint, Radio, Tv, Wifi } from 'lucide-react';

const PERKS = [
  { id: 'wifi', label: 'Wi-Fi', Icon: Wifi },
  { id: 'parking', label: 'Free parking', Icon: Car },
  { id: 'tv', label: 'TV', Icon: Tv },
  { id: 'radio', label: 'Radio', Icon: Radio },
  { id: 'pets', label: 'Pets allowed', Icon: PawPrint },
  { id: 'entrance', label: 'Private entrance', Icon: DoorOpen },
];

// Lists only what the stay actually has.
const PerksWidget = ({ perks = [] }) => {
  const offered = PERKS.filter((perk) => perks.includes(perk.id));
  if (offered.length === 0) return null;

  return (
    <section className="border-t border-ink/15 py-8">
      <h2 className="font-bold tracking-tight text-3xl">What's included</h2>
      <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {offered.map(({ id, label, Icon }) => (
          <li key={id} className="flex items-center gap-3">
            <Icon aria-hidden strokeWidth={1.5} className="size-5 text-ink/70" />
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PerksWidget;
