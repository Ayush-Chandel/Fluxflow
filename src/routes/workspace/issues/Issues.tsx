import IssueListView from "@/components/issues/IssueListView"
import { useIssueStore } from "@/store/issueStore"
import { useMemo } from "react"


function Issues() {

  // Subscribe only to the issues map; rebuild the array when it actually changes.
  const issuesMap = useIssueStore((s) => s.issues)
  const issues = useMemo(() => Object.values(issuesMap), [issuesMap])

  return (
    <IssueListView issues={issues} />
  )
}

export { Issues as Component }