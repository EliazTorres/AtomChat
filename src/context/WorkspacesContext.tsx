import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Workspace } from '../types/chat';

const STORAGE_KEY = 'ai-chat-workspaces';

interface WorkspacesContextType {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  createWorkspace: (name: string, description: string, icon: string, color: string) => Workspace;
  deleteWorkspace: (id: string) => void;
  updateWorkspace: (id: string, patch: Partial<Pick<Workspace, 'name' | 'description' | 'icon' | 'color'>>) => void;
}

const WorkspacesContext = createContext<WorkspacesContextType | null>(null);

const WORKSPACE_ICONS = ['work', 'rocket_launch', 'school', 'code', 'science', 'brush', 'business_center', 'favorite'];
const WORKSPACE_COLORS = ['#5e5ce6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function load(): Workspace[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map((w: Workspace) => ({ ...w, createdAt: new Date(w.createdAt) }));
    }
  } catch { /* ignore */ }
  return [];
}

export function WorkspacesProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(load);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  }, [workspaces]);

  const createWorkspace = (
    name: string,
    description: string,
    icon: string,
    color: string
  ): Workspace => {
    const ws: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      description,
      icon,
      color,
      createdAt: new Date(),
    };
    setWorkspaces((prev) => [...prev, ws]);
    return ws;
  };

  const deleteWorkspace = (id: string) =>
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));

  const updateWorkspace = (
    id: string,
    patch: Partial<Pick<Workspace, 'name' | 'description' | 'icon' | 'color'>>
  ) =>
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));

  return (
    <WorkspacesContext.Provider
      value={{ workspaces, activeWorkspaceId, setActiveWorkspaceId, createWorkspace, deleteWorkspace, updateWorkspace }}
    >
      {children}
    </WorkspacesContext.Provider>
  );
}

export function useWorkspaces() {
  const ctx = useContext(WorkspacesContext);
  if (!ctx) throw new Error('useWorkspaces must be used within WorkspacesProvider');
  return ctx;
}

export { WORKSPACE_ICONS, WORKSPACE_COLORS };
