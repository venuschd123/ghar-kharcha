import { formatDate, getCurrency } from './formatters';

function fmt(amount) {
  const c = getCurrency();
  return Number(amount).toLocaleString(c.locale, { maximumFractionDigits: 0 });
}

export async function exportToExcel(project, expenses, categories, vendors) {
  // Dynamic import so it doesn't bloat the main bundle
  const xlsxModule = await import('xlsx');
  // Handle both CJS-wrapped (default) and direct ESM exports
  const XLSX = xlsxModule.default ?? xlsxModule;

  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: project.name,
    Subject: 'Construction Cost Report',
    Author: 'Ghar Kharcha',
    CreatedDate: new Date(),
  };

  // ─── Sheet 1: Summary ───
  const totalPaid = expenses.filter(e => !e.isPending).reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.isPending).reduce((s, e) => s + e.amount, 0);

  const summaryData = [
    ['Ghar Kharcha — Construction Cost Report', '', '', ''],
    ['Project:', project.name, '', ''],
    ['Report Date:', formatDate(new Date().toISOString()), '', ''],
    ['', '', '', ''],
    ['SUMMARY', '', '', ''],
    ['Total Paid', fmt(totalPaid), '', ''],
    ['Total Pending', fmt(totalPending), '', ''],
    ['Grand Total', fmt(totalPaid + totalPending), '', ''],
    ['Budget', project.budget > 0 ? fmt(project.budget) : 'Not set', '', ''],
    ['Remaining', project.budget > 0 ? fmt(project.budget - totalPaid) : '-', '', ''],
    ['Area', project.sqft > 0 ? `${project.sqft} sq.ft.` : 'Not set', '', ''],
    ['Cost/sq.ft', project.sqft > 0 && totalPaid > 0 ? fmt(Math.round(totalPaid / project.sqft)) : '-', '', ''],
    ['Total Entries', expenses.length, '', ''],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  // ─── Sheet 2: All Expenses ───
  const sortedExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const expHeaders = ['Date', 'Category', 'Note', 'Vendor', 'Amount', 'Status'];
  const expRows = sortedExpenses.map(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    const vendor = vendors?.find(v => v.id === e.vendorId);
    return [
      formatDate(e.date),
      cat?.name || 'Unknown',
      e.note || '',
      vendor?.name || '',
      e.amount,
      e.isPending ? 'Pending' : 'Paid',
    ];
  });
  const ws2 = XLSX.utils.aoa_to_sheet([expHeaders, ...expRows]);
  ws2['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'All Expenses');

  // ─── Sheet 3: By Category ───
  const catMap = {};
  expenses.forEach(e => {
    if (!catMap[e.categoryId]) catMap[e.categoryId] = { paid: 0, pending: 0, count: 0 };
    if (e.isPending) catMap[e.categoryId].pending += e.amount;
    else catMap[e.categoryId].paid += e.amount;
    catMap[e.categoryId].count++;
  });
  const catHeaders = ['Category', 'Entries', 'Paid', 'Pending', 'Total', '% of Total'];
  const catRows = Object.entries(catMap).map(([id, data]) => {
    const cat = categories.find(c => c.id === Number(id));
    const total = data.paid + data.pending;
    const pct = totalPaid > 0 ? ((data.paid / totalPaid) * 100).toFixed(1) + '%' : '0%';
    return [cat?.name || 'Unknown', data.count, data.paid, data.pending, total, pct];
  }).sort((a, b) => b[2] - a[2]);
  const ws3 = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
  ws3['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws3, 'By Category');

  // ─── Sheet 4: By Vendor ───
  if (vendors && vendors.length > 0) {
    const venMap = {};
    expenses.forEach(e => {
      if (!e.vendorId) return;
      if (!venMap[e.vendorId]) venMap[e.vendorId] = { paid: 0, pending: 0, count: 0 };
      if (e.isPending) venMap[e.vendorId].pending += e.amount;
      else venMap[e.vendorId].paid += e.amount;
      venMap[e.vendorId].count++;
    });
    const venHeaders = ['Vendor', 'Type', 'Entries', 'Paid', 'Pending', 'Total'];
    const venRows = Object.entries(venMap).map(([id, data]) => {
      const v = vendors.find(v => v.id === Number(id));
      return [v?.name || 'Unknown', v?.type || '', data.count, data.paid, data.pending, data.paid + data.pending];
    }).sort((a, b) => b[3] - a[3]);
    const ws4 = XLSX.utils.aoa_to_sheet([venHeaders, ...venRows]);
    ws4['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'By Vendor');
  }

  // ─── Sheet 5: Monthly ───
  const monthMap = {};
  expenses.filter(e => !e.isPending).forEach(e => {
    const [y, m] = e.date.split('-');
    const key = `${y}-${m}`;
    monthMap[key] = (monthMap[key] || 0) + e.amount;
  });
  const monthHeaders = ['Month', 'Amount Spent'];
  const monthRows = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, amt]) => {
      const [y, m] = key.split('-');
      const d = new Date(Number(y), Number(m) - 1, 1);
      return [d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }), amt];
    });
  const ws5 = XLSX.utils.aoa_to_sheet([monthHeaders, ...monthRows]);
  ws5['!cols'] = [{ wch: 18 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, ws5, 'Monthly');

  // ─── Save ───
  XLSX.writeFile(wb, `${project.name.replace(/\s+/g, '_')}_Report.xlsx`);
}
