import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';

// Asks before an action that can't be undone. Errors show inside the dialog.
const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  children,
  confirmLabel,
  busyLabel,
  busy,
  error,
  onConfirm,
  cancelLabel = 'Go back',
  tone = 'default',
}) => (
  <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
    <DialogContent className="max-w-md">
      <DialogTitle className="font-bold tracking-tight text-3xl leading-tight">{title}</DialogTitle>
      <DialogDescription asChild>
        <div className="grid gap-2 text-sm text-ink/75">
          {children}
          {error && (
            <p role="alert" className="font-semibold text-red-800">
              {error}
            </p>
          )}
        </div>
      </DialogDescription>
      <DialogFooter className="mt-2 gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
          {cancelLabel}
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'default'} onClick={onConfirm} disabled={busy} aria-busy={busy}>
          {busy ? busyLabel : confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ConfirmDialog;
