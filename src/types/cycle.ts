
import type { Timestamp } from 'firebase/firestore'


export const CYCLE_STATUSES = ['upcoming', 'active', 'completed'] as const
export type CycleStatus = (typeof CYCLE_STATUSES)[number]


export const CYCLE_QUICK_VIEWS = ['current', 'upcoming'] as const
export type CycleQuickView = (typeof CYCLE_QUICK_VIEWS)[number]

export const isCycleQuickView = (value: string | undefined): value is CycleQuickView =>
  CYCLE_QUICK_VIEWS.includes(value as CycleQuickView)

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
  // Idempotency key minted by the client and stored by api/createCycle, so the
  // snapshot delivering this cycle can retire the local placeholder without both
  // rendering. Server-written and immutable, like `number` — see types/issue.ts.
  clientRequestId?: string | null
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
