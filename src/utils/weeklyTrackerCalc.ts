export interface TrackerProduct {
  id: number;
  sortOrder: number;
  name: string;
  price: number;
  weightKg: number;
  isActive: boolean;
}

export interface TrackerWeekItemInput {
  id?: number;
  productId: number;
  unitPrice: number;
  weightKg: number;
  previousBalance: number;
  isPrevManual: boolean;
  newStock: number;
  remainingStock: number;
}

export interface TrackerWeek {
  id: number;
  weekDate: string; // YYYY-MM-DD
  commissionRate: number; // e.g. 10 or 12
  notes: string;
  items: TrackerWeekItemInput[];
}

export interface ComputedWeekItem extends TrackerWeekItemInput {
  index: number;
  productName: string;
  weekId: number;
  weekDate: string;
  commissionRate: number;
  weekNotes: string;
  isFirstWeek: boolean;
  autoPreviousBalance: number;
  effectivePreviousBalance: number;
  soldQty: number;
  totalSales: number;
  priceAfterCommission: number;
  commissionAmount: number;
  netPayable: number;
  soldWeightKg: number;
  remainingWeightKg: number;
}

export interface ComputedWeek {
  id: number;
  weekDate: string;
  commissionRate: number;
  notes: string;
  isFirstWeek: boolean;
  items: ComputedWeekItem[];
  totals: {
    previousBalance: number;
    newStock: number;
    remainingStock: number;
    soldQty: number;
    totalSales: number;
    commissionAmount: number;
    netPayable: number;
    soldWeightKg: number;
    remainingWeightKg: number;
  };
}

export interface TrackerGrandTotals {
  newStock: number;
  soldQty: number;
  totalSales: number;
  commissionAmount: number;
  netPayable: number;
  latestRemainingStock: number;
  soldWeightKg: number;
  latestRemainingWeightKg: number;
}

export interface DashboardMetrics {
  totalSales: number;
  totalCommission: number;
  totalNetPayable: number;
  soldUnits: number;
  remainingUnits: number;
  totalUnits: number;
  soldWeightKg: number;
  remainingWeightKg: number;
  totalWeightKg: number;
  salesWeightPct: number;
  totalNewStock: number;
  filteredRows: ComputedWeekItem[];
  scopeLabel: string;
  latestWeekDate: string | null;
}

export function round2(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.round(val * 100) / 100;
}

export function round3(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.round(val * 1000) / 1000;
}

export function formatNumber(val: number, maxDecimals = 2): string {
  const safe = Number.isFinite(val) ? val : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals
  }).format(round2(safe));
}

export function formatFixed2(val: number): string {
  const safe = Number.isFinite(val) ? val : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(round2(safe));
}

export function formatKg(val: number): string {
  const safe = Number.isFinite(val) ? round3(val) : 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(safe);
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const ARABIC_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const ARABIC_WEEKDAYS = [
  "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
];

/** Formats YYYY-MM-DD as 22-Nov-26 matching the reference ledger */
export function formatShortWeekDate(isoDate: string): string {
  if (!isoDate) return "";
  const clean = isoDate.split("T")[0];
  const parts = clean.split("-");
  if (parts.length !== 3) return clean;
  const year = parts[0].slice(-2);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) return clean;
  return `${day}-${SHORT_MONTHS[monthIdx]}-${year}`;
}

/** Formats YYYY-MM-DD cleanly in Arabic for RTL selects and headers (e.g. "الأحد 22 نوفمبر 2026") */
export function formatArabicWeekDate(isoDate: string): string {
  if (!isoDate) return "";
  const clean = isoDate.split("T")[0];
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return clean;
  const dt = new Date(Date.UTC(y, m - 1, d));
  const weekday = ARABIC_WEEKDAYS[dt.getUTCDay()] || "";
  return `${weekday} ${d} ${ARABIC_MONTHS[m - 1]} ${y}`;
}

/** Formats YYYY-MM-DD as "22 نوفمبر 2026" (RTL-safe, zero BiDi flipping) */
export function formatArabicShortDate(isoDate: string): string {
  if (!isoDate) return "";
  const clean = isoDate.split("T")[0];
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return clean;
  return `${d} ${ARABIC_MONTHS[m - 1]} ${y}`;
}

/** Formats YYYY-MM-DD as compact "22 نوفمبر" for mobile thumb chips */
export function formatArabicDayMonth(isoDate: string): string {
  if (!isoDate) return "";
  const clean = isoDate.split("T")[0];
  const [, m, d] = clean.split("-").map(Number);
  if (!m || !d || m < 1 || m > 12) return clean;
  return `${d} ${ARABIC_MONTHS[m - 1]}`;
}

