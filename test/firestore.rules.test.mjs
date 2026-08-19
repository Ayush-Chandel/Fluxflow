// test/firestore.rules.test.mjs — the guard for firestore.rules (§8, build order 18).
//
// Run with `npm run test:rules`, which starts a throwaway Firestore emulator via
// `firebase emulators:exec` and points this suite at it. Nothing here touches the
// real project: the emulator runs under the `demo-` project id below, which the
// Firebase tooling treats as offline-only.
//
// The suite asserts BOTH directions, and the first one is the important half:
//
//   1. Every write the app actually performs still succeeds. Field-level rules
//      fail closed, so the realistic way to break this app is a rule that denies
//      its own UI — a create-project modal that silently rolls back is a worse
//      outcome than the hole step 18 set out to close. The payloads below are
//      copied from the services, not invented, and the milestone cases exercise
//      the dotted-path writes §12 was never able to verify.
//
//   2. Every hole §14.2 named is closed: identifier / createdBy / createdAt on
//      issues, `number` on cycles, `type` on templates, plus cross-workspace and
//      unclaimed-token access.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { after, before, beforeEach, describe, it } from 'node:test'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  Timestamp,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

const PROJECT_ID = 'demo-fluxflow-rules'

// emulators:exec exports FIRESTORE_EMULATOR_HOST. Read it rather than hardcoding
// 8080: firebase.test.json deliberately puts this emulator on another port so the
// suite's clearFirestore() can never wipe the dev emulator you have running.
const [EMULATOR_HOST, EMULATOR_PORT] = (
  process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8085'
).split(':')
const WS = 'alice' // a workspace id IS the owner's uid (api/setWorkspaceClaims)
const OTHER_WS = 'bob'

const DAY = 24 * 60 * 60 * 1000

let testEnv

// --- contexts ---------------------------------------------------------------
// alice holds the workspaceId claim for WS; bob holds one for a different
// workspace; carol is signed in with NO claim at all (the §14.1 shape — it must
// deny cleanly rather than throw an evaluation error).
const alice = () => testEnv.authenticatedContext('alice', { workspaceId: WS }).firestore()
const bob = () => testEnv.authenticatedContext('bob', { workspaceId: OTHER_WS }).firestore()
const carol = () => testEnv.authenticatedContext('carol').firestore()
const anon = () => testEnv.unauthenticatedContext().firestore()

const path = (collection, id) => `workspaces/${WS}/${collection}/${id}`

// --- fixtures ---------------------------------------------------------------
// Seeds mirror what actually lands in Firestore: issues/cycles as the Vercel Fns
// write them, projects/templates as the client services do.

const issueSeed = (overrides = {}) => ({
  title: 'Seeded issue',
  description: '',
  status: 'todo',
  priority: 'no_priority',
  assigneeId: null,
  labelIds: [],
  projectId: null,
  milestoneId: null,
  cycleId: null,
  startedAt: null,
  completedAt: null,
  identifier: 'LIN-1',
  createdBy: 'alice',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
})

// projectService.create() spreads NewProjectDoc + the two server stamps.
const projectPayload = (overrides = {}) => ({
  name: 'Alpha',
  description: '',
  content: '',
  icon: 'box',
  color: 'var(--brand)',
  status: 'backlog',
  priority: 'no_priority',
  leadId: null,
  memberIds: [],
  startDate: null,
  targetDate: null,
  milestones: {},
  createdBy: 'alice',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
})

const projectSeed = (overrides = {}) => ({
  ...projectPayload(),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
})

const milestoneValue = (id) => ({
  id,
  name: 'M1',
  description: '',
  targetDate: null,
  sortOrder: 1000,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
})

const cycleSeed = (overrides = {}) => ({
  number: 1,
  name: null,
  goal: null,
  startDate: Timestamp.fromMillis(Date.now()),
  endDate: Timestamp.fromMillis(Date.now() + 14 * DAY),
  createdBy: 'alice',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  ...overrides,
})

const issueTemplatePayload = (overrides = {}) => ({
  name: 'Bug report',
  description: '',
  icon: 'box',
  color: 'var(--brand)',
  isDefault: false,
  type: 'issue',
  data: {
    title: '',
    description: '',
    status: 'backlog',
    priority: 'no_priority',
    projectId: null,
  },
  createdBy: 'alice',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
})

