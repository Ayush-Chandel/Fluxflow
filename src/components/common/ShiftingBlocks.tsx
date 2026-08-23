import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

/**
 * A CSS-only twin of this lives in index.html so the mark is on screen before
 * the bundle boots — keep the two in step if the geometry ever changes.
 */

type Cell = readonly [col: number, row: number]

// The eight cells, in loop order, starting at the hole's first position (dead
// centre). Consecutive entries are always adjacent.
const RING: readonly Cell[] = [
  [1, 1], [2, 1], [2, 0], [1, 0],
  [0, 0], [0, 1], [0, 2], [1, 2],
]

// Cell (1,1) is the lattice centre — every offset is measured from it.
const CENTER: Cell = [1, 1]

const key = ([c, r]: Cell) => `${c},${r}`

export interface ShiftingBlocksProps {
  /** Edge of one block, in px. */
  size?: number
  /** Lattice pitch on top of the edge; from the Lottie. */
  gap?: number
  /** Block corner radius; from the Lottie. */
  radius?: number
  /** Seconds per slide — ten frames at 60fps. */
  duration?: number
  /** Multiplier on the beat; 2 runs it twice as fast. */
  speed?: number
  /** 0 keeps it Lottie-faithful; try 0.06 for a bit of give. */
  squash?: number
  className?: string
  /** Classes for the blocks themselves — this is where the colour lives. */
  blockClassName?: string
}

export default function ShiftingBlocks({
  size = 30,
  gap = size * 0.062,
  radius = size * 0.11,
  duration = 1 / 6,
  speed = 1,
  squash = 0,
  className,
  blockClassName,
}: ShiftingBlocksProps) {
  const reduced = useReducedMotion()
  const step = size + gap

  // Blocks start on every ring cell but the first — that's the hole.
  const [cells, setCells] = useState<readonly Cell[]>(() => RING.slice(1))
  const [moving, setMoving] = useState<number | null>(null)
  const cellsRef = useRef(cells)

  const layout = useMemo(() => {
    // Screen-space position of a cell centre, i.e. after the 45deg rotation.
    const toScreen = ([c, r]: Cell) => ({
      x: (((c - CENTER[0]) - (r - CENTER[1])) * step) / Math.SQRT2,
      y: (((c - CENTER[0]) + (r - CENTER[1])) * step) / Math.SQRT2,
    })
    const half = (size * Math.SQRT2) / 2 // half-diagonal of a rotated square
    const pts = RING.map(toScreen)
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs) - half
    const maxX = Math.max(...xs) + half
    const minY = Math.min(...ys) - half
    const maxY = Math.max(...ys) + half

    return {
      width: Math.ceil(maxX - minX),
      height: Math.ceil(maxY - minY),
      // The rotated origin is cell (1,1). Planting it at -min centres the
      // cluster in the box — the missing corner makes the shape lopsided, so
      // it does not land on the box's midpoint.
      originX: -minX,
      originY: -minY,
    }
  }, [size, step])

  // Position in the *unrotated* grid; the wrapper does the rotating.
  const toPx = ([c, r]: Cell) => ({
    x: (c - CENTER[0]) * step,
    y: (r - CENTER[1]) * step,
  })

  useEffect(() => {
    if (reduced) return

    const tick = () => {
      // Read the hole off the board rather than off a counter, so a remount
      // (StrictMode, fast refresh) can never desync it.
      const prev = cellsRef.current
      const hole = RING.findIndex((c) => !prev.some((p) => key(p) === key(c)))
      if (hole === -1) return

      const to = RING[hole]
      const from = RING[(hole + 1) % RING.length]
      const i = prev.findIndex((p) => key(p) === key(from))
      if (i === -1) return

      const next = prev.map((c, j) => (j === i ? to : c))
      cellsRef.current = next
      setCells(next)
      setMoving(i)
    }

    const id = setInterval(tick, (duration * 1000) / speed)
    const kickoff = setTimeout(tick, 0)
    return () => {
      clearInterval(id)
      clearTimeout(kickoff)
    }
  }, [reduced, duration, speed])

  return (
    <div
      aria-hidden='true'
      className={cn('relative', reduced && 'animate-pulse', className)}
      style={{ width: layout.width, height: layout.height }}
    >
      <div
        className='absolute size-0 rotate-45'
        style={{ left: layout.originX, top: layout.originY }}
      >
        {cells.map((cell, i) => {
          const p = toPx(cell)
          const active = moving === i

          // Straight line, ease-in-out — exactly what the Lottie does.
          return (
            <motion.div
              key={i}
              initial={false}
              animate={
                active && squash
                  ? { x: p.x, y: p.y, scale: [1, 1 - squash, 1 + squash * 0.6, 1] }
                  : { x: p.x, y: p.y, scale: 1 }
              }
              transition={
                active
                  ? {
                      duration: duration / speed,
                      ease: [0.333, 0, 0.667, 1],
                      ...(squash ? { scale: { times: [0, 0.35, 0.8, 1] } } : null),
                    }
                  : { duration: 0 }
              }
              className={cn('absolute bg-brand will-change-transform', blockClassName)}
              style={{
                width: size,
                height: size,
                left: -size / 2,
                top: -size / 2,
                borderRadius: radius,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
