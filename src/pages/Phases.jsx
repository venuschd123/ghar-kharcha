import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatCurrency } from '../utils/formatters';
import { Check, Circle, Loader } from 'lucide-react';

const STATUS_CYCLE = { pending: 'active', active: 'done', done: 'pending' };
const STATUS_META = {
  done:    { label: 'Done',       color: 'var(--green)',  bg: 'var(--green-dim)', icon: Check },
  active:  { label: 'In Progress', color: 'var(--accent)', bg: 'var(--accent-dim)', icon: Loader },
  pending: { label: 'Not Started', color: 'var(--text-3)', bg: 'var(--surface)',   icon: Circle },
};

export default function Phases() {
  const projects = useLiveQuery(() => db.projects.toArray());
  const projectId = projects?.[0]?.id;

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

  if (!phases || !expenses || !projects) return <div className="page-loading">Loading…</div>;

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const doneCount = phases.filter(p => p.status === 'done').length;
  const activePhase = phases.find(p => p.status === 'active');
  const progressPct = phases.length > 0 ? Math.round((doneCount / phases.length) * 100) : 0;

  const cycleStatus = async (phase) => {
    await db.phases.update(phase.id, { status: STATUS_CYCLE[phase.status] });
  };

  return (
    <div className="page phases-page">
      <header className="page-header">
        <h1 className="page-title">Phases</h1>
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
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
          Tap a phase to change status
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {phases.map(phase => {
            const meta = STATUS_META[phase.status];
            const Icon = meta.icon;
            return (
              <button
                key={phase.id}
                className="phase-item"
                onClick={() => cycleStatus(phase)}
                style={{ '--phase-color': meta.color, '--phase-bg': meta.bg }}
              >
                <div className="phase-status-icon" style={{ background: meta.bg, color: meta.color }}>
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{phase.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{phase.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: meta.color, fontWeight: 600, marginTop: 2 }}>
                    {meta.label}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>
                  Phase {phase.order}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 20, padding: '14px', background: 'var(--surface)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          💡 Tap any phase to cycle: <strong style={{ color: 'var(--text-2)' }}>Not Started → In Progress → Done</strong>. Only one phase needs to be "In Progress" at a time.
        </div>
      </div>
    </div>
  );
}
