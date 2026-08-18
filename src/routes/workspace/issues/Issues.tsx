
import { useMemo } from "react"
import { useParams } from "react-router"
import { useIssueStore } from "@/store/issueStore"
import { useCreateIssueDialog } from "@/store/createIssueDialogStore"
import { useOpenIssue } from "@/hooks/useOpenIssue"
import { ISSUES_VIEW_ID } from "@/hooks/useIssues"
import ViewBar from "@/components/common/ViewBar"
import ViewSurface from "@/components/common/ViewSurface"
import ViewToggle from "@/components/common/ViewToggle"
import IssueDetailView from "@/components/issues/IssueDetailView"
import IssueKanbanView from "@/components/issues/kanban-view/IssueKanbanView"
import IssueListView from "@/components/issues/list-view/IssueListView"
import { NoteIcon } from "@/components/icons"

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 text-center'>
      <NoteIcon size={28} color='currentColor' className='text-muted' />
      <div>
        <p className='text-sm font-medium text-foreground'>No issues yet</p>
        <p className='text-lsm text-muted'>Everything starts here — file the first one.</p>
      </div>
      <button
        type='button'
        onClick={onCreate}
        className='rounded-2xl bg-brand px-3 py-1.5 text-lsm text-white transition-colors hover:bg-brand-hover'
      >
        New issue
      </button>
    </div>
  )
}

function Issues() {

  const {identifier} = useParams();
  const openIssue = useOpenIssue();
  const openCreateIssue = useCreateIssueDialog((s) => s.openWith);

  // Subscribe only to the issues map; rebuild the array when it actually changes.
  const issuesMap = useIssueStore((s) => s.issues)
  const issues = useMemo(() => Object.values(issuesMap), [issuesMap])

  return (
    <>
    {issues.length === 0 ? (
      <div className='min-h-0 flex-1 pt-2'>
        <EmptyState onCreate={() => openCreateIssue()} />
      </div>
    ) : (
      <>
        <ViewBar>
          <ViewToggle viewId={ISSUES_VIEW_ID} className='ml-auto' />
        </ViewBar>
        {/* inert covers BOTH layouts: with the detail overlay open nothing
            underneath should be focusable or drag-targetable. */}
        <ViewSurface
          viewId={ISSUES_VIEW_ID}
          inert={!!identifier}
          list={<IssueListView issues={issues} onOpenIssue={openIssue} />}
          board={<IssueKanbanView issues={issues} onOpenIssue={openIssue} />}
        />
      </>
    )}
    {identifier &&
    <IssueDetailView
    identifier={identifier}
    />
    }
    </>
  )
}

export { Issues as Component }
