import { Heart } from 'lucide-react';

import { useSaved } from '@/providers/SavedProvider';
import { cn } from '@/lib/utils';

// The heart: saves a home to the guest's list (signing in first if needed).
const SaveButton = ({ place, className, withLabel = false, onChange }) => {
  const { savedIds, toggle } = useSaved();
  const saved = savedIds.has(place.id);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        await toggle(place);
        onChange?.();
      }}
      aria-pressed={saved}
      aria-label={withLabel ? undefined : saved ? `Remove ${place.title} from saved homes` : `Save ${place.title}`}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full text-sm font-medium transition-transform active:scale-95',
        className,
      )}
    >
      <Heart aria-hidden strokeWidth={1.75} className={cn('size-5', saved ? 'fill-red-700 text-red-700' : '')} />
      {withLabel && (saved ? 'Saved' : 'Save')}
    </button>
  );
};

export default SaveButton;
