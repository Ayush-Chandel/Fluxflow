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
- 🚧 **Step 3 — App shell (in progress)**: `WorkspaceLayout.tsx` + pinnable/hover-reveal `Sidebar`
  (framer-motion) exist. **`Topbar/Topbar.tsx` now renders a breadcrumb** — the `Issues` crumb, plus
  `› LIN-N <title>` when a detail is open; the `Issues` crumb `Link` owns back-navigation to the list.
  The primary create button ✅ landed with §10.5 (dispatches by `activeKey`). Still pending on the
  topbar: filter chips (→ step 17) and the list⇄board view toggle — the toggle is explicitly **step
  15**'s job now, shipping for issues/projects/cycles at once rather than once per entity. **No
  sidebar nav items yet** (only `SideHeader` project-selector popover). `router.tsx` uses
  `handle: { sidebarKey }` for active state.
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
- 🚧 **Step 11 — Projects (logic landed, UI pending)**: the whole non-UI half is built —
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
  header); the modal's form fields → `createProject` (+ `MilestoneDraftList`, whose drafts are still
  discarded on create until §12 exists).
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
  **Deliberately absent from the card:** the milestone chip (needs §12's subcollection; drafts don't
  persist) and health (§4 doesn't model it — same call as the table's missing Health column).
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
  **Deferred out of this step:** the detail's **Issues tab** — `ProjectDetail` renders Overview only,
  and `useProjectIssues(projectId)` is built but unused, waiting for it. Moved to the **tab-strip pass
  (step 15)** by decision on 2026-08-10, so detail tabs are designed once across entities rather than
  invented per page.
  `components/projects/detail/ProjectMilestoneList.tsx` + `hooks/useProjectMilestones.ts` exist but are
  deliberate §12 scaffolding — the hook returns a frozen empty list until a milestone store lands.
  `ProjectsPage` hardcodes the board today — the list⇄board
  **switcher is deliberately not here**, it ships for issues/projects/cycles together in step 15, and
  the two views need different page shells (the board must not sit in a vertical scroller).
- ✅ **Table sorting groundwork (2026-08-02)**: `ViewPreference` gains **`sortDir`** and `OrderBy`
  widens with the project columns (`name`/`status`/`lead`/`target`/`issues`/`progress`);
  `toggleSort(viewId, column)` implements header-click semantics (same column flips, new column starts
  asc) and `getPreference` now spreads over the defaults so preferences persisted before `sortDir`
  existed still return complete. `lib/projectSorting.ts` owns the comparators, `lib/progress.ts` gains
  `progressByKey()` (ONE pass over issues for the whole table instead of O(rows × issues)), and
  `useProjectRows(viewId)` returns sorted `{project, progress}` rows. **Health was explicitly declined
  — no field, no column data** (see §9C).
- ❌ **Steps 12+ not started**: no entity stores/services/hooks beyond auth + issues + projects.
- **Installed & idle, ready to wire**: `zustand`, `immer`, `idb-keyval`, `framer-motion`,
  `msw`, `sonner` (`@dnd-kit/*` wired in step 9). Design tokens already in `src/index.css`.

