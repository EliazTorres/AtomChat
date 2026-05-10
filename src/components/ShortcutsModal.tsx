import { useEffect } from 'react';
import styles from './ShortcutsModal.module.css';


interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { category: 'Navigation', items: [
    { keys: ['⌘', 'K'], desc: 'Open search / focus input' },
    { keys: ['?'], desc: 'Show keyboard shortcuts' },
    { keys: ['Esc'], desc: 'Close modals & panels' },
  ]},
  { category: 'Chat', items: [
    { keys: ['Enter'], desc: 'Send message' },
    { keys: ['Shift', 'Enter'], desc: 'New line in message' },
    { keys: ['⌘', 'Enter'], desc: 'Send message (alternative)' },
  ]},
  { category: 'Messages', items: [
    { keys: ['Click ✏'], desc: 'Edit a user message' },
    { keys: ['Click ↺'], desc: 'Regenerate last response' },
    { keys: ['Click ⎘'], desc: 'Copy message' },
    { keys: ['Click 👍/👎'], desc: 'Feedback / pin to Pinned tab' },
  ]},
  { category: 'Sidebar', items: [
    { keys: ['Hover'], desc: 'Show pin / delete on recent chats' },
    { keys: ['Dbl-click'], desc: 'Rename conversation inline' },
  ]},
];

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={`${styles.title} t-label-md`}>Keyboard Shortcuts</h2>
          <button className={`${styles.closeBtn} material-symbols-outlined`} onClick={onClose}>close</button>
        </div>
        <div className={styles.body}>
          {SHORTCUTS.map((section) => (
            <div key={section.category} className={styles.section}>
              <div className={`${styles.category} t-label-sm`}>{section.category}</div>
              {section.items.map((item) => (
                <div key={item.desc} className={styles.row}>
                  <span className={`${styles.desc} t-body-md`}>{item.desc}</span>
                  <div className={styles.keys}>
                    {item.keys.map((k, i) => (
                      <span key={i}>
                        <kbd className={styles.kbd}>{k}</kbd>
                        {i < item.keys.length - 1 && <span className={styles.plus}>+</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <span className="t-label-sm">Press <kbd className={styles.kbd}>?</kbd> to toggle this panel</span>
        </div>
      </div>
    </div>
  );
}
