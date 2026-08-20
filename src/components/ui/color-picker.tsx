import { useEffect, useRef, useState } from 'react'
import { HexColorInput, HexColorPicker } from 'react-colorful'

import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

type ColorPickerProps = {
  /** Current colour, as a `#rrggbb` hex string. */
  value: string
  onChange: (hex: string) => void
  /** Element that opens the picker — rendered as the popover trigger. */
  children: React.ReactNode
  side?: React.ComponentProps<typeof PopoverContent>['side']
  align?: React.ComponentProps<typeof PopoverContent>['align']
  sideOffset?: number
  className?: string
}

/**
 * Dragging across the wheel emits a change per pointer move, and callers wire
 * `onChange` straight into stores that persist. So the drag is kept local and
 * only pushed outward once the pointer has been still this long.
 */
const COMMIT_DELAY_MS = 120

/**
 * react-colorful ships a fixed 200×200 layout with its own rounding, injected
 * as a stylesheet at runtime. These descendant selectors outrank it on
 * specificity, so the widget can fill the popover and match our radii.
 */
const COLORFUL = cn(
  '[&_.react-colorful]:h-auto [&_.react-colorful]:w-full [&_.react-colorful]:gap-2.5',
  // The default saturation panel grows into a fixed-height parent and carries a
  // 12px black bottom border as its spacer; with `h-auto` above it needs a real
  // height, and the gap replaces the border.
  '[&_.react-colorful__saturation]:h-36 [&_.react-colorful__saturation]:rounded-lg',
  '[&_.react-colorful__saturation]:border-b-0',
  // Hue defaults to a 24px bar with square top corners; slim it to a pill.
  '[&_.react-colorful__hue]:h-3 [&_.react-colorful__last-control]:rounded-full',
  '[&_.react-colorful__pointer]:h-4 [&_.react-colorful__pointer]:w-4 [&_.react-colorful__pointer]:border-2',
)

/**
 * Hex colour picker in a popover — the replacement for `<input type='color'>`,
 * which renders an OS dialog that ignores the app's theme entirely.
 */
function ColorPicker({
  value,
  onChange,
  children,
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  // `null` means "no local edit in flight" — the prop is the source of truth
  // again, so a colour set elsewhere (a preset swatch) still shows up here.
  const [draft, setDraft] = useState<string | null>(null)
  const color = draft ?? value

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  useEffect(() => {
    if (draft === null || draft === value) return
    const timer = setTimeout(() => onChangeRef.current(draft), COMMIT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [draft, value])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) return
    // Closing beats the debounce: flush anything pending, then hand control
    // back to the prop.
    if (draft !== null && draft !== value) onChangeRef.current(draft)
    setDraft(null)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'w-56 rounded-xl border-edge bg-surface p-3 shadow-lg',
          COLORFUL,
          className,
        )}
      >
        <HexColorPicker color={color} onChange={setDraft} />

        <div className='mt-3 flex items-center gap-2'>
          <span
            aria-hidden
            className='h-7 w-7 shrink-0 rounded-md border border-edge'
            style={{ backgroundColor: color }}
          />
          {/* Only emits valid hex — it holds partial typing internally. */}
          <HexColorInput
            color={color}
            onChange={setDraft}
            prefixed
            spellCheck={false}
            aria-label='Hex colour'
            className={cn(
              'h-7 w-full min-w-0 rounded-md border border-edge bg-transparent px-2',
              'font-mono text-xs uppercase text-foreground outline-none transition-colors',
              'focus-visible:border-ring focus-visible:ring-[1.5px] focus-visible:ring-ring/50',
            )}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ColorPicker }
