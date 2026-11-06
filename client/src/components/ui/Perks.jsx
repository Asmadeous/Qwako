import { Car, DoorOpen, PawPrint, Radio, Tv, Wifi } from 'lucide-react';

const PERKS = [
  { id: 'wifi', label: 'Wi-Fi', Icon: Wifi },
  { id: 'parking', label: 'Free parking', Icon: Car },
  { id: 'tv', label: 'TV', Icon: Tv },
  { id: 'radio', label: 'Radio', Icon: Radio },
  { id: 'pets', label: 'Pets allowed', Icon: PawPrint },
  { id: 'entrance', label: 'Private entrance', Icon: DoorOpen },
];

const Perks = ({ selected, handleFormData }) => (
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {PERKS.map(({ id, label, Icon }) => (
      <label
        key={id}
        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-ink/20 px-3 py-2 text-sm transition-colors hover:border-ink/50 has-[:checked]:border-ink has-[:checked]:bg-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink"
      >
        <input
          type="checkbox"
          className="size-4 accent-ink"
          checked={selected.includes(id)}
          name={id}
          onChange={handleFormData}
        />
        <Icon aria-hidden strokeWidth={1.5} className="size-5 shrink-0 text-ink/70" />
        <span className="whitespace-nowrap">{label}</span>
      </label>
    ))}
  </div>
);

export default Perks;
