import { useState } from 'react'
import { cn } from '@/lib/utils'
import Calendar from './Calendar'
import PeriodGrid from './PeriodGrid'
import {
  DATE_GRANULARITIES,
  GRANULARITY_LABELS,
  parseDateInput,
  type DateGranularity,
  type PeriodAlign,
} from '@/lib/dateInput'

type DatePickerPanelProps = {
  /** Names the field being set — 'Start date', 'Target date'. */
  heading: string
  value: Date | null
  onChange: (date: Date) => void
  onClear?: () => void
  min?: Date | null
  /** Whether a picked period collapses to its first or last day. */
  align?: PeriodAlign
}

const CHIP =
  'h-6 rounded-full border px-2.5 text-xs transition-colors'

/**
 * The picker body: a typed field, the granularity chips, and whichever grid the
 * chosen granularity calls for.
 *
 * A single `view` date anchors every face — the day grid reads its month, the
 * period grids read its year — so switching chips or typing a date keeps them
 * all looking at the same place instead of drifting apart.
 */
function DatePickerPanel({
  heading,
  value,
  onChange,
  onClear,
  min,
  align = 'start',
}: DatePickerPanelProps) {
  const [granularity, setGranularity] = useState<DateGranularity>('day')
  const [text, setText] = useState('')
  const [view, setView] = useState<Date>(() => value ?? new Date())

  // Typing previews: the view jumps to the parsed date and the chips follow its
  // granularity, but nothing commits until Enter or a click on the grid.
  const handleType = (next: string) => {
    setText(next)
    const parsed = parseDateInput(next, align)
    if (!parsed) return
    setGranularity(parsed.granularity)
    setView(parsed.date)
  }

  const commitTyped = () => {
    const parsed = parseDateInput(text, align)
    if (parsed) onChange(parsed.date)
  }

  return (
    <div className='w-[340px]'>
      <div className='px-3 pb-3 pt-3'>
        <div className='text-lsm font-medium text-foreground'>{heading}</div>

        <input
          value={text}
          onChange={(e) => handleType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitTyped()
            }
          }}
          autoFocus
          placeholder='Try: May 2027, Q4, 20/05/2027'
          className='mt-2 h-8 w-full rounded-md border border-edge bg-transparent px-2.5 text-lsm text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/25'
        />

        <div className='mt-2.5 flex flex-wrap items-center gap-1.5'>
          {DATE_GRANULARITIES.map((option) => (
            <button
              key={option}
              type='button'
              aria-pressed={option === granularity}
              onClick={() => setGranularity(option)}
              className={cn(
                CHIP,
                option === granularity
                  ? 'border-brand bg-brand/10 font-medium text-brand'
                  : 'border-edge text-muted hover:bg-elevated hover:text-foreground',
              )}
            >
              {GRANULARITY_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div className='border-t border-edge-subtle'>
        {granularity === 'day' ? (
          <Calendar
            value={value}
            onChange={onChange}
            min={min}
            month={new Date(view.getFullYear(), view.getMonth(), 1)}
            onMonthChange={setView}
          />
        ) : (
          <PeriodGrid
            granularity={granularity}
            align={align}
            value={value}
            onChange={onChange}
            min={min}
            year={view.getFullYear()}
            onYearChange={(year) => setView(new Date(year, view.getMonth(), 1))}
          />
        )}
      </div>

      {/* Clearing only makes sense once a date is set, so the row is conditional
          rather than a permanently disabled control. */}
      {value && onClear && (
        <div className='border-t border-edge-subtle p-1.5'>
          <button
            type='button'
            onClick={onClear}
            className='w-full rounded-md px-2 py-1 text-left text-lsm text-muted transition-colors hover:bg-elevated hover:text-foreground'
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}

export default DatePickerPanel
