import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Conversation, Message, MessageAttachment } from '../types/chat';
import { generateId } from '../utils/helpers';
import { streamCompletion } from '../services/aiService';
import type { ChatMessage } from '../services/aiService';
import type { AISettings } from './SettingsContext';
import type { AIProvider } from '../services/aiProviders';

const STORAGE_KEY = 'ai-chat-conversations';

// ── Serialization ───────────────────────────────────────────
function serializeConversations(convs: Conversation[]): string {
  return JSON.stringify(convs);
}

function deserializeConversations(raw: string): Conversation[] {
  const parsed = JSON.parse(raw);
  return parsed.map((c: Conversation) => ({
    ...c,
    createdAt: new Date(c.createdAt),
    updatedAt: new Date(c.updatedAt),
    messages: c.messages.map((m: Message) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    })),
  }));
}

function loadFromStorage(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return deserializeConversations(raw);
  } catch { /* ignore */ }
  return [];
}

// ── Context types ───────────────────────────────────────────
interface ChatContextType {
  conversations: Conversation[];
  getConversation: (id: string) => Conversation | undefined;
  sendMessage: (conversationId: string, content: string, attachments?: MessageAttachment[]) => void;
  regenerateLastResponse: (conversationId: string) => void;
  editMessage: (conversationId: string, messageId: string, newContent: string) => void;
  setMessageFeedback: (conversationId: string, messageId: string, feedback: 'up' | 'down' | null) => void;
  clearConversation: (conversationId: string) => void;
  createConversation: (workspaceId?: string) => string;
  deleteConversation: (id: string) => void;
  pinConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  isTyping: boolean;
  streamingMessageId: string | null;
  typingConversationId: string | null;
}

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
  getAIConfig: () => { settings: AISettings; provider: AIProvider; isConfigured: boolean };
}

