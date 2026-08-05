import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  periodLabel,
  periodsPerYear,
  resolvePeriod,
  type PeriodAlign,
  type PeriodGranularity,
} from '@/lib/dateInput'

type PeriodGridProps = {
  granularity: PeriodGranularity
  align: PeriodAlign
  value: Date | null
  onChange: (date: Date) => void
  /** Year in view — the page anchor when picking years. */
  year: number
  onYearChange: (year: number) => void
  min?: Date | null
}

/** Years shown at once when picking a year, and the step its arrows take. */
const YEAR_PAGE = 12

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * The month / quarter / half-year / year face of the picker. Each cell stands
 * for a period and commits the single day that period collapses to, so the
 * caller only ever deals in `Date`.
 */
function PeriodGrid({
  granularity,
  align,
  value,
  onChange,
  year,
  onYearChange,
  min,
}: PeriodGridProps) {
  const pickingYears = granularity === 'year'
  const minDay = min ? startOfDay(min) : null

  // Years page in blocks of 12; every other granularity pages one year at a time.
  const pageStart = Math.floor(year / YEAR_PAGE) * YEAR_PAGE
  const count = pickingYears ? YEAR_PAGE : periodsPerYear(granularity)
  const step = pickingYears ? YEAR_PAGE : 1

  const caption = pickingYears ? `${pageStart} – ${pageStart + YEAR_PAGE - 1}` : String(year)

  return (
    <div className='select-none px-3 py-2.5'>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-lsm font-medium text-foreground'>{caption}</span>
        <div className='flex items-center gap-0.5'>
          <button
            type='button'
            aria-label={pickingYears ? 'Previous years' : 'Previous year'}
            onClick={() => onYearChange(year - step)}
            className='flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'
          >
            <ChevronLeftIcon className='h-3.5 w-3.5' />
          </button>
          <button
            type='button'
            aria-label={pickingYears ? 'Next years' : 'Next year'}
            onClick={() => onYearChange(year + step)}
            className='flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-elevated hover:text-foreground'
          >
            <ChevronRightIcon className='h-3.5 w-3.5' />
          </button>
        </div>
      </div>

      <div className={cn('grid gap-1.5', granularity === 'half' ? 'grid-cols-2' : 'grid-cols-3')}>
        {Array.from({ length: count }, (_, index) => {
          // Year cells walk the page; the rest are periods within the shown year.
          const cellYear = pickingYears ? pageStart + index : year
          const cellIndex = pickingYears ? 0 : index
          const resolved = resolvePeriod(granularity, cellYear, cellIndex, align)

          const disabled = minDay ? resolved < minDay : false
          const isSelected = value ? value.getTime() === resolved.getTime() : false

          return (
            <button
              key={`${cellYear}-${cellIndex}`}
              type='button'
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onChange(resolved)}
              className={cn(
                'flex h-8 items-center justify-center rounded-md text-xs transition-colors',
                'text-foreground hover:bg-elevated',
                isSelected && 'bg-brand font-medium text-white hover:bg-brand-hover',
                disabled && 'pointer-events-none opacity-30',
              )}
            >
              {periodLabel(granularity, cellYear, cellIndex)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default PeriodGrid
