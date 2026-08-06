import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import DatePickerPanel from './DatePickerPanel'
import { formatDateShort } from '@/lib/date'
import type { PeriodAlign } from '@/lib/dateInput'

type DatePillPickerProps = {
  /** Shown while nothing is picked — e.g. 'Start', 'Target'. */
  label: string
  icon: React.ReactNode
  value: Date | null
  onChange: (date: Date | null) => void
  /** Panel heading; defaults to the pill's own label. */
  heading?: string
  /** Earliest selectable day, e.g. a Target that can't precede its Start. */
  min?: Date | null
  /** Whether a picked month/quarter/year collapses to its first or last day. */
  align?: PeriodAlign
  contentAlign?: 'start' | 'center' | 'end'
  triggerClassName?: string
}

/** An option pill that opens the date picker, mirroring IssueCommandBox's shape. */
function DatePillPicker({
  label,
  icon,
  value,
  onChange,
  heading,
  min,
  align,
  contentAlign = 'start',
  triggerClassName = '!px-2',
}: DatePillPickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className={triggerClassName}>
        <Button variant='default' onClick={(e) => e.stopPropagation()}>
          {icon}
          <span>{value ? formatDateShort(value) : label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side='bottom'
        align={contentAlign}
        className='w-auto rounded-xl border-edge bg-surface p-0 shadow-lg'
      >
        <DatePickerPanel
          heading={heading ?? label}
          value={value}
          min={min}
          align={align}
          onChange={(date) => {
            onChange(date)
            setOpen(false)
          }}
          onClear={() => {
            onChange(null)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePillPicker
