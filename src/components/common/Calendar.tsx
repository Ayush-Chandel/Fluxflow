import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type CalendarProps = {
  value: Date | null
  onChange: (date: Date) => void
  /** First of the displayed month — owned by the parent so typed input can jump it. */
  month: Date
  onMonthChange: (month: Date) => void
  /** Days before this one are unselectable — lets Target refuse to precede Start. */
  min?: Date | null
}

/** Monday-first, matching the design. */
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/** Six weeks always render, so the popover never changes height between months. */
const CELLS = 42

/** Midnight local — the unit every comparison here works in. */
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * A month grid, built on plain `Date` arithmetic rather than a date library —
 * the app ships none, and the surrounding picker (period grids, typed input)
 * is custom regardless, so one wouldn't earn its weight here.
 *
 * Every cell is derived by offsetting the day-of-month, which the Date
 * constructor normalizes across month and year boundaries for us.
 */
function Calendar({ value, onChange, month, onMonthChange, min }: CalendarProps) {
  const today = startOfDay(new Date())
  const minDay = min ? startOfDay(min) : null
  const selected = value ? startOfDay(value) : null

  // Back up from the 1st to the Monday that starts its week, then walk forward.
  // getDay() is Sunday-based, so shift it before using it as the offset.
  const leading = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - leading)
  const days = Array.from({ length: CELLS }, (_, index) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index),
  )

  const step = (delta: number) =>
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + delta, 1))

  return (
    <div className='select-none px-3 py-2.5'>
      {/* Caption left, navigation right */}
      <div className='mb-1.5 flex items-center justify-between'>
        <span className='text-lsm font-medium text-foreground'>
          {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <div className='flex items-center gap-0.5'>
          <button
            type='button'
            aria-label='Previous month'
            onClick={() => step(-1)}
            className='flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'
          >
            <ChevronLeftIcon className='h-3.5 w-3.5' />
          </button>
          <button
            type='button'
            aria-label='Next month'
            onClick={() => step(1)}
            className='flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'
          >
            <ChevronRightIcon className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-7'>
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className='flex h-7 items-center justify-center text-[11px] font-medium text-muted'
          >
            {weekday}
          </div>
        ))}

        {days.map((day) => {
          const outside = day.getMonth() !== month.getMonth()
          const weekend = day.getDay() === 0 || day.getDay() === 6
          const disabled = minDay ? day < minDay : false
          const isSelected = selected ? isSameDay(day, selected) : false
          const isToday = isSameDay(day, today)

          return (
            <button
              key={day.toISOString()}
              type='button'
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onChange(day)}
              className={cn(
                'flex h-7 w-7 items-center justify-center justify-self-center rounded-full text-xs transition-colors',
                'hover:bg-elevated',
                // Weekends recede, days outside the month recede further.
                outside ? 'text-muted/50' : weekend ? 'text-muted' : 'text-foreground',
                // Today is outlined until it's actually picked.
                isToday && !isSelected && 'border border-edge bg-elevated font-medium',
                isSelected && 'bg-brand font-medium text-white hover:bg-brand-hover',
                disabled && 'pointer-events-none opacity-30',
              )}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar
