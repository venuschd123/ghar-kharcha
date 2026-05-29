import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatCurrency, formatCompact, groupByCategory, getToday, getDaysAgo } from '../utils/formatters';
import { exportToPDF } from '../utils/pdfExport';
import { Download } from 'lucide-react';

const PERIODS = [
  { label: 'All Time', key: 'all' },
  { label: 'This Month', key: 'month' },
  { label: 'Last Month', key: 'lastmonth' },
  { label: 'This Week', key: 'week' },
];

function getPeriodFilter(key) {
  const now = new Date();
  if (key === 'week') {
    return getDaysAgo(7);
  }
  if (key === 'month') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }
  if (key === 'lastmonth') {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.toISOString().split('T')[0];
  }
  return null;
}

function getPeriodEnd(key) {
  const now = new Date();
  if (key === 'lastmonth') {
    const d = new Date(now.getFullYear(), now.getMonth(), 0);
    return d.toISOString().split('T')[0];
  }
  return null;
}

export default function Report() {
  const categories = useLiveQuery(() => db.categories.toArray());
  const projects = useLiveQuery(() => db.projects.toArray());
  const projectId = projects?.[0]?.id;
  const expenses = useLiveQuery(
    () => projectId != null ? db.expenses.where('projectId').equals(projectId).toArray() : [],
    [projectId],
    []
  );
  const [period, setPeriod] = useState('all');
  const [exporting, setExporting] = useState(false);

  if (!categories || !projects || !expenses) return <div className="page-loading">Loading…</div>;

  const project = projects[0];
  const from = getPeriodFilter(period);
  const to = getPeriodEnd(period);
  const filtered = expenses.filter(e => {
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    return true;
  });

  const paidFiltered = filtered.filter(e => !e.isPending);
  const pendingFiltered = filtered.filter(e => e.isPending);
  const totalSpent = paidFiltered.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = pendingFiltered.reduce((s, e) => s + e.amount, 0);
  const avgEntry = paidFiltered.length > 0 ? totalSpent / paidFiltered.length : 0;
  const categoryBreakdown = groupByCategory(paidFiltered, categories);
  const topCat = categoryBreakdown[0]?.category?.name || '—';

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPDF(project, filtered, categories, categoryBreakdown);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
    setExporting(false);
  };

  return (
    <div className="page report-page">
      <header className="page-header">
        <h1 className="page-title">Report</h1>
      </header>

      {/* Period tabs */}
      <div className="report-tabs">
        {PERIODS.map(p => (
          <button
            key={p.key}
            className={`report-tab${period === p.key ? ' active' : ''}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No data yet</h3>
          <p>Add expenses to see your spending report.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="report-summary">
            <div className="report-stat-card">
              <div className="report-stat-value">{formatCompact(totalSpent)}</div>
              <div className="report-stat-label">Total Spent</div>
            </div>
            <div className="report-stat-card">
              <div className="report-stat-value">{formatCompact(avgEntry)}</div>
              <div className="report-stat-label">Avg Entry</div>
            </div>
            <div className="report-stat-card">
              <div className="report-stat-value">{filtered.length}</div>
              <div className="report-stat-label">Entries</div>
            </div>
          </div>

          {project?.budget > 0 && period === 'all' && (
            <div style={{ display: 'flex', gap: 8, padding: '0 var(--px) 16px' }}>
              <div className="report-stat-card">
                <div className="report-stat-value">{formatCompact(project.budget)}</div>
                <div className="report-stat-label">Budget</div>
              </div>
              <div className="report-stat-card">
                <div
                  className="report-stat-value"
                  style={{ color: project.budget - totalSpent < 0 ? 'var(--danger)' : 'var(--green)' }}
                >
                  {formatCompact(Math.abs(project.budget - totalSpent))}
                  {project.budget - totalSpent < 0 ? ' over' : ' left'}
                </div>
                <div className="report-stat-label">Remaining</div>
              </div>
            </div>
          )}

          {pendingTotal > 0 && (
            <div style={{ padding: '0 var(--px) 16px' }}>
              <div style={{
                background: 'var(--gold-dim)', border: '1px solid rgba(217,119,6,0.2)',
                borderRadius: 'var(--radius)', padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Pending Dues</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)', marginTop: 2 }}>{formatCurrency(pendingTotal)}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{pendingFiltered.length} {pendingFiltered.length === 1 ? 'payment' : 'payments'}</div>
              </div>
            </div>
          )}

          {/* Category breakdown */}
          <div className="report-section-title" style={{ marginTop: 8 }}>By Category</div>
          <div className="report-cat-list">
            {categoryBreakdown.map((item, i) => {
              const pct = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
              return (
                <div key={i} className="report-cat-row">
                  <div className="report-cat-icon" style={{ background: item.category.color + '22' }}>
                    {item.category.icon}
                  </div>
                  <div className="report-cat-info">
                    <div className="report-cat-name">{item.category.name}</div>
                    <div className="report-cat-bar-track">
                      <div
                        className="report-cat-bar-fill"
                        style={{ width: `${pct}%`, background: item.category.color }}
                      />
                    </div>
                    <div className="report-cat-pct">{item.count} entries · {pct.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="report-cat-amount">{formatCurrency(item.total)}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export */}
          <div className="report-export-row">
            <button
              className="btn btn-secondary"
              onClick={handleExport}
              disabled={exporting}
            >
              <Download size={16} />
              {exporting ? 'Generating…' : 'Export PDF'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
