import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { formatDate, getCurrency } from './formatters';

applyPlugin(jsPDF);

// ─── Helpers ───────────────────────────────────────────────
function fmt(amount) {
  const c = getCurrency();
  // Use Rs. instead of ₹ to avoid font issues in PDF
  const sym = c.code === 'INR' ? 'Rs.' : c.symbol;
  return sym + Number(amount).toLocaleString(c.locale, { maximumFractionDigits: 0 });
}

function stripEmoji(str) {
  return str.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/gu, '').trim();
}

function drawBar(doc, x, y, width, height, pct, color) {
  // Track
  doc.setFillColor(235, 235, 235);
  doc.roundedRect(x, y, width, height, 1.5, 1.5, 'F');
  // Fill
  if (pct > 0) {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, Math.max(width * (pct / 100), 3), height, 1.5, 1.5, 'F');
  }
}

function drawPieSlice(doc, cx, cy, r, startAngle, endAngle, color) {
  const steps = Math.max(Math.ceil((endAngle - startAngle) / 0.05), 4);
  const points = [[cx, cy]];
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / steps);
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  doc.setFillColor(...color);
  // Draw as filled polygon
  const first = points[0];
  doc.triangle(first[0], first[1], points[1][0], points[1][1], points[2][0], points[2][1], 'F');
  for (let i = 2; i < points.length - 1; i++) {
    doc.triangle(cx, cy, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], 'F');
  }
}

const COLORS = [
  [124, 58, 237],  // violet
  [5, 150, 105],   // green
  [217, 119, 6],   // gold
  [220, 38, 38],   // red
  [14, 165, 233],  // blue
  [168, 85, 247],  // purple
  [234, 88, 12],   // orange
  [107, 114, 128], // gray
];

