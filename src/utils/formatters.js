export function formatCurrency(amount) {
  if (amount == null) return '₹0';
  return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function formatCompact(amount) {
  if (!amount || amount === 0) return '₹0';
  const n = Number(amount);
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  if (n >= 10000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const today = getToday();
  const yesterday = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return formatDateShort(dateStr);
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

export function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export function groupByDate(expenses) {
  const groups = {};
  expenses.forEach(e => {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

export function groupByCategory(expenses, categories) {
  const map = {};
  expenses.forEach(e => {
    if (!map[e.categoryId]) map[e.categoryId] = { total: 0, count: 0 };
    map[e.categoryId].total += e.amount;
    map[e.categoryId].count += 1;
  });
  return Object.entries(map)
    .map(([catId, data]) => {
      const cat = categories.find(c => c.id === Number(catId));
      return { ...data, category: cat || { name: 'Unknown', icon: '❓', color: '#999' } };
    })
    .sort((a, b) => b.total - a.total);
}
