import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

// Page numbers to show: the first, the last, and two either side of the
// current page, with gaps marked as null.
const pageList = (page, pages) => {
  const wanted = new Set([
    1,
    pages,
    page - 2,
    page - 1,
    page,
    page + 1,
    page + 2,
  ]);
  const list = [...wanted]
    .filter((n) => n >= 1 && n <= pages)
    .sort((a, b) => a - b);
  return list.flatMap((n, i) =>
    i > 0 && n - list[i - 1] > 1 ? [null, n] : [n],
  );
};

// The paging fields of an API list response, as Pagination's props.
export const pageProps = (data) => ({
  page: data.page,
  pages: data.pages,
  total: data.total,
  perPage: data.per_page,
});

const pageButton =
  'grid size-9 place-items-center rounded-full text-sm transition-colors';

// "Showing 26–50 of 1,032" with Previous, page numbers and Next.
const Pagination = ({
  page,
  pages,
  total,
  perPage,
  onPage,
  label = 'results',
  className,
}) => {
  if (!total) return null;
  const first = (page - 1) * perPage + 1;
  const last = Math.min(total, page * perPage);

  return (
    <nav
      aria-label="Pages"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 pt-4',
        className,
      )}
    >
      <p className="tabular text-sm text-ink/55">
        Showing {first.toLocaleString()}–{last.toLocaleString()} of{' '}
        {total.toLocaleString()} {label}
      </p>
      {pages > 1 && (
        <ul className="flex items-center gap-1">
          <li>
            <button
              type="button"
              onClick={() => onPage(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
              className={cn(
                pageButton,
                'bg-ink/[0.05] hover:bg-ink/10 disabled:opacity-40 disabled:hover:bg-ink/[0.05]',
              )}
            >
              <ChevronLeft aria-hidden className="size-4" />
            </button>
          </li>
          {pageList(page, pages).map((n, i) =>
            n === null ? (
              <li key={`gap-${i}`} aria-hidden className="px-1 text-ink/40">
                …
              </li>
            ) : (
              <li key={n}>
                <button
                  type="button"
                  onClick={() => onPage(n)}
                  aria-label={`Page ${n}`}
                  aria-current={n === page ? 'page' : undefined}
                  className={cn(
                    'tabular',
                    pageButton,
                    n === page
                      ? 'bg-ink font-semibold text-sand'
                      : 'hover:bg-ink/10',
                  )}
                >
                  {n}
                </button>
              </li>
            ),
          )}
          <li>
            <button
              type="button"
              onClick={() => onPage(page + 1)}
              disabled={page >= pages}
              aria-label="Next page"
              className={cn(
                pageButton,
                'bg-ink/[0.05] hover:bg-ink/10 disabled:opacity-40 disabled:hover:bg-ink/[0.05]',
              )}
            >
              <ChevronRight aria-hidden className="size-4" />
            </button>
          </li>
        </ul>
      )}
    </nav>
  );
};

export default Pagination;
