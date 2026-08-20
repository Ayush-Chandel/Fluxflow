
import { useRef, useState } from 'react'
import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ColorPicker } from '../ui/color-picker'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import ProjectIcon from './ProjectIcon'
import {
  PROJECT_ICON_COLORS,
  PROJECT_ICON_KEYS,
  PROJECT_ICONS,
  softProjectColor,
  type ProjectIconKey,
} from './constants/projectIcons'

type ProjectIconPickerProps = {
  icon: string
  color: string
  onChange: (next: { icon: ProjectIconKey; color: string }) => void
  /** Size of the icon inside the trigger button. */
  triggerIconSize?: number
  triggerClassName?: string
}

/** Must match `grid-cols-10` below — the arrow-key row stride depends on it. */
const COLS = 10

function ProjectIconPicker({
  icon,
  color,
  onChange,
  triggerIconSize = 16,
  triggerClassName,
}: ProjectIconPickerProps) {
  const [open, setOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  const isPreset = PROJECT_ICON_COLORS.some((swatch) => swatch.hex === color)

  const focusedIndex = Math.max(0, PROJECT_ICON_KEYS.indexOf(icon as ProjectIconKey))

  const handleGridKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const deltas: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: COLS,
      ArrowUp: -COLS,
    }
    const delta = deltas[event.key]
    if (delta === undefined) return

    const active = document.activeElement as HTMLElement | null
    const from = Number(active?.dataset.iconIndex ?? focusedIndex)
    const to = from + delta
    if (to < 0 || to >= PROJECT_ICON_KEYS.length) return

    event.preventDefault()
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-icon-index="${to}"]`)
      ?.focus()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* Tint carried on CSS vars rather than `style.backgroundColor` so the
            hover state can still win — an inline background would outrank any
            hover:bg-* class. */}
        <button
          type='button'
          aria-label='Change project icon'
          style={
            {
              '--icon-soft': softProjectColor(color),
              '--icon-soft-strong': softProjectColor(color, 16),
            } as React.CSSProperties
          }
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'bg-[var(--icon-soft)] hover:bg-[var(--icon-soft-strong)]',
            triggerClassName,
          )}
        >
          <ProjectIcon icon={icon} color={color} size={triggerIconSize} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side='bottom'
        align='start'
        className='w-[384px] rounded-xl border-edge bg-surface p-0 shadow-lg'
      >
        {/* Colour row — selecting a colour deliberately keeps the popover open so
            the user can judge it against the icons before committing. */}
        <div className='flex items-center gap-1.5 border-b border-edge-subtle px-3 py-2.5'>
          {PROJECT_ICON_COLORS.map((swatch) => (
            <button
              key={swatch.hex}
              type='button'
              aria-label={swatch.name}
              aria-pressed={swatch.hex === color}
              onClick={() => onChange({ icon: icon as ProjectIconKey, color: swatch.hex })}
              className='flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110'
              style={{ backgroundColor: swatch.hex }}
            >
              {swatch.hex === color && <CheckIcon className='h-3.5 w-3.5 text-white' />}
            </button>
          ))}

          <span className='mx-0.5 h-5 w-px shrink-0 bg-edge' />

          {/* Custom colour: the conic-gradient wheel from the design opens a
              nested picker popover. Nesting is safe here — Radix tracks
              dismissable layers through the React tree, so a click inside the
              inner content is not "outside" this one. */}
          <ColorPicker
            value={color}
            onChange={(hex) => onChange({ icon: icon as ProjectIconKey, color: hex })}
            align='end'
          >
            <button
              type='button'
              aria-label='Custom color'
              className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-transform hover:scale-110'
              style={{
                background:
                  'conic-gradient(#e5484d, #ee8b3b, #e5c019, #3fa66b, #02b8cc, #5e6ad2, #d148d1, #e5484d)',
              }}
            >
              {!isPreset && <CheckIcon className='h-3.5 w-3.5 text-white' />}
            </button>
          </ColorPicker>
        </div>

        {/* Icon grid. The wrapper's `color` cascades into every ProjectIcon that
            is not explicitly tinted, which is why the cells render bare lucide
            components instead of ProjectIcon here. */}
        <div
          ref={gridRef}
          role='group'
          aria-label='Project icons'
          onKeyDown={handleGridKeyDown}
          className='grid max-h-64 grid-cols-10 gap-0.5 overflow-y-auto p-2.5'
          style={{ color }}
        >
          {PROJECT_ICON_KEYS.map((key, index) => {
            const entry = PROJECT_ICONS[key]
            const Icon = entry.icon
            const selected = key === icon

            return (
              <button
                key={key}
                type='button'
                data-icon-index={index}
                tabIndex={index === focusedIndex ? 0 : -1}
                title={entry.label}
                aria-label={entry.label}
                aria-pressed={selected}
                onClick={() => {
                  onChange({ icon: key, color })
                  setOpen(false)
                }}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  'hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none',
                  selected && 'bg-elevated',
                )}
              >
                <Icon size={17} />
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default ProjectIconPicker
