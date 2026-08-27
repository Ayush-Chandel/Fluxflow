import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import ProjectIconPicker from '../common/ProjectIconPicker'
import { DEFAULT_PROJECT_COLOR, DEFAULT_PROJECT_ICON } from '../common/constants/projectIcons'
import AutoGrowTextarea from '../common/AutoGrowTextarea'
import IssueCommandBox from '../issues/IssueCommandBox'
import MilestoneDraftList, { type MilestoneDraft } from '../projects/MilestoneDraftList'
import { PRIORITY_MAP, PROJECT_MAP } from '../common/constants/constants'
import { PILL_TRIGGER } from '@/types/issue'
import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  type ProjectPriority,
  type ProjectStatus,
} from '@/types/project'
import { Button } from '../ui/button'
import { Switch } from '@/components/ui/switch'
import ConfirmDialog from '../common/ConfirmDialog'
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard'
import { projectTemplateFingerprint } from '@/lib/templateForm'
import { useTemplateStore } from '@/store/templateStore'
import type { CreateTemplateInput, ProjectTemplate } from '@/types/template'

type Props = {
  /** Present when editing an existing template; absent on /new. */
  template?: ProjectTemplate
}

function TemplateProject({ template }: Props) {

  const [icon, setIcon] = useState<string>(template?.icon ?? DEFAULT_PROJECT_ICON)
  const [color, setColor] = useState<string>(template?.color ?? DEFAULT_PROJECT_COLOR)

  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false)

  const [projectName, setProjectName] = useState(template?.data.name ?? '')
  const [summary, setSummary] = useState(template?.data.description ?? '')
  const [content, setContent] = useState(template?.data.content ?? '')
  const [status, setStatus] = useState<ProjectStatus>(template?.data.status ?? 'backlog')
  const [priority, setPriority] = useState<ProjectPriority>(template?.data.priority ?? 'no_priority')

  const [milestones, setMilestones] = useState<MilestoneDraft[]>(() =>
    (template?.data.milestones ?? []).map((milestone) => ({
      key: crypto.randomUUID(),
      name: milestone.name,
      targetDate: null,
    })),
  )

  const postTemplate = useTemplateStore((s) => s.createTemplate)
  const patchTemplate = useTemplateStore((s) => s.updateTemplate)
  const navigate = useNavigate()

  const templatesPath = '/app/templates/projects'

  const submitted = useRef(false)

  const current = {
    icon, color, name, description, isDefault,
    projectName, summary, content, status, priority, milestones,
  }

  const [seedFingerprint] = useState(() => projectTemplateFingerprint(current))
  const guard = useUnsavedGuard(projectTemplateFingerprint(current) !== seedFingerprint)

  const leave = () => {
    guard.release()
    navigate(templatesPath)
  }

  const createTemplate = () => {
    const trimmedName = name.trim()
    if (!trimmedName || submitted.current) return
    submitted.current = true

    const input: CreateTemplateInput = {
      type: 'project',
      name: trimmedName,
      description: description.trim(),
      icon,
      color,
      isDefault,
      data: {
        name: projectName.trim(),
        description: summary.trim(),
        content: content.trim(),
        status,
        priority,
        milestones: milestones
          .filter((milestone) => milestone.name.trim())
          .map((milestone) => ({ name: milestone.name.trim(), description: '' })),
      },
    }

    void (template ? patchTemplate(template.id, input) : postTemplate(input))

    leave()
  }

  return (
    <>
     <div className='space-y-6'>
      <div className='px-3'>
        <AutoGrowTextarea
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault()
                  }}
                  maxLength={100}
                  autoFocus
                  placeholder='Template Name'
                  className=' w-full shrink-0 resize-none overflow-hidden bg-transparent text-[24px] font-medium text-foreground outline-none placeholder:text-muted'
                />
        <AutoGrowTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={250}
            placeholder='Add an optional template description...'
            className='min-h-0 w-full flex-auto resize-none overflow-y-auto bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
          />
      </div>

      <div className='pt-4 pb-2 px-3 border border-edge rounded-xl bg-hover-subtle'>

        <div className='flex items-center gap-x-4'>
          <ProjectIconPicker
            icon={icon}
            color={color}
            onChange={(next) => {
              setIcon(next.icon)
              setColor(next.color)
            }}
          />
          <div className='w-full flex items-center'>
            <AutoGrowTextarea
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => {
                // Same as the template name: single line, no newline, no submit.
                if (e.key === 'Enter') e.preventDefault()
              }}
              maxLength={256}
              placeholder='Project name'
              className=' w-full shrink-0 resize-none overflow-hidden bg-transparent text-[18px] font-medium text-foreground outline-none placeholder:text-muted'
            />
          </div>
        </div>

        {/* Short summary → Project.description, the line list rows show */}
        <AutoGrowTextarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault()
          }}
          maxLength={256}
          placeholder='Add a short summary...'
          className='mt-2 w-full shrink-0 resize-none overflow-hidden bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
        />

        <AutoGrowTextarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          keepCaretInView
          placeholder='Write a description, a project brief, or collect ideas...'
          className='mt-3 min-h-20 w-full flex-auto resize-none overflow-y-auto bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
        />

      </div>

      <div className='space-y-3 '>
        <div className='px-3'>
            <h1 className='text-[15px] text-foreground font-medium'>Default properties</h1>
            <p className='text-lsm text-muted'>Automatically applied upon project creation, and editable when composing</p>
         </div>

          <div className=' flex gap-x-4 bg-hover-subtle pt-4 pb-4 px-3 border border-edge rounded-xl'>
                    <IssueCommandBox
                      value={status}
                      onValueChange={setStatus}
                      options={PROJECT_STATUSES}
                      map={PROJECT_MAP}
                      placeholder='Set status to...'
                      label={PROJECT_MAP[status].label}
                      triggerClassName={PILL_TRIGGER}
                    />
                    <IssueCommandBox
                      value={priority}
                      onValueChange={setPriority}
                      options={PROJECT_PRIORITIES}
                      map={PRIORITY_MAP}
                      pulseOnValueChange
                      placeholder='Set priority to...'
                      label={PRIORITY_MAP[priority].label}
                      triggerClassName={PILL_TRIGGER}
                    />
          </div>
      </div>

      <MilestoneDraftList
        milestones={milestones}
        onChange={setMilestones}
        showTargetDate={false}
      />

      <div className='mt-6 flex shrink-0 items-center justify-end gap-2'>

                        <label
                            htmlFor='template-default'
                            className='mr-auto flex cursor-pointer items-center gap-2 px-3'
                        >
                            <Switch
                                id='template-default'
                                size='sm'
                                checked={isDefault}
                                onCheckedChange={setIsDefault}
                            />
                            <span className='text-lsm text-muted'>Set as default</span>
                        </label>
                        <Button
                            variant='outline'
                            onClick={() => navigate(templatesPath)}
                            className='h-7 rounded-2xl border-edge bg-transparent px-3 !text-lsm text-foreground hover:bg-elevated'
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={createTemplate}
                            disabled={!name.trim()}
                            className='rounded-2xl bg-brand px-3 h-7 !text-lsm text-white hover:bg-brand-hover'
                        >
                            {template ? 'Save' : 'Create'}
                        </Button>
      </div>

    </div>

    <ConfirmDialog
      open={guard.open}
      title='Discard changes?'
      description="Are you sure you want to discard the changes you've made to this template?"
      confirmLabel='Discard'
      onConfirm={guard.confirm}
      onCancel={guard.cancel}
    />
    </>
  )
}

export default TemplateProject
