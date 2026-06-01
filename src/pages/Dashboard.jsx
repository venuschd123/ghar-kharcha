import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from 'motion/react';
import { db } from '../db';
import { formatCurrency, formatCompact, formatDateLabel, groupByCategory, getToday, getDaysAgo } from '../utils/formatters';
import {
  ArrowRight, Settings, AlertCircle, TrendingUp, Calendar,
  ReceiptText, HardHat, CheckCircle2, Building2, Clock, Plus,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import ProjectSwitcher from '../components/ProjectSwitcher';
import ConfirmDialog from '../components/ConfirmDialog';

const RING_R = 46;
const CIRC = 2 * Math.PI * RING_R;

function useTilt(strength = 6) {
  const prefersReduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useTransform(y, [-80, 80], [strength, -strength]);
  const rotY = useTransform(x, [-80, 80], [-strength, strength]);
  const springRotX = useSpring(rotX, { stiffness: 180, damping: 18 });
  const springRotY = useSpring(rotY, { stiffness: 180, damping: 18 });
  return {
    style: prefersReduced ? {} : {
      rotateX: springRotX, rotateY: springRotY,
      transformPerspective: 900, transformStyle: 'preserve-3d',
    },
    handlers: {
      onPointerMove(e) {
        if (prefersReduced) return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left - r.width / 2);
        y.set(e.clientY - r.top - r.height / 2);
      },
      onPointerLeave() { x.set(0); y.set(0); },
      onPointerUp()    { x.set(0); y.set(0); },
    },
  };
}

// Stagger container/child variants
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16,1,0.3,1] } },
};

