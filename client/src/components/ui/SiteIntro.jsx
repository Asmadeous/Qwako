import { useEffect } from 'react';

const MIN_SHOW = 1200; // ms from page start the logo stays up, so the screen never just flickers
const MAX_WAIT = 7000; // ms from page start after which the site opens even if something is still loading
const OPEN = 1100; // ms the move and the opening take (matches index.html)

let started = false;

// Opens the loading screen in index.html once the page has loaded: the two
// halves slide apart and the centred logo moves onto the header logo.
// Anything marked data-intro-hold (the home page's cover photo) keeps it closed
// until it is ready, up to MAX_WAIT.
const openIntro = () => {
  const intro = document.getElementById('site-intro');
  const root = document.documentElement;
  if (!intro) {
    root.classList.remove('intro-running', 'intro-hold');
    return;
  }

  const finish = () => {
    root.classList.remove('intro-running', 'intro-hold');
    intro.remove();
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.remove('intro-hold');
    intro.style.transition = 'opacity 0.3s ease';
    intro.style.opacity = '0';
    setTimeout(finish, 300);
    return;
  }

  const logo = intro.querySelector('.intro-logo');
  const target = [...document.querySelectorAll('[data-site-logo]')].find(
    (el) => el.getBoundingClientRect().width > 0,
  );

  if (target) {
    const from = logo.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    // Pin the logo where it is, then move and shrink it onto the header logo.
    logo.style.left = `${from.left}px`;
    logo.style.top = `${from.top}px`;
    logo.style.transform = 'none';
    logo.getBoundingClientRect();
    logo.style.transition = `transform ${OPEN}ms cubic-bezier(0.76, 0, 0.24, 1)`;
    logo.style.transform = `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width})`;

    // Over a light page the header logo is the dark one: fade over to it on the way.
    const white = logo.querySelector('img.white');
    if (target.currentSrc && !target.currentSrc.endsWith(white.getAttribute('src'))) {
      const swap = logo.querySelector('img.target');
      swap.src = target.currentSrc;
      swap.style.opacity = '1';
      white.style.opacity = '0';
    }
  } else {
    logo.style.transition = 'opacity 0.5s ease';
    logo.style.opacity = '0';
  }

  intro.classList.add('is-open');
  root.classList.remove('intro-hold');
  setTimeout(finish, OPEN + 50);
};

const SiteIntro = () => {
  useEffect(() => {
    if (started) return;
    started = true;

    const loaded = () => document.readyState === 'complete';
    const held = () => document.querySelector('[data-intro-hold]');

    const check = () => {
      const waited = performance.now(); // since the page started loading
      if (waited >= MAX_WAIT || (waited >= MIN_SHOW && loaded() && !held())) {
        requestAnimationFrame(openIntro);
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  }, []);

  return null;
};

export default SiteIntro;
