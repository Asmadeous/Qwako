import { Link } from 'react-router-dom';

import { IMG } from './images';
import { photo } from './motion';

const Hero = () => (
  <section id="top" className="relative h-[100svh] min-h-[560px] overflow-hidden bg-ink text-white">
    <img
      src={photo(IMG.hero, 2400)}
      alt="Modern house in the evening light"
      className="absolute inset-0 h-full w-full animate-[heroZoom_2.4s_ease-out_both] object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/40" />

    <div className="relative flex h-full flex-col px-5 pt-14 pb-6 md:px-8">
      <h1 className="animate-[fadeUp_1.2s_ease-out_0.2s_both] font-serif text-[18vw] leading-[0.85] tracking-tight md:text-[8.5vw]">
        Stays,
        <br />
        Considered.
      </h1>
      <div className="mt-6 flex animate-[fadeUp_1.2s_ease-out_0.5s_both] flex-wrap gap-6 font-grotesk text-xs tracking-[0.08em]">
        <Link to="/stays" className="border-b border-white/80 pb-0.5 hover:border-white">
          BROWSE STAYS <span className="ml-2">→</span>
        </Link>
        <a href="#featured" className="border-b border-white/80 pb-0.5 hover:border-white">
          SEE FEATURED <span className="ml-2">→</span>
        </a>
      </div>

      <div className="mt-auto grid animate-[fadeUp_1.2s_ease-out_0.8s_both] grid-cols-2 gap-y-3 font-grotesk text-[11px] tracking-[0.22em] md:mt-[14vh] md:grid-cols-4">
        <span>FEATURED STAY</span>
        <span className="text-right md:text-center">WATAMU, KENYA</span>
        <span className="md:text-center">2026</span>
        <a href="#featured" className="text-right">EXPLORE</a>
      </div>

      <p className="mx-auto mt-8 max-w-xs animate-[fadeUp_1.2s_ease-out_1s_both] text-center font-grotesk text-sm leading-snug md:mt-auto">
        A good stay is more than a bed for the night.
        <br />
        It is how the light finds you in the morning.
      </p>
    </div>
  </section>
);

export default Hero;
