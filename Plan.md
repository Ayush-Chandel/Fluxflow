# FluxFlow — Master Build Reference (Linear Clone)

> Single source of truth for building FluxFlow. Combines the original architecture (auth, data layer,
> optimistic mutation pipeline, services, Vercel Functions, security rules, dev/deploy workflow) with
> the newly-scoped features: **Projects · Milestones · Cycles · Issue Templates**.
> Use this as the reference doc to build the whole app top-to-bottom.

**How to use this file (for AI agents & contributors):** This is the authoritative plan — read it
before making architectural decisions. Sections are stable and numbered; cite them as `§N`. Before
building any entity feature, follow the **reference pattern** established for Issues (§6–§7): the data
pipeline, store shape, and services are meant to be copied, not reinvented. When you complete a build-
order step (§10), update its status marker here. If reality diverges from this doc, fix the doc in the
same change. Keep the status legend below accurate.

**Status legend:** ✅ done · 🚧 in progress / stub · ★ new (not started) · ⚠️ needs attention/replacement.

---

## 0. Context & Current State

FluxFlow is a client-only SPA Linear clone. The original plan shipped **Issues** only; we are
expanding to **Projects (with Milestones)**, **Cycles**, and **Issue Templates**, designing the data
model / stores / routing / rules once so nothing is retrofitted.

**Verified state of the repo today:**
- ✅ **Step 1 — Firebase setup**: `src/lib/firebase.ts` (Auth + Firestore + DEV emulators).
- ✅ **Step 2 — Auth flow**: `authService.ts`, `authStore.ts` (`onIdTokenChanged`, reads `workspaceId`
  claim), `routes/Guards.tsx` (AuthRoute/ProtectedRoute + AppSplash), Login/SignUp with Zod
  (`lib/validation.ts`), `api/setWorkspaceClaims.ts` implemented.
- ✅ **Step 3 — App shell (closed 2026-08-19)**: every part of it has now landed — the sidebar nav
  with §14, the view toggle with §15, the filter chips with §17 — so the 🚧 it carried since the
  beginning is finally gone. `WorkspaceLayout.tsx` + pinnable/hover-reveal `Sidebar`
  (framer-motion) exist. **`Topbar/Topbar.tsx` now renders a breadcrumb** — the `Issues` crumb, plus
  `› LIN-N <title>` when a detail is open; the `Issues` crumb `Link` owns back-navigation to the list.
  The primary create button ✅ landed with §10.5 (dispatches by `activeKey`). **The Topbar is now
  COMPLETE** — §17 put the filter chips in `ViewBar` too (2026-08-19), so breadcrumb + create button
  is all it will ever hold. **The list⇄board toggle deliberately did NOT land in the Topbar**
  (decided 2026-08-18): §15 put it in a `ViewBar` strip directly *under* it, so the Topbar never has
  to know the current surface's `viewId` — which is param-dependent on detail pages and tab-dependent
  on the project detail, where the open tab is local state and not routable.
  **Sidebar nav ✅** — `SideContent` lists Projects/Issues/Cycles plus the nested **Templates** group
  (§14 widened `StaggerAccordion` to one level of children). A separate `SidebarNav.tsx` never
  happened: the links are data in `SideContent` and the accordion renders them. `router.tsx` uses
  `handle: { sidebarKey }` for active state; nested children prefix-match the pathname instead, since
  they share their parent's key.
- ✅ **Step 4 — Shared foundation**: `types/{issue,project,cycle,template}.ts`, `lib/idb.ts`,
  `lib/broadcastChannel.ts`, `hooks/useEntitySync.ts` (the sync engine), `store/viewPreferenceStore.ts`.
- ✅ **Step 5 — Issue store + `useIssues`**: `store/issueStore.ts` (optimistic CRUD + rollback,
  reference impl), `hooks/useIssues.ts` (thin `useEntitySync` wrapper), `services/issueService.ts`
  (client SDK + `fetch(/api/createIssue)`), `types/issue.ts` gains `CreateIssueInput`.
- ✅ **Step 6 — MSW handlers**: `src/mocks/handlers.ts` mocks `/api/createIssue`, `/api/createCycle`
  (both return sequential-ID shapes), and `/api/setWorkspaceClaims` — local dev needs no Admin SDK.
- ✅ **Step 7 — `api/createIssue` + issue rules**: `api/createIssue.ts` implemented (verify ID token →
  workspace-match check → sequential `LIN-N` → `add()` with server-stamped `createdBy`/timestamps);
  `firestore.rules` replaced the expired permissive template — issues are `read/update/delete`
  workspace-scoped, `create: if false` (server-only). Other collections' rules deferred to step 18.
- ✅ **Step 8 — Issue List view**: `components/issues/{IssueListView,IssueRow,IssueCommandBox}.tsx` +
  `components/common/constants/constants.tsx` (`ISSUE_MAP`/`PRIORITY_MAP`). `IssuesPage` reads the store
  (`useIssueStore(s => s.issues)` → memoized array), groups by status (hides empty groups, real counts),
  rows show identifier/title/priority/status/relative-date with inline status/priority edit wired to the
  optimistic store (`updateStatus`/`updateIssue`); `IssueCommandBox` is the reusable picker. Avatar/label/
  sub-issue metadata left static (no member/label entity yet — §11+). `useIssues()` wired in
  `WorkspaceLayout`. `tsc` clean.
