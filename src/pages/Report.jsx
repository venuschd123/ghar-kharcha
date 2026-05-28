import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatCurrency, groupByCategory } from '../utils/formatters';
import { exportToPDF } from '../utils/pdfExport';
import { Download, PieChart } from 'lucide-react';

export default function Report() {
  const categories = useLiveQuery(() => db.categories.toArray());
  const projects = useLiveQuery(() => db.projects.toArray());
  const projectId = projects?.[0]?.id;
  const expenses = useLiveQuery(
    () => projectId != null
      ? db.expenses.where('projectId').equals(projectId).toArray()
      : [],
    [projectId],
    []
  );
  const [exporting, setExporting] = useState(false);

  if (!categories || !projects || !expenses) return <div className="page-loading">Loading...</div>;

  const project = projects[0];
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const categoryBreakdown = groupByCategory(expenses, categories);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPDF(project, expenses, categories, categoryBreakdown);
    } catch (e) {
      console.error('PDF export failed:', e);
    }
    setExporting(false);
  };

  // Monthly breakdown
  const monthlyMap = {};
  expenses.forEach(e => {
    const key = e.date.substring(0, 7); // YYYY-MM
    if (!monthlyMap[key]) monthlyMap[key] = 0;
    monthlyMap[key] += e.amount;
  });
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => {
      const [y, m] = month.split('-');
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      return { label, total };
    });

  const maxMonthly = Math.max(...monthlyData.map(d => d.total), 1);

  return (
    <div className="page report-page">
      <header className="page-header">
        <h1 className="page-title">Report</h1>
        <button
          className="btn btn-small btn-primary"
          onClick={handleExport}
          disabled={exporting || expenses.length === 0}
        >
          <Download size={16} />
          {exporting ? 'Generating...' : 'Export PDF'}
        </button>
      </header>

      {expenses.length === 0 ? (
        <div className="empty-state">
          <PieChart size={40} className="empty-icon" />
          <p>Add expenses to see your report.</p>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="report-summary">
            <div className="report-stat">
              <div className="report-stat-label">Total Spent</div>
              <div className="report-stat-value">{formatCurrency(totalSpent)}</div>
            </div>
            {project.budget > 0 && (
              <>
                <div className="report-stat">
                  <div className="report-stat-label">Budget</div>
                  <div className="report-stat-value">{formatCurrency(project.budget)}</div>
                </div>
                <div className="report-stat">
                  <div className="report-stat-label">Remaining</div>
                  <div className="report-stat-value" style={{
                    color: project.budget - totalSpent < 0 ? '#e17055' : '#00b894'
                  }}>
                    {formatCurrency(Math.abs(project.budget - totalSpent))}
                    {project.budget - totalSpent < 0 ? ' over' : ''}
                  </div>
                </div>
              </>
            )}
            <div className="report-stat">
              <div className="report-stat-label">Total Entries</div>
              <div className="report-stat-value">{expenses.length}</div>
            </div>
          </div>

          {/* Visual Category Breakdown */}
          <section className="section">
            <h2 className="section-title">Category Breakdown</h2>
            <div className="report-categories">
              {categoryBreakdown.map((item, i) => {
                const pct = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
                return (
                  <div key={i} className="report-cat-row">
                    <div className="report-cat-left">
                      <div className="report-cat-dot" style={{ background: item.category.color }} />
                      <span className="report-cat-icon">{item.category.icon}</span>
                      <div>
                        <div className="report-cat-name">{item.category.name}</div>
                        <div className="report-cat-meta">{item.count} entries · {pct.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="report-cat-right">
                      <div className="report-cat-amount">{formatCurrency(item.total)}</div>
                      <div className="report-cat-bar">
                        <div
                          className="report-cat-fill"
                          style={{ width: `${pct}%`, background: item.category.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Monthly Trend */}
          {monthlyData.length > 1 && (
            <section className="section">
              <h2 className="section-title">Monthly Spending</h2>
              <div className="monthly-chart">
                {monthlyData.map((d, i) => (
                  <div key={i} className="monthly-bar-col">
                    <div className="monthly-bar-wrapper">
                      <div
                        className="monthly-bar"
                        style={{
                          height: `${(d.total / maxMonthly) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="monthly-label">{d.label}</div>
                    <div className="monthly-amount">{formatCurrency(d.total)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
