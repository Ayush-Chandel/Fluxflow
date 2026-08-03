
import { create } from 'zustand'
import type { CreateProjectInput } from '@/types/project'

interface CreateProjectDialogState {
  open: boolean
  /** Fields the trigger pre-selected (e.g. a status column's `+`). */
  prefill: Partial<CreateProjectInput> | null

  openWith: (prefill?: Partial<CreateProjectInput>) => void
  close: () => void
  setOpen: (open: boolean) => void
}

export const useCreateProjectDialog = create<CreateProjectDialogState>((set) => ({
  open: false,
  prefill: null,

  openWith: (prefill) => set({ open: true, prefill: prefill ?? null }),
  close: () => set({ open: false, prefill: null }),
  // Clearing prefill on close stops a stale prefill leaking into the next open.
  setOpen: (open) => set(open ? { open } : { open, prefill: null }),
}))
