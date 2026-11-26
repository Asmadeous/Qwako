import { areaOf, useHomePhotos } from './images';
import { photo, useSectionProgress, photoProps } from './motion';

// How many photos the "Inside" scroll walks through.
const ROOM_COUNT = 3;

const Inside = () => {
  const [ref, p] = useSectionProgress();
  // Photos named from their file names, after the ones used higher up the page.
  const { pool } = useHomePhotos();
  const rooms = pool
    .slice(1)
    .filter((item) => item.alt !== item.home.title)
    .slice(0, ROOM_COUNT)
    .map((item) => ({ label: item.home.title, title: [item.alt], tags: areaOf(item.home), image: item.url }));
  if (rooms.length === 0) return null;
  const active = Math.min(rooms.length - 1, Math.floor(p * rooms.length));
  const prev = rooms[(active + rooms.length - 1) % rooms.length];
  const next = rooms[(active + 1) % rooms.length];

  return (
    <section id="inside" ref={ref} className="relative bg-sand text-ink" style={{ height: `${rooms.length * 110}vh` }}>
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
            <span className="text-sm font-medium">
              Inside the home &nbsp; {String(active + 1).padStart(2, '0')}{' '}
              <span className="text-ink/40">/ {String(rooms.length).padStart(2, '0')}</span>
            </span>
          </div>

          {/* centre: main image */}
          <div className="relative overflow-hidden rounded-2xl">
            {rooms.map((room, i) => (
              <img
                key={room.image}
                {...photoProps(room.image, 1600, '(min-width: 768px) 50vw, 100vw')}
                alt={room.title[0]}
                className="absolute inset-0 h-full w-full object-cover transition-all duration-1000"
                style={{ opacity: i === active ? 1 : 0, transform: `scale(${i === active ? 1 : 1.05})` }}
              />
            ))}
          </div>

          {/* right: text + next thumb */}
          <div className="flex flex-col justify-between md:pl-4">
            <div key={active} className="animate-[fadeUp_0.8s_ease-out_both] md:mt-[22vh]">
              <span className="text-sm font-medium">{rooms[active].label}</span>
              <h3 className="mt-3 text-3xl font-bold leading-[1.05] tracking-tight md:text-4xl">
                {rooms[active].title.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </h3>
              <span className="mt-4 block text-sm font-medium text-ink/70">
                {rooms[active].tags}
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
