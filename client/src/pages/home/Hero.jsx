import { Link } from 'react-router-dom';

import { IMG } from './images';
import { photoProps } from './motion';

const Hero = () => (
  <section id="top" className="relative h-[100svh] min-h-[560px] overflow-hidden bg-ink text-white">
    <img
      {...photoProps(IMG.hero, 2400, '100vw', { eager: true })}
      alt="Modern house in the evening light"
      className="absolute inset-0 h-full w-full animate-[heroZoom_2.4s_ease-out_both] object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/55" />

    <div className="relative flex h-full flex-col px-5 pt-20 pb-6 md:px-8">
      <h1 className="animate-[fadeUp_1.2s_ease-out_0.2s_both] font-bold tracking-tight text-[15vw] leading-[0.9] md:text-[8.5vw]">
        Homes,
        <br />
        considered.
      </h1>
      <div className="mt-6 flex animate-[fadeUp_1.2s_ease-out_0.5s_both] flex-wrap gap-6 text-sm font-medium">
        <Link to="/homes" className="border-b border-white/80 pb-0.5 hover:border-white">
          Browse homes <span className="ml-2">→</span>
        </Link>
        <a href="#featured" className="border-b border-white/80 pb-0.5 hover:border-white">
          See featured homes <span className="ml-2">→</span>
        </a>
      </div>

      <div className="mt-auto grid animate-[fadeUp_1.2s_ease-out_0.8s_both] grid-cols-2 gap-y-3 text-sm font-medium md:mt-[14vh] md:grid-cols-4">
        <span>Featured homes</span>
        <span className="text-right md:text-center">Across Kenya</span>
        <span className="md:text-center">2026</span>
        <a href="#featured" className="text-right">Explore</a>
      </div>

      <p className="mx-auto mt-8 max-w-xs animate-[fadeUp_1.2s_ease-out_1s_both] text-center text-sm leading-snug md:mt-auto">
        A good stay is more than a bed for the night.
        <br />
        It is how the light finds you in the morning.
      </p>
    </div>
  </section>
);

export default Hero;
