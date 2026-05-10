import { useState, useEffect, Suspense } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Sidebar } from '../components/Sidebar';
import { ShortcutsModal } from '../components/ShortcutsModal';
import styles from './RootLayout.module.css';

export function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Global ? shortcut — only when not focused in an input/textarea
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === '?') setShortcutsOpen((o) => !o);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);


  return (
    <div className={styles.layout}>
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Hamburger button — mobile only */}
      <button
        className={styles.hamburger}
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle sidebar"
        id="hamburger-btn"
      >
        <span className="material-symbols-outlined">menu</span>
      </button>

      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarVisible : ''}`}>
        <Sidebar onShortcuts={() => setShortcutsOpen(true)} />
      </div>

      <main className={styles.main}>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)', fontSize: 13, fontFamily: 'Inter, sans-serif', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span>
            Loading…
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