/** Checks if an ISO YYYY-MM-DD date falls on a Sunday (0) */
export function isSundayDate(isoDate: string): boolean {
  if (!isoDate) return false;
  const clean = isoDate.split("T")[0];
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCDay() === 0;
}

/** Suggests the next Sunday ISO date after the latest week (or nearest Sunday to today) */
export function getNextSundayDate(latestIsoDate?: string): string {
  if (latestIsoDate) {
    const clean = latestIsoDate.split("T")[0];
    const [y, m, d] = clean.split("-").map(Number);
    if (y && m && d) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() + 7);
      // Snap forward to Sunday if latest wasn't Sunday
      const dayOfWeek = dt.getUTCDay();
      if (dayOfWeek !== 0) {
        dt.setUTCDate(dt.getUTCDate() + (7 - dayOfWeek));
      }
      return dt.toISOString().split("T")[0];
    }
  }
  const now = new Date();
  const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffToSunday = (7 - dt.getUTCDay()) % 7;
  dt.setUTCDate(dt.getUTCDate() + diffToSunday);
  return dt.toISOString().split("T")[0];
}

/** Snaps any YYYY-MM-DD date to the nearest Sunday (same day if Sunday, otherwise upcoming Sunday) */
export function snapToSunday(isoDate: string): string {
  const clean = (isoDate || "").split("T")[0];
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d) return getNextSundayDate();
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay();
  if (day === 0) return clean;
  // Snap to closest Sunday
  const delta = day <= 3 ? -day : 7 - day;
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().split("T")[0];
}

/**
 * Computes all weekly inventory rows chronologically:
 * - Week 0 (first recorded week):
 *     effectivePrev = previousBalance (manual)
 *     soldQty = effectivePrev + newStock - remainingStock
 * - Week N (subsequent weeks):
 *     autoPreviousBalance = prevWeek.remainingStock + prevWeek.newStock
 *     effectivePrev = isPrevManual ? previousBalance : autoPreviousBalance
 *     soldQty = effectivePrev - remainingStock
 * - Financial formulas:
 *     totalSales = soldQty * unitPrice
 *     priceAfterCommission = unitPrice * (1 - commissionRate / 100)
 *     commissionAmount = totalSales * (commissionRate / 100)
 *     netPayable = totalSales - commissionAmount
 */
