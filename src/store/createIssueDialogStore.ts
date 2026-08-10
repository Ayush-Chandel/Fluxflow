
import { create } from 'zustand'
import type { CreateIssueInput, IssuePriority, IssueStatus } from '@/types/issue'

/** The in-progress form values, kept in the store so they survive the Radix
 *  content remount that happens when the dialog toggles modal/non-modal
 *  (i.e. when it is minimized to / restored from the corner). */
interface DraftState {
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
}

interface CreateIssueDialogState {
  open: boolean
  /** Collapsed to a floating bar in the corner; the draft is preserved. */
  minimized: boolean
  /** Expanded to a larger surface. */
  maximized: boolean
  prefill: Partial<CreateIssueInput> | null
  draft: DraftState

  /** Opens a fresh form — UNLESS a draft is already in flight, in which case it
   *  surfaces that one instead and ignores `prefill`. See the implementation. */
  openWith: (prefill?: Partial<CreateIssueInput>) => void
  close: () => void
  setOpen: (open: boolean) => void
  setMinimized: (minimized: boolean) => void
  toggleMaximized: () => void
  patchDraft: (patch: Partial<DraftState>) => void
}

const makeDraft = (prefill?: Partial<CreateIssueInput> | null): DraftState => ({
  title: prefill?.title ?? '',
  description: prefill?.description ?? '',
  status: prefill?.status ?? 'todo',
  priority: prefill?.priority ?? 'no_priority',
})

export const useCreateIssueDialog = create<CreateIssueDialogState>((set) => ({
  open: false,
  minimized: false,
  maximized: false,
  prefill: null,
  draft: makeDraft(),

  openWith: (prefill) =>
    set((s) => {
      if (s.open) return { minimized: false }

      return {
        open: true,
        minimized: false,
        maximized: false,
        prefill: prefill ?? null,
        draft: makeDraft(prefill),
      }
    }),
  close: () =>
    set({ open: false, minimized: false, maximized: false, prefill: null, draft: makeDraft() }),
  setOpen: (open) =>
    set(open
      ? { open }
      : { open, minimized: false, maximized: false, prefill: null, draft: makeDraft() }),
  // Maximizing and minimizing are mutually exclusive.
  setMinimized: (minimized) => set(minimized ? { minimized, maximized: false } : { minimized }),
  toggleMaximized: () => set((s) => ({ maximized: !s.maximized, minimized: false })),
  patchDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
}))
