
import { cn } from '@/lib/utils'

export const MILESTONE_ACCENT = '#E5C019'


const EMPTY_OPACITY = 0.8


const T = '12 2.5' // top
const R = '21.5 12' // right
const B = '12 21.5' // bottom
const L = '2.5 12' // left
const C = '12 12' // centre


const WEDGES = [
  `M${T} L${R} L${C} Z`, // 25% — top-right
  `M${T} L${R} L${B} L${C} Z`, // 50% — + bottom-right
  `M${T} L${R} L${B} L${L} L${C} Z`, // 75% — + bottom-left
  `M${T} L${R} L${B} L${L} Z`, // 100% — the whole diamond
]

const OUTLINE = `M${T} L${R} L${B} L${L} Z`

type MilestoneProgressIconProps = {
  pct: number
  color?: string
  size?: number
  className?: string
}


function MilestoneProgressIcon({
  pct,
  color = MILESTONE_ACCENT,
  size = 14,
  className,
}: MilestoneProgressIconProps) {
  const safePct = Math.max(0, Math.min(100, pct))
  // 0–24 → 0, 25–49 → 1, 50–74 → 2, 75–99 → 3, 100 → 4.
  const quarters = Math.min(4, Math.floor(safePct / 25))

  return (
    <svg
      viewBox='0 0 24 24'
      width={size}
      height={size}
      aria-hidden='true'
      focusable='false'
      className={cn('shrink-0', className)}
      style={{ color, opacity: quarters === 0 ? EMPTY_OPACITY : undefined }}
    >
      {quarters > 0 && <path d={WEDGES[quarters - 1]} fill='currentColor' />}
      <path
        d={OUTLINE}
        fill='none'
        stroke='currentColor'
        strokeWidth={2}
        strokeLinejoin='round'
      />
    </svg>
  )
}

export default MilestoneProgressIcon
