// src/main.tsx
import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react'
import { MotionConfig } from 'motion/react'
import { RouterProvider } from 'react-router'
import { router } from '@/router'
import { Toaster } from '@/components/ui/sonner'
import { ensureAuthBootstrap } from '@/store/authStore'
import '@/index.css'

// 1. Sync theme before React renders — prevents flash
const saved = localStorage.getItem('theme');
const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', saved ?? preferred)

// 2. Start the Firebase auth listener, in parallel with the first render —
// same timing the old module-scope `import '@/store/authStore'` had. Every
// route including the landing blocks on auth, so this must not be deferred.
// The guards also call ensureAuthBootstrap(); it is idempotent.
void ensureAuthBootstrap()

// 3. MSW in dev only — stripped from prod build
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MotionConfig reducedMotion='user'>
        <RouterProvider router={router} />
      </MotionConfig>
      <Toaster />
    </StrictMode>
  )
})