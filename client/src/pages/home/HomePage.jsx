import { useEffect } from 'react';

import Nav from './Nav';
import Hero from './Hero';
import Collage from './Collage';
import About from './About';
import Marquee from './Marquee';
import Featured from './Featured';
import Study from './Study';
import Grand from './Grand';
import Inside from './Inside';
import StepInside from './StepInside';
import SiteFooter from './SiteFooter';
import './home.css';

const HomePage = () => {
  useEffect(() => {
    document.title = 'T&G BnB — Stays, Considered.';
    return () => {
      document.title = 'T&G BnB';
    };
  }, []);

  return (
    <main className="home bg-sand font-grotesk antialiased">
      <Nav />
      <Hero />
      <Collage />
      <About />
      <Marquee />
      <Featured />
      <Study />
      <Grand />
      <Inside />
      <StepInside />
      <SiteFooter />
    </main>
  );
};

export default HomePage;
