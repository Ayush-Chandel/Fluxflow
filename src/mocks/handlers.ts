// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

// `createIssue` and `setWorkspaceClaims` are NO LONGER mocked: both Fns are real
// now (build order 7) and run against the emulators under `vercel dev`. Mocking
// them meant no workspaceId claim was ever minted and no issue doc was ever
// written, so every subsequent updateDoc died on rules/NOT_FOUND (Plan §14.1).
// worker.start uses onUnhandledRequest:'bypass', so these pass through untouched.
export const handlers = [
  // Still mocked — api/createCycle doesn't exist yet (build order 13).
  http.post('/api/createCycle', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      id: crypto.randomUUID(),
      number: Math.floor(Math.random() * 90) + 1,
      ...body,
    })
  }),
]