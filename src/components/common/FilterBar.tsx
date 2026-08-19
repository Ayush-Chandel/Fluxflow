
import { useMemo, type ReactElement } from 'react'
import { FunnelX } from 'lucide-react'
import { Filters, type FilterFieldConfig } from '@/components/reui/filters'
import { CHIP_STYLE, CYCLE_MAP, CYCLE_RANK, ISSUE_MAP, MENU_STYLE, PINNED, PRIORITY_MAP } from '@/components/common/constants/constants'
import ProjectIcon from '@/components/common/ProjectIcon'
import { BoxIcon, FilterIcon, PlayCircleIcon } from '@/components/icons'
import { useIssueFilters } from '@/hooks/useIssueFilters'
import { useProjectList } from '@/hooks/useProjectSelectors'
import { useCycleList } from '@/hooks/useCycleSelectors'
import { NO_CYCLE, NO_PROJECT, type FilterField } from '@/lib/issueFilters'
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from '@/types/issue'
import { cycleLabel, cycleStatusFromDates } from '@/types/cycle'

const DEFAULT_TRIGGER = (
  <button
    type='button'
    className='flex mt-1 items-center gap-1 border border-edge rounded-md px-1.5 py-1 text-xs text-muted focus:outline-none transition-colors hover:bg-hover hover:text-foreground'
  >
    <FilterIcon size={13} color='currentColor' />
    Filter
  </button>
)

type Props = {
  /**
   * Facets to omit because the surface already pins them — the project detail
   * hides `project`, a cycle page hides `cycle`. Pass a MODULE-LEVEL constant:
   * an inline array literal is a new reference every render and would rebuild
   * the fields config each time.
   */
  hide?: readonly FilterField[]
  /**
   * Replaces the whole trigger, not just its icon — the vendored component has
   * no icon-only prop, it renders `{trigger || <default>}`. Must be ONE element
   * for the same `asChild` reason as above. Pass a module-level constant.
   */
  trigger?: ReactElement
}

function FilterBar({ hide, trigger = DEFAULT_TRIGGER }: Props) {
  const { filters, setFilters, clear, active } = useIssueFilters()
  const projects = useProjectList()
  const cycles = useCycleList()

  const fields = useMemo<FilterFieldConfig<string>[]>(() => {
    const all: FilterFieldConfig<string>[] = [
      {
        key: 'status',
        label: 'Status',
        type: 'multiselect',
        searchable: false, // five fixed options — a search box would be noise
        operators: PINNED,
        options: ISSUE_STATUSES.map((status) => ({
          value: status,
          label: ISSUE_MAP[status].label,
          icon: ISSUE_MAP[status].icon,
        })),
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'multiselect',
        searchable: false,
        operators: PINNED,
        options: ISSUE_PRIORITIES.map((priority) => ({
          value: priority,
          label: PRIORITY_MAP[priority].label,
          icon: PRIORITY_MAP[priority].icon,
        })),
      },
      {
        key: 'project',
        label: 'Project',
        type: 'multiselect',
        searchable: true, // a workspace can hold far more projects than statuses
        operators: PINNED,
        options: [
          // The sentinel is a first-class option: "show me what nobody has
          // filed under a project yet" is the reason to open this facet at all.
          { value: NO_PROJECT, label: 'No project', icon: <BoxIcon size={13} /> },
          ...projects.map((project) => ({
            value: project.id,
            label: project.name,
            icon: <ProjectIcon icon={project.icon} color={project.color} size={13} />,
          })),
        ],
      },
      {
        key: 'cycle',
        label: 'Cycle',
        type: 'multiselect',
        searchable: true,
        operators: PINNED,
        options: [
          {
            value: NO_CYCLE,
            label: 'No cycle',
            icon: <PlayCircleIcon size={13} color='currentColor' />,
          },
          ...cycles
            .map((cycle) => ({
              cycle,
              status: cycleStatusFromDates(cycle.startDate, cycle.endDate),
            }))
            .sort((a, b) => CYCLE_RANK[a.status] - CYCLE_RANK[b.status])
            .map(({ cycle, status }) => ({
              value: cycle.id,
              label: cycleLabel(cycle),
              // The status glyph doubles as a read-out of WHEN the cycle is,
              // exactly as it does in CyclePicker's options.
              icon: CYCLE_MAP[status].icon,
            })),
        ],
      },
    ]

    const styled = all.map((field) => ({ ...field, className: MENU_STYLE }))

    return hide ? styled.filter((field) => !hide.includes(field.key as FilterField)) : styled
  }, [projects, cycles, hide])

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      <Filters<string>
        fields={fields}
        filters={filters}
        onChange={setFilters}
        trigger={trigger}
        menuPopupClassName={MENU_STYLE}
        // The container the chips render into — they are not portaled.
        className={CHIP_STYLE}
        size='sm'
        allowMultiple
        enableShortcut={false}
      />
      {active && (
        <button
          type='button'
          onClick={clear}
          className='flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted transition-colors hover:bg-hover hover:text-foreground'
        >
          <FunnelX className='h-3.5 w-3.5' />
          Clear
        </button>
      )}
    </div>
  )
}

export default FilterBar
