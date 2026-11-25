import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';

// Building blocks for the dashboard overview: cards with a title and a
// grey kicker, small pill links and toggles, and simple SVG charts.

export const Card = ({ title, kicker, action, className, children, ...props }) => (
  <section className={cn('flex flex-col rounded-[28px] bg-paper p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6', className)} {...props}>
    {(title || action) && (
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {title && <h2 className="text-lg leading-tight">{title}</h2>}
          {kicker && <p className="text-sm text-ink/45">{kicker}</p>}
        </div>
        {action}
      </header>
    )}
    {children}
  </section>
);

export const PillLink = ({ to, children, className }) => (
  <Link
    to={to}
    className={cn(
      'inline-flex min-h-8 items-center gap-1 rounded-full bg-ink/[0.05] px-3 text-xs font-medium text-ink/70 transition-colors hover:bg-ink/10 hover:text-ink',
      className,
    )}
  >
    {children}
    <ArrowUpRight aria-hidden className="size-3.5" />
  </Link>
);

// Segmented control, like Day / Week / Month.
export const Toggle = ({ options, value, onChange, label }) => (
  <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-ink/[0.05] p-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        role="radio"
        aria-checked={option.value === value}
        onClick={() => onChange(option.value)}
        className={cn(
          'min-h-8 rounded-full px-3 text-xs font-medium transition-colors',
          option.value === value ? 'bg-paper text-ink shadow-sm' : 'text-ink/55 hover:text-ink',
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const Legend = ({ items }) => (
  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/60">
    {items.map((item) => (
      <li key={item.label} className="flex items-center gap-1.5">
        <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: item.color }} />
        {item.label}
      </li>
    ))}
  </ul>
);

// A progress bar of short dashes, like a gauge.
export const DashBar = ({ value, color = 'rgb(var(--brand))', segments = 24 }) => {
  const lit = Math.round((Math.min(100, Math.max(0, value)) / 100) * segments);
  return (
    <div aria-hidden className="flex gap-[3px]">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className="h-2 flex-1 rounded-full" style={{ background: i < lit ? color : 'rgb(var(--ink) / 0.08)' }} />
      ))}
    </div>
  );
};

const smoothPath = (points) => {
  if (points.length < 2) return '';
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return d;
};

// Lines over hatched bars. `series` are lines ({ label, color, values });
// `bars` are the grey hatched columns behind them. Hover or focus a column to
// read its figures.
export const LineChart = ({ labels, series, bars, format, height = 220, ariaLabel }) => {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState(null);
  const width = 640;
  const pad = { top: 28, right: 12, bottom: 28, left: 12 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const all = [...series.flatMap((s) => s.values), ...(bars ?? [])];
  const max = Math.max(1, ...all);
  const step = innerW / Math.max(1, labels.length - 1);
  const x = (i) => pad.left + i * step;
  const y = (v) => pad.top + innerH - (v / max) * innerH;
  const barW = Math.min(36, step * 0.7);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
        <defs>
          <pattern id={`hatch-${id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" fill="rgb(var(--ink) / 0.04)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="rgb(var(--ink) / 0.12)" strokeWidth="2" />
          </pattern>
        </defs>
        {bars?.map((v, i) => (
          <rect
            key={i}
            x={x(i) - barW / 2}
            y={y(v)}
            width={barW}
            height={Math.max(0, pad.top + innerH - y(v))}
            rx="6"
            fill={`url(#hatch-${id})`}
          />
        ))}
        <line x1={pad.left} x2={width - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke="rgb(var(--ink) / 0.08)" />
        {series.map((s) => (
          <g key={s.label}>
            <path d={smoothPath(s.values.map((v, i) => [x(i), y(v)]))} fill="none" stroke={s.color} strokeWidth="2" />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3.5} fill={s.color} stroke="rgb(var(--paper))" strokeWidth="1.5" />
            ))}
          </g>
        ))}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="rgb(var(--ink) / 0.15)" strokeDasharray="3 3" />
        )}
        {labels.map((label, i) => (
          <text key={label} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill="rgb(var(--ink) / 0.45)">
            {label}
          </text>
        ))}
        {labels.map((label, i) => (
          <rect
            key={`hit-${label}`}
            x={x(i) - step / 2}
            y={0}
            width={step}
            height={height}
            fill="transparent"
            tabIndex={0}
            aria-label={`${label}: ${series.map((s) => `${s.label} ${format(s.values[i])}`).join(', ')}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="outline-none"
          />
        ))}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-xs text-sand shadow-lg"
          style={{ left: `${(x(hover) / width) * 100}%` }}
        >
          {labels[hover]} · {series.map((s) => `${s.label} ${format(s.values[hover])}`).join(' · ')}
        </div>
      )}
    </div>
  );
};

// Vertical bars in the accent palette, tallest first, with a legend of shares.
export const PALETTE = ['#7C9CF5', '#34C77B', 'rgb(var(--brand))', '#C4A5F5', '#F5C451', '#5BC0DE'];

export const ShareBars = ({ items, format }) => {
  const max = Math.max(1, ...items.map((item) => item.value));
  const total = items.reduce((n, item) => n + item.value, 0) || 1;
  return (
    <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
      <ul className="grid gap-1.5 text-xs">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="grow truncate text-ink/60" title={item.label}>
              {item.label}
            </span>
            <span className="tabular font-medium">{Math.round((item.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
      <div aria-hidden className="flex h-28 items-end gap-2 sm:justify-end">
        {items.map((item, i) => (
          <span
            key={item.label}
            title={`${item.label}: ${format(item.value)}`}
            className="w-7 rounded-lg"
            style={{
              height: `${Math.max(8, (item.value / max) * 100)}%`,
              background:
                i === 3
                  ? `repeating-linear-gradient(45deg, ${PALETTE[i]} 0 3px, transparent 3px 6px)`
                  : PALETTE[i % PALETTE.length],
            }}
          />
        ))}
      </div>
    </div>
  );
};