const projectTemplatePayload = (overrides = {}) => ({
  ...issueTemplatePayload(),
  name: 'Launch',
  type: 'project',
  data: {
    name: '',
    description: '',
    content: '',
    status: 'backlog',
    priority: 'no_priority',
    milestones: [{ name: 'Kickoff', description: '' }],
  },
  ...overrides,
})

const templateSeed = (payload) => ({
  ...payload,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
})

/** Write past the rules, the way the emulator UI or a Fn would. */
const seed = (docPath, data) =>
  testEnv.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), docPath), data))

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
      host: EMULATOR_HOST,
      port: Number(EMULATOR_PORT),
    },
  })
})

after(() => testEnv?.cleanup())

beforeEach(() => testEnv.clearFirestore())

// ---------------------------------------------------------------------------

describe('workspace isolation', () => {
  beforeEach(() => seed(path('issues', 'i1'), issueSeed()))

  it('lets the claim holder read their own workspace', async () => {
    await assertSucceeds(getDoc(doc(alice(), path('issues', 'i1'))))
  })

  it('denies a reader from another workspace', async () => {
    await assertFails(getDoc(doc(bob(), path('issues', 'i1'))))
  })

  it('denies an anonymous reader', async () => {
    await assertFails(getDoc(doc(anon(), path('issues', 'i1'))))
  })

  // §14.1: a token with no workspaceId claim used to make the rule THROW, which
  // killed the whole WebChannel Write stream instead of failing one operation.
  // token.get(…, '') is what turns it into an ordinary denial.
  it('denies a signed-in user whose token carries no workspaceId claim', async () => {
    await assertFails(getDoc(doc(carol(), path('issues', 'i1'))))
  })

  it('denies a write from another workspace', async () => {
    await assertFails(
      updateDoc(doc(bob(), path('issues', 'i1')), { title: 'x', updatedAt: serverTimestamp() }),
    )
  })

  // §14.1 is the reason this test exists rather than being assumed. A denial has
  // to be a CATCHABLE per-operation failure — that is what the stores' rollback
  // paths are built on — not something that wedges the Write stream and takes
  // every later write with it.
  //
  // Worth knowing when reading emulator logs: a denied write here still prints
  // "evaluation error at L…" alongside the verdict. That is NOT the §14.1 bug
  // resurfacing. Firestore evaluates each rule TWICE — once in a pre-read pass
  // where `resource` is undefined (so the `diff(resource.data)` in changedKeys()
  // legitimately errors) and again with the document loaded, which is the pass
  // that decides. Confirmed against the emulator's ruleCoverage report: every
  // expression shows one evaluation with resource undefined and one with it
  // defined. This assertion is what proves the difference is real.
  it('leaves the connection usable after a denial', async () => {
    const db = alice()
    await assertFails(updateDoc(doc(db, path('issues', 'i1')), { identifier: 'LIN-999' }))
    await assertSucceeds(
      updateDoc(doc(db, path('issues', 'i1')), { title: 'Still works', updatedAt: serverTimestamp() }),
    )
  })
})

