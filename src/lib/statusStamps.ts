
import { Timestamp } from 'firebase/firestore'
import type { Issue, IssueStatus } from '@/types/issue'


const isStarted = (status: IssueStatus) => status === 'in_progress' || status === 'done'


export function statusStamps(previous: Issue, next: IssueStatus): Partial<Issue> {
  const patch: Partial<Issue> = {}
  const now = Timestamp.now()

  if (isStarted(next) && !previous.startedAt) patch.startedAt = now

  if (next === 'done') {
    if (!previous.completedAt) patch.completedAt = now
  } else if (previous.completedAt) {
    patch.completedAt = null
  }

  return patch
}

export function initialStatusStamps(status: IssueStatus): {
  startedAt: Timestamp | null
  completedAt: Timestamp | null
} {
  const now = Timestamp.now()
  return {
    startedAt: isStarted(status) ? now : null,
    completedAt: status === 'done' ? now : null,
  }
}
