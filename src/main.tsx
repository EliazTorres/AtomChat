import React, { useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { WorkspacesProvider } from './context/WorkspacesContext';
import { ChatProvider } from './context/ChatContext';
import { router } from './router/router';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

function AppBridge() {
  const settingsCtx = useSettings();
  const settingsRef = useRef(settingsCtx);
  settingsRef.current = settingsCtx;

  return (
    <ChatProvider getAIConfig={() => settingsRef.current}>
      <RouterProvider router={router} />
    </ChatProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <WorkspacesProvider>
          <AppBridge />
        </WorkspacesProvider>
      </SettingsProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