describe('issues', () => {
  beforeEach(() => seed(path('issues', 'i1'), issueSeed()))

  const patch = (fields) =>
    updateDoc(doc(alice(), path('issues', 'i1')), { ...fields, updatedAt: serverTimestamp() })

  it('blocks client creates — api/createIssue owns the sequential identifier', async () => {
    await assertFails(setDoc(doc(alice(), path('issues', 'i2')), issueSeed({ identifier: 'LIN-2' })))
  })

  it('allows the detail view to edit title and description', async () => {
    await assertSucceeds(patch({ title: 'Renamed', description: 'Body' }))
  })

  it('allows a kanban drop (status + sortOrder in one write)', async () => {
    await assertSucceeds(patch({ status: 'in_progress', sortOrder: 1500.5 }))
  })

  it('allows the status stamps lib/statusStamps.ts writes alongside status', async () => {
    await assertSucceeds(
      patch({ status: 'done', startedAt: serverTimestamp(), completedAt: serverTimestamp() }),
    )
  })

  it('allows the project / milestone / cycle pickers', async () => {
    await assertSucceeds(patch({ projectId: 'p1', milestoneId: 'm1', cycleId: 'c1' }))
  })

  it('allows clearing a picker back to null', async () => {
    await assertSucceeds(patch({ projectId: null, milestoneId: null }))
  })

  // The §14.2 hole: issueService.updateIssue spreads an arbitrary patch, so
  // before step 18 each of these four succeeded.
  it('denies overwriting the server-minted identifier', async () => {
    await assertFails(patch({ identifier: 'LIN-999' }))
  })

  it('denies overwriting createdBy', async () => {
    await assertFails(patch({ createdBy: 'mallory' }))
  })

  it('denies overwriting createdAt', async () => {
    await assertFails(patch({ createdAt: serverTimestamp() }))
  })

  it('denies smuggling in an unknown field', async () => {
    await assertFails(patch({ workspaceId: OTHER_WS }))
  })

  it('denies a status outside ISSUE_STATUSES', async () => {
    await assertFails(patch({ status: 'archived' }))
  })

  it('denies a priority outside ISSUE_PRIORITIES', async () => {
    await assertFails(patch({ priority: 'blocker' }))
  })

  it('denies emptying the title', async () => {
    await assertFails(patch({ title: '' }))
  })

  it('denies a write that forges updatedAt instead of stamping it server-side', async () => {
    await assertFails(
      updateDoc(doc(alice(), path('issues', 'i1')), {
        title: 'Renamed',
        updatedAt: Timestamp.fromMillis(0),
      }),
    )
  })

  it('denies a write that skips updatedAt entirely', async () => {
    await assertFails(updateDoc(doc(alice(), path('issues', 'i1')), { title: 'Renamed' }))
  })

  it('allows delete', async () => {
    await assertSucceeds(deleteDoc(doc(alice(), path('issues', 'i1'))))
  })
})

