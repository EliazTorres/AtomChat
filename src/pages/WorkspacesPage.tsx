import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useWorkspaces, WORKSPACE_ICONS, WORKSPACE_COLORS } from '../context/WorkspacesContext';
import { useChat } from '../context/ChatContext';
import styles from './WorkspacesPage.module.css';

export function WorkspacesPage() {
  const { workspaces, createWorkspace, deleteWorkspace, setActiveWorkspaceId } = useWorkspaces();
  const { createConversation, conversations } = useChat();
  const navigate = useNavigate();

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: WORKSPACE_ICONS[0], color: WORKSPACE_COLORS[0] });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createWorkspace(form.name.trim(), form.description.trim(), form.icon, form.color);
    setForm({ name: '', description: '', icon: WORKSPACE_ICONS[0], color: WORKSPACE_COLORS[0] });
    setCreating(false);
  };

  const handleOpen = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    const id = createConversation(workspaceId);
    navigate({ to: '/chat/$conversationId', params: { conversationId: id } });
  };

  const getConvCount = (wsId: string) => conversations.filter((c) => c.workspaceId === wsId).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={`${styles.title} t-headline-md`}>Workspaces</h1>
            <p className={`${styles.subtitle} t-body-md`}>Organize your chats into focused spaces.</p>
          </div>
          <button className={styles.newBtn} onClick={() => setCreating(true)} id="new-workspace-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            <span className="t-label-md">New Workspace</span>
          </button>
        </div>
      </header>

      <div className={styles.content}>
        {/* Create form */}
        {creating && (
          <div className={styles.createCard}>
            <h3 className={`${styles.formTitle} t-label-md`}>New Workspace</h3>
            <input
              className={`${styles.input} t-body-md`}
              placeholder="Workspace name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              autoFocus
            />
            <input
              className={`${styles.input} t-body-md`}
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <div className={styles.formRow}>
              <div>
                <div className={`${styles.formLabel} t-label-sm`}>Icon</div>
                <div className={styles.iconGrid}>
                  {WORKSPACE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      className={`${styles.iconBtn} material-symbols-outlined ${form.icon === icon ? styles.iconBtnActive : ''}`}
                      onClick={() => setForm((f) => ({ ...f, icon }))}
                    >{icon}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className={`${styles.formLabel} t-label-sm`}>Color</div>
                <div className={styles.colorGrid}>
                  {WORKSPACE_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`${styles.colorBtn} ${form.color === color ? styles.colorBtnActive : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setForm((f) => ({ ...f, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.formActions}>
              <button className={styles.cancelBtn} onClick={() => setCreating(false)}>Cancel</button>
              <button className={styles.createBtn} onClick={handleCreate} disabled={!form.name.trim()}>
                Create Workspace
              </button>
            </div>
          </div>
        )}

        {/* Workspace grid */}
        {workspaces.length === 0 && !creating ? (
          <div className={styles.empty}>
            <span className={`${styles.emptyIcon} material-symbols-outlined`}>work_outline</span>
            <p className={`${styles.emptyTitle} t-label-md`}>No workspaces yet</p>
            <p className={`${styles.emptyHint} t-body-md`}>Create a workspace to organize your conversations by project or topic.</p>
            <button className={styles.newBtn} onClick={() => setCreating(true)}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Create your first workspace
            </button>
          </div>
        ) : (
          <div className={styles.grid}>
            {workspaces.map((ws) => (
              <div key={ws.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.wsIcon} style={{ backgroundColor: ws.color + '22', borderColor: ws.color + '44' }}>
                    <span className={`${styles.wsIconSymbol} material-symbols-outlined`} style={{ color: ws.color }}>{ws.icon}</span>
                  </div>
                  <button className={`${styles.deleteBtn} material-symbols-outlined`} onClick={() => deleteWorkspace(ws.id)} title="Delete workspace">
                    delete
                  </button>
                </div>
                <h3 className={`${styles.wsName} t-label-md`}>{ws.name}</h3>
                {ws.description && <p className={`${styles.wsDesc} t-body-md`}>{ws.description}</p>}
                <div className={styles.wsMeta}>
                  <span className={`${styles.wsCount} t-label-sm`}>{getConvCount(ws.id)} conversation{getConvCount(ws.id) !== 1 ? 's' : ''}</span>
                  <span className={`${styles.wsDate} t-label-sm`}>{ws.createdAt.toLocaleDateString()}</span>
                </div>
                <button className={styles.openBtn} onClick={() => handleOpen(ws.id)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
                  Open workspace
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
