// vite/localApi.ts — dev-only stand-in for `vercel dev` (Plan §15).
// Vite knows nothing about the api/ folder, so in dev every /api/* fetch 404s and
// the real Vercel Functions never run — which is why MSW was mocking them, and why
// no workspaceId claim was ever minted locally (Plan §14.1). This mounts each
// api/<name>.ts on the dev server behind a minimal VercelRequest/VercelResponse
// shim, so local dev exercises the SAME handler code that ships to Vercel.
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'
import type { VercelRequest, VercelResponse } from '@vercel/node'

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('error', reject)
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      if (!raw) return resolve(undefined)
      // Vercel parses JSON bodies for you; mirror that, falling back to the raw
      // string so a non-JSON body reaches the handler unmangled rather than 500ing.
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve(raw)
      }
    })
  })
}

async function toVercelRequest(req: IncomingMessage): Promise<VercelRequest> {
  const augmented = req as IncomingMessage & Record<string, unknown>
  const { searchParams } = new URL(req.url ?? '/', 'http://localhost')
  augmented.query = Object.fromEntries(searchParams)
  augmented.cookies = {}
  augmented.body = await readBody(req)
  return augmented as unknown as VercelRequest
}

function toVercelResponse(res: ServerResponse): VercelResponse {
  const augmented = res as ServerResponse & Record<string, unknown>
  augmented.status = (code: number) => {
    res.statusCode = code
    return augmented
  }
  augmented.json = (body: unknown) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(body))
    return augmented
  }
  augmented.send = (body: unknown) => {
    res.end(typeof body === 'string' ? body : JSON.stringify(body))
    return augmented
  }
  return augmented as unknown as VercelResponse
}

export function localApiRoutes(): Plugin {
  return {
    name: 'local-api-routes',
    apply: 'serve', // dev server only — never part of a production build

    config(_config, { mode }) {
      // Vite exposes only VITE_-prefixed vars to the client, but the Admin SDK
      // reads bare process.env. Load the whole .env into the dev server's process
      // so FIREBASE_* and the FIRESTORE/AUTH emulator hosts are visible to api/.
      Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()

        const name = url.split('?')[0].slice('/api/'.length).replace(/\/+$/, '')
        // '_'-prefixed files are shared helpers, not endpoints (api/_firebase.ts).
        // Nested/traversal paths aren't routes either — fall through to a 404.
        if (!name || name.startsWith('_') || name.includes('/')) return next()

        const file = path.join(server.config.root, 'api', `${name}.ts`)
        if (!fs.existsSync(file)) return next()

        try {
          // ssrLoadModule transpiles on demand and re-reads on change, so editing
          // a function is picked up without restarting the dev server.
          const handler = (await server.ssrLoadModule(file)).default as Handler
          await handler(await toVercelRequest(req), toVercelResponse(res))
        } catch (error) {
          server.config.logger.error(`[local-api] /api/${name} threw:\n${error}`)
          if (!res.writableEnded) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Function failed', detail: String(error) }))
          }
        }
      })
    },
  }
}
