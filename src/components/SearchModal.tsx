import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useChat } from '../context/ChatContext';
import styles from './SearchModal.module.css';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const { conversations } = useChat();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Global Cmd+K / Ctrl+K shortcut is handled by Sidebar, not here.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations.slice(0, 8).map((c) => ({ conv: c, snippet: null as string | null }));

    const hits: { conv: typeof conversations[0]; snippet: string | null }[] = [];
    for (const conv of conversations) {
      const titleMatch = conv.title.toLowerCase().includes(q);
      const matchingMsg = conv.messages.find((m) => m.content.toLowerCase().includes(q));
      if (titleMatch || matchingMsg) {
        const idx = matchingMsg?.content.toLowerCase().indexOf(q) ?? -1;
        const snippet = matchingMsg
          ? matchingMsg.content.slice(Math.max(0, idx - 30), idx + 80)
          : null;
        hits.push({ conv, snippet });
      }
    }
    return hits.slice(0, 12);
  }, [query, conversations]);

  const handleSelect = (conversationId: string) => {
    navigate({ to: '/chat/$conversationId', params: { conversationId } });
    onClose();
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.inputRow}>
          <span className={`${styles.searchIcon} material-symbols-outlined`}>search</span>
          <input
            ref={inputRef}
            id="search-modal-input"
            type="text"
            className={`${styles.input} t-body-lg`}
            placeholder="Search conversations and messages…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <kbd className={styles.escKey}>Esc</kbd>
        </div>

        <div className={styles.divider} />

        <div className={styles.results}>
          {results.length === 0 ? (
            <div className={styles.empty}>
              <span className={`${styles.emptyIcon} material-symbols-outlined`}>search_off</span>
              <span className="t-body-md">No results for "{query}"</span>
            </div>
          ) : (
            <>
              {!query && (
                <div className={`${styles.groupLabel} t-label-sm`}>Recent conversations</div>
              )}
              {results.map(({ conv, snippet }) => (
                <button
                  key={conv.id}
                  className={styles.resultItem}
                  onClick={() => handleSelect(conv.id)}
                >
                  <span className={`${styles.resultIcon} material-symbols-outlined`}>
                    {conv.pinned ? 'push_pin' : 'chat_bubble_outline'}
                  </span>
                  <div className={styles.resultBody}>
                    <span className={`${styles.resultTitle} t-label-md`}>{conv.title}</span>
                    {snippet && (
                      <span className={`${styles.resultSnippet} t-body-md`}>…{snippet}…</span>
                    )}
                  </div>
                  <span className={`${styles.resultArrow} material-symbols-outlined`}>arrow_forward</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className={styles.footer}>
          <span className="t-label-sm">
            <kbd className={styles.kbd}>↑↓</kbd> navigate
            <kbd className={styles.kbd}>↵</kbd> open
            <kbd className={styles.kbd}>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
