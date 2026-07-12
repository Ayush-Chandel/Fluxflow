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
  (framer-motion) exist. **`Topbar/Topbar.tsx` empty**, **no sidebar nav items yet** (only
  `SideHeader` project-selector popover). `router.tsx` uses `handle: { sidebarKey }` for active state.
- ✅ **Step 4 — Shared foundation**: `types/{issue,project,cycle,template}.ts`, `lib/idb.ts`,
  `lib/broadcastChannel.ts`, `hooks/useEntitySync.ts` (the sync engine), `store/viewPreferenceStore.ts`.
- ❌ **Steps 5+ not started**: `IssuesPage.tsx` stub, `components/issues/` empty, `api/createIssue.ts`
  empty (MSW mocks it), no entity stores/services/hooks beyond auth.
- **Installed & idle, ready to wire**: `zustand`, `immer`, `idb-keyval`, `@dnd-kit/*`, `framer-motion`,
  `msw`, `sonner`. Design tokens already in `src/index.css`.

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
│   │   │   ├── Topbar/Topbar.tsx    🚧 empty → fill (title, view toggle, filter chips, create btn)
│   │   │   └── sidebar/{Sidebar,SidebarContent,SideHeader,CustomTrigger}.tsx ✅
│   │   │        └── SidebarNav.tsx  ★ Issues / Projects / Cycles / Settings nav
│   │   ├── issues/     ★ IssueListView, IssueKanbanView, IssueRow, IssueCard,
│   │   │                 IssueDetailPanel, TemplatePicker
│   │   ├── projects/   ★ ProjectListView, ProjectCard, ProjectDetail, MilestoneList, ProgressBar
│   │   ├── cycles/     ★ CycleListView, CycleCard, CycleDetail, CycleProgress
│   │   ├── templates/  ★ TemplateManager, TemplateForm
│   │   └── ui/         ✅ shadcn primitives (button, card, popover, sheet, sidebar, tooltip…)
│   │
│   ├── services/
│   │   ├── authService.ts    ✅
│   │   ├── issueService.ts   ★ Firestore SDK + fetch(/api/createIssue)
│   │   ├── projectService.ts ★ Firestore SDK (client CRUD) + milestones subcollection
│   │   ├── cycleService.ts   ★ Firestore SDK + fetch(/api/createCycle)
│   │   └── templateService.ts★ Firestore SDK
│   │
│   ├── store/
│   │   ├── authStore.ts          ✅
│   │   ├── issueStore.ts         ★ optimistic CRUD + rollback (reference impl)
│   │   ├── projectStore.ts       ★ + milestone actions
│   │   ├── cycleStore.ts         ★
│   │   ├── templateStore.ts      ★
│   │   └── viewPreferenceStore.ts✅ layout/groupBy/orderBy per viewId (IndexedDB)
│   │
│   ├── lib/
│   │   ├── firebase.ts       ✅
│   │   ├── validation.ts     ✅
│   │   ├── utils.ts (cn)     ✅
│   │   ├── idb.ts            ✅ idb-keyval get/set helpers
│   │   └── broadcastChannel.ts ✅ channel + broadcastDelta()
│   │
│   ├── hooks/
│   │   ├── useEntitySync.ts  ✅ generic idb-read + onSnapshot + idb-writeback (the engine)
│   │   ├── useIssues.ts / useProjects.ts / useCycles.ts / useTemplates.ts ★ thin wrappers
│   │   └── useViewPreference.ts ★
│   │
│   └── mocks/{browser,handlers}.ts  ✅ (extend handlers)
│
├── api/
│   ├── setWorkspaceClaims.ts ✅
│   ├── createIssue.ts        🚧 empty → implement (LIN-xxx)
│   └── createCycle.ts        ★ sequential cycle number
│
├── firestore.rules          ⚠️ permissive/expiring → replace (Section 8)
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
  ├── issues/:id          IssuesPage           detail panel OVER list, URL deep-link
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
│     createdAt, updatedAt, createdBy
│
├── projects/{projectId}                ★
│     name (req), description, icon, color
│     status       backlog|planned|in_progress|paused|completed|cancelled
│     leadId       string|null
│     memberIds    string[]
│     startDate, targetDate  Timestamp|null
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
Reference implementation (issues); every store mutation follows this shape:
```ts
// store/issueStore.ts
updateStatus: async (id, status) => {
  const { user } = useAuthStore.getState()
  const previous = get().issues[id]
  set(produce(s => { s.issues[id].status = status }))       // 1. store   (0ms)
  await idb.set(`issues:${user.workspaceId}`, get().issues) // 2. cache   (0ms)
  broadcastDelta({ type:'UPDATE', id, patch:{ status } })   // 3. tabs    (~1ms)
  try { await issueService.updateStatus(user.workspaceId, id, status) } // 4. Firestore
  catch { set(produce(s => { s.issues[id] = previous })); toast.error('Failed to update') }
},
createIssue: async (data) => {                              // server-sequential create
  const { user } = useAuthStore.getState()
  const tempId = `optimistic-${Date.now()}`
  set(produce(s => { s.issues[tempId] = { ...data, id:tempId, identifier:'LIN-…', status:'backlog' } }))
  try { await issueService.create(user.workspaceId, data)  // Vercel Fn → real LIN-xxx
        set(produce(s => { delete s.issues[tempId] })) }    // onSnapshot delivers real doc
  catch { set(produce(s => { delete s.issues[tempId] })); toast.error('Failed to create issue') }
},
```
Projects/milestones/templates create **client-side** with Firestore auto-ids — id is known immediately
via `doc()`, so no temp-id dance; still optimistic + rollback. Only issues & cycles use the temp-id
pattern because their id/number is server-generated.

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
`text-brand`/active). Fill `Topbar.tsx`: breadcrumb/title, list⇄board toggle (writes
`viewPreferenceStore`), filter chips (`useSearchParams`), one `bg-brand` primary create action.

