import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { Conversation } from '../types/chat';
import { useChat } from '../context/ChatContext';
import { formatRelativeDate } from '../utils/dateGroups';
import styles from './ConversationRow.module.css';

interface ConversationRowProps {
  conversation: Conversation;
}

export function ConversationRow({ conversation }: ConversationRowProps) {
  const { deleteConversation, pinConversation, renameConversation } = useChat();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conversation.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  const lastMsg = conversation.messages[conversation.messages.length - 1];
  const preview = lastMsg?.content.slice(0, 90) + (lastMsg && lastMsg.content.length > 90 ? '…' : '') || 'No messages yet';
  const msgCount = conversation.messages.length;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  useEffect(() => {
    if (renaming) renameRef.current?.focus();
  }, [renaming]);

  const handleOpen = () => {
    navigate({ to: '/chat/$conversationId', params: { conversationId: conversation.id } });
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (trimmed) renameConversation(conversation.id, trimmed);
    setRenaming(false);
  };

  const handleRenameKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') { setRenameValue(conversation.title); setRenaming(false); }
  };

  return (
    <div className={styles.row} onClick={!renaming ? handleOpen : undefined}>
      {/* Icon */}
      <div className={styles.iconCol}>
        <span className={`${styles.icon} material-symbols-outlined`}>
          {conversation.pinned ? 'push_pin' : 'chat_bubble_outline'}
        </span>
      </div>

      {/* Main content */}
      <div className={styles.body}>
        <div className={styles.titleRow}>
          {renaming ? (
            <input
              ref={renameRef}
              className={`${styles.renameInput} t-label-md`}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKey}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`${styles.title} t-label-md`}>{conversation.title}</span>
          )}
          <span className={`${styles.date} t-label-sm`}>
            {formatRelativeDate(conversation.updatedAt)}
          </span>
        </div>
        <div className={styles.previewRow}>
          <span className={`${styles.preview} t-body-md`}>{preview}</span>
          <span className={`${styles.count} t-label-sm`}>
            {msgCount > 0 && `${msgCount} msg${msgCount !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* Context menu button */}
      <div className={styles.menuWrapper} ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button
          className={`${styles.menuBtn} material-symbols-outlined`}
          onClick={() => setMenuOpen((o) => !o)}
          title="Options"
        >
          more_horiz
        </button>

        {menuOpen && (
          <div className={styles.menu}>
            <button
              className={styles.menuItem}
              onClick={() => { navigate({ to: '/chat/$conversationId', params: { conversationId: conversation.id } }); setMenuOpen(false); }}
            >
              <span className="material-symbols-outlined">open_in_new</span>
              Open
            </button>
            <button
              className={styles.menuItem}
              onClick={() => { setRenaming(true); setMenuOpen(false); }}
            >
              <span className="material-symbols-outlined">edit</span>
              Rename
            </button>
            <button
              className={styles.menuItem}
              onClick={() => { pinConversation(conversation.id); setMenuOpen(false); }}
            >
              <span className="material-symbols-outlined">
                {conversation.pinned ? 'push_pin' : 'keep'}
              </span>
              {conversation.pinned ? 'Unpin' : 'Pin'}
            </button>
            <div className={styles.menuDivider} />
            <button
              className={`${styles.menuItem} ${styles.menuItemDanger}`}
              onClick={() => { deleteConversation(conversation.id); setMenuOpen(false); }}
            >
              <span className="material-symbols-outlined">delete</span>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
