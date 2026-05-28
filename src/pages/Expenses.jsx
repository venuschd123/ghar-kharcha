import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { formatCurrency, formatDate, groupByDate } from '../utils/formatters';
import { Search, Filter } from 'lucide-react';

export default function Expenses() {
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
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  if (!categories || !projects || !expenses) return <div className="page-loading">Loading...</div>;

  let filtered = expenses;

  if (filterCat) {
    filtered = filtered.filter(e => e.categoryId === filterCat);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e => {
      const cat = categories.find(c => c.id === e.categoryId);
      return (
        (e.note && e.note.toLowerCase().includes(q)) ||
        (cat && cat.name.toLowerCase().includes(q)) ||
        String(e.amount).includes(q)
      );
    });
  }

  const grouped = groupByDate(filtered);
  const totalFiltered = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page expenses-page">
      <header className="page-header">
        <h1 className="page-title">All Expenses</h1>
        <div className="header-right">
          <span className="expense-count">{filtered.length} entries</span>
        </div>
      </header>

      {/* Search + Filter */}
      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search by note, category, amount..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <button
          className={`filter-toggle ${filterCat ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div className="filter-chips">
          <button
            className={`filter-chip ${!filterCat ? 'active' : ''}`}
            onClick={() => setFilterCat(null)}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`filter-chip ${filterCat === cat.id ? 'active' : ''}`}
              onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
              style={{
                borderColor: filterCat === cat.id ? cat.color : 'transparent',
                background: filterCat === cat.id ? cat.color + '20' : undefined,
              }}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Total */}
      {filtered.length > 0 && (
        <div className="filtered-total">
          Total: <strong>{formatCurrency(totalFiltered)}</strong>
        </div>
      )}

      {/* Grouped List */}
      {grouped.length === 0 ? (
        <div className="empty-state">
          <p>{search || filterCat ? 'No matching expenses found.' : 'No expenses recorded yet.'}</p>
        </div>
      ) : (
        <div className="expense-groups">
          {grouped.map(([date, exps]) => {
            const dayTotal = exps.reduce((s, e) => s + e.amount, 0);
            return (
              <div key={date} className="expense-group">
                <div className="group-header">
                  <span>{formatDate(date)}</span>
                  <span className="group-total">{formatCurrency(dayTotal)}</span>
                </div>
                <div className="expense-list">
                  {exps
                    .sort((a, b) => b.id - a.id)
                    .map(exp => {
                      const cat = categories.find(c => c.id === exp.categoryId);
                      return (
                        <Link to={`/edit/${exp.id}`} key={exp.id} className="expense-item">
                          <div className="expense-icon" style={{ background: (cat?.color || '#999') + '20' }}>
                            {cat?.icon || '❓'}
                          </div>
                          <div className="expense-details">
                            <div className="expense-cat">{cat?.name || 'Unknown'}</div>
                            {exp.note && <div className="expense-note">{exp.note}</div>}
                          </div>
                          <div className="expense-amount">{formatCurrency(exp.amount)}</div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
