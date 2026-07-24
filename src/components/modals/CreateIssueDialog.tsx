
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from 'radix-ui'
import CreateIssueModal from './CreateIssueModal'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'

function CreateIssueDialog() {
  const open = useCreateIssueDialog((s) => s.open)
  const prefill = useCreateIssueDialog((s) => s.prefill)
  const setOpen = useCreateIssueDialog((s) => s.setOpen)
  const close = useCreateIssueDialog((s) => s.close)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='p-0 top-[12vh] translate-y-0 rounded-3xl sm:max-w-2xl bg-surface'>
        <VisuallyHidden.Root>
          <DialogTitle>Create issue</DialogTitle>
        </VisuallyHidden.Root>
        {/* Radix unmounts content when closed, so the modal remounts on each open
            and re-reads the latest prefill through its useState initializers. */}
        <CreateIssueModal prefill={prefill ?? undefined} onClose={close} />
      </DialogContent>
    </Dialog>
  )
}

export default CreateIssueDialog
