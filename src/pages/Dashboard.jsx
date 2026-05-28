import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { formatCurrency, formatDate, groupByCategory } from '../utils/formatters';
import { TrendingUp, Wallet, ReceiptIndianRupee, PlusCircle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const projects = useLiveQuery(() => db.projects.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());
  const activeProject = projects?.[0] ?? null;

  const expenses = useLiveQuery(
    () => activeProject
      ? db.expenses.where('projectId').equals(activeProject.id).toArray()
      : [],
    [activeProject?.id],
    []
  );

  if (!activeProject || !categories || !expenses) {
    return <div className="page-loading">Loading...</div>;
  }

  const recentExpenses = [...expenses]
    .sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date);
      return dateCompare !== 0 ? dateCompare : b.id - a.id;
    })
    .slice(0, 5);

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const budget = activeProject.budget || 0;
  const remaining = budget - totalSpent;
  const percentUsed = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
  const categoryBreakdown = groupByCategory(expenses, categories);

  // This week's spending
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];
  const thisWeek = expenses.filter(e => e.date >= weekStr).reduce((s, e) => s + e.amount, 0);

  // Today's spending
  const today = new Date().toISOString().split('T')[0];
  const todaySpent = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page dashboard">
      <header className="page-header">
        <div>
          <h1 className="page-title">Ghar Kharcha</h1>
          <p className="page-subtitle">{activeProject.name}</p>
        </div>
        <Link to="/add" className="header-action">
          <PlusCircle size={22} />
        </Link>
      </header>

      {/* Total Card */}
      <div className="hero-card">
        <div className="hero-label">Total Spent</div>
        <div className="hero-amount">{formatCurrency(totalSpent)}</div>
        {budget > 0 && (
          <>
            <div className="budget-bar">
              <div
                className="budget-fill"
                style={{
                  width: `${percentUsed}%`,
                  background: percentUsed > 90 ? '#e17055' : percentUsed > 70 ? '#fdcb6e' : '#00b894',
                }}
              />
            </div>
            <div className="budget-info">
              <span>Budget: {formatCurrency(budget)}</span>
              <span style={{ color: remaining < 0 ? '#e17055' : '#00b894' }}>
                {remaining < 0 ? 'Over by ' : 'Left: '}{formatCurrency(Math.abs(remaining))}
              </span>
            </div>
          </>
        )}
        {budget === 0 && (
          <Link to="/settings" className="set-budget-link">
            Set a budget →
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#00b89420', color: '#00b894' }}>
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="stat-value">{formatCurrency(todaySpent)}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#0984e320', color: '#0984e3' }}>
            <Wallet size={18} />
          </div>
          <div>
            <div className="stat-value">{formatCurrency(thisWeek)}</div>
            <div className="stat-label">This Week</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#6c5ce720', color: '#6c5ce7' }}>
            <ReceiptIndianRupee size={18} />
          </div>
          <div>
            <div className="stat-value">{expenses.length}</div>
            <div className="stat-label">Entries</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <section className="section">
          <h2 className="section-title">Spending by Category</h2>
          <div className="category-bars">
            {categoryBreakdown.slice(0, 6).map((item, i) => {
              const pct = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
              return (
                <div key={i} className="cat-bar-row">
                  <div className="cat-bar-label">
                    <span className="cat-bar-icon">{item.category.icon}</span>
                    <span className="cat-bar-name">{item.category.name}</span>
                  </div>
                  <div className="cat-bar-track">
                    <div
                      className="cat-bar-fill"
                      style={{ width: `${pct}%`, background: item.category.color }}
                    />
                  </div>
                  <div className="cat-bar-amount">{formatCurrency(item.total)}</div>
                </div>
              );
            })}
            {categoryBreakdown.length > 6 && (
              <Link to="/report" className="see-all-link">
                See all categories →
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Recent Expenses */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Recent Expenses</h2>
          {expenses.length > 5 && (
            <Link to="/expenses" className="see-all-link">
              View All <ArrowRight size={14} />
            </Link>
          )}
        </div>
        {recentExpenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses yet.</p>
            <Link to="/add" className="btn btn-primary">
              <PlusCircle size={18} /> Add First Expense
            </Link>
          </div>
        ) : (
          <div className="expense-list">
            {recentExpenses.map(exp => {
              const cat = categories.find(c => c.id === exp.categoryId);
              return (
                <Link to={`/edit/${exp.id}`} key={exp.id} className="expense-item">
                  <div className="expense-icon" style={{ background: (cat?.color || '#999') + '20' }}>
                    {cat?.icon || '❓'}
                  </div>
                  <div className="expense-details">
                    <div className="expense-cat">{cat?.name || 'Unknown'}</div>
                    <div className="expense-note">{exp.note || formatDate(exp.date)}</div>
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
