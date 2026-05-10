import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import tsx        from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import jsx        from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import python     from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import bash       from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import json       from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import css        from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import sql        from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml       from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import rust       from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import go         from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java       from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import cpp        from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import prismMd    from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import type { Message } from '../types/chat';
import { useChat } from '../context/ChatContext';
import { formatTime } from '../utils/helpers';
import styles from './MessageBubble.module.css';

// Register only the languages we need (PrismLight tree-shakes the rest)
SyntaxHighlighter.registerLanguage('tsx',        tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts',         typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js',         javascript);
SyntaxHighlighter.registerLanguage('jsx',        jsx);
SyntaxHighlighter.registerLanguage('python',     python);
SyntaxHighlighter.registerLanguage('py',         python);
SyntaxHighlighter.registerLanguage('bash',       bash);
SyntaxHighlighter.registerLanguage('sh',         bash);
SyntaxHighlighter.registerLanguage('shell',      bash);
SyntaxHighlighter.registerLanguage('json',       json);
SyntaxHighlighter.registerLanguage('css',        css);
SyntaxHighlighter.registerLanguage('sql',        sql);
SyntaxHighlighter.registerLanguage('yaml',       yaml);
SyntaxHighlighter.registerLanguage('yml',        yaml);
SyntaxHighlighter.registerLanguage('rust',       rust);
SyntaxHighlighter.registerLanguage('go',         go);
SyntaxHighlighter.registerLanguage('java',       java);
SyntaxHighlighter.registerLanguage('cpp',        cpp);
SyntaxHighlighter.registerLanguage('c',          cpp);
SyntaxHighlighter.registerLanguage('markdown',   prismMd);
SyntaxHighlighter.registerLanguage('md',         prismMd);


interface MessageBubbleProps {
  message: Message;
  conversationId: string;
  isStreaming?: boolean;
}

export function MessageBubble({ message, conversationId, isStreaming }: MessageBubbleProps) {
  const { regenerateLastResponse, setMessageFeedback, editMessage } = useChat();
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      editRef.current?.focus();
      // Auto-resize on open
      const el = editRef.current;
      if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
    }
  }, [editing]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleFeedback = (type: 'up' | 'down') => {
    setMessageFeedback(conversationId, message.id, message.feedback === type ? null : type);
  };

  const handleEditSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) {
      editMessage(conversationId, message.id, trimmed);
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
    if (e.key === 'Escape') { setEditValue(message.content); setEditing(false); }
  };

  return (
    <div className={`${styles.wrapper} ${!isUser ? styles.aiWrapper : ''}`}>
      {/* Avatar */}
      <div className={styles.avatarCol}>
        {isUser ? (
          <div className={styles.userAvatar}>Y</div>
        ) : (
          <div className={styles.aiAvatar}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: 18 }}>smart_toy</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={`${styles.name} ${isUser ? styles.nameUser : styles.nameAi} t-label-md`}>
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className={styles.time}>{formatTime(message.timestamp)}</span>
          {isUser && !isStreaming && (
            <button
              className={styles.editTrigger}
              onClick={() => { setEditValue(message.content); setEditing(true); }}
              title="Edit message"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
            </button>
          )}
        </div>

        {/* Attachments */}
        {message.attachments?.map((att) => (
          <div key={att.name} className={styles.attachment}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>attach_file</span>
            <span className="t-label-sm">{att.name}</span>
          </div>
        ))}

        {/* Inline edit mode */}
        {editing ? (
          <div className={styles.editContainer}>
            <textarea
              ref={editRef}
              className={styles.editTextarea}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleEditKeyDown}
            />
            <div className={styles.editActions}>
              <span className={styles.editHint}>Enter to save · Esc to cancel</span>
              <button className={styles.editCancelBtn} onClick={() => { setEditValue(message.content); setEditing(false); }}>
                Cancel
              </button>
              <button className={styles.editSaveBtn} onClick={handleEditSubmit}>
                Save & Regenerate
              </button>
            </div>
          </div>
        ) : (
          /* Normal display */
          <div className={`${styles.body} ${isUser ? styles.bodyUser : styles.bodyAi}`}>
            {isUser ? (
              <p className="t-body-lg" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                {message.content}
                {isStreaming && <span className={styles.cursor} />}
              </p>
            ) : (
              <div className={styles.markdown}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children }) {
                      const match = /language-(\w+)/.exec(className ?? '');
                      const code = String(children).replace(/\n$/, '');
                      const isBlock = match || code.includes('\n');
                      if (!isBlock) return <code className={styles.inlineCode}>{children}</code>;
                      const lang = match?.[1] ?? 'text';
                      return (
                        <div className={styles.codeWrapper}>
                          <div className={styles.codeHeader}>
                            <span className={styles.codeLang}>{lang}</span>
                            <button className={styles.codeCopyBtn} onClick={() => handleCopyCode(code)}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                {copiedCode === code ? 'check' : 'content_copy'}
                              </span>
                              {copiedCode === code ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <SyntaxHighlighter
                            style={oneDark} language={lang} PreTag="div"
                            customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px', lineHeight: '1.6', background: 'rgba(0,0,0,0.35)' }}
                          >
                            {code}
                          </SyntaxHighlighter>
                        </div>
                      );
                    },
                    table({ children }) { return <div className={styles.tableWrapper}><table className={styles.table}>{children}</table></div>; },
                    blockquote({ children }) { return <blockquote className={styles.blockquote}>{children}</blockquote>; },
                    hr() { return <hr className={styles.hr} />; },
                    a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" className={styles.link}>{children}</a>; },
                  }}
                >
                  {message.content + (isStreaming ? '▍' : '')}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* AI action buttons */}
        {!isUser && !isStreaming && !editing && (
          <div className={styles.actions}>
            <button className={`${styles.actionBtn} material-symbols-outlined`} title={message.feedback === 'up' ? 'Remove' : 'Good response'} onClick={() => handleFeedback('up')} style={message.feedback === 'up' ? { color: 'var(--color-primary)' } : undefined}>thumb_up</button>
            <button className={`${styles.actionBtn} material-symbols-outlined`} title={message.feedback === 'down' ? 'Remove' : 'Bad response'} onClick={() => handleFeedback('down')} style={message.feedback === 'down' ? { color: 'var(--color-error)' } : undefined}>thumb_down</button>
            <button className={`${styles.actionBtn} material-symbols-outlined`} title={copied ? 'Copied!' : 'Copy'} onClick={handleCopy} style={copied ? { color: 'var(--color-primary)' } : undefined}>{copied ? 'check' : 'content_copy'}</button>
            <button className={`${styles.actionBtn} material-symbols-outlined`} title="Regenerate" onClick={() => regenerateLastResponse(conversationId)}>refresh</button>
          </div>
        )}
      </div>
    </div>
  );
}
