
import type { IssuePriority, IssueStatus } from '@/types/issue'
import type { ProjectPriority, ProjectStatus } from '@/types/project'

export type IssueTemplateForm = {
  icon: string
  color: string
  name: string
  description: string
  isDefault: boolean
  title: string
  issueDescription: string
  status: IssueStatus
  priority: IssuePriority
  projectId: string | null
}

export type ProjectTemplateForm = {
  icon: string
  color: string
  name: string
  description: string
  isDefault: boolean
  projectName: string
  summary: string
  content: string
  status: ProjectStatus
  priority: ProjectPriority
  /** Structural on purpose: only the names are compared, so lib doesn't have to
   *  reach into components for MilestoneDraft. */
  milestones: { name: string }[]
}

export const issueTemplateFingerprint = (form: IssueTemplateForm) =>
  JSON.stringify({
    ...form,
    name: form.name.trim(),
    description: form.description.trim(),
    title: form.title.trim(),
    issueDescription: form.issueDescription.trim(),
  })

export const projectTemplateFingerprint = (form: ProjectTemplateForm) =>
  JSON.stringify({
    ...form,
    name: form.name.trim(),
    description: form.description.trim(),
    projectName: form.projectName.trim(),
    summary: form.summary.trim(),
    content: form.content.trim(),
    // Rows are minted with a fresh client key on every mount, so comparing the
    // objects would report a change that never happened — names only.
    milestones: form.milestones.map((milestone) => milestone.name.trim()),
  })
