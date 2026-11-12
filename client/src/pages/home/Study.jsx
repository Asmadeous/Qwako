import { IMG } from './images';
import { useSectionProgress, photoProps } from './motion';

const SLIDES = [
  {
    title: ['A study in', 'place, light', 'and calm.'],
    text: 'Every home is chosen for its setting, its natural light and the quiet way it fits into the day.',
    image: IMG.evening,
    dark: true,
  },
  {
    title: ['Rooms that', 'hold the', 'evening light.'],
    text: 'Wide windows and warm materials let each day end slowly, with soft light settling into every room.',
    image: IMG.dusk,
    dark: false,
  },
];

const Study = () => {
  const [ref, p] = useSectionProgress();
  const active = p < 0.5 ? 0 : 1;

  return (
    <section ref={ref} className="relative h-[220vh] bg-sand text-ink">
      <div className="sticky top-0 h-[100svh] p-3 pt-14 md:p-4 md:pt-14">
        {SLIDES.map((s, i) => {
          const text = (
            <div
              className={`flex flex-col justify-between rounded-2xl p-6 md:p-8 ${
                s.dark ? 'bg-ink text-sand' : 'bg-white text-ink'
              }`}
            >
              <h2 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
                {s.title.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </h2>
              <div className="flex items-end justify-between gap-6">
                <div className="flex">
                  {SLIDES.map((_, k) => (
                    <span
                      key={k}
                      className={`-ml-1 flex h-9 w-9 items-center justify-center rounded-full border text-[10px] first:ml-0 ${
                        k === i ? 'border-current' : 'border-current opacity-30'
                      }`}
                    >
                      0{k + 1}
                    </span>
                  ))}
                </div>
                <p className="max-w-[16rem] text-xs leading-snug">{s.text}</p>
              </div>
            </div>
          );
          const image = (
            <div className="overflow-hidden rounded-2xl">
              <img {...photoProps(s.image, 1600, '(min-width: 768px) 50vw, 100vw')} alt="" className="h-full w-full object-cover" />
            </div>
          );
          return (
            <div
              key={i}
              className="absolute inset-3 top-14 grid grid-rows-2 gap-3 transition-all duration-700 md:inset-4 md:top-14 md:grid-cols-2 md:grid-rows-1"
              style={{
                opacity: active === i ? 1 : 0,
                transform: `translateY(${active === i ? 0 : i === 0 ? -30 : 30}px)`,
              }}
            >
              {i === 0 ? (
                <>
                  {text}
                  {image}
                </>
              ) : (
                <>
                  {image}
                  {text}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Study;
