// api/_firebase.ts — shared Admin SDK init for all Vercel Functions.
// Underscore prefix = not a routable endpoint. Each function is its own bundle,
// so it imports this for the side-effect init; the getApps() guard makes it a
// no-op on warm invocations (and when multiple functions import it).
import { initializeApp, getApps, cert } from 'firebase-admin/app'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}
