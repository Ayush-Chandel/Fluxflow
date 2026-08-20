import { useNavigate } from 'react-router'
import { isOptimisticId } from '@/lib/optimistic'
import { slugify } from '@/lib/slug'
import type { Issue } from '@/types/issue'

export function useOpenIssue() {
  const navigate = useNavigate()
  return (issue: Issue) => {
    // A placeholder has no server document and no real 'LIN-N' yet — the route
    // resolves an issue BY identifier, so opening one would land on 'LIN-…' and
    // flip to "Issue not found" the moment the create returns and the row is
    // swapped for the real one. Ignoring the click leaves the user on the list,
    // where the row becomes clickable a moment later.
    if (isOptimisticId(issue.id)) return
    navigate(`/app/issues/${issue.identifier}/${slugify(issue.title)}`)
  }
}
