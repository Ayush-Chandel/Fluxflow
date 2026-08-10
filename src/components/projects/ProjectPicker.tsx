
import { useMemo } from 'react'
import ProjectIcon from '@/components/common/ProjectIcon'
import IssueCommandBox from '@/components/issues/IssueCommandBox'
import { BoxIcon } from '@/components/icons'
import { useProjectList } from '@/hooks/useProjectSelectors'


const NO_PROJECT = '__no_project__'

type Props = {
  value: string | null
  onChange: (projectId: string | null) => void
  showLabel?: boolean
  triggerClassName?: string
  contentAlign?: 'start' | 'center' | 'end'
}

function ProjectPicker({
  value,
  onChange,
  showLabel = true,
  triggerClassName,
  contentAlign,
}: Props) {
  const projects = useProjectList()

  const { options, map } = useMemo(() => {
    const sorted = [...projects].sort((a, b) => a.name.localeCompare(b.name))

    const map: Record<string, { label: string; icon: React.ReactNode }> = {
      [NO_PROJECT]: { label: 'No project', icon: <BoxIcon size={13} color='currentColor' /> },
    }
    for (const project of sorted) {
      map[project.id] = {
        label: project.name,
        icon: <ProjectIcon icon={project.icon} color={project.color} size={13} />,
      }
    }

    // Keep a dangling reference addressable so the trigger still renders and the
    // user can clear it, instead of crashing on an unknown key.
    if (value && !map[value]) {
      map[value] = { label: 'Unknown project', icon: <BoxIcon size={13} color='currentColor' /> }
    }

    return { options: [NO_PROJECT, ...sorted.map((p) => p.id)], map }
  }, [projects, value])

  const current = value ?? NO_PROJECT

  return (
    <IssueCommandBox
      value={current}
      onValueChange={(next) => onChange(next === NO_PROJECT ? null : next)}
      options={options}
      map={map}
      placeholder='Set project to...'
      label={showLabel ? map[current].label : undefined}
      triggerClassName={triggerClassName}
      contentAlign={contentAlign}
    />
  )
}

export default ProjectPicker
