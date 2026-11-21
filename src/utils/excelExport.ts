import ExcelJS from "exceljs";

// ============================================================================
// SHARED EXECUTIVE STYLING HELPERS (UAE HONEY HOUSE)
// ============================================================================

const FONT_NAME = "Calibri";

const COLORS = {
  bannerBg: "FF0F172A",     // Deep executive navy
  bannerText: "FFFFFFFF",
  subBg: "FFFEF3C7",        // Soft honey amber tint
  subText: "FF92400E",      // Rich honey brown
  zebraBg: "FFF8FAFC",      // Soft alternating row
  white: "FFFFFFFF",
  borderLight: "FFE2E8F0",
  borderMedium: "FF94A3B8",
  totalBg: "FFFEF3C7",      // Warm honey highlight for totals
  totalText: "FF0F172A",
  sectionBg: "FFE2E8F0",
  sectionText: "FF1E293B",
  // Status pills
  greenBg: "FFDCFCE7",
  greenText: "FF166534",
  roseBg: "FFFFE4E6",
  roseText: "FF9F1239",
  amberBg: "FFFEF3C7",
  amberText: "FF92400E",
  slateBg: "FFF1F5F9",
  slateText: "FF475569"
};

type ColFormat =
  | "text"
  | "phone"
  | "date"
  | "int"
  | "aed"
  | "aedSigned"
  | "kg"
  | "pct"
  | "status";

interface ColumnDef {
  header: string;
  key: string;
  format?: ColFormat;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
}

function round2(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100) / 100;
}

function round3(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 1000) / 1000;
}

function todayStamp(): string {
  return new Date().toISOString().split("T")[0];
}

function colLetter(colNum: number): string {
  let letter = "";
  let n = colNum;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function estimateDisplayWidth(val: unknown, format?: ColFormat): number {
  if (val === null || val === undefined) return 6;
  const str = String(val);
  const arabicExtra = (str.match(/[^\x00-\x7F]/g)?.length || 0) * 0.4;
  let base = str.length + arabicExtra;
  if (format === "aed" || format === "aedSigned") base = Math.max(base + 8, 14);
  if (format === "kg") base = Math.max(base + 6, 12);
  if (format === "pct") base = Math.max(base + 3, 10);
  if (format === "phone") base = Math.max(base + 3, 17);
  if (format === "date") base = Math.max(base + 2, 13);
  return base;
}

function applyCellBorder(
  cell: ExcelJS.Cell,
  color = COLORS.borderLight,
  topStyle: ExcelJS.BorderStyle = "thin",
  bottomStyle: ExcelJS.BorderStyle = "thin"
) {
  cell.border = {
    top: { style: topStyle, color: { argb: color } },
    left: { style: "thin", color: { argb: COLORS.borderLight } },
    bottom: { style: bottomStyle, color: { argb: color } },
    right: { style: "thin", color: { argb: COLORS.borderLight } }
  };
}

function applyFormatToCell(cell: ExcelJS.Cell, format?: ColFormat) {
  switch (format) {
    case "aed":
      cell.numFmt = '#,##0.00 "AED"';
      cell.alignment = { horizontal: "right", vertical: "middle" };
      break;
    case "aedSigned": {
      cell.numFmt = '+#,##0.00 "AED";-#,##0.00 "AED";0.00 "AED"';
      cell.alignment = { horizontal: "right", vertical: "middle" };
      const num = Number(cell.value);
      if (Number.isFinite(num)) {
        cell.font = {
          name: FONT_NAME,
          size: 10,
          bold: true,
          color: { argb: num >= 0 ? COLORS.greenText : COLORS.roseText }
        };
      }
      break;
    }
    case "kg":
      cell.numFmt = '#,##0.00 "KG"';
      cell.alignment = { horizontal: "right", vertical: "middle" };
      break;
    case "pct":
      cell.numFmt = '0.00"%"';
      cell.alignment = { horizontal: "right", vertical: "middle" };
      break;
    case "int":
      cell.numFmt = "#,##0";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      break;
    case "date":
      cell.alignment = { horizontal: "center", vertical: "middle" };
      break;
    case "phone":
      cell.numFmt = "@";
      cell.alignment = { horizontal: "center", vertical: "middle" };
      break;
    case "status": {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      const txt = String(cell.value || "").toLowerCase();
      if (
        txt === "paid" ||
        txt === "delivered" ||
        txt === "income" ||
        txt.includes("active")
      ) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.greenBg } };
        cell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.greenText } };
      } else if (txt === "unpaid" || txt === "expense") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.roseBg } };
        cell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.roseText } };
      } else if (txt === "pending") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.amberBg } };
        cell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.amberText } };
      } else if (txt === "closed") {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.slateBg } };
        cell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.slateText } };
      }
      break;
    }
    default:
      cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  }
}

