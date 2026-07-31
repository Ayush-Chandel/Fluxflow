
import { toast, type ExternalToast } from 'sonner'
import type { ReactNode } from 'react'


const spinner = (
  <svg viewBox='0 0 16 16' className='size-3.5 shrink-0 animate-spin' aria-hidden='true'>
    <circle
      cx='8'
      cy='8'
      r='6.4'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeDasharray='6 4'
    />
  </svg>
)

type NotifyOptions = Omit<ExternalToast, 'description' | 'icon'> & {
  /** Secondary line under the title. */
  description?: ReactNode
  /** Prefix the description with a spinner — the write hasn't landed yet. */
  pending?: boolean
}

/** Wrap the description so an in-flight write reads as one line: ⟳ Issue title. */
function build({ description, pending, ...opts }: NotifyOptions = {}): ExternalToast {
  if (!pending) return { ...opts, description }
  return {
    ...opts,
    description: (
      <span className='flex items-center gap-1.5'>
        {spinner}
        {description}
      </span>
    ),
  }
}

/** Pass `id` from a previous call to update that toast in place instead of stacking a new one. */
export const notify = {
  success: (title: ReactNode, opts?: NotifyOptions) => toast.success(title, build(opts)),
  error: (title: ReactNode, opts?: NotifyOptions) => toast.error(title, build(opts)),
  message: (title: ReactNode, opts?: NotifyOptions) => toast(title, build(opts)),
  dismiss: toast.dismiss,
}