// ─── Main Export ───────────────────────────────────────────
export async function exportToPDF(project, expenses, categories, categoryBreakdown) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16; // margin

  const paidExpenses = expenses.filter(e => !e.isPending);
  const pendingExpenses = expenses.filter(e => e.isPending);
  const totalSpent = paidExpenses.reduce((s, e) => s + e.amount, 0);
  const pendingTotal = pendingExpenses.reduce((s, e) => s + e.amount, 0);
  const remaining = (project.budget || 0) - totalSpent;
  const budgetPct = project.budget > 0 ? Math.round((totalSpent / project.budget) * 100) : 0;

  // ═══ PAGE 1: Summary ═══

  // Header bar
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, W, 36, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Ghar Kharcha', M, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Construction Cost Report', M, 24);
  doc.setFontSize(9);
  doc.text(formatDate(new Date().toISOString()), W - M, 24, { align: 'right' });

  // Project name
  let y = 48;
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(project.name, M, y);

  // Summary boxes
  y += 12;
  const boxW = (W - 2 * M - 12) / 3;

  // Box 1: Total Spent
  doc.setFillColor(124, 58, 237);
  doc.roundedRect(M, y, boxW, 28, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL SPENT', M + 6, y + 9);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(fmt(totalSpent), M + 6, y + 21);

  // Box 2: Budget
  doc.setFillColor(5, 150, 105);
  doc.roundedRect(M + boxW + 6, y, boxW, 28, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(project.budget > 0 ? 'BUDGET' : 'ENTRIES', M + boxW + 12, y + 9);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(project.budget > 0 ? fmt(project.budget) : String(expenses.length), M + boxW + 12, y + 21);

  // Box 3: Remaining/Pending
  const box3Color = pendingTotal > 0 ? [217, 119, 6] : remaining < 0 ? [220, 38, 38] : [14, 165, 233];
  doc.setFillColor(...box3Color);
  doc.roundedRect(M + 2 * (boxW + 6), y, boxW, 28, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(pendingTotal > 0 ? 'PENDING DUES' : project.budget > 0 ? 'REMAINING' : 'AVG ENTRY', M + 2 * (boxW + 6) + 6, y + 9);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const box3Val = pendingTotal > 0 ? fmt(pendingTotal) : project.budget > 0 ? fmt(Math.abs(remaining)) : fmt(paidExpenses.length > 0 ? totalSpent / paidExpenses.length : 0);
  doc.text(box3Val, M + 2 * (boxW + 6) + 6, y + 21);

  // Budget progress bar
  if (project.budget > 0) {
    y += 36;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Budget Used: ${budgetPct}%`, M, y);
    doc.text(remaining >= 0 ? `${fmt(remaining)} left` : `${fmt(Math.abs(remaining))} over`, W - M, y, { align: 'right' });
    y += 4;
    drawBar(doc, M, y, W - 2 * M, 5, budgetPct, budgetPct > 90 ? [220, 38, 38] : budgetPct > 70 ? [217, 119, 6] : [124, 58, 237]);
  }

  // ─── Category Breakdown with visual bars ───
  y += 16;
  doc.setFontSize(12);
  doc.setTextColor(33, 33, 33);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Breakdown', M, y);
  y += 2;

  // Table header
  y += 6;
  doc.setFillColor(245, 245, 250);
  doc.rect(M, y, W - 2 * M, 8, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('CATEGORY', M + 4, y + 5.5);
  doc.text('AMOUNT', W - M - 50, y + 5.5);
  doc.text('%', W - M - 15, y + 5.5);
  doc.text('BAR', W / 2 + 5, y + 5.5);
  y += 10;

  categoryBreakdown.forEach((item, i) => {
    const pct = totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;
    const color = COLORS[i % COLORS.length];

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 33, 33);
    doc.text(stripEmoji(item.category.name), M + 4, y + 4);
    doc.setTextColor(80, 80, 80);
    doc.text(fmt(item.total), W - M - 50, y + 4);
    doc.text(`${pct.toFixed(1)}%`, W - M - 15, y + 4);

    // Mini bar
    drawBar(doc, W / 2 + 5, y + 1, 40, 4, pct, color);

    // Color dot
    doc.setFillColor(...color);
    doc.circle(M + 1, y + 3, 1.5, 'F');

    y += 8;
    // Separator
    doc.setDrawColor(235, 235, 235);
    doc.line(M, y - 1, W - M, y - 1);
  });

  // Entries count per category
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`${paidExpenses.length} paid entries | ${pendingExpenses.length} pending`, M, y);

  // ═══ PAGE 2: All Expenses ═══
  doc.addPage();

  // Header
  doc.setFillColor(124, 58, 237);
  doc.rect(0, 0, W, 20, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('All Expenses', M, 14);
  doc.text(`${project.name}`, W - M, 14, { align: 'right' });

  const sortedExpenses = [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const expRows = sortedExpenses.map(e => {
    const cat = categories.find(c => c.id === e.categoryId);
    return [
      formatDate(e.date),
      stripEmoji(cat?.name || 'Unknown'),
      e.note || '-',
      fmt(e.amount),
      e.isPending ? 'PENDING' : 'Paid',
    ];
  });

  doc.autoTable({
    startY: 26,
    head: [['Date', 'Category', 'Note', 'Amount', 'Status']],
    body: expRows,
    styles: { fontSize: 8, cellPadding: 3, font: 'helvetica' },
    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 35 },
      3: { halign: 'right', cellWidth: 28 },
      4: { cellWidth: 18, halign: 'center', fontSize: 7 },
    },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.cell.raw === 'PENDING') {
        data.cell.styles.textColor = [217, 119, 6];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  // ─── Footer on all pages ───
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Ghar Kharcha | ${project.name} | Generated ${formatDate(new Date().toISOString())} | Page ${i}/${pageCount}`,
      W / 2, H - 8, { align: 'center' }
    );
  }

  doc.save(`${project.name.replace(/\s+/g, '_')}_Report.pdf`);
}
