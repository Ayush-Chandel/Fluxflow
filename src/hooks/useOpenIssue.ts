import { useNavigate } from 'react-router'
import { slugify } from '@/lib/slug'
import type { Issue } from '@/types/issue'

export function useOpenIssue() {
  const navigate = useNavigate()
  return (issue: Issue) =>
    navigate(`/app/issues/${issue.identifier}/${slugify(issue.title)}`)
}
