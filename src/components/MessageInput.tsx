import { useRef, useState, useEffect, useMemo } from 'react';
import type { MessageAttachment } from '../types/chat';
import { useSettings } from '../context/SettingsContext';
import { streamCompletion } from '../services/aiService';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  onSend: (message: string, attachments?: MessageAttachment[]) => void;
  disabled?: boolean;
  conversationTokenEstimate?: number;
}

const ENHANCE_SYSTEM = `You are a prompt engineer. The user will give you a raw prompt and you must rewrite it to be clearer, more specific, and more effective for an AI assistant. 
Rules:
- Keep the user's original intent 100%
- Add context, constraints, and structure where needed
- Use clear, concise language
- If relevant, ask for a specific format (e.g. bullet list, code block, step-by-step)
- Output ONLY the enhanced prompt — no explanation, no preamble, no quotes`;

function charsToTokens(chars: number) { return Math.ceil(chars / 4); }

export function MessageInput({ onSend, disabled, conversationTokenEstimate = 0 }: MessageInputProps) {
  const { settings, provider, isConfigured } = useSettings();
  const [value, setValue] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState(false); // flash indicator
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<boolean>(false);

  const contextWindow = useMemo(() => {
    const model = provider.models.find((m) => m.id === settings.model);
    return model?.contextWindow ?? 8000;
  }, [provider, settings.model]);

  const totalChars = conversationTokenEstimate + value.length + attachments.reduce((s, a) => s + a.content.length, 0);
  const usedTokens = charsToTokens(totalChars);
  const usageRatio = Math.min(usedTokens / contextWindow, 1);
  const usagePercent = Math.round(usageRatio * 100);
  const usageColor = usageRatio > 0.9 ? 'var(--color-error)' : usageRatio > 0.7 ? 'var(--color-tertiary)' : 'var(--color-primary)';

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };
  useEffect(() => { autoResize(); }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled || enhancing) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setValue('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Enhance prompt ───────────────────────────────────────────
  const handleEnhance = async () => {
    const trimmed = value.trim();
    if (!trimmed || !isConfigured || enhancing) return;

    setEnhancing(true);
    abortRef.current = false;
    let accumulated = '';

    const model = provider.id === 'custom' ? settings.customModelId || 'gpt-4o-mini' : settings.model;

    await streamCompletion(
      provider,
      settings.apiKey,
      model,
      [{ role: 'user', content: `Enhance this prompt:\n\n${trimmed}` }],
      ENHANCE_SYSTEM,
      settings.customBaseUrl,
      {
        onChunk: (text) => {
          if (abortRef.current) return;
          accumulated += text;
          setValue(accumulated);
        },
        onDone: () => {
          setEnhancing(false);
          setEnhanced(true);
          setTimeout(() => setEnhanced(false), 2000);
          // Re-focus textarea
          setTimeout(() => textareaRef.current?.focus(), 50);
        },
        onError: () => {
          setEnhancing(false);
        },
      }
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const newAttachments: MessageAttachment[] = [];
    for (const file of files) {
      try {
        const content = await file.text();
        newAttachments.push({ name: file.name, type: file.type || 'text/plain', content });
      } catch {
        newAttachments.push({ name: file.name, type: file.type, content: '[Binary file]' });
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
  };

  const removeAttachment = (name: string) =>
    setAttachments((prev) => prev.filter((a) => a.name !== name));

  const canEnhance = value.trim().length > 0 && isConfigured && !disabled;

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.inputArea} ${enhancing ? styles.inputAreaEnhancing : ''}`}>
        {/* Attachment pills */}
        {attachments.length > 0 && (
          <div className={styles.attachmentRow}>
            {attachments.map((att) => (
              <div key={att.name} className={styles.attachPill}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>attach_file</span>
                <span className="t-label-sm">{att.name}</span>
                <button className={styles.attachRemove} onClick={() => removeAttachment(att.name)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Enhancing overlay */}
        {enhancing && (
          <div className={styles.enhancingBanner}>
            <span className={`material-symbols-outlined ${styles.enhanceSpin}`} style={{ fontSize: 14 }}>auto_awesome</span>
            <span className="t-label-sm">Enhancing your prompt…</span>
          </div>
        )}

        <div className={styles.inputContainer}>
          <textarea
            ref={textareaRef}
            id="chat-input"
            className={`${styles.textarea} t-body-lg`}
            placeholder="Message Atom AI… (Shift+Enter for new line)"
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || enhancing}
          />
          <div className={styles.actions}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
              accept=".txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.py,.html,.css,.xml,.yaml,.yml,.log"
            />
            <button
              className={`${styles.iconBtn} material-symbols-outlined`}
              title="Attach file"
              onClick={() => fileInputRef.current?.click()}
              disabled={enhancing}
            >
              attach_file
            </button>

            {/* ── Enhance prompt button ── */}
            <button
              className={`${styles.enhanceBtn} ${enhanced ? styles.enhanceBtnDone : ''} ${enhancing ? styles.enhanceBtnActive : ''}`}
              title={!isConfigured ? 'Configure API key to use Enhance' : 'Enhance prompt with AI (auto-improve)'}
              onClick={handleEnhance}
              disabled={!canEnhance}
              id="enhance-prompt-btn"
            >
              <span
                className={`material-symbols-outlined ${enhancing ? styles.enhanceSpin : ''}`}
                style={{ fontSize: 15, fontVariationSettings: enhanced ? "'FILL' 1" : "'FILL' 0" }}
              >
                {enhanced ? 'check' : 'auto_awesome'}
              </span>
              <span className={styles.enhanceBtnLabel}>
                {enhancing ? 'Enhancing…' : enhanced ? 'Enhanced!' : 'Enhance'}
              </span>
            </button>

            <div className={styles.divider} />
            <button
              className={`${styles.sendBtn} material-symbols-outlined`}
              onClick={handleSend}
              disabled={(!value.trim() && attachments.length === 0) || disabled || enhancing}
              title="Send (Enter)"
            >
              arrow_upward
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p className="t-label-sm">AI can make mistakes. Verify important info.</p>
        {contextWindow > 0 && (
          <div className={styles.tokenCounter} title={`~${usedTokens.toLocaleString()} / ${contextWindow.toLocaleString()} tokens`}>
            <div className={styles.tokenBar}>
              <div className={styles.tokenFill} style={{ width: `${usagePercent}%`, backgroundColor: usageColor }} />
            </div>
            <span className={styles.tokenLabel} style={{ color: usageRatio > 0.8 ? usageColor : undefined }}>
              ~{usedTokens > 1000 ? `${(usedTokens / 1000).toFixed(1)}k` : usedTokens} / {(contextWindow / 1000).toFixed(0)}k
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
