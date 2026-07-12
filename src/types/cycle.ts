// src/types/cycle.ts — Cycle entity contract + derived status (§4, §9-E)
import type { Timestamp } from 'firebase/firestore'

// Cycle status is DERIVED client-side from the date range, never stored (§4).
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

// Firestore Timestamps lose their prototype (and thus .toMillis()) after an
// IndexedDB structured-clone round-trip, so read the raw `seconds` field, which
// survives on both the live instance and the cached plain object.
function timestampToMillis(ts: Timestamp): number {
  return ts.seconds * 1000
}

// Single source of truth for a cycle's status. `now` is injectable for testing.
export function cycleStatusFromDates(
  start: Timestamp,
  end: Timestamp,
  now: number = Date.now(),
): CycleStatus {
  if (now < timestampToMillis(start)) return 'upcoming'
  if (now > timestampToMillis(end)) return 'completed'
  return 'active'
}
