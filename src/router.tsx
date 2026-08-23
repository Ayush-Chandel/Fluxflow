// src/router.ts
import { createBrowserRouter,Navigate } from 'react-router'
import Landing from '@/Landing'
import PageLoader from '@/components/common/PageLoader'
import { AuthRoute, LandingRoute, ProtectedRoute } from '@/routes/Guards'
import { sidebarHandle } from './types/layout'

const bootFallback = <PageLoader fullscreen />

export const router = createBrowserRouter([
  {
    // Landing guard wrapper — in prod, redirects / to /login (or /app/issues)
    Component: LandingRoute,
    hydrateFallbackElement: bootFallback,
    children: [
      {
        path: '/',
        Component: Landing,
      },
    ],
  },
  {
    // Auth guard wrapper — redirects to /app/issues if already logged in
    Component: AuthRoute,
    hydrateFallbackElement: bootFallback,
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
    hydrateFallbackElement: bootFallback,
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
              path: 'issues/:identifier/:slug?',
              lazy: () => import('@/routes/workspace/issues/Issues'),
              handle: sidebarHandle('issues'),
            },
            {
              path: 'projects',
              lazy: () => import('@/routes/workspace/projects/Projects'),
              handle: sidebarHandle('projects'),
            },
            {
              path: 'projects/:id/:slug?',
              lazy: () => import('@/routes/workspace/projects/ProjectDetail'),
              handle: sidebarHandle('projects'),
            },
            {
              path: 'cycles',
              lazy: () => import('@/routes/workspace/cycles/Cycles'),
              handle: sidebarHandle('cycles'),
            },
            {
              path: 'cycles/current',
              lazy: () => import('@/routes/workspace/cycles/CycleQuickView'),
              handle: sidebarHandle('cycles'),
            },
            {
              path: 'cycles/upcoming',
              lazy: () => import('@/routes/workspace/cycles/CycleQuickView'),
              handle: sidebarHandle('cycles'),
            },
            {
              path: 'cycles/:id/:slug?',
              lazy: () => import('@/routes/workspace/cycles/CycleDetail'),
              handle: sidebarHandle('cycles'),
            },
            {
              path: 'templates',
              handle: sidebarHandle('templates'),
              children: [
                { index: true, element: <Navigate to="/app/templates/issues" replace /> },
                { path:':type', lazy: ()=> import('@/routes/workspace/templates/TemplatesPage')},
                { path: ':type/new', lazy: () => import('@/routes/workspace/templates/TemplateFormPage') },
                { path: ':type/:id', lazy: () => import('@/routes/workspace/templates/TemplateFormPage') },
              ]
            },
        ],
      },
    ],
  },
  {
    path: '*',
    lazy: () => import('@/routes/NotFound'),
    hydrateFallbackElement: bootFallback,
  },
])