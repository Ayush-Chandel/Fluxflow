import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from 'radix-ui'
import CreateIssueModal from './CreateIssueModal'
import CreateIssueMinimizedBar from './CreateIssueMinimizedBar'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import { cn } from '@/lib/utils'

function CreateIssueDialog() {
  const open = useCreateIssueDialog((s) => s.open)
  const minimized = useCreateIssueDialog((s) => s.minimized)
  const maximized = useCreateIssueDialog((s) => s.maximized)
  const prefill = useCreateIssueDialog((s) => s.prefill)
  const setOpen = useCreateIssueDialog((s) => s.setOpen)
  const setMinimized = useCreateIssueDialog((s) => s.setMinimized)
  const toggleMaximized = useCreateIssueDialog((s) => s.toggleMaximized)
  const close = useCreateIssueDialog((s) => s.close)

  return (
    <>
      {/* Full view: a normal (modal) shadcn dialog. Minimizing just flips the
          `open` prop to false — Radix doesn't fire onOpenChange for a controlled
          prop change, so the draft (held in the store) is never touched. */}
      <Dialog open={open && !minimized} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          align='top'
          className={cn(
            'gap-0 rounded-3xl bg-surface p-0',
            maximized ? 'mt-[6vh] w-[92vw] sm:max-w-4xl' : 'mt-[12vh] sm:max-w-2xl',
          )}
        >
          <VisuallyHidden.Root>
            <DialogTitle>Create issue</DialogTitle>
          </VisuallyHidden.Root>
          {/* Radix unmounts content when closed, so the modal remounts on each
              open (or restore) and re-reads the latest draft/prefill from the store. */}
          <CreateIssueModal
            prefill={prefill ?? undefined}
            onClose={close}
            maximized={maximized}
            onMinimize={() => setMinimized(true)}
            onToggleMaximize={toggleMaximized}
          />
        </DialogContent>
      </Dialog>

      {/* Minimized view: a lightweight floating bar, independent of the dialog. */}
      {open && minimized && <CreateIssueMinimizedBar />}
    </>
  )
}

export default CreateIssueDialog