export function ChatProvider({ children, getAIConfig }: ChatProviderProps) {
  const [conversations, setConversations] = useState<Conversation[]>(loadFromStorage);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [typingConversationId, setTypingConversationId] = useState<string | null>(null);

  // Persist on every change (debounced slightly to avoid hammering localStorage)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, serializeConversations(conversations));
      } catch (e) {
        // If quota exceeded, remove oldest conversations
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          const trimmed = conversations.slice(0, Math.floor(conversations.length / 2));
          localStorage.setItem(STORAGE_KEY, serializeConversations(trimmed));
        }
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [conversations]);

  const getConversation = (id: string) => conversations.find((c) => c.id === id);

  const doSend = async (
    conversationId: string,
    content: string,
    history: ChatMessage[],
    attachments?: MessageAttachment[]
  ) => {
    const { settings, provider, isConfigured } = getAIConfig();

    if (!isConfigured) {
      const errMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '⚠️ No AI provider configured. Go to **Settings** to add your API key.',
        timestamp: new Date(),
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...c.messages, errMsg], updatedAt: new Date() }
            : c
        )
      );
      return;
    }

    const aiMsgId = generateId();
    const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '', timestamp: new Date() };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, aiMsg], updatedAt: new Date() }
          : c
      )
    );

    setIsTyping(true);
    setStreamingMessageId(aiMsgId);
    setTypingConversationId(conversationId);

    // Include attachment content inline
    let userContent = content;
    if (attachments?.length) {
      const attachText = attachments
        .map((a) => `\n\n<file name="${a.name}">\n${a.content}\n</file>`)
        .join('');
      userContent += attachText;
    }

    // Context window management: keep recent messages within ~90% of context window
    const modelCtx = provider.models.find((m) => m.id === settings.model)?.contextWindow ?? 8000;
    const maxChars = Math.floor(modelCtx * 3.5 * 0.85); // rough chars estimate
    let totalChars = userContent.length;
    const trimmedHistory: ChatMessage[] = [];
    for (let i = history.length - 1; i >= 0; i--) {
      totalChars += history[i].content.length;
      if (totalChars > maxChars) break;
      trimmedHistory.unshift(history[i]);
    }

    const apiMessages: ChatMessage[] = [...trimmedHistory, { role: 'user', content: userContent }];
    const model = provider.id === 'custom' ? settings.customModelId || 'gpt-4o-mini' : settings.model;

    await streamCompletion(
      provider, settings.apiKey, model, apiMessages, settings.systemPrompt, settings.customBaseUrl,
      {
        onChunk: (text) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== conversationId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, content: m.content + text } : m
                ),
              };
            })
          );
        },
        onDone: () => { setIsTyping(false); setStreamingMessageId(null); setTypingConversationId(null); },
        onError: (error) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== conversationId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMsgId ? { ...m, content: `⚠️ Error: ${error.message}` } : m
                ),
              };
            })
          );
          setIsTyping(false); setStreamingMessageId(null); setTypingConversationId(null);
        },
      }
    );
  };

  const sendMessage = async (
    conversationId: string,
    content: string,
    attachments?: MessageAttachment[]
  ) => {
    const userMsg: Message = {
      id: generateId(), role: 'user', content, timestamp: new Date(), attachments,
    };
    let history: ChatMessage[] = [];

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        history = c.messages.map((m) => ({ role: m.role, content: m.content }));
        const isFirst = c.messages.length === 0;
        const title = isFirst ? content.slice(0, 48) + (content.length > 48 ? '…' : '') : c.title;
        return { ...c, messages: [...c.messages, userMsg], updatedAt: new Date(), title };
      })
    );

    await doSend(conversationId, content, history, attachments);
  };

  const editMessage = async (conversationId: string, messageId: string, newContent: string) => {
    let history: ChatMessage[] = [];
    let found = false;

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const idx = c.messages.findIndex((m) => m.id === messageId);
        if (idx === -1) return c;
        found = true;
        // Update the message and drop everything after it
        const msgs = [
          ...c.messages.slice(0, idx),
          { ...c.messages[idx], content: newContent },
        ];
        history = msgs.slice(0, idx).map((m) => ({ role: m.role, content: m.content }));
        return { ...c, messages: msgs, updatedAt: new Date() };
      })
    );

    if (found && newContent.trim()) {
      await doSend(conversationId, newContent, history);
    }
  };

  const regenerateLastResponse = async (conversationId: string) => {
    let lastUserContent = '';
    let history: ChatMessage[] = [];

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const msgs = [...c.messages];
        while (msgs.length && msgs[msgs.length - 1].role === 'assistant') msgs.pop();
        const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
        lastUserContent = lastUser?.content ?? '';
        history = msgs.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
        return { ...c, messages: msgs, updatedAt: new Date() };
      })
    );

    if (lastUserContent) await doSend(conversationId, lastUserContent, history);
  };

  const setMessageFeedback = (
    conversationId: string,
    messageId: string,
    feedback: 'up' | 'down' | null
  ) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          messages: c.messages.map((m) => (m.id === messageId ? { ...m, feedback } : m)),
        };
      })
    );
  };

  const clearConversation = (id: string) =>
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, messages: [], updatedAt: new Date() } : c))
    );

  const createConversation = (workspaceId?: string): string => {
    const id = `conv-${Date.now()}`;
    setConversations((prev) => [
      { id, title: 'New Chat', messages: [], createdAt: new Date(), updatedAt: new Date(), workspaceId },
      ...prev,
    ]);
    return id;
  };

  const deleteConversation = (id: string) =>
    setConversations((prev) => prev.filter((c) => c.id !== id));

  const pinConversation = (id: string) =>
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
    );

  const renameConversation = (id: string, title: string) =>
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );

  return (
    <ChatContext.Provider
      value={{
        conversations, getConversation, sendMessage, regenerateLastResponse,
        editMessage, setMessageFeedback, clearConversation, createConversation,
        deleteConversation, pinConversation, renameConversation,
        isTyping, streamingMessageId, typingConversationId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
