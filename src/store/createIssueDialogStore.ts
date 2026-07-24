
import { create } from 'zustand'
import type { CreateIssueInput } from '@/types/issue'

interface CreateIssueDialogState {
  open: boolean
  prefill: Partial<CreateIssueInput> | null

  openWith: (prefill?: Partial<CreateIssueInput>) => void
  close: () => void
  setOpen: (open: boolean) => void
}

export const useCreateIssueDialog = create<CreateIssueDialogState>((set) => ({
  open: false,
  prefill: null,

  openWith: (prefill) => set({ open: true, prefill: prefill ?? null }),
  close: () => set({ open: false, prefill: null }),
  setOpen: (open) => set(open ? { open } : { open, prefill: null }),
}))
