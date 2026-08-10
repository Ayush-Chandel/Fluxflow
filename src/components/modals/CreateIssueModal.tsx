import { useState } from 'react'
import { XIcon } from 'lucide-react'
import {
  NoteIcon,
  AssigneeIcon,
  PlayCircleIcon,
  MoreIcon,
  MinimizeIcon,
  MaximizeIcon,
  ChevronDownIcon,
} from '../icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import OptionPill from '../common/OptionPill'
import AutoGrowTextarea from '../common/AutoGrowTextarea'
import { Switch } from '@/components/ui/switch'
import IssueCommandBox from '../issues/IssueCommandBox'
import ProjectPicker from '../projects/ProjectPicker'
import MilestonePicker from '../projects/MilestonePicker'
import { useIssueStore } from '@/store/issueStore'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import {
  ISSUE_PRIORITIES,
  ISSUE_STATUSES,
  type CreateIssueInput,
} from '@/types/issue'
import { ISSUE_MAP, PRIORITY_MAP } from '../common/constants/constants'

type Props = {
  prefill?: Partial<CreateIssueInput>
  onClose?: () => void
  maximized?: boolean
  onMinimize?: () => void
  onToggleMaximize?: () => void
}

const PILL_TRIGGER =
  'gap-1.5 !h-6 rounded-full border border-edge !bg-transparent !px-2 !py-0.5 text-xs !font-normal !text-muted !shadow-none hover:!bg-elevated'

const HEADER_BTN =
  'flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'

function CreateIssueModal({
  prefill,
  onClose,
  maximized = false,
  onMinimize,
  onToggleMaximize,
}: Props) {
  // Draft lives in the store so it survives the Radix content remount that
  // occurs when the dialog switches modal/non-modal (minimize ⇄ restore).
  const { title, description, status, priority, projectId, milestoneId } = useCreateIssueDialog(
    (s) => s.draft,
  )
  const patchDraft = useCreateIssueDialog((s) => s.patchDraft)
  const [createMore, setCreateMore] = useState(false)

  const createIssue = useIssueStore((s) => s.createIssue)

  // Fire-and-forget: the store inserts the issue optimistically and owns the
  // success/failure toast, so the modal closes on click instead of sitting on
  // the server round-trip that assigns the identifier.
  const handleCreate = () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    void createIssue({
      title: trimmedTitle,
      description: description.trim(),
      status,
      priority,
      assigneeId: prefill?.assigneeId ?? null,
      labelIds: prefill?.labelIds ?? [],
      projectId,
      milestoneId,
      cycleId: prefill?.cycleId ?? null,
    })

    if (createMore) patchDraft({ title: '', description: '' })
    else onClose?.()
  }

  return (
    <div
      className={cn(
        'flex flex-col pl-2.5 p-4',
        maximized ? 'min-h-[70vh] max-h-[88vh]' : 'min-h-[260px] max-h-[80vh]',
      )}
    >
      {/* Breadcrumb header */}
      <div className='flex shrink-0 items-center gap-2'>
        <div className='flex items-center gap-1.5 rounded-full border border-edge px-2 py-0.5 text-xs text-muted'>
          <NoteIcon size={13} />
          Template
        </div>
        {/* Window controls */}
        <div className='ml-auto flex items-center gap-1'>
          <button type='button' onClick={onMinimize} className={HEADER_BTN} aria-label='Minimize'>
            <ChevronDownIcon size={12} />
          </button>
          <button
            type='button'
            onClick={onToggleMaximize}
            className={HEADER_BTN}
            aria-label={maximized ? 'Restore' : 'Maximize'}
          >
            {maximized ? <MinimizeIcon size={15} /> : <MaximizeIcon size={15} />}
          </button>
          <button type='button' onClick={onClose} className={HEADER_BTN} aria-label='Close'>
            <XIcon className='h-4 w-4' />
          </button>
        </div>
      </div>

      {/* Title — wraps to the next line as it grows; capped at 512 chars. Enter creates. */}
      <AutoGrowTextarea
        value={title}
        onChange={(e) => patchDraft({ title: e.target.value })}
        onKeyDown={(e) => {
          // Title is a single logical line: Enter submits instead of adding a newline.
          if (e.key === 'Enter') {
            e.preventDefault()
            handleCreate()
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
        onChange={(e) => patchDraft({ description: e.target.value })}
        onKeyDown={(e) => {
          // Cmd/Ctrl+Enter creates from anywhere in the description.
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleCreate()
          }
        }}
        placeholder='Add description...'
        className='ml-3 mt-2 min-h-0 w-full flex-auto resize-none overflow-y-auto bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
      />

      {/* Option pills */}
      <div className='mt-4 flex shrink-0 flex-wrap items-center gap-1.5'>
        <IssueCommandBox
          value={status}
          onValueChange={(status) => patchDraft({ status })}
          options={ISSUE_STATUSES}
          map={ISSUE_MAP}
          placeholder='Set status to...'
          label={ISSUE_MAP[status].label}
          triggerClassName={PILL_TRIGGER}
        />
        <IssueCommandBox
          value={priority}
          onValueChange={(priority) => patchDraft({ priority })}
          options={ISSUE_PRIORITIES}
          map={PRIORITY_MAP}
          placeholder='Set priority to...'
          label={PRIORITY_MAP[priority].label}
          triggerClassName={PILL_TRIGGER}
        />
        <OptionPill icon={<AssigneeIcon size={15} />} label='Assignee' />
        <ProjectPicker
          value={projectId}
          onChange={(next) =>
            patchDraft({ projectId: next, ...(next !== projectId ? { milestoneId: null } : {}) })
          }
          triggerClassName={PILL_TRIGGER}
        />
        {projectId && (
          <MilestonePicker
            projectId={projectId}
            value={milestoneId}
            onChange={(next) => patchDraft({ milestoneId: next })}
            triggerClassName={PILL_TRIGGER}
          />
        )}
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
          disabled={!title.trim()}
          className=' rounded-2xl bg-brand px-3 h-7 !text-lsm text-white hover:bg-brand-hover'
        >
          Create issue
        </Button>
      </div>
    </div>
  )
}

export default CreateIssueModal
