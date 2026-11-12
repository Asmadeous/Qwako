import { amenityIcon } from '@/utils/amenities';

// Lists only what the stay actually has.
const PerksWidget = ({ perks = [] }) => {
  if (perks.length === 0) return null;

  return (
    <section className="border-t border-ink/15 py-8">
      <h2 className="font-bold tracking-tight text-3xl">What's included</h2>
      <ul className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {perks.map(({ key, name }) => {
          const Icon = amenityIcon(key);
          return (
            <li key={key} className="flex items-center gap-3">
              <Icon aria-hidden strokeWidth={1.5} className="size-5 text-ink/70" />
              {name}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default PerksWidget;
