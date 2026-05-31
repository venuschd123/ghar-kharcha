import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { formatDate, getCurrency } from './formatters';

applyPlugin(jsPDF);

// ─── Helpers ───────────────────────────────────────────────
function fmt(amount) {
  const c = getCurrency();
  const sym = c.code === 'INR' ? 'Rs.' : c.symbol;
  return sym + Number(amount).toLocaleString(c.locale, { maximumFractionDigits: 0 });
}

/** Strip emojis AND replace ₹ with Rs. for PDF font compatibility */
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

// ─── Main Export ───────────────────────────────────────────
export async function exportToPDF(project, expenses, categories, categoryBreakdown) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth(); // 210
  const H = doc.internal.pageSize.getHeight(); // 297
  const M = 14;
  const RW = W - 2 * M; // usable row width

  const paid = expenses.filter(e => !e.isPending);
  const pending = expenses.filter(e => e.isPending);
  const totalSpent = paid.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = pending.reduce((s, e) => s + e.amount, 0);
  const grandTotal = totalSpent + pendingTotal;
  const remaining = (project.budget || 0) - totalSpent;
  const budgetPct = project.budget > 0 ? Math.round((totalSpent / project.budget) * 100) : 0;

  // Insights
  const highestExp = paid.length > 0 ? paid.reduce((a, b) => a.amount > b.amount ? a : b) : null;
  const highestCat = highestExp ? categories.find(c => c.id === highestExp.categoryId) : null;
  const dates = paid.map(e => e.date).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const daySpan = firstDate && lastDate ? Math.max(1, Math.ceil((new Date(lastDate) - new Date(firstDate)) / 86400000)) : 1;
  const avgPerDay = paid.length > 0 ? Math.round(totalSpent / daySpan) : 0;
  const costPerSqft = project.sqft > 0 ? Math.round(totalSpent / project.sqft) : null;

  // ═══════════════════════════════════════════════════════════
  // PAGE 1: EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════

  // Branded header
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

  // Project title
  let y = 42;
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name, M, y);
  if (project.sqft > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`${project.sqft.toLocaleString()} sq.ft.`, M + doc.getTextWidth(project.name) + 6, y);
  }

  // ─── 3 Summary Boxes ───
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

  // Budget progress bar
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

  // ─── Category Breakdown Table ───
  doc.setFontSize(11);
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.text('Spending by Category', M, y);
  y += 3;

  const catRows = categoryBreakdown.map((item, i) => {
    const pct = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
    return [
      clean(item.category.name),
      String(item.count),
      fmt(item.total),
      `${pct.toFixed(1)}%`,
    ];
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
      // Draw color dot before category name
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
  const insightH = costPerSqft ? 38 : 30;
  doc.roundedRect(M, y, RW, insightH, 2, 2, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(55, 65, 81);
  doc.text('Key Insights', M + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  const insights = [
    `Total entries: ${paid.length} paid + ${pending.length} pending = ${expenses.length}`,
    `Duration: ${formatDate(firstDate)} to ${formatDate(lastDate)} (${daySpan} days) | Avg: ${fmt(avgPerDay)}/day`,
  ];
  if (highestCat) {
    insights.push(`Highest single payment: ${fmt(highestExp.amount)} (${clean(highestCat.name)}, ${formatDate(highestExp.date)})`);
  }
  if (costPerSqft) {
    insights.push(`Cost per sq.ft: Rs.${costPerSqft.toLocaleString()} (${project.sqft.toLocaleString()} sq.ft total area)`);
  }
  insights.forEach((line, i) => {
    doc.text('  ' + line, M + 6, y + 15 + i * 6);
  });

  // ═══════════════════════════════════════════════════════════
  // PAGE 2: ALL EXPENSES
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
  doc.text(project.name, W - M, 12, { align: 'right' });

  // Sort by date descending, group by month
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  const expRows = sorted.map(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    return [
      formatDate(e.date),
      clean(cat?.name || 'Unknown'),
      clean(e.note),
      fmt(e.amount),
      e.isPending ? 'DUE' : 'PAID',
    ];
  });

  doc.autoTable({
    startY: 24,
    head: [['Date', 'Category', 'Description', 'Amount', 'Status']],
    body: expRows,
    styles: { fontSize: 7.5, cellPadding: 2.5, font: 'helvetica', overflow: 'ellipsize' },
    headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 32 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 14, halign: 'center', fontSize: 6.5 },
    },
    didParseCell: (data) => {
      if (data.column.index === 4) {
        if (data.cell.raw === 'DUE') {
          data.cell.styles.textColor = [217, 119, 6];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [5, 150, 105];
        }
      }
    },
    margin: { left: M, right: M },
    // Monthly subtotal rows
    didDrawPage: () => {},
  });

  // Grand total row below table
  const afterTable = doc.lastAutoTable.finalY + 4;
  doc.setFillColor(124, 58, 237);
  doc.roundedRect(M, afterTable, RW, 10, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`Grand Total (Paid): ${fmt(totalSpent)}`, M + 6, afterTable + 7);
  if (pendingTotal > 0) {
    doc.text(`Pending: ${fmt(pendingTotal)}`, W - M - 6, afterTable + 7, { align: 'right' });
  }

  // ─── Footer on all pages ───
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6.5);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Ghar Kharcha | ${project.name} | ${formatDate(new Date().toISOString())} | Page ${i} of ${pageCount}`,
      W / 2, H - 7, { align: 'center' }
    );
    // Thin violet line above footer
    doc.setDrawColor(124, 58, 237);
    doc.setLineWidth(0.3);
    doc.line(M, H - 11, W - M, H - 11);
  }

  doc.save(`${project.name.replace(/\s+/g, '_')}_Report.pdf`);
}
