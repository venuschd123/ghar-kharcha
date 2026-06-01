import { useState } from 'react';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export default function ProjectSwitcher() {
  const { projects, activeProject, switchProject, createProject } = useProject();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await createProject(newName.trim());
    setNewName('');
    setAdding(false);
    setCreating(false);
    setOpen(false);
  };

  if (!activeProject) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', padding: '2px 0',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {activeProject.name}
        </div>
        <ChevronDown size={14} color="var(--text-3)" />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 200 }} onClick={() => { setOpen(false); setAdding(false); }} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 201,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 14, boxShadow: 'var(--card-shadow-lg)',
            minWidth: 220, overflow: 'hidden', marginTop: 4,
          }}>
            {projects.map(p => (
              <button key={p.id} onClick={() => { switchProject(p.id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '12px 14px', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                  background: p.id === activeProject.id ? 'var(--accent-dim)' : 'transparent',
                  color: p.id === activeProject.id ? 'var(--accent)' : 'var(--text)',
                  textAlign: 'left',
                }}>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                {p.id === activeProject.id && <Check size={14} />}
              </button>
            ))}

            <div style={{ borderTop: '1px solid var(--border)' }}>
              {adding ? (
                <div style={{ padding: 12, display: 'flex', gap: 8 }}>
                  <input
                    autoFocus
                    className="form-input"
                    placeholder="Project name…"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    style={{ flex: 1, padding: '8px 12px', fontSize: 13 }}
                    maxLength={60}
                  />
                  <button onClick={handleCreate} disabled={!newName.trim() || creating}
                    style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                    {creating ? '…' : 'Add'}
                  </button>
                </div>
              ) : (
                <button onClick={() => setAdding(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '12px 14px', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--accent)',
                    background: 'transparent', textAlign: 'left',
                  }}>
                  <Plus size={14} /> New Project
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