export function computeAllWeeks(
  weeks: TrackerWeek[],
  products: TrackerProduct[]
): { computedWeeks: ComputedWeek[]; grandTotals: TrackerGrandTotals } {
  const sortedProducts = [...products].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const productMap = new Map<number, TrackerProduct>();
  sortedProducts.forEach(p => productMap.set(p.id, p));

  const sortedWeeks = [...weeks].sort((a, b) => a.weekDate.localeCompare(b.weekDate) || a.id - b.id);
  const computedWeeks: ComputedWeek[] = [];

  sortedWeeks.forEach((week, weekIdx) => {
    const isFirstWeek = weekIdx === 0;
    const prevWeek = weekIdx > 0 ? computedWeeks[weekIdx - 1] : null;
    const prevItemByProduct = new Map<number, ComputedWeekItem>();
    if (prevWeek) {
      prevWeek.items.forEach(it => prevItemByProduct.set(it.productId, it));
    }

    const itemByProduct = new Map<number, TrackerWeekItemInput>();
    (week.items || []).forEach(it => itemByProduct.set(it.productId, it));

    // Include all active products in catalog order, plus any historical product present in week.items
    const orderedProductIds: number[] = [];
    const seen = new Set<number>();
    sortedProducts.forEach(p => {
      if (p.isActive || itemByProduct.has(p.id)) {
        orderedProductIds.push(p.id);
        seen.add(p.id);
      }
    });
    (week.items || []).forEach(it => {
      if (!seen.has(it.productId)) {
        orderedProductIds.push(it.productId);
        seen.add(it.productId);
      }
    });

    const commissionRate = Number(week.commissionRate) || 0;
    const commissionDecimal = commissionRate / 100;

    const computedItems: ComputedWeekItem[] = orderedProductIds.map((pid, idx) => {
      const prod = productMap.get(pid);
      const raw = itemByProduct.get(pid);
      const prevComputed = prevItemByProduct.get(pid);

      const unitPrice = raw ? Number(raw.unitPrice) : (prod ? Number(prod.price) : 0);
      const weightKg = raw ? Number(raw.weightKg) : (prod ? Number(prod.weightKg) : 0.5);
      const newStock = raw ? Number(raw.newStock) || 0 : 0;
      const remainingStock = raw ? Number(raw.remainingStock) || 0 : 0;

      const autoPreviousBalance = isFirstWeek
        ? (raw ? Number(raw.previousBalance) || 0 : 0)
        : round2((prevComputed?.remainingStock || 0) + (prevComputed?.newStock || 0));

      const isPrevManual = raw ? Boolean(raw.isPrevManual) : false;
      const effectivePreviousBalance = isFirstWeek
        ? (raw ? Number(raw.previousBalance) || 0 : 0)
        : (isPrevManual ? (raw ? Number(raw.previousBalance) || 0 : 0) : autoPreviousBalance);

      const soldQty = isFirstWeek
        ? round2(effectivePreviousBalance + newStock - remainingStock)
        : round2(effectivePreviousBalance - remainingStock);

      const totalSales = round2(soldQty * unitPrice);
      const priceAfterCommission = round2(unitPrice * (1 - commissionDecimal));
      const commissionAmount = round2(totalSales * commissionDecimal);
      const netPayable = round2(totalSales - commissionAmount);
      const soldWeightKg = round3(soldQty * weightKg);
      const remainingWeightKg = round3(remainingStock * weightKg);

      return {
        id: raw?.id,
        index: idx + 1,
        productId: pid,
        productName: prod?.name || `منتج #${pid}`,
        weekId: week.id,
        weekDate: week.weekDate,
        commissionRate,
        weekNotes: week.notes || "",
        isFirstWeek,
        unitPrice,
        weightKg,
        previousBalance: raw ? Number(raw.previousBalance) || 0 : effectivePreviousBalance,
        isPrevManual,
        autoPreviousBalance,
        effectivePreviousBalance,
        newStock,
        remainingStock,
        soldQty,
        totalSales,
        priceAfterCommission,
        commissionAmount,
        netPayable,
        soldWeightKg,
        remainingWeightKg
      };
    });

    const totals = computedItems.reduce(
      (acc, item) => ({
        previousBalance: round2(acc.previousBalance + item.effectivePreviousBalance),
        newStock: round2(acc.newStock + item.newStock),
        remainingStock: round2(acc.remainingStock + item.remainingStock),
        soldQty: round2(acc.soldQty + item.soldQty),
        totalSales: round2(acc.totalSales + item.totalSales),
        commissionAmount: round2(acc.commissionAmount + item.commissionAmount),
        netPayable: round2(acc.netPayable + item.netPayable),
        soldWeightKg: round3(acc.soldWeightKg + item.soldWeightKg),
        remainingWeightKg: round3(acc.remainingWeightKg + item.remainingWeightKg)
      }),
      {
        previousBalance: 0,
        newStock: 0,
        remainingStock: 0,
        soldQty: 0,
        totalSales: 0,
        commissionAmount: 0,
        netPayable: 0,
        soldWeightKg: 0,
        remainingWeightKg: 0
      }
    );

    computedWeeks.push({
      id: week.id,
      weekDate: week.weekDate,
      commissionRate,
      notes: week.notes || "",
      isFirstWeek,
      items: computedItems,
      totals
    });
  });

  const latestWeek = computedWeeks.length > 0 ? computedWeeks[computedWeeks.length - 1] : null;
  const grandTotals: TrackerGrandTotals = computedWeeks.reduce(
    (acc, w) => ({
      newStock: round2(acc.newStock + w.totals.newStock),
      soldQty: round2(acc.soldQty + w.totals.soldQty),
      totalSales: round2(acc.totalSales + w.totals.totalSales),
      commissionAmount: round2(acc.commissionAmount + w.totals.commissionAmount),
      netPayable: round2(acc.netPayable + w.totals.netPayable),
      latestRemainingStock: latestWeek ? latestWeek.totals.remainingStock : 0,
      soldWeightKg: round3(acc.soldWeightKg + w.totals.soldWeightKg),
      latestRemainingWeightKg: latestWeek ? latestWeek.totals.remainingWeightKg : 0
    }),
    {
      newStock: 0,
      soldQty: 0,
      totalSales: 0,
      commissionAmount: 0,
      netPayable: 0,
      latestRemainingStock: 0,
      soldWeightKg: 0,
      latestRemainingWeightKg: 0
    }
  );

  return { computedWeeks, grandTotals };
}

