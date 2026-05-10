import { useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useChat } from '../context/ChatContext';
import { ConversationRow } from '../components/ConversationRow';
import { groupConversationsByDate } from '../utils/dateGroups';
import styles from './HistoryPage.module.css';

type FilterTab = 'all' | 'pinned';

export function HistoryPage() {
  const { conversations, createConversation } = useChat();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const filtered = useMemo(() => {
    let list = conversations;

    // Filter by tab
    if (filter === 'pinned') {
      list = list.filter((c) => c.pinned);
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }

    // Sort: pinned first, then by updatedAt desc
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [conversations, search, filter]);

  const groups = useMemo(() => groupConversationsByDate(filtered), [filtered]);

  const pinnedCount = conversations.filter((c) => c.pinned).length;

  const handleNewChat = () => {
    const id = createConversation();
    navigate({ to: '/chat/$conversationId', params: { conversationId: id } });
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.headerLeft}>
            <h1 className={`${styles.title} t-headline-md`}>History</h1>
            <span className={`${styles.totalBadge} t-label-sm`}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button className={styles.newBtn} onClick={handleNewChat}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            <span className="t-label-md">New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchRow}>
          <div className={styles.searchBar}>
            <span className={`${styles.searchIcon} material-symbols-outlined`}>search</span>
            <input
              type="text"
              className={`${styles.searchInput} t-body-md`}
              placeholder="Search conversations and messages…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="history-search"
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${filter === 'all' ? styles.tabActive : ''} t-label-md`}
            onClick={() => setFilter('all')}
          >
            All
            <span className={styles.tabCount}>{conversations.length}</span>
          </button>
          <button
            className={`${styles.tab} ${filter === 'pinned' ? styles.tabActive : ''} t-label-md`}
            onClick={() => setFilter('pinned')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>push_pin</span>
            Pinned
            {pinnedCount > 0 && <span className={styles.tabCount}>{pinnedCount}</span>}
          </button>
        </div>
      </header>

      {/* List */}
      <div className={`${styles.list} custom-scrollbar`}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <span className={`${styles.emptyIcon} material-symbols-outlined`}>
              {search ? 'search_off' : filter === 'pinned' ? 'push_pin' : 'chat_bubble_outline'}
            </span>
            <p className={`${styles.emptyTitle} t-label-md`}>
              {search
                ? `No results for "${search}"`
                : filter === 'pinned'
                ? 'No pinned conversations'
                : 'No conversations yet'}
            </p>
            <p className={`${styles.emptyHint} t-body-md`}>
              {search
                ? 'Try a different search term'
                : filter === 'pinned'
                ? 'Pin a conversation to keep it here'
                : 'Start a new chat to get going'}
            </p>
            {!search && filter === 'all' && (
              <button className={styles.emptyBtn} onClick={handleNewChat}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                Start a chat
              </button>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className={styles.group}>
              <div className={`${styles.groupLabel} t-label-sm`}>{group.label}</div>
              {group.conversations.map((conv) => (
                <ConversationRow key={conv.id} conversation={conv} />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Status bar */}
      {filtered.length > 0 && (
        <div className={styles.statusBar}>
          <span className="t-label-sm">
            Showing {filtered.length} of {conversations.length} conversations
            {search && ` matching "${search}"`}
          </span>
        </div>
      )}
    </div>
  );
}
