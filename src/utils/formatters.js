/**
 * Currency & formatting utilities.
 * Currency is read from a module-level cache, set by setCurrency().
 */

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', label: '₹ Indian Rupee', compact: 'indian' },
  { code: 'USD', symbol: '$', locale: 'en-US', label: '$ US Dollar', compact: 'international' },
  { code: 'AED', symbol: 'د.إ', locale: 'ar-AE', label: 'د.إ UAE Dirham', compact: 'international' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', label: '£ British Pound', compact: 'international' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', label: '€ Euro', compact: 'international' },
  { code: 'CAD', symbol: 'C$', locale: 'en-CA', label: 'C$ Canadian Dollar', compact: 'international' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU', label: 'A$ Australian Dollar', compact: 'international' },
];

export const UNITS = [
  { key: 'sqft', label: 'sq. ft.', factor: 1 },
  { key: 'sqm', label: 'sq. m.', factor: 0.0929 },
  { key: 'sqyd', label: 'sq. yd.', factor: 0.1111 },
];

let _currency = CURRENCIES[0]; // default INR
let _unit = UNITS[0]; // default sq.ft

export function setCurrency(code) {
  _currency = CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
}

export function getCurrency() {
  return _currency;
}

export function setUnit(key) {
  _unit = UNITS.find(u => u.key === key) || UNITS[0];
}

export function getUnit() {
  return _unit;
}

export function convertArea(sqft) {
  return sqft * _unit.factor;
}

export function formatCurrency(amount) {
  if (amount == null) return _currency.symbol + '0';
  return _currency.symbol + Number(amount).toLocaleString(_currency.locale, { maximumFractionDigits: 0 });
}

export function formatCompact(amount) {
  if (!amount || amount === 0) return _currency.symbol + '0';
  const n = Number(amount);
  const s = _currency.symbol;

  if (_currency.compact === 'indian') {
    if (n >= 10000000) return s + (n / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
    if (n >= 100000) return s + (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    if (n >= 10000) return s + (n / 1000).toFixed(0) + 'K';
  } else {
    if (n >= 1000000) return s + (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 10000) return s + (n / 1000).toFixed(0) + 'K';
  }
  return s + n.toLocaleString(_currency.locale, { maximumFractionDigits: 0 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(_currency.locale || 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('T')[0].split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(_currency.locale || 'en-IN', { day: 'numeric', month: 'short' });
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
