import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from '@tanstack/react-router';
import { useChat } from '../context/ChatContext';
import { useSettings } from '../context/SettingsContext';
import { SearchModal } from './SearchModal';
import styles from './Sidebar.module.css';


const NAV_ITEMS = [
  { id: 'search', icon: 'search', label: 'Search', path: null, action: 'search' },
  { id: 'chat', icon: 'chat', label: 'Chat', path: '/', action: null },
  { id: 'history', icon: 'history', label: 'History', path: '/history', action: null },
  { id: 'workspaces', icon: 'work', label: 'Workspaces', path: '/workspaces', action: null },
  { id: 'settings', icon: 'settings', label: 'Settings', path: '/settings', action: null },
];

/** Support / status-page URLs keyed by provider id */
const SUPPORT_URLS: Record<string, string> = {
  openai:     'https://status.openai.com',
  anthropic:  'https://status.anthropic.com',
  gemini:     'https://status.cloud.google.com',
  deepseek:   'https://platform.deepseek.com',
  groq:       'https://groqstatus.com',
  together:   'https://status.together.ai',
  qwen:       'https://bailian.console.aliyun.com',
  kimi:       'https://platform.moonshot.cn',
  custom:     '',
};

const MAX_RECENT = 8;

export function Sidebar({ onShortcuts: _onShortcuts }: { onShortcuts?: () => void }) {

  const { createConversation, conversations, deleteConversation, pinConversation, renameConversation } = useChat();
  const { isConfigured, settings, provider } = useSettings();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [hoveredConvId, setHoveredConvId] = useState<string | null>(null);
  const [recentOpen, setRecentOpen] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  // Recent conversations sorted by updatedAt, pinned first
  const recentConvs = [...conversations]
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    })
    .slice(0, MAX_RECENT);

  // Global Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleNewChat = () => {
    const id = createConversation();
    navigate({ to: '/chat/$conversationId', params: { conversationId: id } });
  };

  const isActive = (path: string | null) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isConvActive = (id: string) => location.pathname === `/chat/${id}`;

  return (
    <>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      <aside className={styles.sidebar}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            </div>
            <div>
              <h1 className={`${styles.appName} t-headline-md`}>Atom Chat</h1>
              <p className={`${styles.appSub} t-label-sm`}>Power User Mode</p>
            </div>
          </div>
          <button className={styles.newChatBtn} onClick={handleNewChat} id="new-chat-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            <span className="t-label-md">New Chat</span>
          </button>
        </div>

        {/* Nav */}
        <nav className={`${styles.nav} custom-scrollbar`}>
          {/* Main nav items */}
          <div className={styles.navGroup}>
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.path);
              const showBadge = item.id === 'settings' && !isConfigured;

              if (item.action === 'search') {
                return (
                  <button key={item.id} className={styles.navItem} onClick={() => setSearchOpen(true)} id="sidebar-search-btn">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="t-body-md">{item.label}</span>
                    <kbd className={styles.shortcutKey}>⌘K</kbd>
                  </button>
                );
              }
              if (item.path) {
                return (
                  <Link key={item.id} to={item.path} className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}>
                    <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{item.icon}</span>
                    <span className="t-body-md">{item.label}</span>
                    {showBadge && <span className={styles.warningDot} />}
                  </Link>
                );
              }
              return (
                <div key={item.id} className={styles.navItem}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="t-body-md">{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Recent conversations */}
          {recentConvs.length > 0 && (
            <div className={styles.recentSection}>
              <button
                className={styles.recentHeader}
                onClick={() => setRecentOpen((o) => !o)}
              >
                <span className={`${styles.recentLabel} t-label-sm`}>Recent</span>
                <span className={`material-symbols-outlined ${styles.recentChevron} ${recentOpen ? styles.recentChevronOpen : ''}`} style={{ fontSize: 14 }}>
                  chevron_right
                </span>
              </button>
              {recentOpen && (
                <div className={styles.recentList}>
                  {recentConvs.map((conv) => (
                    <div
                                    key={conv.id}
                      className={`${styles.recentItem} ${isConvActive(conv.id) ? styles.recentItemActive : ''}`}
                      onMouseEnter={() => setHoveredConvId(conv.id)}
                      onMouseLeave={() => setHoveredConvId(null)}
                    >
                      {renamingId === conv.id ? (
                        <div className={styles.recentRename}>
                          <input
                            ref={renameInputRef}
                            className={styles.recentRenameInput}
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => {
                              if (renameValue.trim()) renameConversation(conv.id, renameValue.trim());
                              setRenamingId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (renameValue.trim()) renameConversation(conv.id, renameValue.trim());
                                setRenamingId(null);
                              }
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                          />
                        </div>
                      ) : (
                        <Link
                          to="/chat/$conversationId"
                          params={{ conversationId: conv.id }}
                          className={styles.recentLink}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            setRenameValue(conv.title);
                            setRenamingId(conv.id);
                          }}
                        >
                          {conv.pinned && (
                            <span className={`${styles.pinIcon} material-symbols-outlined`} style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                          )}
                          <span className={`${styles.recentTitle} t-label-md`}>{conv.title}</span>
                          <span className={`${styles.recentCount} t-label-sm`}>
                            {conv.messages.length}
                          </span>
                        </Link>
                      )}
                      {hoveredConvId === conv.id && (
                        <div className={styles.recentActions}>
                          <button
                            className={`${styles.recentActionBtn} material-symbols-outlined`}
                            onClick={(e) => { e.stopPropagation(); pinConversation(conv.id); }}
                            title={conv.pinned ? 'Unpin' : 'Pin'}
                          >
                            {conv.pinned ? 'keep_off' : 'keep'}
                          </button>
                          <button
                            className={`${styles.recentActionBtn} ${styles.recentActionDanger} material-symbols-outlined`}
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                            title="Delete"
                          >
                            close
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {conversations.length > MAX_RECENT && (
                    <Link to="/history" className={styles.seeAll}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>expand_more</span>
                      See all {conversations.length} conversations
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Resources — dynamic per active provider */}
          <div className={styles.resourcesSection}>
            <div className={`${styles.resourcesLabel} t-label-sm`}>Resources</div>
            {[
              provider.docsUrl && {
                id: 'docs',
                icon: 'description',
                label: `${provider.name} Docs`,
                href: provider.docsUrl,
              },
              SUPPORT_URLS[provider.id] && {
                id: 'support',
                icon: 'help_outline',
                label: 'Status / Support',
                href: SUPPORT_URLS[provider.id],
              },
            ]
              .filter(Boolean)
              .map((item) => {
                const it = item as { id: string; icon: string; label: string; href: string };
                return (
                  <a key={it.id} href={it.href} target="_blank" rel="noopener noreferrer" className={styles.navItem}>
                    <span className="material-symbols-outlined">{it.icon}</span>
                    <span className="t-body-md">{it.label}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, marginLeft: 'auto', color: 'var(--color-outline)' }}>open_in_new</span>
                  </a>
                );
              })}
          </div>
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          {isConfigured ? (() => {
              const modelEntry = provider.models.find((m) => m.id === settings.model);
              const modelName = provider.id === 'custom'
                ? (settings.customModelId || 'custom model')
                : (modelEntry?.name ?? settings.model.split('/').pop() ?? settings.model);
              // Truncate very long model names
              const shortModel = modelName.length > 22 ? modelName.slice(0, 20) + '…' : modelName;
              return (
                <div className={styles.providerBadge}>
                  <span className={styles.providerDot} />
                  <span className="t-label-sm">
                    {provider.name} · {shortModel}
                  </span>
                </div>
              );
            })() : (
            <Link to="/settings" className={styles.configureHint}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
              <span className="t-label-sm">Configure API key</span>
            </Link>
          )}
          <div className={styles.userRow}>
            <div className={styles.userAvatar}>U</div>
            <div className={styles.userInfo}>
              <p className={`${styles.userName} t-label-md`}>You</p>
              <p className={`${styles.userPlan} t-label-sm`}>FREE PLAN</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
