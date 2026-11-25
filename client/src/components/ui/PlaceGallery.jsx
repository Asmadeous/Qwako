import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, LayoutGrid, X } from 'lucide-react';

import { listingPhotoProps } from '@/utils/images';

const Photo = ({ src, alt, className = '', onOpen, sizes, eager }) => (
  <button
    type="button"
    onClick={onOpen}
    className={`group relative block overflow-hidden bg-ink/10 ${className}`}
    aria-label={`${alt}. Open full screen`}
  >
    <img
      {...listingPhotoProps(src, { sizes, width: 1080, eager })}
      alt=""
      className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
    />
  </button>
);

const PlaceGallery = ({ place }) => {
  // Index of the photo shown full screen; null while the viewer is closed.
  const [current, setCurrent] = useState(null);
  const touchStartX = useRef(null);
  const photos = place.photos ?? [];
  const alt = (i) => `${place.title}, photo ${i + 1} of ${photos.length}`;
  const open = current !== null;
  const count = photos.length;
  const show = (i) => setCurrent((i + count) % count);
  const step = (by) => setCurrent((i) => (i + by + count) % count);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  };

  // A sideways swipe of 50px or more moves one photo.
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const moved = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(moved) >= 50) step(moved < 0 ? 1 : -1);
  };

  if (photos.length === 0) {
    return <div className="aspect-[16/9] rounded-2xl bg-ink/10" aria-hidden />;
  }

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && setCurrent(null)}>
      <div className="relative">
        {/* Phones: swipe through every photo. */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:hidden">
          {photos.map((src, i) => (
            <Photo
              key={src}
              src={src}
              alt={alt(i)}
              onOpen={() => show(i)}
              sizes="88vw"
              eager={i === 0}
              className={`aspect-[4/3] shrink-0 snap-center rounded-2xl ${photos.length > 1 ? 'w-[88%]' : 'w-full'}`}
            />
          ))}
        </div>

        {/* Larger screens: one lead photo, up to two beside it. */}
        <div
          className={`hidden h-[min(62dvh,540px)] gap-2 overflow-hidden rounded-2xl md:grid ${
            photos.length >= 3
              ? 'grid-cols-[2fr_1fr] grid-rows-2'
              : photos.length === 2
                ? 'grid-cols-2'
                : ''
          }`}
        >
          <Photo
            src={photos[0]}
            alt={alt(0)}
            onOpen={() => show(0)}
            sizes={
              photos.length >= 3
                ? '(min-width: 1280px) 820px, 64vw'
                : photos.length === 2
                  ? '50vw'
                  : '100vw'
            }
            eager
            className={photos.length >= 3 ? 'row-span-2' : ''}
          />
          {photos.slice(1, 3).map((src, i) => (
            <Photo
              key={src}
              src={src}
              alt={alt(i + 1)}
              onOpen={() => show(i + 1)}
              sizes={
                photos.length >= 3 ? '(min-width: 1280px) 410px, 32vw' : '50vw'
              }
            />
          ))}
        </div>

        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => show(0)}
            className="absolute bottom-3 right-3 hidden h-10 items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 text-sm text-ink shadow-sm transition-colors hover:bg-sand md:flex">
            <LayoutGrid aria-hidden strokeWidth={1.5} className="size-4" />
            <span className="tabular">Show all {photos.length} photos</span>
          </button>
        )}
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black" />
        <Dialog.Content
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 flex flex-col bg-black text-white focus:outline-none"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
            <Dialog.Title className="truncate text-base font-semibold">{place.title}</Dialog.Title>
            <div className="flex items-center gap-4">
              <p className="tabular text-sm text-white/80" aria-live="polite">
                {open && `${current + 1} / ${count}`}
              </p>
              <Dialog.Close
                aria-label="Close photos"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <X aria-hidden className="size-5" />
              </Dialog.Close>
            </div>
          </div>
          <Dialog.Description className="sr-only">
            Photos of this home, one at a time. Use the arrow buttons, the arrow keys or swipe to move between them.
          </Dialog.Description>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 md:px-20">
            {open && (
              <img
                key={photos[current]}
                {...listingPhotoProps(photos[current], { sizes: '100vw', width: 1600, maxW: 2400, eager: true })}
                alt={alt(current)}
                className="max-h-full max-w-full select-none object-contain"
                draggable={false}
              />
            )}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25 md:left-6"
                >
                  <ChevronLeft aria-hidden className="size-6" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25 md:right-6"
                >
                  <ChevronRight aria-hidden className="size-6" />
                </button>
              </>
            )}
          </div>

          {/* Load the neighbouring photos in the background so moving is instant. */}
          {open && count > 1 && (
            <div className="hidden" aria-hidden>
              {[current - 1, current + 1].map((i) => {
                const src = photos[(i + count) % count];
                return <img key={`next-${src}`} {...listingPhotoProps(src, { sizes: '100vw', width: 1600, maxW: 2400, eager: true })} alt="" />;
              })}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PlaceGallery;
