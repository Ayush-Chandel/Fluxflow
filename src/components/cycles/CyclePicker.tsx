
import { useMemo } from 'react'
import IssueCommandBox from '@/components/issues/IssueCommandBox'
import { PlayCircleIcon } from '@/components/icons'
import { CYCLE_MAP } from '@/components/common/constants/constants'
import { useCycleRows } from '@/hooks/useCycleSelectors'
import { cycleLabel } from '@/types/cycle'

const NO_CYCLE = '__no_cycle__'

type Props = {
  value: string | null
  onChange: (cycleId: string | null) => void
  showLabel?: boolean
  triggerClassName?: string
  contentAlign?: 'start' | 'center' | 'end'
}

function CyclePicker({ value, onChange, showLabel = true, triggerClassName, contentAlign }: Props) {
  const rows = useCycleRows()

  const { options, map } = useMemo(() => {
    const RANK = { active: 0, upcoming: 1, completed: 2 } as const
    const sorted = [...rows].sort((a, b) => RANK[a.status] - RANK[b.status])

    const map: Record<string, { label: string; icon: React.ReactNode }> = {
      [NO_CYCLE]: { label: 'No cycle', icon: <PlayCircleIcon size={13} color='currentColor' /> },
    }
    for (const row of sorted) {
      map[row.cycle.id] = {
        label: cycleLabel(row.cycle),
        // The status glyph doubles as a read-out, so the picker says WHEN each
        // cycle is as well as what it's called — the same trick MilestonePicker
        // plays with its quarter-filled diamond.
        icon: CYCLE_MAP[row.status].icon,
      }
    }

    // Keep a dangling reference addressable so the trigger still renders and the
    // user can clear it, instead of crashing on an unknown key.
    if (value && !map[value]) {
      map[value] = { label: 'Unknown cycle', icon: <PlayCircleIcon size={13} color='currentColor' /> }
    }

    return { options: [NO_CYCLE, ...sorted.map((row) => row.cycle.id)], map }
  }, [rows, value])

  const current = value ?? NO_CYCLE

  return (
    <IssueCommandBox
      value={current}
      onValueChange={(next) => onChange(next === NO_CYCLE ? null : next)}
      options={options}
      map={map}
      placeholder='Set cycle to...'
      label={showLabel ? map[current].label : undefined}
      triggerClassName={triggerClassName}
      contentAlign={contentAlign}
    />
  )
}

export default CyclePicker