**Locked decisions:** Milestones included now · Cycles = manual MVP (no auto-schedule / no rollover) ·
Templates = issue templates only · full data pipeline (IndexedDB + onSnapshot + optimistic +
BroadcastChannel) for **every** entity.

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
│   │       ├── issues/IssuesPage.tsx            🚧 stub → build
│   │       ├── projects/{ProjectsPage,ProjectDetailPage}.tsx   ★
│   │       ├── cycles/{CyclesPage,CycleDetailPage}.tsx         ★
│   │       └── settings/TemplatesSettingsPage.tsx             ★
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── WorkspaceLayout.tsx  ✅  Sidebar + Topbar + <Outlet> (NEVER remounts)
│   │   │   ├── Topbar/Topbar.tsx    🚧 breadcrumb ✅ (owns back-nav) + create btn ✅ → view toggle (step 15), filter chips (step 17)
│   │   │   └── sidebar/{Sidebar,SidebarContent,SideHeader,CustomTrigger}.tsx ✅
│   │   │        └── SidebarNav.tsx  ★ Issues / Projects / Cycles / Settings nav
│   │   ├── issues/     🚧 IssueListView, IssueKanbanView, KanbanColumn, IssueRow, IssueCard,
│   │   │                 IssueCommandBox ✅ (list/kanban take a host-agnostic onOpenIssue) ·
│   │   │                 IssueDetailView ✅ (overlay + deep-link + inline edit; side-panel treatment + selectors deferred) · TemplatePicker ★
│   │   ├── modals/     ✅ CreateIssueDialog (global, in WorkspaceLayout) + CreateIssueModal + CreateIssueMinimizedBar
│   │   ├── projects/   🚧 projectColumns, SortHeader, MilestoneDraftList ✅ ·
│   │   │                 list-view/{ProjectListView,ProjectRow} ✅ ·
│   │   │                 kanban-view/{ProjectKanbanView,ProjectKanbanColumn,ProjectCard} ✅ ·
│   │   │                 detail/{ProjectDetailHeader,ProjectOverview} ✅ ·
│   │   │                 detail/ProjectMilestoneList 🚧 (stub until §12) · detail Issues tab ★
│   │   ├── common/     ✅ ProgressBar, ProjectIcon(+Picker), ConfirmDialog, DatePillPicker,
│   │   │                 DatePickerPanel, Calendar, AutoGrowTextarea, OptionPill…
│   │   ├── cycles/     ★ CycleListView, CycleBoardView, CycleCard, CycleDetail, CycleProgress
│   │   ├── templates/  ★ TemplateManager, TemplateForm
│   │   └── ui/         ✅ shadcn primitives (button, card, popover, sheet, sidebar, tooltip…)
│   │
│   ├── services/
│   │   ├── authService.ts    ✅
│   │   ├── issueService.ts   ✅ Firestore SDK + fetch(/api/createIssue)
│   │   ├── projectService.ts ✅ Firestore SDK (client CRUD; newId → no temp-id) · milestones ★ (§12)
│   │   ├── cycleService.ts   ★ Firestore SDK + fetch(/api/createCycle)
│   │   └── templateService.ts★ Firestore SDK
│   │
│   ├── store/
│   │   ├── authStore.ts          ✅
│   │   ├── issueStore.ts         ✅ optimistic CRUD + rollback (reference impl)
│   │   ├── createIssueDialogStore.ts ✅ create-modal open/minimize/maximize + draft (§10.5)
│   │   ├── projectStore.ts       ✅ optimistic CRUD + rollback · milestone actions ★ (§12)
│   │   ├── cycleStore.ts         ★
│   │   ├── templateStore.ts      ★
│   │   └── viewPreferenceStore.ts✅ layout/groupBy/orderBy per viewId (IndexedDB)
│   │
│   ├── lib/
│   │   ├── firebase.ts       ✅
│   │   ├── validation.ts     ✅
│   │   ├── utils.ts (cn)     ✅
│   │   ├── idb.ts            ✅ idb-keyval get/set helpers
│   │   ├── issueOrdering.ts  ✅ fractional sortOrder keys + drop → {status, sortOrder} patches
│   │   ├── progress.ts       ✅ derived done/total/pct for project · milestone · cycle
│   │   └── broadcastChannel.ts ✅ channel + broadcastDelta()
│   │
│   ├── hooks/
│   │   ├── useEntitySync.ts  ✅ generic idb-read + onSnapshot + idb-writeback (the engine)
│   │   ├── useIssues.ts ✅ · useProjects.ts ✅ · useCycles.ts / useTemplates.ts ★ thin wrappers
│   │   ├── useProjectSelectors.ts ✅ useProjectList/useProject/useProjectIssues/useProjectProgress
│   │   ├── useOpenIssue.ts ✅ · useOpenProject.ts ✅ (host handlers for the view callbacks)
│   │   ├── useProjectMilestones.ts 🚧 shape done, returns [] until §12's store
│   │   └── useViewPreference.ts ★
│   │
│   └── mocks/{browser,handlers}.ts  ✅ (extend handlers)
│
├── api/
│   ├── setWorkspaceClaims.ts ✅
│   ├── createIssue.ts        ✅ verify token → sequential LIN-xxx → add()
│   └── createCycle.ts        ★ sequential cycle number
│
├── firestore.rules          🚧 issues (step 7) + projects (step 11); rest of §8 pending (step 18)
├── firestore.indexes.json   (add issue-by-project / -cycle / -milestone composites)
├── firebase.json  .firebaserc  vercel.json  vite.config.ts  tsconfig*.json  .env.local
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
  ├── projects            ProjectsPage         handle:{sidebarKey:'projects'}       ★
  ├── projects/:id        ProjectDetailPage    tabs: Overview | Issues | Milestones ★
  ├── cycles              CyclesPage           handle:{sidebarKey:'cycles'}         ★
  ├── cycles/:id          CycleDetailPage      issues filtered by cycleId           ★
  └── settings/templates  TemplatesSettingsPage                                     ★
