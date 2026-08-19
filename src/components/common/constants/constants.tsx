import {
  BacklogIcon,
  CancelledIcon,
  DoneIcon,
  HighPriorityIcon,
  InProgressIcon,
  LowPriorityIcon,
  MediumPriorityIcon,
  NoPriorityIcon,
  ProjectBacklogIcon,
  ProjectCancelledIcon,
  ProjectCompletedIcon,
  ProjectInProgressIcon,
  ProjectPlannedIcon,
  TodoIcon,
  UrgentPriorityIcon
} from "@/components/icons";
import type { IssuePriority, IssueStatus } from "@/types/issue";
import type { ProjectStatus } from "@/types/project";
import type { CycleStatus } from "@/types/cycle";
import { cn } from "@/lib/utils";
import type { FilterOperator } from "@/components/reui/filters";
import { PINNED_OPERATOR } from "@/hooks/useIssueFilters";


export const ISSUE_MAP: Record<IssueStatus, { label: string; icon: React.ReactNode }> = {
  backlog: { label: "Backlog", icon: <BacklogIcon size={13} /> },
  todo: { label: "Todo", icon: <TodoIcon size={13} /> },
  in_progress: { label: "In Progress", icon: <InProgressIcon size={13} /> },
  done: { label: "Done", icon: <DoneIcon size={13} /> },
  cancelled: { label: "Cancelled", icon: <CancelledIcon size={13} /> }
};


export const PRIORITY_MAP: Record<IssuePriority, { label: string; icon: React.ReactNode }> = {
  urgent: { label: "Urgent", icon: <UrgentPriorityIcon size={13} /> },
  high: { label: "High", icon: <HighPriorityIcon size={13} /> },
  medium: { label: "Medium", icon: <MediumPriorityIcon size={13} /> },
  low: { label: "Low", icon: <LowPriorityIcon size={13} /> },
  no_priority: { label: "No Priority", icon: <NoPriorityIcon size={13} /> }
};

export const CYCLE_MAP: Record<CycleStatus, { label: string; icon: React.ReactNode }> = {
  upcoming: { label: "Upcoming", icon: <ProjectPlannedIcon size={13} /> },
  active: { label: "Active", icon: <ProjectInProgressIcon size={13} /> },
  completed: { label: "Completed", icon: <ProjectCompletedIcon size={13} /> }
};

export const PROJECT_MAP: Record<ProjectStatus, { label: string; icon: React.ReactNode }> = {
  backlog: { label: "Backlog", icon: <ProjectBacklogIcon size={13} /> },
  planned: { label: "Planned", icon: <ProjectPlannedIcon size={13} /> },
  in_progress: { label: "In Progress", icon: <ProjectInProgressIcon size={13} /> },
  completed: { label: "Completed", icon: <ProjectCompletedIcon size={13} /> },
  cancelled: { label: "Canceled", icon: <ProjectCancelledIcon size={13} /> }
};


export const PINNED: FilterOperator[] = [{ value: PINNED_OPERATOR, label: 'is any of' }]


export const MENU_STYLE = cn(
  'rounded-lg bg-surface text-foreground',
  // Keep the fade/zoom, halve its length. shadcn's menu content runs
  // `animate-in fade-in-0 zoom-in-95` at tw-animate-css's default 150ms, both
  // on open and close — and Radix's Presence waits for `animationend` before
  // unmounting, so that 150ms is paid twice per visit. 75ms still reads as a
  // transition rather than a jump. The utility targets `--tw-animation-duration`,
  // which is the first link in tw-animate-css's duration chain.
  '!animation-duration-75',
  // Rows: the app's 13px, and the checked one carries the brand wash that
  // IssueCommandBox gives its current value.
  '[&_[data-slot=dropdown-menu-item]]:text-lsm',
  '[&_[data-slot=dropdown-menu-sub-trigger]]:text-lsm',
  '[&_[data-slot=dropdown-menu-checkbox-item]]:text-lsm',
  '[&_[data-slot=dropdown-menu-checkbox-item][data-state=checked]]:bg-brand/10',
  // Checkmark to the RIGHT. The primitive reserves an 8-unit gutter on the left
  // (`pl-8`) for an indicator absolutely placed at `left-2`, so every unchecked
  // row is indented past empty space. Swap the padding and send the indicator to
  // the other edge: labels line up flush and the ticks read down the right side.
  // `>span:first-child` is the indicator — the label span follows it.
  '[&_[data-slot=dropdown-menu-checkbox-item]]:pl-2',
  '[&_[data-slot=dropdown-menu-checkbox-item]]:pr-8',
  '[&_[data-slot=dropdown-menu-checkbox-item]>span:first-child]:left-auto',
  '[&_[data-slot=dropdown-menu-checkbox-item]>span:first-child]:right-2',
  // The search box the pickers put above their options.
  '[&_input]:text-lsm [&_input]:text-foreground',
)

export const CHIP_STYLE = cn(
  // ONE frame around the pill instead of one per segment.
  '[&_[data-slot=button-group]]:overflow-hidden [&_[data-slot=button-group]]:rounded-md',
  '[&_[data-slot=button-group]]:border [&_[data-slot=button-group]]:border-edge',
  // Segments go flat and transparent — the group owns the frame now — and pick
  // up the app's type scale rather than shadcn's.
  '[&_[data-slot=button-group]>*]:!rounded-none [&_[data-slot=button-group]>*]:!border-0',
  '[&_[data-slot=button-group]>*]:!bg-transparent [&_[data-slot=button-group]>*]:!shadow-none',
  '[&_[data-slot=button-group]>*]:!px-2 [&_[data-slot=button-group]>*]:!text-xs',
  '[&_[data-slot=button-group]>*]:!font-normal [&_[data-slot=button-group]>*]:!text-muted',
  // A hairline keeps the parts legible without boxing each one.
  '[&_[data-slot=button-group]>*+*]:!border-l [&_[data-slot=button-group]>*+*]:!border-edge',
  // Hover belongs to the interactive segments only — never the field label.
  '[&_[data-slot=button-group]_[data-slot=button]:hover]:!bg-hover',
  '[&_[data-slot=button-group]_[data-slot=button]:hover]:!text-foreground',
  // The × is square; the shared px-2 would stretch it.
  '[&_[data-slot=button-group]>*:last-child]:!px-1.5',
  // Height: segments are `size="sm"` buttons (h-7), which stands a step taller
  // than the trigger beside them. 24px inside + the group's own 1px border on
  // each side lands the pill exactly on the trigger's 26px.
  '[&_[data-slot=button-group]]:!h-[26px] [&_[data-slot=button-group]]:!mt-0.5 [&_[data-slot=button-group]>*]:!h-[26px]',
  // Kill the focus ring. Button carries `focus-visible:ring-[3px]` and
  // buttonGroupVariants adds `focus-visible:z-10`, so when Radix hands focus
  // back to the trigger on close, a 3px ring lights up between the segments and
  // stays there — the blue seams. Hover already marks the live segment.
  '[&_[data-slot=button-group]>*]:!ring-0 [&_[data-slot=button-group]>*]:!outline-none',
  '[&_[data-slot=button-group]>*]:focus-visible:!border-transparent',
)

export const CYCLE_RANK = { active: 0, upcoming: 1, completed: 2 } as const

