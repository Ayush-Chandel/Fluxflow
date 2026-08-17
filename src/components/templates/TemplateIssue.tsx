import { useRef, useState } from 'react'
import { useNavigate } from 'react-router';
import ProjectIconPicker from '../common/ProjectIconPicker';
import { DEFAULT_PROJECT_COLOR, DEFAULT_PROJECT_ICON } from '../common/constants/projectIcons';
import AutoGrowTextarea from '../common/AutoGrowTextarea';
import ProjectPicker from '../projects/ProjectPicker';
import IssueCommandBox from '../issues/IssueCommandBox';
import { ISSUE_PRIORITIES, ISSUE_STATUSES, PILL_TRIGGER, type IssuePriority, type IssueStatus } from '@/types/issue';
import { ISSUE_MAP, PRIORITY_MAP } from '../common/constants/constants';
import { Button } from '../ui/button';
import { Switch } from '@/components/ui/switch';
import { useTemplateStore } from '@/store/templateStore';
import type { CreateTemplateInput, IssueTemplate } from '@/types/template';

type Props = {
  template?: IssueTemplate
}

function TemplateIssue({ template }: Props) {

  const [icon, setIcon] = useState<string>(template?.icon ?? DEFAULT_PROJECT_ICON);
  const [color, setColor] = useState<string>(template?.color ?? DEFAULT_PROJECT_COLOR);

  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false)

  const [title, setTitle] = useState(template?.data.title ?? '')
  const [issueDescription, setIssueDescription] = useState(template?.data.description ?? '')
  const [status, setStatus] = useState<IssueStatus>(template?.data.status ?? 'backlog')
  const [priority, setPriority] = useState<IssuePriority>(template?.data.priority ?? 'no_priority')
  const [projectId, setProjectId] = useState<string | null>(template?.data.projectId ?? null)

  const postTemplate = useTemplateStore((s)=>s.createTemplate);
  const patchTemplate = useTemplateStore((s)=>s.updateTemplate);
  const navigate = useNavigate()

  const templatesPath = '/app/templates/issues'

  const submitted = useRef(false)

  const createTemplate = ()=>{
    const trimmedName = name.trim()
    if (!trimmedName || submitted.current) return
    submitted.current = true

    const input: CreateTemplateInput = {
      type: 'issue',
      name: trimmedName,
      description: description.trim(),
      icon,
      color,
      isDefault,
      data: {
        title: title.trim(),
        description: issueDescription.trim(),
        status,
        priority,
        projectId,
      },
    }

    void (template ? patchTemplate(template.id, input) : postTemplate(input))

    navigate(templatesPath)
  }

  return (
    <div className='space-y-6'>
      <div className='px-3 space-y-2'>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    // A single logical line: Enter is swallowed rather than
                    // adding one. Creating is the button's job.
                    if (e.key === 'Enter') e.preventDefault()
                  }}
                  maxLength={100}
                  autoFocus
                  placeholder='Template Name'
                  className=' w-full shrink-0 resize-none overflow-hidden bg-transparent text-[24px] font-medium text-foreground outline-none placeholder:text-muted'
                />
           </div>
      </div>
        <AutoGrowTextarea
          value={description}
          maxLength={250}
          onChange={(e) => setDescription(e.target.value)}
          placeholder='Add an optional template description...'
          className='min-h-0 w-full flex-auto resize-none overflow-y-auto bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
        />
      </div>

      <div className='pt-4 pb-2 px-3 border border-edge rounded-xl bg-hover-subtle'>

          <AutoGrowTextarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
                    // Same as the template name: single line, no newline, no submit.
                    if (e.key === 'Enter') e.preventDefault()
                  }}
            maxLength={512}
            placeholder='Issue title'
            className=' w-full shrink-0 resize-none overflow-hidden bg-transparent text-[18px] font-medium text-foreground outline-none placeholder:text-muted'
          />
          <AutoGrowTextarea
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder='Add description...'
            className='min-h-20 w-full flex-auto resize-none overflow-y-auto bg-transparent text-sm text-foreground outline-none placeholder:text-muted'
          />

      </div>

      <div className='space-y-3 '>
        <div className='px-3'>
            <h1 className='text-[15px] text-foreground font-medium'>Default properties</h1>
            <p className='text-lsm text-muted'>Automatically applied upon issue creation, and editable when composing</p>
         </div>

          <div className=' flex gap-x-4 bg-hover-subtle pt-4 pb-4 px-3 border border-edge rounded-xl'>
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
                    <ProjectPicker
                      value={projectId}
                      onChange={setProjectId}
                      triggerClassName={PILL_TRIGGER}
                    />
          </div>
      </div>

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
  )
}

export default TemplateIssue