function addStyledBanner(
  ws: ExcelJS.Worksheet,
  colCount: number,
  title: string,
  subtitle: string
) {
  const lastCol = colLetter(Math.max(colCount, 2));

  ws.mergeCells(`A1:${lastCol}1`);
  const titleCell = ws.getCell("A1");
  titleCell.value = `UAE HONEY HOUSE  |  ${title}`;
  titleCell.font = { name: FONT_NAME, size: 14, bold: true, color: { argb: COLORS.bannerText } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.bannerBg } };
  titleCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  ws.getRow(1).height = 32;

  ws.mergeCells(`A2:${lastCol}2`);
  const subCell = ws.getCell("A2");
  subCell.value = subtitle;
  subCell.font = { name: FONT_NAME, size: 10, italic: true, color: { argb: COLORS.subText } };
  subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.subBg } };
  subCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
  ws.getRow(2).height = 22;

  ws.getRow(3).height = 8;
}

function buildStyledTableSheet(
  wb: ExcelJS.Workbook,
  options: {
    sheetName: string;
    tabColor: string;
    headerBg: string;
    title: string;
    subtitle: string;
    columns: ColumnDef[];
    rows: Record<string, any>[];
    totalRow?: Record<string, any>;
    totalFormats?: Record<string, ColFormat>;
  }
) {
  const safeName = options.sheetName.slice(0, 31).replace(/[\\/*?:[\]]/g, " ");
  const ws = wb.addWorksheet(safeName, {
    properties: { tabColor: { argb: options.tabColor } },
    views: [{ state: "frozen", ySplit: 4, showGridLines: true }]
  });

  const colCount = options.columns.length;
  addStyledBanner(ws, colCount, options.title, options.subtitle);

  const headerRow = ws.getRow(4);
  headerRow.height = 28;
  options.columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: COLORS.white } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: options.headerBg } };
    cell.alignment = {
      horizontal:
        col.align ||
        (col.format === "aed" || col.format === "aedSigned" || col.format === "kg" || col.format === "pct"
          ? "right"
          : col.format === "int" || col.format === "date" || col.format === "status" || col.format === "phone"
          ? "center"
          : "left"),
      vertical: "middle",
      wrapText: true
    };
    applyCellBorder(cell, options.headerBg);
  });

  const colWidths = options.columns.map(col =>
    Math.max(col.minWidth || 11, estimateDisplayWidth(col.header) + 3)
  );

  options.rows.forEach((rowObj, rIdx) => {
    const row = ws.getRow(5 + rIdx);
    row.height = 22;
    const isZebra = rIdx % 2 === 1;

    options.columns.forEach((col, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      const val = rowObj[col.key] ?? "";
      cell.value = col.format === "phone" ? String(val) : val;
      cell.font = { name: FONT_NAME, size: 10, color: { argb: "FF1E293B" } };
      if (isZebra) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.zebraBg } };
      }
      applyFormatToCell(cell, col.format);
      if (col.align) {
        cell.alignment = { ...(cell.alignment || {}), horizontal: col.align, vertical: "middle" };
      }
      applyCellBorder(cell);

      const est = estimateDisplayWidth(val, col.format);
      if (est > colWidths[cIdx]) colWidths[cIdx] = est;
    });
  });

  if (options.totalRow) {
    const totRowIndex = 5 + options.rows.length;
    const totRow = ws.getRow(totRowIndex);
    totRow.height = 26;

    options.columns.forEach((col, cIdx) => {
      const cell = totRow.getCell(cIdx + 1);
      const val = options.totalRow?.[col.key] ?? "";
      cell.value = val;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.totalBg } };
      cell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: COLORS.totalText } };

      const fmt = options.totalFormats?.[col.key] ?? (typeof val === "number" ? col.format : undefined);
      if (fmt && typeof val === "number") {
        applyFormatToCell(cell, fmt);
        cell.font = {
          ...(cell.font || {}),
          name: FONT_NAME,
          size: 10.5,
          bold: true
        };
      } else {
        cell.alignment = {
          horizontal: cIdx === 0 ? "left" : col.align || "center",
          vertical: "middle"
        };
      }
      applyCellBorder(cell, COLORS.borderMedium, "medium", "double");

      const est = estimateDisplayWidth(val, fmt);
      if (est > colWidths[cIdx]) colWidths[cIdx] = est;
    });
  }

  if (options.rows.length > 0) {
    ws.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + options.rows.length, column: colCount }
    };
  }

  options.columns.forEach((col, idx) => {
    const maxW = col.maxWidth || 44;
    ws.getColumn(idx + 1).width = Math.min(Math.ceil(colWidths[idx]) + 3, maxW);
  });

  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0
  };

  return ws;
}

async function downloadWorkbook(wb: ExcelJS.Workbook, filename: string) {
  wb.creator = "UAE Honey House ERP";
  wb.created = new Date();
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// ============================================================================
// MODULAR SHEET BUILDERS
// ============================================================================

function addDashboardSheets(
  wb: ExcelJS.Workbook,
  dashboard: any,
  filters: { month: string; from: string; to: string; batch: string }
) {
  const exportDate = todayStamp();
  const periodLabel =
    filters.month === "custom"
      ? `${filters.from || "Start"} to ${filters.to || "End"}`
      : filters.month || "All Historic Months";
  const batchLabel = filters.batch === "all" ? "All Batches" : filters.batch;

  const ws = wb.addWorksheet("Dashboard Summary", {
    properties: { tabColor: { argb: "FFD97706" } },
    views: [{ state: "frozen", ySplit: 3, showGridLines: true }]
  });

  addStyledBanner(
    ws,
    4,
    "Business Intelligence Dashboard",
    `Export Date: ${exportDate}   |   Period: ${periodLabel}   |   Batch: ${batchLabel}`
  );

  let rowNum = 4;

  const addSectionTable = (
    sectionTitle: string,
    headerBg: string,
    headers: [string, string, string, string],
    items: Array<{ label: string; value: number | string; format?: ColFormat; note: string; status?: string }>
  ) => {
    ws.mergeCells(`A${rowNum}:D${rowNum}`);
    const secCell = ws.getCell(`A${rowNum}`);
    secCell.value = sectionTitle;
    secCell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: COLORS.white } };
    secCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerBg } };
    secCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
    ws.getRow(rowNum).height = 25;
    rowNum++;

    const hRow = ws.getRow(rowNum);
    hRow.height = 22;
    headers.forEach((h, i) => {
      const c = hRow.getCell(i + 1);
      c.value = h;
      c.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: COLORS.sectionText } };
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.sectionBg } };
      c.alignment = { horizontal: i === 1 ? "right" : i === 3 ? "center" : "left", vertical: "middle" };
      applyCellBorder(c, COLORS.borderMedium);
    });
    rowNum++;

    items.forEach((item, idx) => {
      const r = ws.getRow(rowNum);
      r.height = 22;
      const isZebra = idx % 2 === 1;

      const c1 = r.getCell(1);
      c1.value = item.label;
      c1.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: "FF1E293B" } };
      c1.alignment = { horizontal: "left", vertical: "middle" };

      const c2 = r.getCell(2);
      c2.value = item.value;
      c2.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: "FF0F172A" } };
      applyFormatToCell(c2, item.format);

      const c3 = r.getCell(3);
      c3.value = item.note;
      c3.font = { name: FONT_NAME, size: 9.5, color: { argb: "FF475569" } };
      c3.alignment = { horizontal: "left", vertical: "middle" };

      const c4 = r.getCell(4);
      c4.value = item.status || "";
      c4.font = { name: FONT_NAME, size: 9.5, bold: true, color: { argb: "FF475569" } };
      c4.alignment = { horizontal: "center", vertical: "middle" };
      if (item.status) applyFormatToCell(c4, "status");

      [c1, c2, c3, c4].forEach(c => {
        if (isZebra && !c.fill) {
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORS.zebraBg } };
        }
        applyCellBorder(c);
      });
      rowNum++;
    });

    rowNum++;
  };

  addSectionTable(
    "FINANCIAL PERFORMANCE KPIs",
    "FF1E3A8A",
    ["Metric", "Value", "Description / Details", "Status"],
    [
      { label: "Total Revenue", value: round2(dashboard.totalSales), format: "aed", note: `General ledger inflow (${dashboard.paidOrders || 0} paid orders)`, status: "Income" },
      { label: "Total Expenses", value: round2(dashboard.totalExpenses), format: "aed", note: "General ledger operational outflow (Actual cost)", status: "Expense" },
      { label: "Gross Profit", value: round2(dashboard.grossProfit), format: "aedSigned", note: `Gross margin: ${round2(dashboard.grossProfitMargin)}%` },
      { label: "Net Profit", value: round2(dashboard.netProfit), format: "aedSigned", note: `After all expenses (${round2(dashboard.netProfitMargin)}% net ratio)` },
      { label: "Current Balance", value: round2(dashboard.currentBalance), format: "aedSigned", note: "Reconciled from Cash Balance Book", status: "Active" },
      { label: "Total Profit Distributions", value: round2(dashboard.totalProfitDistributions), format: "aed", note: "Distributed partner shares" },
      { label: "Distributable Profit", value: round2(dashboard.distributableProfit), format: "aedSigned", note: "Remaining distributable net earnings" }
    ]
  );

  addSectionTable(
    "STOCK SUMMARY BALANCE (KG)",
    "FF5B21B6",
    ["Inventory Metric", "Weight / Ratio", "Inventory Notes", "Unit"],
    [
      { label: "Total Imported Weight", value: round2(dashboard.totalImportedWeight), format: "kg", note: "Total stock received across selected batches", status: "KG" },
      { label: "Total Sold Weight", value: round2(dashboard.totalWeightKG), format: "kg", note: "Total honey weight fulfilled to customers", status: "KG" },
      { label: "Available Stock", value: round2(dashboard.availableWeightTotal), format: "kg", note: "Remaining active inventory ready for sale", status: "Active" },
      { label: "Wasted Weight", value: round2(dashboard.wastedWeight), format: "kg", note: "Recorded wastage", status: "KG" },
      { label: "Free Samples Weight", value: round2(dashboard.freeSamplesWeight), format: "kg", note: "Promotional & tasting samples", status: "KG" },
      { label: "Wasted & Free Samples Total", value: round2(dashboard.totalWastedAndSamples), format: "kg", note: "Combined non-revenue stock outflow", status: "KG" },
      { label: "Wasted & Sample Ratio", value: round2(dashboard.wastedMargin), format: "pct", note: "Percentage of total imported stock", status: "%" }
    ]
  );

  addSectionTable(
    "ORDERS OPERATIONAL METRICS",
    "FF0F766E",
    ["Operational KPI", "Value", "Notes", "Category"],
    [
      { label: "Total Orders", value: Number(dashboard.totalOrders || 0), format: "int", note: "All customer orders in range", status: "Orders" },
      { label: "Paid Orders", value: Number(dashboard.paidOrders || 0), format: "int", note: "Collected payments", status: "Paid" },
      { label: "Pending Payment Orders", value: Number(dashboard.pendingOrders || 0), format: "int", note: "Awaiting payment collection", status: "Unpaid" },
      { label: "Delivered Orders", value: Number(dashboard.deliveredOrders || 0), format: "int", note: "Completed deliveries", status: "Delivered" },
      { label: "Pending Delivery Orders", value: Number(dashboard.pendingDelivery || 0), format: "int", note: "In transit / scheduled", status: "Pending" },
      { label: "Average Order Value (Ticket Price)", value: round2(dashboard.avgOrderValue), format: "aed", note: "Average revenue per order", status: "AED" },
      { label: "Average Weight Per Order", value: round2(dashboard.avgWeightPerOrder), format: "kg", note: "Average honey weight per order", status: "KG" }
    ]
  );

  const topProducts = Array.isArray(dashboard.topProductsByVolume) ? dashboard.topProductsByVolume : [];
  if (topProducts.length > 0) {
    addSectionTable(
      "TOP PRODUCTS SOLD (BY VOLUME)",
      "FFB45309",
      ["Product Name", "Units Sold", "Rank", "Performance"],
      topProducts.map((p: any, i: number) => ({
        label: p.name || "",
        value: Number(p.volume || 0),
        format: "int",
        note: `Rank #${i + 1} best-selling SKU`,
        status: i === 0 ? "Active" : `#${i + 1}`
      }))
    );
  }

  ws.getColumn(1).width = 36;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 44;
  ws.getColumn(4).width = 16;
  ws.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const trendList = Array.isArray(dashboard.monthlyTrend) ? dashboard.monthlyTrend : [];
  if (trendList.length > 0) {
    let sumSales = 0;
    let sumProfit = 0;
    let sumExp = 0;
    let sumDist = 0;

    const trendRows = trendList.map((m: any) => {
      const sales = round2(m.sales);
      const profit = round2(m.profit);
      const expenses = round2(m.expenses);
      const dist = round2(m.profitDistributions);
      const net = round2(sales - expenses);
      sumSales += sales;
      sumProfit += profit;
      sumExp += expenses;
      sumDist += dist;
      return { month: m.month || "", sales, profit, expenses, net, dist };
    });

    buildStyledTableSheet(wb, {
      sheetName: "Monthly Trend",
      tabColor: "FF2563EB",
      headerBg: "FF1D4ED8",
      title: "Monthly Financial Trend",
      subtitle: `Export Date: ${exportDate}   |   Period: ${periodLabel}   |   ${trendRows.length} Months`,
      columns: [
        { header: "Month", key: "month", format: "date", minWidth: 14 },
        { header: "Sales Revenue (AED)", key: "sales", format: "aed", minWidth: 20 },
        { header: "Gross Profit (AED)", key: "profit", format: "aedSigned", minWidth: 20 },
        { header: "Operational Expenses (AED)", key: "expenses", format: "aed", minWidth: 24 },
        { header: "Net Cash Flow (AED)", key: "net", format: "aedSigned", minWidth: 22 },
        { header: "Profit Distributions (AED)", key: "dist", format: "aed", minWidth: 24 }
      ],
      rows: trendRows,
      totalRow: {
        month: "TOTAL",
        sales: round2(sumSales),
        profit: round2(sumProfit),
        expenses: round2(sumExp),
        net: round2(sumSales - sumExp),
        dist: round2(sumDist)
      }
    });
  }
}

function addOrdersSheet(wb: ExcelJS.Workbook, orders: any[], subtitleExtra: string) {
  const exportDate = todayStamp();
  let totalQty = 0;
  let totalSale = 0;
  let totalCost = 0;
  let totalProfit = 0;
  let paidCount = 0;
  let deliveredCount = 0;

  const rows = orders.map(item => {
    const qty = Number(item["Quantity"] || 0);
    const unitPrice = round2(item["Unit Price"]);
    const sale = round2(item["Total Sale"]);
    const costPrice = round2(item["Cost Price"]);
    const cost = round2(item["Total Cost"]);
    const profit = round2(item["Profit"] !== undefined ? item["Profit"] : sale - cost);

    totalQty += qty;
    totalSale += sale;
    totalCost += cost;
    totalProfit += profit;
    if (item["Payment Status"] === "Paid") paidCount++;
    if (item["Delivery Status"] === "Delivered") deliveredCount++;

    return {
      orderId: item["Order ID"] || "",
      orderDate: item["Order Date"] || "",
      customerId: item["Customer ID"] || "",
      customerName: item["Customer Name (Auto)"] || "Walk-in Guest",
      customerPhone: item["Customer Phone (Auto)"] || "",
      customerLocation: item["Customer Location (Auto)"] || "",
      product: item["Product"] || "",
      qty,
      unitPrice,
      sale,
      costPrice,
      cost,
      profit,
      deliveryStatus: item["Delivery Status"] || "",
      paymentStatus: item["Payment Status"] || "",
      batchId: item["Import Batch ID"] || "",
      notes: item["Notes"] || ""
    };
  });

  buildStyledTableSheet(wb, {
    sheetName: "Orders",
    tabColor: "FF1D4ED8",
    headerBg: "FF1E3A8A",
    title: "Orders Module — Customer Transactions",
    subtitle: `Export Date: ${exportDate}   |   ${orders.length} Orders (${paidCount} Paid, ${deliveredCount} Delivered)   |   ${subtitleExtra}`,
    columns: [
      { header: "Order ID", key: "orderId", format: "date", minWidth: 14 },
      { header: "Order Date", key: "orderDate", format: "date", minWidth: 13 },
      { header: "Customer ID", key: "customerId", format: "date", minWidth: 14 },
      { header: "Customer Name", key: "customerName", format: "text", minWidth: 22 },
      { header: "Customer Phone", key: "customerPhone", format: "phone", minWidth: 18 },
      { header: "Location", key: "customerLocation", format: "text", minWidth: 14 },
      { header: "Honey Product", key: "product", format: "text", minWidth: 24 },
      { header: "Qty", key: "qty", format: "int", minWidth: 8 },
      { header: "Unit Price", key: "unitPrice", format: "aed", minWidth: 15 },
      { header: "Total Sale", key: "sale", format: "aed", minWidth: 16 },
      { header: "Unit Cost", key: "costPrice", format: "aed", minWidth: 15 },
      { header: "Total Cost", key: "cost", format: "aed", minWidth: 16 },
      { header: "Profit", key: "profit", format: "aedSigned", minWidth: 16 },
      { header: "Delivery", key: "deliveryStatus", format: "status", minWidth: 13 },
      { header: "Payment", key: "paymentStatus", format: "status", minWidth: 12 },
      { header: "Import Batch", key: "batchId", format: "date", minWidth: 14 },
      { header: "Notes", key: "notes", format: "text", minWidth: 22, maxWidth: 40 }
    ],
    rows,
    totalRow: {
      orderId: "TOTAL",
      orderDate: `${orders.length} Orders`,
      qty: totalQty,
      sale: round2(totalSale),
      cost: round2(totalCost),
      profit: round2(totalProfit),
      deliveryStatus: `${deliveredCount} Delivered`,
      paymentStatus: `${paidCount} Paid`
    }
  });
}

function addBatchesSheets(wb: ExcelJS.Workbook, batches: any[], subtitleExtra: string) {
  const exportDate = todayStamp();
  let sumImportedKg = 0;
  let sumAvailableKg = 0;
  let sumUsedKg = 0;

  const overviewRows: Record<string, any>[] = [];
  const itemRows: Record<string, any>[] = [];
  let sumItemQty = 0;
  let sumLineCost = 0;
  let sumItemWeight = 0;

  batches.forEach(batch => {
    const totalKg = round2(batch["Total Weight"]);
    const availKg = round2(batch["Available Weight"]);
    const usedKg = round2(totalKg - availKg);
    const productsList = Array.isArray(batch.Products) ? batch.Products : [];
    const stockState =
      batch.Status === "Active" && availKg > 0 ? "Active in Stock" : "Closed";

    sumImportedKg += totalKg;
    sumAvailableKg += availKg;
    sumUsedKg += usedKg;

    overviewRows.push({
      batchId: batch["Import Batch ID"] || "",
      name: batch.Name || "",
      stockState,
      arrivalDate: batch["Arrival Date (UAE)"] || "",
      uaePhone: batch["UAE Phone"] || "",
      egyPhone: batch["EGY Phone"] || "",
      passport: batch["Passport Number"] || "",
      egyLocation: batch["Location in Egypt"] || "",
      flight: batch["Flight Dep/Des"] || "",
      totalKg,
      availKg,
      usedKg,
      productsCount: productsList.length,
      notes: batch.Notes || ""
    });

    productsList.forEach((p: any) => {
      const qty = Number(p.Quantity || 0);
      const purchase = round2(p["Purchase Price"]);
      const shipping = round2(p["Shipping Cost"]);
      const local = round2(p["Local Cost"]);
      const unitLoaded = round2(p["Total Cost per product"]);
      const lineCost = round2(qty * unitLoaded);
      const prodWeight = round2(p["Product Weight"]);
      const prodAvailWeight = round2(p["Available Weight"]);

      sumItemQty += qty;
      sumLineCost += lineCost;
      sumItemWeight += prodWeight;

      itemRows.push({
        batchId: batch["Import Batch ID"] || "",
        carrier: batch.Name || "",
        arrivalDate: batch["Arrival Date (UAE)"] || "",
        stockState,
        product: p.Product || "",
        qty,
        purchase,
        shipping,
        local,
        unitLoaded,
        lineCost,
        prodWeight,
        prodAvailWeight
      });
    });
  });

  buildStyledTableSheet(wb, {
    sheetName: "Batches",
    tabColor: "FF4F46E5",
    headerBg: "FF3730A3",
    title: "Batches Module — Import Shipments Overview",
    subtitle: `Export Date: ${exportDate}   |   ${batches.length} Shipments   |   ${subtitleExtra}`,
    columns: [
      { header: "Batch ID", key: "batchId", format: "date", minWidth: 13 },
      { header: "Traveler / Carrier", key: "name", format: "text", minWidth: 20 },
      { header: "Stock Status", key: "stockState", format: "status", minWidth: 16 },
      { header: "Arrival Date (UAE)", key: "arrivalDate", format: "date", minWidth: 16 },
      { header: "UAE Phone", key: "uaePhone", format: "phone", minWidth: 17 },
      { header: "EGY Phone", key: "egyPhone", format: "phone", minWidth: 17 },
      { header: "Passport No.", key: "passport", format: "text", minWidth: 14 },
      { header: "Egypt Location", key: "egyLocation", format: "text", minWidth: 16 },
      { header: "Flight Route", key: "flight", format: "text", minWidth: 16 },
      { header: "Imported Weight", key: "totalKg", format: "kg", minWidth: 16 },
      { header: "Available Stock", key: "availKg", format: "kg", minWidth: 16 },
      { header: "Sold / Used", key: "usedKg", format: "kg", minWidth: 14 },
      { header: "SKUs", key: "productsCount", format: "int", minWidth: 8 },
      { header: "Carrier Notes", key: "notes", format: "text", minWidth: 22, maxWidth: 38 }
    ],
    rows: overviewRows,
    totalRow: {
      batchId: "TOTAL",
      name: `${batches.length} Batches`,
      totalKg: round2(sumImportedKg),
      availKg: round2(sumAvailableKg),
      usedKg: round2(sumUsedKg)
    }
  });

  buildStyledTableSheet(wb, {
    sheetName: "Batch Products",
    tabColor: "FF7C3AED",
    headerBg: "FF5B21B6",
    title: "Batches Module — Detailed Product Cost & Weight Breakdown",
    subtitle: `Export Date: ${exportDate}   |   ${itemRows.length} Product Line Items Across ${batches.length} Batches`,
    columns: [
      { header: "Batch ID", key: "batchId", format: "date", minWidth: 13 },
      { header: "Carrier Name", key: "carrier", format: "text", minWidth: 18 },
      { header: "Arrival Date", key: "arrivalDate", format: "date", minWidth: 13 },
      { header: "Status", key: "stockState", format: "status", minWidth: 15 },
      { header: "Imported Product", key: "product", format: "text", minWidth: 24 },
      { header: "Imported Qty", key: "qty", format: "int", minWidth: 13 },
      { header: "Unit Purchase", key: "purchase", format: "aed", minWidth: 15 },
      { header: "Freight Cost", key: "shipping", format: "aed", minWidth: 15 },
      { header: "Jars / Local Toll", key: "local", format: "aed", minWidth: 16 },
      { header: "Loaded Unit Cost", key: "unitLoaded", format: "aed", minWidth: 17 },
      { header: "Total Line Cost", key: "lineCost", format: "aed", minWidth: 17 },
      { header: "Computed Weight", key: "prodWeight", format: "kg", minWidth: 16 },
      { header: "Available Weight", key: "prodAvailWeight", format: "kg", minWidth: 16 }
    ],
    rows: itemRows,
    totalRow: {
      batchId: "TOTAL",
      product: `${itemRows.length} Items`,
      qty: sumItemQty,
      lineCost: round2(sumLineCost),
      prodWeight: round2(sumItemWeight)
    }
  });
}

function addBalanceSheet(wb: ExcelJS.Workbook, transactions: any[], subtitleExtra: string) {
  const exportDate = todayStamp();
  let totalIncome = 0;
  let totalExpense = 0;

  const rows = transactions.map(tr => {
    const amt = round2(tr.Amount);
    const isIncome = tr.Type === "Income";
    const signed = isIncome ? amt : -amt;
    if (isIncome) totalIncome += amt;
    else totalExpense += amt;

    return {
      txId: tr["Transaction ID"] || "",
      date: tr.Date || "",
      type: tr.Type || "",
      details: tr.Details || "",
      amount: amt,
      signedMovement: round2(signed),
      runningBalance: round2(tr.Balance),
      note: tr.Note || ""
    };
  });

  const latestBalance = transactions.length > 0 ? round2(transactions[0]?.Balance) : 0;

  buildStyledTableSheet(wb, {
    sheetName: "Balance",
    tabColor: "FF059669",
    headerBg: "FF065F46",
    title: "Balance Module — Cash General Ledger",
    subtitle: `Export Date: ${exportDate}   |   ${transactions.length} Entries   |   Inflow: ${round2(totalIncome).toLocaleString()} AED  |  Outflow: ${round2(totalExpense).toLocaleString()} AED   |   ${subtitleExtra}`,
    columns: [
      { header: "Reference ID", key: "txId", format: "date", minWidth: 16 },
      { header: "Date", key: "date", format: "date", minWidth: 13 },
      { header: "Type", key: "type", format: "status", minWidth: 12 },
      { header: "Transaction Details", key: "details", format: "text", minWidth: 34, maxWidth: 48 },
      { header: "Amount", key: "amount", format: "aed", minWidth: 16 },
      { header: "Cash Movement", key: "signedMovement", format: "aedSigned", minWidth: 18 },
      { header: "Running Balance", key: "runningBalance", format: "aedSigned", minWidth: 18 },
      { header: "Notes", key: "note", format: "text", minWidth: 24, maxWidth: 44 }
    ],
    rows,
    totalRow: {
      txId: "TOTAL",
      date: `${transactions.length} Entries`,
      details: `Total Inflow: ${round2(totalIncome).toFixed(2)} AED   |   Total Outflow: ${round2(totalExpense).toFixed(2)} AED`,
      signedMovement: round2(totalIncome - totalExpense),
      runningBalance: latestBalance
    }
  });
}

function addCustomersSheet(wb: ExcelJS.Workbook, customers: any[], subtitleExtra: string) {
  const exportDate = todayStamp();
  let totalOrders = 0;
  let totalRevenue = 0;

  const rows = customers.map(c => {
    const orderCount = Number(c["Order Count"] || 0);
    const spent = round2(c["Total Spent"]);
    totalOrders += orderCount;
    totalRevenue += spent;

    return {
      customerId: c["Customer ID"] || "",
      name: c["Customer Name"] || "",
      phone: c["Customer Phone"] || "",
      location: c["Customer Location"] || "Other",
      orderCount,
      totalSpent: spent,
      avgOrder: orderCount > 0 ? round2(spent / orderCount) : 0
    };
  });

  buildStyledTableSheet(wb, {
    sheetName: "Customers",
    tabColor: "FF0D9488",
    headerBg: "FF115E59",
    title: "Customers Module — Active Clients Roster",
    subtitle: `Export Date: ${exportDate}   |   ${customers.length} Clients   |   ${subtitleExtra}`,
    columns: [
      { header: "Customer ID", key: "customerId", format: "date", minWidth: 15 },
      { header: "Client Name", key: "name", format: "text", minWidth: 24 },
      { header: "Contact Phone (UAE)", key: "phone", format: "phone", minWidth: 19 },
      { header: "Emirates Location", key: "location", format: "text", minWidth: 18 },
      { header: "Orders Placed", key: "orderCount", format: "int", minWidth: 14 },
      { header: "Total Revenue", key: "totalSpent", format: "aed", minWidth: 18 },
      { header: "Avg Per Order", key: "avgOrder", format: "aed", minWidth: 16 }
    ],
    rows,
    totalRow: {
      customerId: "TOTAL",
      name: `${customers.length} Clients`,
      orderCount: totalOrders,
      totalSpent: round2(totalRevenue),
      avgOrder: totalOrders > 0 ? round2(totalRevenue / totalOrders) : 0
    }
  });
}

function addProductsSheet(wb: ExcelJS.Workbook, productsCatalog: any[]) {
  const exportDate = todayStamp();
  let sumTotalCost = 0;
  let sumSell = 0;
  let sumProfit = 0;

  const rows = productsCatalog.map(prod => {
    const weightG = Number(prod.weight_g || 0);
    const weightKg = round3(weightG / 1000);
    const pCost = round2(prod.purchase_price);
    const sCost = round2(prod.shipping_cost);
    const lCost = round2(prod.local_cost);
    const totalCost = round2(pCost + sCost + lCost);
    const sellPrice = round2(prod.selling_price);
    const profit = round2(sellPrice - totalCost);
    const margin = sellPrice > 0 ? round2((profit / sellPrice) * 100) : 0;

    sumTotalCost += totalCost;
    sumSell += sellPrice;
    sumProfit += profit;

    return {
      name: prod.name || "",
      weightG,
      weightKg,
      pCost,
      sCost,
      lCost,
      totalCost,
      sellPrice,
      profit,
      margin,
      notes: prod.notes || ""
    };
  });

  const count = productsCatalog.length || 1;

  buildStyledTableSheet(wb, {
    sheetName: "Products",
    tabColor: "FFB45309",
    headerBg: "FF92400E",
    title: "Products Module — Enterprise Pricing & Cost Catalog",
    subtitle: `Export Date: ${exportDate}   |   ${productsCatalog.length} Active Products`,
    columns: [
      { header: "Product Name", key: "name", format: "text", minWidth: 28 },
      { header: "Weight (g)", key: "weightG", format: "int", minWidth: 12 },
      { header: "Weight (kg)", key: "weightKg", format: "kg", minWidth: 13 },
      { header: "Purchase Cost", key: "pCost", format: "aed", minWidth: 15 },
      { header: "Shipping Cost", key: "sCost", format: "aed", minWidth: 15 },
      { header: "Local / Jars Cost", key: "lCost", format: "aed", minWidth: 16 },
      { header: "Total Unit Cost", key: "totalCost", format: "aed", minWidth: 16 },
      { header: "Standard Sell Price", key: "sellPrice", format: "aed", minWidth: 18 },
      { header: "Expected Profit", key: "profit", format: "aedSigned", minWidth: 17 },
      { header: "Margin (%)", key: "margin", format: "pct", minWidth: 12 },
      { header: "Notes", key: "notes", format: "text", minWidth: 22, maxWidth: 40 }
    ],
    rows,
    totalRow: {
      name: `AVERAGE (${productsCatalog.length} Products)`,
      totalCost: round2(sumTotalCost / count),
      sellPrice: round2(sumSell / count),
      profit: round2(sumProfit / count),
      margin: sumSell > 0 ? round2((sumProfit / sumSell) * 100) : 0
    }
  });
}

// ============================================================================
// PUBLIC EXPORT FUNCTIONS
// ============================================================================

export async function exportFullReportToExcel(data: {
  dashboard: any;
  dashFilters: { month: string; from: string; to: string; batch: string };
  orders: any[];
  batches: any[];
  balanceTransactions: any[];
  customers: any[];
  productsCatalog: any[];
}) {
  const wb = new ExcelJS.Workbook();
  const exportDate = todayStamp();

  addDashboardSheets(wb, data.dashboard, data.dashFilters);
  addOrdersSheet(wb, data.orders, "Complete Orders Ledger");
  addBatchesSheets(wb, data.batches, "All Stock Import Batches");
  addBalanceSheet(wb, data.balanceTransactions, "Complete Cash Balance Book");
  addCustomersSheet(wb, data.customers, "All Active Clients");
  addProductsSheet(wb, data.productsCatalog);

  await downloadWorkbook(wb, `UAE_Honey_House_Full_Report_${exportDate}.xlsx`);
}

export async function exportOrdersToExcel(
  orders: any[],
  filters: {
    search: string;
    month: string;
    from: string;
    to: string;
    batch: string;
    delivery: string;
    payment: string;
  }
) {
  const wb = new ExcelJS.Workbook();
  const exportDate = todayStamp();
  const periodLabel =
    filters.month === "custom"
      ? `${filters.from || "Start"} to ${filters.to || "End"}`
      : filters.month || "All Months";
  const subtitle = `Period: ${periodLabel} | Batch: ${filters.batch} | Delivery: ${filters.delivery} | Payment: ${filters.payment}${filters.search ? ` | Search: "${filters.search}"` : ""}`;

  addOrdersSheet(wb, orders, subtitle);
  await downloadWorkbook(wb, `UAE_Honey_House_Orders_${exportDate}.xlsx`);
}

export async function exportBatchesToExcel(
  batches: any[],
  filters: { month: string; from: string; to: string }
) {
  const wb = new ExcelJS.Workbook();
  const exportDate = todayStamp();
  const periodLabel =
    filters.month === "custom"
      ? `${filters.from || "Start"} to ${filters.to || "End"}`
      : filters.month || "All Months";

  addBatchesSheets(wb, batches, `Period: ${periodLabel}`);
  await downloadWorkbook(wb, `UAE_Honey_House_Batches_${exportDate}.xlsx`);
}

export async function exportBalanceToExcel(
  transactions: any[],
  filters: { month: string; type: string }
) {
  const wb = new ExcelJS.Workbook();
  const exportDate = todayStamp();
  const subtitle = `Month: ${filters.month || "All Months"} | Type: ${filters.type === "all" ? "All Types" : filters.type}`;

  addBalanceSheet(wb, transactions, subtitle);
  await downloadWorkbook(wb, `UAE_Honey_House_Balance_${exportDate}.xlsx`);
}

export async function exportCustomersToExcel(
  customers: any[],
  filters: { search: string; location: string; sort: string }
) {
  const wb = new ExcelJS.Workbook();
  const exportDate = todayStamp();
  const subtitle = `Location: ${filters.location || "All Locations"} | Sort: ${filters.sort || "Default"}${filters.search ? ` | Search: "${filters.search}"` : ""}`;

  addCustomersSheet(wb, customers, subtitle);
  await downloadWorkbook(wb, `UAE_Honey_House_Customers_${exportDate}.xlsx`);
}

export async function exportProductsToExcel(productsCatalog: any[]) {
  const wb = new ExcelJS.Workbook();
  const exportDate = todayStamp();

  addProductsSheet(wb, productsCatalog);
  await downloadWorkbook(wb, `UAE_Honey_House_Products_${exportDate}.xlsx`);
}
