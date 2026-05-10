import { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useSettings } from '../context/SettingsContext';
import styles from './TopBar.module.css';

interface TopBarProps {
  title: string;
  showConnected?: boolean;
  conversationId?: string;
  activeTab?: 'recent' | 'pinned';
  onTabChange?: (tab: 'recent' | 'pinned') => void;
}

export function TopBar({ title, showConnected = false, conversationId, activeTab = 'recent', onTabChange }: TopBarProps) {
  const { clearConversation, renameConversation, conversations } = useChat();
  const { settings, updateSettings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExport = () => {
    if (!conversationId) return;
    const conv = conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const md = [
      `# ${conv.title}`,
      `> Exported: ${new Date().toLocaleString()}`,
      '',
      ...conv.messages.map(
        (m) => `**${m.role === 'user' ? 'You' : 'Assistant'}** — ${m.timestamp.toLocaleTimeString()}\n\n${m.content}\n`
      ),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conv.title.replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const handleClear = () => {
    if (!conversationId) return;
    if (confirm('Clear all messages in this conversation?')) {
      clearConversation(conversationId);
    }
    setMenuOpen(false);
  };

  const handleRenameStart = () => {
    setRenameValue(title);
    setRenaming(true);
    setMenuOpen(false);
  };

  const handleRenameSubmit = () => {
    if (conversationId && renameValue.trim()) {
      renameConversation(conversationId, renameValue.trim());
    }
    setRenaming(false);
  };

  const toggleTheme = () =>
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });

  const recentConvs = [...conversations]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        {renaming ? (
          <input
            className={`${styles.renameInput} t-headline-md`}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit();
              if (e.key === 'Escape') setRenaming(false);
            }}
            autoFocus
          />
        ) : (
          <span className={`${styles.title} t-headline-md`}>{title}</span>
        )}
        <nav className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'recent' ? styles.tabActive : ''} t-label-md`}
            onClick={() => onTabChange?.('recent')}
          >
            Recent
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'pinned' ? styles.tabActive : ''} t-label-md`}
            onClick={() => onTabChange?.('pinned')}
          >
            Pinned
          </button>
        </nav>
      </div>

      <div className={styles.right}>
        {showConnected && (
          <div className={styles.connectedBadge}>
            <span className={styles.connectedDot} />
            <span className="t-label-sm">Connected</span>
          </div>
        )}

        {/* ── Theme toggle ── */}
        <button
          id="theme-toggle-btn"
          className={`${styles.iconBtn} ${styles.themeBtn} material-symbols-outlined`}
          onClick={toggleTheme}
          title={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {settings.theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </button>

        {/* Notifications */}
        <div className={styles.menuWrapper} ref={notifRef}>
          <button
            id="notifications-btn"
            className={`${styles.iconBtn} material-symbols-outlined`}
            onClick={() => { setNotifOpen((o) => !o); setMenuOpen(false); }}
          >
            notifications
          </button>
          {notifOpen && (
            <div className={styles.notifPanel}>
              <div className={`${styles.panelHeader} t-label-sm`}>Recent Activity</div>
              {recentConvs.length === 0 ? (
                <div className={styles.panelEmpty}>No conversations yet</div>
              ) : (
                recentConvs.map((c) => (
                  <div key={c.id} className={styles.notifItem}>
                    <span className={`${styles.notifIcon} material-symbols-outlined`}>chat_bubble_outline</span>
                    <div className={styles.notifBody}>
                      <span className={`${styles.notifTitle} t-label-md`}>{c.title}</span>
                      <span className={`${styles.notifTime} t-label-sm`}>
                        {c.messages.length} msg{c.messages.length !== 1 ? 's' : ''} · {c.updatedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* More options */}
        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            id="more-options-btn"
            className={`${styles.iconBtn} material-symbols-outlined`}
            onClick={() => { setMenuOpen((o) => !o); setNotifOpen(false); }}
          >
            more_vert
          </button>
          {menuOpen && conversationId && (
            <div className={styles.dropMenu}>
              <button className={styles.menuItem} onClick={handleRenameStart}>
                <span className="material-symbols-outlined">edit</span> Rename
              </button>
              <button className={styles.menuItem} onClick={handleExport}>
                <span className="material-symbols-outlined">download</span> Export as Markdown
              </button>
              <div className={styles.menuDivider} />
              <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={handleClear}>
                <span className="material-symbols-outlined">delete_sweep</span> Clear conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
