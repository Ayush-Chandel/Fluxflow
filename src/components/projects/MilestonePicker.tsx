
import { useMemo } from 'react'
import { DiamondIcon } from 'lucide-react'
import IssueCommandBox from '@/components/issues/IssueCommandBox'
import { useProjectMilestoneList } from '@/hooks/useProjectMilestones'

// Same sentinel trick as ProjectPicker: IssueCommandBox indexes map[value], so
// "nothing selected" has to be an addressable option rather than null.
const NO_MILESTONE = '__no_milestone__'

type Props = {
  /** The issue's project. A milestone only exists inside one, so this scopes the
   *  options — and callers should render nothing when it is null. */
  projectId: string | null
  value: string | null
  onChange: (milestoneId: string | null) => void
  showLabel?: boolean
  triggerClassName?: string
  contentAlign?: 'start' | 'center' | 'end'
}

const GLYPH = <DiamondIcon className='h-3.5 w-3.5' />

function MilestonePicker({
  projectId,
  value,
  onChange,
  showLabel = true,
  triggerClassName,
  contentAlign,
}: Props) {
  // Already in manual (sortOrder) order — Alpha/Beta/GA is a sequence, so the
  // project's own ordering beats sorting the names alphabetically here.
  const milestones = useProjectMilestoneList(projectId)

  const { options, map } = useMemo(() => {
    const map: Record<string, { label: string; icon: React.ReactNode }> = {
      [NO_MILESTONE]: { label: 'No milestone', icon: GLYPH },
    }
    for (const milestone of milestones) {
      map[milestone.id] = { label: milestone.name, icon: GLYPH }
    }

    // A milestone deleted (or belonging to a project the issue was moved out of)
    // stays addressable, so the trigger renders and the user can clear it instead
    // of the whole picker crashing on an unknown key.
    if (value && !map[value]) {
      map[value] = { label: 'Unknown milestone', icon: GLYPH }
    }

    return { options: [NO_MILESTONE, ...milestones.map((m) => m.id)], map }
  }, [milestones, value])

  const current = value ?? NO_MILESTONE

  return (
    <IssueCommandBox
      value={current}
      onValueChange={(next) => onChange(next === NO_MILESTONE ? null : next)}
      options={options}
      map={map}
      placeholder='Set milestone to...'
      label={showLabel ? map[current].label : undefined}
      triggerClassName={triggerClassName}
      contentAlign={contentAlign}
    />
  )
}

export default MilestonePicker