### B. Issues — *the fundamental unit; reference implementation of the whole pipeline*
**Why:** every other feature reuses the issue views (`Accepts Issue[]`) and the store pattern.
**Build:** `IssueListView` (grouped, status dots, priority icons, inline edit), `IssueKanbanView`
(dnd-kit columns + optimistic `updateStatus`), `IssueDetailPanel` (framer-motion right panel, URL
deep-link at `issues/:id`, inline edit; selectors for project/milestone/cycle/assignee/labels/template),
`issueStore` + `useIssues`, `issueService` + `api/createIssue`.

### C. Projects — *coordinate work that spans many issues toward an outcome*
**Why:** Linear's core organizing unit above the issue; gives goal/lead/target-date + progress
visibility. **Build:** `ProjectListView`/`ProjectCard` (icon, name, status pill, lead avatar, target
date, `ProgressBar`), `ProjectDetailPage` tabs — **Overview** (metadata + progress), **Issues** (reuses
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
`cycleStatusFromDates(start,end,now)` in `types/cycle.ts` (not stored). `CycleDetailPage` reuses issue
views filtered by `cycleId` + a `CycleProgress` bar. Assign issues via a cycle selector.
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
3. 🚧 **App shell** — `SidebarNav` (Issues/Projects/Cycles), fill `Topbar`, wire active state
4. ✅ **Shared foundation** — `types/*`, `lib/idb.ts`, `lib/broadcastChannel.ts`,
   `hooks/useEntitySync.ts`, `viewPreferenceStore`
5. **Issue store + `useIssues`** — optimistic CRUD w/ rollback (reference impl)
6. **MSW handlers** — `createIssue` (+ `createCycle` mock)
7. **issueService + `api/createIssue`** — Firestore SDK + Vercel Fn; issue rules
8. **Issue List view** — grouped, status dots, priority icons, inline edit
9. **Issue Kanban view** — dnd-kit + optimistic status update
10. **Issue detail panel** — framer-motion panel, URL deep-link, inline edit
11. ★ **Projects** — store/service/hook + ProjectsPage + ProjectDetail (Overview/Issues); project rules
12. ★ **Milestones** — subcollection CRUD, MilestoneList, issue↔milestone assignment, progress
13. ★ **Cycles** — store/service + `api/createCycle`, CyclesPage + CycleDetail, derived status,
    issue↔cycle assignment, progress; cycle rules
14. ★ **Issue Templates** — store/service, TemplatesSettingsPage, TemplatePicker + default behavior
15. **View preference store** — persist list/board toggle to IndexedDB
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
