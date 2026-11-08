import { IMG } from './images';
import { ease, lerp, range, reveal, useInView, useSectionProgress, photoProps } from './motion';

const Grand = () => {
  const [headRef, inView] = useInView(0.4);
  const [ref, p] = useSectionProgress();
  const t = ease(range(p, 0.05, 0.75));
  const r = (d) => reveal(inView, d);

  return (
    <>
      <section className="relative bg-white px-5 pt-[22vh] pb-[12vh] text-center text-ink">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-sand to-white" />
        <div ref={headRef} className="relative">
          <span className={`${r(0).className} block font-grotesk text-[9px] tracking-[0.3em]`} style={r(0).style}>
            THE CITY LOFT
          </span>
          <h2 className={`${r(150).className} mt-4 font-serif text-[13vw] leading-[0.95] md:text-[6.5vw]`} style={r(150).style}>
            Small spaces,
            <br />
            carefully kept.
          </h2>
        </div>
      </section>

      <section ref={ref} className="relative h-[240vh] bg-white">
        <div className="sticky top-0 flex h-[100svh] items-center justify-center overflow-hidden">
          <div
            className="relative overflow-hidden will-change-transform"
            style={{
              width: `${lerp(26, 100, t)}vw`,
              height: `${lerp(32, 100, t)}vh`,
              minWidth: `${lerp(240, 0, t)}px`,
              borderRadius: `${lerp(16, 0, t)}px`,
            }}
          >
            <img {...photoProps(IMG.smallRoom, 2400)} alt="Warm, sunlit living room" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" style={{ opacity: t }} />
            <h3
              className="absolute bottom-[8vh] left-5 font-grotesk text-[13vw] font-medium leading-[0.95] tracking-tight text-white md:left-8 md:text-[6vw]"
              style={{ opacity: range(p, 0.6, 0.85), transform: `translateY(${lerp(30, 0, range(p, 0.6, 0.85))}px)` }}
            >
              Stay a little
              <br />
              longer.
            </h3>
          </div>
        </div>
      </section>
    </>
  );
};

export default Grand;
