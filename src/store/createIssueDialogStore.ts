
import { create } from 'zustand'
import type { CreateIssueInput, IssuePriority, IssueStatus } from '@/types/issue'
import type { IssueTemplate } from '@/types/template'
import { getDefaultTemplate, useTemplateStore } from '@/store/templateStore'

/** The in-progress form values, kept in the store so they survive the Radix
 *  content remount that happens when the dialog toggles modal/non-modal
 *  (i.e. when it is minimized to / restored from the corner). */
interface DraftState {
  /** Which template the draft came from — the picker's current value. */
  templateId: string | null
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  projectId: string | null
  /** Only reachable once a project is chosen — it is scoped to that project. */
  milestoneId: string | null
  cycleId: string | null
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
   *  surfaces that one instead and ignores `prefill`. See the implementation.
   *  `templateId` seeds from a chosen template; omitted, the type's default
   *  template (if any) is used. */
  openWith: (prefill?: Partial<CreateIssueInput>, templateId?: string | null) => void
  close: () => void
  setOpen: (open: boolean) => void
  setMinimized: (minimized: boolean) => void
  toggleMaximized: () => void
  patchDraft: (patch: Partial<DraftState>) => void
  /** Swaps the draft over to another template, or back to a blank one. */
  applyTemplate: (templateId: string | null) => void
}

/** An issue template by id, or undefined if it's gone / is a project template. */
const issueTemplate = (id: string | null | undefined): IssueTemplate | undefined => {
  if (!id) return undefined
  const template = useTemplateStore.getState().templates[id]
  return template?.type === 'issue' ? template : undefined
}

const makeDraft = (
  prefill?: Partial<CreateIssueInput> | null,
  template?: IssueTemplate | null,
): DraftState => ({
  templateId: template?.id ?? null,
  // Prefill outranks the template: it comes from the exact spot the user clicked
  // (a status column's `+`, a project's issue list), which is more specific than
  // a template's stored default.
  title: prefill?.title ?? template?.data.title ?? '',
  description: prefill?.description ?? template?.data.description ?? '',
  status: prefill?.status ?? template?.data.status ?? 'todo',
  priority: prefill?.priority ?? template?.data.priority ?? 'no_priority',
  projectId: prefill?.projectId ?? template?.data.projectId ?? null,
  milestoneId: prefill?.milestoneId ?? null,
  cycleId: prefill?.cycleId ?? null,
})

/**
 * Applying a template fills the blanks and leaves the user's own input alone.
 *
 * A field is the template's to set when it still holds the blank draft's value,
 * OR the value the PREVIOUS template put there — so swapping templates replaces
 * what the old one contributed without touching anything typed by hand. Only a
 * field the user actually changed survives.
 */
const mergeTemplate = (
  current: DraftState,
  blank: DraftState,
  previous: DraftState,
  next: DraftState,
): DraftState => {
  const fillable = <K extends keyof DraftState>(key: K) =>
    current[key] === blank[key] || current[key] === previous[key]

  const projectId = fillable('projectId') ? next.projectId : current.projectId

  return {
    ...current,
    templateId: next.templateId,
    title: fillable('title') ? next.title : current.title,
    description: fillable('description') ? next.description : current.description,
    status: fillable('status') ? next.status : current.status,
    priority: fillable('priority') ? next.priority : current.priority,
    projectId,
    milestoneId: projectId === current.projectId ? current.milestoneId : null,
  }
}

export const useCreateIssueDialog = create<CreateIssueDialogState>((set) => ({
  open: false,
  minimized: false,
  maximized: false,
  prefill: null,
  draft: makeDraft(),

  openWith: (prefill, templateId) =>
    set((s) => {
      if (s.open) return { minimized: false }

      // An explicit choice (the templates list's "Use template") wins; otherwise
      // the workspace's default issue template, if one is flagged.
      const chosen = templateId ? issueTemplate(templateId) : getDefaultTemplate('issue')
      const template = chosen?.type === 'issue' ? chosen : null

      return {
        open: true,
        minimized: false,
        maximized: false,
        prefill: prefill ?? null,
        draft: makeDraft(prefill, template),
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
  applyTemplate: (templateId) =>
    set((s) => ({
      draft: mergeTemplate(
        s.draft,
        makeDraft(s.prefill),
        makeDraft(s.prefill, issueTemplate(s.draft.templateId)),
        makeDraft(s.prefill, issueTemplate(templateId)),
      ),
    })),
}))