describe('projects', () => {
  const create = (overrides) =>
    setDoc(doc(alice(), path('projects', 'p1')), projectPayload(overrides))

  it('allows the create-project modal payload', async () => {
    await assertSucceeds(create())
  })

  it('allows a create that carries milestone drafts in the same write', async () => {
    await assertSucceeds(create({ milestones: { m1: milestoneValue('m1') } }))
  })

  it('denies a create that claims someone else made it', async () => {
    await assertFails(create({ createdBy: 'mallory' }))
  })

  it('denies a create with a client-chosen createdAt', async () => {
    await assertFails(create({ createdAt: Timestamp.fromMillis(0) }))
  })

  it('denies a create missing a required field', async () => {
    const { content, ...withoutContent } = projectPayload()
    await assertFails(setDoc(doc(alice(), path('projects', 'p1')), withoutContent))
  })

  it('denies a create with an extra field', async () => {
    await assertFails(create({ health: 'on_track' }))
  })

  it('denies a create with a status from the issue vocabulary', async () => {
    await assertFails(create({ status: 'todo' }))
  })

  describe('update', () => {
    beforeEach(() => seed(path('projects', 'p1'), projectSeed()))

    const patch = (fields) =>
      updateDoc(doc(alice(), path('projects', 'p1')), { ...fields, updatedAt: serverTimestamp() })

    it('allows the detail header and table cells', async () => {
      await assertSucceeds(patch({ name: 'Beta', status: 'in_progress', priority: 'high' }))
    })

    it('allows a board drop (status + sortOrder)', async () => {
      await assertSucceeds(patch({ status: 'planned', sortOrder: 2500 }))
    })

    it('allows the icon/colour picker and the date pills', async () => {
      await assertSucceeds(
        patch({ icon: 'rocket', color: '#ff0000', startDate: Timestamp.now(), targetDate: null }),
      )
    })

    it('denies overwriting createdBy', async () => {
      await assertFails(patch({ createdBy: 'mallory' }))
    })

    it('denies emptying the name', async () => {
      await assertFails(patch({ name: '' }))
    })

    it('allows delete', async () => {
      await assertSucceeds(deleteDoc(doc(alice(), path('projects', 'p1'))))
    })
  })

  // §12's map-field design rests entirely on Firestore accepting DOTTED FIELD
  // PATHS into `milestones`. These are the writes the plan flagged as never
  // runtime-verified, and they are also the ones a careless allow-list breaks:
  // affectedKeys() reports the top-level `milestones`, not the dotted path, so
  // `milestones` has to be on projectMutable() or all three of these fail.
  describe('milestones (dotted-path writes into the project doc)', () => {
    beforeEach(() => seed(path('projects', 'p1'), projectSeed({ milestones: { m1: milestoneValue('m1') } })))

    const ref = () => doc(alice(), path('projects', 'p1'))

    it('allows creating one at milestones.<id>', async () => {
      await assertSucceeds(
        updateDoc(ref(), { 'milestones.m2': milestoneValue('m2'), updatedAt: serverTimestamp() }),
      )
    })

    it('allows patching one field at milestones.<id>.<field>', async () => {
      await assertSucceeds(
        updateDoc(ref(), { 'milestones.m1.name': 'Renamed', updatedAt: serverTimestamp() }),
      )
    })

    it('allows deleteField() at milestones.<id>', async () => {
      await assertSucceeds(
        updateDoc(ref(), { 'milestones.m1': deleteField(), updatedAt: serverTimestamp() }),
      )
    })

    it('denies a milestone write that also touches createdBy', async () => {
      await assertFails(
        updateDoc(ref(), {
          'milestones.m1.name': 'Renamed',
          createdBy: 'mallory',
          updatedAt: serverTimestamp(),
        }),
      )
    })
  })

  // Not a rules assertion — this is §13's outstanding "milestone map writes"
  // check, which the plan could only describe as something to eyeball in the
  // emulator UI. The whole map-field design (§4) rests on a dotted path being a
  // genuine PARTIAL write; if it clobbered the map the way an array would, §12
  // would be silently losing milestones on every rename.
  describe('milestone writes are partial (§4 map-field design)', () => {
    // withSecurityRulesDisabled resolves to void, so the snapshot has to come
    // back out through a closure rather than the callback's return value.
    const read = async (id) => {
      let snapshot
      await testEnv.withSecurityRulesDisabled(async (ctx) => {
        snapshot = await getDoc(doc(ctx.firestore(), path('projects', id)))
      })
      return snapshot
    }

    beforeEach(() =>
      seed(
        path('projects', 'p1'),
        projectSeed({ milestones: { m1: milestoneValue('m1'), m2: milestoneValue('m2') } }),
      ),
    )

    it('renaming one milestone leaves its siblings byte-identical', async () => {
      const before = (await read('p1')).data()
      await updateDoc(doc(alice(), path('projects', 'p1')), {
        'milestones.m1.name': 'Renamed',
        updatedAt: serverTimestamp(),
      })
      const after = (await read('p1')).data()

      assert.equal(after.milestones.m1.name, 'Renamed')
      // Everything else about m1 survives — a dotted path is not a replace.
      assert.equal(after.milestones.m1.sortOrder, before.milestones.m1.sortOrder)
      assert.deepEqual(after.milestones.m2, before.milestones.m2)
      // And the project's own stamp moves, which is what the list re-sorts on.
      assert.ok(after.updatedAt.toMillis() > before.updatedAt.toMillis())
    })

    it('deleteField() removes exactly one key', async () => {
      await updateDoc(doc(alice(), path('projects', 'p1')), {
        'milestones.m1': deleteField(),
        updatedAt: serverTimestamp(),
      })
      const after = (await read('p1')).data()

      assert.deepEqual(Object.keys(after.milestones), ['m2'])
    })

    it('deleting the project takes its milestones with it — nothing is orphaned', async () => {
      await deleteDoc(doc(alice(), path('projects', 'p1')))

      assert.equal((await read('p1')).exists(), false)
    })
  })
})

