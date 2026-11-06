import { IMG } from './images';
import { photo, reveal, useInView } from './motion';

const About = () => {
  const [ref, inView] = useInView(0.25);
  const r = (delay) => reveal(inView, delay);

  return (
    <section id="about" ref={ref} className="bg-sand px-5 py-[18vh] text-ink md:px-8">
      <div className="grid gap-8 md:grid-cols-[1fr_5fr]">
        <span className={`${r(0).className} font-grotesk text-[10px] tracking-[0.24em]`} style={r(0).style}>
          ABOUT
        </span>
        <div>
          <p
            className={`${r(150).className} max-w-5xl font-grotesk text-[8.5vw] font-medium leading-[1.02] tracking-tight md:text-[4.2vw]`}
            style={r(150).style}
          >
            <img
              src={photo(IMG.aboutInline, 400)}
              alt=""
              className="mr-3 inline-block h-[0.8em] w-[1.6em] rounded-md object-cover align-baseline"
            />
            We host homes where design, light and location come together to make
            travel feel unhurried.
          </p>
          <div
            className="mt-10 h-px origin-left bg-ink/40 transition-transform duration-[1600ms] ease-out"
            style={{ transform: `scaleX(${inView ? 1 : 0})`, transitionDelay: '400ms' }}
          />
          <p className={`${r(600).className} mt-6 max-w-xs font-grotesk text-sm leading-snug`} style={r(600).style}>
            T&amp;G BnB is a collection of hand-picked holiday lets across the UK:
            seaside cottages, city flats and quiet cabins, each chosen for how it
            feels to live in.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
