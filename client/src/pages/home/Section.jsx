import { cn } from '@/lib/utils';

// One band of the home page: a heading, an optional link or note on the right, then the content.
const Section = ({ id, title, aside, className, children }) => (
  <section id={id} className={cn('scroll-mt-20 px-5 py-16 md:px-8 md:py-24', className)}>
    <div className="mx-auto max-w-screen-xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">{title}</h2>
        {aside}
      </div>
      <div className="mt-8 md:mt-10">{children}</div>
    </div>
  </section>
);

export default Section;
