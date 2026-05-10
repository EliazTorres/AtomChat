import { useState, useRef, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useChat } from '../context/ChatContext';
import { AI_PROVIDERS } from '../services/aiProviders';
import { testConnection } from '../services/aiService';
import type { Conversation } from '../types/chat';
import styles from './SettingsPage.module.css';


type TestStatus = 'idle' | 'testing' | 'ok' | 'error';

export function SettingsPage() {
  const { settings, updateSettings, provider } = useSettings();
  const { conversations, importConversations } = useChat();
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState('');
  const [saved, setSaved] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const testAbortRef = useRef<AbortController | null>(null);

  // Abort any in-flight connection test when the page unmounts
  useEffect(() => () => { testAbortRef.current?.abort(); }, []);


  const handleProviderChange = (id: string) => {
    const p = AI_PROVIDERS.find((x) => x.id === id);
    if (!p) return;
    updateSettings({
      providerId: id,
      model: p.models[0]?.id ?? '',
      apiKey: '',
    });
    setTestStatus('idle');
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const friendlyError = (msg: string): string => {
    if (msg.includes('401') || msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('authentication'))
      return '🔑 Invalid API key — check your key in the provider dashboard.';
    if (msg.includes('429') || msg.toLowerCase().includes('rate limit'))
      return '⏱ Rate limit exceeded — wait a moment and try again.';
    if (msg.includes('402') || msg.toLowerCase().includes('quota'))
      return '💳 Quota exceeded — check your billing on the provider dashboard.';
    if (msg.includes('503') || msg.toLowerCase().includes('overloaded'))
      return '🔄 Provider is overloaded — try again in a few seconds.';
    if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch'))
      return '🌐 Network error — check your internet connection.';
    return msg;
  };

  const handleTest = async () => {
    testAbortRef.current?.abort();
    const ac = new AbortController();
    testAbortRef.current = ac;

    setTestStatus('testing');
    setTestError('');
    const model =
      provider.id === 'custom'
        ? settings.customModelId || 'gpt-4o-mini'
        : settings.model;
    const result = await testConnection(provider, settings.apiKey, model, settings.customBaseUrl, ac.signal);
    if (ac.signal.aborted) return; // component unmounted or re-triggered
    if (result.ok) {
      setTestStatus('ok');
    } else {
      setTestStatus('error');
      setTestError(friendlyError(result.error ?? 'Unknown error'));
    }
  };

  const handleExportAll = () => {
    const blob = new Blob([JSON.stringify(conversations, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ai-chat-export.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      // ── Schema validation ──────────────────────────────────────
      if (!Array.isArray(parsed)) throw new Error('Root must be an array.');
      const validated = (parsed as unknown[]).map((item, idx) => {
        if (typeof item !== 'object' || item === null) throw new Error(`Item ${idx} is not an object.`);
        const c = item as Record<string, unknown>;
        if (typeof c.id !== 'string') throw new Error(`Item ${idx}: missing string "id".`);
        if (typeof c.title !== 'string') throw new Error(`Item ${idx}: missing string "title".`);
        if (!Array.isArray(c.messages)) throw new Error(`Item ${idx}: "messages" must be an array.`);
        const messages = (c.messages as unknown[]).map((m, mi) => {
          if (typeof m !== 'object' || m === null) throw new Error(`Item ${idx}, message ${mi} is not an object.`);
          const msg = m as Record<string, unknown>;
          if (msg.role !== 'user' && msg.role !== 'assistant') throw new Error(`Item ${idx}, message ${mi}: invalid role.`);
          if (typeof msg.content !== 'string') throw new Error(`Item ${idx}, message ${mi}: missing string "content".`);
          return {
            ...msg,
            id: typeof msg.id === 'string' ? msg.id : crypto.randomUUID(),
            role: msg.role as 'user' | 'assistant',
            content: msg.content as string,
            timestamp: new Date(msg.timestamp as string),
          };
        });
        return {
          ...c,
          id: c.id as string,
          title: c.title as string,
          messages,
          createdAt: new Date(c.createdAt as string),
          updatedAt: new Date(c.updatedAt as string),
          pinned: typeof c.pinned === 'boolean' ? c.pinned : false,
          workspaceId: typeof c.workspaceId === 'string' ? c.workspaceId : undefined,
        } satisfies Conversation;
      });

      const count = importConversations(validated);
      setImportMsg(`✅ Imported ${count} new conversation${count !== 1 ? 's' : ''}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setImportMsg(`❌ Import failed: ${msg}`);
    }
    e.target.value = '';
  };


  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={`${styles.title} t-headline-md`}>Settings</h1>
        <p className={`${styles.subtitle} t-body-md`}>Configure your AI provider and preferences.</p>
      </header>

      <div className={styles.content}>

        {/* ── Provider Selection ─────────────────── */}
        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} t-label-md`}>AI Provider</h2>
          <div className={styles.providerGrid}>
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.id}
                className={`${styles.providerCard} ${settings.providerId === p.id ? styles.providerCardActive : ''}`}
                onClick={() => handleProviderChange(p.id)}
                id={`provider-${p.id}`}
              >
                <span className={styles.providerIcon}>{p.icon}</span>
                <span className="t-label-md">{p.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── API Key ────────────────────────────── */}
        <section className={styles.section}>
          <div className={styles.labelRow}>
            <label className={`${styles.label} t-label-md`} htmlFor="api-key">
              API Key
            </label>
            {provider.docsUrl && (
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.docsLink} t-label-sm`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
                Get API key
              </a>
            )}
          </div>
          <div className={styles.inputWrapper}>
            <input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              className={`${styles.input} t-body-md`}
              placeholder={provider.placeholder || 'Enter your API key'}
              value={settings.apiKey}
              onChange={(e) => { updateSettings({ apiKey: e.target.value }); setTestStatus('idle'); }}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className={`${styles.eyeBtn} material-symbols-outlined`}
              onClick={() => setShowKey((v) => !v)}
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? 'visibility_off' : 'visibility'}
            </button>
          </div>
          <p className={`${styles.hint} t-label-sm`}>
            Your key is stored only in your browser's localStorage and never sent anywhere except the provider's API.
          </p>
        </section>

        {/* ── Custom base URL (only for custom provider) ── */}
        {provider.id === 'custom' && (
          <section className={styles.section}>
            <label className={`${styles.label} t-label-md`} htmlFor="custom-url">
              Base URL
            </label>
            <input
              id="custom-url"
              type="text"
              className={`${styles.input} t-body-md`}
              placeholder="https://your-server.com/v1"
              value={settings.customBaseUrl}
              onChange={(e) => updateSettings({ customBaseUrl: e.target.value })}
            />
            <label className={`${styles.label} t-label-md`} htmlFor="custom-model" style={{ marginTop: 12 }}>
              Model ID
            </label>
            <input
              id="custom-model"
              type="text"
              className={`${styles.input} t-body-md`}
              placeholder="gpt-4o, llama-3, mistral-7b…"
              value={settings.customModelId}
              onChange={(e) => updateSettings({ customModelId: e.target.value })}
            />
          </section>
        )}

        {/* ── Model Selection ────────────────────── */}
        {provider.id !== 'custom' && (
          <section className={styles.section}>
            <label className={`${styles.label} t-label-md`} htmlFor="model-select">
              Model
            </label>
            <div className={styles.selectWrapper}>
              <select
                id="model-select"
                className={`${styles.select} t-body-md`}
                value={settings.model}
                onChange={(e) => updateSettings({ model: e.target.value })}
              >
                {provider.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.note ? ` [${m.note}]` : ''}
                    {m.contextWindow ? ` — ${m.contextWindow >= 1000000 ? `${(m.contextWindow / 1000000).toFixed(1)}M` : `${(m.contextWindow / 1000).toFixed(0)}K`} ctx` : ''}
                  </option>
                ))}
              </select>
              <span className={`${styles.selectArrow} material-symbols-outlined`}>expand_more</span>
            </div>
          </section>
        )}

        {/* ── Theme ────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} t-label-md`}>Appearance</h2>
          <div className={styles.themeRow}>
            <button
              className={`${styles.themeBtn} ${settings.theme === 'dark' ? styles.themeBtnActive : ''}`}
              onClick={() => updateSettings({ theme: 'dark' })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>dark_mode</span>
              Dark
            </button>
            <button
              className={`${styles.themeBtn} ${settings.theme === 'light' ? styles.themeBtnActive : ''}`}
              onClick={() => updateSettings({ theme: 'light' })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>light_mode</span>
              Light
            </button>
          </div>
        </section>

        {/* ── Data ─────────────────────────────────── */}
        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} t-label-md`}>Data</h2>
          <div className={styles.dataRow}>
            <button className={styles.dataBtn} onClick={handleExportAll}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
              Export all conversations
            </button>
            <button className={styles.dataBtn} onClick={() => importRef.current?.click()}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
              Import conversations
            </button>
            <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>
          {importMsg && <p className={`${styles.importMsg} t-label-sm`}>{importMsg}</p>}
        </section>

        {/* ── System Prompt ──────────────────────────── */}
        <section className={styles.section}>
          <label className={`${styles.label} t-label-md`} htmlFor="system-prompt">
            System Prompt
          </label>
          <textarea
            id="system-prompt"
            className={`${styles.textarea} t-body-md`}
            rows={4}
            placeholder="You are Atom AI, a helpful and knowledgeable AI assistant."
            value={settings.systemPrompt}
            onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
          />
        </section>

        {/* ── Actions ───────────────────────────── */}
        <section className={`${styles.section} ${styles.actionsRow}`}>
          <button
            className={styles.testBtn}
            onClick={handleTest}
            disabled={!settings.apiKey.trim() || testStatus === 'testing'}
            id="test-connection-btn"
          >
            {testStatus === 'testing' ? (
              <>
                <span className={`${styles.spinner} material-symbols-outlined`}>sync</span>
                Testing…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">wifi_tethering</span>
                Test connection
              </>
            )}
          </button>

          <button
            className={styles.saveBtn}
            onClick={handleSave}
            id="save-settings-btn"
          >
            {saved ? (
              <>
                <span className="material-symbols-outlined">check</span>
                Saved
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">save</span>
                Save settings
              </>
            )}
          </button>
        </section>

        {/* ── Test result ───────────────────────── */}
        {testStatus === 'ok' && (
          <div className={`${styles.testResult} ${styles.testOk}`}>
            <span className="material-symbols-outlined">check_circle</span>
            <span className="t-body-md">Connection successful! Your API key works.</span>
          </div>
        )}
        {testStatus === 'error' && (
          <div className={`${styles.testResult} ${styles.testErr}`}>
            <span className="material-symbols-outlined">error</span>
            <span className="t-body-md">{testError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
