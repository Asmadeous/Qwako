import { useState } from 'react';
import { Settings2 } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import CategoryManager from '@/components/ui/CategoryManager';

// Home form: opens the full list of categories or amenities to add, rename
// or delete. `onChanged` runs on close when anything changed.
const ManageList = ({ kind, onChanged }) => {
  const [open, setOpen] = useState(false);
  const [changed, setChanged] = useState(false);
  const label = kind === 'amenities' ? 'Manage amenities' : 'Manage categories';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next && changed) {
          setChanged(false);
          onChanged();
        }
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-2 justify-self-start rounded-full text-sm font-medium underline underline-offset-4 hover:text-ink/70"
      >
        <Settings2 aria-hidden className="size-4" />
        {label}
      </button>
      <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto">
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <DialogDescription className="sr-only">Add, rename or delete {kind}.</DialogDescription>
        <CategoryManager kind={kind} framed={false} onChange={() => setChanged(true)} />
      </DialogContent>
    </Dialog>
  );
};

export default ManageList;