- ✅ **Step 9 — Issue Kanban view + manual reordering (both views)**:
  `components/issues/{IssueKanbanView,KanbanColumn,IssueCard}.tsx` — dnd-kit sortable columns with a
  `DragOverlay` ghost. Cross-column drag uses the ephemeral-groups `onDragOver` pattern (board renders
  a drag-local copy; hovered column parts live; drop commits exactly the visual slot;
  `MeasuringStrategy.Always`). Position persists via `sortOrder?: number` on Issue (§4): fractional
  indexing on the createdAt-millis scale — helpers in `lib/issueOrdering.ts` (`getIssueSortKey` /
  `sortIssues` / `orderBetween`; `getDropPatch` = arrayMove semantics for the board,
  `getDropAfterPatch` = insert-after for the list). *Since 2026-08-06 those names are thin
  issue-typed wrappers — the rules themselves moved to the generic `lib/ordering.ts`, shared with the
  project board; every call site and signature is unchanged.* List view reorders with the indicator-line
  pattern instead of rows parting (no-op `SortingStrategy`; brand line under hovered row = "lands
  after me"; droppable group header = top-of-group target). Card/row bodies memoized
  (`IssueCardContent`/`IssueRowContent`) so dnd's per-move re-renders stay cheap. One optimistic
  `updateIssue({status, sortOrder})` per drop, rollback in the store. Known gap: list view can't
  target empty groups (hidden — no header to drop on).
- ✅ **Step 10 core landed**: `IssueDetailView.tsx` renders as an absolute overlay over the list
  at `issues/:identifier/:slug?` (URL deep-link; slug cosmetic), with inline title/description edit
  (auto-growing fields via `common/AutoGrowTextarea`) wired to the optimistic store; **click-to-open**
  works in both list and kanban via a host-agnostic `onOpenIssue` callback; breadcrumb owns back-nav.
  **Deferred to future (not current scope):** framer-motion side-panel treatment + entity selectors
  (project/milestone/cycle/assignee/labels/template) — the selectors naturally fold into their entities'
  steps (§11–§14); the side-panel treatment is a later polish pass.
- ✅ **Step 10.5 — Create-issue modal**: one global `CreateIssueDialog` (`components/modals/`) mounted in
  `WorkspaceLayout` + `store/createIssueDialogStore` (`openWith(prefill?)`, trigger-agnostic; draft &
  prefill held in the store so they survive minimize⇄restore). `SideHeader` create button opens it;
  `CreateIssueModal` collects title/description (`AutoGrowTextarea`) + status/priority (`IssueCommandBox`)
  → `issueStore.createIssue`; remaining `CreateIssueInput` refs pass `null`/`[]`. Extras beyond scope:
  minimize-to-corner bar (`CreateIssueMinimizedBar`), maximize toggle, "Create more". Entity selectors
  deferred (§11–§14; Assignee/Project pills static today). Remaining cleanup: `MOCK_ISSUES` fallback in
  `Issues.tsx` still present (harmless — only shows at zero real issues).
- ✅ **Step 11 — Projects (closed 2026-08-19; the board, detail and pickers all landed long ago — the 🚧 outlived them)**: the non-UI half was built first —
  `types/project.ts` gains `CreateProjectInput`/`NewProjectDoc`, `services/projectService.ts`
  (client-only CRUD; `newId()` pre-generates the doc id so create needs no temp-id dance),
  `store/projectStore.ts` (optimistic create/update/delete + rollback, array cache via `selectAll()`,
  `broadcastDelta({entity:'projects'})`), `hooks/useProjects.ts` wired in `WorkspaceLayout`,
  `lib/progress.ts` (derived done/total/pct for project **and** milestone/cycle),
  `hooks/useProjectSelectors.ts` (`useProjectList`/`useProject`/`useProjectIssues`/`useProjectProgress`),
  and the `projects` rules block. **Schema changed here (2026-08-02):** projects gained a
  **`priority`** field and dropped the `paused` status — see §4. `ProjectPriority`/`PROJECT_PRIORITIES`
  *alias* `IssuePriority`/`ISSUE_PRIORITIES` instead of re-declaring them, so the scale can never drift
  and `PRIORITY_MAP` + `IssueCommandBox` are reused as-is (no `PROJECT_PRIORITY_MAP`); the store
  defaults it to `no_priority` exactly like `status` → `backlog`. **Create-project modal wiring ✅:**
  `store/createProjectDialogStore.ts` (the §10.5 pattern minus draft/minimize — the project modal has
  no minimize, so Radix never remounts it mid-edit and the form keeps local state);
  `CreateProjectModal` is mounted once in `WorkspaceLayout` off that store, and the **Topbar `+` now
  dispatches by `activeKey`** (projects → project modal, everything else → issue dialog) instead of
  the layout gating the modal on the route. **Landed since:** `PROJECT_MAP` constants (+ dedicated
  `Project*Icon` glyphs); the **projects table** — `components/projects/list-view/{ProjectRow,
  ProjectListView}.tsx` + `projectColumns`/`SortHeader` + `ProjectsPage` (empty state, sortable sticky
  header); the modal's form fields → `createProject` (+ `MilestoneDraftList` — its drafts were
  discarded on create until §12, and now ride the project's own `setDoc`).
  **Board data layer (2026-08-06):** `Project` gained **`sortOrder`** (§4) and `lib/issueOrdering.ts`
  was reduced to issue-typed wrappers over a new generic `lib/ordering.ts`, so issues and projects
  share ONE fractional-indexing engine instead of two copies; `lib/projectOrdering.ts` is the matching
  project-typed set and `useProjectBoardGroups()` hands the view pre-grouped, pre-ordered columns.
  **Board UI ✅ (2026-08-07):** `components/projects/kanban-view/{ProjectKanbanView,ProjectKanbanColumn,
  ProjectCard}.tsx` — the issue kanban's structure with project data. Card = icon + name, in-place
  status/priority pickers (`IssueCommandBox`, same as the table cells), lead placeholder, summary when
  set, target-date chip (`text-destructive` once its day is past, unless completed/cancelled), and
  `N issues` from the row's derived progress. Both column `+`s call
  `openWith({status})`, so a project is created in the column that asked for it. `lib/issueOpenGuard.ts`
  became **`lib/openGuard.ts`** (`data-issue-surface` → `data-card-surface`) — the popover
  fall-through guard is no longer issue-only now that project cards host pickers too.
  **Deliberately absent from the card:** the milestone chip and health (§4 doesn't model health — same
  call as the table's missing Health column). The milestone chip is no longer *blocked* since §12
  landed — `project.milestones` is right there on the card's row — it is simply not built yet.
  **Detail page ✅ (2026-08-10):** route `projects/:id/:slug?` → `routes/workspace/projects/
  ProjectDetail.tsx`, which resolves the project from the store and distinguishes "still hydrating"
  (skeleton, 1.2s grace) from a definitive miss ("Project not found") instead of flashing one for the
  other. `components/projects/detail/{ProjectDetailHeader,ProjectOverview}.tsx` + `common/ProgressBar`
  render the Overview; `hooks/useOpenProject.ts` is wired, so board cards navigate. The **Topbar project
  crumb** ✅ landed too (project's own glyph via `common/ProjectIcon`, not a status one).
  **Project selector on issues ✅ (2026-08-10):** `components/projects/ProjectPicker.tsx` wraps
  `IssueCommandBox` instead of forking it, bridging the two things the fixed-union pickers never face —
  a **dynamic** option list (map built per render from `useProjectList()`) and a **nullable** value
  (`null` travels as a `__no_project__` sentinel, translated back on the way out, because the trigger
  indexes `map[value]`). A `projectId` that is no longer in the list gets a synthesised "Unknown
  project" entry so a stale reference renders and can be cleared rather than crashing the trigger.
  Wired into `IssueDetailView`'s Properties column (→ `updateIssue({projectId})`) and into
  `CreateIssueModal`, replacing the static Project pill; `projectId` joined the **draft** in
  `createIssueDialogStore` (not the prefill) so a chosen project survives minimize⇄restore like every
  other field, and `handleCreate` now sends the draft's value instead of `prefill?.projectId ?? null`.
  **Detail Issues tab ✅ (2026-08-12):** `components/projects/detail/ProjectIssues.tsx` — the panel the
  step-15 tab strip will mount, built whole ahead of it: `useProjectIssues(projectId)` (no longer
  unused) → **both** `IssueListView` and `IssueKanbanView`, an `N issues` count, and a create that
  prefills `projectId` (header `+` and the empty state's button), exactly as `CycleDetail` prefills
  `cycleId`. *(§15 moved that header row out of the panel and into the shared strip as
  `ProjectIssuesBar`; the panel is now the empty state or the `ViewSurface`, nothing else.)* Layout comes from `viewPreferenceStore` under **`project:<id>:issues`** — the key is
  minted by `projectIssuesViewId(id)` in `useProjectSelectors` so the step-15 toggle addresses the same
  string the panel reads, making that step a pure `setLayout(viewId, …)` wiring. **The branch between
  the two lives inside the panel, not the page,** because the shells differ: the list scrolls
  vertically, the board fills the height and scrolls its columns internally (a board inside a page
  scroller is the failure mode §9C names). `ProjectDetail` now renders `overview | issues` off local
  state — **not** the URL, since §3 puts layout in IndexedDB and only filters in the URL, and an open
  tab is neither — with each tab bringing its own shell, and reseeds to Overview when `:id` changes.
  **`DetailTabsTemp` is gone (§15, 2026-08-18)** — replaced by the shared `ViewBar` + `ViewTabs` +
  `ViewToggle`. The stand-in's layout buttons made exactly the right `setLayout(viewId, …)` call, so
  the swap was a deletion, not a rewrite. `ProjectsPage` no longer hardcodes its table either.
- ✅ **Table sorting groundwork (2026-08-02)**: `ViewPreference` gains **`sortDir`** and `OrderBy`
  widens with the project columns (`name`/`status`/`lead`/`target`/`issues`/`progress`);
  `toggleSort(viewId, column)` implements header-click semantics (same column flips, new column starts
  asc) and `getPreference` now spreads over the defaults so preferences persisted before `sortDir`
  existed still return complete. `lib/projectSorting.ts` owns the comparators, `lib/progress.ts` gains
  `progressByKey()` (ONE pass over issues for the whole table instead of O(rows × issues)), and
  `useProjectRows(viewId)` returns sorted `{project, progress}` rows. **Health was explicitly declined
  — no field, no column data** (see §9C).
- ✅ **Step 12 — Milestones (2026-08-10)**: **stored as a `milestones` MAP FIELD on the project
  document, not the `projects/{id}/milestones` subcollection the original plan assumed** — §4 carries
  the decision and its consequences, §9D the build. Because a keyed map takes dotted-path partial
  writes (`milestones.<id>.name`, `deleteField()`), per-milestone write granularity survives while the
  whole second entity pipeline (sync engine, store, cache key, hook, rules block) is never built:
  milestones ride `useProjects()`. Landed: `Milestone`/`CreateMilestoneInput` + `Project.milestones?`
  in `types/project.ts`; `newMilestoneId`/`createMilestone`/`updateMilestone`/`removeMilestone` on
  `projectService`; the three optimistic actions on **`projectStore`** (rollback restores the
  milestones map only, so a failed milestone write can't revert an unrelated project edit);
  `appendOrder()` in `lib/ordering.ts`; `useProjectMilestoneList` + `useProjectMilestones` (no longer
  a stub); fully editable `ProjectMilestoneList` rows (inline name/description via `useCommitOnExit`,
  date pill, delete behind `ConfirmDialog`) whose drafts now commit; `CreateProjectModal` writes its
  milestone drafts in the same `setDoc` as the project; and `MilestonePicker` wired into
  `IssueDetailView` + `CreateIssueModal` (`milestoneId` joined the create draft; changing an issue's
  project clears it in the same write). No rules change was needed — see §8.
  **Glyph + hierarchy pass (2026-08-10, same step):** `common/MilestoneProgressIcon.tsx` ★ — a diamond
  that FILLS IN QUARTERS with completion (`Math.min(4, Math.floor(pct / 25))`: <25% faded outline,
  then one quarter per 25%, 100% solid). Drawn as ONE path for the filled wedge, not four triangles —
  quarters always fill clockwise from the top, so the filled region is a single contiguous polygon and
  there are no anti-aliasing seams through the middle of a 14px glyph. It renders in the milestone
  rows AND in every `MilestonePicker` option, so the issue's Properties pill doubles as a progress
  read-out; that switched the picker from `useProjectMilestoneList` to `useProjectMilestones` (rows
  with progress), which also widened `useProjectMilestones` to accept `string | null`. "No milestone"
  and "Unknown milestone" keep a plain grey diamond on purpose — they are absences, not milestones
  stalled at 0% — as do create-modal drafts, which aren't saved rows yet. In `IssueDetailView` the
  milestone pill is now **nested under the project pill with a drawn elbow** (one `<span>`, `border-l`
  + `border-b` + `rounded-bl`) instead of sitting beside it as a fourth flat property, since a
  milestone only exists inside a project.
  **Deliberately absent:** no cascade of `milestoneId := null` when a milestone is deleted (a stale id
  renders as "Unknown milestone" and is clearable, matching how a deleted project's `projectId`
  behaves today); no milestone chip on project cards/rows (no longer *blocked* — `project.milestones`
  is on the row already — just unbuilt); no drag-reorder of milestone rows.
  **Known small gaps:** `MilestoneDraftList` (create-project modal) has no description input, so
  milestones created there always get `description: ''` while the detail list's can have one;
  `useProjectMilestoneList` and `lib/progress.ts`'s `milestoneProgress` have no external caller since
  the picker moved to the rows hook — both kept as the right shape for a caller that doesn't need
  progress. **NOT yet runtime-verified:** the dotted-path writes have never been exercised against the
  emulator — that is the one real risk left in this step.
- ✅ **Step 13 — Cycles (2026-08-10)**: the last entity pipeline. `types/cycle.ts` gains
  `CreateCycleInput` + `cycleLabel()`; `services/cycleService.ts` (fetch → `/api/createCycle`, client
  SDK for update/remove; the date range crosses the wire as epoch millis since JSON has no Timestamp);
  `store/cycleStore.ts` (the **temp-id dance**, copied from `issueStore` rather than the projects'
  `newId()` shortcut — cycles are the other server-sequential entity); `hooks/useCycles.ts` wired in
  `WorkspaceLayout`; `hooks/useCycleSelectors.ts` (`useCycleRows`/`useCycleBoardGroups`/`useCycle`/
  `useCycleList`/`useCycleIssues`/`useCycleProgress`); `api/createCycle.ts` (verify token → workspace
  match → `count()+1` → `add()`, rejecting a missing or inverted range); the **`cycles` rules block**
  (create-blocked, like issues). **MSW is now empty** — `createCycle` was its last handler, so
  `src/mocks/handlers.ts` holds an empty array and every `/api/*` call hits the real Fn via
  `vite/localApi.ts` (§15).
  **Views ✅:** `CycleListView` is the **date-ordered timeline** (§9E) — `list-view/{CycleListView,
  CycleListRow,CycleDateRail}`. The rail is built **per row**, not as one absolutely-positioned
  column: it inherits the row's height, so a marker can't drift out of alignment and there is nothing
  to measure or recompute. **Marker geometry (settled 2026-08-11 after two passes):** the marker sits
  ON the row's bottom border and carries that cycle's START date. Because rows run newest-first, the
  row above starts where this one ends — so a row's FULL height is exactly its own cycle's duration,
  the line is ONE segment in its own status colour, and no row needs to know anything about its
  neighbours. Two earlier attempts are worth not repeating: anchoring the line to the rail's centre
  while the dot sat in a centred `[label][dot]` group put the line *behind the date text*, touching no
  marker; and splitting the line into halves tinted the neighbouring cycle's span instead of the
  active one's. Both disappeared with the bottom-anchored marker — `isFirst`/`isLast`/`activeBelow`
  are all gone. `kanban-view/{CycleBoardView,CycleBoardColumn,CycleCard}` is the board — **no DndContext,
  no sensors, no DragOverlay, no `sortOrder`**, because a cycle's column is derived from its dates;
  columns self-order chronologically instead. `common/ProgressRing` ★ (continuous donut — the cycle
  counterpart to the milestone diamond, unquantised because it sits beside an exact scope count).
  `CYCLE_MAP` reuses the PROJECT status glyphs rather than minting a third set.
  **Detail ✅ (reworked 2026-08-11):** route `cycles/:id/:slug?` → `CycleDetail`, which renders **the
  cycle's ISSUES** (`useCycleIssues` → `IssueKanbanView`, board hardcoded like the Issues page) behind
  an `N issues` count, with the same hydrating-vs-missing grace ProjectDetail uses and an empty state
  whose `+` prefills `cycleId`. It holds **no cycle metadata form** — see §9E. `useOpenCycle` + the
  **Topbar cycle crumb** (`:id` is shared with the project route, but only one store resolves it, so
  they never collide).
  **Cycle editing ✅ (2026-08-11):** `CycleActionsMenu` — a hover-revealed ⋯ on **both** the timeline
  row and the board card (which is why it sits in `components/cycles/`, not inside either view folder;
  it was briefly `list-view/CycleRowMenu` before the card got one too), kept
  focusable and lit while open, so the affordance never costs a click target) with **Edit cycle** →
  `createCycleDialogStore.openForEdit(id)` → `CreateCycleModal` seeded from the live cycle and
  submitting through `updateCycle`, and **Delete cycle** behind a `ConfirmDialog` that names the
  issues it will orphan. The dialog store holds the cycle's **id**, not a snapshot, so cycle data has
  one home (the cycle store) instead of being duplicated into a UI store. Two consequences the modal
  has to respect: (a) its dirty-check baseline is the cycle's own values, so an untouched edit closes
  without a spurious "discard?" — the create-only version compared `name !== ''`, which is true the
  instant an edit opens; (b) `editing` is a LIVE lookup and goes undefined if the cycle is deleted
  mid-edit, so **mode is driven by `isEditing = Boolean(editingId)` and submit branches on `editingId`,
  never on the resolved doc** — otherwise Save would fall through to `createCycle` and file a duplicate
  cycle out of the edit. The form seeds once (effect keyed `[open, editingId]`) and deliberately does
  not re-seed afterwards; re-seeding would wipe what the user is typing.
  **Issue↔cycle ✅:** `components/cycles/CyclePicker.tsx` — the `ProjectPicker` pattern a third time
  (wraps `IssueCommandBox`, dynamic options, `__no_cycle__` sentinel, synthesised "Unknown cycle").
  Options sort by **status** (active → upcoming → completed), not alphabetically. Wired into
  `IssueDetailView` and `CreateIssueModal` (replacing a static `PlayCircleIcon` pill); `cycleId`
  joined the **draft** in `createIssueDialogStore` so it survives minimize⇄restore. It sits **flat
  beside** the project pill, NOT nested like milestone — project and cycle are independent axes.
  **Create ✅:** `store/createCycleDialogStore.ts` + `CreateCycleModal` mounted in `WorkspaceLayout`;
  the Topbar `+` now dispatches three ways via a lookup instead of a ternary. The modal **suggests the
  next range** (day after the latest cycle ends, 14 days long) and ends a cycle at 23:59:59.999 of its
  closing day, so a cycle stays `active` through its final date instead of flipping at that morning's
  midnight.
  **Also landed here: `startedAt`/`completedAt` + `lib/statusStamps.ts`** (§4) — nothing in step 13
  reads them; they are here because history is unbackfillable. `issueStore.updateStatus` now
  **delegates to `updateIssue`** rather than running its own pipeline, since the kanban drop writes
  `updateIssue({status, sortOrder})` — so both entry points stamp through one path and cannot drift.
  `issueService.updateStatus` was deleted as a consequence (a status write is no longer single-field).
  `api/createIssue` stamps the same fields server-side for issues filed straight into in_progress/done.
  **Deferred out of this step:** the list⇄board **switcher** → step 15 (✅ landed 2026-08-18: both
  `CyclesPage` and `CycleDetail` now switch instead of hardcoding); the **burn-up chart** → §12.
  *Note the cycle detail's "Issues tab" is no longer pending — the detail page simply IS the issues
  now, so step 15's strip added only the view toggle beside the count/status/range chips.*
  **Known unused-but-kept:** `useCycleProgress` has no caller — rows carry their own derived
  progress, so nothing needs the single-id form (exactly the position `milestoneProgress` is in after
  §12). *`CycleBoardView` was in this list too until §15 wired the switcher — it is reachable now.*
  **NOT yet runtime-verified ⚠️**: nothing in this step has been run against the emulator —
  `/api/createCycle`, the status stamps, and cycle create/update/delete through the rules. Together
  with §12's untested milestone map writes this is the whole outstanding risk for steps 12–13 (§13).
- ✅ **Step 14 — Templates (2026-08-16 → 08-17)**: shipped for **BOTH issues and projects**, which
  supersedes the original "issue templates only" scope — §12 no longer lists project templates as
  out-of-scope. One `templates` collection and ONE pipeline: `types/template.ts` carries a
  **discriminated union** (`WithPayload<TemplateBase>` → `{type:'issue', data:TemplateIssueData}` |
  `{type:'project', data:TemplateProjectData}`, plus `IssueTemplate`/`ProjectTemplate` via `Extract`),
  so `t.type === 'issue'` narrows `t.data` and nothing needs a cast. Two collections would have bought
  a second sync engine, store, cache key and rules block for a read we never perform — the same
  argument §4 used against a milestones subcollection. `services/templateService.ts` (client CRUD,
  `newId()` + `setDoc` like projects — no temp-id dance), `store/templateStore.ts`,
  `hooks/useTemplates.ts` (wired in `WorkspaceLayout`), `hooks/useTemplateSelectors.ts`
  (`useTemplateList(type)` / `useTemplate(id)` / `useDefaultTemplate`), and the **`templates` rules
  block** (client-writable like projects).
  **`isDefault` is PER TYPE, and a toggle rather than a radio:** one default issue template and one
  default project template coexist, so `currentDefaultId(templates, type, exceptId)` scopes the
  demotion; clicking Default on the current default clears it, leaving zero defaults — the state a
  fresh workspace is in anyway, so nothing has to special-case it. The swap is ONE `writeBatch`
  (`writeWithDefaultCleared`), and every rollback path restores **both** affected rows, not just the
  edited one.
  **Pages, not modals (decided 2026-08-16):** templates are a settings surface — you arrive at the page
  *to* manage them, so there is nothing to overlay. Routes `templates/:type` (manager),
  `templates/:type/new` and `templates/:type/:id` — the same form page in its two modes (static `new`
  outranks dynamic `:id` in React Router, and a 20-char Firestore auto-id can't collide with it).
  `:type` is the plural URL slug bridged to the singular field by `TEMPLATE_TYPE_BY_SLUG` /
  `TEMPLATE_SLUG_BY_TYPE`, so the two vocabularies can't drift into ad-hoc `slice(0,-1)` calls.
  `TemplatesPage` → `TemplateManager` (shared, `type` prop; rows use a stretched-link overlay so the
  whole row opens the editor, with `TemplateActionsMenu` above it at `z-10`). `TemplateFormPage` picks
  the body and reuses ProjectDetail's hydrating-vs-missing grace. **The split is the whole form body**,
  not the "shared shell + field block" §9F imagined: `TemplateIssue`/`TemplateProject` each carry their
  own header, Default switch and footer (~40 duplicated lines, accepted — everything else, manager, row,
  menu, picker, takes `type` as a prop). **Seeding is `key={template.id}`** — a remount, not a re-seed
  effect.
  **`icon`/`color` live on `TemplateBase`, not in the project payload:** for a project template they do
  double duty (the created project inherits them), so there is no second glyph to keep in sync; for an
  issue template they are presentation only.
  **The Topbar is hidden on `/app/templates/*`** (`WorkspaceLayout`) — the manager owns its header and
  `+`, the form page its back link. Consequence: `CustomTrigger` lives in the Topbar, so these pages
  have no sidebar PIN button (hover-reveal still works).
  **Sidebar sub-nav:** `types/layout.ts` gained `NavChild`/`NavGroup`/`NavItem` and `StaggerAccordion`
  renders one level of nesting — a **static, non-collapsible** Templates label with Issues/Projects
  always visible beneath it on a `border-l` rail. Group children can't light from `sidebarKey` (they
  share their parent's), so `NavLeaf` takes **`isActive` as a prop**: flat rows compare keys, children
  prefix-match the pathname (`=== path || startsWith(path + '/')`, so the create/edit pages keep the
  parent lit).
  **Applying a template — "what the user typed always wins" (decided 2026-08-13):** `TemplatePicker`
  (the `ProjectPicker` wrapper pattern a fourth time) sits in the HEADER of `CreateIssueModal` and
  `CreateProjectModal`, not among the option pills, because applying one rebuilds the whole draft
  instead of editing one field. A field is the template's to fill when it still holds the BLANK draft's
  value **or** the value the PREVIOUS template put there; anything else was typed by hand and survives.
  That test replaced a dirty-field set — no extra state to keep in sync. **Prefill outranks the
  template** (a column `+`'s status is more specific than a stored default), and an explicit choice
  (`openWith(prefill, templateId)`, from the row menu's "New issue/project") outranks the workspace
  default, which is read imperatively via `getDefaultTemplate(type)` because the dialogs seed inside a
  store action, not a render. A swap that moves `projectId` **clears `milestoneId`** — a milestone lives
  in exactly one project, the same clause `ProjectPicker` applies to a manual change.
  **Unsaved-changes guard (`hooks/useUnsavedGuard.ts` ★):** a page form has four ways out (Cancel, the
  back link, the sidebar, browser Back), so the block lives at the ROUTER via `useBlocker` rather than
  on the Cancel button. `isDirty` is read through a ref at navigation time — a form navigates to its
  list the instant it submits, with no render in between, so a captured value would block its own
  success path; `release()` is what that path calls.
  **Deliberately absent:** `labelIds`/`assigneeId` on `TemplateIssueData` (no label or member entity —
  the same gap as everywhere else); dates on project templates (a template is a SHAPE, not a schedule —
  a stored absolute date is stale the day after it is saved, so template milestones carry names only);
  no template picker in `IssueDetailView` (templates apply at create time only); no "duplicate
  template" action.
  **Known unused-but-kept:** `useDefaultTemplate` has no caller — both dialogs need the imperative
  `getDefaultTemplate` — exactly the position `useCycleProgress` is in after §13.
  **NOT yet runtime-verified ⚠️**: the two-document default swap, the `templates` rules block and
  template create/update/delete have never been run against the emulator, joining §12's milestone map
  writes and §13's cycle Fn on the same list (§13).
- ✅ **Step 15 — View chrome (2026-08-18)**: the list⇄board switcher + the shared strip, wired for
  **six** surfaces in one pass — issues, projects, cycles, the project detail's Issues tab, the cycle
  detail, and the two **cycle quick views** (`/cycles/current`, `/cycles/upcoming`), which landed
  after §13 was written and are the sixth surface the step grew. Four small pieces:
  `hooks/useViewPreference.ts` ★ (`useLayout(viewId)` → `[layout, setLayout]`; selects the PRIMITIVE,
  never `getPreference()`, which spreads a fresh object per call and would re-render on writes to
  unrelated views), `common/ViewToggle` (two buttons, lucide `List`/`Columns3`),
  `common/ViewBar` + `ViewTabs` (the strip, generic over the tab key), and `common/ViewSurface`.
  **`ViewSurface` is the real content of this step, not the toggle.** The six views disagreed about
  who owns the scroll — `CycleListView`/`CycleBoardView` brought their own root shells,
  `IssueListView`/`ProjectListView` brought none — and that drift had already produced a live bug:
  `ProjectsPage` wrapped its table in a flex column with **no `overflow-y-auto`** under a
  `overflow-hidden` `main`, so the projects table was *clipped rather than scrollable* and its
  `sticky top-0` header had no scroll container to stick in. The invariant now is **the surface owns
  the VERTICAL scroller, each view owns its HORIZONTAL one** — which is exactly the shape of the
  problem (only lists scroll down, only boards scroll across) and makes "board inside a vertical
  scroller" (the §9C failure mode) structurally impossible instead of a rule six call sites must
  remember. `CycleListView` gave up its own scroller; every branch is now
  `<ViewSurface viewId list={…} board={…} />`.
  **`ViewBar` is the ONLY strip on every surface** — no page hand-rolls a chrome row beside it. That
  cost one move: `ProjectIssues`'s own `N issues` + `+` row would have stacked *under* the tab strip,
  giving the project detail two chrome rows where the cycle detail has one, so it became
  **`ProjectIssuesBar`** — exported from the panel's module and rendered INTO `ProjectDetail`'s
  `ViewBar` when the Issues tab is open (count · filter · toggle · create, since §17). It lives beside the panel, not in
  the page, so the page needn't know what that tab has to say; it calls `useProjectIssues` a second
  time on purpose, a memoized selector being cheaper than lifting the array up and drilling it back
  down to both. (The templates pages' headers are NOT this: they replace a hidden Topbar, §14.)
  **Decisions:** the strip sits under the Topbar on **every** surface (not in the Topbar — §0 step 3);
  the quick views key their layout by **slug** (`cycle:current:issues`), only `/cycles/:id` keys by
  id, because "current" is a different cycle each sprint and the layout belongs to the surface;
  **Milestones stay inside Overview** rather than earning a tab (§12's list is project metadata, not
  a third surface). `inert` moved up to the whole surface on the Issues page — it used to sit on the
  list wrapper only, so the board under an open detail overlay stayed focusable and drag-targetable.
  **Also cleaned up here:** `__mockIssues.ts` is **deleted** — `Issues.tsx`'s fallback was the last
  thing §10.5 left, and `IssueDetailView` had a second one that could only ever resolve a mock the
  list no longer showed. The Issues page gained the real empty state that fallback was hiding.
  **Known gaps:** switching layout unmounts the other view, so scroll position is not preserved
  (Linear behaves the same); the strip is hidden entirely on an empty page, so there is nothing to
  toggle before the first issue/project/cycle exists.
- ✅ **Step 16 — BroadcastChannel tab-sync (2026-08-18)**: the step was **half-built before it
  started** — every store already called `broadcastDelta` (steps 5/11/13/14 each wired their own
  sends), but **`subscribeToBroadcast` had zero callers**, so all four tabs were shouting into a
  channel nobody listened to. The step is therefore the RECEIVE half, plus the send-side gap that
  visiting every call site exposed (the rollback paths, below).
  `hooks/useBroadcastSync.ts` ★ is mounted once in `WorkspaceLayout` beside the four
  `useEntitySync` wrappers, filters by workspace, and routes each delta to its store.
  **Three shape problems had to be solved before anything could receive:**
  (a) the existing `applyDelta` takes the SNAPSHOT delta (`added|modified|removed` + a **full**
  doc) while a broadcast `UPDATE` carries a **partial patch** — so each store gained a separate
  **`applyBroadcast`** rather than overloading `applyDelta`; CREATE assigns wholesale, UPDATE
  merges, and a patch for a doc this tab has never seen is **dropped, not written as a stub**
  (onSnapshot delivers the whole thing regardless).
  (b) **milestones have no store**, so `projectStore` gained a SECOND entry point,
  `applyMilestoneBroadcast` — `delta.id` is a milestone id and the project comes from the payload,
  which is why every milestone delta including DELETE carries a `projectId`.
  (c) `BroadcastDelta` was `{ payload?: unknown }`, which type-checked nothing. It is now a
  **discriminated union per entity** (`EntityDelta<E,T>` + `MilestoneDelta`, with
  `EntityBroadcast<E>` naming one store's slice) so CREATE *requires* a full doc and UPDATE a
  partial. That is load-bearing, not decoration: a CREATE published with a partial would write a
  corrupt document into every peer tab, and the union catches it at the call site.
  **`workspaceId` is now a REQUIRED field on every delta.** The channel is a single origin-wide
  `'fluxflow'` channel while every cache key and collection path is workspace-scoped; two tabs on
  different workspaces share it, so the receiver drops foreign deltas. It is passed explicitly from
  the `user.workspaceId` the mutation actually wrote to — NOT read back out of `authStore` inside
  `broadcastDelta` — which keeps `lib/` free of store imports and stays correct if the workspace
  changes mid-flight. Making it required (not optional) is what forced all **42** call sites to be
  visited (8 issues · 12 projects+milestones · 8 cycles · 14 templates), which is how the gap below
  was found — an optional field would have compiled silently and left the audit undone.
  **The real bug this step fixed: rollbacks never broadcast.** Nine catch blocks reverted the local
  store and told the peers nothing — `issueStore` update/delete, `projectStore`
  update/delete + updateMilestone/deleteMilestone, `cycleStore` update/delete. **`templateStore`
  was the only store already doing it right** (it re-broadcasts on every rollback path, including
  both rows of a default swap) and became the reference. This is invisible while nobody receives,
  and permanent once someone does: **a failed write produces no `onSnapshot` event**, so the
  rollback delta is the only thing that could ever correct a peer — it would otherwise sit on the
  optimistic value forever. Undoing a DELETE broadcasts a **CREATE** (the peer dropped the row, so
  there is nothing left to merge into), and an UPDATE rollback replays the whole `previous` doc,
  matching what the local rollback did (a full replace, not a key-wise undo).
  **The receiver touches the store and nothing else** — no `idb.set` (IndexedDB is shared
  per-origin and the ORIGINATING tab already wrote it; re-writing from every receiver races N tabs
  on one key), no re-broadcast (that is the infinite loop), no service call. Routing is a
  **`switch` with a `never` default**, not a lookup table: it narrows the union without a cast and
  makes a new `BroadcastEntity` a compile error until it is routed.
  **Timestamps needed no work** — structured clone drops prototypes, so a `Timestamp` arrives as a
  bare `{seconds, nanoseconds}`, but `lib/date.ts`'s `toDate()` has accepted that shape since step 4
  (IndexedDB degrades them identically) and its comment already named the BroadcastChannel. Nothing
  writes a store-read Timestamp back to Firestore, so degraded values never round-trip.
  **Deliberately NOT synced: `viewPreferenceStore`.** A layout choice is per-surface state that §15
  put on the surface the user picked it on, and it already persists via zustand `persist`. Syncing
  it would rearrange tab B's view under the reader's hands.
  **Also fixed here (pre-existing, unrelated):** `npm run build` was already red on a clean tree —
  two unused imports (`useParams` in `WorkspaceLayout`, `BoxIcon` in `CreateProjectModal`) failed
  `noUnusedLocals`. Removed so the step could be typechecked at all.
  **NOT yet runtime-verified ⚠️**: the receive path has not been exercised in two live tabs, and
  joins §12's milestone map writes, §13's cycle Fn and §14's default swap on that list (§13).
- ✅ **Step 17 — Filters (2026-08-19)**: status/priority/project/cycle across the four issue
  surfaces (Issues · project detail's Issues tab · cycle detail · both cycle quick views, which
  render through `CycleDetailView` and so came free). **Nothing server-side changed** — every issue
  is already in the store, so a filter is one array pass; no service, store, rules or index touched.
  `lib/issueFilters.ts` ★ + `hooks/useIssueFilters.ts` ★ + `common/{FilterBar,NoFilterMatches}` ★.
  **The chips went in `ViewBar`, not the Topbar** — superseding §9A/§10.3, on §15's own reasoning
  (per-surface state; and the Topbar is hidden on `/app/templates/*`). The Topbar is now finished.
  **The chip component is VENDORED, not written**: `components/reui/filters.tsx` (§2). It gives the
  one thing `IssueCommandBox` structurally cannot — **multi-select** — and being controlled, the URL
  stays canonical and it is only an editor. **Operators pinned to `is_any_of`** so §3's URL contract
  stays flat. Full detail, including the three shape problems (empty-param = pending chip, chip ids
  must be the field name, memo on values not the params object) in §10.17.
  **Also settled here:** the emptiness check moved to the **pre-filter** array so filtering to zero
  keeps the bar (and the chips) on screen instead of stranding the user; and **reordering is
  disabled while a filter is active** (`sortable` prop → `useSensors(sortable ? pointer : null)`),
  since a drop between visible neighbours would write a `sortOrder` blind to the hidden rows.
  **Landed while doing it:** the vendored file arrived as ReUI's **base-ui** build and did not
  compile against this project's Radix primitives — `npm run build` was red on 5 errors before a
  line of §17 was written. Replaced with ReUI's own **radix-nova** build (identical exports),
  `@base-ui/react` **uninstalled** (nothing else imported it), and `components.json` now pins
  `@reui` to `radix-nova` — the `{style}` placeholder was silently resolving to `base-nova`, which
  is how a base-ui component entered a Radix project unasked.
  **NOT yet runtime-verified ⚠️**: nothing here has been exercised in the browser — the chips, the
  URL round-trip, and the two empty states join the list in §13.
- ✅ **Step 18 — Rules hardening + indexes (2026-08-19)**: `firestore.rules` gained **field-level
  validation** under the existing workspace gate, closing §14.2's hole — every service spreads an
  arbitrary client patch into `updateDoc`, so `identifier` / `createdBy` / `createdAt` / a cycle's
  `number` were all client-writable, which made create-blocking `issues` and `cycles` decorative.
  Each collection now declares the fields a client may CHANGE and everything else is immutable **by
  omission**; creates on the two client-created collections (projects, templates) are validated
  outright (exact key set, `createdBy == request.auth.uid`, `createdAt == request.time`); every write
  must carry `updatedAt == request.time`; enums come from the same vocabularies `src/types` exports;
  and a template's `data` is validated against its own `type`, so §14's union is enforced server-side
  rather than only in TypeScript. Two subtleties are load-bearing and tested: **`diff()` is a VALUE
  diff** (so `templateService` may resend an unchanged, immutable `type`), and **`milestones` must be
  on `projectMutable()`** because a dotted-path write reports the TOP-LEVEL key.
  **The deliverable is really `test/firestore.rules.test.mjs` — 56 cases, `npm run test:rules`.**
  Field rules fail closed, so the way to break this app is a rule that denies its own UI; the suite
  asserts every write the app makes as well as every attack, on its own emulator (`firebase.test.json`,
  port 8085) so `clearFirestore()` can never touch dev data. It **discharges §12's milestone risk with
  evidence** (renaming one milestone leaves its siblings byte-identical, `deleteField()` removes
  exactly one key, deleting the project takes them with it) and pins the fact that a denial stays a
  catchable failure. *An "evaluation error" in the emulator log is NOT §14.1 returning — Firestore
  evaluates each rule twice, once pre-read with `resource` undefined; see §10.18.*
  **Composite indexes: deliberately none** — no `where()` exists in `src/` to serve (§8).
  **`npm run lint` is now CLEAN (0 from 65)** — ours fixed, vendored (`ui/`, `reui/`) switched off per
  §2 rather than edited, `icons.tsx`'s 30 findings identified as false positives.
- **Installed & idle, ready to wire**: `zustand`, `immer`, `idb-keyval`, `framer-motion`,
  `msw`, `sonner` (`@dnd-kit/*` wired in step 9). Design tokens already in `src/index.css`.

**Locked decisions:** Milestones included now · Cycles = manual MVP (no auto-schedule / no rollover) ·
Templates = **issue AND project templates** (widened 2026-08-16; one collection, one union — §4) ·
full data pipeline (IndexedDB + onSnapshot + optimistic + BroadcastChannel) for **every** entity.

---

## 1. Tech Stack (unchanged foundation)

| Concern | Choice | Reason |
|---|---|---|
| Framework | Vite + React 19 | Client-only SPA, no SSR, fast HMR |
| Routing | React Router v7 | Nested layouts, `useSearchParams`, `handle` metadata |
| Language | TypeScript (strict) | Type safety across store/services/components |
| Styling | Tailwind v4 + shadcn | Design-token driven (`bg-surface`, `text-muted`, `bg-brand`…) |
| Store | Zustand + Immer | Global container + clean `produce()` mutations |
| Persistence | idb-keyval | Instant IndexedDB reads across sessions |
| DB + realtime | Firebase Firestore | `onSnapshot` = realtime built in |
| Auth | Firebase Auth | Shares session with Firestore |
| Backend | Vercel Functions (`api/`) | Only for server-sequential IDs — same git push |
| Dev mocks | MSW | Mocks `/api/*` — no cold starts locally |
| Drag & drop | @dnd-kit/core | Accessible Kanban with optimistic updates |
| Tab sync | BroadcastChannel | Native, <1ms |
| Animations | Framer Motion | Sidebar + detail panel |

**Deliberately NOT used:** Next.js, Server Actions/Components, `firebase-admin` in the client, Route
Handlers, Cloud Functions, `httpsCallable`. All privileged work is a plain Vercel Function that
verifies a Firebase ID token.

---

## 2. Folder Structure (full, new items ★)

```
project-root/
├── src/
│   ├── main.tsx                  theme sync + MSW init (dev) + RouterProvider   ✅
│   ├── router.tsx                route tree + guards + handle.sidebarKey        ✅ (extend)
│   │
│   ├── types/                    ✅ shared entity contracts
│   │   ├── issue.ts   ├── project.ts   ├── cycle.ts   └── template.ts
│   │
│   ├── routes/
│   │   ├── Landing.tsx  ✅ placeholder
│   │   ├── Guards.tsx   ✅
│   │   ├── auth/{Login,SignUp}.tsx  ✅
│   │   └── workspace/
│   │       ├── issues/IssuesPage.tsx            ✅ list+board, detail overlay, filters
│   │       ├── projects/{ProjectsPage,ProjectDetailPage}.tsx   ★
│   │       ├── cycles/{Cycles,CycleDetail}.tsx                 ✅
│   │       └── templates/{TemplatesPage,TemplateFormPage}.tsx  ✅ (NOT under settings/ — §3)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── WorkspaceLayout.tsx  ✅  Sidebar + Topbar + <Outlet> (NEVER remounts)
│   │   │   ├── Topbar/Topbar.tsx    ✅ breadcrumb (owns back-nav) + create btn — COMPLETE
│   │   │   │        — NEITHER the view toggle (§15) NOR the filter chips (§17) are here:
│   │   │   │          both live in common/ViewBar, one row below
│   │   │   └── sidebar/{Sidebar,SidebarContent,SideHeader,SideContent,CustomTrigger}.tsx ✅
│   │   │        — nav links are DATA in SideContent (no SidebarNav.tsx); common/StaggerAccordion
│   │   │          renders them, incl. the nested Templates group (§14)
│   │   ├── issues/     ✅ IssueListView, IssueKanbanView, KanbanColumn, IssueRow, IssueCard,
│   │   │                 IssueCommandBox ✅ (list/kanban take a host-agnostic onOpenIssue) ·
│   │   │                 IssueDetailView ✅ (overlay + deep-link + inline edit; side-panel treatment deferred)
│   │   ├── modals/     ✅ CreateIssueDialog (global, in WorkspaceLayout) + CreateIssueModal +
│   │   │                 CreateIssueMinimizedBar + CreateProjectModal + CreateCycleModal
│   │   ├── projects/   ✅ projectColumns, SortHeader, MilestoneDraftList ✅ ·
│   │   │                 ProjectPicker ✅ · MilestonePicker ✅ (project-scoped, nullable,
│   │   │                   options show per-milestone progress) ·
│   │   │                 list-view/{ProjectListView,ProjectRow} ✅ ·
│   │   │                 kanban-view/{ProjectKanbanView,ProjectKanbanColumn,ProjectCard} ✅ ·
│   │   │                 detail/{ProjectDetailHeader,ProjectOverview} ✅ ·
│   │   │                 detail/ProjectMilestoneList ✅ (editable rows + drafts) ·
│   │   │                 detail/ProjectIssues ✅ (project-scoped issues, BOTH layouts, prefilled
│   │   │                   create; layout keyed `project:<id>:issues` — step 15 only adds the toggle)
│   │   ├── common/     ✅ FilterBar ★ (the §17 chips — builds the vendored <Filters>' `fields`
│   │   │                   from ISSUE_MAP/PRIORITY_MAP/the project+cycle lists, so a glyph is
│   │   │                   never minted twice; its MENU_STYLE/CHIP_STYLE/PINNED/CYCLE_RANK
│   │   │                   constants live in common/constants/constants.tsx beside the maps
│   │   │                   they extend) · NoFilterMatches ★ (filtered-to-zero; NOT the
│   │   │                   same as a surface's "nothing yet" state — this one keeps the bar) ·
│   │   │                 ViewBar(+ViewTabs) · ViewToggle · ViewSurface — the step-15 chrome:
│   │   │                 the strip under the Topbar, the list⇄board switcher, and the shell that
│   │   │                 owns the VERTICAL scroll so a board can never sit inside one ·
│   │   │                 ProgressBar, MilestoneProgressIcon (quarter-filling diamond),
│   │   │                 ProgressRing (continuous donut — the cycle counterpart),
│   │   │                 ProjectIcon(+Picker), ConfirmDialog, DatePillPicker,
│   │   │                 DatePickerPanel, Calendar, AutoGrowTextarea, OptionPill…
│   │   ├── cycles/     ✅ CyclePicker (status-ordered options, nullable) ·
│   │   │                 CycleStatusBadge(+CycleRangeChip) ✅ — shared by the row and the
│   │   │                   detail header, so a status has ONE label + tone ·
│   │   │                 list-view/{CycleListView,CycleListRow,CycleDateRail} ✅ (timeline; the
│   │   │                   rail is PER-ROW, so markers can't drift out of alignment) ·
│   │   │                 CycleActionsMenu ✅ (hover ⋯ → edit in the create modal, delete;
│   │   │                   shared by the timeline ROW and the board CARD) ·
│   │   │                 kanban-view/{CycleBoardView,CycleBoardColumn,CycleCard} ✅ (NO dnd —
│   │   │                   status is derived from dates, so there is nothing to drop)
│   │   │                 — NO detail/ folder: a cycle's page is just its issues (§9E)
│   │   ├── templates/  ✅ TemplateManager (list + rows, `type` prop) · TemplateActionsMenu ·
│   │   │                 TemplatePicker (in BOTH create modals' headers) ·
│   │   │                 TemplateIssue / TemplateProject — the two page-form bodies, the ONLY
│   │   │                   split components; each carries its own header/footer (§9F)
│   │   ├── ui/         ✅ shadcn primitives (button, card, popover, sheet, sidebar, tooltip…)
│   │   └── reui/       ✅ VENDORED — filters.tsx (ReUI, ~2,150 lines), the multi-select filter
│   │                      chips §17 configures. **This folder sits OUTSIDE the "everything
│   │                      shared and derived" discipline the rest of the tree follows**: it is
│   │                      third-party source we own but do not author, treated exactly like
│   │                      ui/ — you configure it from the call site (`fields`, `size`,
│   │                      `operators`), you never restyle it line by line. Most of it is
│   │                      unused (async loadOptions, renderOptionList virtualization, the
│   │                      text/validation field types, the i18n config, FilterGroup) and that
│   │                      is FINE — unused ≠ needing removal. Trimming it is what converts a
│   │                      small delta into a fork that can never take an upstream update.
│   │                      Local delta from upstream is **+50/−36** — much of it comment; the
│   │                      changes are: (d) `LOCAL PATCH (§17)` — the submenu opens on
│   │                      `onMouseEnter` instead of waiting for Radix's hardcoded 100ms
│   │                      SubTrigger timer, which has no prop. `open` is controlled here, so
│   │                      setting it directly beats the timer and the timer's own
│   │                      onOpenChange lands as a no-op; (a) resolving ReUI's build-time icon shim to lucide,
│   │                      which its own installer would have done; (b) `LOCAL PATCH (§17)` —
│   │                      the add-filter submenu falls back to finding a field's existing
│   │                      filter when the menu session has no id for it, since
│   │                      `sessionFilterIds` resets on every open and a REOPENED menu would
│   │                      otherwise show an unchecked, add-only submenu beside a chip that
│   │                      already holds values; (c) `LOCAL PATCH (§17)` — **`menuPopupClassName`
│   │                      now reaches every menu the component renders**, which upstream it
│   │                      does not: the sub-content hardcoded its class, and the operator
│   │                      dropdown (rendered deep inside a chip, not by `Filters`) had no route
│   │                      to one at all, so it is passed down the existing context. Without it
│   │                      those two popups keep stock shadcn styling while the other two follow
│   │                      the app. Re-apply all three after an upstream update.
│   │                      **Everything else is configured from FilterBar**, styling included:
│   │                      the menus take IssueCommandBox's look (`bg-surface`, 13px `text-lsm`,
│   │                      brand-tinted chosen row) through descendant selectors in one
│   │                      `MENU_STYLE` constant, not by editing the file's classes.
│   │                      Installed from the **radix-nova** style — `components.json`
│   │                      pins `@reui` to it, because the `{style}` placeholder silently fell
│   │                      back to `base-nova` and pulled in a `@base-ui/react` dependency the
│   │                      project (Radix everywhere) had no other use for.
│   │
│   ├── services/
│   │   ├── authService.ts    ✅
│   │   ├── issueService.ts   ✅ Firestore SDK + fetch(/api/createIssue)
│   │   ├── projectService.ts ✅ Firestore SDK (client CRUD; newId → no temp-id) · milestones ✅
│   │   │                        (dotted-path writes into the project doc's map field)
│   │   ├── cycleService.ts   ✅ Firestore SDK + fetch(/api/createCycle)
│   │   └── templateService.ts✅ Firestore SDK (client CRUD; newId → no temp-id) · the default
│   │                            swap is ONE writeBatch over the two affected docs
│   │
│   ├── store/
│   │   ├── authStore.ts          ✅
│   │   ├── issueStore.ts         ✅ optimistic CRUD + rollback (reference impl)
│   │   ├── createIssueDialogStore.ts ✅ create-modal open/minimize/maximize + draft (§10.5)
│   │   ├── projectStore.ts       ✅ optimistic CRUD + rollback · milestone actions ✅ (§12 —
│   │   │                            they live here because a milestone IS a project field)
│   │   ├── cycleStore.ts         ✅ optimistic CRUD + rollback (temp-id dance, like issues)
│   │   ├── createCycleDialogStore.ts ✅ cycle modal open/close + editingId (create AND edit)
│   │   ├── templateStore.ts      ✅ optimistic CRUD + rollback · setDefault (per TYPE, toggle) ·
│   │   │                            getDefaultTemplate(type) read imperatively by both dialogs
│   │   ├── createProjectDialogStore.ts ✅ open/close + prefill + templateId
│   │   └── viewPreferenceStore.ts✅ layout/groupBy/orderBy per viewId (IndexedDB)
│   │
│   ├── lib/
│   │   ├── firebase.ts       ✅
│   │   ├── validation.ts     ✅
│   │   ├── utils.ts (cn)     ✅
│   │   ├── idb.ts            ✅ idb-keyval get/set helpers
│   │   ├── issueFilters.ts   ★ the §17 predicate — pure, one pass, identity back when nothing
│   │   │                        is filtered; null projectId/cycleId travel as sentinels, since
│   │   │                        a URL param cannot carry null
│   │   ├── ordering.ts       ✅ generic fractional-index engine (issues + projects share it);
│   │   │                        appendOrder() for column-less lists (milestones)
│   │   ├── issueOrdering.ts  ✅ issue-typed wrappers: drop → {status, sortOrder} patches
│   │   ├── progress.ts       ✅ derived done/total/pct for project · milestone · cycle
│   │   ├── statusStamps.ts   ★ status transition → startedAt/completedAt patch (§4);
│   │   │                        BOTH updateStatus and updateIssue route through it
│   │   ├── templateForm.ts   ✅ dirty-check fingerprints for the two template page forms
│   │   │                        (trimmed the way saving trims, so no phantom "unsaved")
│   │   └── broadcastChannel.ts ✅ channel + broadcastDelta()/subscribeToBroadcast();
│   │                            the delta is a PER-ENTITY discriminated union (§16) —
│   │                            CREATE carries a full doc, UPDATE a partial patch —
│   │                            with a required workspaceId, since one origin-wide
│   │                            channel serves workspace-scoped caches
│   │
│   ├── hooks/
│   │   ├── useEntitySync.ts  ✅ generic idb-read + onSnapshot + idb-writeback (the engine)
│   │   ├── useBroadcastSync.ts ✅ the RECEIVE half of tab-sync (§16) — one subscription,
│   │   │                        workspace-filtered, routed to each store's applyBroadcast
│   │   │                        (store only: no idb write-back, no re-broadcast, no service)
│   │   ├── useIssues.ts ✅ · useProjects.ts ✅ · useCycles.ts ✅ · useTemplates.ts ✅ wrappers
│   │   ├── useTemplateSelectors.ts ✅ list-by-type / one / default
│   │   ├── useUnsavedGuard.ts ✅ useBlocker + "discard changes?" for PAGE forms (§9F)
│   │   ├── useCycleSelectors.ts ✅ rows / board-groups / one / list / issues / progress
│   │   ├── useOpenCycle.ts ✅
│   │   ├── useProjectSelectors.ts ✅ useProjectList/useProject/useProjectIssues/useProjectProgress
│   │   ├── useOpenIssue.ts ✅ · useOpenProject.ts ✅ (host handlers for the view callbacks)
│   │   ├── useProjectMilestones.ts ✅ useProjectMilestoneList (manual order) + rows w/ progress
│   │   ├── useViewPreference.ts ✅ useLayout(viewId) → [layout, setLayout] (§15)
│   │   └── useIssueFilters.ts ★ the §17 URL codec — the ONE place search params are read or
│   │                            written; hands the vendored <Filters> its controlled array
│   │
│   └── mocks/{browser,handlers}.ts  ✅ (extend handlers)
│
├── api/                     ✅ TYPECHECKED as of 19 — `api/**/*.ts` joined tsconfig.node.json's
│   │                           include. Until then the four files that actually ship as
│   │                           functions were in NO project, so `tsc -b` never compiled them
│   │                           and a type error would have surfaced as a 500 in production.
│   ├── _firebase.ts          ✅ shared Admin SDK init (emulator branch — §15)
│   ├── _sequence.ts          ★ createWithSequence() — the transactional counter both
│   │                           server-created entities allocate from (§14.2, step 19)
│   ├── setWorkspaceClaims.ts ✅ idempotent as of 19 — creates the workspace doc only if
│   │                           absent, since logIn re-calls this to repair a half-failed signup
│   ├── createIssue.ts        ✅ verify token → sequential LIN-xxx → create in one transaction
│   └── createCycle.ts        ✅ verify token → sequential number → create in one transaction
│
├── test/
│   └── firestore.rules.test.mjs ★ 56 cases, node --test + @firebase/rules-unit-testing.
│                               Asserts BOTH directions: every write the app makes still
│                               succeeds, and every §14.2 hole is closed. Also the place
│                               §12's map-field claims are finally proven (siblings
│                               untouched by a dotted write). `npm run test:rules`.
│
├── firestore.rules          ✅ workspace gate (7/11/13/14) + FIELD-LEVEL validation (18):
│                               per-collection mutable allow-lists, validated creates,
│                               server-stamped timestamps, enums, template data↔type
├── firestore.indexes.json   ✅ deliberately EMPTY — the app runs no compound query to
│                               serve (§8, step 18); the file carries the reasoning
├── firebase.test.json       ★ emulator config for `npm run test:rules` ONLY — port 8085,
│                               so the suite's clearFirestore() can never wipe the dev
│                               emulator you have running on 8080
├── firebase.json  .firebaserc  vercel.json  vite.config.ts  tsconfig*.json  .env.local
├── eslint.config.js         ✅ clean as of 18 — vendored ui/ + reui/ exempted (§2), not edited
```

---

## 3. Routing & Navigation Flow

```
/                         Landing (public placeholder)
/signup /login            AuthRoute guard → redirect to /app/issues if authed
/app                      ProtectedRoute guard → WorkspaceLayout (shell never remounts)
  ├── /app  (index)       → redirect /app/issues
  ├── issues              IssuesPage           handle:{sidebarKey:'issues'}
  ├── issues/:identifier/:slug?  IssuesPage    detail OVER list, URL deep-link (slug cosmetic)
  ├── projects            ProjectsPage         handle:{sidebarKey:'projects'}       ✅
  ├── projects/:id/:slug? ProjectDetail        Overview + Issues tabs (local state) ✅
  ├── cycles              Cycles               handle:{sidebarKey:'cycles'}         ✅
  ├── cycles/current      CycleQuickView       the running cycle's issues            ✅
  ├── cycles/upcoming     CycleQuickView       the next scheduled cycle's issues     ✅
  ├── cycles/:id/:slug?   CycleDetail          the cycle's ISSUES (no metadata form) ✅
  └── templates           handle:{sidebarKey:'templates'} on the PARENT              ✅
      ├── (index)         → redirect /app/templates/issues
      ├── :type           TemplatesPage        the manager for that type             ✅
      ├── :type/new       TemplateFormPage     create                                ✅
      └── :type/:id       TemplateFormPage     edit — same page, other mode          ✅
*                         NotFound
```

**Templates are top-level, not under `settings/`** (decided 2026-08-16): they earn a sidebar entry of
their own, so `/app/settings/templates` from the original plan is gone. `:type` stays in the SAME
position across all three routes, which is what lets one `isTemplateTypeSlug` check serve every page
and makes create/edit two modes of one component. Static `new` outranks dynamic `:id` in React
Router's ranking, and a 20-char Firestore auto-id can never be the literal string `new`. `handle` sits
on the parent — `useSidebarKey` does `findLast` over all matches, so the children inherit it.

**URL vs storage rule (unchanged):** layout (`list` | `board`) lives in **IndexedDB, never the URL**.
Its key is a `viewId`, and the ids are minted beside their entity's selectors: `ISSUES_VIEW_ID`
(`useIssues`), `PROJECTS_VIEW_ID`/`projectIssuesViewId` (`useProjectSelectors`),
`CYCLES_VIEW_ID`/`cycleIssuesViewId` (`useCycleSelectors`). **The quick views key by SLUG**
(`cycle:current:issues`) while `/cycles/:id` keys by id — "current" resolves to a different cycle
every sprint, and the layout a user picked belongs to the surface they picked it on, not to whichever
cycle happens to be running (decided 2026-08-18).
Only **filters** live in the URL for shareability, parsed via `useSearchParams` in
`hooks/useIssueFilters.ts` — the ONE place that reads or writes them (§17):
`/app/issues?status=todo,in_progress&priority=high&project=<id>&cycle=<id>`. The grammar is flat and
multi-value: one param per facet, comma-separated, **no operators** — every field is pinned to
"is any of", so negation would need a widened contract rather than a new value. Unknown values are
dropped on parse, so a stale or hand-edited URL degrades to a wider list instead of crashing a chip.
A present-but-empty param (`?status=`) is a chip the user has added but not yet filled — distinct
from an absent one, which is no chip at all. Writes use `replace: true`, so toggling a chip does not
stack history entries. **`assignee=me` is NOT implemented** — no member entity exists to resolve it
against (§10.8's standing gap).
Keep the existing `lazy: () => import()` + `handle.sidebarKey` conventions for every new route.

---

## 4. Firebase Data Model

Everything under one workspace (no Teams entity yet — the workspace *is* the team). New fields ★.

```
workspaces/{workspaceId}/
├── issues/{issueId}
│     identifier   'LIN-123'            ← server-generated (Vercel Fn)
│     title, description
│     status       backlog|todo|in_progress|done|cancelled
│     priority     urgent|high|medium|low|no_priority
│     assigneeId   string|null
│     labelIds     string[]
│     projectId    string|null   ★     ← issue belongs to a project
│     milestoneId  string|null   ★     ← issue belongs to a project milestone
│     cycleId      string|null   ★     ← issue scoped into a cycle
│     sortOrder    number?             ← manual position in list/board group (fractional
│                                        indexing; absent → createdAt-millis fallback,
│                                        engine in lib/ordering.ts, issue wrappers in
│                                        lib/issueOrdering.ts)
│     startedAt    Timestamp|null ★    ← FIRST transition into in_progress OR done
│     completedAt  Timestamp|null ★    ← transition into done; cleared if reopened
│     createdAt, updatedAt, createdBy
│
├── projects/{projectId}                ★
│     name (req), description, icon, color
│     status       backlog|planned|in_progress|completed|cancelled
│     priority     urgent|high|medium|low|no_priority   ← SAME scale as issues
│                                        (ProjectPriority aliases IssuePriority,
│                                         so PRIORITY_MAP is shared, not copied)
│     leadId       string|null
│     memberIds    string[]
│     startDate, targetDate  Timestamp|null
│     sortOrder    number?      ★     ← manual position in a BOARD column; same
│                                        fractional indexing as issues, same shared
│                                        engine (lib/ordering.ts). The table sorts by
│                                        column, so it only reads this under 'manual'.
│     milestones   map<id, Milestone>?  ★  ← NOT a subcollection (see below)
│                    { id, name (req), description, targetDate|null,
│                      sortOrder, createdAt, updatedAt }
│     createdAt, updatedAt, createdBy
│
├── cycles/{cycleId}                    ★
│     number       int (server-sequential) → displayed "Cycle N"
│     name, goal   string|null
│     startDate, endDate  Timestamp (req)
│     — status is DERIVED client-side (upcoming|active|completed), NOT stored
│     createdAt, updatedAt, createdBy
│
└── templates/{templateId}              ★  (ISSUE and PROJECT templates — one collection)
      name (req), description, icon, color
      isDefault    boolean             ← at most one per TYPE (see below)
      type         'issue' | 'project' ← discriminates `data`
      data — when type==='issue':   { title, description, status, priority, projectId }
             when type==='project': { name, description, content, status, priority,
                                      milestones: {name, description}[] }
      createdAt, updatedAt, createdBy
```

**Templates: one collection, a discriminated union (2026-08-16 — widens the original "issue templates
only" scope).** `Template = WithPayload<TemplateBase>` in `types/template.ts`, so `t.type === 'issue'`
narrows `t.data` and no call site casts. Two collections would have meant a second sync engine, store,
cache key, hook and rules block for a read we never perform — the same trade §4 already made for
milestones. Consequences, all deliberate:
- **`icon`/`color` live on the TEMPLATE, not in the project payload.** For a project template they do
  double duty: the project created from it inherits them, so there is no second glyph to keep in sync
  (`{ ...template.data, icon: template.icon, color: template.color }`). For an issue template they are
  presentation only — issues have no icon, and nothing is stamped onto the created issue.
- **`isDefault` is scoped per type and is a TOGGLE.** One default issue template and one default
  project template coexist; promoting one demotes only its own type's incumbent, in a single
  `writeBatch` over the two documents. Clicking Default on the current default clears it — zero
  defaults is the state a fresh workspace is already in, so no surface has to special-case it.
- **No dates anywhere in a template.** A template is a *shape*, not a schedule: a stored absolute
  `targetDate` is stale the day after it is saved. Project-template milestones therefore carry a name
  and description only, and the created project's own start/target come from the modal.
- **No `labelIds`/`assigneeId`** on the issue payload — no label or member entity exists to point at,
  the same gap the issue row and the projects table still carry.
- **Nothing links an issue or project back to the template it came from.** A template is applied at
  create time and forgotten; `templateId` lives in the create-dialog draft, never on the document.

**Progress bars** (project, milestone, cycle) are computed client-side: count issues matching
`projectId`/`milestoneId`/`cycleId` with `status==='done'` against everything **in scope**. No stored
counters. **Cancelled issues are out of scope entirely (2026-08-10)** — they count toward neither
`done` nor `total`, so abandoning an issue can't permanently cap a project below 100% (4 done + 1
cancelled used to read 80% forever). Both counting loops in `lib/progress.ts` share one `inScope`
predicate so the rule can't drift between them. Consequence: `progress.total` means "issues in scope",
which is what the table's issue-count column, the board card's `N issues` and the milestone rows all
display.

**`startedAt` / `completedAt` — the ONE deliberate exception to derive-everything (2026-08-10).**
This model stores no history: progress has no counters, cycle status is computed from dates, milestone
progress is a client-side pass. These two fields are the only stored facts *about the past*, and they
exist because history is the one thing that cannot be reconstructed later — `updatedAt` is
last-write-wins, so an issue that went `todo → in_progress → done` leaves a single timestamp and its
start is gone forever. Every day the app runs without them is a day of history that can never be
backfilled, which is why they land in **step 13** even though their first consumer (the cycle burn-up
chart, §12) is deferred.
- `startedAt` is set by a move into `done` as well as `in_progress` — an issue filed straight to done
  was still started, and this keeps *completed ⊆ started* so the two curves can never cross.
- `startedAt` is **never cleared**. Moving back to `todo` does not un-start history; clearing it would
  let a cumulative "started" count *decrease*, which a burn-up must never do.
- `completedAt` **is** cleared on reopen, because "is it done right now" is a live question, not a
  historical one.
- Both are stamped by ONE helper, `lib/statusStamps.ts`, applied *before* the optimistic `set()` so
  store / IndexedDB / broadcast / Firestore all carry the same values and the rollback snapshot
  matches. `updateStatus` **and** `updateIssue` both route through it — `updateIssue` spreads an
  arbitrary patch that can contain `status`, so stamping in only one of the two would silently miss
  every edit made from the detail view.
- **This is the boundary, not a precedent.** `addedToCycleAt` / `movedToProjectAt` and friends are the
  start of an activity log, which §12 does not build. Anything beyond these two needs that decision
  reopened, not another field.

**Milestones are a MAP FIELD, not a subcollection (decided 2026-08-10 — supersedes the original
`projects/{id}/milestones` design).** They are 3–10 tiny rows per project that are only ever read in
the context of their project, and there is no cross-project milestone view in scope. A subcollection
would have bought a second sync engine (`useEntitySync` takes one collection path — milestones are N
of them, so it needed either a collection-group query plus a denormalized `workspaceId` or a
per-project subscription that breaks the "hydrate once in the shell" rule), plus its own store, cache
key, hook and rules block — none of which serves a read we perform.

The usual objection to embedding is the whole-array clobber: Firestore can't partially update an
array, so renaming one milestone rewrites all of them, last-write-wins. **A map keyed by id does not
have that problem** — dotted field paths (`milestones.<id>.name`, and `deleteField()` at
`milestones.<id>`) are genuine partial writes, so touching Alpha never rewrites Beta. What we keep
from the subcollection design is per-milestone write granularity; what we drop is the second entity
pipeline. Consequences, all deliberate:
- Milestones ride the **projects** sync/cache/rollback — `useProjects()` already carries them, so
  they're in the store at boot with no extra subscription and no spinner on project open.
- Their CRUD lives on `projectStore` (`createMilestone`/`updateMilestone`/`deleteMilestone`), which
  settles the old `projectStore`-vs-`milestoneStore` ambiguity between §2 and the hook's TODO.
- Milestone `createdAt`/`updatedAt` are **client-stamped** (`Timestamp.now()`); the project's own
  `updatedAt` is server-stamped on every milestone write. Nothing sorts on the milestone stamps —
  ordering is `sortOrder` — and this keeps `FieldValue` sentinels out of the `Milestone` type.
- Map keys become path segments, so a milestone id must never contain `.` (`crypto.randomUUID()`).
- **One-way door:** no cross-project milestone query is possible, and moving to a subcollection later
  would be a data migration rather than a refactor. Accepted for the locked single-user scope; the
  thing that would reverse it is multi-user editing or a global milestone view entering scope.

---

## 5. Entry Point — Theme + MSW (unchanged, already ✅)

```tsx
// src/main.tsx  — sync theme BEFORE React renders to avoid flash
const saved = localStorage.getItem('theme')
const preferred = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
document.documentElement.setAttribute('data-theme', saved ?? preferred)

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}
enableMocking().then(() => createRoot(root).render(<StrictMode><RouterProvider .../></StrictMode>))
```

---

## 6. Data Layer (the core architecture — generalized to ALL entities)

**Why this matters:** this three-layer pipeline is what makes the app feel instant and stay in sync
across tabs/devices. Built once for issues, then projects/cycles/templates are near-copies. It replaces
any server-action/round-trip model: the client SDK talks to Firestore directly; the only server hops
are the two sequential-ID generators.

### Layer 1 — Instant reads (boot sequence)
```
WorkspaceLayout mounts → useIssues()/useProjects()/useCycles()/useTemplates():
  1. Read from IndexedDB → populate Zustand   (0–5ms, no spinner)
  2. Firestore onSnapshot subscribes → merge deltas into store   (100–300ms)
  3. Store writes back to IndexedDB after each snapshot
```

Generalized into one hook so we don't copy it four times:
```ts
// hooks/useEntitySync.ts
export function useEntitySync(collectionPath: string, cacheKey: string,
  { setAll, applyDelta, selectAll }: SyncBinding) {
  const { user } = useAuthStore()
  useEffect(() => {
    if (!user) return
    idb.get(cacheKey).then(cached => cached && setAll(cached))          // instant
    const unsub = onSnapshot(collection(db, collectionPath), snap => {
      snap.docChanges().forEach(c =>
        applyDelta({ type: c.type, doc: { id: c.doc.id, ...c.doc.data() } }))
      idb.set(cacheKey, selectAll())                                    // write-back
    })
    return unsub
  }, [user?.workspaceId])
}
// useIssues = useEntitySync(`workspaces/${ws}/issues`, `issues:${ws}`, issueBinding)
// useProjects/useCycles/useTemplates identical with their own path/key/binding
```

### Layer 2 — Optimistic writes (with rollback)
Reference implementation (issues); every store mutation follows this shape. The store is built with
the **`zustand/middleware/immer`** middleware, so the `set(s => {…})` recipes mutate a draft directly
(no manual spreads); illustrative `produce()` calls below map 1:1 to those recipes. **Cache format:**
mutations persist `get().selectAll()` (an **array**) — the SAME shape `useEntitySync` writes back and
`setAll` reads — never the raw `issues` map, or the next boot's hydration breaks.
```ts
// store/issueStore.ts  — create<IssueState>()(immer((set, get) => ({ … })))
updateStatus: async (id, status) => {
  const { user } = useAuthStore.getState(); if (!user) return
  const previous = get().issues[id]; if (!previous) return
  set(s => { s.issues[id].status = status })                       // 1. store   (0ms)
  await idb.set(cacheKey.issues(user.workspaceId), get().selectAll()) // 2. cache (array!)
  broadcastDelta({ entity:'issues', type:'UPDATE', id, payload:{ status } }) // 3. tabs (~1ms)
  try { await issueService.updateStatus(user.workspaceId, id, status) } // 4. Firestore
  catch { set(s => { s.issues[id] = previous }); /* re-persist */ toast.error('Failed to update') }
},
createIssue: async (data) => {                              // server-sequential create
  const { user } = useAuthStore.getState(); if (!user) return
  const tempId = `optimistic-${Date.now()}`
  set(s => { s.issues[tempId] = { ...data, id:tempId, identifier:'LIN-…', status:'backlog', …stamps } })
  try { await issueService.create(user.workspaceId, data)  // Vercel Fn → real LIN-xxx
        set(s => { delete s.issues[tempId] }) }             // onSnapshot delivers real doc
  catch { set(s => { delete s.issues[tempId] }); toast.error('Failed to create issue') }
},
```
Projects/templates create **client-side** with Firestore auto-ids — id is known immediately
via `doc()`, so no temp-id dance; still optimistic + rollback. Only issues & cycles use the temp-id
pattern because their id/number is server-generated. **Milestones have no pipeline of their own at
all** — they are a map field on the project doc (§4), so they ride the projects sync, cache, rollback
and broadcast; their store actions live on `projectStore` and write through `updateDoc` on the parent. **Create input** is a `CreateIssueInput` (user
fields only); `identifier`/`id`/timestamps/`createdBy` are server-stamped — see §7.

### Full mutation pipeline
```
User action
  ├─→ Zustand store        (0ms)
  ├─→ IndexedDB            (0ms)
  ├─→ BroadcastChannel → other tabs (~1ms)   → useBroadcastSync → store.applyBroadcast
  └─→ Firestore client SDK (update/delete/create-project/create-milestone/create-template)
        OR  fetch('/api/createIssue')  / fetch('/api/createCycle')   ← sequential IDs
        └─→ onSnapshot fires on all sessions (100–300ms), reconciles temp → real
```

### Layer 3 — Cross-tab receive (§16)
`hooks/useBroadcastSync` is mounted once in `WorkspaceLayout` and is the only subscriber. It is a
**latency optimisation, not a correctness mechanism** — `onSnapshot` already syncs every tab in
100–300ms; this closes the gap to ~1ms. **The one case where it IS load-bearing is a FAILED write:**
a rejected mutation emits no snapshot event, so the rollback delta is the only thing that will ever
correct the peers. **Every rollback path therefore broadcasts**, and undoing a DELETE broadcasts a
CREATE (the peer dropped the row; there is nothing left to merge a patch into).

Three rules the receiver keeps, all for the same reason — the *originating* tab owns the write:
- **no `idb.set`** — IndexedDB is shared per-origin and the sender already persisted; re-writing
  from every receiver races N tabs on one key,
- **no re-broadcast** — that is the infinite loop,
- **no service call.**

`applyBroadcast` is a SEPARATE store action from `applyDelta`, because the two deltas are different
shapes: the snapshot delta always carries a full document, a broadcast `UPDATE` carries a partial
patch (CREATE assigns, UPDATE merges, an UPDATE for an unknown id is dropped rather than stubbed).
Milestones route to `projectStore.applyMilestoneBroadcast` — they have no store of their own, so
`delta.id` is a milestone id and every milestone payload, DELETE included, carries its `projectId`.

---

## 7. Services Layer

Firestore client SDK for everything; `fetch()` only for the two sequential-ID creates (reusing the
`authService` Bearer-token pattern).

```ts
// services/issueService.ts
export const issueService = {
  async create(ws, data) {
    const token = await auth.currentUser?.getIdToken()
    const res = await fetch('/api/createIssue', { method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ workspaceId: ws, ...data }) })
    if (!res.ok) throw new Error('Failed to create issue'); return res.json()
  },
  // NO updateStatus: since step 13 a status change also carries the history
  // stamps (§4), so it is not a single-field write. The STORE's updateStatus
  // delegates to updateIssue with the full patch; a second service entry point
  // would just be a way for the two to drift apart.
  updateIssue:  (ws,id,patch)  => updateDoc(doc(db,`workspaces/${ws}/issues/${id}`),{ ...patch, updatedAt:serverTimestamp() }),
  deleteIssue:  (ws,id)        => deleteDoc(doc(db,`workspaces/${ws}/issues/${id}`)),
}

// services/projectService.ts  — client-created, no server needed.
// NOTE: the shipped code uses newId() + setDoc (not addDoc) so the caller owns the
// id it already showed the user — that's what lets projectStore skip the temp-id dance.
export const projectService = {
  newId:  (ws)           => doc(collection(db,`workspaces/${ws}/projects`)).id,
  create: (ws,id,data)   => setDoc(doc(db,`workspaces/${ws}/projects/${id}`),{ ...data, createdAt:serverTimestamp(), updatedAt:serverTimestamp() }),
  update: (ws,id,patch)  => updateDoc(doc(db,`workspaces/${ws}/projects/${id}`),{ ...patch, updatedAt:serverTimestamp() }),
  remove: (ws,id)        => deleteDoc(doc(db,`workspaces/${ws}/projects/${id}`)),

  // Milestones are a map FIELD on the project doc (§4) — every write below is an
  // updateDoc on the parent, addressed by DOTTED PATH so one milestone changes
  // without rewriting its siblings. Each also bumps the project's own updatedAt.
  newMilestoneId:  ()             => crypto.randomUUID(),           // no '.' — it's a path segment
  createMilestone: (ws,pid,m)     => updateDoc(projectDoc(ws,pid),{ [`milestones.${m.id}`]: m, updatedAt:serverTimestamp() }),
  updateMilestone: (ws,pid,mid,p) => updateDoc(projectDoc(ws,pid),{ ...Object.fromEntries(Object.entries(p).map(([f,v]) => [`milestones.${mid}.${f}`, v])), updatedAt:serverTimestamp() }),
  removeMilestone: (ws,pid,mid)   => updateDoc(projectDoc(ws,pid),{ [`milestones.${mid}`]: deleteField(), updatedAt:serverTimestamp() }),
}

// services/cycleService.ts  — create via Vercel Fn (sequential number), rest client-side
export const cycleService = {
  async create(ws,data) { const t = await auth.currentUser?.getIdToken()
    const r = await fetch('/api/createCycle',{ method:'POST',
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${t}` },
      body: JSON.stringify({ workspaceId: ws, ...data }) })
    if (!r.ok) throw new Error('Failed to create cycle'); return r.json() },
  update: (ws,id,patch) => updateDoc(doc(db,`workspaces/${ws}/cycles/${id}`),{ ...patch, updatedAt:serverTimestamp() }),
  remove: (ws,id)       => deleteDoc(doc(db,`workspaces/${ws}/cycles/${id}`)),
}

// services/templateService.ts — pure client CRUD, newId + setDoc like projects.
// Every write that can PROMOTE a default goes through one batch helper, because
// promoting is really two writes (set this one, clear the incumbent) and they
// must not half-apply. `clearDefaultId` is the store's answer to "who holds the
// default for THIS type right now" — the service never queries for it.
export const templateService = {
  newId:  (ws)                        => doc(collection(db,`workspaces/${ws}/templates`)).id,
  create: (ws,id,data,clearDefaultId) => batch(set(id,{...data,...stamps}), clear(clearDefaultId)),
  update: (ws,id,input,clearDefaultId)=> batch(update(id,{...input,updatedAt}), clear(clearDefaultId)),
  remove: (ws,id)                     => deleteDoc(templateDoc(ws,id)),
  // nextId null → clear only; that IS the "remove as default" case.
  setDefault: (ws,nextId,prevId)      => batch(nextId && update(nextId,{isDefault:true}), clear(prevId)),
}
```

---

## 8. Vercel Functions & Security Rules

**Functions** — both reuse the firebase-admin init block already in `api/setWorkspaceClaims.ts`
(verify ID token → count existing docs → assign sequential id → `add()`):

```ts
// api/createIssue.ts (implement — currently empty)
const decoded = await getAuth().verifyIdToken(token)
const ref = getFirestore().collection(`workspaces/${workspaceId}/issues`)
const identifier = `LIN-${(await ref.count().get()).data().count + 1}`
const docRef = await ref.add({ ...data, identifier, createdBy: decoded.uid,
  createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() })
return res.json({ id: docRef.id, identifier })

// api/createCycle.ts (new — same shape)
const number = (await ref.count().get()).data().count + 1
const docRef = await ref.add({ ...data, number, createdBy: decoded.uid, ...timestamps })
return res.json({ id: docRef.id, number })
```

**MSW** (`src/mocks/handlers.ts`) — **now an EMPTY handler list** (build order 13). Both Fns are real
and run against the emulators through `vite/localApi.ts`, so mocking either one would only reintroduce
the §14.1 failure where nothing was ever written to Firestore. The file is kept as the place a
genuinely-not-yet-built endpoint would go.

**Firestore rules** — ✅ complete as of build order 18. **TWO layers**, and the second one is what
step 18 added; the file itself is the reference, this is the shape:

```
match /workspaces/{ws} {
  allow read: if inWorkspace(ws);        // token.get('workspaceId','') == ws — see below

  // Server-minted ids ⇒ create-blocked for clients; update is allow-listed.
  match /issues/{id}  { allow read, delete: if inWorkspace(ws);
                        allow create: if false;                        // Vercel Fn (LIN-N)
                        allow update: if inWorkspace(ws)
                          && changedKeys().hasOnly(issueMutable())     // no identifier/createdBy/createdAt
                          && touchedNow() && issueValid(request.resource.data); }
  match /cycles/{id}  { …same shape; `number` off cycleMutable(); endDate > startDate }

  // Client-created ⇒ create needs its own validation (hasAll+hasOnly an exact key
  // set, createdBy == request.auth.uid, createdAt == request.time).
  match /projects/{id}  { …; `milestones` IS on projectMutable() — see below }
  match /templates/{id} { …; `type` is OFF templateMutable() ⇒ immutable;
                             `data` validated against `type` }
}
```
Three things about this that are easy to get wrong, and are tested:
- **Immutability is by OMISSION.** Anything not on a collection's mutable list can't be added,
  changed or removed — including keys that don't exist yet.
- **`diff()` is a VALUE diff.** An unchanged resend is not an "affected key", which is why
  `templateService.update` may keep sending `type` while `type` stays immutable.
- **`milestones` must be on `projectMutable()`.** A dotted-path write reports the top-level key, so
  omitting it would deny every §12 milestone write at once.

Read the claim as `request.auth.token.get('workspaceId','')`, never `request.auth.token.workspaceId`:
on a token without the claim the bare access is a hard evaluation error that kills the Write stream
instead of denying one operation (§14.1).

**No composite indexes — decided in step 18, superseding the original line here.** This app performs
no compound queries: `useEntitySync` subscribes to whole collections and every by-project/-cycle/
-milestone/-filter read is an array pass over the store. There is not one `where()` in `src/`, so
there is nothing for an index to serve; `firestore.indexes.json` records that and the trigger to
revisit it.

Verify with `npm run test:rules` (56 cases, own emulator on 8085 — never the dev one on 8080, since
it clears data between tests). Deploy: `firebase deploy --only firestore:rules`.

---

## 9. Feature Deep-Dives (what to build, how, and why it matters)

### A. App shell (finish Step 3) — *the frame everything renders in*
**Why:** the shell (`WorkspaceLayout`) must never remount so navigation feels instant and store
subscriptions stay alive. **Build:** `SidebarNav.tsx` with Issues/Projects/Cycles/Settings `Link`s,
active state from `useMatches()` → `handle.sidebarKey`, styled with tokens (`text-muted` idle →
`text-brand`/active). Fill `Topbar.tsx`: breadcrumb/title ✅ and one `bg-brand` primary create action ✅.
**The filter chips did NOT land here either** — §17 (2026-08-19) put them in `common/ViewBar`
alongside the toggle, for the same two reasons: filters are per-surface state the Topbar has no
business tracking, and the Topbar is hidden on `/app/templates/*`. With that, the Topbar is **done**:
breadcrumb + create button, nothing else. The list⇄board toggle moved out to **step 15** and ✅ landed there —
but in `common/ViewBar`, a strip one row *below* the Topbar, not in the Topbar itself: a detail page's
`viewId` is param- and tab-dependent, so hoisting it would have made the Topbar track state it has no
business knowing.

### B. Issues — *the fundamental unit; reference implementation of the whole pipeline*
**Why:** every other feature reuses the issue views (`Accepts Issue[]`) and the store pattern.
**View contract (host-agnostic):** `IssueListView`/`IssueKanbanView` take `issues: Issue[]` **and an
optional `onOpenIssue(issue)` callback** — they report "open this issue" and never touch routing, so
Project/Cycle pages can reuse them with their own handler (or omit it to disable opening). The Issues
page passes `useOpenIssue()` → `navigate('/app/issues/:identifier/:slug')`. Two click-vs-drag guards
keep opening honest: rows/cards swallow the stray post-drop click dnd-kit fires via a `justDragged`
ref (set on drag-start, cleared a tick after drag-end), and in-row/in-card `IssueCommandBox` pickers
`stopPropagation` so a status/priority click never bubbles up to open the issue. The `onClick` lives on
the real row/card only, never the `DragOverlay` copy.
**Back-navigation (decided):** the **Topbar breadcrumb owns it** — the `Issues` crumb is a `Link` to
`/app/issues` that drops the `:identifier`, unmounting the detail overlay while the list stays mounted
underneath (scroll preserved). The detail view has no separate close/back button.
**Build:** `IssueListView` (grouped, status dots, priority icons, inline edit), `IssueKanbanView`
(dnd-kit columns + optimistic `updateStatus`), `IssueDetailView` (absolute overlay, URL deep-link at
`issues/:identifier/:slug?`, inline title/description edit — core ✅; framer-motion side-panel treatment +
selectors for project/milestone/cycle/assignee/labels/template deferred to future — fold into §11–§14),
`issueStore` + `useIssues`, `issueService` + `api/createIssue`.

### C. Projects — *coordinate work that spans many issues toward an outcome*
**Why:** Linear's core organizing unit above the issue; gives goal/lead/target-date + progress
visibility. A project also carries a **`priority`** on the same scale as issues (§4) — one vocabulary
across entities, so the pill, the map and the picker are shared code, not a parallel set.
**List view is a TABLE, not grouped accordions** (unlike the issue list): a sticky header row over
`ProjectListView`/`ProjectRow` with the columns we actually have data for — icon+name ·
**priority pill** · lead · target date · issue count · status glyph+%. Every header is a **sort button**
(`viewPreferenceStore.toggleSort(viewId, column)`); the comparator lives in `lib/projectSorting.ts`
(missing values always sort last, stable tie-break on `createdAt`), and rows come pre-paired with
their counts from `useProjectRows()`. **No Health column at all** — Linear derives health from project
updates, which §4 doesn't model, so there is nothing to render or sort; it is not stubbed either
(decided 2026-08-02). **Lead** stays a placeholder cell: `leadId` has no member entity to
resolve against (same gap as issue assignee avatars). The milestone chip beside the name is still
unbuilt, but no longer blocked — §12 put `project.milestones` on the row itself.

**Board view (added 2026-08-06):** projects get a **board too**, not only the table — one column per
`ProjectStatus` in `PROJECT_STATUSES` order, labels and glyphs from the shared `PROJECT_MAP`, cards
grouped by status and manually orderable inside a column exactly like the issue kanban. This is why
`Project` gained **`sortOrder`** (§4). The ordering engine is **shared, not copied**:
`lib/issueOrdering.ts` became issue-typed wrappers over a new generic `lib/ordering.ts`, and
`lib/projectOrdering.ts` is the project-typed set — `orderProjectRows(rows)` (manual order inside one
column, the counterpart to the table's `sortProjectRows(rows, orderBy, dir)`), `orderBetween(prev,
next)`, and `getDropPatch(active, overId, groups)`. **No `getDropAfterPatch` for projects**: that is
the issue *list's* line-indicator drag, and the projects list is a sorted table, so there is nothing
to drag there. These take groups of **`ProjectRow`**, not `Project` — the board renders rows exactly
like the table does, so the view hands back the same structure it holds instead of unwrapping at the
drop site. `useProjectBoardGroups()` supplies them: `Record<ProjectStatus, ProjectRow[]>`, every
status present (empty columns included), already grouped, already in manual order, each row still
carrying its derived `progress` — so a card renders its issue count without touching the issue store.
A drop is one optimistic write, `updateProject(id, {status, sortOrder})`, through the same pipeline
as the table. **Board order is always manual** — like the issue kanban it ignores the table's
`orderBy`, which stays a property of the list; that is what lets both views read the same
`viewId` preference without fighting over it. (The table's `orderBy: 'manual'` is no longer a dead
branch either — it now reads `sortOrder`, so a table left on manual mirrors the board's sequence.)

**The list⇄board switcher was NOT part of this step** — it shipped once, for issues, projects and
cycles together, in **step 15** ✅ (decided 2026-08-06, landed 2026-08-18). That prediction held for
the toggle: `viewPreferenceStore` already keyed `layout` per `viewId`, so the switch itself was pure
wiring. What was *not* free was the page shell — see §15's `ViewSurface` and the clipped-table bug it
fixed here.

**Build:** the table + the board above + `ProjectDetailPage` tabs — **Overview** (metadata + progress), **Issues** (reuses
`IssueListView`/`IssueKanbanView` filtered by `projectId`), **Milestones**. Issue detail panel gets a
project selector; `projectStore`/`projectService`/`useProjects`.

### D. Milestones — *stages inside a project (e.g. Alpha/Beta/GA)* ✅ (2026-08-10)
**Why:** Linear ties project progress to milestones; issues attach to a stage.
**Stored as a map field on the project document, not a subcollection** — the full rationale and its
consequences are in §4; the short version is that a keyed map gives per-milestone partial writes via
dotted field paths while costing zero new entity pipeline.
**Built:** `Milestone` + `CreateMilestoneInput` in `types/project.ts`; `Project.milestones?:
Record<string, Milestone>`; the four milestone functions on `projectService` (§7);
`createMilestone`/`updateMilestone`/`deleteMilestone` on **`projectStore`** — optimistic with
rollback that restores the milestones MAP only, so a failed milestone write can't revert an unrelated
project edit; `useProjectMilestoneList` (manual order) + `useProjectMilestones` (rows paired with
derived progress) in `hooks/useProjectMilestones.ts`; `lib/ordering.ts` gains **`appendOrder()`** for
column-less lists (a milestone has no status to move between, so it never needed the full `Orderable`
contract). `ProjectMilestoneList` rows are now fully editable — inline name/description via
`useCommitOnExit` (uncontrolled, one write per editing session), target date via `DatePillPicker`,
delete behind a `ConfirmDialog` that names the issue count it will orphan. Drafts commit to the store
and Enter opens the next row, so a run of milestones is typed in one pass. The create-project modal's
`MilestoneDraftList` **no longer discards its drafts** — they're written in the same `setDoc` as the
project, so there is no partial-create window.
**Issue↔milestone assignment:** `components/projects/MilestonePicker.tsx`, the `ProjectPicker` pattern
again (wraps `IssueCommandBox`, dynamic options, nullable via a `__no_milestone__` sentinel,
synthesized "Unknown milestone" so a stale id renders and can be cleared). It is scoped to the
issue's project and **only renders when one is set**; changing an issue's project **clears
`milestoneId` in the same optimistic write**, in both `IssueDetailView` and `CreateIssueModal`.
`milestoneId` joined the create **draft** in `createIssueDialogStore`, so it survives minimize⇄restore
like `projectId`. In `IssueDetailView` it is **nested under the project pill with a drawn elbow**
(a single `<span>` with `border-l`/`border-b`/`rounded-bl`, aligned to the project glyph's centre)
rather than being a fourth flat property, because a milestone only exists inside a project.
**Progress glyph:** `common/MilestoneProgressIcon` — a diamond filling in quarters,
`Math.min(4, Math.floor(pct / 25))`, so <25% is a faded outline and 100% is solid. The filled region
is ONE path per level rather than four triangles: quarters fill clockwise from the top, so it is
always a single contiguous wedge and no anti-aliasing seam runs through the glyph. Used by both the
milestone rows and the picker's options, which is why the picker reads `useProjectMilestones` (rows +
progress) instead of the bare list. Absences — "No milestone", "Unknown milestone", unsaved drafts —
keep a plain grey diamond, so nothing reads as a real milestone stalled at 0%.
**Deliberately NOT done:** deleting a milestone does **not** cascade `milestoneId := null` across
matching issues — the stale reference renders as "Unknown milestone" and is clearable, exactly like a
deleted project's `projectId` today. Cascades for both belong to one pass, not to this step.

### E. Cycles (manual MVP) — *time-boxed sprints to keep momentum* ✅ (2026-08-10)
**Why:** agile cadence; a committed scope with a progress bar focuses the team. **Build:**
`CyclesPage` as a **date-ordered timeline** (decided 2026-08-10): cycles newest-first down the page,
each row = glyph + name + derived-status badge + completion ring + scope count + a hover-revealed ⋯
menu, with a **left rail** carrying the cycle boundary dates — a 1px div and a marker pinned to each
row's **bottom border**, tinted `bg-brand` for the running cycle. Anchoring the marker to that border
is what makes a row's full height equal its own cycle's span; see §0 for the two geometries that
didn't work. No SVG needed for the rail. This is the same view §9E always
specced as "Active / Upcoming / Completed sections", just ordered by date with the rail instead of
grouped under headings, so it costs nothing extra to build it this way. Status derived by
`cycleStatusFromDates(start,end,now)` in `types/cycle.ts` (not stored). **Both views ship in step 13**
(decided 2026-08-06) — `CycleListView` plus a `CycleBoardView` whose columns are the three derived
statuses — with the list⇄board **switcher deferred to step 15** ✅ (landed 2026-08-18), same as
projects. One difference from
the project board: cycle cards are **not drag-orderable across columns**, because cycle status is
derived from `startDate`/`endDate` — a cross-column drop would have to rewrite the date range, which
is out of scope. So `Cycle` needs no `sortOrder` and the board is read-only in that axis.
**A cycle's page IS its issues (decided 2026-08-11).** `CycleDetail` renders the issue views filtered
by `cycleId` — nothing else. It carries **no metadata/edit form**: a cycle's own fields are edited in
the **create modal reopened in edit mode**, from a hover-revealed **⋯ menu on the row and the card**
(`CycleActionsMenu` → `openForEdit(id)`). One form, two modes, so create and edit can never drift apart
and no second surface competes for the same writes. This replaced an earlier `CycleOverview` detail
form, now deleted.
Consequences worth keeping straight: the date-range pickers **live in that modal**, and they remain
the only way a cycle changes column (which is precisely why the board has no drag); the ⋯ menu is also
where **delete** lives, since nothing else in the UI reached `deleteCycle`. Deleting does **not**
clear `cycleId` on the issues — same no-cascade rule as projects and milestones (§9D) — so the confirm
names the count it will orphan. Assign issues via `CyclePicker`.
`cycleStore`/`cycleService` + `api/createCycle` for the sequential number.
**End-of-day boundary:** a cycle's `endDate` is stored at 23:59:59.999 of the chosen day, so it stays
`active` through its final date instead of completing at that morning's midnight.
**Also in this step: `startedAt`/`completedAt` on Issue** (§4) + `lib/statusStamps.ts`. They are here
purely because history cannot be backfilled — see §4. Nothing in step 13 reads them; the burn-up chart
that does is deferred (§12).
**Explicitly deferred:** auto-repeating schedule, cooldown, auto-rollover of incomplete issues, and
the per-cycle **burn-up chart** (§12).
**Not buildable at all today — needs data §4 doesn't model:** the "N% of capacity" ring Linear shows
per cycle. It needs per-issue estimates AND a team capacity number, i.e. an estimate field plus the
member entity that `assigneeId`/`leadId` are still waiting on. The ring in our rows is plain
completion (`cycleProgress` → done/scope), which is the same number the "N% success" on a finished
cycle shows. Do not stub a capacity ring.

### F. Templates — *file issues and spin up projects fast, with consistent structure*
**Why:** enforces repeatable fields; a workspace default speeds the common case. **Scope widened
2026-08-16 to ISSUE *and* PROJECT templates** — one collection, one union, one pipeline (§4).

**Surface:** `/app/templates/:type` (§3), reached from the sidebar's nested Templates group.
`TemplatesPage` → `TemplateManager` lists that type's templates, each row showing icon, name,
description and a **Default** badge, with `TemplateActionsMenu` (⋯) carrying *New issue/project from
this template · Edit · Set/Remove as default · Delete-behind-confirm*. The row itself is a stretched
`<Link>` overlay so its whole area opens the editor while the menu stays clickable above it.

**Pages, not modals (decided 2026-08-16).** The other three create surfaces are dialogs because they
interrupt whatever you were doing; templates are a settings surface you navigate *to*, so there is
nothing to overlay. `templates/:type/new` and `templates/:type/:id` are the same page in two modes,
seeded by `key={template.id}` — a remount rather than a re-seed effect. Two consequences the modal
version got for free and this one has to build: the **Topbar is hidden** on these routes (the pages own
their header, `+` and back link — which also costs them `CustomTrigger`, so no sidebar pin button), and
the **discard guard moves to the router** (`hooks/useUnsavedGuard`, `useBlocker`) because a page has
four ways out — Cancel, back link, sidebar, browser Back — where a dialog had one.

**Shared vs split.** Only the form BODY splits: `TemplateIssue` / `TemplateProject`. The manager, the
row, the actions menu and the picker all take `type` as a prop, because name/description/icon/colour/
`isDefault` live on the shared base and only `data` differs. (The two bodies do each carry their own
header and footer — ~40 duplicated lines, accepted over threading a dozen props through a shell.)

**Applying — the user's typing always wins.** `TemplatePicker` sits in the HEADER of
`CreateIssueModal` and `CreateProjectModal`, not among the option pills, because applying a template
rebuilds the whole draft rather than editing one field. A field is the template's to fill when it
still holds the **blank** draft's value *or* the value the **previous** template put there; anything
else was typed by hand and survives. Swapping templates therefore replaces the old one's contribution
and nothing more. Precedence is `prefill` > explicit `templateId` > the type's default template. A
swap that changes `projectId` clears `milestoneId` — a milestone belongs to exactly one project.

`templateStore` / `templateService` / `useTemplates` / `useTemplateSelectors`, stored in
`workspaces/{ws}/templates`.

---

## 10. Revised Build Order (each step independently shippable; new ★)

1. ✅ Firebase setup
2. ✅ Auth flow + guards
3. ✅ **App shell (closed 2026-08-19)** — sidebar nav ✅ (links are DATA in `SideContent`, rendered by
   `StaggerAccordion`; no `SidebarNav.tsx` was ever built), `Topbar` breadcrumb ✅ (owns
   back-navigation) + create btn ✅, active state ✅. The two pieces this step deferred both landed
   elsewhere and NEITHER in the Topbar: view toggle → step 15 ✅, filter chips → step 17 ✅, both in
   `common/ViewBar` one row below (§9A)
4. ✅ **Shared foundation** — `types/*`, `lib/idb.ts`, `lib/broadcastChannel.ts`,
   `hooks/useEntitySync.ts`, `viewPreferenceStore`
5. ✅ **Issue store + `useIssues`** — optimistic CRUD w/ rollback (reference impl); immer middleware,
   array-cache via `selectAll()`, `issueService` + `CreateIssueInput` (Vercel Fn/rules still §7)
6. ✅ **MSW handlers** — `createIssue` (+ `createCycle` mock). *Both retired since: `createIssue` in
   §15, `createCycle` in step 13. The handler list is empty now and every `/api/*` call hits the real
   function.*
7. ✅ **`api/createIssue`** — Vercel Fn (verify token → `LIN-N` → `add()`) + issue rules
   (client create-blocked); `issueService` already built in step 5
8. ✅ **Issue List view** — grouped-by-status sections (header + real count, empty groups hidden), status
   dots, priority icons, inline status/priority edit wired to the optimistic store. **Row target = full
   Linear row** (avatar · labels · date · sub-issue count) but only renders what data exists today:
   identifier/title/status/priority/relative-date. Deferred as no data model yet: assignee **avatars**
   (only `assigneeId` — no member entity until §11 Projects), **label pills** (no labels entity in §4;
   `labelIds` is bare `string[]`), **sub-issue count** (no parent/child field). Explicitly NOT here:
   filter pills (All/Active/Backlog → §17), group-header `+` create (→ §14), row-select checkbox
   (unscoped). Row→detail navigation now wired in §10 ✅ (host-agnostic `onOpenIssue`).
9. ✅ **Issue Kanban view** — dnd-kit sortable columns + DragOverlay; ephemeral `onDragOver` groups
   for cross-column; fractional `sortOrder` reordering in BOTH views (list = indicator-line
   pattern, header = top-of-group); `lib/issueOrdering.ts` helpers
10. ✅ **Issue detail (core)** — `IssueDetailView` absolute overlay + URL deep-link (`:identifier/:slug?`) +
    inline title/description edit (auto-growing fields) ✅; host-agnostic `onOpenIssue` click-to-open
    from list/kanban ✅; breadcrumb owns back-nav ✅. **Deferred to future (not now):** framer-motion
    side-panel treatment + entity selectors (project/milestone/cycle/assignee/labels/template) — the
    selectors fold into steps 11–14 as those entities land; the side-panel treatment is a later polish item.

    **10.5** ✅ **Create-issue modal** — ONE global `CreateIssueDialog` (`components/modals/`) mounted
    in `WorkspaceLayout`, opened via the `store/createIssueDialogStore` UI store:
    `openWith(prefill?: Partial<CreateIssueInput>)` — trigger-agnostic. Primary trigger = sidebar-header
    create button (`SideHeader`); later triggers reuse the same call: group-header/column `+` (prefill
    `status`), project/cycle pages (prefill `projectId`/`cycleId`), keyboard `C`, command palette.
    `CreateIssueModal` fields: title + description (`AutoGrowTextarea`; Enter creates, Cmd/Ctrl+Enter
    from description), status/priority via `IssueCommandBox` → `issueStore.createIssue`. The pipeline
    (store → service → MSW/`api/createIssue`) is live since steps 5–7 — this is UI only; remaining
    `CreateIssueInput` refs pass `null`/`[]`. **Extras built beyond scope:** draft + prefill held in the
    store so they survive the Radix remount on minimize⇄restore; minimize-to-corner bar
    (`CreateIssueMinimizedBar`), maximize toggle, "Create more". Entity selectors slot in with steps
    11–13 (Assignee/Project pills are static placeholders today); `TemplatePicker` + template-default
    merges into `prefill` with step 14. **Remaining cleanup:** `MOCK_ISSUES` fallback in
    `IssuesPage` (`Issues.tsx`) not yet removed — harmless, only renders at zero real issues.
11. ✅ **Projects** — store/service/hook ✅ + project rules ✅ + derived progress ✅
    (`lib/progress.ts`, `hooks/useProjectSelectors.ts`) + **`priority` on projects** ✅ (shared
    `IssuePriority` scale / `PRIORITY_MAP`, §4) + `CreateProjectModal` ✅ + the **projects table** ✅
    (`ProjectListView` + sortable sticky header) + the **board data layer** ✅ (`sortOrder` on
    `Project`, generic `lib/ordering.ts`, `lib/projectOrdering.ts`, `useProjectBoardGroups()`);
    + the **board UI** ✅ (`kanban-view/{ProjectKanbanView,ProjectKanbanColumn,ProjectCard}`, dnd-kit
    reorder + cross-column drop → `updateProject({status,sortOrder})`, column `+` prefills the status)
    + the **`projects/:id/:slug?` route** ✅, **ProjectDetail + Overview + `ProgressBar`** ✅,
    `useOpenProject` ✅, the **Topbar project crumb** ✅ and the **project selector on issues** ✅
    (`ProjectPicker` in `IssueDetailView` + `CreateIssueModal`; `projectId` now part of the create
    draft) + the **detail's Issues tab** ✅ (`detail/ProjectIssues` — both layouts, prefilled create,
    layout under `project:<id>:issues`; `ProjectDetail` switches tabs off local state behind a
    temporary strip). **Deferred out:** the shared tab strip + the list⇄board switcher → step 15.
    Everything else in this step is done.
12. ✅ **Milestones** — **map-field CRUD, not subcollection** (§4 carries the decision): dotted-path
    writes on the project doc give per-milestone granularity with no second entity pipeline. Milestone
    actions on `projectStore`, `appendOrder()` in `lib/ordering.ts`, `useProjectMilestones` un-stubbed,
    editable `ProjectMilestoneList` (inline name/description, date pill, confirm-delete) + committing
    drafts, `CreateProjectModal` drafts written in the project's own `setDoc`, `MilestonePicker` in
    `IssueDetailView` + `CreateIssueModal` with `milestoneId` in the create draft and cleared whenever
    the project changes. Progress reused `progressByKey(issues,'milestoneId')` as-is. No rules change.
    Plus the glyph/hierarchy pass: `common/MilestoneProgressIcon` (diamond filling in quarters, used
    by both the rows and the picker's options) and the elbow that nests the milestone pill under the
    project pill in `IssueDetailView`.
    **Not done on purpose:** no `milestoneId` cascade on delete, no milestone chip on cards/rows, no
    drag-reorder of milestones. **Still unverified at runtime** — the dotted-path map writes have not
    been run against the emulator.
13. ✅ **Cycles** — store/service + `api/createCycle`, CyclesPage + CycleDetail, derived status,
    **both `CycleListView` and `CycleBoardView`** (no switcher → step 15; no cross-column drag, since
    cycle status is derived from dates), issue↔cycle assignment, progress; cycle rules.
    `CycleListView` is the **date-ordered timeline with a left date rail** (§9E), not grouped headings.
    **Plus `startedAt`/`completedAt` on Issue + `lib/statusStamps.ts`** (§4) — two nullable fields and
    one helper, carried here ONLY because history is unbackfillable. No step-13 feature reads them.
    The burn-up chart they enable was deliberately NOT built: it is deferred (§12), and landing the
    fields is exactly what made deferring it free. Full detail in §0. MSW's handler list is now empty.
14. ✅ **Templates — issue AND project** (scope widened from "issue templates only"): one
    `templates` collection with a **type-discriminated union** (§4), so store/service/hook/rules are
    built once. `templateService` (client CRUD + the two-doc default `writeBatch`), `templateStore`
    (optimistic CRUD, per-type `setDefault`, both rows restored on rollback), `useTemplates` +
    `useTemplateSelectors`, `templates` rules block. UI is **pages, not modals**:
    `templates/:type` manager + `:type/new` | `:type/:id` form (§3), a nested non-collapsible
    **Templates group in the sidebar** (`NavGroup`/`NavChild`, children prefix-match the pathname),
    and `TemplatePicker` in both create modals with "typed input always wins" merge semantics.
    Plus `hooks/useUnsavedGuard` (router-level discard confirm for page forms).
    **Not done on purpose:** no dates in templates, no `labelIds`/`assigneeId`, no link from a created
    issue/project back to its template, no duplicate-template action.
    **Still unverified at runtime** — the default swap batch and the rules block have not been run
    against the emulator.
15. ✅ **View chrome — switcher + detail strips, all entities in one pass (2026-08-18)** — batching
    paid: every view was built ahead of it, so the chrome is one set of components rather than six.
    `hooks/useViewPreference` (`useLayout`) + `common/{ViewBar(+ViewTabs), ViewToggle, ViewSurface}`,
    wired into **six** surfaces: `Issues`, `Projects`, `Cycles`, `ProjectIssues` (the detail's tab),
    `CycleDetailView`, and the two **cycle quick views** — the sixth surface, which landed after this
    step was written. `DetailTabsTemp` deleted. Missing viewIds minted beside their selectors (§3).
    **The toggle was the easy half; the SHELL was the step.** `ViewSurface` now owns the vertical
    scroller for every switchable surface while each view keeps its own horizontal one — which fixed a
    live bug (`ProjectsPage`'s table was clipped, not scrollable, and its sticky header had no scroll
    container) and makes the §9C failure mode structurally impossible rather than a convention.
    **Decisions:** strip under the Topbar on every surface, not in it; quick views key layout by slug;
    **Milestones stay in Overview**, no third tab. `inert` hoisted to the whole Issues surface so an
    open detail overlay disables the board too, not just the list.
    **Cleanup carried here:** `__mockIssues.ts` deleted (both fallbacks — `Issues.tsx` and
    `IssueDetailView`), and the Issues page gained the empty state that fallback was hiding.
    **Not done:** scroll position is lost across a layout switch; an empty page shows no strip.
16. ✅ **BroadcastChannel — the RECEIVE half (2026-08-18)** — the sends were already wired by steps
    5/11/13/14; `subscribeToBroadcast` had no caller, so nothing listened. `hooks/useBroadcastSync`
    ★ (mounted in `WorkspaceLayout`, workspace-filtered, `switch` + `never` so a new entity can't
    go unrouted) + **`applyBroadcast` on all four stores** — a separate action from `applyDelta`
    because a broadcast UPDATE is a PARTIAL patch while the snapshot delta is a full doc — plus
    `applyMilestoneBroadcast` on `projectStore`, since milestones have no store of their own (§4).
    `BroadcastDelta` became a **per-entity discriminated union** (CREATE requires a full doc,
    UPDATE a partial) and gained a required **`workspaceId`**, because one origin-wide channel
    serves workspace-scoped caches. **The real fix: nine rollback paths never broadcast** — and a
    failed write emits no `onSnapshot`, so the rollback delta is the ONLY thing that can correct a
    peer tab. `templateStore` already did this and was the reference. Receiver writes the store
    only: no idb re-write (shared per-origin, the sender already wrote it), no re-broadcast, no
    service call. `viewPreferenceStore` deliberately does NOT sync. Full detail in §0.
17. ✅ **Filters (2026-08-19)** — status/priority/project/cycle over the issue surfaces, filtered
    **client-side**: every issue is already in the store via onSnapshot, so this is one array pass
    and touches no service, store, rule or index. `lib/issueFilters.ts` ★ (the predicate — returns
    the SAME array reference when nothing is filtered, so downstream memos hold),
    `hooks/useIssueFilters.ts` ★ (the URL codec), `common/FilterBar.tsx` ★ (the config),
    `common/NoFilterMatches.tsx` ★. Wired into **four** surfaces: Issues, the project detail's
    Issues tab, the cycle detail, and the two cycle quick views (which render through
    `CycleDetailView`, so they came free).
    **The chips are in `ViewBar`, NOT the Topbar** (decided 2026-08-19, superseding §9A and §10.3).
    Filters are per-surface exactly like layout is, so the argument §15 used for the view toggle
    applies unchanged — and the Topbar is hidden on `/app/templates/*` (§14), which a Topbar-hosted
    control could not survive.
    **The component is vendored, not written**: `components/reui/filters.tsx` (ReUI, ~2,150 lines) —
    see §2. It supplies the one thing `IssueCommandBox` structurally cannot, a **multi-select** with
    per-option icons, and it is **controlled**, so the URL stays the source of truth and the
    component is only an editor over state it does not own.
    **Operators are PINNED to `is_any_of`** — one entry in `field.operators` per field, so the chip's
    operator segment renders as a static label and §3's URL contract stays flat (`?status=todo,done`).
    Encoding operators (`?status=is_not_any_of:todo`) would widen §3 and turn the predicate into an
    expression evaluator; the machinery stays available for free if negation is ever wanted.
    **Three details that are load-bearing, not polish:**
    (a) **A present-but-empty param is a chip with no values yet** (`?status=`), distinct from an
    absent one. Without that distinction, adding a chip from the "+ Filter" menu writes nothing to
    the URL and the chip vanishes under the pointer on the next render.
    (b) **Chip ids are the FIELD NAME**, not `createFilter()`'s generated one. The array is rebuilt
    from the URL after every change, so a fresh random id would remount the chip and close its
    popover on each value the user picked.
    (c) **The `filter` memo keys on the param VALUES, not the `URLSearchParams` object** — react-router
    returns a new instance per render, which would rebuild every derived issue array on every
    unrelated re-render.
    **The add-filter menu keeps active facets LISTED (`allowMultiple`), which took three passes to
    get right.** Dropping them (the obvious reading of "one chip per field") had the menu item and
    its open submenu unmount on the FIRST ticked value — the item and the submenu are one node — so
    exactly one value could be picked per visit and the chip was the only way to add a second.
    Keeping them listed needs two supports: `setFilters` **unions** duplicate entries for a field
    rather than overwriting (the URL has one param per facet, so a second chip started by a
    reopened menu would otherwise drop the first chip's values, and the union self-heals into one
    chip on the next rebuild); and the vendored `LOCAL PATCH` (§2) so a reopened submenu resolves
    the field's existing chip instead of showing unchecked, add-only options. Ticking several
    values in one visit, accurate checkmarks, and un-ticking all work now; there is still exactly
    one chip per field.
    **Two empty states, and the emptiness check moved to the PRE-filter array.** `all.length === 0`
    keeps the old bar-less onboarding state; `all.length > 0 && filtered.length === 0` keeps the
    **`ViewBar` on screen** and renders `NoFilterMatches`. Hiding the bar there would have stranded
    the user with no way to undo the filter that emptied the page — the chips live in it.
    **Reordering is disabled while a filter is active.** Both views gained `sortable?: boolean`
    (default true) and the pages pass `!active`. It withholds the SENSOR (`useSensors(sortable ?
    pointer : null)` — one argument always, so the dep array keeps its length) rather than
    restructuring: rows/cards call `useSortable` unconditionally, they simply never receive a drag.
    A drop between two visible neighbours would otherwise write a `sortOrder` ignoring the hidden
    rows between them. This costs the BOARD more than the list — dragging is also how a card changes
    status, so with a filter on, the card's own picker becomes the only route.
    **Deliberately absent:** `assignee` — §3's example URL lists it, but there is still no member
    entity (the same gap as avatars and labels everywhere else), so the facet has no options to
    offer; and no filtering on the **Projects/Cycles** tables themselves — those filter entities, not
    issues, and would need their own predicate and facets. **Deep links are unaffected**:
    `IssueDetailView` resolves by identifier from the store, not from the filtered array, so an
    issue a filter excludes still opens.
    **Perf pass (2026-08-19), after the filter UI measured as laggy while the rest of the app did
    not.** The DevTools summary was the thing that cracked it: **Scripting 14.1s vs Rendering 0.7s
    and Painting 0.07s** over 30s. That ratio rules out layout thrash — two plausible-sounding
    theories died on it (a `scrollIntoView`-per-hovered-row reflow, and re-render breadth), and both
    speculative patches were reverted rather than left in earning nothing. `console.count` probes
    then showed the app side was already clean — **one** render of `IssuesPage`/`FilterBar` per
    selection, and the issue list not re-rendering at all — while hovering four rows cost 15 renders
    of the vendored component. Modest. So the cost was neither ours nor breadth: it was **deliberate
    latency**, ~250ms of it per menu visit, and removing it is what fixed the feel:
    - shadcn's menu content animates at tw-animate-css's 150ms default, and Radix's `Presence` waits
      for `animationend` before unmounting — so it is paid on the way OUT as well as in. Halved to
      75ms via `!animation-duration-75` in `MENU_STYLE` (config; the animation is kept, not removed).
    - Radix's `MenuSubTrigger` sits on a hardcoded 100ms timer with no prop to shorten it → the
      `LOCAL PATCH` in §2.
    **Two real fixes found while looking, both worth keeping on their own merit:** `FilterBar` used
    `useCycleRows()`, which subscribes to the whole ISSUE store and runs `progressByKey` over every
    issue — to render cycle *labels*. It shows no counts, so that bought nothing and rebuilt every
    field object plus a React element per project/cycle icon on EVERY issue mutation; now
    `useCycleList()`, with status derived from the cycle's own dates. And **pre-existing, unrelated
    to §17**: both issue views passed an inline `{activationConstraint:{distance:5}}` to dnd-kit's
    `useSensor`, which memoizes on `[sensor, options]` — so a fresh object each render meant
    `DndContext` tore down and rebuilt every sensor binding on every render of the list. Hoisted to
    a module constant in both views.
    **Known characteristic, not fixed:** the vendored component keeps the add-filter menu's
    `highlightedIndex` on its TOP-LEVEL component, so each hovered row re-renders every chip and
    every chip's value popover. Measured at 15 renders for four rows with one chip up — fine at this
    scale, and not reachable from outside; if it ever matters, the fix is to move that state down,
    which is a real fork rather than a patch.
    **Known gaps:** filters do not persist across navigation (they live in the URL, by §3's rule, and
    a fresh visit starts clean); the strip is still hidden entirely on a workspace with zero issues,
    so there is nothing to filter before the first one exists.
18. ✅ **Rules hardening + indexes (2026-08-19)** — `firestore.rules` grew a SECOND layer under
    the workspace gate: **field-level validation**. The hole it closes is §14.2's — every service
    spreads an arbitrary client patch into `updateDoc` (`{ ...patch, updatedAt: serverTimestamp() }`
    in all four), so any signed-in user could rewrite `identifier`, `createdBy`, `createdAt` or a
    cycle's `number`. Those are exactly the values create-blocking `issues`/`cycles` exists to
    protect, and **blocking create while leaving update open protected nothing**.
    **Protection by OMISSION, not by enumeration.** Each collection declares the fields a client may
    CHANGE (`issueMutable()` / `projectMutable()` / `cycleMutable()` / `templateMutable()`) and the
    rule is `changedKeys().hasOnly(…)`. Server-minted fields aren't listed, so they're immutable; a
    key that doesn't exist yet is denied too, which means a new field is a **deliberate** decision in
    this file rather than something that leaks in. The lists mirror `src/types/*.ts` — add a field
    there without adding it here and the write is denied at runtime.
    **`diff()` is a VALUE diff, and that is load-bearing.** A key rewritten with an identical value
    is not "affected". `templateService.update` resends the whole `CreateTemplateInput` including
    `type` on every save, yet `type` is deliberately OFF `templateMutable()` — so an unchanged resend
    passes and an actual type change is denied, which is what keeps §14's discriminated union honest
    (a template whose `type` no longer matches its `data` is unreadable by every narrowing call site).
    Both halves are tested; getting this backwards would have made the template form uneditable.
    **`milestones` MUST stay on `projectMutable()`.** A dotted-path write (`milestones.<id>.name`,
    `deleteField()` at `milestones.<id>`) reports the TOP-LEVEL key `milestones` in `affectedKeys()`,
    not the dotted path — so an allow-list that forgot it would have failed every §12 write at once.
    Rules can't iterate a map, so per-milestone shape is not validated: the trade the map-field design
    (§4) already accepted.
    **Creates are validated for the two client-created collections** (projects, templates — issues and
    cycles stay `create: if false`): `hasAll` + `hasOnly` an exact key set (rules have no set-equality
    operator), `createdBy == request.auth.uid`, and `createdAt == request.time`. A client can no
    longer file a document as someone else or backdate it.
    **Every write must stamp `updatedAt == request.time`**, which is what `serverTimestamp()` resolves
    to — a forged or stale stamp is denied, and so is a write that skips it. Plus enum checks against
    the same vocabularies `src/types` exports (an issue can't reach a project status), `endDate >
    startDate` on cycles (the invariant `api/createCycle` and the modal both enforce, now enforced
    where it can't be bypassed), and `data` validated **against its own `type`** so the union holds
    server-side, not just in TypeScript.
    **The step's real deliverable is `test/firestore.rules.test.mjs` — 56 cases, `npm run test:rules`.**
    Field-level rules fail closed, so the realistic way to break this app is a rule that denies its own
    UI; a create-project modal that silently rolls back is worse than the hole the step set out to fix.
    So the suite asserts BOTH directions and the payloads are copied from the services rather than
    invented: every write the app performs, and every attack §14.2 named. It runs on **its own
    emulator** (`firebase.test.json`, port 8085) because it calls `clearFirestore()` between tests and
    must never be pointed at the dev emulator on 8080 — `firebase emulators:start` can stay up while
    it runs. `@firebase/rules-unit-testing` is the one new devDep; the runner is node's built-in
    `node --test`, no vitest.
    **§12's outstanding risk is DISCHARGED here, not just rule-checked.** Three assertions read the
    document back with rules disabled and prove the map-field design does what §4 claims: renaming one
    milestone leaves `m1.sortOrder` and the whole of `m2` byte-identical and bumps the project's
    `updatedAt`; `deleteField()` leaves exactly `['m2']`; deleting the project takes its milestones
    with it. That is the "milestone map writes ⚠️" bullet in §13, closed with evidence.
    **Read this before debugging a denial: "evaluation error at L…" in the emulator log is NOT §14.1
    returning.** Firestore evaluates each rule TWICE — once in a pre-read pass where `resource` is
    undefined (so `changedKeys()`'s `diff(resource.data)` genuinely errors) and again with the
    document loaded, which is the pass that decides. Confirmed against the emulator's `ruleCoverage`
    report: every expression shows one evaluation with `resource` undefined and one with it defined.
    The `leaves the connection usable after a denial` test is what pins the difference — a denial stays
    a catchable per-operation failure and the next write on the same connection succeeds, which is the
    property the stores' rollback paths are built on.
    **Also already done, contrary to §14.2:** the `request.auth.token.get('workspaceId','')` form
    landed with the step-7 rules, not here. Only the field-validation item was outstanding.
    **Composite indexes: deliberately NONE, superseding §8.** That line assumed the app queries
    Firestore per project/cycle/milestone. It does not, by design — `useEntitySync` subscribes to each
    whole collection and every scoped read is an array pass over the store. **There is not one
    `where()` / `query()` / `orderBy()` call in `src/`.** Composite indexes serve compound QUERIES;
    with no query there is nothing to serve, and Firestore maintains single-field indexes on its own.
    Adding them now would be config that can only rot. `firestore.indexes.json` carries the decision
    and the trigger to revisit it (the day `useEntitySync` grows a `where()`, in the same change — a
    missing index fails loudly with a console link, never silently).
    **Lint is now CLEAN — 0 errors, 0 warnings, down from 65.** ~45 were ours and are fixed: the `{}`
    props type + empty destructure in four components, four useless regex escapes in `validation.ts`,
    `catch (err: any)` in Login/SignUp, and the leftover `console.log`s in `Guards.tsx` §13 flagged.
    The other ~18 were in **vendored** source (`components/ui/**`, `components/reui/**`) and are
    switched off there in `eslint.config.js` rather than "fixed": per §2 those files are configured
    from the call site and patched at documented points, so editing upstream's lines to satisfy a lint
    rule is what turns a small delta into a fork. `icons.tsx`'s 30 findings were false positives —
    every export IS a component, just built by a local `createIcon()` factory the rule can't see
    through. `public/` (MSW's generated worker) is ignored outright.
    **Still NOT runtime-verified ⚠️** — this step verified the RULES, not the app's paths through
    them. `/api/createCycle` + the status stamps (§13), the two-tab broadcast receive path (§16) and
    the filter UI (§17) are all still unexercised; see §13.
19. 🚧 **Vercel deploy** — Admin SDK env vars, strip MSW from prod, deploy functions.
    **The §14.2 carry-overs are DONE (2026-08-19); the deploy itself is not.**
    - ✅ **`LIN-N` race → `api/_sequence.ts`** ★, shared by `createIssue` and `createCycle`: the
      number is allocated from a transactional counter doc and the entity is created in the same
      transaction. Verified against the emulator, including 12 parallel creates — the run is what
      caught both the seeding rule (high-water mark, not `count()`) and the retry failure that
      forced the seed read out of the transaction. Full detail in §14.2.
    - ✅ **Half-failed signup** — `setWorkspaceClaims` creates the workspace doc only when absent
      (transaction, not `{merge:true}` — merge still resets `createdAt`); the `logIn` retry half was
      already there via `ensureWorkspaceClaim`. §14.2.
    - ✅ **`MOCK_ISSUES`** — §15 deleted it.
    - ✅ **`api/` is typechecked** — `api/**/*.ts` joined `tsconfig.node.json`, so `npm run build`
      now compiles the functions that ship. It was in no project before, which is why none of the
      above could have been caught by a build.
    - ✅ **MSW is already stripped** — `main.tsx`'s dynamic import sits behind `import.meta.env.DEV`,
      so no bundle in `dist/assets` references it (checked). The only residue is
      `public/mockServiceWorker.js`, which Vite copies verbatim: a dead file nothing registers.
    **What is actually left, all of it configuration:** link the repo to a Vercel project (never
    done — §15 chose the `vite/localApi.ts` plugin precisely to avoid `vercel link`); set the
    dashboard env vars per §11, and **do not set `FIRESTORE_EMULATOR_HOST` /
    `FIREBASE_AUTH_EMULATOR_HOST` there** — `api/_firebase.ts` branches on the former's presence
    and would point production at an emulator that isn't running; `firebase deploy --only
    firestore:rules`, which ships on a different track from `git push` and has never run against
    the real project.
    **Two things to check on the first deploy, found while auditing:** `vercel.json` has NO SPA
    fallback (its only rewrite, `/api/(.*)` → `/api/$1`, is a no-op — Vercel resolves functions
    from the filesystem before rewrites), so a hard refresh on `/app/issues` may 404 and want
    `{"source": "/(.*)", "destination": "/index.html"}` appended; and most runtime deps
    (`firebase`, `zustand`, `react-router-dom`, `immer`, `idb-keyval`, `@dnd-kit/*`) sit in
    **devDependencies**, which builds fine on Vercel today but is one `NODE_ENV` away from not.
20. **Landing page** — last

---

## 11. Dev & Deploy Workflow (unchanged)

```bash
# Dev
firebase emulators:start          # Auth 9099 + Firestore 8080 (+ UI 4000)
npm run dev                        # Vite; /api/* hits the real Fns via vite/localApi.ts (§15)

# Check
npm run build                      # tsc -b + vite — must stay green
npm run lint                       # zero errors as of build order 18 — keep it there
npm run test:rules                 # firestore.rules vs a THROWAWAY emulator on 8085;
                                   # safe to run with the dev emulator up (§8)

# Deploy
git push origin main               # frontend + Vercel Functions (git integration)
firebase deploy --only firestore:rules   # when rules change — run test:rules first
```
Vercel dashboard env vars (Prod+Preview+Dev): all `VITE_FIREBASE_*` + `FIREBASE_PROJECT_ID` /
`FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`.

---

## 12. What we're NOT building yet (slots in without architectural change)

Multi-user collaboration (same workspace, many accounts) · Initiatives (projects grouped under
strategy) · Cycle auto-schedule / cooldown / rollover · Comments / reactions /
activity log · Notifications · Command palette + keyboard shortcuts · GitHub/Slack integrations
(first HTTP-trigger function) · Public API.

*(**Project templates left this list on 2026-08-16** — they shipped with step 14. Adding them cost one
variant of an existing union rather than a new entity, which is exactly why the widening was cheap
then and would not have been later.)*

**Cycle burn-up chart — deferred, but UNBLOCKED (decided 2026-08-10).** Linear expands the current
cycle's row into a burn-up: scope line, dotted ideal, cumulative *Started* and *Completed* curves,
hatched weekend bands, a today marker. Deferred on value, not on fit — its job is the team "are we on
track?" conversation, and multi-user is out of scope above, so for a single-user workspace it is
decorative next to the real gaps (`SidebarNav`, the view switcher, filters, templates).
It is recorded here rather than dropped because **step 13 lands the only expiring part** —
`startedAt`/`completedAt` (§4). With those accumulating, building the chart later costs nothing extra
and it draws real history from the day the fields shipped. What is left when someone wants it:
- `lib/cycleBurnup.ts` — bucket each issue's two stamps into a day index, prefix-sum to cumulative
  counts, truncate at today (never draw into the future). One pass over issues, not days × issues.
  Scope/`inScope` must come from `lib/progress.ts` so the chart and the progress bar beside it can't
  disagree about cancelled issues.
- The chart component — **hand-rolled inline SVG, no charting library.** It is four primitives (two
  step paths, a dashed line, hatched `<rect>`s); recharts/visx would add a dependency §1 doesn't have
  and then fight the Tailwind v4 tokens. Use `useId()` for the `<pattern>`/`<linearGradient>` ids —
  several charts can be open on one page. Step paths, not splines: counts change discretely per day,
  and a smoothed curve would imply values between days that were never measured.
- **Known fidelity gap, accepted:** the scope line is FLAT at the current issue count. A moving scope
  line needs `addedToCycleAt`, which is the activity-log wedge §4 explicitly closes. Flat is honest;
  the difference is invisible unless a cycle is re-scoped mid-flight.

---

## 13. Verification

- **Local**: `firebase emulators:start` + `npm run dev`. **MSW mocks nothing any more** (build order
  13) — every `/api/*` call hits the real function through `vite/localApi.ts` (§15).
- **Instant boot**: reload `/app/issues` — cached data paints with no spinner, then onSnapshot merges
  (edit a doc in the emulator UI → appears live).
- **Optimistic + rollback**: force a service to throw → UI updates then rolls back with a toast.
- **Cross-entity**: create Project → add Milestone → create issues tagged project+milestone+cycle →
  all three progress bars reflect done/total; each detail view's filtered issue list is correct.
- **Progress scope**: cancel one issue in a project → it leaves BOTH sides of the ratio (the count
  drops and the percentage rises), and a project whose remaining issues are all done reads 100%.
- **Milestone map writes ✅ (verified 2026-08-19, build order 18)**: the §12 design rests on Firestore
  applying DOTTED FIELD PATHS into the project doc's `milestones` map, and that is now proven by
  `test/firestore.rules.test.mjs` rather than left to an eyeball in the emulator UI — renaming one
  milestone leaves its own `sortOrder` and the whole of its sibling byte-identical and bumps the
  project's `updatedAt`; `deleteField()` at `milestones.<id>` leaves exactly the other key; deleting
  the project takes its milestones with it (they're fields, so no orphan cleanup exists — or is
  needed); and a create carrying milestone drafts lands in the same write. `npm run test:rules`.
  *Still worth doing once by hand through the UI, since the suite exercises the write SHAPES the
  services produce, not the components that call them.*
- **Milestone glyph**: a milestone at 0/25/50/75/100% shows 0/1/2/3/4 filled quarters in both the
  detail rows and the `MilestonePicker` options (99% must still read three).
- **Cycle status**: cycles with past/current/future ranges sort into Completed/Active/Upcoming. A
  cycle whose end date is TODAY must still read Active — the create modal stores the end at
  23:59:59.999, so a boundary bug shows up as it flipping to Completed a day early.
- **`/api/createCycle` ⚠️ (not yet run)**: create a cycle and confirm the Fn returns a real sequential
  `number` backed by an actual document (not the old MSW random one — that handler is gone), and that
  a client `addDoc` straight to `cycles` is denied by the new rules block.
- **Sequential numbering ✅ (verified 2026-08-19, build order 19)**: `api/_sequence.ts` was exercised
  against the throwaway emulator (`firebase.test.json`, port 8085) by compiling it to CJS and driving
  the REAL helper — six cases, all passing: it seeds a pre-counter workspace from the highest number
  ever issued (three issues with `LIN-1` deleted still yields `LIN-4`, no duplicate); a deleted
  identifier is never reissued; **12 parallel creates produce a dense 1..12 with one document each**;
  issues and cycles keep separate counters inside one workspace; counters are per workspace.
  *That run is what found the two bugs recorded in §14.2 — the first draft seeded from `count()` and
  read the seed inside the transaction, and the concurrency case is the only one that failed.*
  **This is not wired as an `npm run` script**: the helper is TypeScript importing `./_firebase`
  extensionless, so node can't load it directly and the check needs a `tsc` pass first
  (`npx tsc api/_sequence.ts --ignoreConfig --ignoreDeprecations 6.0 --outDir
  node_modules/.tmp/apicheck --module commonjs --target es2022 --moduleResolution node
  --esModuleInterop --skipLibCheck`, plus a `{"type":"commonjs"}` package.json in that folder, then
  `firebase emulators:exec --only firestore --config firebase.test.json --project
  demo-fluxflow-rules "node --test <script>"`). Worth promoting to `test/` beside the rules suite if
  the allocator is ever touched again.
- **The counter's own migration ⚠️ (not run in the browser)**: the FIRST issue created after this
  change in a workspace that predates it takes the seeding path once. Confirm the new issue continues
  the existing numbering rather than restarting at `LIN-1`, and that
  `workspaces/{ws}/counters/issues` appears in the emulator UI with the right count.
- **Status stamps (§4)**: walk one issue `todo → in_progress → done` and confirm `startedAt` is set
  once at the first move and `completedAt` at the last. Then reopen it (`done → todo`): `completedAt`
  clears, `startedAt` **does not**. Move a second issue `todo → done` directly — it must get BOTH, so
  completed never exceeds started. Do each of these once from the **kanban drag** (`updateStatus`) and
  once from the **detail view's picker** (`updateIssue`), since stamping only one path is the easy
  miss. Reload after each: the stamps must survive the IndexedDB round-trip as `{seconds}` objects
  that `lib/date.ts` can still read.
- **Templates ⚠️ (not yet run)**: mark a default → the new-issue / new-project form opens pre-filled;
  switch template mid-form → the previous template's fields swap out **but anything typed by hand
  stays**; clear the picker → back to blank. Mark a second template of the SAME type default and
  confirm the incumbent is demoted in one batch (never two defaults, never zero after a promote),
  while the OTHER type's default is untouched. Toggle the current default off → zero defaults, and the
  create form opens blank again. Then leave a half-edited template page by Cancel, the back link, the
  sidebar and browser Back — all four must raise "Discard changes?", and saving must NOT.
  Apply an issue template that sets a project, pick a milestone, then switch to a template with a
  different project: `milestoneId` must clear rather than cross projects.
- **Filters ⚠️ (not yet run)**: add a Status chip from "+ Filter" and confirm it **survives with no
  values picked** (the URL shows `?status=`) — if it vanishes, the empty-param distinction broke.
  Pick several values in one popover without it closing between clicks (that is the chip-id test).
  Then, **without leaving the add-filter menu**, tick three statuses in a row: the Status item must
  stay listed and its submenu stay open, each tick showing a checkmark. Close the menu, reopen it,
  hover Status again: the submenu must show those three **already checked**, and un-ticking one
  must remove it (that is the `LOCAL PATCH` test — before it, the reopened submenu was blank and
  could only add). Throughout, there must never be TWO Status chips.
  Copy the URL into a second tab: the same chips and the same rows. Then hand-edit it to
  `?status=nonsense` → the full list renders, no crash. Filter to zero and confirm the **ViewBar
  stays** with a working Clear; filter on a workspace with zero issues and confirm you get the
  onboarding state instead. With a filter active, try to drag a row and a card: **neither lifts**.
  Clear it and confirm both drag again. Finally open an issue the filter excludes by its deep link —
  the detail must still render, since it resolves from the store, not the filtered array.
- **Tab sync ⚠️ (not yet run)**: two tabs on the same workspace, side by side.
  - **Forward**: edit an issue / project / cycle / template in tab A → tab B updates in ~1ms, visibly
    ahead of the onSnapshot echo. Do a **milestone** too (rename one in tab A): it takes the map-field
    path (`applyMilestoneBroadcast` → `projects[projectId].milestones[id]`), not an entity store.
  - **Rollback — the case the whole step exists for**: force a service to throw, then watch **tab B**,
    not tab A. A failed write emits NO snapshot event, so the rollback delta is the only thing that
    can correct the peer; before this step tab B would keep the optimistic value forever. Test both
    an update (peer reverts the field) and a delete (peer's row comes BACK — the undo is a CREATE,
    since the peer has nothing left to merge a patch into).
  - **Temp-id path** (issues + cycles): create in tab A → tab B shows the `LIN-…` placeholder, then
    the real identifier, and **never both at once** — the DELETE tempId / CREATE realId pair must
    arrive in that order.
  - **Default swap**: promote a template in tab A → tab B must never render two defaults of one type
    (the swap crosses as two ordered UPDATEs), and the other type's default stays put.
  - **Deliberate non-sync**: toggle list⇄board in tab A → tab B must NOT move (§16).
- **Rules ✅ (automated as of build order 18)**: `npm run test:rules` — 56 cases against a throwaway
  emulator on port **8085** (`firebase.test.json`), so it never touches the dev emulator on 8080; it
  calls `clearFirestore()` between tests and would wipe it. The suite covers both directions: client
  `addDoc` to `issues`/`cycles` denied while `projects`/`templates` creates succeed, cross-workspace
  and unclaimed-token access denied, every server-minted field (`identifier`, `createdBy`, `createdAt`,
  cycle `number`, template `type`) rejected on update, AND every write the app actually performs still
  allowed — the kanban drop's `{status, sortOrder}`, the status stamps, the pickers, the milestone
  dotted paths, the two-document default swap batch. **Run it after touching `firestore.rules` or any
  service's write shape**; a field added to `src/types` without being added to the rules' allow-list
  fails here rather than in the browser.
  *If you are reading emulator logs by hand: a denial prints "evaluation error at L…" beside its
  verdict and that is expected — rules are evaluated twice, once pre-read with `resource` undefined.
  Not §14.1. The `leaves the connection usable after a denial` case is what distinguishes them.*
- `npm run build` (tsc + vite) **passes as of §16** — it was red before it, on two unused imports
  (`useParams` in `WorkspaceLayout`, `BoxIcon` in `CreateProjectModal`) failing `noUnusedLocals`;
  both removed there. Keep it green: `tsc -b` is the gate the stores' typed deltas rely on.
- `npm run lint` is **CLEAN as of build order 18** — 0 errors, 0 warnings, down from 65. Ours were
  fixed (`{}` props + empty destructure in four components, four useless regex escapes in
  `validation.ts`, `catch (err: any)` in Login/SignUp, the leftover `console.log`s in `Guards.tsx`);
  the ~18 in **vendored** `components/ui/**` and `components/reui/**` are switched off in
  `eslint.config.js` instead, because per §2 the discipline there is to configure from the call site
  and re-apply a documented patch list — editing upstream's lines to satisfy a lint rule is what makes
  a fork. `icons.tsx`'s 30 were false positives (every export IS a component, built by a local
  factory the rule can't see through). Keep it at zero: the suite is only useful while it is silent.

---

## 14. Notes — known gaps found while debugging issue persistence (2026-07-27)

### 14.1 Why edits don't persist locally (DEV-ONLY — production path is unaffected)

Editing an issue in `IssueDetailView` updates the store, then rolls back with a "Failed to update
issue" toast. The Firestore emulator rejects the write:

```
firestore-debug.log → Operation failed:
  Property workspaceId is undefined on object. for 'update' @ L16
  EvaluationException: firestore.rules line [16], column [40]
```

**Cause chain (all dev-only):**
1. `firestore.rules:16` reads `request.auth.token.workspaceId`, but the ID token carries no such
   claim → the rule expression *throws* → `PERMISSION_DENIED` on the Write channel.
2. The claim is never minted in dev: MSW intercepts `/api/setWorkspaceClaims`
   (`src/mocks/handlers.ts:23`) and returns `{workspaceId:'mock-workspace'}` without ever calling
   `setCustomUserClaims` — that only happens in the real Fn (`api/setWorkspaceClaims.ts:35`), which
   never runs under `npm run dev` (`"dev": "vite"`, not `vercel dev`).
3. `authService.signUp:34` hand-patches the store with that mock id, so the app *believes* it has a
   workspace while the JWT sent to Firestore carries nothing. Rules only see the JWT.
4. Second blocker behind it: `/api/createIssue` is mocked too (`handlers.ts:5`) — it returns a random
   UUID and never writes to Firestore. Even with the claim fixed, `updateDoc` would fail
   `NOT_FOUND: No document to update`. Issues currently live only in Zustand + IndexedDB.

**Not a production bug.** MSW is gated to `import.meta.env.DEV` (`main.tsx:16`) and so is the
emulator wiring (`lib/firebase.ts:19`). On Vercel the real Fns run with Admin credentials: the claim
is minted, the doc is written, `updateDoc` succeeds. Fix is about making **dev faithful** — see §15.

### 14.2 These DO ship to production — fix before step 19

- ~~**`MOCK_ISSUES` is imported unconditionally** (`IssueDetailView.tsx:7,21`) so it lands in the prod
  bundle, and the fallback makes a genuine "issue not found" silently render seed data instead.~~
  ✅ **FIXED in build order 15** — `__mockIssues.ts` and both fallbacks are deleted; the Issues page
  gained the real empty state the fallback was hiding. (Verified 2026-08-19: no `MOCK_ISSUES`
  reference remains in `src/`.)
- ~~**`LIN-N` is not race-free** (`api/createIssue.ts:48`). `count() + 1` is exactly the race the
  server hop exists to prevent — concurrent creates collide, and deleting an issue makes the next
  create reuse a retired identifier. Needs a counter doc incremented in a transaction.~~
  ✅ **FIXED in build order 19** — `api/_sequence.ts` ★. A counter doc per collection
  (`workspaces/{ws}/counters/{issues|cycles}`) is read, incremented and written in the SAME
  transaction that creates the entity, so the number and the document carrying it commit together.
  `createCycle` had the identical bug in its `number` and now shares the helper. The counter only
  rises, so a deleted identifier stays retired. Two things the emulator run taught (§13):
  (a) the seed for a pre-counter workspace must be the **highest number ever issued**, not
  `count()` — three issues with one deleted counts 2, and seeding from 2 re-issues the live LIN-3;
  (b) the seed read must happen **outside** the transaction. Inside, concurrent first-creates all
  take the seeding branch, contend, and the retried attempt dies on `Transaction is invalid or
  closed` — so `allocate()` returns null when unseeded and the caller seeds and re-runs.
- ~~**`updateIssue` spreads an arbitrary client patch** (`issueService.ts:27`) and rules don't
  validate fields, so a client can overwrite `identifier` / `createdBy` / `createdAt`.~~ ✅ **FIXED in
  build order 18.** The service still spreads the patch — deliberately; the fix belongs in the rules,
  which is the only place a client can't route around it. `issueMutable()` omits all three, and the
  same treatment covers projects, cycles (`number`) and templates (`type`). Tested in
  `test/firestore.rules.test.mjs`.
- ~~**A half-failed signup is unrecoverable.** `authService.signUp:26` throws if
  `/api/setWorkspaceClaims` fails, but the auth user already exists — no claim, no workspace doc, and
  `logIn` never retries. Make `logIn` call the endpoint when the claim is absent, and make the Fn
  idempotent (`setWorkspaceClaims.ts:29` uses `.set()`, which would reset `createdAt` — needs
  `{merge:true}` or an existence check).~~ ✅ **FIXED in two halves.** The client half landed
  earlier and undocumented: `authService` now routes BOTH entry points through
  `ensureWorkspaceClaim`, which reads the claim off the token and only calls the endpoint when it is
  missing — so a sign-in repairs a half-failed signup by itself. The server half landed in build
  order 19: the workspace doc is created inside a transaction that returns early if it already
  exists. Note `{merge:true}` alone would NOT have been enough — merge still overwrites
  `createdAt` with the retry's `serverTimestamp()`; only skipping the write preserves it.
  `setCustomUserClaims` is idempotent on its own, so the endpoint is now safe to call any number
  of times.
- ~~**Rules throw instead of denying cleanly** on a missing claim.~~ ✅ **Already fixed** — the
  `request.auth.token.get('workspaceId','') == ws` form landed with the step-7 rules, not step 18;
  this bullet was stale. Step 18 added the regression test (`denies a signed-in user whose token
  carries no workspaceId claim`).

---

## 15. Making the full pipeline work locally (supersedes §11's dev block)

MSW was the right call for steps 5–6 (mock the endpoint before it exists), but both endpoints are
real now — mocking them is what breaks local persistence. Switch dev to run the actual Vercel
Functions against the emulators:

**Done (2026-07-27) — `npm run dev` now runs the real functions:**

1. ✅ **`api/_firebase.ts`** — when `FIRESTORE_EMULATOR_HOST` is set, init with a bare `projectId`
   instead of `cert(...)`; the Admin SDK auto-routes to the emulators and skips JWT signature
   verification (required — with a real cert it would reject the emulator's unsigned tokens). The
   `cert(...)` branch is untouched for prod.
2. ✅ **`.env.local`** — added `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` and
   `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099` (server-side, no `VITE_` prefix). Do **not** add these
   to the Vercel dashboard env vars.
3. ✅ **`src/mocks/handlers.ts`** — dropped the `createIssue` + `setWorkspaceClaims` handlers;
   `worker.start` uses `onUnhandledRequest:'bypass'`, so they now pass through to the real routes.
   `createCycle` stayed mocked until step 13, which shipped the real Fn — **handlers.ts is now empty**.
4. ✅ **`vite/localApi.ts`** ★ — dev-only Vite plugin (`apply:'serve'`) that mounts each `api/<name>.ts`
   on the dev server behind a minimal `VercelRequest`/`VercelResponse` shim (body parse + `status`/
   `json`/`send`), loading the full `.env` into `process.env` since Vite only exposes `VITE_*`.
   `_`-prefixed files are skipped as shared helpers. `ssrLoadModule` means editing a function
   hot-reloads without a restart.
   **Chosen over `vercel dev`** because the repo isn't linked to a Vercel project and `vercel dev`
   would require an interactive `vercel link` that creates a remote project. Switch to `vercel dev` at
   step 19 if preferred — the other three changes work unmodified with it.
5. ⚠️ **Reset your local state before testing in the browser** (not done for you — it's your data).
   The existing account has `workspaceId:'mock-workspace'` with no claim, and IndexedDB holds phantom
   issues whose random UUIDs don't exist in Firestore; both keep failing after the fix. Clear site data
   (IndexedDB), delete the user in the Auth emulator UI, and sign up fresh so the real Fn mints the
   claim and creates the workspace doc.

The §11 dev block is unchanged — still `firebase emulators:start` + `npm run dev` — but `/api/*` now
hits `api/` for real instead of MSW.

**Verified end-to-end** (auth emulator → real Fns via the plugin → Firestore emulator): claims Fn
returns 200 and `customAttributes` becomes `{"workspaceId":"<uid>"}`; a refreshed token carries the
claim; `createIssue` returns a real `LIN-1` backed by an actual document; and an authenticated
`PATCH status` — the exact call that was `PERMISSION_DENIED` — returns 200 and persists.
