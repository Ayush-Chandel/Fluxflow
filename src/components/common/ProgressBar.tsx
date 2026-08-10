
import { cn } from '@/lib/utils'

type ProgressBarProps = {
  /** 0–100. Clamped, so a caller can hand over a raw ratio without guarding. */
  value: number
  /** Describes what is progressing, for screen readers. */
  label?: string
  className?: string
}

function ProgressBar({ value, label, className }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div
      role='progressbar'
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-elevated', className)}
    >
      <div
        className='h-full rounded-full bg-brand transition-[width] duration-300'
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default ProgressBar
