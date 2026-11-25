import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Minus,
  Edit2,
  Trash2,
  Save,
  X,
  RotateCcw,
  FileSpreadsheet,
  Calendar,
  Package,
  AlertTriangle,
  Check,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  LayoutList,
  Table2,
  Filter
} from "lucide-react";
import {
  type TrackerProduct,
  type TrackerWeek,
  type TrackerWeekItemInput,
  type ComputedWeek,
  computeAllWeeks,
  computeDashboardMetrics,
  formatNumber,
  formatFixed2,
  formatKg,
  formatArabicWeekDate,
  formatArabicShortDate,
  formatArabicDayMonth,
  getNextSundayDate,
  isSundayDate,
  snapToSunday,
  round2
} from "../utils/weeklyTrackerCalc";
import { exportWeeklyTrackerToExcel } from "../utils/weeklyTrackerExcel";

interface WeeklyInventoryTrackerProps {
  onNotify?: (message: string, type?: "success" | "danger" | "warning" | "info") => void;
  externalExportTrigger?: number;
}

type ViewMode = "both" | "dashboard" | "log" | "products";
type LogDisplayMode = "cards" | "table";

interface WeekDraftItem {
  productId: number;
  productName: string;
  unitPrice: number;
  weightKg: number;
  autoPreviousBalance: number;
  previousBalance: number;
  isPrevManual: boolean;
  newStock: number;
  remainingStock: number;
}

interface WeekDraft {
  id: number | null; // null = creating new week
  weekDate: string;
  commissionRate: number;
  notes: string;
  isFirstWeek: boolean;
  items: WeekDraftItem[];
}

