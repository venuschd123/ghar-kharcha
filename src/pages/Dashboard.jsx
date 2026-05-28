import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { formatCurrency, formatCompact, formatDateLabel, groupByCategory, getToday, getDaysAgo } from '../utils/formatters';
import { PlusCircle, ArrowRight, Settings, AlertCircle } from 'lucide-react';

const RING_R = 46;
const CIRC = 2 * Math.PI * RING_R;

function BudgetRing({ pct, color }) {
  const offset = CIRC * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={RING_R} fill="none" stroke="var(--surface)" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={RING_R} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease' }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const projects = useLiveQuery(() => db.projects.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const activeProject = projects?.[0] ?? null;

  const expenses = useLiveQuery(
    () => activeProject ? db.expenses.where('projectId').equals(activeProject.id).toArray() : [],
    [activeProject?.id], []
  );
  const phases = useLiveQuery(
    () => activeProject ? db.phases.where('projectId').equals(activeProject.id).sortBy('order') : [],
    [activeProject?.id], []
  );

  if (!activeProject || !categories || !expenses || !phases) {
    return <div className="page-loading">Loading…</div>;
  }

  const paidExpenses = expenses.filter(e => !e.isPending);
  const pendingExpenses = expenses.filter(e => e.isPending);
  const totalSpent = paidExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = pendingExpenses.reduce((s, e) => s + e.amount, 0);

  const budget = activeProject.budget || 0;
  const sqft = activeProject.sqft || 0;
  const remaining = budget - totalSpent;
  const pct = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const ringColor = pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--gold)' : 'var(--accent)';

  const today = getToday();
  const weekAgo = getDaysAgo(7);
  const todaySpent = paidExpenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
  const weekSpent = paidExpenses.filter(e => e.date >= weekAgo).reduce((s, e) => s + e.amount, 0);

  const categoryBreakdown = groupByCategory(paidExpenses, categories);
  const recentExpenses = [...paidExpenses]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, 5);

  const activePhase = phases.find(p => p.status === 'active');
  const donePhases = phases.filter(p => p.status === 'done').length;
  const progressPct = phases.length > 0 ? Math.round((donePhases / phases.length) * 100) : 0;
  const costPerSqft = sqft > 0 ? Math.round(totalSpent / sqft) : null;

  return (
    <div className="page dashboard">
      <div className="dash-header">
        <div>
          <div className="dash-title">Ghar Kharcha</div>
          <div className="dash-project">{activeProject.name}</div>
        </div>
        <Link to="/settings" className="header-action">
          <Settings size={18} />
        </Link>
      </div>

      {/* Pending dues alert */}
      {pendingExpenses.length > 0 && (
        <Link to="/expenses" className="dues-alert">
          <AlertCircle size={16} />
          <span><strong>{formatCurrency(pendingTotal)}</strong> pending — {pendingExpenses.length} payment{pendingExpenses.length > 1 ? 's' : ''} due</span>
          <ArrowRight size={14} style={{ marginLeft: 'auto', flexShrink: 0 }} />
        </Link>
      )}

      {/* Hero card */}
      {budget > 0 ? (
        <div className="hero-card">
          <div className="hero-ring">
            <BudgetRing pct={pct} color={ringColor} />
            <div className="hero-ring-center">
              <div className="hero-ring-pct" style={{ color: ringColor }}>{Math.round(pct)}%</div>
              <div className="hero-ring-label">used</div>
            </div>
          </div>
          <div className="hero-info">
            <div className="hero-eyebrow">Total Spent</div>
            <div className="hero-amount">{formatCompact(totalSpent)}</div>
            <div className="hero-rows">
              <div className="hero-row">
                <span className="hero-row-label">Budget</span>
                <span className="hero-row-val">{formatCompact(budget)}</span>
              </div>
              <div className="hero-row">
                <span className="hero-row-label">Remaining</span>
                <span className="hero-row-val" style={{ color: remaining < 0 ? '#fca5a5' : '#6ee7b7' }}>
                  {remaining < 0 ? `${formatCompact(Math.abs(remaining))} over` : formatCompact(remaining)}
                </span>
              </div>
              {costPerSqft && (
                <div className="hero-row">
                  <span className="hero-row-label">Cost/sqft</span>
                  <span className="hero-row-val" style={{ color: 'rgba(255,255,255,0.9)' }}>₹{costPerSqft.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="hero-card-simple">
          <div className="hero-eyebrow">Total Spent</div>
          <div className="hero-amount">{formatCurrency(totalSpent)}</div>
          {costPerSqft && (
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 12 }}>
              ₹{costPerSqft.toLocaleString('en-IN')}/sqft so far
            </div>
          )}
          <Link to="/settings" className="set-budget-btn">Set a budget →</Link>
        </div>
      )}

      {/* Phase progress card */}
      {phases.length > 0 && (
        <Link to="/phases" className="phase-progress-card">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
              Construction Progress
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>
              {activePhase ? `🔄 ${activePhase.name}` : donePhases === phases.length ? '✅ All Done!' : '⏳ Not started'}
            </div>
            <div style={{ height: 5, background: 'var(--surface)', borderRadius: 3, overflow: 'hidden', marginTop: 8 }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent)', borderRadius: 3 }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>{donePhases}/{phases.length} phases complete · {progressPct}%</div>
          </div>
          <ArrowRight size={16} color="var(--text-3)" style={{ flexShrink: 0 }} />
        </Link>
      )}

      {/* Quick stats */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>📅</div>
          <div className="stat-value">{formatCompact(todaySpent)}</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>📊</div>
          <div className="stat-value">{formatCompact(weekSpent)}</div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>🧾</div>
          <div className="stat-value">{paidExpenses.length}</div>
          <div className="stat-label">Entries</div>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <section className="section" style={{ marginTop: 8 }}>
          <div className="section-header">
            <div className="section-title">By Category</div>
            {categoryBreakdown.length > 5 && (
              <Link to="/report" className="see-all-link">Full report <ArrowRight size={12} /></Link>
            )}
          </div>
          <div className="cat-bar-list">
            {categoryBreakdown.slice(0, 5).map((item, i) => {
              const pctBar = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
              return (
                <div key={i} className="cat-bar-row">
                  <div className="cat-bar-left">
                    <span className="cat-bar-icon">{item.category.icon}</span>
                    <span className="cat-bar-name">{item.category.name}</span>
                  </div>
                  <div className="cat-bar-track">
                    <div className="cat-bar-fill" style={{ width: `${pctBar}%`, background: item.category.color }} />
                  </div>
                  <div className="cat-bar-amount">{formatCompact(item.total)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent expenses */}
      <section className="section" style={{ marginTop: 20 }}>
        <div className="section-header">
          <div className="section-title">Recent</div>
          {paidExpenses.length > 5 && (
            <Link to="/expenses" className="see-all-link">View all <ArrowRight size={12} /></Link>
          )}
        </div>
        {recentExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏗️</div>
            <h3>No expenses yet</h3>
            <p>Tap the + button to log your first construction cost</p>
            <Link to="/add" className="btn btn-primary" style={{ marginTop: 8 }}>
              <PlusCircle size={17} /> Add First Expense
            </Link>
          </div>
        ) : (
          <div className="expense-list">
            {recentExpenses.map(exp => {
              const cat = categories.find(c => c.id === exp.categoryId);
              return (
                <Link to={`/edit/${exp.id}`} key={exp.id} className="expense-item">
                  <div className="expense-icon" style={{ background: (cat?.color || '#999') + '22' }}>
                    {cat?.icon || '❓'}
                  </div>
                  <div className="expense-details">
                    <div className="expense-cat">{cat?.name || 'Unknown'}</div>
                    <div className="expense-note">{exp.note || formatDateLabel(exp.date)}</div>
                  </div>
                  <div className="expense-amount">{formatCurrency(exp.amount)}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
