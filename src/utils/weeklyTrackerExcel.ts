import ExcelJS from "exceljs";
import {
  type ComputedWeek,
  type DashboardMetrics,
  type TrackerGrandTotals,
  formatShortWeekDate,
  formatKg,
  round2
} from "./weeklyTrackerCalc";

const ARABIC_FONT = "Calibri";
const HEADER_BROWN = "FF6B3410";
const SUBHEADER_PEACH = "FFFCE8D5";
const KPI_CREAM = "FFFFFBEB";
const BORDER_COLOR = "FFD6D3D1";
const ZEBRA_BG = "FFFAFAF9";
const TOTAL_BG = "FFFEF3C7";
const GRAY_COL_BG = "FFE7E5E4";

function styleBorder(cell: ExcelJS.Cell, bottomStyle: ExcelJS.BorderStyle = "thin", bottomColor = BORDER_COLOR) {
  cell.border = {
    top: { style: "thin", color: { argb: BORDER_COLOR } },
    left: { style: "thin", color: { argb: BORDER_COLOR } },
    right: { style: "thin", color: { argb: BORDER_COLOR } },
    bottom: { style: bottomStyle, color: { argb: bottomColor } }
  };
}

export async function exportWeeklyTrackerToExcel(
  computedWeeks: ComputedWeek[],
  grandTotals: TrackerGrandTotals,
  metrics: DashboardMetrics,
  selectedWeekLabel: string,
  selectedProductLabel: string
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "UAE Honey House";
  wb.created = new Date();

  // =========================================================================
  // SHEET 1: لوحة المؤشرات (Dashboard)
  // =========================================================================
  const dashSheet = wb.addWorksheet("لوحة المؤشرات", {
    views: [{ rightToLeft: true, showGridLines: true }]
  });

  // Title banner
  dashSheet.mergeCells("A1:I1");
  const titleCell = dashSheet.getCell("A1");
  titleCell.value = "لوحة مؤشرات الأداء والمبيعات الأسبوعية - بيت العسل";
  titleCell.font = { name: ARABIC_FONT, size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BROWN } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  dashSheet.getRow(1).height = 30;

  dashSheet.mergeCells("A2:I2");
  const subCell = dashSheet.getCell("A2");
  subCell.value = "تحليل تفاعلي لحركات التسليم والجرد الأسبوعي، المبيعات المحققة، وصافي مستحقات بيت العسل";
  subCell.font = { name: ARABIC_FONT, size: 11, color: { argb: HEADER_BROWN } };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUBHEADER_PEACH } };
  subCell.alignment = { horizontal: "center", vertical: "middle" };
  dashSheet.getRow(2).height = 22;

  // Filter summary row
  dashSheet.mergeCells("A3:C3");
  dashSheet.getCell("A3").value = `تصفية الأسبوع: ${selectedWeekLabel}`;
  dashSheet.mergeCells("D3:E3");
  dashSheet.getCell("D3").value = `تصفية المنتج: ${selectedProductLabel}`;
  dashSheet.mergeCells("F3:I3");
  dashSheet.getCell("F3").value = `نطاق العرض: ${metrics.scopeLabel}`;
  for (let c = 1; c <= 9; c++) {
    const cell = dashSheet.getRow(3).getCell(c);
    cell.font = { name: ARABIC_FONT, size: 10, bold: true, color: { argb: "FF1E293B" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: KPI_CREAM } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    styleBorder(cell);
  }
  dashSheet.getRow(3).height = 24;

  // 5 KPI Cards block (rows 5-7)
  const kpiDefs = [
    { label: "إجمالي المبيعات", value: `${round2(metrics.totalSales)} dh`, sub: "إجمالي المبيعات المحققة الفعلية", range: ["A", "B"] },
    { label: "العمولة", value: `${round2(metrics.totalCommission)} dh`, sub: "عمولة المبيعات", range: ["C", "D"] },
    { label: "صافي المستحق للمورد", value: `${round2(metrics.totalNetPayable)} dh`, sub: "صافي المورد", range: ["E", "F"] },
    { label: "المبيعات بالوحدات", value: `${round2(metrics.soldUnits)}`, sub: `Total ${round2(metrics.totalUnits)}`, range: ["G", "G"] },
    { label: "نسبة المبيعات (كجم)", value: `${metrics.salesWeightPct.toFixed(1)}%`, sub: `${formatKg(metrics.soldWeightKg)} KG from ${formatKg(metrics.totalWeightKg)} KG Total`, range: ["H", "I"] }
  ];

  for (const k of kpiDefs) {
    if (k.range[0] !== k.range[1]) {
      dashSheet.mergeCells(`${k.range[0]}5:${k.range[1]}5`);
      dashSheet.mergeCells(`${k.range[0]}6:${k.range[1]}6`);
      dashSheet.mergeCells(`${k.range[0]}7:${k.range[1]}7`);
    }
    const lblCell = dashSheet.getCell(`${k.range[0]}5`);
    lblCell.value = k.label;
    lblCell.font = { name: ARABIC_FONT, size: 10, bold: true, color: { argb: HEADER_BROWN } };
    lblCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUBHEADER_PEACH } };
    lblCell.alignment = { horizontal: "center", vertical: "middle" };

    const valCell = dashSheet.getCell(`${k.range[0]}6`);
    valCell.value = k.value;
    valCell.font = { name: ARABIC_FONT, size: 14, bold: true, color: { argb: "FF0F172A" } };
    valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: KPI_CREAM } };
    valCell.alignment = { horizontal: "center", vertical: "middle" };

    const subKpi = dashSheet.getCell(`${k.range[0]}7`);
    subKpi.value = k.sub;
    subKpi.font = { name: ARABIC_FONT, size: 9, italic: true, color: { argb: "FF475569" } };
    subKpi.fill = { type: "pattern", pattern: "solid", fgColor: { argb: KPI_CREAM } };
    subKpi.alignment = { horizontal: "center", vertical: "middle" };
  }
  for (let r = 5; r <= 7; r++) {
    for (let c = 1; c <= 9; c++) {
      styleBorder(dashSheet.getRow(r).getCell(c));
    }
  }
  dashSheet.getRow(5).height = 22;
  dashSheet.getRow(6).height = 28;
  dashSheet.getRow(7).height = 20;

  // Detailed Filtered Table Header (Row 9)
  const detailHeaders = [
    "م",
    "تاريخ الأحد",
    "اسم المنتج",
    "كمية جديدة",
    "الكمية المتبقية",
    "الكمية المباعة",
    "إجمالي المبيعات (dh)",
    "صافي المستحق (dh)",
    "ملاحظات"
  ];
  const detailHeaderRow = dashSheet.getRow(9);
  detailHeaderRow.height = 26;
  detailHeaders.forEach((h, i) => {
    const cell = detailHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: ARABIC_FONT, size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BROWN } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    styleBorder(cell);
  });

  let curRow = 10;
  metrics.filteredRows.forEach((item, idx) => {
    const row = dashSheet.getRow(curRow);
    row.height = 22;
    const vals = [
      idx + 1,
      formatShortWeekDate(item.weekDate),
      item.productName,
      round2(item.newStock),
      round2(item.remainingStock),
      round2(item.soldQty),
      round2(item.totalSales),
      round2(item.netPayable),
      item.weekNotes || ""
    ];
    vals.forEach((v, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = v;
      cell.font = { name: ARABIC_FONT, size: 10, bold: colIdx >= 3 && colIdx <= 7, color: { argb: "FF0F172A" } };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA_BG } };
      }
      if (colIdx === 6 || colIdx === 7) {
        cell.numFmt = '#,##0.## "dh"';
      }
      cell.alignment = {
        horizontal: colIdx === 2 || colIdx === 8 ? "right" : "center",
        vertical: "middle",
        wrapText: colIdx === 8
      };
      styleBorder(cell);
    });
    curRow++;
  });

  // Dashboard table footer total row
  const dTotalRow = dashSheet.getRow(curRow);
  dTotalRow.height = 25;
  const dTotalVals = [
    "",
    "الإجمالي",
    `${metrics.filteredRows.length} سجل`,
    round2(metrics.totalNewStock),
    round2(metrics.remainingUnits),
    round2(metrics.soldUnits),
    round2(metrics.totalSales),
    round2(metrics.totalNetPayable),
    ""
  ];
  dTotalVals.forEach((v, colIdx) => {
    const cell = dTotalRow.getCell(colIdx + 1);
    cell.value = v;
    cell.font = { name: ARABIC_FONT, size: 10, bold: true, color: { argb: "FF0F172A" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };
    if (colIdx === 6 || colIdx === 7) cell.numFmt = '#,##0.## "dh"';
    cell.alignment = { horizontal: "center", vertical: "middle" };
    styleBorder(cell, "medium", HEADER_BROWN);
  });

  dashSheet.columns = [
    { width: 6 },
    { width: 14 },
    { width: 28 },
    { width: 13 },
    { width: 15 },
    { width: 15 },
    { width: 18 },
    { width: 18 },
    { width: 32 }
  ];

  // =========================================================================
  // SHEET 2: سجل الجرد الأسبوعي (Weekly Inventory Log)
  // =========================================================================
  const logSheet = wb.addWorksheet("سجل الجرد الأسبوعي", {
    views: [{ rightToLeft: true, showGridLines: true, state: "frozen", ySplit: 3 }]
  });

  logSheet.mergeCells("A1:N1");
  const logTitle = logSheet.getCell("A1");
  logTitle.value = "تقرير الجرد والمبيعات والتسليم الأسبوعي - بيت العسل";
  logTitle.font = { name: ARABIC_FONT, size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  logTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BROWN } };
  logTitle.alignment = { horizontal: "center", vertical: "middle" };
  logSheet.getRow(1).height = 30;

  logSheet.mergeCells("A2:N2");
  const logSub = logSheet.getCell("A2");
  logSub.value = "سجل دوري منتظم لكل يوم أحد لمتابعة تسليم البضاعة، المتبقي، والمبيعات والعمولات";
  logSub.font = { name: ARABIC_FONT, size: 11, color: { argb: HEADER_BROWN } };
  logSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUBHEADER_PEACH } };
  logSub.alignment = { horizontal: "center", vertical: "middle" };
  logSheet.getRow(2).height = 22;

  const logHeaders = [
    "تاريخ الأحد",
    "م",
    "اسم المنتج",
    "السعر",
    "رصيد سابق",
    "كمية جديدة",
    "الكمية الحالي",
    "الكمية المباعة",
    "إجمالي المبيعات",
    "نسبة العمولة",
    "السعر بعد العمولة",
    "العمولة",
    "صافي المستحق",
    "ملاحظات"
  ];
  const logHeaderRow = logSheet.getRow(3);
  logHeaderRow.height = 28;
  logHeaders.forEach((h, i) => {
    const cell = logHeaderRow.getCell(i + 1);
    cell.value = h;
    cell.font = { name: ARABIC_FONT, size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BROWN } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    styleBorder(cell, "medium", "FF0F172A");
  });

  let logRowIdx = 4;
  for (const week of [...computedWeeks].reverse()) {
    const startRow = logRowIdx;
    const itemCount = week.items.length;

    week.items.forEach((item, idx) => {
      const row = logSheet.getRow(logRowIdx);
      row.height = 22;
      const isLastInWeek = idx === itemCount - 1;
      const bottomStyle: ExcelJS.BorderStyle = isLastInWeek ? "medium" : "thin";
      const bottomColor = isLastInWeek ? "FF0F172A" : BORDER_COLOR;

      const vals = [
        idx === 0 ? formatShortWeekDate(week.weekDate) : "",
        item.index,
        item.productName,
        round2(item.unitPrice),
        round2(item.effectivePreviousBalance),
        round2(item.newStock),
        round2(item.remainingStock),
        round2(item.soldQty),
        round2(item.totalSales),
        idx === 0 ? `${week.commissionRate}%` : "",
        round2(item.priceAfterCommission),
        round2(item.commissionAmount),
        round2(item.netPayable),
        idx === 0 ? (week.notes || "") : ""
      ];

      vals.forEach((v, colIdx) => {
        const cell = row.getCell(colIdx + 1);
        cell.value = v;
        cell.font = {
          name: ARABIC_FONT,
          size: 10,
          bold: colIdx === 0 || colIdx >= 3,
          color: { argb: "FF0F172A" }
        };
        if ([7, 8, 9, 10, 11, 12].includes(colIdx)) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRAY_COL_BG } };
        }
        if (colIdx === 10) cell.numFmt = "0.00";
        cell.alignment = {
          horizontal: colIdx === 2 ? "right" : "center",
          vertical: "middle",
          wrapText: colIdx === 13
        };
        styleBorder(cell, bottomStyle, bottomColor);
      });

      logRowIdx++;
    });

    const endRow = logRowIdx - 1;
    if (endRow > startRow) {
      logSheet.mergeCells(`A${startRow}:A${endRow}`);
      logSheet.mergeCells(`J${startRow}:J${endRow}`);
      logSheet.mergeCells(`N${startRow}:N${endRow}`);
    }
  }

  // Grand Total row
  const gtRow = logSheet.getRow(logRowIdx);
  gtRow.height = 28;
  const gtVals = [
    "الإجمالي العام",
    "",
    `${computedWeeks.length} أسابيع`,
    "",
    "",
    round2(grandTotals.newStock),
    round2(grandTotals.latestRemainingStock),
    round2(grandTotals.soldQty),
    round2(grandTotals.totalSales),
    "",
    "",
    round2(grandTotals.commissionAmount),
    round2(grandTotals.netPayable),
    `المتبقي من أحدث أسبوع (${formatKg(grandTotals.latestRemainingWeightKg)} KG)`
  ];
  gtVals.forEach((v, colIdx) => {
    const cell = gtRow.getCell(colIdx + 1);
    cell.value = v;
    cell.font = { name: ARABIC_FONT, size: 11, bold: true, color: { argb: "FF0F172A" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TOTAL_BG } };
    if ([8, 11, 12].includes(colIdx)) cell.numFmt = '#,##0.## "dh"';
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    styleBorder(cell, "medium", HEADER_BROWN);
  });

  logSheet.columns = [
    { width: 14 },
    { width: 5 },
    { width: 28 },
    { width: 9 },
    { width: 11 },
    { width: 11 },
    { width: 12 },
    { width: 12 },
    { width: 14 },
    { width: 12 },
    { width: 15 },
    { width: 11 },
    { width: 14 },
    { width: 30 }
  ];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Honey_House_Weekly_Tracker_${new Date().toISOString().split("T")[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