/**
 * Computes the 5 KPI cards + filtered detail rows.
 * Important rule:
 * When selectedWeekId === "all":
 *   - Sales/Commission/NetPayable/SoldUnits/SoldWeight are summed across ALL weeks.
 *   - RemainingUnits & RemainingWeight are taken strictly from the LATEST recorded week.
 */
export function computeDashboardMetrics(
  computedWeeks: ComputedWeek[],
  products: TrackerProduct[],
  selectedWeekId: string,
  selectedProductId: string
): DashboardMetrics {
  const isAllWeeks = selectedWeekId === "all";
  const isAllProducts = selectedProductId === "all";

  const targetWeeks = isAllWeeks
    ? [...computedWeeks].reverse()
    : computedWeeks.filter(w => String(w.id) === String(selectedWeekId));

  const filteredRows: ComputedWeekItem[] = [];
  for (const w of targetWeeks) {
    for (const item of w.items) {
      if (isAllProducts || String(item.productId) === String(selectedProductId)) {
        filteredRows.push(item);
      }
    }
  }

  let totalSales = 0;
  let totalCommission = 0;
  let totalNetPayable = 0;
  let soldUnits = 0;
  let soldWeightKg = 0;
  let totalNewStock = 0;

  for (const row of filteredRows) {
    totalSales += row.totalSales;
    totalCommission += row.commissionAmount;
    totalNetPayable += row.netPayable;
    soldUnits += row.soldQty;
    soldWeightKg += row.soldWeightKg;
    totalNewStock += row.newStock;
  }

  // Remaining rule: latest recorded week only when week filter is "all"
  const latestWeek = computedWeeks.length > 0 ? computedWeeks[computedWeeks.length - 1] : null;
  let remainingUnits = 0;
  let remainingWeightKg = 0;

  const remainingSourceWeeks = isAllWeeks
    ? (latestWeek ? [latestWeek] : [])
    : targetWeeks;

  for (const w of remainingSourceWeeks) {
    for (const item of w.items) {
      if (isAllProducts || String(item.productId) === String(selectedProductId)) {
        remainingUnits += item.remainingStock;
        remainingWeightKg += item.remainingWeightKg;
      }
    }
  }

  totalSales = round2(totalSales);
  totalCommission = round2(totalCommission);
  totalNetPayable = round2(totalNetPayable);
  soldUnits = round2(soldUnits);
  remainingUnits = round2(remainingUnits);
  totalNewStock = round2(totalNewStock);
  soldWeightKg = round3(soldWeightKg);
  remainingWeightKg = round3(remainingWeightKg);

  const totalUnits = round2(soldUnits + remainingUnits);
  const totalWeightKg = round3(soldWeightKg + remainingWeightKg);
  const salesWeightPct = totalWeightKg > 0 ? round2((soldWeightKg / totalWeightKg) * 100) : 0;

  // Dynamic scope status text
  const selectedWeekObj = !isAllWeeks
    ? computedWeeks.find(w => String(w.id) === String(selectedWeekId))
    : null;
  const selectedProductObj = !isAllProducts
    ? products.find(p => String(p.id) === String(selectedProductId))
    : null;

  let scopeLabel = "عرض شامل لكافة الأسابيع وكافة المنتجات";
  if (!isAllWeeks && isAllProducts) {
    scopeLabel = `عرض مصفى لأسبوع محدد (${selectedWeekObj ? formatArabicShortDate(selectedWeekObj.weekDate) : ""}) عبر كافة المنتجات`;
  } else if (isAllWeeks && !isAllProducts) {
    scopeLabel = `عرض مصفى لمنتج محدد (${selectedProductObj?.name || ""}) عبر كافة الأسابيع`;
  } else if (!isAllWeeks && !isAllProducts) {
    scopeLabel = `عرض مصفى لأسبوع (${selectedWeekObj ? formatArabicShortDate(selectedWeekObj.weekDate) : ""}) ومنتج (${selectedProductObj?.name || ""})`;
  }

  return {
    totalSales,
    totalCommission,
    totalNetPayable,
    soldUnits,
    remainingUnits,
    totalUnits,
    soldWeightKg,
    remainingWeightKg,
    totalWeightKg,
    salesWeightPct,
    totalNewStock,
    filteredRows,
    scopeLabel,
    latestWeekDate: latestWeek ? latestWeek.weekDate : null
  };
}
