import IssueListView from "@/components/issues/list-view/IssueListView"
import { useIssueStore } from "@/store/issueStore"
import { useMemo } from "react"
import { MOCK_ISSUES } from "@/components/issues/__mockIssues" // TEMP: remove with the mock file
import IssueKanbanView from "@/components/issues/kanban-view/IssueKanbanView"
import { useParams } from "react-router"
import IssueDetailView from "@/components/issues/IssueDetailView"
import { useOpenIssue } from "@/hooks/useOpenIssue"

function Issues() {

  const {identifier} = useParams();
  const openIssue = useOpenIssue();

  // Subscribe only to the issues map; rebuild the array when it actually changes.
  const issuesMap = useIssueStore((s) => s.issues)
  const issues = useMemo(() => Object.values(issuesMap), [issuesMap])

  // TEMP: fall back to seed data so the list renders before real issues exist.
  const rows = issues.length > 0 ? issues : MOCK_ISSUES
  
  return (
    <>
    {/* <div className="flex-1 min-h-0 overflow-y-auto" inert={!!identifier}>
     <IssueListView issues={rows} onOpenIssue={openIssue} />
    </div> */}
    <div className="flex-1 min-h-0 flex flex-col">
      <IssueKanbanView issues={rows} onOpenIssue={openIssue} />
    </div>
    {identifier &&
    <IssueDetailView
    identifier={identifier}
    />
    }
    </>
  )
}

export { Issues as Component }