*                         NotFound
```

**URL vs storage rule (unchanged):** layout (`list` | `board`) lives in **IndexedDB, never the URL**.
Only **filters** live in the URL for shareability:
`/app/issues?priority=high&assignee=me&project=<id>&cycle=<id>` parsed via `useSearchParams`.
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
│     createdAt, updatedAt, createdBy
│     └── milestones/{milestoneId}      ★  name (req), targetDate|null, sortOrder,
│                                          createdAt, updatedAt
│
├── cycles/{cycleId}                    ★
│     number       int (server-sequential) → displayed "Cycle N"
│     name, goal   string|null
│     startDate, endDate  Timestamp (req)
│     — status is DERIVED client-side (upcoming|active|completed), NOT stored
│     createdAt, updatedAt, createdBy
│
└── templates/{templateId}              ★  (issue templates only)
      name (req), type:'issue', isDefault:boolean
      data { title?, description?, priority?, labelIds?, status?, assigneeId? }
      createdAt, updatedAt, createdBy
```

**Progress bars** (project, milestone, cycle) are computed client-side: count issues matching
`projectId`/`milestoneId`/`cycleId` with `status==='done'` vs total. No stored counters.

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
Projects/milestones/templates create **client-side** with Firestore auto-ids — id is known immediately
via `doc()`, so no temp-id dance; still optimistic + rollback. Only issues & cycles use the temp-id
pattern because their id/number is server-generated. **Create input** is a `CreateIssueInput` (user
fields only); `identifier`/`id`/timestamps/`createdBy` are server-stamped — see §7.

### Full mutation pipeline
```
User action
  ├─→ Zustand store        (0ms)
  ├─→ IndexedDB            (0ms)
  ├─→ BroadcastChannel → other tabs (~1ms)
  └─→ Firestore client SDK (update/delete/create-project/create-milestone/create-template)
        OR  fetch('/api/createIssue')  / fetch('/api/createCycle')   ← sequential IDs
        └─→ onSnapshot fires on all sessions (100–300ms), reconciles temp → real
```

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
  updateStatus: (ws,id,status) => updateDoc(doc(db,`workspaces/${ws}/issues/${id}`),{ status, updatedAt:serverTimestamp() }),
  updateIssue:  (ws,id,patch)  => updateDoc(doc(db,`workspaces/${ws}/issues/${id}`),{ ...patch, updatedAt:serverTimestamp() }),
  deleteIssue:  (ws,id)        => deleteDoc(doc(db,`workspaces/${ws}/issues/${id}`)),
}

