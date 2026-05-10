import { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useChat } from '../context/ChatContext';
import { TopBar } from '../components/TopBar';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import type { MessageAttachment } from '../types/chat';
import styles from './ChatPage.module.css';

export function ChatPage() {
  const { conversationId } = useParams({ from: '/chat/$conversationId' });
  const { getConversation, sendMessage, isTyping, streamingMessageId } = useChat();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'recent' | 'pinned'>('recent');

  const conversation = getConversation(conversationId);

  useEffect(() => {
    if (!conversation) navigate({ to: '/' });
  }, [conversation, navigate]);

  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [conversation?.messages.length]);

  if (!conversation) return null;

  const handleSend = (content: string, attachments?: MessageAttachment[]) => {
    sendMessage(conversationId, content, attachments);
  };

  const displayMessages = activeTab === 'pinned'
    ? conversation.messages.filter((m) => m.feedback === 'up')
    : conversation.messages;

  return (
    <div className={styles.page}>
      <TopBar
        title={conversation.title}
        showConnected
        conversationId={conversationId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <section className={`${styles.thread} custom-scrollbar`}>
        <div className={styles.threadInner}>
          {displayMessages.length === 0 && activeTab === 'pinned' ? (
            <div className={styles.pinEmpty}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline-variant)' }}>thumb_up</span>
              <p className="t-body-md" style={{ color: 'var(--color-text-secondary)' }}>
                Thumbs-up a message to pin it here.
              </p>
            </div>
          ) : (
            displayMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                conversationId={conversationId}
                isStreaming={msg.id === streamingMessageId}
              />
            ))
          )}

          {isTyping && !streamingMessageId && (
            <div className={styles.typingRow}>
              <div className={styles.typingDots}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span className={`${styles.typingText} t-label-sm`}>AI is typing…</span>
            </div>
          )}
        </div>
      </section>

      <MessageInput
        onSend={handleSend}
        disabled={isTyping}
        conversationTokenEstimate={conversation.messages.reduce((s, m) => s + m.content.length, 0)}
      />
    </div>
  );
}
