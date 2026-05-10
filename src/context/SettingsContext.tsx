import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { AI_PROVIDERS, getProvider } from '../services/aiProviders';
import type { AIProvider } from '../services/aiProviders';

const STORAGE_KEY = 'ai-chat-settings';

// ── API-key obfuscation (reduces localStorage plaintext exposure) ───────────
// Not a substitute for a real secret store, but meaningfully reduces exposure
// from tooling / extensions that scan localStorage for bare API-key strings.
function encodeApiKey(key: string): string {
  try { return btoa(encodeURIComponent(key)); } catch { return key; }
}
function decodeApiKey(stored: string): string {
  try { return decodeURIComponent(atob(stored)); } catch { return stored; }
}

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
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AISettings>;
      // Decode obfuscated API key (falls back to raw value for backwards compat)
      if (parsed.apiKey) parsed.apiKey = decodeApiKey(parsed.apiKey);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
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
    const toSave: AISettings = {
      ...settings,
      // Store the API key obfuscated, not as bare plaintext
      apiKey: encodeApiKey(settings.apiKey),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
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
