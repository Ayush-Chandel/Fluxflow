// Granularity model + text parsing behind the date picker.
//
// The picker lets you pick a whole month, quarter, half-year or year, but a
// project stores a single `Timestamp` — so every period has to collapse to one
// day. Which end it collapses to depends on the field: a Start date means the
// first day of the period, a Target means the last.

export const DATE_GRANULARITIES = ['day', 'month', 'quarter', 'half', 'year'] as const
export type DateGranularity = (typeof DATE_GRANULARITIES)[number]

export const GRANULARITY_LABELS: Record<DateGranularity, string> = {
  day: 'Day',
  month: 'Month',
  quarter: 'Quarter',
  half: 'Half-year',
  year: 'Year',
}

/** Which end of a period the stored day is taken from. */
export type PeriodAlign = 'start' | 'end'

export type PeriodGranularity = Exclude<DateGranularity, 'day'>

/** Months spanned by one period of each granularity. */
const PERIOD_MONTHS: Record<PeriodGranularity, number> = {
  month: 1,
  quarter: 3,
  half: 6,
  year: 12,
}

/** Periods in a year — 12 months, 4 quarters, 2 halves, 1 year. */
export function periodsPerYear(granularity: PeriodGranularity) {
  return 12 / PERIOD_MONTHS[granularity]
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** 'Mar' | 'Q2' | 'H1' | '2027' for period cell `index` of `year`. */
export function periodLabel(granularity: PeriodGranularity, year: number, index: number) {
  if (granularity === 'month') return MONTH_LABELS[index]
  if (granularity === 'quarter') return `Q${index + 1}`
  if (granularity === 'half') return `H${index + 1}`
  return String(year)
}

/**
 * Collapse period `index` of `year` to the single day that gets stored.
 * Day 0 of the following month is the last day of this one, which sidesteps
 * leap years and 30/31-day months entirely.
 */
export function resolvePeriod(
  granularity: PeriodGranularity,
  year: number,
  index: number,
  align: PeriodAlign,
): Date {
  const span = PERIOD_MONTHS[granularity]
  const firstMonth = index * span
  return align === 'start'
    ? new Date(year, firstMonth, 1)
    : new Date(year, firstMonth + span, 0)
}

/** Which period of its year a date falls in, at the given granularity. */
export function periodIndexOf(date: Date, granularity: PeriodGranularity) {
  if (granularity === 'year') return 0
  return Math.floor(date.getMonth() / PERIOD_MONTHS[granularity])
}

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** '27' → 2027, '2027' → 2027. Two-digit years land in the current century. */
function normalizeYear(raw: string) {
  const year = Number(raw)
  return raw.length <= 2 ? 2000 + year : year
}

/** Longest month name the text prefixes — 'sep', 'sept' and 'september' all hit. */
function matchMonth(word: string) {
  if (word.length < 3) return -1
  return MONTH_NAMES.findIndex((month) => month.startsWith(word))
}

/**
 * A month named on its own is read as the *next* time it comes around — typing
 * 'May' in August means next May, not one four months gone.
 */
function inferYear(monthIndex: number) {
  const today = startOfToday()
  return monthIndex < today.getMonth() ? today.getFullYear() + 1 : today.getFullYear()
}

export type ParsedDateInput = { date: Date; granularity: DateGranularity }

/**
 * Best-effort read of what the user typed. Returns null rather than guessing
 * wildly, so the picker can simply leave the calendar where it was.
 *
 * Numeric dates are read day-first ('20/05/2027'), matching the placeholder,
 * unless the first field can only be a month.
 */
export function parseDateInput(raw: string, align: PeriodAlign): ParsedDateInput | null {
  const text = raw.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!text) return null

  const today = startOfToday()
  const day = (date: Date): ParsedDateInput => ({ date, granularity: 'day' })

  // Relative keywords
  const shifted = (days: number) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
  if (text === 'today') return day(today)
  if (text === 'tomorrow') return day(shifted(1))
  if (text === 'yesterday') return day(shifted(-1))
  if (text === 'next week') return day(shifted(7))
  if (text === 'next month') return day(new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()))

  // ISO — 2027-05-20
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) return day(new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])))

  // Numeric — 20/05/2027, 20.5.27, 20-5 (year optional)
  const numeric = text.match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/)
  if (numeric) {
    const [first, second] = [Number(numeric[1]), Number(numeric[2])]
    // Only one ordering can be valid when a field exceeds 12; day-first wins ties.
    const [dayOfMonth, month] = second > 12 && first <= 12 ? [second, first] : [first, second]
    if (month < 1 || month > 12 || dayOfMonth < 1 || dayOfMonth > 31) return null
    const year = numeric[3] ? normalizeYear(numeric[3]) : today.getFullYear()
    return day(new Date(year, month - 1, dayOfMonth))
  }

  // Quarter / half — q4, h1 2027
  const period = text.match(/^([qh]) ?([1-4])(?: ?,? ?(\d{2,4}))?$/)
  if (period) {
    const granularity: PeriodGranularity = period[1] === 'q' ? 'quarter' : 'half'
    const index = Number(period[2]) - 1
    if (index >= periodsPerYear(granularity)) return null
    const year = period[3] ? normalizeYear(period[3]) : today.getFullYear()
    return { date: resolvePeriod(granularity, year, index, align), granularity }
  }

  // Bare year — 2027
  const bareYear = text.match(/^(\d{4})$/)
  if (bareYear) {
    const year = Number(bareYear[1])
    return { date: resolvePeriod('year', year, 0, align), granularity: 'year' }
  }

  // Month name, optionally with a day and/or year — 'may', 'may 2027',
  // 'may 20', 'may 20 2027', '20 may 2027'
  const words = text.replace(/,/g, '').split(' ')
  const [first, ...rest] = words
  const leadingMonth = matchMonth(first)
  const monthIndex = leadingMonth >= 0 ? leadingMonth : matchMonth(rest[0] ?? '')
  if (monthIndex < 0) return null

  // Numbers keep their meaning wherever they sit: 4 digits is a year, fewer is a day.
  const numbers = words.filter((word) => /^\d+$/.test(word))
  const yearWord = numbers.find((word) => word.length === 4)
  const dayWord = numbers.find((word) => word.length <= 2)
  if (numbers.length > 2 || words.length > 3) return null

  const year = yearWord ? Number(yearWord) : inferYear(monthIndex)
  if (dayWord) {
    const dayOfMonth = Number(dayWord)
    if (dayOfMonth < 1 || dayOfMonth > 31) return null
    return day(new Date(year, monthIndex, dayOfMonth))
  }
  return { date: resolvePeriod('month', year, monthIndex, align), granularity: 'month' }
}
