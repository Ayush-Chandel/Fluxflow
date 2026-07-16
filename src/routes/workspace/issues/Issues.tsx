import IssueListView from "@/components/issues/IssueListView"
import { useIssueStore } from "@/store/issueStore"
import { useMemo } from "react"
import { MOCK_ISSUES } from "@/components/issues/__mockIssues" // TEMP: remove with the mock file
import IssueKanbanView from "@/components/issues/IssueKanbanView"

function Issues() {

  // Subscribe only to the issues map; rebuild the array when it actually changes.
  const issuesMap = useIssueStore((s) => s.issues)
  const issues = useMemo(() => Object.values(issuesMap), [issuesMap])

  // TEMP: fall back to seed data so the list renders before real issues exist.
  const rows = issues.length > 0 ? issues : MOCK_ISSUES

  return (
    <>
     {/* <IssueListView issues={rows} /> */}
     <IssueKanbanView issues={rows} />
    </>
  )
}

export { Issues as Component }