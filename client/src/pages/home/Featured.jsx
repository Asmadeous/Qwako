import { Link } from 'react-router-dom';

import { usePlaces } from '../../../hooks';
import { formatPrice } from '@/utils/currency';
import { range, useSectionProgress } from './motion';
import { unsplashSrcSet } from '@/utils/images';

// The 3D "structure" walkthrough on the reference site becomes a full-screen
// walk through seven featured stays, with the same numbering and progress UI.
const PICKS = [
  'Diani Beach Villa',
  'Shela Village House',
  'Karen Garden House',
  'Nanyuki Forest Cabin',
  'Watamu Ocean House',
  'Naivasha Lakeside Cottage',
  'Westlands Skyline Apartment',
];

const Featured = () => {
  const { places } = usePlaces();
  const [ref, p] = useSectionProgress();

  const picked = PICKS.map((t) => places.find((pl) => pl.title === t)).filter(Boolean);
  const stays = (picked.length >= 4 ? picked : places.slice(0, 7)).slice(0, 7);
  const n = Math.max(stays.length, 1);
  const active = Math.min(n - 1, Math.floor(p * n));

  return (
    <section id="featured" ref={ref} className="relative bg-ink text-white" style={{ height: `${n * 100}vh` }}>
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {stays.map((s, i) => (
          <img
            key={s.id}
            src={s.photos?.[0]?.replace(/w=\d+/, 'w=2400')}
            srcSet={unsplashSrcSet(s.photos?.[0], 2400)}
            sizes="100vw"
            alt={s.title}
            className="absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out"
            style={{
              opacity: i === active ? 1 : 0,
              transform: `scale(${i === active ? 1 + 0.06 * range(p * n - i, 0, 1) : 1.08})`,
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/20" />

        {/* vertical dots */}
        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col items-center gap-3 md:right-8">
          {stays.map((s, i) => (
            <span
              key={s.id}
              className={`block rounded-full border border-white transition-all ${
                i === active ? 'h-2.5 w-2.5 bg-white' : 'h-1.5 w-1.5 bg-transparent opacity-60'
              }`}
            />
          ))}
        </div>

        {stays[active] && (
          <div className="absolute inset-x-5 bottom-6 md:inset-x-8">
            <div className="flex items-end justify-between gap-6">
              <div key={active} className="animate-[fadeUp_0.8s_ease-out_both]">
                <span className="flex items-center gap-2 text-sm font-medium text-white/70">
                  <span className="h-px w-5 bg-white/70" /> Featured stay
                </span>
                <Link to={`/place/${stays[active].id}`} className="mt-2 block text-3xl font-bold tracking-tight hover:underline md:text-5xl">
                  {stays[active].title}
                </Link>
                <span className="mt-2 block text-sm font-medium text-white/80">
                  {stays[active].address},{' '}
                  {formatPrice(stays[active].nightly_price_cents, stays[active].currency)} a night
                </span>
              </div>
              <div className="text-right">
                <span className="block text-6xl font-bold leading-none md:text-8xl">
                  {String(active + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium text-white/60">
                  of {String(n).padStart(2, '0')}
                </span>
              </div>
            </div>
            {/* progress line with ticks */}
            <div className="relative mt-5 h-px bg-white/30">
              <div className="absolute inset-y-0 left-0 bg-white" style={{ width: `${p * 100}%` }} />
              {stays.map((s, i) => (
                <span key={s.id} className="absolute top-[-3px] h-[7px] w-px bg-white/50" style={{ left: `${(i / n) * 100}%` }} />
              ))}
              <span className="absolute top-[-4px] h-[9px] w-[9px] -translate-x-1/2 rounded-full bg-white" style={{ left: `${p * 100}%` }} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Featured;
