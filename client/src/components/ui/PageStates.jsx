import { Link } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-ink/[0.07] motion-reduce:animate-none', className)} />
);

export const ListSkeleton = ({ rows = 4 }) => (
  <div aria-busy="true" className="mx-4 grid gap-2">
    <span className="sr-only">Loading</span>
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} className="h-16 w-full" />
    ))}
  </div>
);

export const ErrorNote = ({ children, onRetry }) => (
  <div role="alert" className="mx-4 rounded-2xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900">
    <p>{children}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="mt-2 min-h-9 font-semibold underline underline-offset-4">
        Try again
      </button>
    )}
  </div>
);

// An empty list: what goes here, and one way to fill it.
export const EmptyState = ({ title, children, action, to }) => (
  <div className="mx-4 rounded-3xl border border-dashed border-ink/25 p-8 md:p-10">
    <h2 className="text-balance text-2xl font-bold tracking-tight">{title}</h2>
    {children && <p className="mt-2 max-w-md text-pretty text-sm text-ink/70">{children}</p>}
    {action && to && (
      <Link to={to} className={cn(buttonVariants(), 'mt-6')}>
        {action}
      </Link>
    )}
  </div>
);

// Tabs that are links (?view=), so the browser back button and shared links work.
export const ViewTabs = ({ tabs, current, onChange, label }) => (
  <div role="tablist" aria-label={label} className="mx-4 mb-6 flex gap-1 overflow-x-auto [scrollbar-width:none]">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        type="button"
        role="tab"
        aria-selected={current === tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
          current === tab.id ? 'bg-ink text-sand' : 'border border-ink/20 text-ink/80 hover:border-ink/50',
        )}
      >
        {tab.label}
        {tab.count > 0 && (
          <span className={cn('tabular rounded-full px-1.5 text-xs', current === tab.id ? 'bg-sand/20' : 'bg-ink/10')}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);
