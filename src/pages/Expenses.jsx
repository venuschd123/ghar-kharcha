import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { formatCurrency, formatDate, formatDateLabel, groupByDate } from '../utils/formatters';
import { Check } from 'lucide-react';

export default function Expenses() {
  const categories = useLiveQuery(() => db.categories.toArray());
  const projects = useLiveQuery(() => db.projects.toArray());
  const projectId = projects?.[0]?.id;
  const expenses = useLiveQuery(
    () => projectId != null ? db.expenses.where('projectId').equals(projectId).toArray() : [],
    [projectId],
    []
  );
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(null);

  if (!categories || !projects || !expenses) return <div className="page-loading">Loading…</div>;

  let filtered = expenses;
  if (filterCat) filtered = filtered.filter(e => e.categoryId === filterCat);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      return (e.note && e.note.toLowerCase().includes(q)) ||
        (cat && cat.name.toLowerCase().includes(q)) ||
        String(e.amount).includes(q);
    });
  }

  const grouped = groupByDate(filtered);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page expenses-page">
      <header className="page-header">
        <h1 className="page-title">Expenses</h1>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>
          {filtered.length} entries
        </span>
      </header>

      {/* Search */}
      <div className="expenses-search-wrap">
        <input
          type="text"
          className="expenses-search"
          placeholder="Search by note, category, amount…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 6, padding: '0 var(--px) 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          style={{
            padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
            background: !filterCat ? 'var(--accent-dim)' : 'var(--surface)',
            color: !filterCat ? 'var(--accent)' : 'var(--text-2)',
            border: !filterCat ? '1px solid var(--accent-border)' : '1px solid transparent',
          }}
          onClick={() => setFilterCat(null)}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            style={{
              padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
              background: filterCat === cat.id ? cat.color + '18' : 'var(--surface)',
              color: filterCat === cat.id ? cat.color : 'var(--text-2)',
              border: filterCat === cat.id ? `1px solid ${cat.color}44` : '1px solid transparent',
            }}
            onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
          >
            {cat.icon} {cat.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Total */}
      {filtered.length > 0 && (
        <div className="expenses-total">
          Total: <strong>{formatCurrency(totalFiltered)}</strong>
        </div>
      )}

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>{search || filterCat ? 'No results' : 'No expenses yet'}</h3>
          <p>{search || filterCat ? 'Try a different search or filter.' : 'Add your first expense using the + button.'}</p>
        </div>
      ) : (
        grouped.map(([dateKey, exps]) => {
          const dayTotal = exps.reduce((s, e) => s + e.amount, 0);
          return (
            <div key={dateKey} className="date-group">
              <div className="date-group-header">
                <span className="date-group-label">{formatDateLabel(dateKey)}</span>
                <span className="date-group-total">{formatCurrency(dayTotal)}</span>
              </div>
              <div className="date-group-list">
                {[...exps].sort((a, b) => b.id - a.id).map(exp => {
                  const cat = categories.find(c => c.id === exp.categoryId);
                  return (
                    <div key={exp.id} className={`expense-item-wrap${exp.isPending ? ' pending' : ''}`}>
                      <Link to={`/edit/${exp.id}`} className="expense-item">
                        <div className="expense-icon" style={{ background: (cat?.color || '#999') + '22' }}>
                          {cat?.icon || '❓'}
                        </div>
                        <div className="expense-details">
                          <div className="expense-cat">
                            {exp.isPending && <span className="pending-dot" />}
                            {cat?.name || 'Unknown'}
                          </div>
                          <div className="expense-note">{exp.note || formatDate(exp.date)}</div>
                        </div>
                        <div className="expense-amount" style={exp.isPending ? { color: 'var(--gold)' } : {}}>
                          {formatCurrency(exp.amount)}
                        </div>
                      </Link>
                      {exp.isPending && (
                        <button
                          className="mark-paid-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await db.expenses.update(exp.id, { isPending: false });
                          }}
                          title="Mark as paid"
                        >
                          <Check size={13} /> Paid
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
