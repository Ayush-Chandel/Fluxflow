import { Toaster as Sonner } from 'sonner'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'

// Filled disc + white mark, the way Linear draws its status glyphs. Two-tone, so
// these are written out here rather than going through icons.tsx's createIcon
// (which paints the whole svg a single `fill`).
function DiscIcon({ fill, children }: { fill: string; children: ReactNode }) {
  return (
    <svg viewBox='0 0 16 16' className='size-4 shrink-0' aria-hidden='true'>
      <circle cx='8' cy='8' r='8' fill={fill} />
      <g fill='none' stroke='white' strokeWidth='1.75' strokeLinecap='round' strokeLinejoin='round'>
        {children}
      </g>
    </svg>
  )
}

const SuccessIcon = (
  <DiscIcon fill='var(--color-success)'>
    <path d='M4.4 8.2 6.9 10.7 11.6 5.7' />
  </DiscIcon>
)

const ErrorIcon = (
  <DiscIcon fill='var(--destructive)'>
    <path d='M8 4.3v4.4' />
    <path d='M8 11.4h.01' />
  </DiscIcon>
)

// App-wide toast surface. Colors are read straight from the design tokens in
// index.css, so the toaster follows `data-theme` on its own — no need to
// subscribe to useTheme (which holds local, per-instance state).
function Toaster({ ...props }: ComponentProps<typeof Sonner>) {
  return (
    <Sonner
      position='bottom-right'
      icons={{ success: SuccessIcon, error: ErrorIcon }}
      style={
        {
          // Same floating-card surface the create-issue dialog uses — reads white
          // in light theme rather than the greyer `elevated` popover fill.
          '--normal-bg': 'var(--color-surface)',
          '--normal-text': 'var(--color-foreground)',
          '--normal-border': 'var(--color-edge)',
          '--border-radius': 'calc(var(--radius) + 2px)',
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: '!items-start !gap-2.5 !p-3 !shadow-lg',
          // The disc icon sits level with the title, not centred on the whole card.
          icon: '!mt-px !mr-0',
          title: '!text-lsm !font-medium',
          description: '!mt-1 !text-xs !text-muted',
          actionButton: '!bg-brand !text-white hover:!bg-brand-hover',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
