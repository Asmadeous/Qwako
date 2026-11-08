import { useState } from 'react';

import { IMG } from './images';
import { ease, lerp, photo, range, useSectionProgress, photoProps } from './motion';

// Scattered start positions (centre x/y and size in vw/vh, rotation in deg).
// Card 0 grows into the full-width slider; the rest drift out and fade.
const START = [
  { x: 52, y: 52, w: 25, h: 32, r: 0 },
  { x: 24, y: 42, w: 19, h: 28, r: 0 },
  { x: 74, y: 30, w: 16, h: 21, r: 6 },
  { x: 20, y: 80, w: 15, h: 19, r: -4 },
  { x: 86, y: 64, w: 17, h: 26, r: -6 },
  { x: 52, y: 88, w: 15, h: 17, r: 3 },
];

const Collage = () => {
  const [ref, p] = useSectionProgress();
  const [slide, setSlide] = useState(0);
  const t = ease(range(p, 0.05, 0.7));
  const done = p > 0.72;
  const images = IMG.collage;

  return (
    <section ref={ref} className="relative h-[320vh] bg-sand text-ink">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <h2
          className="absolute left-1/2 top-[9vh] w-full -translate-x-1/2 text-center font-bold tracking-tight text-4xl leading-tight md:text-5xl"
          style={{ opacity: 1 - range(p, 0.05, 0.3), transform: `translate(-50%, ${-40 * t}px)` }}
        >
          A slower way
          <br />
          to travel
        </h2>

        {START.map((s, i) => {
          const main = i === 0;
          const out = 1 + 0.9 * t;
          const x = main ? lerp(s.x, 50, t) : 50 + (s.x - 50) * out;
          const y = main ? lerp(s.y, 50, t) : 50 + (s.y - 50) * out;
          const w = main ? lerp(s.w, 96, t) : s.w;
          const h = main ? lerp(s.h, 90, t) : s.h;
          const minW = main ? lerp(180, 0, t) : 120;
          return (
            <div
              key={i}
              className="absolute overflow-hidden rounded-xl shadow-xl will-change-transform"
              style={{
                left: `${x}vw`,
                top: `${y}vh`,
                width: `max(${w}vw, ${minW}px)`,
                height: `max(${h}vh, ${main ? lerp(140, 0, t) : 90}px)`,
                transform: `translate(-50%, -50%) rotate(${lerp(s.r, 0, t)}deg)`,
                opacity: main ? 1 : 1 - range(p, 0.2, 0.55),
                zIndex: main ? 2 : 1,
                borderRadius: main ? `${lerp(12, 18, t)}px` : undefined,
              }}
            >
              {main ? (
                images.map((id, k) => (
                  <img
                    key={id}
                    {...photoProps(id, 2000)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                    style={{ opacity: k === slide ? 1 : 0 }}
                  />
                ))
              ) : (
                <img src={photo(images[i], 800)} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          );
        })}

        <div
          className={`absolute bottom-[8vh] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-white transition-opacity duration-500 ${
            done ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <span className="text-sm font-medium drop-shadow">
            {String(slide + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </span>
          <div className="flex gap-2">
            {[-1, 1].map((d) => (
              <button
                key={d}
                aria-label={d < 0 ? 'Previous photo' : 'Next photo'}
                onClick={() => setSlide((s) => (s + d + images.length) % images.length)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink hover:bg-white"
              >
                {d < 0 ? '←' : '→'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Collage;
