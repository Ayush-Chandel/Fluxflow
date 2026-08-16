// src/types/template.ts — Issue Template entity contract (§4 data model)
import type { Timestamp } from 'firebase/firestore'
import type { IssuePriority, IssueStatus } from '@/types/issue'

// Pre-fill payload for the create-issue form. Every field optional — a template
// only sets what it wants to enforce.
export interface TemplateData {
  title?: string
  description?: string
  priority?: IssuePriority
  labelIds?: string[]
  status?: IssueStatus
  assigneeId?: string | null
}

export interface Template {
  id: string
  name: string // required
  type: 'issue' // issue templates only (for now)
  isDefault: boolean
  data: TemplateData
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

export const TEMPLATE_TYPE_BY_SLUG = {
  projects: 'projects',
  issues: 'issues',
} as const

export type TemplateTypeSlug = keyof typeof TEMPLATE_TYPE_BY_SLUG
export type TemplateType = (typeof TEMPLATE_TYPE_BY_SLUG)[TemplateTypeSlug]

export function isTemplateTypeSlug(value: string | undefined): value is TemplateTypeSlug {
  return value !== undefined && value in TEMPLATE_TYPE_BY_SLUG
}