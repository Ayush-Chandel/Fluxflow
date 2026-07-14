import type { Timestamp } from 'firebase/firestore'

// A timestamp can reach a component as a live Firestore Timestamp, or — once it's
// been serialized through IDB / the BroadcastChannel — as a plain { seconds } object,
// a Date, or an epoch number. Normalize all of them to a Date.
export type TimeInput = Timestamp | Date | number | { seconds: number } | null | undefined

export function toDate(value: TimeInput): Date | null {
  if (value == null) return null
  if (value instanceof Date) return value
  if (typeof value === 'number') return new Date(value)
  if (typeof value === 'object' && 'seconds' in value) return new Date(value.seconds * 1000)
  return null
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const DIVISIONS: [amount: number, unit: Intl.RelativeTimeFormatUnit][] = [
  [60, 'second'],
  [60, 'minute'],
  [24, 'hour'],
  [7, 'day'],
  [4.34524, 'week'],
  [12, 'month'],
  [Number.POSITIVE_INFINITY, 'year'],
]

// "just now", "2h ago", "3 days ago" — for list rows / activity feeds.
export function formatRelativeTime(value: TimeInput): string {
  const date = toDate(value)
  if (!date) return ''

  let duration = (date.getTime() - Date.now()) / 1000 // seconds, negative for past
  for (const [amount, unit] of DIVISIONS) {
    if (Math.abs(duration) < amount) return rtf.format(Math.round(duration), unit)
    duration /= amount
  }
  return ''
}

// "Jul 13, 2026" — for detail views / tooltips where an absolute date is clearer.
export function formatDate(value: TimeInput): string {
  const date = toDate(value)
  if (!date) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
