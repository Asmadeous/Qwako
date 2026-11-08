import { Link } from 'react-router-dom';

import { IMG } from './images';
import { reveal, useInView, photoProps } from './motion';

const KEYS = [
  { keys: ['S'], label: 'SEARCH' },
  { keys: ['F'], label: 'FILTER' },
  { keys: ['B'], label: 'BOOK' },
];

const StepInside = () => {
  const [ref, inView] = useInView(0.3);
  const r = (d) => reveal(inView, d);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[560px] overflow-hidden text-white">
      <img {...photoProps(IMG.stepInside, 2400)} alt="Brick house with gables under an evening sky" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

      <div className="relative flex h-full flex-col px-5 pt-14 pb-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-grotesk text-[9px] tracking-[0.3em] text-white/80">EXPLORE T&amp;G STAYS</span>
          <ul className="flex flex-wrap items-center gap-4 font-grotesk text-[9px] tracking-[0.24em]">
            {KEYS.map((k) => (
              <li key={k.label} className="flex items-center gap-2">
                {k.keys.map((key) => (
                  <kbd key={key} className="flex h-6 w-6 items-center justify-center rounded border border-white/70 font-grotesk text-[10px]">
                    {key}
                  </kbd>
                ))}
                {k.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <h2 className={`${r(0).className} font-grotesk text-[17vw] font-medium leading-[0.9] tracking-tight md:text-[7vw]`} style={r(0).style}>
            Step inside.
          </h2>
          <div className={`${r(250).className} max-w-sm`} style={r(250).style}>
            <p className="font-grotesk text-sm leading-snug">
              Go beyond the photographs. Browse every T&amp;G stay, filter by place, price
              and amenities, and book your dates in minutes.
            </p>
            <Link
              to="/stays"
              className="mt-5 inline-flex items-center gap-3 rounded-full border border-white/80 px-5 py-2.5 font-grotesk text-[10px] tracking-[0.24em] transition hover:bg-white hover:text-ink"
            >
              BROWSE STAYS <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StepInside;