function BudgetRing({ pct, color }) {
  const offset = CIRC * (1 - Math.min(pct, 100) / 100);
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" overflow="visible">
      {/* Outer pulse ring */}
      <motion.circle
        cx="60" cy="60" r={RING_R + 11}
        fill="none" stroke={color} strokeWidth="2"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.35, 0] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 1.4 }}
      />
      {/* Second pulse — offset timing */}
      <motion.circle
        cx="60" cy="60" r={RING_R + 20}
        fill="none" stroke={color} strokeWidth="1"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut', delay: 2.2 }}
      />
      {/* Track */}
      <circle cx="60" cy="60" r={RING_R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
      {/* Fill */}
      <motion.circle
        cx="60" cy="60" r={RING_R} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={CIRC}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        initial={{ strokeDashoffset: CIRC }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const { activeProject } = useProject();
  const categories    = useLiveQuery(() => db.categories.toArray());
  const catBudgets    = useLiveQuery(
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
  const { style: tiltStyle, handlers: tiltHandlers } = useTilt(6);
  const [confirmExit, setConfirmExit] = useState(false);

  if (!activeProject || !categories || !expenses || !phases) {
    return (
      <div className="page dashboard">
        <div className="dash-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ height: 22, width: 140, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 28, width: 180, borderRadius: 20 }} />
          </div>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
        </div>
        <div className="skeleton skeleton-hero" />
        <div style={{ display: 'flex', gap: 10, padding: '0 var(--px) 12px' }}>
          <div className="skeleton skeleton-stat" />
          <div className="skeleton skeleton-stat" />
          <div className="skeleton skeleton-stat" />
        </div>
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-row" />
        <div className="skeleton skeleton-narrow" style={{ marginTop: 8 }} />
      </div>
    );
  }

  const doExitDemo = async () => {
    await Promise.all([db.expenses.clear(), db.vendors.clear(), db.phases.clear(), db.projects.clear(), db.categories.clear()]);
    await Promise.all([db.settings.delete('isDemo'), db.settings.delete('onboardingDone')]);
    window.location.reload();
  };

  const paidExpenses    = expenses.filter(e => !e.isPending);
  const pendingExpenses = expenses.filter(e => e.isPending);
  const totalSpent      = paidExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingTotal    = pendingExpenses.reduce((s, e) => s + e.amount, 0);

  const budget    = activeProject.budget || 0;
  const sqft      = activeProject.sqft || 0;
  const remaining = budget - totalSpent;
  const pct       = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const ringColor = pct > 90 ? '#F87171' : pct > 70 ? '#FBBF24' : '#10B981';

  const today    = getToday();
  const weekAgo  = getDaysAgo(7);
  const monthAgo = getDaysAgo(30);
  const todaySpent = paidExpenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);
  const weekSpent  = paidExpenses.filter(e => e.date >= weekAgo).reduce((s, e) => s + e.amount, 0);
  const monthSpent = paidExpenses.filter(e => e.date >= monthAgo).reduce((s, e) => s + e.amount, 0);

  const categoryBreakdown = groupByCategory(paidExpenses, categories);
  const recentExpenses    = [...paidExpenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5);

  const activePhase  = phases.find(p => p.status === 'active');
  const donePhases   = phases.filter(p => p.status === 'done').length;
  const progressPct  = phases.length > 0 ? Math.round((donePhases / phases.length) * 100) : 0;
  const costPerSqft  = sqft > 0 ? Math.round(totalSpent / sqft) : null;

  const highestExpense = [...paidExpenses].sort((a, b) => b.amount - a.amount)[0];
  const highestCat     = highestExpense ? categories.find(c => c.id === highestExpense.categoryId) : null;

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
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="demo-banner">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Building2 size={14} /> Viewing sample data
          </span>
          <button onClick={() => setConfirmExit(true)} className="demo-exit-btn">Start Fresh</button>
        </motion.div>
      )}

      {/* Pending dues */}
      {pendingExpenses.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <Link to="/expenses" className="dues-alert">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>
              <strong>{formatCurrency(pendingTotal)}</strong> pending — {pendingExpenses.length} payment{pendingExpenses.length > 1 ? 's' : ''} due
            </span>
            <ArrowRight size={14} style={{ flexShrink: 0 }} />
          </Link>
        </motion.div>
      )}

      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16,1,0.3,1] }}>
        {budget > 0 ? (
          <motion.div className="hero-card" style={tiltStyle} {...tiltHandlers}>
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
          </motion.div>
        ) : (
          <div className="hero-card-simple">
            <div className="hero-eyebrow">Total Spent</div>
            <div className="hero-amount">{formatCurrency(totalSpent)}</div>
            {costPerSqft && (
              <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, marginBottom: 6, position: 'relative', zIndex: 1 }}>
                &#8377;{costPerSqft.toLocaleString('en-IN')}/sqft
              </div>
            )}
            <Link to="/settings" className="set-budget-btn" style={{ position: 'relative', zIndex: 1 }}>
              Set a budget <ArrowRight size={13} />
            </Link>
          </div>
        )}
      </motion.div>


      {/* Phase progress */}
      {phases.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Link to="/phases" className="phase-progress-card">
            <div className="phase-icon-ring"
              style={!activePhase && donePhases !== phases.length ? { background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-3)' } : {}}>
              {donePhases === phases.length ? <CheckCircle2 size={20} /> : activePhase ? <HardHat size={20} /> : <Clock size={20} />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>
                Construction Progress
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 7, color: 'var(--text)' }}>
                {activePhase ? activePhase.name : donePhases === phases.length ? 'All phases done' : 'Not started'}
              </div>
              <div style={{ height: 5, background: 'var(--surface)', borderRadius: 99, overflow: 'hidden' }}>
                <motion.div
                  style={{ height: '100%', background: 'var(--accent)', borderRadius: 99 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: [0.16,1,0.3,1] }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>{donePhases}/{phases.length} complete · {progressPct}%</div>
            </div>
            <ArrowRight size={15} color="var(--text-3)" style={{ flexShrink: 0 }} />
          </Link>
        </motion.div>
      )}

      {/* Stat row */}
      <motion.div
        className="stat-row"
        variants={listVariants} initial="hidden" animate="show"
      >
        {[
          { icon: <Calendar size={16} strokeWidth={2} />, color: 'rgba(59,130,246,.12)', iconColor: '#3B82F6', value: formatCompact(todaySpent), label: 'Today' },
          { icon: <TrendingUp size={16} strokeWidth={2} />, color: 'var(--gold-dim)', iconColor: 'var(--gold)', value: formatCompact(weekSpent), label: 'This Week' },
          { icon: <ReceiptText size={16} strokeWidth={2} />, color: 'var(--green-dim)', iconColor: 'var(--green)', value: paidExpenses.length, label: 'Entries' },
        ].map(s => (
          <motion.div key={s.label} variants={itemVariants} className="stat-card">
            <div className="stat-icon" style={{ background: s.color, color: s.iconColor }}>{s.icon}</div>
            <div className="stat-value mono-number">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <section className="section" style={{ marginTop: 4, marginBottom: 16 }}>
          <div className="section-header">
            <div className="section-title">By Category</div>
            {categoryBreakdown.length > 5 && (
              <Link to="/report" className="see-all-link">Full report <ArrowRight size={12} /></Link>
            )}
          </div>
          <motion.div className="cat-bar-list" variants={listVariants} initial="hidden" animate="show">
            {categoryBreakdown.slice(0, 5).map((item, i) => {
              const pctBar      = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
              const catBudget   = catBudgets?.find(b => b.categoryId === item.category.id);
              const catBudgPct  = catBudget?.budget > 0 ? Math.round((item.total / catBudget.budget) * 100) : null;
              const budgetWarn  = catBudgPct !== null && catBudgPct >= 80;
              return (
                <motion.div key={item.category.id ?? i} variants={itemVariants} className="cat-bar-row">
                  <div className="cat-bar-left">
                    <span className="cat-bar-icon">{item.category.icon}</span>
                    <div>
                      <div className="cat-bar-name">{item.category.name}</div>
                      {catBudgPct !== null && (
                        <div style={{ fontSize: 10, fontWeight: 700, color: budgetWarn ? 'var(--danger)' : 'var(--text-3)' }}>
                          {catBudgPct}% of budget
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="cat-bar-track">
                    <motion.div
                      className="cat-bar-fill"
                      style={{ background: budgetWarn ? 'var(--danger)' : item.category.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pctBar}%` }}
                      transition={{ duration: 1, delay: 0.1 * i, ease: [0.16,1,0.3,1] }}
                    />
                  </div>
                  <div className="cat-bar-amount">{formatCompact(item.total)}</div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {/* Insights */}
      {paidExpenses.length >= 3 && (
        <section className="section" style={{ marginBottom: 16 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Insights</div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 4 }}>
            {highestExpense && highestCat && (
              <motion.div className="insight-chip" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .2 }}>
                <TrendingUp size={14} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div className="insight-label">Highest</div>
                  <div className="insight-value">{formatCurrency(highestExpense.amount)}</div>
                  <div className="insight-sub">{highestCat.name}</div>
                </div>
              </motion.div>
            )}
            <motion.div className="insight-chip" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .26 }}>
              <Calendar size={14} color="var(--green)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div className="insight-label">Last 30 days</div>
                <div className="insight-value" style={{ color: 'var(--green)' }}>{formatCompact(monthSpent)}</div>
                <div className="insight-sub">{paidExpenses.filter(e => e.date >= monthAgo).length} entries</div>
              </div>
            </motion.div>
            {costPerSqft && (
              <motion.div className="insight-chip" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: .32 }}>
                <Building2 size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div className="insight-label">Cost/sqft</div>
                  <div className="insight-value" style={{ color: 'var(--gold)' }}>&#8377;{costPerSqft.toLocaleString('en-IN')}</div>
                  <div className="insight-sub">{activeProject.sqft.toLocaleString()} sqft</div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={confirmExit}
        title="Exit Demo Mode?"
        message="All sample data will be deleted and you'll start fresh with your own project."
        danger={true}
        confirmLabel="Start Fresh"
        onConfirm={doExitDemo}
        onCancel={() => setConfirmExit(false)}
      />

      {/* Recent */}
      <section className="section" style={{ marginBottom: 24 }}>
        <div className="section-header">
          <div className="section-title">Recent</div>
          {paidExpenses.length > 5 && (
            <Link to="/expenses" className="see-all-link">View all <ArrowRight size={12} /></Link>
          )}
        </div>
        {recentExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><HardHat size={26} /></div>
            <h3>No expenses yet</h3>
            <p>Tap the + button to log your first construction cost</p>
            <Link to="/add" className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>
              <Plus size={17} /> Add First Expense
            </Link>
          </div>
        ) : (
          <motion.div className="expense-list" variants={listVariants} initial="hidden" animate="show">
            {recentExpenses.map(exp => {
              const cat = categories.find(c => c.id === exp.categoryId);
              return (
                <motion.div key={exp.id} variants={itemVariants}>
                  <Link to={`/edit/${exp.id}`} className="expense-item">
                    <div className="expense-icon" style={{ background: (cat?.color || '#999') + '20' }}>
                      {cat?.icon || '?'}
                    </div>
                    <div className="expense-details">
                      <div className="expense-cat">{cat?.name || 'Unknown'}</div>
                      <div className="expense-note">{exp.note || formatDateLabel(exp.date)}</div>
                    </div>
                    <div className="expense-amount">{formatCurrency(exp.amount)}</div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
