// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('/api/createIssue', async ({ request }) => {
    const body = await request.json() as any
    return HttpResponse.json({
      id: crypto.randomUUID(),
      identifier: `LIN-${Math.floor(Math.random() * 900) + 100}`,
      ...body,
    })
  }),

  http.post('/api/setWorkspaceClaims', () => {
    return HttpResponse.json({ workspaceId: 'mock-workspace' })
  }),
]