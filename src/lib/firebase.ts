// App + Auth only. Firestore lives in ./firestore so that pages which never
// read data (the landing) don't pull the Firestore SDK or open its IndexedDB
// cache — see src/lib/firestore.ts.
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)

// Point to local emulators in dev — no real Firebase traffic during development.
// The Firestore emulator is wired up in ./firestore, where `db` is created.
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
}