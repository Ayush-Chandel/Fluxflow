
import type { Timestamp } from 'firebase/firestore'
import type { IssuePriority, IssueStatus } from '@/types/issue'
import type { Milestone, ProjectPriority, ProjectStatus } from './project';

export interface TemplateIssueData {
  title: string
  description: string;
  status: IssueStatus
  priority: IssuePriority
  projectId: string | null
}

export interface TemplateProjectData {
    name: string
    description: string
    content: string
    status: ProjectStatus
    priority: ProjectPriority
    milestones: Pick<Milestone, 'name' | 'description'>[]
}

interface TemplateBase {
  id: string
  name: string
  description: string
  /**
   * How the template presents itself in the template list — both types have one.
   *
   * For a PROJECT template it does double duty: the project created from it
   * inherits these, which is why TemplateProjectData deliberately does NOT carry
   * its own icon/color. One value, no pair to keep in sync. Instantiation reads
   * them off the template: { ...template.data, icon: template.icon, ... }.
   *
   * For an ISSUE template it is presentation only — issues have no icon, so
   * nothing is stamped onto the issue that gets created.
   */
  icon: string
  color: string
  isDefault: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string
}

type WithPayload<B> =
  | (B & { type: 'issue'; data: TemplateIssueData })
  | (B & { type: 'project'; data: TemplateProjectData })

export type Template = WithPayload<TemplateBase>

export type IssueTemplate = Extract<Template, { type: 'issue' }>
export type ProjectTemplate = Extract<Template, { type: 'project' }>

export type CreateTemplateInput = WithPayload<
  Pick<TemplateBase, 'name' | 'description' | 'icon' | 'color' | 'isDefault'>
>


export type NewTemplateDoc = CreateTemplateInput & { createdBy: string }

export const TEMPLATE_INFO = {
  issues:{
    header:{
      title: 'Issue Templates',
      desc: 'Reusable templates to create issues from.'
    },
  },
  projects:{
    header:{
      title: 'Projects Templates',
      desc: 'Reusable templates to create projects from.'
    },
  },

}

export const TEMPLATE_TYPE_BY_SLUG = {
  projects: 'project',
  issues: 'issue',
} as const

export const TEMPLATE_SLUG_BY_TYPE = {
  project: 'projects',
  issue: 'issues',
} as const

export type TemplateTypeSlug = keyof typeof TEMPLATE_TYPE_BY_SLUG
export type TemplateType = (typeof TEMPLATE_TYPE_BY_SLUG)[TemplateTypeSlug]

export function isTemplateTypeSlug(value: string | undefined): value is TemplateTypeSlug {
  return value !== undefined && value in TEMPLATE_TYPE_BY_SLUG
}
