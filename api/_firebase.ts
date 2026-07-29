// api/_firebase.ts — shared Admin SDK init for all Vercel Functions.
// Underscore prefix = not a routable endpoint. Each function is its own bundle,
// so it imports this for the side-effect init; the getApps() guard makes it a
// no-op on warm invocations (and when multiple functions import it).
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Local dev (vercel dev + firebase emulators): FIRESTORE_EMULATOR_HOST /
// FIREBASE_AUTH_EMULATOR_HOST make the Admin SDK route to the emulators and skip
// JWT signature verification, so no service-account key is needed — and must not
// be used, or verifyIdToken would reject the emulator's unsigned tokens.
const useEmulators = !!process.env.FIRESTORE_EMULATOR_HOST

if (!getApps().length) {
  initializeApp(
    useEmulators
      ? { projectId: process.env.FIREBASE_PROJECT_ID }
      : {
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        },
  )
}