describe('cycles', () => {
  beforeEach(() => seed(path('cycles', 'c1'), cycleSeed()))

  const patch = (fields) =>
    updateDoc(doc(alice(), path('cycles', 'c1')), { ...fields, updatedAt: serverTimestamp() })

  it('blocks client creates — api/createCycle owns the sequential number', async () => {
    await assertFails(setDoc(doc(alice(), path('cycles', 'c2')), cycleSeed({ number: 2 })))
  })

  it('allows the edit modal (name, goal and both dates)', async () => {
    await assertSucceeds(
      patch({
        name: 'Sprint 2',
        goal: 'Ship filters',
        startDate: Timestamp.fromMillis(Date.now() + DAY),
        endDate: Timestamp.fromMillis(Date.now() + 15 * DAY),
      }),
    )
  })

  it('denies overwriting the server-sequential number', async () => {
    await assertFails(patch({ number: 99 }))
  })

  it('denies an inverted date range', async () => {
    await assertFails(
      patch({
        startDate: Timestamp.fromMillis(Date.now() + 15 * DAY),
        endDate: Timestamp.fromMillis(Date.now() + DAY),
      }),
    )
  })

  it('allows delete', async () => {
    await assertSucceeds(deleteDoc(doc(alice(), path('cycles', 'c1'))))
  })
})

describe('templates', () => {
  it('allows creating an issue template', async () => {
    await assertSucceeds(setDoc(doc(alice(), path('templates', 't1')), issueTemplatePayload()))
  })

  it('allows creating a project template', async () => {
    await assertSucceeds(setDoc(doc(alice(), path('templates', 't1')), projectTemplatePayload()))
  })

  it('denies a payload key the union does not declare', async () => {
    await assertFails(
      setDoc(
        doc(alice(), path('templates', 't1')),
        issueTemplatePayload({
          data: { title: '', description: '', status: 'backlog', priority: 'low', projectId: null, assigneeId: 'x' },
        }),
      ),
    )
  })

  // The union's whole point: `data` is validated against `type`, so a project
  // status can't ride in on an issue template.
  it('denies a project status inside an issue template payload', async () => {
    await assertFails(
      setDoc(
        doc(alice(), path('templates', 't1')),
        issueTemplatePayload({
          data: { title: '', description: '', status: 'planned', priority: 'low', projectId: null },
        }),
      ),
    )
  })

  describe('update', () => {
    beforeEach(async () => {
      await seed(path('templates', 't1'), templateSeed(issueTemplatePayload()))
      await seed(path('templates', 't2'), templateSeed(issueTemplatePayload({ isDefault: true })))
    })

    const ref = (id) => doc(alice(), path('templates', id))

    // templateService.update sends the whole CreateTemplateInput, `type`
    // included. It is off templateMutable(), but diff() is a VALUE diff — an
    // unchanged key is not "affected" — so this has to pass.
    it('allows the form to resend an unchanged type alongside real edits', async () => {
      await assertSucceeds(
        updateDoc(ref('t1'), {
          name: 'Renamed',
          description: '',
          icon: 'box',
          color: 'var(--brand)',
          isDefault: false,
          type: 'issue',
          data: { title: 'T', description: '', status: 'todo', priority: 'high', projectId: null },
          updatedAt: serverTimestamp(),
        }),
      )
    })

    it('denies actually changing the type', async () => {
      await assertFails(
        updateDoc(ref('t1'), {
          type: 'project',
          data: {
            name: '',
            description: '',
            content: '',
            status: 'backlog',
            priority: 'low',
            milestones: [],
          },
          updatedAt: serverTimestamp(),
        }),
      )
    })

    // The default swap is ONE writeBatch over two documents; a batch is
    // evaluated per-document, so both halves must pass on their own.
    it('allows the two-document default swap in one batch', async () => {
      const db = alice()
      const batch = writeBatch(db)
      batch.update(doc(db, path('templates', 't1')), {
        isDefault: true,
        updatedAt: serverTimestamp(),
      })
      batch.update(doc(db, path('templates', 't2')), {
        isDefault: false,
        updatedAt: serverTimestamp(),
      })
      await assertSucceeds(batch.commit())
    })

    it('denies overwriting createdBy', async () => {
      await assertFails(updateDoc(ref('t1'), { createdBy: 'mallory', updatedAt: serverTimestamp() }))
    })

    it('allows delete', async () => {
      await assertSucceeds(deleteDoc(ref('t1')))
    })
  })
})
