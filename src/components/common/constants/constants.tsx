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


