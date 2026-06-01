import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { formatCurrency, formatDate, formatDateLabel, groupByDate } from '../utils/formatters';
import { Check, Search, Receipt, Filter } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

export default function Expenses() {
  const { activeProject } = useProject();
  const categories = useLiveQuery(() => db.categories.toArray());
  const expenses = useLiveQuery(
    () => activeProject ? db.expenses.where('projectId').equals(activeProject.id).toArray() : [],
    [activeProject?.id], []
  );
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(null);

  if (!categories || !activeProject || !expenses) return <div className="page-loading">Loading...</div>;

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
  const totalFiltered = filtered.filter(e => !e.isPending).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page expenses-page">
      <header className="page-header">
        <h1 className="page-title">Expenses</h1>
        <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600, background: 'var(--surface)', padding: '5px 10px', borderRadius: 20 }}>
          {filtered.length}
        </span>
      </header>

      {/* Search */}
      <div className="expenses-search-wrap">
        <Search size={15} className="expenses-search-icon" style={{ position: 'absolute', left: 'calc(var(--px) + 13px)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
        <input
          type="text"
          className="expenses-search"
          placeholder="Search note, category, amount..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 6, padding: '0 var(--px) 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          onClick={() => setFilterCat(null)}
          style={{
            padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: !filterCat ? 'var(--accent-dim)' : 'var(--surface)',
            color: !filterCat ? 'var(--accent)' : 'var(--text-2)',
            border: !filterCat ? '1.5px solid var(--accent-border)' : '1.5px solid transparent',
          }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
            style={{
              padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              background: filterCat === cat.id ? cat.color + '18' : 'var(--surface)',
              color: filterCat === cat.id ? cat.color : 'var(--text-2)',
              border: filterCat === cat.id ? `1.5px solid ${cat.color}44` : '1.5px solid transparent',
            }}
          >
            {cat.icon} {cat.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Total strip */}
      {filtered.length > 0 && (
        <div className="expenses-total">
          {search || filterCat ? 'Filtered total: ' : 'Total paid: '}
          <strong>{formatCurrency(totalFiltered)}</strong>
        </div>
      )}

      {/* List */}
      {grouped.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {search || filterCat ? <Search size={26} /> : <Receipt size={26} />}
          </div>
          <h3>{search || filterCat ? 'No results' : 'No expenses yet'}</h3>
          <p>{search || filterCat ? 'Try a different filter or search term.' : 'Tap the + button to log your first expense.'}</p>
        </div>
      ) : (
        grouped.map(([dateKey, exps]) => {
          return (
            <div key={dateKey} className="date-group">
              {(() => {
                const paidTotal = exps.filter(e => !e.isPending).reduce((s, e) => s + e.amount, 0);
                const pendingTotal = exps.filter(e => e.isPending).reduce((s, e) => s + e.amount, 0);
                return (
                  <div className="date-group-header">
                    <span className="date-group-label">{formatDateLabel(dateKey)}</span>
                    <span className="date-group-total">
                      {formatCurrency(paidTotal)}
                      {pendingTotal > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 700, marginLeft: 4 }}>
                          +{formatCurrency(pendingTotal)} due
                        </span>
                      )}
                    </span>
                  </div>
                );
              })()}
              <div className="date-group-list">
                {[...exps].sort((a, b) => b.id - a.id).map(exp => {
                  const cat = categories.find(c => c.id === exp.categoryId);
                  return (
                    <div key={exp.id} className={`expense-item-wrap${exp.isPending ? ' pending' : ''}`}>
                      <Link to={`/edit/${exp.id}`} className="expense-item">
                        <div className="expense-icon" style={{ background: (cat?.color || '#999') + '20' }}>
                          {cat?.icon || '?'}
                        </div>
                        <div className="expense-details">
                          <div className="expense-cat" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {cat?.name || 'Unknown'}
                            {exp.isPending && (
                              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', background: 'var(--gold-dim)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                                Due
                              </span>
                            )}
                          </div>
                          <div className="expense-note">
                            {exp.photo && <span style={{ marginRight: 4, color: 'var(--accent)', fontWeight: 700, fontSize: 10 }}>+photo</span>}
                            {exp.note || formatDate(exp.date)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                          <div className="expense-amount" style={exp.isPending ? { color: 'var(--gold)' } : {}}>
                            {formatCurrency(exp.amount)}
                          </div>
                        </div>
                      </Link>
                      {exp.isPending && (
                        <button
                          className="mark-paid-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await db.expenses.update(exp.id, { isPending: false });
                          }}
                        >
                          <Check size={11} /> Mark Paid
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