// services/projectService.ts  — client-created, no server needed
export const projectService = {
  create: (ws,data)      => addDoc(collection(db,`workspaces/${ws}/projects`),{ ...data, createdAt:serverTimestamp(), updatedAt:serverTimestamp() }),
  update: (ws,id,patch)  => updateDoc(doc(db,`workspaces/${ws}/projects/${id}`),{ ...patch, updatedAt:serverTimestamp() }),
  remove: (ws,id)        => deleteDoc(doc(db,`workspaces/${ws}/projects/${id}`)),
  addMilestone:    (ws,pid,m)     => addDoc(collection(db,`workspaces/${ws}/projects/${pid}/milestones`), m),
  updateMilestone: (ws,pid,mid,p) => updateDoc(doc(db,`workspaces/${ws}/projects/${pid}/milestones/${mid}`), p),
  removeMilestone: (ws,pid,mid)   => deleteDoc(doc(db,`workspaces/${ws}/projects/${pid}/milestones/${mid}`)),
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

// services/templateService.ts — pure client CRUD
export const templateService = {
  create: (ws,t)     => addDoc(collection(db,`workspaces/${ws}/templates`), t),
  update: (ws,id,p)  => updateDoc(doc(db,`workspaces/${ws}/templates/${id}`), p),
  remove: (ws,id)    => deleteDoc(doc(db,`workspaces/${ws}/templates/${id}`)),
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

**MSW** (`src/mocks/handlers.ts`) — keep `createIssue`, add `createCycle` so local dev needs no Admin
SDK: `http.post('/api/createCycle', () => HttpResponse.json({ id: crypto.randomUUID(), number: n }))`.

**Firestore rules** — replace the current permissive/expiring rules. Server-generated collections are
create-blocked for clients; the rest are workspace-scoped client CRUD:

```
match /workspaces/{ws} {
  allow read: if request.auth.token.workspaceId == ws;

  match /issues/{id}   { allow read,update,delete: if request.auth.token.workspaceId == ws;
                         allow create: if false; }            // Vercel Fn (LIN-xxx)
  match /cycles/{id}   { allow read,update,delete: if request.auth.token.workspaceId == ws;
                         allow create: if false; }            // Vercel Fn (number)
  match /projects/{id} { allow read,create,update,delete: if request.auth.token.workspaceId == ws;
    match /milestones/{mid} { allow read,create,update,delete: if request.auth.token.workspaceId == ws; } }
  match /templates/{id}{ allow read,create,update,delete: if request.auth.token.workspaceId == ws; }
}
```
Add composite indexes in `firestore.indexes.json` for issues filtered by `projectId`, `cycleId`,
`milestoneId`. Deploy: `firebase deploy --only firestore:rules`.

---

## 9. Feature Deep-Dives (what to build, how, and why it matters)

### A. App shell (finish Step 3) — *the frame everything renders in*
**Why:** the shell (`WorkspaceLayout`) must never remount so navigation feels instant and store
subscriptions stay alive. **Build:** `SidebarNav.tsx` with Issues/Projects/Cycles/Settings `Link`s,
active state from `useMatches()` → `handle.sidebarKey`, styled with tokens (`text-muted` idle →
`text-brand`/active). Fill `Topbar.tsx`: breadcrumb/title ✅ and one `bg-brand` primary create action ✅;
the list⇄board toggle (writes `viewPreferenceStore`) moved out to **step 15** so it can be wired for
issues/projects/cycles in one pass, and filter chips (`useSearchParams`) to **step 17**.

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
resolve against (same gap as issue assignee avatars). The milestone chip beside the name is §12.

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

**The list⇄board switcher is NOT part of this step** — the toggle ships once, for issues, projects and
cycles together, in **step 15** (decided 2026-08-06). Until it lands each page renders whichever view
it hardcodes. Nothing about the board has to change when the toggle arrives: `viewPreferenceStore`
already keys `layout` per `viewId`, so the switcher is pure wiring on top of finished views.

**Build:** the table + the board above + `ProjectDetailPage` tabs — **Overview** (metadata + progress), **Issues** (reuses
`IssueListView`/`IssueKanbanView` filtered by `projectId`), **Milestones**. Issue detail panel gets a
project selector; `projectStore`/`projectService`/`useProjects`.

### D. Milestones — *stages inside a project (e.g. Alpha/Beta/GA)*
**Why:** Linear ties project progress to milestones; issues attach to a stage. **Build:**
`MilestoneList` under a project (name + optional target date + per-milestone progress = matching
`milestoneId` done/total), CRUD on the `projects/{id}/milestones` subcollection, and a milestone
selector in the issue panel scoped to the issue's project's milestones.

### E. Cycles (manual MVP) — *time-boxed sprints to keep momentum*
**Why:** agile cadence; a committed scope with a progress bar focuses the team. **Build:**
`CyclesPage` with Active / Upcoming / Completed sections; status derived by
`cycleStatusFromDates(start,end,now)` in `types/cycle.ts` (not stored). **Both views ship in step 13**
(decided 2026-08-06) — `CycleListView` plus a `CycleBoardView` whose columns are the three derived
statuses — with the list⇄board **switcher deferred to step 15**, same as projects. One difference from
the project board: cycle cards are **not drag-orderable across columns**, because cycle status is
derived from `startDate`/`endDate` — a cross-column drop would have to rewrite the date range, which
is out of scope. So `Cycle` needs no `sortOrder` and the board is read-only in that axis.
`CycleDetailPage` reuses issue views filtered by `cycleId` + a `CycleProgress` bar. Assign issues via a cycle selector.
`cycleStore`/`cycleService` + `api/createCycle` for the sequential number. **Explicitly deferred:**
auto-repeating schedule, cooldown, and auto-rollover of incomplete issues.

### F. Issue Templates — *file issues fast with consistent structure*
**Why:** enforces repeatable fields; a team default speeds the common case. **Build:**
`TemplatesSettingsPage` (`/app/settings/templates`) to CRUD templates and mark one `isDefault`.
`TemplatePicker` in the create-issue form pre-fills from `template.data`; if a default exists the
new-issue form opens pre-filled. `templateStore`/`templateService`. Stored in
`workspaces/{ws}/templates`.

---

## 10. Revised Build Order (each step independently shippable; new ★)

1. ✅ Firebase setup
2. ✅ Auth flow + guards
3. 🚧 **App shell** — `SidebarNav` (Issues/Projects/Cycles); `Topbar` breadcrumb ✅ (owns
   back-navigation) + create btn ✅; view toggle → step 15, filter chips → step 17; wire active state
4. ✅ **Shared foundation** — `types/*`, `lib/idb.ts`, `lib/broadcastChannel.ts`,
   `hooks/useEntitySync.ts`, `viewPreferenceStore`
5. ✅ **Issue store + `useIssues`** — optimistic CRUD w/ rollback (reference impl); immer middleware,
   array-cache via `selectAll()`, `issueService` + `CreateIssueInput` (Vercel Fn/rules still §7)
6. ✅ **MSW handlers** — `createIssue` (+ `createCycle` mock)
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
11. 🚧 **Projects** — store/service/hook ✅ + project rules ✅ + derived progress ✅
    (`lib/progress.ts`, `hooks/useProjectSelectors.ts`) + **`priority` on projects** ✅ (shared
    `IssuePriority` scale / `PRIORITY_MAP`, §4) + `CreateProjectModal` ✅ + the **projects table** ✅
    (`ProjectListView` + sortable sticky header) + the **board data layer** ✅ (`sortOrder` on
    `Project`, generic `lib/ordering.ts`, `lib/projectOrdering.ts`, `useProjectBoardGroups()`);
    + the **board UI** ✅ (`kanban-view/{ProjectKanbanView,ProjectKanbanColumn,ProjectCard}`, dnd-kit
    reorder + cross-column drop → `updateProject({status,sortOrder})`, column `+` prefills the status)
    + the **`projects/:id/:slug?` route** ✅, **ProjectDetail + Overview + `ProgressBar`** ✅,
    `useOpenProject` ✅, the **Topbar project crumb** ✅ and the **project selector on issues** ✅
    (`ProjectPicker` in `IssueDetailView` + `CreateIssueModal`; `projectId` now part of the create
    draft). **Deferred out:** the detail's Issues tab → step 15's tab-strip pass; the list⇄board
    switcher → step 15. Everything else in this step is done.
12. ★ **Milestones** — subcollection CRUD, MilestoneList, issue↔milestone assignment, progress
13. ★ **Cycles** — store/service + `api/createCycle`, CyclesPage + CycleDetail, derived status,
    **both `CycleListView` and `CycleBoardView`** (no switcher → step 15; no cross-column drag, since
    cycle status is derived from dates), issue↔cycle assignment, progress; cycle rules
14. ★ **Issue Templates** — store/service, TemplatesSettingsPage, TemplatePicker + default behavior
15. **View chrome — switcher + detail tab strips, all entities in one pass** — the
    `viewPreferenceStore` itself landed back in step 4 ✅ (persisted to IndexedDB, `layout` keyed per
    `viewId`). What remains is the UI:
    (a) the **list⇄board toggle** wired for **issues, projects AND cycles**, each page choosing its
    view from `getPreference(viewId).layout` instead of hardcoding one;
    (b) the **detail tab strip** — one shared strip used by every detail page, and with it
    `ProjectDetail`'s **Issues** tab (`useProjectIssues` + `IssueListView`/`IssueKanbanView` filtered by
    `projectId`, viewId `project:<id>:issues`) plus **Milestones** once §12 lands; the same strip then
    serves the cycle detail. Moved here from step 11 on 2026-08-10.
    Batched on purpose — every view is built ahead of it, so this step is pure wiring and the chrome
    behaves identically everywhere instead of being re-invented per entity.
16. **BroadcastChannel** — wire tab-sync into all store mutations
17. **Filters** — `useSearchParams` per page + Topbar chips (priority/assignee/project/cycle)
18. ★ **Rules hardening + indexes** — final `firestore.rules` (§8) + composite indexes
19. **Vercel deploy** — Admin SDK env vars, strip MSW from prod, deploy functions
20. **Landing page** — last

---

## 11. Dev & Deploy Workflow (unchanged)

```bash
# Dev
firebase emulators:start          # Auth 9099 + Firestore 8080 (+ UI 4000)
npm run dev                        # Vite; MSW intercepts /api/* — api/ folder idle locally

# Deploy
git push origin main               # frontend + Vercel Functions (git integration)
firebase deploy --only firestore:rules   # when rules change
```
Vercel dashboard env vars (Prod+Preview+Dev): all `VITE_FIREBASE_*` + `FIREBASE_PROJECT_ID` /
`FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`.

---

## 12. What we're NOT building yet (slots in without architectural change)

Multi-user collaboration (same workspace, many accounts) · Initiatives (projects grouped under
strategy) · Cycle auto-schedule / cooldown / rollover · Project templates · Comments / reactions /
activity log · Notifications · Command palette + keyboard shortcuts · GitHub/Slack integrations
(first HTTP-trigger function) · Public API.

---

## 13. Verification

- **Local**: `firebase emulators:start` + `npm run dev`; MSW mocks `/api/createIssue` & `/api/createCycle`.
- **Instant boot**: reload `/app/issues` — cached data paints with no spinner, then onSnapshot merges
  (edit a doc in the emulator UI → appears live).
- **Optimistic + rollback**: force a service to throw → UI updates then rolls back with a toast.
- **Cross-entity**: create Project → add Milestone → create issues tagged project+milestone+cycle →
  all three progress bars reflect done/total; each detail view's filtered issue list is correct.
- **Cycle status**: cycles with past/current/future ranges sort into Completed/Active/Upcoming.
- **Templates**: mark a default → new-issue form pre-filled; switch template → fields swap.
- **Tab sync**: two tabs — a mutation appears in the other in ~1ms ahead of the onSnapshot echo.
- **Rules**: emulator confirms client `addDoc` to `issues`/`cycles` denied (server-only) while
  `projects`/`milestones`/`templates` client writes succeed; cross-workspace reads denied.
- `npm run build` (tsc + vite) passes; `npm run lint` clean (remove leftover `console.log` in
  `routes/Guards.tsx`).

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

- **`MOCK_ISSUES` is imported unconditionally** (`IssueDetailView.tsx:7,21`) so it lands in the prod
  bundle, and the fallback makes a genuine "issue not found" silently render seed data instead.
  Already tracked in step 10.5; also delete the copy in `IssuesPage`.
- **`LIN-N` is not race-free** (`api/createIssue.ts:48`). `count() + 1` is exactly the race the
  server hop exists to prevent — concurrent creates collide, and deleting an issue makes the next
  create reuse a retired identifier. Needs a counter doc incremented in a transaction.
- **`updateIssue` spreads an arbitrary client patch** (`issueService.ts:27`) and rules don't validate
  fields, so a client can overwrite `identifier` / `createdBy` / `createdAt`. Fold into the step 18
  rules-hardening pass (field-level `request.resource.data` diff check).
- **A half-failed signup is unrecoverable.** `authService.signUp:26` throws if
  `/api/setWorkspaceClaims` fails, but the auth user already exists — no claim, no workspace doc, and
  `logIn` never retries. Make `logIn` call the endpoint when the claim is absent, and make the Fn
  idempotent (`setWorkspaceClaims.ts:29` uses `.set()`, which would reset `createdAt` — needs
  `{merge:true}` or an existence check).
- **Rules throw instead of denying cleanly** on a missing claim. Evaluation errors *do* deny, so it's
  not a security hole, but `request.auth.token.get('workspaceId','') == ws` is the correct form
  (also handles `request.auth == null`). Fold into step 18.

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
   `createCycle` stays mocked until step 13.
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
