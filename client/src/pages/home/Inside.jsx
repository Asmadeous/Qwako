import { IMG } from './images';
import { photo, useSectionProgress, photoProps } from './motion';

const ROOMS = [
  {
    label: 'THE LIVING ROOM',
    title: ['Room to', 'unwind.'],
    text: 'Comfortable sofas, good light and space to spread out. Everything you need for a slow evening in.',
    tags: 'FAST WI-FI · LIVING AREA · KITCHEN · TV',
    image: IMG.living,
  },
  {
    label: 'THE BEDROOM',
    title: ['Mornings,', 'unhurried.'],
    text: 'Crisp linen, blackout curtains and a window onto the garden. A room that asks nothing of you but rest.',
    tags: 'GARDEN VIEW · QUALITY LINEN',
    image: IMG.bedroom,
  },
  {
    label: 'THE SECOND ROOM',
    title: ['Space for', 'one more.'],
    text: 'A second bedroom kept just as carefully, for family, friends or a quiet place to work.',
    tags: 'FLEXIBLE · CALM · NATURAL LIGHT',
    image: IMG.secondRoom,
  },
];

const Inside = () => {
  const [ref, p] = useSectionProgress();
  const active = Math.min(ROOMS.length - 1, Math.floor(p * ROOMS.length));
  const prev = ROOMS[(active + ROOMS.length - 1) % ROOMS.length];
  const next = ROOMS[(active + 1) % ROOMS.length];

  return (
    <section id="inside" ref={ref} className="relative h-[330vh] bg-sand text-ink">
      <div className="sticky top-0 h-[100svh] overflow-hidden px-5 pt-14 pb-6 md:px-8">
        <div className="grid h-full grid-rows-[1fr_auto] gap-5 md:grid-cols-[1fr_minmax(0,36vw)_1fr] md:grid-rows-1">
          {/* left: previous thumb + counter */}
          <div className="hidden flex-col justify-between md:flex">
            <img
              key={`p-${active}`}
              src={photo(prev.image, 300)}
              alt=""
              className="ml-auto h-24 w-20 animate-[fadeUp_0.7s_ease-out_both] rounded-lg object-cover"
            />
            <span className="font-grotesk text-[9px] tracking-[0.3em]">
              INSIDE THE STAY &nbsp; {String(active + 1).padStart(2, '0')}{' '}
              <span className="text-ink/40">/ {String(ROOMS.length).padStart(2, '0')}</span>
            </span>
          </div>

          {/* centre: main image */}
          <div className="relative overflow-hidden rounded-2xl">
            {ROOMS.map((room, i) => (
              <img
                key={room.label}
                {...photoProps(room.image, 1600)}
                alt={room.label.toLowerCase()}
                className="absolute inset-0 h-full w-full object-cover transition-all duration-1000"
                style={{ opacity: i === active ? 1 : 0, transform: `scale(${i === active ? 1 : 1.05})` }}
              />
            ))}
          </div>

          {/* right: text + next thumb */}
          <div className="flex flex-col justify-between md:pl-4">
            <div key={active} className="animate-[fadeUp_0.8s_ease-out_both] md:mt-[22vh]">
              <span className="font-grotesk text-[9px] tracking-[0.3em]">{ROOMS[active].label}</span>
              <h3 className="mt-3 font-grotesk text-3xl leading-[1.05] tracking-tight md:text-4xl">
                {ROOMS[active].title.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </h3>
              <p className="mt-4 max-w-xs font-grotesk text-xs leading-snug">{ROOMS[active].text}</p>
              <span className="mt-4 block font-grotesk text-[9px] tracking-[0.24em] text-ink/70">
                {ROOMS[active].tags}
              </span>
            </div>
            <img
              key={`n-${active}`}
              src={photo(next.image, 300)}
              alt=""
              className="hidden h-24 w-20 animate-[fadeUp_0.7s_ease-out_both] rounded-lg object-cover md:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Inside;
