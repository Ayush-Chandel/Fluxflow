// src/router.ts
import { createBrowserRouter,Navigate } from 'react-router'
import Landing from '@/Landing'
import { AuthRoute, ProtectedRoute } from '@/routes/Guards'
import { sidebarHandle } from './types/layout'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
  },
  {
    // Auth guard wrapper — redirects to /app/issues if already logged in
    Component: AuthRoute,
    children: [
      {
        path: '/signup',
        lazy: () => import('@/routes/auth/SignUp'),
      },
      {
        path: '/login',
        lazy: () => import('@/routes/auth/Login'),
      },
    ],
  },
  {
    // Protected guard wrapper — redirects to /login if not logged in
    Component: ProtectedRoute,
    children: [
      {
        path: '/app',
        lazy: () => import('@/components/layout/WorkspaceLayout'),
        children: [
            {
              index: true,  // ← matches /app exactly
              element: <Navigate to="/app/issues" replace />,
            },
            {
              path: 'issues',
              lazy: () => import('@/routes/workspace/issues/Issues'),
              handle: sidebarHandle('issues'),
            },
            {
              path: 'issues/:id',
              lazy: () => import('@/routes/workspace/issues/Issues'),
              handle: sidebarHandle('issues'),
            },
            {
              path: 'projects',
              lazy: () => import('@/routes/workspace/projects/Projects'),
              handle: sidebarHandle('projects'),
            },
            {
              path: 'cycles',
              lazy: () => import('@/routes/workspace/cycles/Cycles'),
              handle: sidebarHandle('cycles'),
            },
        ],
      },
    ],
  },
  {
    path: '*',
    lazy: () => import('@/routes/NotFound'),
  },
])