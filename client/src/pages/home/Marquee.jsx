import { IMG } from './images';
import { ease, lerp, range, useSectionProgress, photoProps } from './motion';

const WORD = 'T&G / BNB';

const Marquee = () => {
  const [ref, p] = useSectionProgress();
  const t = ease(range(p, 0.12, 0.85));

  return (
    <section ref={ref} className="relative h-[260vh] bg-sand text-ink">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div
          className="flex w-max animate-marquee whitespace-nowrap font-grotesk text-[17vw] font-semibold leading-none tracking-[-0.04em] md:text-[11vw]"
          style={{ opacity: 1 - range(p, 0.45, 0.75) }}
          aria-hidden="true"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="px-[3vw]">
              {WORD}
            </span>
          ))}
        </div>

        <div
          className="absolute left-1/2 top-1/2 overflow-hidden will-change-transform"
          style={{
            width: `${lerp(28, 100, t)}vw`,
            height: `${lerp(24, 100, t)}vh`,
            minWidth: `${lerp(220, 0, t)}px`,
            transform: 'translate(-50%, -50%)',
            borderRadius: `${lerp(4, 0, t)}px`,
          }}
        >
          <img {...photoProps(IMG.marquee, 2400)} alt="" className="h-full w-full object-cover" />
        </div>

        <span
          className="absolute bottom-6 left-1/2 -translate-x-1/2 font-grotesk text-[10px] tracking-[0.3em] text-ink/60"
          style={{ opacity: 1 - range(p, 0.05, 0.25) }}
        >
          SCROLL TO ENTER
        </span>
      </div>
    </section>
  );
};

export default Marquee;
