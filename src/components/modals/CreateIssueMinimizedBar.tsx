import { createPortal } from 'react-dom'
import { XIcon } from 'lucide-react'
import { NoteIcon, MaximizeIcon } from '../icons'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'

const BTN =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'

function CreateIssueMinimizedBar() {
  const title = useCreateIssueDialog((s) => s.draft.title)
  const setMinimized = useCreateIssueDialog((s) => s.setMinimized)
  const close = useCreateIssueDialog((s) => s.close)

  const restore = () => setMinimized(false)

  return createPortal(
    <div className='fixed bottom-4 right-4 z-50 flex w-[340px] max-w-[calc(100%-2rem)] items-center gap-2 rounded-2xl border border-edge bg-surface py-2 pl-3 pr-2 shadow-xl'>
      <button
        type='button'
        onClick={restore}
        className='flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 pl-1 pr-2 text-left transition-colors hover:bg-elevated'
      >
        <NoteIcon size={14} />
        <span className='truncate text-sm text-foreground'>{title.trim() || 'New issue'}</span>
      </button>
      <button type='button' onClick={restore} className={BTN} aria-label='Restore'>
        <MaximizeIcon size={15} />
      </button>
      <button type='button' onClick={close} className={BTN} aria-label='Close'>
        <XIcon className='h-4 w-4' />
      </button>
    </div>,
    document.body,
  )
}

export default CreateIssueMinimizedBar
