import { useEffect } from 'react';

import { Header } from '@/components/ui/Header';
import Hero from './Hero';
import Collage from './Collage';
import About from './About';
import Marquee from './Marquee';
import Featured from './Featured';
import Study from './Study';
import Grand from './Grand';
import Inside from './Inside';
import Reviews from './Reviews';
import WhyDirect from './WhyDirect';
import Location from './Location';
import Questions from './Questions';
import StepInside from './StepInside';
import SiteFooter from './SiteFooter';
import './home.css';

const HomePage = () => {
  useEffect(() => {
    document.title = 'TG-Homes | Holiday homes in Kenya';
    return () => {
      document.title = 'TG-Homes';
    };
  }, []);

  return (
    <main className="home bg-sand text-ink antialiased">
      <Header />
      <Hero />
      <Featured />
      <About />
      <Inside />
      <WhyDirect />
      <Collage />
      <Reviews />
      <Location />
      <Study />
      <Questions />
      <Grand />
      <Marquee />
      <StepInside />
      <SiteFooter />
    </main>
  );
};

export default HomePage;
