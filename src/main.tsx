import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { WorkspacesProvider } from './context/WorkspacesContext';
import { ChatProvider } from './context/ChatContext';
import { router } from './router/router';
import './index.css';
import { useRef } from 'react';

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
    <SettingsProvider>
      <WorkspacesProvider>
        <AppBridge />
      </WorkspacesProvider>
    </SettingsProvider>
  </React.StrictMode>
);

