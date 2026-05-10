import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AI_PROVIDERS, getProvider } from '../services/aiProviders';
import type { AIProvider } from '../services/aiProviders';

const STORAGE_KEY = 'ai-chat-settings';

export type Theme = 'dark' | 'light';

export interface AISettings {
  providerId: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  customBaseUrl: string;
  customModelId: string;
  theme: Theme;
}

const DEFAULT_SETTINGS: AISettings = {
  providerId: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  systemPrompt: 'You are Atom Chat, a helpful and knowledgeable AI assistant.',
  customBaseUrl: '',
  customModelId: '',
  theme: 'dark',
};

interface SettingsContextType {
  settings: AISettings;
  updateSettings: (patch: Partial<AISettings>) => void;
  provider: AIProvider;
  isConfigured: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

function load(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS;
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AISettings>(load);

  // Apply theme on mount and on change
  useEffect(() => { applyTheme(settings.theme); }, [settings.theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (patch: Partial<AISettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const provider = getProvider(settings.providerId) ?? AI_PROVIDERS[0];

  const isConfigured = Boolean(
    settings.apiKey.trim() &&
    (settings.providerId !== 'custom' || settings.customBaseUrl.trim())
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, provider, isConfigured }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
