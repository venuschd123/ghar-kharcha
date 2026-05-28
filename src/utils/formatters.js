export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  // Parse YYYY-MM-DD as local midnight to avoid UTC offset shifting the displayed day
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function groupByDate(expenses) {
  const groups = {};
  expenses.forEach(e => {
    const key = e.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => new Date(b) - new Date(a));
}

export function groupByCategory(expenses, categories) {
  const map = {};
  expenses.forEach(e => {
    const catId = e.categoryId;
    if (!map[catId]) map[catId] = { total: 0, count: 0 };
    map[catId].total += e.amount;
    map[catId].count += 1;
  });
  return Object.entries(map)
    .map(([catId, data]) => {
      const cat = categories.find(c => c.id === Number(catId));
      return { ...data, category: cat || { name: 'Unknown', icon: '❓', color: '#999' } };
    })
    .sort((a, b) => b.total - a.total);
}
