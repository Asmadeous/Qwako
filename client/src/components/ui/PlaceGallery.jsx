import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { LayoutGrid, X } from 'lucide-react';

const Photo = ({ src, alt, className = '', onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className={`group relative block overflow-hidden bg-ink/10 ${className}`}
    aria-label={`${alt}. Show all photos`}
  >
    <img
      src={src}
      alt=""
      className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
    />
  </button>
);

const PlaceGallery = ({ place }) => {
  const [open, setOpen] = useState(false);
  const photos = place.photos ?? [];
  const alt = (i) => `${place.title}, photo ${i + 1} of ${photos.length}`;

  if (photos.length === 0) {
    return <div className="aspect-[16/9] rounded-2xl bg-ink/10" aria-hidden />;
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="relative">
        {/* Phones: swipe through every photo. */}
        <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:hidden">
          {photos.map((src, i) => (
            <Photo
              key={src}
              src={src}
              alt={alt(i)}
              onOpen={() => setOpen(true)}
              className={`aspect-[4/3] shrink-0 snap-center rounded-2xl ${photos.length > 1 ? 'w-[88%]' : 'w-full'}`}
            />
          ))}
        </div>

        {/* Larger screens: one lead photo, up to two beside it. */}
        <div
          className={`hidden h-[min(62dvh,540px)] gap-2 overflow-hidden rounded-2xl md:grid ${
            photos.length >= 3 ? 'grid-cols-[2fr_1fr] grid-rows-2' : photos.length === 2 ? 'grid-cols-2' : ''
          }`}
        >
          <Photo src={photos[0]} alt={alt(0)} onOpen={() => setOpen(true)} className={photos.length >= 3 ? 'row-span-2' : ''} />
          {photos.slice(1, 3).map((src, i) => (
            <Photo key={src} src={src} alt={alt(i + 1)} onOpen={() => setOpen(true)} />
          ))}
        </div>

        {photos.length > 1 && (
          <Dialog.Trigger className="absolute bottom-3 right-3 hidden h-10 items-center gap-2 rounded-full border border-ink/15 bg-paper px-4 text-sm text-ink shadow-sm transition-colors hover:bg-sand md:flex">
            <LayoutGrid aria-hidden strokeWidth={1.5} className="size-4" />
            <span className="tabular">Show all {photos.length} photos</span>
          </Dialog.Trigger>
        )}
      </div>

      <Dialog.Portal>
        <Dialog.Content className="fixed inset-0 z-50 overflow-y-auto bg-paper focus:outline-none">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink/10 bg-paper/95 px-4 py-3 md:px-8">
            <Dialog.Title className="truncate font-bold tracking-tight text-2xl">{place.title}</Dialog.Title>
            <Dialog.Description className="sr-only">All photos of this home</Dialog.Description>
            <Dialog.Close
              aria-label="Close photos"
              className="grid size-11 shrink-0 place-items-center rounded-full border border-ink/15 transition-colors hover:bg-sand"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>
          </div>
          <div className="mx-auto grid max-w-4xl gap-3 px-4 py-6 md:px-8">
            {photos.map((src, i) => (
              <img key={src} src={src} alt={alt(i)} loading="lazy" className="w-full rounded-2xl bg-ink/10" />
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default PlaceGallery;
