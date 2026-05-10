import { lazy } from 'react';
import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { RootLayout } from '../layouts/RootLayout';

// ── Lazy-loaded pages ─────────────────────────────────────────
// Each page becomes its own chunk, loaded only when first visited.
const WelcomePage    = lazy(() => import('../pages/WelcomePage').then(m => ({ default: m.WelcomePage })));
const ChatPage       = lazy(() => import('../pages/ChatPage').then(m => ({ default: m.ChatPage })));
const HistoryPage    = lazy(() => import('../pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const SettingsPage   = lazy(() => import('../pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const WorkspacesPage = lazy(() => import('../pages/WorkspacesPage').then(m => ({ default: m.WorkspacesPage })));

const rootRoute       = createRootRoute({ component: RootLayout });
const indexRoute      = createRoute({ getParentRoute: () => rootRoute, path: '/',                          component: WelcomePage });
const chatRoute       = createRoute({ getParentRoute: () => rootRoute, path: '/chat/$conversationId',      component: ChatPage });
const historyRoute    = createRoute({ getParentRoute: () => rootRoute, path: '/history',                   component: HistoryPage });
const settingsRoute   = createRoute({ getParentRoute: () => rootRoute, path: '/settings',                  component: SettingsPage });
const workspacesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/workspaces',                component: WorkspacesPage });

const routeTree = rootRoute.addChildren([indexRoute, chatRoute, historyRoute, settingsRoute, workspacesRoute]);
export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
