import { useState } from 'react';
import { ChevronDown, Plus, Check, Lock } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import UpgradePrompt from './UpgradePrompt';
import { PRO_FEATURES } from '../context/ProContext';

export default function ProjectSwitcher() {
  const { projects, activeProject, switchProject, createProject, canCreateProject } = useProject();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const handleAddClick = () => {
    if (!canCreateProject) { setShowUpgrade(true); setOpen(false); return; }
    setAdding(true);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createProject(newName.trim());
      setNewName(''); setAdding(false); setOpen(false);
    } catch (e) {
      if (e.message === 'UPGRADE_REQUIRED') { setShowUpgrade(true); setOpen(false); }
    }
    setCreating(false);
  };

  if (!activeProject) return null;

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button onClick={() => setOpen(v => !v)} className="project-switcher">
          <div className="project-switcher-dot" />
          <div className="project-switcher-name">{activeProject.name}</div>
          <ChevronDown size={13} color="var(--text-3)" />
        </button>

        {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => { setOpen(false); setAdding(false); }} />
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 201,
              background: 'var(--bg-card)', border: '1px solid var(--border-mid)',
              borderRadius: 14, boxShadow: 'var(--shadow-lg)',
              minWidth: 230, overflow: 'hidden',
            }}>
              {projects.map(p => (
                <button key={p.id} onClick={() => { switchProject(p.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '13px 14px', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                    background: p.id === activeProject.id ? 'var(--accent-dim)' : 'transparent',
                    color: p.id === activeProject.id ? 'var(--accent)' : 'var(--text)',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}>
                  <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  {p.id === activeProject.id && <Check size={14} />}
                </button>
              ))}

              <div style={{ borderTop: '1px solid var(--border)' }}>
                {adding ? (
                  <div style={{ padding: 10, display: 'flex', gap: 8 }}>
                    <input
                      autoFocus
                      placeholder="Project name…"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreate()}
                      style={{
                        flex: 1, height: 38, padding: '0 10px',
                        background: 'var(--surface)', border: '1.5px solid var(--border-mid)',
                        borderRadius: 9, fontSize: 13, color: 'var(--text)',
                        outline: 'none', fontFamily: 'inherit',
                      }}
                      maxLength={60}
                    />
                    <button onClick={handleCreate} disabled={!newName.trim() || creating}
                      style={{ padding: '0 14px', height: 38, borderRadius: 9, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', opacity: creating ? 0.6 : 1 }}>
                      {creating ? '…' : 'Add'}
                    </button>
                  </div>
                ) : (
                  <button onClick={handleAddClick}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '13px 14px', border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                      color: canCreateProject ? 'var(--accent)' : 'var(--text-2)',
                      background: 'transparent', textAlign: 'left',
                    }}>
                    {canCreateProject ? <Plus size={14} /> : <Lock size={14} />}
                    New Project
                    {!canCreateProject && <span className="pro-badge">PRO</span>}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showUpgrade && (
        <UpgradePrompt
          feature={PRO_FEATURES.MULTI_PROJECT}
          onClose={() => setShowUpgrade(false)}
          onUpgraded={() => setShowUpgrade(false)}
        />
      )}
    </>
  );
}
