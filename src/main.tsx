// src/main.tsx
import '@/store/authStore'
import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react'
import { RouterProvider } from 'react-router'
import { router } from '@/router'
import { Toaster } from '@/components/ui/sonner'
import '@/index.css'

// 1. Sync theme before React renders — prevents flash
const saved = localStorage.getItem('theme');
const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
document.documentElement.setAttribute('data-theme', saved ?? preferred)

// 2. MSW in dev only — stripped from prod build
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
      <Toaster />
    </StrictMode>
  )
})