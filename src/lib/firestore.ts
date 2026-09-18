// Firestore init, deliberately split out of ./firebase.
//
// Importing this module pulls the Firestore SDK and opens the persistent
// IndexedDB cache, so only code that actually reads or writes data should
// import it. Everything here is reachable exclusively from the lazily loaded
// /app routes, which keeps ~600 KB of SDK off the landing page's critical path.
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { app } from './firebase'

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
