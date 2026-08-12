
import { cn } from '@/lib/utils'

type ProgressRingProps = {
  pct: number
  size?: number
  className?: string
  label?: string
}

const R = 9
const CIRCUMFERENCE = 2 * Math.PI * R

function ProgressRing({ pct, size = 14, className, label }: ProgressRingProps) {
  const safePct = Math.max(0, Math.min(100, pct))
  const filled = (safePct / 100) * CIRCUMFERENCE

  return (
    <svg
      viewBox='0 0 24 24'
      width={size}
      height={size}
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
      focusable='false'
      className={cn('shrink-0', className)}
    >
      {/* Track — the unfilled remainder, always a full circle underneath. */}
      <circle
        cx={12}
        cy={12}
        r={R}
        fill='none'
        stroke='currentColor'
        strokeWidth={3}
        opacity={0.25}
      />
      {safePct > 0 && (
        <circle
          cx={12}
          cy={12}
          r={R}
          fill='none'
          stroke='currentColor'
          strokeWidth={3}
          strokeLinecap='round'
          strokeDasharray={`${filled} ${CIRCUMFERENCE - filled}`}
          // Dashes start at 3 o'clock; rotate the whole circle so the arc grows
          // from the top, which is where a progress ring is read from.
          transform='rotate(-90 12 12)'
        />
      )}
    </svg>
  )
}

export default ProgressRing
