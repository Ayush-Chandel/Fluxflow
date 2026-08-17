
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { MoreIcon } from '@/components/icons'
import { useCreateIssueDialog } from '@/store/createIssueDialogStore'
import { useCreateProjectDialog } from '@/store/createProjectDialogStore'
import { useTemplateStore } from '@/store/templateStore'
import { TEMPLATE_SLUG_BY_TYPE, type Template } from '@/types/template'

type Props = {
  template: Template
}

const ITEM =
  'flex w-full items-center rounded-md px-2 py-1.5 text-left text-lsm text-foreground transition-colors hover:bg-hover-subtle'


function TemplateActionsMenu({ template }: Props) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const setDefault = useTemplateStore((s) => s.setDefault)
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate)
  const openCreateIssue = useCreateIssueDialog((s) => s.openWith)
  const openCreateProject = useCreateProjectDialog((s) => s.openWith)
  const navigate = useNavigate()

  // Both dialogs live in WorkspaceLayout, so they're already mounted here.
  // Not named `useTemplate` — that reads as a hook and can't be called from a
  // click handler without tripping the rules-of-hooks lint.
  const createFromTemplate = () => {
    if (template.type === 'issue') openCreateIssue(undefined, template.id)
    else openCreateProject(undefined, template.id)
  }

  const editPath = `/app/templates/${TEMPLATE_SLUG_BY_TYPE[template.type]}/${template.id}`

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            aria-label={`Actions for ${template.name}`}
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition-colors',
              'hover:bg-elevated hover:text-foreground',
              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100',
            )}
          >
            <MoreIcon size={14} />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align='end'
          side='bottom'
          className='w-48 rounded-xl border-edge bg-surface p-1 shadow-lg'
        >
          <button
            type='button'
            className={ITEM}
            onClick={() => {
              setOpen(false)
              createFromTemplate()
            }}
          >
            {template.type === 'issue' ? 'New issue' : 'New project'}
          </button>
          <button
            type='button'
            className={ITEM}
            onClick={() => {
              setOpen(false)
              navigate(editPath)
            }}
          >
            Edit
          </button>
          <button
            type='button'
            className={ITEM}
            onClick={() => {
              setOpen(false)
              void setDefault(template.id, !template.isDefault)
            }}
          >
            {template.isDefault ? 'Remove as default' : 'Set as default'}
          </button>
          <button
            type='button'
            className={cn(ITEM, 'text-destructive hover:bg-destructive/10')}
            onClick={() => {
              setOpen(false)
              setConfirmOpen(true)
            }}
          >
            Delete
          </button>
        </PopoverContent>
      </Popover>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${template.name}?`}
        description='Issues and projects already created from this template are not affected.'
        confirmLabel='Delete'
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false)
          void deleteTemplate(template.id)
        }}
      />
    </>
  )
}

export default TemplateActionsMenu
