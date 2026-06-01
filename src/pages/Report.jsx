import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatCurrency, formatCompact, groupByCategory, getDaysAgo } from '../utils/formatters';
import { exportToPDF } from '../utils/pdfExport';
import { Download, FileSpreadsheet, BarChart2, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { usePro, PRO_FEATURES } from '../context/ProContext';
import UpgradePrompt from '../components/UpgradePrompt';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

const PERIODS = [
  { label: 'All', key: 'all' },
  { label: 'This Month', key: 'month' },
  { label: 'Last Month', key: 'lastmonth' },
  { label: 'This Week', key: 'week' },
];

const CHART_VIEWS = [
  { label: 'Monthly', key: 'monthly' },
  { label: 'Category', key: 'category' },
];

function getPeriodFilter(key) {
  const now = new Date();
  if (key === 'week') return getDaysAgo(7);
  if (key === 'month') return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
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

const PALETTE = ['#7c3aed', '#0d9488', '#d97706', '#dc2626', '#0ea5e9', '#a855f7', '#ea580c', '#6b7280'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
      padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.stroke || 'var(--accent)', fontWeight: 600 }}>
          {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
}

export default function Report() {
  const { activeProject } = useProject();
  const { isPro } = usePro();
  const categories = useLiveQuery(() => db.categories.toArray());
  const vendors = useLiveQuery(
    () => activeProject ? db.vendors.where('projectId').equals(activeProject.id).toArray() : [],
    [activeProject?.id], []
  );
  const expenses = useLiveQuery(
    () => activeProject ? db.expenses.where('projectId').equals(activeProject.id).toArray() : [],
    [activeProject?.id], []
  );
  const [period, setPeriod] = useState('all');
  const [chartView, setChartView] = useState('monthly');
  const [exporting, setExporting] = useState(false);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState(null);

  if (!categories || !activeProject || !expenses) return <div className="page-loading">Loading…</div>;

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
  const avgEntry = paidFiltered.length > 0 ? Math.round(totalSpent / paidFiltered.length) : 0;
  const categoryBreakdown = groupByCategory(paidFiltered, categories);

  // Monthly chart data (last 6 months)
  const monthMap = {};
  paidFiltered.forEach(e => {
    const [y, m] = e.date.split('-');
    const key = `${y}-${m}`;
    monthMap[key] = (monthMap[key] || 0) + e.amount;
  });
  const monthlyData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([key, amount]) => {
      const [yr, mo] = key.split('-');
      const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      return { label, amount };
    });

  // Month-over-month change
  let momChange = null;
  if (monthlyData.length >= 2) {
    const last = monthlyData[monthlyData.length - 1].amount;
    const prev = monthlyData[monthlyData.length - 2].amount;
    if (prev > 0) momChange = Math.round(((last - prev) / prev) * 100);
  }

  // Category chart data
  const categoryData = categoryBreakdown.slice(0, 8).map((item, i) => ({
    label: item.category.name.split(' ')[0],
    amount: item.total,
    color: PALETTE[i % PALETTE.length],
  }));

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF(activeProject, filtered, categories, categoryBreakdown, vendors);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
    setExporting(false);
  };

  const handleExportExcel = async () => {
    if (!isPro) { setUpgradeFeature(PRO_FEATURES.EXCEL_EXPORT); setShowUpgrade(true); return; }
    setExportingXlsx(true);
    try {
      const { exportToExcel } = await import('../utils/excelExport');
      await exportToExcel(activeProject, filtered, categories, vendors);
    } catch (e) {
      console.error('Excel export failed:', e);
    }
    setExportingXlsx(false);
  };

  return (
    <div className="page report-page">
      <header className="page-header">
        <h1 className="page-title">Report</h1>
      </header>

      {/* Period tabs */}
      <div className="report-tabs">
        {PERIODS.map(p => (
          <button key={p.key} className={`report-tab${period === p.key ? ' active' : ''}`} onClick={() => setPeriod(p.key)}>
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
              <div className="report-stat-label">Total Paid</div>
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

          {activeProject?.budget > 0 && period === 'all' && (
            <div style={{ display: 'flex', gap: 8, padding: '0 var(--px) 12px' }}>
              <div className="report-stat-card">
                <div className="report-stat-value">{formatCompact(activeProject.budget)}</div>
                <div className="report-stat-label">Budget</div>
              </div>
              <div className="report-stat-card">
                <div className="report-stat-value" style={{ color: activeProject.budget - totalSpent < 0 ? 'var(--danger)' : 'var(--green)' }}>
                  {formatCompact(Math.abs(activeProject.budget - totalSpent))}
                  {activeProject.budget - totalSpent < 0 ? ' over' : ' left'}
                </div>
                <div className="report-stat-label">Remaining</div>
              </div>
              {momChange !== null && (
                <div className="report-stat-card">
                  <div className="report-stat-value" style={{ color: momChange > 0 ? 'var(--danger)' : 'var(--green)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    {momChange > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(momChange)}%
                  </div>
                  <div className="report-stat-label">vs Last Month</div>
                </div>
              )}
            </div>
          )}

          {pendingTotal > 0 && (
            <div style={{ padding: '0 var(--px) 12px' }}>
              <div className="pending-alert-bar">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Pending Dues</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)', marginTop: 2 }}>{formatCurrency(pendingTotal)}</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>{pendingFiltered.length} payment{pendingFiltered.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          )}

          {/* Chart section */}
          {(monthlyData.length > 1 || categoryData.length > 0) && (
            <div style={{ padding: '0 var(--px) 4px' }}>
              <div className="chart-toggle-row">
                {CHART_VIEWS.map(v => (
                  <button key={v.key} className={`chart-toggle${chartView === v.key ? ' active' : ''}`} onClick={() => setChartView(v.key)}>
                    {v.label}
                  </button>
                ))}
              </div>

              {chartView === 'monthly' && monthlyData.length > 1 && (
                <div className="chart-card">
                  <div className="chart-title">Monthly Spending</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={monthlyData} barSize={22} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
                      <Bar dataKey="amount" radius={[5, 5, 0, 0]}>
                        {monthlyData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={i === monthlyData.length - 1 ? '#7c3aed' : 'var(--accent-dim)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {chartView === 'category' && categoryData.length > 0 && (
                <div className="chart-card">
                  <div className="chart-title">Top Categories</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={categoryData} layout="vertical" barSize={14} margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={60} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.06)' }} />
                      <Bar dataKey="amount" radius={[0, 5, 5, 0]}>
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Category breakdown list */}
          <div className="report-section-title">By Category</div>
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
                      <div className="report-cat-bar-fill" style={{ width: `${pct}%`, background: item.category.color }} />
                    </div>
                    <div className="report-cat-pct">{item.count} entries · {pct.toFixed(1)}%</div>
                  </div>
                  <div><div className="report-cat-amount">{formatCurrency(item.total)}</div></div>
                </div>
              );
            })}
          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 8, padding: '8px var(--px) 16px' }}>
            <button className="btn btn-secondary" onClick={handleExportPDF} disabled={exporting} style={{ flex: 1 }}>
              <Download size={15} />
              {exporting ? 'Generating…' : 'PDF Report'}
            </button>
            <button className="btn btn-secondary" onClick={handleExportExcel} disabled={exportingXlsx} style={{ flex: 1, position: 'relative' }}>
              <FileSpreadsheet size={15} />
              {exportingXlsx ? 'Exporting…' : 'Excel'}
              {!isPro && <span className="pro-badge">PRO</span>}
            </button>
          </div>
        </>
      )}

      {showUpgrade && <UpgradePrompt feature={upgradeFeature} onClose={() => setShowUpgrade(false)} onUpgraded={() => setShowUpgrade(false)} />}
    </div>
  );
}
