
import { useMemo } from 'react'
import ProjectIcon from '@/components/common/ProjectIcon'
import IssueCommandBox from '@/components/issues/IssueCommandBox'
import { NoteIcon } from '@/components/icons'
import { useTemplateList } from '@/hooks/useTemplateSelectors'
import type { TemplateType } from '@/types/template'

const NO_TEMPLATE = '__no_template__'

type Props = {
  type: TemplateType
  /** Template id, or null for "No template". */
  value: string | null
  onChange: (templateId: string | null) => void
  showLabel?: boolean
  triggerClassName?: string
  contentAlign?: 'start' | 'center' | 'end'
}

/** Applies a saved template to a create dialog's draft. Same shape as
 *  ProjectPicker — a sentinel row for "none", then one row per template. */
function TemplatePicker({
  type,
  value,
  onChange,
  showLabel = true,
  triggerClassName,
  contentAlign,
}: Props) {
  const templates = useTemplateList(type)

  const { options, map } = useMemo(() => {
    const map: Record<string, { label: string; icon: React.ReactNode }> = {
      [NO_TEMPLATE]: { label: 'No template', icon: <NoteIcon size={13} /> },
    }
    for (const template of templates) {
      map[template.id] = {
        label: template.name,
        icon: <ProjectIcon icon={template.icon} color={template.color} size={13} />,
      }
    }

    // A template deleted in another tab while this dialog is open would leave the
    // trigger reading an unknown key — keep it addressable so it can be cleared.
    if (value && !map[value]) {
      map[value] = { label: 'Unknown template', icon: <NoteIcon size={13} /> }
    }

    return { options: [NO_TEMPLATE, ...templates.map((template) => template.id)], map }
  }, [templates, value])

  const current = value ?? NO_TEMPLATE

  return (
    <IssueCommandBox
      value={current}
      onValueChange={(next) => onChange(next === NO_TEMPLATE ? null : next)}
      options={options}
      map={map}
      placeholder='Apply template...'
      label={showLabel ? map[current].label : undefined}
      triggerClassName={triggerClassName}
      contentAlign={contentAlign}
    />
  )
}

export default TemplatePicker