export const WeeklyInventoryTracker: React.FC<WeeklyInventoryTrackerProps> = ({
  onNotify,
  externalExportTrigger = 0
}) => {
  const [products, setProducts] = useState<TrackerProduct[]>([]);
  const [weeks, setWeeks] = useState<TrackerWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // View mode, Log display mode & Dashboard filters
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [logDisplayMode, setLogDisplayMode] = useState<LogDisplayMode>("cards");
  const [expandedWeekIds, setExpandedWeekIds] = useState<number[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>("all");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");

  // Modals / Editors
  const [weekDraft, setWeekDraft] = useState<WeekDraft | null>(null);
  const [unlockedPrevIds, setUnlockedPrevIds] = useState<number[]>([]);
  const [deleteWeekTarget, setDeleteWeekTarget] = useState<ComputedWeek | null>(null);

  // Product Manager state
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: "",
    price: 0,
    weightKg: 0.5,
    syncExistingWeeks: false
  });
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    price: 0,
    weightKg: 0.5
  });
  const [deleteProductTarget, setDeleteProductTarget] = useState<TrackerProduct | null>(null);

  const notify = useCallback(
    (msg: string, type: "success" | "danger" | "warning" | "info" = "info") => {
      if (onNotify) onNotify(msg, type);
    },
    [onNotify]
  );

  const fetchTrackerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/weekly-tracker");
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "تعذر تحميل بيانات الجرد الأسبوعي");
      }
      const data = await res.json();
      setProducts(Array.isArray(data.products) ? data.products : []);
      setWeeks(Array.isArray(data.weeks) ? data.weeks : []);
    } catch (e: any) {
      setError(e.message || "حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrackerData();
  }, [fetchTrackerData]);

  // Compute chronologically (oldest -> newest) so previous balances chain accurately
  const { computedWeeks, grandTotals } = useMemo(
    () => computeAllWeeks(weeks, products),
    [weeks, products]
  );

  // Always display newest week first on top
  const weeksNewestFirst = useMemo(
    () => [...computedWeeks].reverse(),
    [computedWeeks]
  );

  // Auto-expand the newest week once data loads
  useEffect(() => {
    if (weeksNewestFirst.length > 0 && expandedWeekIds.length === 0) {
      setExpandedWeekIds([weeksNewestFirst[0].id]);
    }
  }, [weeksNewestFirst]);

  // Keep selectedWeekId valid if a week is deleted
  useEffect(() => {
    if (
      selectedWeekId !== "all" &&
      !computedWeeks.some(w => String(w.id) === String(selectedWeekId))
    ) {
      setSelectedWeekId("all");
    }
  }, [computedWeeks, selectedWeekId]);

  // Keep selectedProductId valid if a product is deleted
  useEffect(() => {
    if (
      selectedProductId !== "all" &&
      !products.some(p => String(p.id) === String(selectedProductId))
    ) {
      setSelectedProductId("all");
    }
  }, [products, selectedProductId]);

  // Dashboard metrics
  const metrics = useMemo(
    () => computeDashboardMetrics(computedWeeks, products, selectedWeekId, selectedProductId),
    [computedWeeks, products, selectedWeekId, selectedProductId]
  );

  const selectedWeekLabel = useMemo(() => {
    if (selectedWeekId === "all") return "الكل (جميع الأسابيع)";
    const found = computedWeeks.find(w => String(w.id) === String(selectedWeekId));
    return found ? formatArabicWeekDate(found.weekDate) : "الكل";
  }, [computedWeeks, selectedWeekId]);

  const selectedProductLabel = useMemo(() => {
    if (selectedProductId === "all") return "الكل (جميع المنتجات)";
    const found = products.find(p => String(p.id) === String(selectedProductId));
    return found ? found.name : "الكل";
  }, [products, selectedProductId]);

  const handleExportExcel = useCallback(async () => {
    try {
      await exportWeeklyTrackerToExcel(
        computedWeeks,
        grandTotals,
        metrics,
        selectedWeekLabel,
        selectedProductLabel
      );
      notify("تم تصدير ملف الإكسيل بنجاح (لوحة المؤشرات + سجل الجرد الأسبوعي)", "success");
    } catch (e: any) {
      notify(e.message || "فشل تصدير ملف الإكسيل", "danger");
    }
  }, [computedWeeks, grandTotals, metrics, selectedWeekLabel, selectedProductLabel, notify]);

  useEffect(() => {
    if (externalExportTrigger > 0) {
      handleExportExcel();
    }
  }, [externalExportTrigger]);

  // Accordion helpers
  const toggleWeekExpand = (weekId: number) => {
    setExpandedWeekIds(prev =>
      prev.includes(weekId) ? prev.filter(id => id !== weekId) : [...prev, weekId]
    );
  };

  const allExpanded =
    weeksNewestFirst.length > 0 && expandedWeekIds.length >= weeksNewestFirst.length;

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedWeekIds(weeksNewestFirst.length > 0 ? [weeksNewestFirst[0].id] : []);
    } else {
      setExpandedWeekIds(weeksNewestFirst.map(w => w.id));
    }
  };

  // ============================================================================
  // OPEN CREATE / EDIT WEEK DRAFT
  // ============================================================================

  const openNewWeekModal = () => {
    const latestWeek = computedWeeks.length > 0 ? computedWeeks[computedWeeks.length - 1] : null;
    const isFirstWeek = computedWeeks.length === 0;
    const nextDate = getNextSundayDate(latestWeek?.weekDate);
    const defaultComm = latestWeek ? latestWeek.commissionRate : 10;

    const latestByProduct = new Map<number, { remainingStock: number; newStock: number }>();
    if (latestWeek) {
      latestWeek.items.forEach(it => {
        latestByProduct.set(it.productId, {
          remainingStock: it.remainingStock,
          newStock: it.newStock
        });
      });
    }

    const activeProducts = [...products]
      .filter(p => p.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

    const draftItems: WeekDraftItem[] = activeProducts.map(p => {
      const prev = latestByProduct.get(p.id);
      const autoPrev = isFirstWeek
        ? 0
        : round2((prev?.remainingStock || 0) + (prev?.newStock || 0));
      return {
        productId: p.id,
        productName: p.name,
        unitPrice: p.price,
        weightKg: p.weightKg,
        autoPreviousBalance: autoPrev,
        previousBalance: autoPrev,
        isPrevManual: isFirstWeek,
        newStock: 0,
        remainingStock: autoPrev
      };
    });

    setUnlockedPrevIds(isFirstWeek ? draftItems.map(i => i.productId) : []);
    setWeekDraft({
      id: null,
      weekDate: nextDate,
      commissionRate: defaultComm,
      notes: "",
      isFirstWeek,
      items: draftItems
    });
  };

  const openEditWeekModal = (week: ComputedWeek) => {
    const draftItems: WeekDraftItem[] = week.items.map(it => ({
      productId: it.productId,
      productName: it.productName,
      unitPrice: it.unitPrice,
      weightKg: it.weightKg,
      autoPreviousBalance: it.autoPreviousBalance,
      previousBalance: it.effectivePreviousBalance,
      isPrevManual: it.isPrevManual,
      newStock: it.newStock,
      remainingStock: it.remainingStock
    }));

    setUnlockedPrevIds(
      week.isFirstWeek
        ? draftItems.map(i => i.productId)
        : draftItems.filter(i => i.isPrevManual).map(i => i.productId)
    );
    setWeekDraft({
      id: week.id,
      weekDate: week.weekDate,
      commissionRate: week.commissionRate,
      notes: week.notes,
      isFirstWeek: week.isFirstWeek,
      items: draftItems
    });
  };

  const updateDraftItem = (
    productId: number,
    field: "previousBalance" | "newStock" | "remainingStock" | "unitPrice",
    rawValue: string
  ) => {
    const val = rawValue === "" ? 0 : Math.max(0, parseFloat(rawValue) || 0);
    setWeekDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(it => {
          if (it.productId !== productId) return it;
          if (field === "previousBalance") {
            return {
              ...it,
              previousBalance: val,
              isPrevManual: prev.isFirstWeek ? true : val !== it.autoPreviousBalance
            };
          }
          return { ...it, [field]: val };
        })
      };
    });
  };

  const stepDraftItem = (
    productId: number,
    field: "previousBalance" | "newStock" | "remainingStock",
    delta: number
  ) => {
    setWeekDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(it => {
          if (it.productId !== productId) return it;
          const nextVal = Math.max(0, round2((it[field] || 0) + delta));
          if (field === "previousBalance") {
            return {
              ...it,
              previousBalance: nextVal,
              isPrevManual: prev.isFirstWeek ? true : nextVal !== it.autoPreviousBalance
            };
          }
          return { ...it, [field]: nextVal };
        })
      };
    });
  };

  const resetDraftItemAutoPrev = (productId: number) => {
    setWeekDraft(prev => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map(it =>
          it.productId === productId
            ? { ...it, previousBalance: it.autoPreviousBalance, isPrevManual: false }
            : it
        )
      };
    });
    setUnlockedPrevIds(prev => prev.filter(id => id !== productId));
  };

  const handleSaveWeekDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekDraft) return;
    setSaving(true);
    try {
      const payload = {
        weekDate: weekDraft.weekDate,
        commissionRate: Number(weekDraft.commissionRate) || 0,
        notes: weekDraft.notes.trim(),
        items: weekDraft.items.map(it => ({
          productId: it.productId,
          unitPrice: it.unitPrice,
          weightKg: it.weightKg,
          previousBalance: it.previousBalance,
          isPrevManual: it.isPrevManual,
          newStock: it.newStock,
          remainingStock: it.remainingStock
        })) as TrackerWeekItemInput[]
      };

      const url = weekDraft.id
        ? `/api/weekly-tracker/weeks/${weekDraft.id}`
        : "/api/weekly-tracker/weeks";
      const method = weekDraft.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body.error || "فشل حفظ السجل الأسبوعي");
      }

      notify(
        weekDraft.id ? "تم تحديث السجل الأسبوعي بنجاح" : "تم إضافة سجل الأسبوع الجديد بنجاح",
        "success"
      );
      setWeekDraft(null);
      await fetchTrackerData();
      if (body.weekId) {
        setExpandedWeekIds([body.weekId]);
      }
    } catch (err: any) {
      notify(err.message || "حدث خطأ أثناء الحفظ", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteWeek = async () => {
    if (!deleteWeekTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/weekly-tracker/weeks/${deleteWeekTarget.id}`, {
        method: "DELETE"
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body.error || "تعذر حذف الأسبوع");
      }
      notify(`تم حذف سجل ${formatArabicShortDate(deleteWeekTarget.weekDate)}`, "success");
      setDeleteWeekTarget(null);
      await fetchTrackerData();
    } catch (err: any) {
      notify(err.message || "فشل حذف السجل", "danger");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // PRODUCT CATALOG CRUD HANDLERS
  // ============================================================================

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) {
      notify("يرجى إدخال اسم المنتج", "warning");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/weekly-tracker/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProductForm.name.trim(),
          price: Number(newProductForm.price) || 0,
          weightKg: Number(newProductForm.weightKg) || 0.5
        })
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body.error || "فشل إضافة المنتج");
      }
      setNewProductForm({ name: "", price: 0, weightKg: 0.5 });
      notify("تم إضافة المنتج الجديد بنجاح", "success");
      await fetchTrackerData();
    } catch (err: any) {
      notify(err.message || "تعذر إضافة المنتج", "danger");
    } finally {
      setSaving(false);
    }
  };

  const startEditProduct = (p: TrackerProduct) => {
    setEditingProductId(p.id);
    setEditProductForm({
      name: p.name,
      price: p.price,
      weightKg: p.weightKg,
      syncExistingWeeks: false
    });
  };

  const handleSaveEditProduct = async (productId: number) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/weekly-tracker/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProductForm)
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body.error || "فشل تحديث المنتج");
      }
      setEditingProductId(null);
      notify("تم تحديث بيانات المنتج بنجاح", "success");
      await fetchTrackerData();
    } catch (err: any) {
      notify(err.message || "تعذر تحديث المنتج", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/weekly-tracker/products/${deleteProductTarget.id}`, {
        method: "DELETE"
      });
      const body = await res.json();
      if (!res.ok || body.success === false) {
        throw new Error(body.error || "تعذر حذف المنتج");
      }
      setDeleteProductTarget(null);
      notify("تم حذف المنتج بنجاح", "success");
      await fetchTrackerData();
    } catch (err: any) {
      notify(err.message || "فشل حذف المنتج", "danger");
    } finally {
      setSaving(false);
    }
  };

  // Draft live totals preview
  const draftSummary = useMemo(() => {
    if (!weekDraft) return null;
    const commDec = (Number(weekDraft.commissionRate) || 0) / 100;
    let sold = 0;
    let sales = 0;
    let comm = 0;
    let net = 0;
    let rem = 0;
    let added = 0;

    const rows = weekDraft.items.map(it => {
      const soldQty = weekDraft.isFirstWeek
        ? round2(it.previousBalance + it.newStock - it.remainingStock)
        : round2(it.previousBalance - it.remainingStock);
      const totalSales = round2(soldQty * it.unitPrice);
      const priceAfterComm = round2(it.unitPrice * (1 - commDec));
      const commAmt = round2(totalSales * commDec);
      const netPayable = round2(totalSales - commAmt);

      sold += soldQty;
      sales += totalSales;
      comm += commAmt;
      net += netPayable;
      rem += it.remainingStock;
      added += it.newStock;

      return { ...it, soldQty, totalSales, priceAfterComm, commAmt, netPayable };
    });

    return {
      rows,
      totals: {
        sold: round2(sold),
        sales: round2(sales),
        comm: round2(comm),
        net: round2(net),
        rem: round2(rem),
        added: round2(added)
      }
    };
  }, [weekDraft]);

  // Loading state
  if (loading) {
    return (
      <div dir="rtl" className="font-arabic space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 animate-pulse space-y-4">
          <div className="h-7 w-72 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-100 rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-28 bg-slate-100 rounded-lg border border-slate-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div dir="rtl" className="font-arabic bg-white border border-rose-200 rounded-xl p-8 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">تعذر تحميل موديول الجرد الأسبوعي</h3>
        <p className="text-sm text-slate-600">{error}</p>
        <button
          type="button"
          onClick={fetchTrackerData}
          className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>إعادة المحاولة</span>
        </button>
      </div>
    );
  }

  const isFiltered = selectedWeekId !== "all" || selectedProductId !== "all";
  const selectedWeekObj =
    selectedWeekId !== "all"
      ? computedWeeks.find(w => String(w.id) === String(selectedWeekId))
      : null;

  return (
    <div dir="rtl" className="font-arabic space-y-6 md:space-y-8 text-slate-900 pb-6">
      {/* ====================================================================
          TOP WORKSPACE CONTROL BAR (MOBILE + DESKTOP OPTIMIZED)
         ==================================================================== */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-4 md:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-[#5c2d0c] leading-snug">
            متابعة الجرد والمبيعات الأسبوعية — بيت العسل
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {computedWeeks.length} أسبوع مسجل · {products.length} منتجات · الأحدث دائماً في الأعلى
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          {/* Primary Action prominent on mobile */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openNewWeekModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs md:text-sm font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل جرد جديد (أحد)</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Excel</span>
            </button>
          </div>

          {/* Segmented Section View Switcher */}
          <div className="grid grid-cols-4 sm:inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/80">
            {[
              { id: "both" as ViewMode, label: "الكل" },
              { id: "dashboard" as ViewMode, label: "المؤشرات" },
              { id: "log" as ViewMode, label: "السجل" },
              { id: "products" as ViewMode, label: `المنتجات` }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id)}
                className={`px-2.5 py-2 min-h-[38px] text-xs font-semibold rounded-md transition whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === tab.id
                    ? "bg-white text-[#5c2d0c] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ====================================================================
          SECTION 1: لوحة المؤشرات (DASHBOARD)
         ==================================================================== */}
      {(viewMode === "both" || viewMode === "dashboard") && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#5c2d0c] text-white px-4 md:px-6 py-4">
            <h3 className="text-base md:text-lg font-bold">
              لوحة مؤشرات الأداء والمبيعات الأسبوعية - بيت العسل
            </h3>
            <p className="text-xs text-amber-100/90 mt-0.5">
              تحليل تفاعلي لحركات التسليم والجرد الأسبوعي، المبيعات المحققة، وصافي مستحقات بيت العسل
            </p>
          </div>

          {/* Quick One-Tap Week Selector Strip (Mobile & Desktop Thumb Friendly) */}
          <div className="bg-[#fffaf3] border-b border-amber-200/70 px-4 md:px-6 pt-3.5 pb-4 space-y-3.5">
            {weeksNewestFirst.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                <button
                  type="button"
                  onClick={() => setSelectedWeekId("all")}
                  className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer border ${
                    selectedWeekId === "all"
                      ? "bg-[#5c2d0c] text-white border-[#5c2d0c]"
                      : "bg-white text-slate-700 border-amber-200 hover:border-amber-400"
                  }`}
                >
                  جميع الأسابيع ({weeksNewestFirst.length})
                </button>
                {weeksNewestFirst.map((w, idx) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setSelectedWeekId(String(w.id))}
                    className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer border ${
                      selectedWeekId === String(w.id)
                        ? "bg-amber-600 text-white border-amber-600"
                        : "bg-white text-slate-700 border-amber-200 hover:border-amber-400"
                    }`}
                  >
                    {idx === 0 ? `الأحدث · ${formatArabicDayMonth(w.weekDate)}` : formatArabicDayMonth(w.weekDate)}
                  </button>
                ))}
              </div>
            )}

            {/* Dropdown Filters + Dynamic Scope Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Filter 1: Week (Clean RTL Arabic Date) */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-[#78350f] mb-1.5">
                  تصفية الأسبوع (الأحد)
                </label>
                <select
                  value={selectedWeekId}
                  onChange={e => setSelectedWeekId(e.target.value)}
                  className="w-full min-h-[44px] bg-white border border-amber-300/90 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="all">الكل — جميع الأسابيع المسجلة</option>
                  {weeksNewestFirst.map(w => (
                    <option key={w.id} value={String(w.id)}>
                      {`${formatArabicWeekDate(w.weekDate)} · عمولة ${formatNumber(w.commissionRate)}%`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Product */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-[#78350f] mb-1.5">
                  تصفية نوع المنتج
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full min-h-[44px] bg-white border border-amber-300/90 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="all">الكل — جميع المنتجات</option>
                  {products.map((p, idx) => (
                    <option key={p.id} value={String(p.id)}>
                      {`${idx + 1}. ${p.name} (${formatNumber(p.price)} درهم)`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Scope Status Bar */}
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#78350f]">نطاق العرض الفعلي</span>
                  {isFiltered && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWeekId("all");
                        setSelectedProductId("all");
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:text-amber-950 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إعادة ضبط</span>
                    </button>
                  )}
                </div>
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 flex items-center gap-2 min-h-[44px]">
                  <SlidersHorizontal className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="leading-snug">{metrics.scopeLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5 KPI Cards Strip (2 cols on mobile with full-width 5th card, 5 cols on desktop) */}
          <div className="p-4 md:p-6 space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              {/* KPI 1: Total Sales */}
              <div className="bg-[#fffdf9] border border-amber-200/80 rounded-lg p-3.5 md:p-4 flex flex-col justify-between">
                <div className="text-xs font-bold text-[#78350f]">إجمالي المبيعات</div>
                <div className="mt-2 flex items-baseline gap-1 font-mono tabular-nums">
                  <span className="text-xl md:text-2xl font-extrabold text-slate-900">
                    {formatNumber(metrics.totalSales)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">dh</span>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-100 text-[11px] text-slate-500">
                  المبيعات المحققة الفعلية
                </div>
              </div>

              {/* KPI 2: Commission */}
              <div className="bg-[#fffdf9] border border-amber-200/80 rounded-lg p-3.5 md:p-4 flex flex-col justify-between">
                <div className="text-xs font-bold text-[#78350f]">العمولة</div>
                <div className="mt-2 flex items-baseline gap-1 font-mono tabular-nums">
                  <span className="text-xl md:text-2xl font-extrabold text-amber-700">
                    {formatNumber(metrics.totalCommission)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">dh</span>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-100 text-[11px] text-slate-500">
                  {selectedWeekObj
                    ? `عمولة الأسبوع (${formatNumber(selectedWeekObj.commissionRate)}%)`
                    : "إجمالي عمولات المبيعات"}
                </div>
              </div>

              {/* KPI 3: Net Payable */}
              <div className="bg-[#fffdf9] border border-amber-200/80 rounded-lg p-3.5 md:p-4 flex flex-col justify-between">
                <div className="text-xs font-bold text-[#78350f]">صافي المستحق للمورد</div>
                <div className="mt-2 flex items-baseline gap-1 font-mono tabular-nums">
                  <span className="text-xl md:text-2xl font-extrabold text-emerald-700">
                    {formatNumber(metrics.totalNetPayable)}
                  </span>
                  <span className="text-xs font-bold text-slate-500">dh</span>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-100 text-[11px] text-slate-500">
                  صافي مستحق بيت العسل
                </div>
              </div>

              {/* KPI 4: Sales in Units */}
              <div className="bg-[#fffdf9] border border-amber-200/80 rounded-lg p-3.5 md:p-4 flex flex-col justify-between">
                <div className="text-xs font-bold text-[#78350f]">المبيعات بالوحدات</div>
                <div className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
                  <span className="text-xl md:text-2xl font-extrabold text-emerald-700">
                    {formatNumber(metrics.soldUnits)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">وحدة</span>
                </div>
                <div className="mt-2 pt-2 border-t border-amber-100 text-[11px] font-semibold text-slate-700 font-mono tabular-nums">
                  Total {formatNumber(metrics.totalUnits)}{" "}
                  <span className="font-arabic font-normal text-slate-500">
                    ({formatNumber(metrics.remainingUnits)} متبقي)
                  </span>
                </div>
              </div>

              {/* KPI 5: Sales % by KG (spans 2 cols on mobile for breathing room) */}
              <div className="col-span-2 lg:col-span-1 bg-[#fffdf9] border border-amber-200/80 rounded-lg p-3.5 md:p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between lg:block">
                  <div className="text-xs font-bold text-[#78350f]">نسبة المبيعات (كجم)</div>
                  <div className="text-xl md:text-2xl font-extrabold text-amber-700 font-mono tabular-nums lg:mt-2">
                    {metrics.salesWeightPct.toFixed(1)}%
                  </div>
                </div>
                <div className="mt-2 w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, metrics.salesWeightPct))}%` }}
                  />
                </div>
                <div className="mt-2 pt-2 border-t border-amber-100 text-[11px] font-bold text-slate-700 font-mono tabular-nums" dir="ltr">
                  {formatKg(metrics.soldWeightKg)} KG from {formatKg(metrics.totalWeightKg)} KG Total
                </div>
              </div>
            </div>

            {selectedWeekId === "all" && metrics.latestWeekDate && (
              <p className="text-xs text-slate-500 leading-relaxed">
                قاعدة الاحتساب عند اختيار «الكل»: تُجمع المبيعات والعمولات عبر جميع الأسابيع، ويُؤخذ المتبقي بالوحدات والكجم من أحدث أسبوع مسجل فقط ({formatArabicShortDate(metrics.latestWeekDate)}).
              </p>
            )}

            {/* Detailed Filtered Section */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-[#5c2d0c]">
                  سجل الحركات المفصل حسب التصفية المحددة
                </h4>
                <span className="text-xs text-slate-500 font-mono tabular-nums">
                  {metrics.filteredRows.length} صف
                </span>
              </div>

              {/* MOBILE CARD LIST (No Horizontal Scroll!) */}
              <div className="md:hidden space-y-2.5">
                {metrics.filteredRows.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-sm border border-slate-200 rounded-lg">
                    لا توجد سجلات مطابقة للفلاتر الحالية.
                  </div>
                ) : (
                  <>
                    {metrics.filteredRows.map((row, idx) => (
                      <div
                        key={`m-${row.weekId}-${row.productId}`}
                        className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              <span className="font-mono text-xs text-slate-400 ml-1.5">{idx + 1}.</span>
                              {row.productName}
                            </div>
                            {selectedWeekId === "all" && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {formatArabicShortDate(row.weekDate)}
                              </div>
                            )}
                          </div>
                          <div className="text-left font-mono tabular-nums shrink-0" dir="ltr">
                            <div className="text-sm font-extrabold text-emerald-700">
                              {formatNumber(row.netPayable)} dh
                            </div>
                            <div className="text-[11px] text-slate-500">
                              مبيعات: {formatNumber(row.totalSales)} dh
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                          <div className="bg-slate-50 rounded-md py-1.5 px-2">
                            <div className="text-[10px] text-slate-500">جديد</div>
                            <div className="text-xs font-bold font-mono tabular-nums text-slate-800">
                              {formatNumber(row.newStock)}
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-md py-1.5 px-2">
                            <div className="text-[10px] text-slate-500">متبقي</div>
                            <div className="text-xs font-bold font-mono tabular-nums text-slate-800">
                              {formatNumber(row.remainingStock)}
                            </div>
                          </div>
                          <div className="bg-emerald-50/70 rounded-md py-1.5 px-2">
                            <div className="text-[10px] text-emerald-800">مباع</div>
                            <div className={`text-xs font-extrabold font-mono tabular-nums ${row.soldQty < 0 ? "text-rose-600" : "text-emerald-800"}`}>
                              {formatNumber(row.soldQty)}
                            </div>
                          </div>
                        </div>

                        {row.weekNotes && (
                          <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                            ملاحظات: {row.weekNotes}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Mobile Totals Summary Bar */}
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-extrabold text-[#5c2d0c]">
                          الإجمالي {selectedWeekId === "all" ? "(المتبقي من أحدث أسبوع)" : ""}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5 font-mono tabular-nums">
                          مباع: {formatNumber(metrics.soldUnits)} · متبقي: {formatNumber(metrics.remainingUnits)} · جديد: {formatNumber(metrics.totalNewStock)}
                        </div>
                      </div>
                      <div className="text-left font-mono tabular-nums" dir="ltr">
                        <div className="text-sm font-extrabold text-emerald-800">
                          {formatNumber(metrics.totalNetPayable)} dh
                        </div>
                        <div className="text-[11px] text-slate-600">
                          مبيعات: {formatNumber(metrics.totalSales)} dh
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#6b3410] text-white text-xs">
                      <th className="py-2.5 px-3 font-bold text-center w-10">م</th>
                      {selectedWeekId === "all" && (
                        <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap">الأسبوع</th>
                      )}
                      <th className="py-2.5 px-3 font-bold text-right">اسم المنتج</th>
                      <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap">كمية جديدة</th>
                      <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap">الكمية المتبقية</th>
                      <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap">الكمية المباعة</th>
                      <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap">إجمالي المبيعات</th>
                      <th className="py-2.5 px-3 font-bold text-center whitespace-nowrap">صافي المستحق</th>
                      <th className="py-2.5 px-3 font-bold text-right min-w-[180px]">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80">
                    {metrics.filteredRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={selectedWeekId === "all" ? 9 : 8}
                          className="py-10 text-center text-slate-500 text-sm"
                        >
                          لا توجد سجلات مطابقة للفلاتر الحالية.
                        </td>
                      </tr>
                    ) : (
                      metrics.filteredRows.map((row, idx) => (
                        <tr
                          key={`${row.weekId}-${row.productId}`}
                          className="hover:bg-amber-50/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-500 text-xs">
                            {idx + 1}
                          </td>
                          {selectedWeekId === "all" && (
                            <td className="py-2.5 px-3 text-center text-xs font-semibold text-slate-700 whitespace-nowrap">
                              {formatArabicShortDate(row.weekDate)}
                            </td>
                          )}
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                            {row.productName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono tabular-nums font-semibold text-slate-800">
                            {formatNumber(row.newStock)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono tabular-nums font-semibold text-slate-800">
                            {formatNumber(row.remainingStock)}
                          </td>
                          <td
                            className={`py-2.5 px-3 text-center font-mono tabular-nums font-bold ${
                              row.soldQty < 0
                                ? "text-rose-600"
                                : row.soldQty > 0
                                ? "text-emerald-700"
                                : "text-slate-500"
                            }`}
                          >
                            {formatNumber(row.soldQty)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono tabular-nums font-bold text-slate-900 whitespace-nowrap" dir="ltr">
                            {formatNumber(row.totalSales)} dh
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono tabular-nums font-bold text-emerald-700 whitespace-nowrap" dir="ltr">
                            {formatNumber(row.netPayable)} dh
                          </td>
                          <td className="py-2.5 px-3 text-right text-xs text-slate-600 leading-relaxed">
                            {row.weekNotes || <span className="text-slate-300">—</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {metrics.filteredRows.length > 0 && (
                    <tfoot>
                      <tr className="bg-amber-50/90 border-t-2 border-[#6b3410]/40 font-bold text-slate-900">
                        <td
                          colSpan={selectedWeekId === "all" ? 3 : 2}
                          className="py-3 px-3 text-right text-xs font-extrabold text-[#5c2d0c]"
                        >
                          الإجمالي {selectedWeekId === "all" ? "(المتبقي من أحدث أسبوع)" : ""}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums">
                          {formatNumber(metrics.totalNewStock)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums">
                          {formatNumber(metrics.remainingUnits)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-800">
                          {formatNumber(metrics.soldUnits)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums whitespace-nowrap" dir="ltr">
                          {formatNumber(metrics.totalSales)} dh
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-800 whitespace-nowrap" dir="ltr">
                          {formatNumber(metrics.totalNetPayable)} dh
                        </td>
                        <td className="py-3 px-3 text-right text-[11px] font-medium text-slate-500">
                          العمولة: {formatNumber(metrics.totalCommission)} dh
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          SECTION 2: سجل الجرد الأسبوعي (NEWEST FIRST + MOBILE CARDS / FULL TABLE)
         ==================================================================== */}
      {(viewMode === "both" || viewMode === "log") && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-[#5c2d0c] text-white px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base md:text-lg font-bold">
                سجل الجرد والمبيعات والتسليم الأسبوعي — بيت العسل
              </h3>
              <p className="text-xs text-amber-100/90 mt-0.5">
                مرتب من أحدث أسبوع إلى الأقدم · اضغط على أي أسبوع لعرض تفاصيله أو تعديل جرده
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Cards vs Full Spreadsheet Table */}
              <div className="inline-flex items-center p-0.5 bg-white/10 rounded-lg border border-white/15">
                <button
                  type="button"
                  onClick={() => setLogDisplayMode("cards")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md text-xs font-bold transition cursor-pointer ${
                    logDisplayMode === "cards"
                      ? "bg-white text-[#5c2d0c]"
                      : "text-amber-100 hover:text-white"
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>بطاقات الأسابيع</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogDisplayMode("table")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-md text-xs font-bold transition cursor-pointer ${
                    logDisplayMode === "table"
                      ? "bg-white text-[#5c2d0c]"
                      : "text-amber-100 hover:text-white"
                  }`}
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>الجدول الشامل</span>
                </button>
              </div>

              {logDisplayMode === "cards" && weeksNewestFirst.length > 1 && (
                <button
                  type="button"
                  onClick={toggleExpandAll}
                  className="px-3 py-1.5 min-h-[36px] rounded-lg border border-white/25 text-amber-50 hover:bg-white/10 text-xs font-semibold transition cursor-pointer"
                >
                  {allExpanded ? "طي الأقدم" : "فتح كل الأسابيع"}
                </button>
              )}
            </div>
          </div>

          {weeksNewestFirst.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Calendar className="w-10 h-10 text-amber-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">لا توجد سجلات جرد أسبوعية بعد</h4>
              <p className="text-sm text-slate-500">
                ابدأ بتسجيل أول أسبوع (يوم الأحد) لحساب المبيعات والعمولات وصافي المستحق تلقائياً.
              </p>
              <button
                type="button"
                onClick={openNewWeekModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول سجل أسبوعي</span>
              </button>
            </div>
          ) : logDisplayMode === "cards" ? (
            /* ----------------------------------------------------------------
               EXPANDABLE WEEK ACCORDION CARDS (NEWEST FIRST — GREAT ON MOBILE!)
               ---------------------------------------------------------------- */
            <div className="p-4 md:p-6 space-y-4">
              {weeksNewestFirst.map((week, wIdx) => {
                const isExpanded = expandedWeekIds.includes(week.id);
                const isLatest = wIdx === 0;
                const soldItemsCount = week.items.filter(it => it.soldQty > 0).length;

                return (
                  <div
                    key={week.id}
                    className={`border rounded-xl overflow-hidden transition-colors ${
                      isLatest ? "border-amber-300 bg-[#fffdf9]" : "border-slate-200 bg-white"
                    }`}
                  >
                    {/* Accordion Summary Header (Tap anywhere to expand/collapse) */}
                    <div className="px-4 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleWeekExpand(week.id)}
                        className="flex-1 flex items-center justify-between gap-3 text-right cursor-pointer min-h-[44px]"
                      >
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-sm md:text-base font-extrabold text-[#5c2d0c]">
                              {formatArabicWeekDate(week.weekDate)}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs font-bold text-amber-800">
                              عمولة {formatNumber(week.commissionRate)}%
                            </span>
                            {isLatest && (
                              <>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs font-bold text-emerald-700">أحدث جرد</span>
                              </>
                            )}
                            {week.isFirstWeek && (
                              <>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs font-semibold text-slate-500">السجل الأول</span>
                              </>
                            )}
                          </div>

                          {/* Instant 1-glance week metrics */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-0.5 font-mono tabular-nums">
                            <span>
                              المبيعات:{" "}
                              <strong className="text-slate-900">{formatNumber(week.totals.totalSales)} dh</strong>
                            </span>
                            <span className="text-slate-300">|</span>
                            <span>
                              المستحق:{" "}
                              <strong className="text-emerald-700">{formatNumber(week.totals.netPayable)} dh</strong>
                            </span>
                            <span className="text-slate-300">|</span>
                            <span className="font-arabic">
                              مباع <strong className="font-mono text-slate-900">{formatNumber(week.totals.soldQty)}</strong>
                              {" · "}
                              متبقي <strong className="font-mono text-slate-900">{formatNumber(week.totals.remainingStock)}</strong>
                              {week.totals.newStock > 0 && (
                                <>
                                  {" · "}
                                  جديد <strong className="font-mono text-amber-800">+{formatNumber(week.totals.newStock)}</strong>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        <span className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 shrink-0">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </span>
                      </button>

                      {/* Action Buttons for this week */}
                      <div className="flex items-center gap-2 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-100 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditWeekModal(week)}
                          className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل الجرد</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWeekId(String(week.id));
                            setViewMode("both");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 min-h-[40px] rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                          title="عرض هذا الأسبوع في لوحة المؤشرات"
                        >
                          <Filter className="w-3.5 h-3.5 text-amber-700" />
                          <span className="hidden sm:inline">في المؤشرات</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteWeekTarget(week)}
                          className="inline-flex items-center justify-center p-2 min-h-[40px] min-w-[40px] rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition cursor-pointer"
                          title="حذف هذا الأسبوع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Week Details */}
                    {isExpanded && (
                      <div className="border-t border-slate-200/90 bg-white">
                        {week.notes && (
                          <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-200/60 text-xs text-[#5c2d0c] leading-relaxed">
                            <span className="font-bold">ملاحظات الأسبوع: </span>
                            {week.notes}
                          </div>
                        )}

                        {/* MOBILE PRODUCT CARDS INSIDE WEEK */}
                        <div className="md:hidden divide-y divide-slate-100">
                          {week.items.map(item => (
                            <div key={item.productId} className="p-3.5 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-sm font-bold text-slate-900">
                                    <span className="font-mono text-xs text-slate-400 ml-1">{item.index}.</span>
                                    {item.productName}
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                                    السعر: {formatNumber(item.unitPrice)} dh · بعد العمولة: {formatFixed2(item.priceAfterCommission)} dh
                                  </div>
                                </div>
                                <div className="text-left font-mono tabular-nums shrink-0" dir="ltr">
                                  <div className="text-sm font-extrabold text-emerald-700">
                                    {formatNumber(item.netPayable)} dh
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    مبيعات: {formatNumber(item.totalSales)} · عمولة: {formatNumber(item.commissionAmount)}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-1.5 text-center">
                                <div className="bg-slate-50 rounded py-1 px-1.5">
                                  <div className="text-[10px] text-slate-500">سابق</div>
                                  <div className="text-xs font-bold font-mono tabular-nums text-slate-800">
                                    {formatNumber(item.effectivePreviousBalance)}
                                    {!week.isFirstWeek && item.isPrevManual && (
                                      <span className="block text-[9px] font-arabic text-amber-700">يدوي</span>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-slate-50 rounded py-1 px-1.5">
                                  <div className="text-[10px] text-slate-500">جديد</div>
                                  <div className="text-xs font-bold font-mono tabular-nums text-amber-800">
                                    {formatNumber(item.newStock)}
                                  </div>
                                </div>
                                <div className="bg-slate-50 rounded py-1 px-1.5">
                                  <div className="text-[10px] text-slate-500">متبقي</div>
                                  <div className="text-xs font-bold font-mono tabular-nums text-slate-900">
                                    {formatNumber(item.remainingStock)}
                                  </div>
                                </div>
                                <div className="bg-emerald-50/70 rounded py-1 px-1.5">
                                  <div className="text-[10px] text-emerald-800">مباع</div>
                                  <div
                                    className={`text-xs font-extrabold font-mono tabular-nums ${
                                      item.soldQty < 0
                                        ? "text-rose-600"
                                        : item.soldQty > 0
                                        ? "text-emerald-800"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {formatNumber(item.soldQty)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* DESKTOP COMPACT TABLE INSIDE WEEK */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-xs md:text-sm border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 text-xs border-b border-slate-200">
                                <th className="py-2.5 px-2.5 text-center w-9">م</th>
                                <th className="py-2.5 px-3 text-right">اسم المنتج</th>
                                <th className="py-2.5 px-2 text-center">السعر</th>
                                <th className="py-2.5 px-2 text-center">رصيد سابق</th>
                                <th className="py-2.5 px-2 text-center">كمية جديدة</th>
                                <th className="py-2.5 px-2 text-center">الكمية الحالي</th>
                                <th className="py-2.5 px-2 text-center bg-slate-100/80">الكمية المباعة</th>
                                <th className="py-2.5 px-2.5 text-center bg-slate-100/80">إجمالي المبيعات</th>
                                <th className="py-2.5 px-2 text-center bg-slate-100/80">السعر بعد العمولة</th>
                                <th className="py-2.5 px-2 text-center bg-slate-100/80">العمولة</th>
                                <th className="py-2.5 px-2.5 text-center bg-slate-100/80">صافي المستحق</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {week.items.map(item => (
                                <tr key={item.productId} className="hover:bg-amber-50/30">
                                  <td className="py-2 px-2.5 text-center font-mono tabular-nums text-slate-400">
                                    {item.index}
                                  </td>
                                  <td className="py-2 px-3 text-right font-semibold text-slate-900">
                                    {item.productName}
                                  </td>
                                  <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-700">
                                    {formatNumber(item.unitPrice)}
                                  </td>
                                  <td className="py-2 px-2 text-center font-mono tabular-nums font-bold text-slate-900">
                                    <span>{formatNumber(item.effectivePreviousBalance)}</span>
                                    {!week.isFirstWeek && item.isPrevManual && (
                                      <span
                                        className="block text-[9px] font-arabic font-semibold text-amber-700 leading-none"
                                        title={`تعديل يدوي (التلقائي كان ${formatNumber(item.autoPreviousBalance)})`}
                                      >
                                        يدوي
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2 px-2 text-center font-mono tabular-nums font-semibold text-amber-800">
                                    {item.newStock > 0 ? formatNumber(item.newStock) : <span className="text-slate-300">0</span>}
                                  </td>
                                  <td className="py-2 px-2 text-center font-mono tabular-nums font-bold text-slate-900">
                                    {formatNumber(item.remainingStock)}
                                  </td>
                                  <td
                                    className={`py-2 px-2 text-center font-mono tabular-nums font-bold bg-slate-50/90 ${
                                      item.soldQty < 0
                                        ? "text-rose-600"
                                        : item.soldQty > 0
                                        ? "text-emerald-700"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {formatNumber(item.soldQty)}
                                  </td>
                                  <td className="py-2 px-2.5 text-center font-mono tabular-nums font-bold text-slate-900 bg-slate-50/90">
                                    {formatNumber(item.totalSales)}
                                  </td>
                                  <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-600 bg-slate-50/90">
                                    {formatFixed2(item.priceAfterCommission)}
                                  </td>
                                  <td className="py-2 px-2 text-center font-mono tabular-nums font-semibold text-amber-800 bg-slate-50/90">
                                    {formatNumber(item.commissionAmount)}
                                  </td>
                                  <td className="py-2 px-2.5 text-center font-mono tabular-nums font-extrabold text-emerald-700 bg-slate-50/90">
                                    {formatNumber(item.netPayable)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="bg-amber-50/70 border-t border-amber-200 font-bold text-slate-900 text-xs">
                                <td colSpan={4} className="py-2.5 px-3 text-right text-[#5c2d0c]">
                                  إجمالي الأسبوع ({soldItemsCount} أصناف مباعة · {formatKg(week.totals.soldWeightKg)} كجم مباع · {formatKg(week.totals.remainingWeightKg)} كجم متبقي)
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono tabular-nums">
                                  {formatNumber(week.totals.newStock)}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono tabular-nums">
                                  {formatNumber(week.totals.remainingStock)}
                                </td>
                                <td className="py-2.5 px-2 text-center font-mono tabular-nums text-emerald-800">
                                  {formatNumber(week.totals.soldQty)}
                                </td>
                                <td className="py-2.5 px-2.5 text-center font-mono tabular-nums" dir="ltr">
                                  {formatNumber(week.totals.totalSales)} dh
                                </td>
                                <td className="py-2.5 px-2 text-center text-slate-400">—</td>
                                <td className="py-2.5 px-2 text-center font-mono tabular-nums text-amber-800" dir="ltr">
                                  {formatNumber(week.totals.commissionAmount)} dh
                                </td>
                                <td className="py-2.5 px-2.5 text-center font-mono tabular-nums text-emerald-800" dir="ltr">
                                  {formatNumber(week.totals.netPayable)} dh
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* GRAND TOTAL SUMMARY FOOTER (الإجمالي العام) */}
              <div className="bg-amber-100/80 border border-amber-300 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-[#5c2d0c]">
                    الإجمالي العام ({weeksNewestFirst.length} أسابيع مسجلة)
                  </div>
                  <div className="text-xs text-amber-950/80 mt-0.5">
                    إجمالي الجديد: <strong className="font-mono">{formatNumber(grandTotals.newStock)}</strong> · إجمالي المباع:{" "}
                    <strong className="font-mono">{formatNumber(grandTotals.soldQty)}</strong> ({formatKg(grandTotals.soldWeightKg)} كجم) · المتبقي الحالي (أحدث أسبوع):{" "}
                    <strong className="font-mono">{formatNumber(grandTotals.latestRemainingStock)}</strong> ({formatKg(grandTotals.latestRemainingWeightKg)} كجم)
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
                  <div>
                    <div className="text-[10px] font-arabic font-bold text-[#78350f]">إجمالي المبيعات</div>
                    <div className="text-base font-extrabold text-slate-900" dir="ltr">
                      {formatNumber(grandTotals.totalSales)} dh
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-arabic font-bold text-[#78350f]">إجمالي العمولة</div>
                    <div className="text-base font-extrabold text-amber-900" dir="ltr">
                      {formatNumber(grandTotals.commissionAmount)} dh
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-arabic font-bold text-[#78350f]">صافي المستحق</div>
                    <div className="text-base font-extrabold text-emerald-800" dir="ltr">
                      {formatNumber(grandTotals.netPayable)} dh
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ----------------------------------------------------------------
               CLASSIC FULL 14-COLUMN SPREADSHEET LEDGER (NEWEST WEEK FIRST!)
               ---------------------------------------------------------------- */
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="bg-[#6b3410] text-white text-xs border-b-2 border-slate-900">
                    <th className="py-3 px-2.5 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      تاريخ الأحد
                    </th>
                    <th className="py-3 px-2 font-bold text-center w-8 border-l border-amber-900/40">م</th>
                    <th className="py-3 px-3 font-bold text-right min-w-[175px] border-l border-amber-900/40">
                      اسم المنتج
                    </th>
                    <th className="py-3 px-2 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      السعر
                    </th>
                    <th className="py-3 px-2 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      رصيد سابق
                    </th>
                    <th className="py-3 px-2 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      كمية جديدة
                    </th>
                    <th className="py-3 px-2 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      الكمية الحالي
                    </th>
                    <th className="py-3 px-2 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      الكمية المباعة
                    </th>
                    <th className="py-3 px-2.5 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      إجمالي المبيعات
                    </th>
                    <th className="py-3 px-2 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      نسبة العمولة
                    </th>
                    <th className="py-3 px-2 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      السعر بعد العمولة
                    </th>
                    <th className="py-3 px-2 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      العمولة
                    </th>
                    <th className="py-3 px-2.5 font-bold text-center whitespace-nowrap border-l border-amber-900/40">
                      صافي المستحق
                    </th>
                    <th className="py-3 px-3 font-bold text-right min-w-[170px]">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {weeksNewestFirst.map(week => {
                    const rowSpan = week.items.length;
                    return (
                      <React.Fragment key={week.id}>
                        {week.items.map((item, idx) => {
                          const isLastRow = idx === rowSpan - 1;
                          const rowBorderClass = isLastRow
                            ? "border-b-2 border-slate-800"
                            : "border-b border-slate-200/90";

                          return (
                            <tr
                              key={`${week.id}-${item.productId}`}
                              className={`${rowBorderClass} hover:bg-amber-50/35 transition-colors`}
                            >
                              {idx === 0 && (
                                <td
                                  rowSpan={rowSpan}
                                  className="py-3 px-2.5 text-center align-middle bg-white border-l border-slate-200 border-b-2 border-b-slate-800"
                                >
                                  <div className="flex flex-col items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedWeekId(String(week.id))}
                                      title="تصفية لوحة المؤشرات على هذا الأسبوع"
                                      className="font-bold text-slate-900 hover:text-amber-700 transition cursor-pointer whitespace-nowrap text-xs"
                                    >
                                      {formatArabicShortDate(week.weekDate)}
                                    </button>
                                    {week.isFirstWeek && (
                                      <span className="text-[10px] font-semibold text-slate-500">
                                        السجل الأول
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => openEditWeekModal(week)}
                                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 transition cursor-pointer"
                                        title="تعديل هذا الأسبوع"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteWeekTarget(week)}
                                        className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition cursor-pointer"
                                        title="حذف هذا الأسبوع"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              )}

                              <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-500 border-l border-slate-200/80">
                                {item.index}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold text-slate-900 border-l border-slate-200/80">
                                {item.productName}
                              </td>
                              <td className="py-2 px-2 text-center font-mono tabular-nums font-bold text-slate-800 border-l border-slate-200/80">
                                {formatNumber(item.unitPrice)}
                              </td>
                              <td className="py-2 px-2 text-center font-mono tabular-nums font-bold text-slate-900 border-l border-slate-200/80">
                                <div className="inline-flex flex-col items-center">
                                  <span>{formatNumber(item.effectivePreviousBalance)}</span>
                                  {!week.isFirstWeek && item.isPrevManual && (
                                    <span
                                      className="text-[9px] font-arabic font-semibold text-amber-700 leading-none"
                                      title={`تعديل يدوي (التلقائي كان ${formatNumber(item.autoPreviousBalance)})`}
                                    >
                                      يدوي
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-center font-mono tabular-nums font-semibold text-slate-800 border-l border-slate-200/80">
                                {item.newStock > 0 ? formatNumber(item.newStock) : <span className="text-slate-400">0</span>}
                              </td>
                              <td className="py-2 px-2 text-center font-mono tabular-nums font-bold text-slate-900 border-l border-slate-200/80">
                                {formatNumber(item.remainingStock)}
                              </td>
                              <td
                                className={`py-2 px-2 text-center font-mono tabular-nums font-bold bg-slate-100/80 border-l border-slate-200 ${
                                  item.soldQty < 0
                                    ? "text-rose-600"
                                    : item.soldQty > 0
                                    ? "text-emerald-800"
                                    : "text-slate-500"
                                }`}
                              >
                                {formatNumber(item.soldQty)}
                              </td>
                              <td className="py-2 px-2.5 text-center font-mono tabular-nums font-bold text-slate-900 bg-slate-100/80 border-l border-slate-200">
                                {formatNumber(item.totalSales)}
                              </td>

                              {idx === 0 && (
                                <td
                                  rowSpan={rowSpan}
                                  className="py-2 px-2 text-center align-middle font-mono tabular-nums font-extrabold text-slate-800 bg-slate-100/80 border-l border-slate-200 border-b-2 border-b-slate-800"
                                >
                                  {formatNumber(week.commissionRate)}%
                                </td>
                              )}

                              <td className="py-2 px-2 text-center font-mono tabular-nums font-semibold text-slate-700 bg-slate-100/80 border-l border-slate-200">
                                {formatFixed2(item.priceAfterCommission)}
                              </td>
                              <td className="py-2 px-2 text-center font-mono tabular-nums font-bold text-amber-800 bg-slate-100/80 border-l border-slate-200">
                                {formatNumber(item.commissionAmount)}
                              </td>
                              <td className="py-2 px-2.5 text-center font-mono tabular-nums font-extrabold text-emerald-800 bg-slate-100/80 border-l border-slate-200">
                                {formatNumber(item.netPayable)}
                              </td>

                              {idx === 0 && (
                                <td
                                  rowSpan={rowSpan}
                                  className="py-3 px-3 text-right align-middle text-xs font-medium text-slate-800 bg-white leading-relaxed border-b-2 border-b-slate-800"
                                >
                                  {week.notes || <span className="text-slate-300">—</span>}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="bg-amber-100/90 text-slate-900 font-extrabold border-t-2 border-[#5c2d0c]">
                    <td colSpan={4} className="py-3.5 px-3 text-right text-sm text-[#5c2d0c] border-l border-amber-300/70">
                      الإجمالي العام ({weeksNewestFirst.length} أسابيع)
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono tabular-nums text-slate-400 border-l border-amber-300/70">
                      —
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono tabular-nums border-l border-amber-300/70">
                      {formatNumber(grandTotals.newStock)}
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono tabular-nums border-l border-amber-300/70">
                      <div>{formatNumber(grandTotals.latestRemainingStock)}</div>
                      <div className="text-[9px] font-arabic font-semibold text-amber-900">أحدث أسبوع</div>
                    </td>
                    <td className="py-3.5 px-2 text-center font-mono tabular-nums text-emerald-900 border-l border-amber-300/70">
                      {formatNumber(grandTotals.soldQty)}
                    </td>
                    <td className="py-3.5 px-2.5 text-center font-mono tabular-nums whitespace-nowrap border-l border-amber-300/70" dir="ltr">
                      {formatNumber(grandTotals.totalSales)} dh
                    </td>
                    <td className="py-3.5 px-2 text-center text-slate-500 border-l border-amber-300/70">—</td>
                    <td className="py-3.5 px-2 text-center text-slate-500 border-l border-amber-300/70">—</td>
                    <td className="py-3.5 px-2 text-center font-mono tabular-nums text-amber-900 whitespace-nowrap border-l border-amber-300/70" dir="ltr">
                      {formatNumber(grandTotals.commissionAmount)} dh
                    </td>
                    <td className="py-3.5 px-2.5 text-center font-mono tabular-nums text-emerald-900 whitespace-nowrap border-l border-amber-300/70" dir="ltr">
                      {formatNumber(grandTotals.netPayable)} dh
                    </td>
                    <td className="py-3.5 px-3 text-right text-[11px] font-semibold text-amber-950">
                      المباع: {formatKg(grandTotals.soldWeightKg)} كجم · المتبقي: {formatKg(grandTotals.latestRemainingWeightKg)} كجم
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ====================================================================
          SECTION 3: إدارة المنتجات الأساسية (PRODUCTS CATALOG MANAGER)
         ==================================================================== */}
      {viewMode === "products" && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-[#5c2d0c] text-white px-4 md:px-6 py-4">
            <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-300" />
              <span>البيانات الأساسية — قائمة المنتجات وأسعارها وأوزانها</span>
            </h3>
            <p className="text-xs text-amber-100/90 mt-0.5">
              يمكنك تعديل الأسعار والأوزان أو إضافة منتجات جديدة ليتم إدراجها تلقائياً في الأسابيع القادمة.
            </p>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            <form
              onSubmit={handleCreateProduct}
              className="bg-[#fffaf3] border border-amber-200/80 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
            >
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-[#78350f] mb-1">اسم المنتج الجديد</label>
                <input
                  type="text"
                  required
                  value={newProductForm.name}
                  onChange={e => setNewProductForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="مثال: نصف كجم عسل سدر جبلي"
                  className="w-full min-h-[44px] bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
              <div className="grid grid-cols-2 md:contents gap-3">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-[#78350f] mb-1">السعر (dh)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    required
                    value={newProductForm.price}
                    onChange={e => setNewProductForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full min-h-[44px] bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#78350f] mb-1">الوزن (كجم)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.05"
                    min="0.05"
                    required
                    value={newProductForm.weightKg}
                    onChange={e => setNewProductForm(p => ({ ...p, weightKg: parseFloat(e.target.value) || 0 }))}
                    className="w-full min-h-[44px] bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-bold transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة</span>
                </button>
              </div>
            </form>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-10">م</th>
                    <th className="py-2.5 px-3 text-right">اسم المنتج</th>
                    <th className="py-2.5 px-3 text-center">السعر (dh)</th>
                    <th className="py-2.5 px-3 text-center">الوزن (كجم)</th>
                    <th className="py-2.5 px-3 text-center w-40">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {products.map((p, idx) => {
                    const isEditing = editingProductId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={editProductForm.name}
                                onChange={e => setEditProductForm(f => ({ ...f, name: e.target.value }))}
                                className="w-full border border-amber-400 rounded-md px-2.5 py-2 text-sm font-semibold"
                              />
                              <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editProductForm.syncExistingWeeks}
                                  onChange={e =>
                                    setEditProductForm(f => ({ ...f, syncExistingWeeks: e.target.checked }))
                                  }
                                />
                                <span>تحديث السعر والوزن في السجلات السابقة أيضاً</span>
                              </label>
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-900">{p.name}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min="0"
                              value={editProductForm.price}
                              onChange={e =>
                                setEditProductForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))
                              }
                              className="w-24 text-center border border-amber-400 rounded-md px-2 py-1.5 text-sm font-mono"
                            />
                          ) : (
                            <span className="font-bold text-slate-900">{formatNumber(p.price)} dh</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums">
                          {isEditing ? (
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.05"
                              min="0.05"
                              value={editProductForm.weightKg}
                              onChange={e =>
                                setEditProductForm(f => ({ ...f, weightKg: parseFloat(e.target.value) || 0 }))
                              }
                              className="w-24 text-center border border-amber-400 rounded-md px-2 py-1.5 text-sm font-mono"
                            />
                          ) : (
                            <span className="font-semibold text-slate-700">{formatKg(p.weightKg)} كجم</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleSaveEditProduct(p.id)}
                                className="inline-flex items-center gap-1 px-3 py-2 min-h-[38px] rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>حفظ</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingProductId(null)}
                                className="px-2.5 py-2 min-h-[38px] rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEditProduct(p)}
                                className="inline-flex items-center gap-1 px-3 py-2 min-h-[38px] rounded-md border border-slate-200 text-slate-700 hover:bg-amber-50 hover:border-amber-300 text-xs font-semibold cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteProductTarget(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-2 min-h-[38px] rounded-md border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-xs font-semibold cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          MODAL / MOBILE BOTTOM-SHEET: FAST SUNDAY INVENTORY COUNTING
         ==================================================================== */}
      {weekDraft && draftSummary && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-end md:items-center justify-center md:p-4"
          onClick={() => !saving && setWeekDraft(null)}
        >
          <div
            dir="rtl"
            className="font-arabic bg-white rounded-t-2xl md:rounded-xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Mobile Sheet Handle */}
            <div className="md:hidden pt-2.5 pb-1 bg-[#5c2d0c] flex justify-center">
              <div className="w-10 h-1 rounded-full bg-amber-200/40" />
            </div>

            {/* Modal Header */}
            <div className="bg-[#5c2d0c] text-white px-4 md:px-6 py-3.5 md:py-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base md:text-lg font-bold">
                  {weekDraft.id
                    ? `تعديل جرد ${formatArabicShortDate(weekDraft.weekDate)}`
                    : "تسجيل جرد أسبوعي جديد (الأحد)"}
                </h3>
                <p className="text-[11px] md:text-xs text-amber-100/90 mt-0.5">
                  {weekDraft.isFirstWeek
                    ? "السجل الأول: المباع = الرصيد السابق + الكمية الجديدة − المتبقي"
                    : "الرصيد السابق محسوب تلقائياً · أدخل الكمية المتبقية (والكمية الجديدة إن وجدت)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setWeekDraft(null)}
                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-amber-100 hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form
              id="weekly-draft-form"
              onSubmit={handleSaveWeekDraft}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5"
            >
              {/* Week Date, Commission, Notes */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-[#fffaf3] border border-amber-200/80 rounded-xl p-4">
                <div className="grid grid-cols-2 md:contents gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-[#78350f] mb-1">
                      تاريخ الأحد *
                    </label>
                    <input
                      type="date"
                      required
                      value={weekDraft.weekDate}
                      onChange={e =>
                        setWeekDraft(prev => (prev ? { ...prev, weekDate: e.target.value } : null))
                      }
                      className="w-full min-h-[44px] bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                    {weekDraft.weekDate && !isSundayDate(weekDraft.weekDate) && (
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-amber-800">
                        <span>ليس يوم أحد</span>
                        <button
                          type="button"
                          onClick={() =>
                            setWeekDraft(prev =>
                              prev ? { ...prev, weekDate: snapToSunday(prev.weekDate) } : null
                            )
                          }
                          className="underline font-bold hover:text-amber-950 cursor-pointer"
                        >
                          ضبط للأحد
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-[#78350f] mb-1">
                      نسبة العمولة (%) *
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={weekDraft.commissionRate}
                      onChange={e =>
                        setWeekDraft(prev =>
                          prev ? { ...prev, commissionRate: parseFloat(e.target.value) || 0 } : null
                        )
                      }
                      className="w-full min-h-[44px] bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-[#78350f] mb-1">
                    ملاحظات الأسبوع (اختياري)
                  </label>
                  <input
                    type="text"
                    value={weekDraft.notes}
                    onChange={e =>
                      setWeekDraft(prev => (prev ? { ...prev, notes: e.target.value } : null))
                    }
                    placeholder="مثال: فتح ربع عينات، تسليم أصناف إضافية..."
                    className="w-full min-h-[44px] bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              {/* ============================================================
                  MOBILE TOUCH-FIRST STEPPER COUNTING CARDS (md:hidden)
                 ============================================================ */}
              <div className="md:hidden space-y-3">
                {draftSummary.rows.map((row, idx) => {
                  const prevUnlocked = unlockedPrevIds.includes(row.productId);
                  return (
                    <div
                      key={row.productId}
                      className="border border-slate-200 rounded-xl p-3.5 bg-white space-y-3"
                    >
                      {/* Product Title & Auto Previous Balance */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-extrabold text-slate-900">
                            <span className="font-mono text-xs text-slate-400 ml-1">{idx + 1}.</span>
                            {row.productName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                            السعر: {formatNumber(row.unitPrice)} dh · بعد العمولة: {formatFixed2(row.priceAfterComm)} dh
                          </div>
                        </div>

                        {/* Previous Balance Badge / Unlock */}
                        <div className="text-left shrink-0">
                          <div className="text-[11px] text-slate-500">
                            رصيد سابق:{" "}
                            <strong className="font-mono text-slate-900 text-sm">
                              {formatNumber(row.previousBalance)}
                            </strong>
                          </div>
                          {!weekDraft.isFirstWeek && !prevUnlocked && (
                            <button
                              type="button"
                              onClick={() => setUnlockedPrevIds(prev => [...prev, row.productId])}
                              className="text-[11px] font-bold text-amber-700 underline cursor-pointer mt-0.5"
                            >
                              تعديل يدوي
                            </button>
                          )}
                          {!weekDraft.isFirstWeek && row.isPrevManual && (
                            <button
                              type="button"
                              onClick={() => resetDraftItemAutoPrev(row.productId)}
                              className="text-[11px] font-bold text-amber-800 inline-flex items-center gap-0.5 cursor-pointer mt-0.5"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>تلقائي ({formatNumber(row.autoPreviousBalance)})</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Optional Manual Previous Balance Stepper when unlocked or first week */}
                      {(weekDraft.isFirstWeek || prevUnlocked) && (
                        <div className="bg-amber-50/60 border border-amber-200/80 rounded-lg p-2.5 flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#78350f]">الرصيد السابق</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => stepDraftItem(row.productId, "previousBalance", -1)}
                              className="w-10 h-10 rounded-lg bg-white border border-amber-300 flex items-center justify-center text-slate-800 active:scale-95 cursor-pointer"
                              aria-label="تقليل الرصيد السابق"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min="0"
                              value={row.previousBalance}
                              onChange={e =>
                                updateDraftItem(row.productId, "previousBalance", e.target.value)
                              }
                              className="w-16 h-10 text-center bg-white border border-amber-300 rounded-lg font-mono tabular-nums font-bold text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => stepDraftItem(row.productId, "previousBalance", 1)}
                              className="w-10 h-10 rounded-lg bg-white border border-amber-300 flex items-center justify-center text-slate-800 active:scale-95 cursor-pointer"
                              aria-label="زيادة الرصيد السابق"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Main 2 Sunday Inputs: Remaining Stock & New Stock with 44px +/- buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Primary Field: Remaining Stock (Current Count) */}
                        <div className="bg-[#fffaf3] border border-amber-300 rounded-lg p-2.5 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-extrabold text-[#5c2d0c]">المتبقي الحالي</div>
                            <div className="text-[10px] text-amber-800">عدّ الموجود الآن</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => stepDraftItem(row.productId, "remainingStock", -1)}
                              className="w-11 h-11 rounded-lg bg-white border border-amber-300 flex items-center justify-center text-slate-900 active:scale-95 cursor-pointer"
                              aria-label="تقليل المتبقي"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min="0"
                              value={row.remainingStock}
                              onChange={e =>
                                updateDraftItem(row.productId, "remainingStock", e.target.value)
                              }
                              className="w-16 h-11 text-center bg-white border border-amber-400 rounded-lg font-mono tabular-nums font-extrabold text-base text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => stepDraftItem(row.productId, "remainingStock", 1)}
                              className="w-11 h-11 rounded-lg bg-white border border-amber-300 flex items-center justify-center text-slate-900 active:scale-95 cursor-pointer"
                              aria-label="زيادة المتبقي"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Secondary Field: New Stock Delivered */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-800">كمية جديدة</div>
                            <div className="text-[10px] text-slate-500">بضاعة مضافة</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => stepDraftItem(row.productId, "newStock", -1)}
                              className="w-11 h-11 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-800 active:scale-95 cursor-pointer"
                              aria-label="تقليل الجديد"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min="0"
                              value={row.newStock}
                              onChange={e =>
                                updateDraftItem(row.productId, "newStock", e.target.value)
                              }
                              className="w-16 h-11 text-center bg-white border border-slate-300 rounded-lg font-mono tabular-nums font-bold text-base text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => stepDraftItem(row.productId, "newStock", 1)}
                              className="w-11 h-11 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-800 active:scale-95 cursor-pointer"
                              aria-label="زيادة الجديد"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Instant Live Product Calculation Result */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">المباع:</span>
                          <span
                            className={`font-mono tabular-nums font-extrabold text-sm ${
                              row.soldQty < 0
                                ? "text-rose-600"
                                : row.soldQty > 0
                                ? "text-emerald-700"
                                : "text-slate-400"
                            }`}
                          >
                            {formatNumber(row.soldQty)}
                          </span>
                          {row.soldQty < 0 && (
                            <span className="text-[11px] text-rose-600 font-semibold">
                              (المتبقي أكبر من السابق!)
                            </span>
                          )}
                        </div>
                        <div className="font-mono tabular-nums flex items-center gap-2.5" dir="ltr">
                          <span className="text-slate-600">{formatNumber(row.totalSales)} dh</span>
                          <span className="font-extrabold text-emerald-700">
                            صافي {formatNumber(row.netPayable)} dh
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ============================================================
                  DESKTOP FAST TABULAR ENTRY GRID (hidden md:block)
                 ============================================================ */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs border-b border-slate-200">
                      <th className="py-2.5 px-2 text-center w-8">م</th>
                      <th className="py-2.5 px-3 text-right min-w-[165px]">اسم المنتج</th>
                      <th className="py-2.5 px-2 text-center w-20">السعر</th>
                      <th className="py-2.5 px-2 text-center w-28">رصيد سابق</th>
                      <th className="py-2.5 px-2 text-center w-24">كمية جديدة</th>
                      <th className="py-2.5 px-2 text-center w-24">الكمية الحالي</th>
                      <th className="py-2.5 px-2 text-center">المباعة</th>
                      <th className="py-2.5 px-2 text-center">المبيعات</th>
                      <th className="py-2.5 px-2 text-center">بعد العمولة</th>
                      <th className="py-2.5 px-2 text-center">العمولة</th>
                      <th className="py-2.5 px-2 text-center">صافي المستحق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {draftSummary.rows.map((row, idx) => (
                      <tr key={row.productId} className="hover:bg-amber-50/30">
                        <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900">
                          {row.productName}
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            value={row.unitPrice}
                            onChange={e => updateDraftItem(row.productId, "unitPrice", e.target.value)}
                            className="w-18 text-center bg-slate-50 border border-slate-200 rounded px-1.5 py-1.5 font-mono tabular-nums text-xs"
                          />
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              inputMode="decimal"
                              step="0.5"
                              min="0"
                              value={row.previousBalance}
                              onChange={e =>
                                updateDraftItem(row.productId, "previousBalance", e.target.value)
                              }
                              className={`w-16 text-center border rounded px-1.5 py-1.5 font-mono tabular-nums text-xs font-bold ${
                                !weekDraft.isFirstWeek && row.isPrevManual
                                  ? "border-amber-400 bg-amber-50"
                                  : "border-slate-300 bg-white"
                              }`}
                            />
                            {!weekDraft.isFirstWeek && row.isPrevManual && (
                              <button
                                type="button"
                                onClick={() => resetDraftItemAutoPrev(row.productId)}
                                title={`إرجاع للقيمة التلقائية (${formatNumber(row.autoPreviousBalance)})`}
                                className="p-1 rounded text-amber-700 hover:bg-amber-100 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            min="0"
                            value={row.newStock}
                            onChange={e => updateDraftItem(row.productId, "newStock", e.target.value)}
                            className="w-16 text-center bg-white border border-slate-300 rounded px-1.5 py-1.5 font-mono tabular-nums text-xs font-semibold"
                          />
                        </td>
                        <td className="py-2 px-1.5 text-center">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            min="0"
                            value={row.remainingStock}
                            onChange={e =>
                              updateDraftItem(row.productId, "remainingStock", e.target.value)
                            }
                            className="w-16 text-center bg-white border border-amber-400 rounded px-1.5 py-1.5 font-mono tabular-nums text-xs font-bold"
                          />
                        </td>
                        <td
                          className={`py-2 px-2 text-center font-mono tabular-nums font-bold bg-slate-50 ${
                            row.soldQty < 0
                              ? "text-rose-600"
                              : row.soldQty > 0
                              ? "text-emerald-700"
                              : "text-slate-500"
                          }`}
                        >
                          {formatNumber(row.soldQty)}
                        </td>
                        <td className="py-2 px-2 text-center font-mono tabular-nums font-bold text-slate-900 bg-slate-50">
                          {formatNumber(row.totalSales)}
                        </td>
                        <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-600 bg-slate-50">
                          {formatFixed2(row.priceAfterComm)}
                        </td>
                        <td className="py-2 px-2 text-center font-mono tabular-nums font-semibold text-amber-800 bg-slate-50">
                          {formatNumber(row.commAmt)}
                        </td>
                        <td className="py-2 px-2 text-center font-mono tabular-nums font-bold text-emerald-800 bg-slate-50">
                          {formatNumber(row.netPayable)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </form>

            {/* Sticky Bottom Live Summary & Save Bar (Thumb-Zone Ergonomics!) */}
            <div className="bg-amber-50/95 border-t border-amber-200 px-4 md:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono tabular-nums">
                <span className="font-arabic">
                  المباع: <strong className="font-mono text-emerald-800">{formatNumber(draftSummary.totals.sold)}</strong>
                </span>
                <span className="font-arabic">
                  المبيعات: <strong className="font-mono text-slate-900">{formatNumber(draftSummary.totals.sales)} dh</strong>
                </span>
                <span className="font-arabic">
                  العمولة: <strong className="font-mono text-amber-800">{formatNumber(draftSummary.totals.comm)} dh</strong>
                </span>
                <span className="font-arabic">
                  المستحق: <strong className="font-mono text-emerald-800 text-sm">{formatNumber(draftSummary.totals.net)} dh</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setWeekDraft(null)}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  form="weekly-draft-form"
                  disabled={saving}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50 text-white text-sm font-bold transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "جاري الحفظ..." : weekDraft.id ? "حفظ التعديلات" : "حفظ الجرد"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CONFIRM DELETE WEEK
         ==================================================================== */}
      {deleteWeekTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !saving && setDeleteWeekTarget(null)}
        >
          <div
            dir="rtl"
            className="font-arabic bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">تأكيد حذف السجل الأسبوعي</h4>
                <p className="text-xs text-slate-500">
                  {formatArabicWeekDate(deleteWeekTarget.weekDate)}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              هل أنت متأكد من حذف هذا السجل الأسبوعي نهائياً؟ سيتم إعادة احتساب الأرصدة التلقائية للأسابيع اللاحقة إن وجدت.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDeleteWeekTarget(null)}
                className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmDeleteWeek}
                className="px-4 py-2.5 min-h-[44px] rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold cursor-pointer"
              >
                {saving ? "جاري الحذف..." : "حذف نهائياً"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL: CONFIRM DELETE PRODUCT
         ==================================================================== */}
      {deleteProductTarget && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !saving && setDeleteProductTarget(null)}
        >
          <div
            dir="rtl"
            className="font-arabic bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">تأكيد حذف المنتج</h4>
                <p className="text-xs text-slate-500">{deleteProductTarget.name}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              سيؤدي حذف هذا المنتج إلى إزالته من قائمة المنتجات ومن صفوف الأسابيع المرتبطة به. هل تريد المتابعة؟
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => setDeleteProductTarget(null)}
                className="px-4 py-2.5 min-h-[44px] rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2.5 min-h-[44px] rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-bold cursor-pointer"
              >
                {saving ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
