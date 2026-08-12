
import type { Timestamp } from 'firebase/firestore'


export const CYCLE_STATUSES = ['upcoming', 'active', 'completed'] as const
export type CycleStatus = (typeof CYCLE_STATUSES)[number]

export interface Cycle {
  id: string
  number: number // server-sequential (Vercel Fn) → displayed "Cycle N"
  name: string | null
  goal: string | null
  startDate: Timestamp // required
  endDate: Timestamp // required
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

export type CreateCycleInput = Pick<Cycle, 'name' | 'goal' | 'startDate' | 'endDate'>

/** "Cycle 5" — a cycle's name is optional, its number is not. */
export const cycleLabel = (cycle: Cycle) => cycle.name?.trim() || `Cycle ${cycle.number}`

function timestampToMillis(ts: Timestamp): number {
  return ts.seconds * 1000
}

export function cycleStatusFromDates(
  start: Timestamp,
  end: Timestamp,
  now: number = Date.now(),
): CycleStatus {
  if (now < timestampToMillis(start)) return 'upcoming'
  if (now > timestampToMillis(end)) return 'completed'
  return 'active'
}
