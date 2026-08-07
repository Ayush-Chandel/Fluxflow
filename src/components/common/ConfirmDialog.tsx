
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'

type Props = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Destructive styling on the confirm button — the default, since that's the usual case. */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const ACTION_BTN = 'h-8 rounded-2xl px-4 !text-lsm'

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Discard',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent
        showCloseButton={false}
        align='top'
        className='mt-[28vh] gap-0 rounded-2xl bg-surface p-5 sm:max-w-md'
      >
        <DialogTitle className='text-[15px] font-semibold text-foreground'>{title}</DialogTitle>
        {description && (
          <DialogDescription className='mt-2 text-sm !text-muted'>{description}</DialogDescription>
        )}

        <div className='mt-5 flex items-center justify-end gap-2'>
          <Button
            variant='outline'
            onClick={onCancel}
            className={cn(ACTION_BTN, 'border-edge bg-transparent text-foreground hover:bg-elevated')}
          >
            {cancelLabel}
          </Button>
          <Button
            autoFocus
            variant={destructive ? 'destructive' : 'default'}
            onClick={onConfirm}
            className={cn(ACTION_BTN, !destructive && 'bg-brand text-white hover:bg-brand-hover')}
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
