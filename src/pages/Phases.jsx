import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatCurrency } from '../utils/formatters';
import { Check, Circle, Loader, Plus, Pencil, Trash2 } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import ConfirmDialog from '../components/ConfirmDialog';

const STATUS_CYCLE = { pending: 'active', active: 'done', done: 'pending' };
const STATUS_META = {
  done:    { label: 'Done',        color: 'var(--green)',  bg: 'var(--green-dim)', icon: Check },
  active:  { label: 'In Progress', color: 'var(--accent)', bg: 'var(--accent-dim)', icon: Loader },
  pending: { label: 'Not Started', color: 'var(--text-3)', bg: 'var(--surface)',   icon: Circle },
};

const COMMON_EMOJIS = ['🏗️','⛏️','🏛️','🪨','🧱','🪣','🔲','⚡','🔧','🚪','🎨','✨','🏠','🪵','🚿','🔩','🪞','🛋️','🌿','💡'];

function PhaseSheet({ phase, maxOrder, onClose }) {
  const isEdit = !!phase;
  const [name, setName] = useState(phase?.name ?? '');
  const [emoji, setEmoji] = useState(phase?.emoji ?? '🏗️');
  const [saving, setSaving] = useState(false);
  const { activeProject } = useProject();

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    if (isEdit) {
      await db.phases.update(phase.id, { name: name.trim(), emoji });
    } else {
      await db.phases.add({
        projectId: activeProject.id,
        name: name.trim(),
        emoji,
        order: maxOrder + 1,
        status: 'pending',
        budget: 0,
      });
    }
    onClose();
  };

  return (
    <div className="bottom-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{isEdit ? 'Edit Phase' : 'Add Phase'}</div>
        <div className="sheet-body">
          <div className="form-section" style={{ marginBottom: 14 }}>
            <label className="form-label">Emoji</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COMMON_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  style={{
                    width: 40, height: 40, fontSize: 20, borderRadius: 10, border: 'none',
                    cursor: 'pointer', background: emoji === e ? 'var(--accent-dim)' : 'var(--surface)',
                    outline: emoji === e ? '2px solid var(--accent-border)' : 'none',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="form-section" style={{ marginBottom: 16 }}>
            <label className="form-label">Phase Name</label>
            <input
              className="form-input"
              placeholder="e.g. Waterproofing"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              maxLength={60}
            />
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Phase'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Phases() {
  const { activeProject } = useProject();
  const projectId = activeProject?.id;

  const phases = useLiveQuery(
    () => projectId != null
      ? db.phases.where('projectId').equals(projectId).sortBy('order')
      : [],
    [projectId], []
  );
  const expenses = useLiveQuery(
    () => projectId != null
      ? db.expenses.where('projectId').equals(projectId).filter(e => !e.isPending).toArray()
      : [],
    [projectId], []
  );

  const [showAdd, setShowAdd] = useState(false);
  const [editPhase, setEditPhase] = useState(null);
  const [deletePhase, setDeletePhase] = useState(null);

  if (!phases || !expenses || !activeProject) return <div className="page-loading">Loading…</div>;

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const doneCount = phases.filter(p => p.status === 'done').length;
  const activePhase = phases.find(p => p.status === 'active');
  const progressPct = phases.length > 0 ? Math.round((doneCount / phases.length) * 100) : 0;
  const maxOrder = phases.reduce((m, p) => Math.max(m, p.order), 0);

  const cycleStatus = async (phase) => {
    await db.phases.update(phase.id, { status: STATUS_CYCLE[phase.status] });
  };

  const handleDelete = async () => {
    if (!deletePhase) return;
    await db.phases.delete(deletePhase.id);
    setDeletePhase(null);
  };

  return (
    <div className="page phases-page">
      <header className="page-header">
        <h1 className="page-title">Phases</h1>
        <button
          className="header-action"
          onClick={() => setShowAdd(true)}
          aria-label="Add phase"
        >
          <Plus size={20} />
        </button>
      </header>

      <div style={{ padding: '0 var(--px) 16px' }}>
        <div className="phases-summary-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                Construction Progress
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px' }}>
                {progressPct}% Complete
              </div>
              {activePhase && (
                <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>
                  🔄 Currently: {activePhase.name}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Total Spent</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{formatCurrency(totalSpent)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{doneCount}/{phases.length} phases done</div>
            </div>
          </div>
          <div style={{ height: 6, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent)', borderRadius: 3, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      </div>

      <div style={{ padding: '0 var(--px)' }}>
        {phases.length > 0 && (
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
            Tap phase row to change status · pencil to edit
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {phases.map(phase => {
            const meta = STATUS_META[phase.status];
            const Icon = meta.icon;
            return (
              <div
                key={phase.id}
                className={`phase-item status-${phase.status}`}
                style={{ '--phase-color': meta.color, '--phase-bg': meta.bg, display: 'flex', alignItems: 'center', gap: 0 }}
              >
                <button
                  style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                  onClick={() => cycleStatus(phase)}
                >
                  <div className="phase-status-icon" style={{ background: meta.bg, color: meta.color }}>
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, padding: '12px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>{phase.emoji}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{phase.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: meta.color, fontWeight: 600, marginTop: 2 }}>
                      {meta.label}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-2)', fontWeight: 600, paddingRight: 4 }}>
                    Phase {phase.order}
                  </div>
                </button>
                <div style={{ display: 'flex', gap: 2, paddingRight: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => setEditPhase(phase)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Edit phase"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeletePhase(phase)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}
                    aria-label="Delete phase"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {phases.length === 0 && (
          <div className="empty-state" style={{ paddingTop: 32 }}>
            <div className="empty-icon">🏗️</div>
            <h3>No phases yet</h3>
            <p>Add construction phases to track your build progress.</p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ marginTop: 8 }}>
              <Plus size={16} /> Add First Phase
            </button>
          </div>
        )}

        {phases.length > 0 && (
          <div style={{ marginTop: 20, padding: '14px', background: 'var(--surface)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            💡 Tap any phase row to cycle: <strong style={{ color: 'var(--text-2)' }}>Not Started → In Progress → Done</strong>
          </div>
        )}
      </div>

      {(showAdd) && (
        <PhaseSheet maxOrder={maxOrder} onClose={() => setShowAdd(false)} />
      )}
      {editPhase && (
        <PhaseSheet phase={editPhase} maxOrder={maxOrder} onClose={() => setEditPhase(null)} />
      )}
      <ConfirmDialog
        open={!!deletePhase}
        title={`Delete "${deletePhase?.name}"?`}
        message="This phase will be removed. Expenses linked to it won't be affected."
        danger={true}
        confirmLabel="Delete Phase"
        onConfirm={handleDelete}
        onCancel={() => setDeletePhase(null)}
      />
    </div>
  );
}
