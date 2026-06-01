import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { formatDate, getCurrency } from './formatters';

applyPlugin(jsPDF);

function fmt(amount) {
  const c = getCurrency();
  const sym = c.code === 'INR' ? 'Rs.' : c.symbol;
  return sym + Number(amount).toLocaleString(c.locale, { maximumFractionDigits: 0 });
}

function clean(str) {
  if (!str) return '-';
  return str
    .replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/gu, '')
    .replace(/₹/g, 'Rs.')
    .trim() || '-';
}

function drawBar(doc, x, y, width, height, pct, color) {
  doc.setFillColor(230, 230, 235);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'F');
  if (pct > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, Math.max(width * Math.min(pct, 100) / 100, 3), height, 1.5, 1.5, 'F');
  }
}

const COLORS = [
  [124, 58, 237], [5, 150, 105], [217, 119, 6], [220, 38, 38],
  [14, 165, 233], [168, 85, 247], [234, 88, 12], [107, 114, 128],
];

export async function exportToPDF(project, expenses, categories, categoryBreakdown, vendors = []) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const RW = W - 2 * M;

  const paid = expenses.filter(e => !e.isPending);
  const pending = expenses.filter(e => e.isPending);
  const totalSpent = paid.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = pending.reduce((s, e) => s + e.amount, 0);
  const remaining = (project.budget || 0) - totalSpent;
  const budgetPct = project.budget > 0 ? Math.round((totalSpent / project.budget) * 100) : 0;

  const highestExp = paid.length > 0 ? paid.reduce((a, b) => a.amount > b.amount ? a : b) : null;
  const highestCat = highestExp ? categories.find(c => c.id === highestExp.categoryId) : null;
  const dates = paid.map(e => e.date).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const daySpan = firstDate && lastDate ? Math.max(1, Math.ceil((new Date(lastDate) - new Date(firstDate)) / 86400000)) : 1;
  const avgPerDay = paid.length > 0 ? Math.round(totalSpent / daySpan) : 0;
  const costPerSqft = project.sqft > 0 ? Math.round(totalSpent / project.sqft) : null;

  // Build vendor lookup map
  const vendorMap = {};
  vendors.forEach(v => { vendorMap[v.id] = v; });

  // ═══════════════════════════════════════════════════════════
  // PAGE 1: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, W, 32, 'F');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('GHAR KHARCHA', M, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Construction Cost Report', M, 22);
  doc.setFontSize(8);
  doc.text(formatDate(new Date().toISOString()), W - M, 22, { align: 'right' });

  let y = 42;
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(clean(project.name), M, y);
  if (project.sqft > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`${project.sqft.toLocaleString()} sq.ft.`, M + doc.getTextWidth(clean(project.name)) + 6, y);
  }

  // Summary boxes
  y += 10;
  const boxW = (RW - 8) / 3;
  const boxH = 24;
  const boxes = [
    { label: 'TOTAL SPENT', value: fmt(totalSpent), color: [124, 58, 237] },
    { label: project.budget > 0 ? 'BUDGET' : 'TOTAL ENTRIES', value: project.budget > 0 ? fmt(project.budget) : String(expenses.length), color: [5, 150, 105] },
    { label: pendingTotal > 0 ? 'PENDING DUES' : remaining < 0 ? 'OVER BUDGET' : 'REMAINING', value: pendingTotal > 0 ? fmt(pendingTotal) : project.budget > 0 ? fmt(Math.abs(remaining)) : fmt(avgPerDay) + '/day', color: pendingTotal > 0 ? [217, 119, 6] : remaining < 0 ? [220, 38, 38] : [14, 165, 233] },
  ];
  boxes.forEach((b, i) => {
    const bx = M + i * (boxW + 4);
    doc.setFillColor(...b.color);
    doc.roundedRect(bx, y, boxW, boxH, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(b.label, bx + 5, y + 8);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(b.value, bx + 5, y + 18);
  });

  if (project.budget > 0) {
    y += boxH + 8;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Budget utilization: ${budgetPct}%`, M, y);
    doc.text(remaining >= 0 ? `${fmt(remaining)} remaining` : `${fmt(Math.abs(remaining))} over budget`, W - M, y, { align: 'right' });
    y += 3;
    drawBar(doc, M, y, RW, 4, budgetPct, budgetPct > 90 ? [220, 38, 38] : budgetPct > 70 ? [217, 119, 6] : [124, 58, 237]);
    y += 10;
  } else {
    y += boxH + 10;
  }

  // Category breakdown table
  doc.setFontSize(11);
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.text('Spending by Category', M, y);
  y += 3;

  const catRows = categoryBreakdown.map(item => {
    const pct = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
    return [clean(item.category.name), String(item.count), fmt(item.total), `${pct.toFixed(1)}%`];
  });

  doc.autoTable({
    startY: y,
    head: [['Category', 'Entries', 'Amount', 'Share']],
    body: catRows,
    styles: { fontSize: 8, cellPadding: 3.5, font: 'helvetica', textColor: [33, 33, 33] },
    headStyles: { fillColor: [243, 244, 246], textColor: [75, 85, 99], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
    },
    didDrawCell: (data) => {
      if (data.column.index === 0 && data.section === 'body') {
        const color = COLORS[data.row.index % COLORS.length];
        doc.setFillColor(...color);
        doc.circle(data.cell.x + 3, data.cell.y + data.cell.height / 2, 1.5, 'F');
      }
    },
    margin: { left: M, right: M },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ─── Key Insights Box ───
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  const insightLines = [
    `Total entries: ${paid.length} paid + ${pending.length} pending = ${expenses.length}`,
    firstDate ? `Duration: ${formatDate(firstDate)} to ${formatDate(lastDate)} (${daySpan} days) | Avg: ${fmt(avgPerDay)}/day` : null,
    highestCat ? `Highest payment: ${fmt(highestExp.amount)} — ${clean(highestCat.name)} on ${formatDate(highestExp.date)}` : null,
    costPerSqft ? `Cost per sq.ft: Rs.${costPerSqft.toLocaleString()} (${project.sqft.toLocaleString()} sq.ft area)` : null,
  ].filter(Boolean);
  const insightH = 12 + insightLines.length * 6;
  doc.roundedRect(M, y, RW, insightH, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Key Insights', M + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  insightLines.forEach((line, i) => doc.text('  ' + line, M + 6, y + 15 + i * 6));

  // ─── Monthly Breakdown (mini) ───
  const monthMap = {};
  paid.forEach(e => {
    const [yr, mo] = e.date.split('-');
    const k = `${yr}-${mo}`;
    monthMap[k] = (monthMap[k] || 0) + e.amount;
  });
  const monthEntries = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b));
  if (monthEntries.length > 1) {
    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + insightH + 14 : y + insightH + 8;
    // check if fits, else new page
    if (y + 40 > H - 20) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text('Monthly Spending', M, y);
    y += 3;
    const monthRows = monthEntries.map(([key, amt]) => {
      const [yr2, mo2] = key.split('-');
      const label = new Date(Number(yr2), Number(mo2) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) + '%' : '0%';
      return [label, fmt(amt), pct];
    });
    doc.autoTable({
      startY: y,
      head: [['Month', 'Amount', '% of Total']],
      body: monthRows,
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', textColor: [33, 33, 33] },
      headStyles: { fillColor: [243, 244, 246], textColor: [75, 85, 99], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
        2: { cellWidth: 30, halign: 'right' },
      },
      margin: { left: M, right: M },
    });
  }

  // ═══════════════════════════════════════════════════════════
  // PAGE 2: ALL EXPENSES (with vendor column + monthly grouping)
  // ═══════════════════════════════════════════════════════════
  doc.addPage();

  doc.setFillColor(55, 65, 81);
  doc.rect(0, 0, W, 18, 'F');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('All Expenses', M, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(clean(project.name), W - M, 12, { align: 'right' });

  // Group by month for subtotals
  const expByMonth = {};
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  sorted.forEach(e => {
    const [yr, mo] = e.date.split('-');
    const k = `${yr}-${mo}`;
    if (!expByMonth[k]) expByMonth[k] = [];
    expByMonth[k].push(e);
  });

  // Build rows with month group headers
  const expBody = [];
  Object.entries(expByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([key, group]) => {
      const [yr2, mo2] = key.split('-');
      const monthLabel = new Date(Number(yr2), Number(mo2) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const groupTotal = group.filter(e => !e.isPending).reduce((s, e) => s + e.amount, 0);
      // Month header row (will be styled)
      expBody.push({ isHeader: true, label: monthLabel, total: groupTotal });
      group.forEach(e => {
        const cat = categories.find(c => c.id === e.categoryId);
        const vendor = vendorMap[e.vendorId];
        expBody.push({
          isHeader: false,
          cols: [
            formatDate(e.date),
            clean(cat?.name || 'Unknown'),
            clean(e.note),
            clean(vendor?.name || ''),
            fmt(e.amount),
            e.isPending ? 'DUE' : 'PAID',
          ],
          isPending: e.isPending,
        });
      });
    });

  // Flatten into autoTable body with custom styling via willDrawCell
  const flatBody = [];
  const rowMeta = [];
  expBody.forEach(row => {
    if (row.isHeader) {
      flatBody.push([row.label, '', '', '', fmt(row.total), '']);
      rowMeta.push({ type: 'month-header' });
    } else {
      flatBody.push(row.cols);
      rowMeta.push({ type: 'expense', isPending: row.isPending });
    }
  });

  doc.autoTable({
    startY: 24,
    head: [['Date', 'Category', 'Description', 'Vendor', 'Amount', 'Status']],
    body: flatBody,
    styles: { fontSize: 7.5, cellPadding: 2.5, font: 'helvetica', overflow: 'ellipsize' },
    headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 28 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 26 },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 14, halign: 'center', fontSize: 6.5 },
    },
    willDrawCell: (data) => {
      if (data.section !== 'body') return;
      const meta = rowMeta[data.row.index];
      if (meta?.type === 'month-header') {
        doc.setFillColor(237, 233, 254);
      }
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const meta = rowMeta[data.row.index];
      if (meta?.type === 'month-header') {
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 8;
          data.cell.styles.textColor = [109, 40, 217];
          data.cell.colSpan = 4;
        } else if (data.column.index === 4) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [109, 40, 217];
          data.cell.styles.halign = 'right';
        } else {
          data.cell.text = [];
        }
      } else if (meta?.isPending && data.column.index === 5) {
        data.cell.styles.textColor = [217, 119, 6];
        data.cell.styles.fontStyle = 'bold';
      } else if (!meta?.isPending && data.column.index === 5) {
        data.cell.styles.textColor = [5, 150, 105];
      }
    },
    margin: { left: M, right: M },
  });

  // Grand total bar
  const afterTable = doc.lastAutoTable.finalY + 4;
  if (afterTable < H - 20) {
    doc.setFillColor(124, 58, 237);
    doc.roundedRect(M, afterTable, RW, 10, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`Grand Total (Paid): ${fmt(totalSpent)}`, M + 6, afterTable + 7);
    if (pendingTotal > 0) {
      doc.text(`Pending: ${fmt(pendingTotal)}`, W - M - 6, afterTable + 7, { align: 'right' });
    }
  }

  // ─── Vendor Summary page (if vendors exist) ───
  const vendorEntries = vendors.filter(v => expenses.some(e => e.vendorId === v.id));
  if (vendorEntries.length > 0) {
    doc.addPage();
    doc.setFillColor(55, 65, 81);
    doc.rect(0, 0, W, 18, 'F');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendor Summary', M, 12);

    const venRows = vendorEntries.map(v => {
      const vExps = expenses.filter(e => e.vendorId === v.id);
      const vPaid = vExps.filter(e => !e.isPending).reduce((s, e) => s + e.amount, 0);
      const vPending = vExps.filter(e => e.isPending).reduce((s, e) => s + e.amount, 0);
      return [clean(v.name), v.type || '-', String(vExps.length), fmt(vPaid), vPending > 0 ? fmt(vPending) : '-', fmt(vPaid + vPending)];
    }).sort((a, b) => {
      const aVal = parseFloat(a[5].replace(/[^0-9.]/g, ''));
      const bVal = parseFloat(b[5].replace(/[^0-9.]/g, ''));
      return bVal - aVal;
    });

    doc.autoTable({
      startY: 24,
      head: [['Vendor', 'Type', 'Entries', 'Paid', 'Pending', 'Total']],
      body: venRows,
      styles: { fontSize: 8, cellPadding: 3, font: 'helvetica', textColor: [33, 33, 33] },
      headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', fontSize: 7 },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' },
        1: { cellWidth: 22 },
        2: { cellWidth: 16, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
        5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: M, right: M },
    });
  }

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Ghar Kharcha | ${clean(project.name)} | ${formatDate(new Date().toISOString())} | Page ${i} of ${pageCount}`,
      W / 2, H - 7, { align: 'center' }
    );
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(0.3);
    doc.line(M, H - 11, W - M, H - 11);
  }

  doc.save(`${project.name.replace(/\s+/g, '_')}_Report.pdf`);
}
