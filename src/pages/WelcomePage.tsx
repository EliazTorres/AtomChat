import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useChat } from '../context/ChatContext';
import { TopBar } from '../components/TopBar';
import { SUGGESTED_PROMPTS, type SuggestedPrompt } from '../constants/suggestedPrompts';
import type { MessageAttachment } from '../types/chat';
import styles from './WelcomePage.module.css';

export function WelcomePage() {
  const { createConversation, sendMessage } = useChat();
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [activePrompt, setActivePrompt] = useState<SuggestedPrompt | null>(null);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [dragging, setDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus textarea on mount
  useEffect(() => { textareaRef.current?.focus(); }, []);

  // Cmd+K focuses the composer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Auto-resize textarea
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  };
  useEffect(() => { autoResize(); }, [text]);

  // Handle sending
  const handleSend = () => {
    const parts: string[] = [];
    if (activePrompt) parts.push(activePrompt.template);
    if (text.trim()) parts.push(text.trim());
    const fullText = parts.join('\n\n');
    if (!fullText && attachments.length === 0) return;

    const id = createConversation();
    sendMessage(id, fullText || '(attachment)', attachments.length > 0 ? attachments : undefined);
    navigate({ to: '/chat/$conversationId', params: { conversationId: id } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // Prompt tag: click = select, click again = deselect
  const handlePromptClick = (p: SuggestedPrompt) => {
    setActivePrompt((prev) => (prev?.id === p.id ? null : p));
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  // File handling
  const processFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const results: MessageAttachment[] = [];
    for (const file of list) {
      try {
        const content = await file.text();
        results.push({ name: file.name, type: file.type || 'text/plain', content });
      } catch {
        results.push({ name: file.name, type: file.type, content: '[Binary file — cannot preview]' });
      }
    }
    setAttachments((prev) => [...prev, ...results]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
    e.target.value = '';
  };

  const removeAttachment = (name: string) =>
    setAttachments((prev) => prev.filter((a) => a.name !== name));

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  };

  const hasContent = !!activePrompt || text.trim().length > 0 || attachments.length > 0;

  return (
    <div className={styles.page}>
      <TopBar title="Atom Chat" />

      <div className={styles.bgGlow} />

      <section className={styles.center}>
        {/* Logo */}
        <div className={styles.logoBox}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: 'var(--color-primary)' }}>terminal</span>
        </div>

        <div className={styles.heading}>
          <h2 className={`${styles.title} t-headline-lg`}>How can I help you build today?</h2>
          <p className={`${styles.subtitle} t-body-lg`}>
            Your intelligent workspace for code, logic, and creative problem solving.
          </p>
        </div>

        {/* Prompt cards */}
        <div className={styles.promptGrid}>
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p.id}
              className={`${styles.promptCard} ${activePrompt?.id === p.id ? styles.promptCardActive : ''}`}
              onClick={() => handlePromptClick(p)}
              title={activePrompt?.id === p.id ? 'Click to remove' : 'Click to select as context'}
            >
              <span className={`${styles.promptIcon} material-symbols-outlined`}
                style={{ fontVariationSettings: activePrompt?.id === p.id ? "'FILL' 1" : "'FILL' 0" }}>
                {p.icon}
              </span>
              <div className={styles.promptText}>
                <span className={`${styles.promptTitle} t-label-md`}>{p.title}</span>
                <span className={`${styles.promptDesc} t-body-md`}>{p.description}</span>
              </div>
              {activePrompt?.id === p.id && (
                <span className={`${styles.promptCheck} material-symbols-outlined`}>check_circle</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Rich composer ───────────────────────────────── */}
        <div
          className={`${styles.composer} ${hasContent ? styles.composerActive : ''} ${dragging ? styles.composerDragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Active prompt tag */}
          {activePrompt && (
            <div className={styles.tagRow}>
              <div className={styles.promptTag}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>
                  {activePrompt.icon}
                </span>
                <span className={styles.tagLabel}>@{activePrompt.title}</span>
                <button
                  className={styles.tagRemove}
                  onClick={() => setActivePrompt(null)}
                  title="Remove"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                </button>
              </div>
            </div>
          )}

          {/* Attachment pills */}
          {attachments.length > 0 && (
            <div className={styles.attachRow}>
              {attachments.map((att) => (
                <div key={att.name} className={styles.attachPill}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                    {att.type.startsWith('image/') ? 'image' : att.type.includes('json') ? 'data_object' : 'description'}
                  </span>
                  <span className={styles.attachName}>{att.name}</span>
                  <span className={styles.attachSize}>{(att.content.length / 1024).toFixed(1)}kb</span>
                  <button className={styles.attachRemove} onClick={() => removeAttachment(att.name)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Drag overlay */}
          {dragging && (
            <div className={styles.dragOverlay}>
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>upload_file</span>
              <span className="t-label-md">Drop files to attach</span>
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id="welcome-input"
            className={`${styles.composerTextarea} t-body-md`}
            placeholder={activePrompt
              ? `Add context for "${activePrompt.title}"… (Shift+Enter for new line)`
              : 'Ask anything or describe what you want to build… (Shift+Enter for new line)'}
            value={text}
            rows={1}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Bottom toolbar */}
          <div className={styles.composerToolbar}>
            <div className={styles.toolbarLeft}>
              {/* File attach */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.py,.html,.css,.xml,.yaml,.yml,.log,.sh,.sql,.rs,.go,.java,.c,.cpp,.h"
              />
              <button
                className={styles.toolbarBtn}
                onClick={() => fileInputRef.current?.click()}
                title="Attach file (or drag & drop)"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>attach_file</span>
                <span className={styles.toolbarBtnLabel}>Attach</span>
              </button>

              {/* Drag hint */}
              <span className={styles.dragHint}>or drag & drop files</span>
            </div>

            <div className={styles.toolbarRight}>
              {!hasContent && (
                <div className={styles.kbdGroup}>
                  <kbd className={styles.kbd}>⌘</kbd>
                  <kbd className={styles.kbd}>K</kbd>
                </div>
              )}
              <button
                className={`${styles.sendBtn} ${hasContent ? styles.sendBtnActive : ''}`}
                onClick={handleSend}
                disabled={!hasContent}
                title="Send (Enter)"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <span className={styles.statusRow}>
            <span className={styles.statusDot} />
            <span className="t-label-sm">System Online</span>
          </span>
          <span className={`${styles.version} t-code`}>v4.1.0-stable</span>
        </div>
        <div className={styles.footerRight}>
          <a href="#" className={`${styles.footerLink} t-label-sm`}>Privacy</a>
          <a href="#" className={`${styles.footerLink} t-label-sm`}>Terms</a>
          <a href="#" className={`${styles.footerLink} t-label-sm`}>API Docs</a>
        </div>
      </footer>
    </div>
  );
}
