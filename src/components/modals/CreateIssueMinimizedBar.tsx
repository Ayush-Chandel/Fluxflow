import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { XIcon } from 'lucide-react'
import { NoteIcon, MaximizeIcon } from '../icons'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import {
  CREATE_ISSUE_CONTENT_FADE,
  CREATE_ISSUE_LAYOUT_ID,
  CREATE_ISSUE_PILL_LAYOUT_TRANSITION,
} from './sharedLayout'

const BTN =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'

function CreateIssueMinimizedBar() {
  const title = useCreateIssueDialog((s) => s.draft.title)
  const setMinimized = useCreateIssueDialog((s) => s.setMinimized)
  const close = useCreateIssueDialog((s) => s.close)

  const restore = () => setMinimized(false)

  return createPortal(
    <motion.div
      layoutId={CREATE_ISSUE_LAYOUT_ID}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={CREATE_ISSUE_PILL_LAYOUT_TRANSITION}
      className='fixed bottom-4 right-4 z-50 flex w-[340px] max-w-[calc(100%-2rem)] items-center gap-2 rounded-2xl border border-edge bg-surface py-2 pl-3 pr-2 shadow-xl'
    >
      <motion.div
        {...CREATE_ISSUE_CONTENT_FADE}
        className='flex min-w-0 flex-1 items-center gap-2'
      >
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
      </motion.div>
    </motion.div>,
    document.body,
  )
}

export default CreateIssueMinimizedBar
