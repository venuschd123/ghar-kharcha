import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { formatCurrency, formatCompact, formatDateLabel, groupByCategory, getToday, getDaysAgo } from '../utils/formatters';
import {
  Plus, ArrowRight, Settings, AlertCircle, TrendingUp, Calendar,
  ReceiptText, HardHat, CheckCircle2, Building2, Clock,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import ProjectSwitcher from '../components/ProjectSwitcher';

const RING_R = 46;
const CIRC = 2 * Math.PI * RING_R;

function BudgetRing({ pct, color }) {
  const offset = CIRC * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={RING_R} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={CIRC}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1), stroke 0.4s ease' }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const { activeProject } = useProject();
  const categories = useLiveQuery(() => db.categories.toArray());
  const catBudgets = useLiveQuery(
    () => activeProject ? db.categoryBudgets.where('projectId').equals(activeProject.id).toArray() : [],
    [activeProject?.id], []
  );
  const expenses = useLiveQuery(
    () => activeProject ? db.expenses.where('projectId').equals(activeProject.id).toArray() : [],
    [activeProject?.id], []
  );
  const phases = useLiveQuery(
    () => activeProject ? db.phases.where('projectId').equals(activeProject.id).sortBy('order') : [],
    [activeProject?.id], []
  );
  const isDemo = useLiveQuery(() => db.settings.get('isDemo'), [], null);

  if (!activeProject || !categories || !expenses || !phases) {
    return <div className="page-loading">Loading…</div>;
  }

  const handleExitDemo = async () => {
    if (!window.confirm('Exit demo? This will delete all sample data and start a fresh project.')) return;
    await db.expenses.clear();
    await db.vendors.clear();
    await db.phases.clear();
    await db.projects.clear();
    await db.categories.clear();
    await db.settings.delete('isDemo');
    await db.settings.delete('onboardingDone');
    window.location.reload();
  };

  const paidExpenses = expenses.filter(e => !e.isPending);
  const pendingExpenses = expenses.filter(e => e.isPending);
  const totalSpent = paidExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = pendingExpenses.reduce((s, e) => s + e.amount, 0);

  const budget = activeProject.budget || 0;
  const sqft = activeProject.sqft || 0;
  const remaining = budget - totalSpent;
  const pct = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const ringColor = pct > 90 ? '#F87171' : pct > 70 ? '#FBBF24' : '#10B981';

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

  const sortedByAmount = [...paidExpenses].sort((a, b) => b.amount - a.amount);
  const highestExpense = sortedByAmount[0];
  const highestCat = highestExpense ? categories?.find(c => c.id === highestExpense.categoryId) : null;
  const monthAgo = getDaysAgo(30);
  const monthSpent = paidExpenses.filter(e => e.date >= monthAgo).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page dashboard">
      {/* Header */}
      <div className="dash-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="dash-title">Ghar Kharcha</div>
          <ProjectSwitcher />
        </div>
        <Link to="/settings" className="header-action">
          <Settings size={18} strokeWidth={2} />
        </Link>
      </div>

      {/* Demo banner */}
      {isDemo?.value === 'true' && (
        <div className="demo-banner">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={14} />
            You are viewing sample data
          </span>
          <button onClick={handleExitDemo} className="demo-exit-btn">Start Fresh</button>
        </div>
      )}

      {/* Pending dues alert */}
      {pendingExpenses.length > 0 && (
        <Link to="/expenses" className="dues-alert">
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>
            <strong>{formatCurrency(pendingTotal)}</strong> pending — {pendingExpenses.length} payment{pendingExpenses.length > 1 ? 's' : ''} due
          </span>
          <ArrowRight size={14} style={{ flexShrink: 0 }} />
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
                <span className="hero-row-val" style={{ color: remaining < 0 ? '#F87171' : '#6EE7B7' }}>
                  {remaining < 0 ? `${formatCompact(Math.abs(remaining))} over` : formatCompact(remaining)}
                </span>
              </div>
              {costPerSqft && (
                <div className="hero-row">
                  <span className="hero-row-label">Cost/sqft</span>
                  <span className="hero-row-val">&#8377;{costPerSqft.toLocaleString('en-IN')}</span>
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
            <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 14 }}>
              &#8377;{costPerSqft.toLocaleString('en-IN')}/sqft
            </div>
          )}
          <Link to="/settings" className="set-budget-btn">
            Set a budget <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Phase progress */}
      {phases.length > 0 && (
        <Link to="/phases" className="phase-progress-card">
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: activePhase ? 'rgba(16,185,129,0.12)' : 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: activePhase ? 'var(--green)' : 'var(--text-3)',
          }}>
            {donePhases === phases.length
              ? <CheckCircle2 size={20} />
              : activePhase
                ? <HardHat size={20} />
                : <Clock size={20} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>
              Construction Progress
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>
              {activePhase ? activePhase.name : donePhases === phases.length ? 'All phases done' : 'Not started'}
            </div>
            <div style={{ height: 5, background: 'var(--surface)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.8s var(--ease-out)' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{donePhases}/{phases.length} complete · {progressPct}%</div>
          </div>
          <ArrowRight size={15} color="var(--text-3)" style={{ flexShrink: 0 }} />
        </Link>
      )}

      {/* Quick stats */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(14,165,233,0.1)', color: '#0EA5E9' }}>
            <Calendar size={16} strokeWidth={2} />
          </div>
          <div className="stat-value mono-number">{formatCompact(todaySpent)}</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
            <TrendingUp size={16} strokeWidth={2} />
          </div>
          <div className="stat-value mono-number">{formatCompact(weekSpent)}</div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
            <ReceiptText size={16} strokeWidth={2} />
          </div>
          <div className="stat-value mono-number">{paidExpenses.length}</div>
          <div className="stat-label">Entries</div>
        </div>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <section className="section" style={{ marginTop: 4, marginBottom: 16 }}>
          <div className="section-header">
            <div className="section-title">By Category</div>
            {categoryBreakdown.length > 5 && (
              <Link to="/report" className="see-all-link">Full report <ArrowRight size={12} /></Link>
            )}
          </div>
          <div className="cat-bar-list">
            {categoryBreakdown.slice(0, 5).map((item, i) => {
              const pctBar = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
              const catBudget = catBudgets?.find(b => b.categoryId === item.category.id);
              const catBudgetPct = catBudget?.budget > 0 ? Math.round((item.total / catBudget.budget) * 100) : null;
              const budgetWarn = catBudgetPct !== null && catBudgetPct >= 80;
              return (
                <div key={i} className="cat-bar-row">
                  <div className="cat-bar-left">
                    <span className="cat-bar-icon">{item.category.icon}</span>
                    <div>
                      <div className="cat-bar-name">{item.category.name}</div>
                      {catBudgetPct !== null && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: budgetWarn ? 'var(--danger)' : 'var(--text-3)' }}>
                          {catBudgetPct}% of budget
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="cat-bar-track">
                    <div className="cat-bar-fill" style={{ width: `${pctBar}%`, background: budgetWarn ? 'var(--danger)' : item.category.color }} />
                  </div>
                  <div className="cat-bar-amount">{formatCompact(item.total)}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Insights */}
      {paidExpenses.length >= 3 && (
        <section className="section" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 8 }}>Insights</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {highestExpense && highestCat && (
              <div className="insight-chip">
                <TrendingUp size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div className="insight-label">Highest</div>
                  <div className="insight-value">{formatCurrency(highestExpense.amount)}</div>
                  <div className="insight-sub">{highestCat.name}</div>
                </div>
              </div>
            )}
            <div className="insight-chip">
              <Calendar size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="insight-label">Last 30 days</div>
                <div className="insight-value" style={{ color: 'var(--green)' }}>{formatCompact(monthSpent)}</div>
                <div className="insight-sub">{paidExpenses.filter(e => e.date >= monthAgo).length} entries</div>
              </div>
            </div>
            {costPerSqft && (
              <div className="insight-chip">
                <Building2 size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div className="insight-label">Cost/sqft</div>
                  <div className="insight-value" style={{ color: 'var(--gold)' }}>&#8377;{costPerSqft.toLocaleString('en-IN')}</div>
                  <div className="insight-sub">{activeProject.sqft.toLocaleString()} sqft</div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent expenses */}
      <section className="section" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <div className="section-title">Recent</div>
          {paidExpenses.length > 5 && (
            <Link to="/expenses" className="see-all-link">View all <ArrowRight size={12} /></Link>
          )}
        </div>
        {recentExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><HardHat size={24} /></div>
            <h3>No expenses yet</h3>
            <p>Tap the + button to log your first construction cost</p>
            <Link to="/add" className="btn btn-primary" style={{ marginTop: 8 }}>
              <Plus size={17} /> Add First Expense
            </Link>
          </div>
        ) : (
          <div className="expense-list">
            {recentExpenses.map(exp => {
              const cat = categories.find(c => c.id === exp.categoryId);
              return (
                <Link to={`/edit/${exp.id}`} key={exp.id} className="expense-item">
                  <div className="expense-icon" style={{ background: (cat?.color || '#999') + '20' }}>
                    {cat?.icon || '?'}
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
