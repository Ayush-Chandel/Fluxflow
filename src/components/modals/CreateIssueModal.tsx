import { useState } from 'react'
import {
  NoteIcon,
  AssigneeIcon,
  BoxIcon,
  PlayCircleIcon,
  MoreIcon,
} from '../icons'
import { Button } from '@/components/ui/button'
import OptionPill from '../common/OptionPill'
import AutoGrowTextarea from '../common/AutoGrowTextarea'
import { Switch } from '@/components/ui/switch'
import IssueCommandBox from '../issues/IssueCommandBox'
import { useIssueStore } from '@/store/issueStore'
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  type CreateIssueInput,
  type IssuePriority,
  type IssueStatus,
} from '@/types/issue'
import { ISSUE_MAP, PRIORITY_MAP } from '../common/constants/constants'

type Props = {
  prefill?: Partial<CreateIssueInput>
  onClose?: () => void
}

const PILL_TRIGGER =
  'gap-1.5 !h-6 rounded-full border border-edge !bg-transparent !px-2 !py-0.5 text-xs !font-normal !text-muted !shadow-none hover:!bg-elevated'

function CreateIssueModal({ prefill, onClose }: Props) {
  const [title, setTitle] = useState(prefill?.title ?? '')
  const [description, setDescription] = useState(prefill?.description ?? '')
  const [status, setStatus] = useState<IssueStatus>(prefill?.status ?? 'todo')
  const [priority, setPriority] = useState<IssuePriority>(prefill?.priority ?? 'no_priority')
  const [createMore, setCreateMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const createIssue = useIssueStore((s) => s.createIssue)

  const resetForm = () => {
    setTitle('')
    setDescription('')
  }

  const handleCreate = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle || submitting) return

    setSubmitting(true)
    try {
      await createIssue({
        title: trimmedTitle,
        description: description.trim(),
        status,
        priority,
        assigneeId: prefill?.assigneeId ?? null,
        labelIds: prefill?.labelIds ?? [],
        projectId: prefill?.projectId ?? null,
        milestoneId: prefill?.milestoneId ?? null,
        cycleId: prefill?.cycleId ?? null,
      })
      if (createMore) resetForm()
      else onClose?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='flex min-h-[260px] max-h-[80vh] flex-col pl-2.5 p-4'>
      {/* Breadcrumb header */}
      <div className='flex shrink-0 items-center gap-2'>
        <div className='flex items-center gap-1.5 rounded-full border border-edge px-2 py-0.5 text-xs text-muted'>
          <NoteIcon size={13} />
          Template
        </div>
      </div>

      {/* Title — wraps to the next line as it grows; capped at 512 chars. Enter creates. */}
      <AutoGrowTextarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          // Title is a single logical line: Enter submits instead of adding a newline.
          if (e.key === 'Enter') {
            e.preventDefault()
            void handleCreate()
          }
        }}
        maxLength={512}
        autoFocus
        placeholder='Issue title'
        className='ml-3 mt-4 w-full shrink-0 resize-none overflow-hidden bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted'
      />

      {/* Description — grows with content, then scrolls once the modal hits 80vh */}
      <AutoGrowTextarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={(e) => {
          // Cmd/Ctrl+Enter creates from anywhere in the description.
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            void handleCreate()
          }
        }}
        placeholder='Add description...'
        className='ml-3 mt-2 min-h-0 w-full flex-auto resize-none overflow-y-auto bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
      />

      {/* Option pills */}
      <div className='mt-4 flex shrink-0 flex-wrap items-center gap-1.5'>
        <IssueCommandBox
          value={status}
          onValueChange={setStatus}
          options={ISSUE_STATUSES}
          map={ISSUE_MAP}
          placeholder='Set status to...'
          label={ISSUE_MAP[status].label}
          triggerClassName={PILL_TRIGGER}
        />
        <IssueCommandBox
          value={priority}
          onValueChange={setPriority}
          options={ISSUE_PRIORITIES}
          map={PRIORITY_MAP}
          placeholder='Set priority to...'
          label={PRIORITY_MAP[priority].label}
          triggerClassName={PILL_TRIGGER}
        />
        <OptionPill icon={<AssigneeIcon size={15} />} label='Assignee' />
        <OptionPill icon={<BoxIcon size={15} />} label='Project' />
        <button
          type='button'
          className='flex h-7 w-7 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:bg-elevated'
        >
          <PlayCircleIcon size={15} />
        </button>
        <button
          type='button'
          className='flex h-7 w-7 items-center justify-center rounded-full border border-edge text-muted transition-colors hover:bg-elevated'
        >
          <MoreIcon size={15} />
        </button>
      </div>

      {/* Footer */}
      <div className='-mx-4 mt-4 shrink-0' />
      <div className='mt-3 flex shrink-0 items-center justify-end gap-4'>
        <label htmlFor='create-more' className='flex cursor-pointer items-center gap-2'>
          <Switch
            id='create-more'
            size='sm'
            checked={createMore}
            onCheckedChange={setCreateMore}
          />
          <span className='text-lsm text-muted'>Create more</span>
        </label>
        <Button
          onClick={handleCreate}
          disabled={!title.trim() || submitting}
          className=' rounded-2xl bg-brand px-3 h-7 !text-lsm text-white hover:bg-brand-hover'
        >
          Create issue
        </Button>
      </div>
    </div>
  )
}

export default CreateIssueModal
