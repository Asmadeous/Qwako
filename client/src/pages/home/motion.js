import { useEffect, useRef, useState } from 'react';

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
// Progress of `p` through the window [start, end], clamped to 0..1
export const range = (p, start, end) => clamp((p - start) / (end - start));
export const ease = (t) => 1 - Math.pow(1 - t, 3);

export const photo = (id, w = 2000) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

// 0 when a tall section's top reaches the top of the screen, 1 when its
// bottom reaches the bottom. Used for sticky, scroll-driven scenes.
export const useSectionProgress = () => {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const distance = rect.height - window.innerHeight;
        setProgress(distance > 0 ? clamp(-rect.top / distance) : 0);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return [ref, progress];
};

// True once the element has scrolled into view (for fade-up reveals)
export const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView];
};

export const reveal = (inView, delay = 0) => ({
  className: `transition-all duration-1000 ease-out ${
    inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
  }`,
  style: { transitionDelay: `${delay}ms` },
});
