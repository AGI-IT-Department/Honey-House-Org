import type pg from "pg";
import { getPool, isUsingPostgres } from "./db.js";
import type {
  TrackerProduct,
  TrackerWeek,
  TrackerWeekItemInput
} from "../utils/weeklyTrackerCalc.js";

// ============================================================================
// DEFAULT SEED DATA (6 Official Products + 4 Initial Weekly Records)
// ============================================================================

const DEFAULT_TRACKER_PRODUCTS: Array<Omit<TrackerProduct, "id">> = [
  { sortOrder: 1, name: "ربع كجم عسل", price: 20, weightKg: 0.25, isActive: true },
  { sortOrder: 2, name: "نصف كجم عسل", price: 35, weightKg: 0.5, isActive: true },
  { sortOrder: 3, name: "1كجم عسل", price: 60, weightKg: 1.0, isActive: true },
  { sortOrder: 4, name: "نصف كجم شهد (شمع)", price: 50, weightKg: 0.5, isActive: true },
  { sortOrder: 5, name: "نصف كجم عسل بالمكسرات", price: 50, weightKg: 0.5, isActive: true },
  { sortOrder: 6, name: "خلطة الطاقة والصحة الشاملة", price: 80, weightKg: 0.5, isActive: true }
];

interface SeedWeekDef {
  weekDate: string;
  commissionRate: number;
  notes: string;
  // Ordered by sortOrder 1..6
  rows: Array<{
    sortOrder: number;
    previousBalance: number;
    isPrevManual: boolean;
    newStock: number;
    remainingStock: number;
  }>;
}

const DEFAULT_TRACKER_WEEKS: SeedWeekDef[] = [
  {
    weekDate: "2026-10-11",
    commissionRate: 10,
    notes: "",
    rows: [
      { sortOrder: 1, previousBalance: 9, isPrevManual: true, newStock: 4, remainingStock: 13 },
      { sortOrder: 2, previousBalance: 3, isPrevManual: true, newStock: 4, remainingStock: 7 },
      { sortOrder: 3, previousBalance: 2, isPrevManual: true, newStock: 2, remainingStock: 4 },
      { sortOrder: 4, previousBalance: 0, isPrevManual: true, newStock: 2, remainingStock: 2 },
      { sortOrder: 5, previousBalance: 0, isPrevManual: true, newStock: 2, remainingStock: 2 },
      { sortOrder: 6, previousBalance: 0, isPrevManual: true, newStock: 0, remainingStock: 0 }
    ]
  },
  {
    weekDate: "2026-10-18",
    commissionRate: 10,
    notes: "",
    rows: [
      { sortOrder: 1, previousBalance: 13, isPrevManual: true, newStock: 8, remainingStock: 13 },
      { sortOrder: 2, previousBalance: 7, isPrevManual: true, newStock: 4, remainingStock: 7 },
      { sortOrder: 3, previousBalance: 4, isPrevManual: true, newStock: 9, remainingStock: 4 },
      { sortOrder: 4, previousBalance: 2, isPrevManual: true, newStock: 1, remainingStock: 2 },
      { sortOrder: 5, previousBalance: 2, isPrevManual: true, newStock: 0, remainingStock: 2 },
      { sortOrder: 6, previousBalance: 0, isPrevManual: true, newStock: 0, remainingStock: 0 }
    ]
  },
  {
    weekDate: "2026-11-08",
    commissionRate: 12,
    notes: "تم اضافة نص حبة البركة سعر 50 درهم رومانى ونص عسل موالح وفتح ربع عينات",
    rows: [
      { sortOrder: 1, previousBalance: 20, isPrevManual: true, newStock: 0, remainingStock: 9 },
      { sortOrder: 2, previousBalance: 11, isPrevManual: false, newStock: 1, remainingStock: 7 },
      { sortOrder: 3, previousBalance: 13, isPrevManual: false, newStock: 0, remainingStock: 4 },
      { sortOrder: 4, previousBalance: 3, isPrevManual: false, newStock: 1, remainingStock: 1 },
      { sortOrder: 5, previousBalance: 2, isPrevManual: false, newStock: 0, remainingStock: 2 },
      { sortOrder: 6, previousBalance: 0, isPrevManual: false, newStock: 0, remainingStock: 0 }
    ]
  },
  {
    weekDate: "2026-11-22",
    commissionRate: 12,
    notes: "",
    rows: [
      { sortOrder: 1, previousBalance: 9, isPrevManual: false, newStock: 4, remainingStock: 7 },
      { sortOrder: 2, previousBalance: 8, isPrevManual: false, newStock: 4, remainingStock: 5 },
      { sortOrder: 3, previousBalance: 4, isPrevManual: false, newStock: 2, remainingStock: 2 },
      { sortOrder: 4, previousBalance: 2, isPrevManual: false, newStock: 1, remainingStock: 1 },
      { sortOrder: 5, previousBalance: 2, isPrevManual: false, newStock: 0, remainingStock: 1 },
      { sortOrder: 6, previousBalance: 0, isPrevManual: false, newStock: 0, remainingStock: 0 }
    ]
  }
];

// ============================================================================
// IN-MEMORY FALLBACK STORE
// ============================================================================

let memProductSeq = 7;
let memWeekSeq = 5;
let memItemSeq = 100;

let memTrackerProducts: TrackerProduct[] = DEFAULT_TRACKER_PRODUCTS.map((p, idx) => ({
  id: idx + 1,
  ...p
}));

let memTrackerWeeks: TrackerWeek[] = DEFAULT_TRACKER_WEEKS.map((w, wIdx) => ({
  id: wIdx + 1,
  weekDate: w.weekDate,
  commissionRate: w.commissionRate,
  notes: w.notes,
  items: w.rows.map(r => {
    const prod = memTrackerProducts.find(p => p.sortOrder === r.sortOrder)!;
    return {
      id: memItemSeq++,
      productId: prod.id,
      unitPrice: prod.price,
      weightKg: prod.weightKg,
      previousBalance: r.previousBalance,
      isPrevManual: r.isPrevManual,
      newStock: r.newStock,
      remainingStock: r.remainingStock
    };
  })
}));

let pgSchemaReady = false;

// ============================================================================
// INPUT VALIDATION HELPERS
// ============================================================================

function validateDateStr(val: unknown): string {
  const s = String(val ?? "").trim().split("T")[0];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error("تاريخ الأسبوع غير صالح. الصيغة المطلوبة YYYY-MM-DD");
  }
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() + 1 !== m ||
    dt.getUTCDate() !== d
  ) {
    throw new Error("تاريخ الأسبوع غير صحيح");
  }
  return s;
}

function validateNonNegNumber(val: unknown, fieldLabel: string, max = 1_000_000): number {
  const num = Number(val);
  if (!Number.isFinite(num) || num < 0 || num > max) {
    throw new Error(`قيمة ${fieldLabel} غير صالحة`);
  }
  return Math.round(num * 1000) / 1000;
}

function validatePositiveInt(val: unknown, fieldLabel: string): number {
  const num = Number(val);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`معرّف ${fieldLabel} غير صالح`);
  }
  return num;
}

function validateString(val: unknown, fieldLabel: string, maxLen: number, required = false): string {
  const s = String(val ?? "").trim();
  if (required && !s) {
    throw new Error(`حقل ${fieldLabel} مطلوب`);
  }
  if (s.length > maxLen) {
    return s.slice(0, maxLen);
  }
  return s;
}

function formatPgDate(val: any): string {
  if (!val) return "";
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(val).split("T")[0];
}

// ============================================================================
// SCHEMA INITIALIZATION & SEEDING
// ============================================================================

export async function initWeeklyTrackerSchema(client: pg.PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS weekly_tracker_products (
      id SERIAL PRIMARY KEY,
      sort_order INTEGER NOT NULL DEFAULT 0,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      weight_kg DECIMAL(10, 3) NOT NULL DEFAULT 0.5,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_tracker_weeks (
      id SERIAL PRIMARY KEY,
      week_date DATE NOT NULL UNIQUE,
      commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 10,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_tracker_items (
      id SERIAL PRIMARY KEY,
      week_id INTEGER NOT NULL REFERENCES weekly_tracker_weeks(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES weekly_tracker_products(id) ON DELETE CASCADE,
      unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      weight_kg DECIMAL(10, 3) NOT NULL DEFAULT 0.5,
      previous_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
      is_prev_manual BOOLEAN NOT NULL DEFAULT FALSE,
      new_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
      remaining_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
      UNIQUE(week_id, product_id)
    );
  `);

  const prodCountRes = await client.query("SELECT COUNT(*) FROM weekly_tracker_products");
  const prodCount = parseInt(prodCountRes.rows[0].count, 10);

  if (prodCount === 0) {
    console.log("[Weekly Tracker] Seeding default 6 Arabic honey products...");
    const insertedBySort = new Map<number, { id: number; price: number; weightKg: number }>();

    for (const p of DEFAULT_TRACKER_PRODUCTS) {
      const ins = await client.query(
        `INSERT INTO weekly_tracker_products (sort_order, name, price, weight_kg, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, price, weight_kg`,
        [p.sortOrder, p.name, p.price, p.weightKg, p.isActive]
      );
      insertedBySort.set(p.sortOrder, {
        id: ins.rows[0].id,
        price: parseFloat(ins.rows[0].price),
        weightKg: parseFloat(ins.rows[0].weight_kg)
      });
    }

    const weekCountRes = await client.query("SELECT COUNT(*) FROM weekly_tracker_weeks");
    const weekCount = parseInt(weekCountRes.rows[0].count, 10);
    if (weekCount === 0) {
      console.log("[Weekly Tracker] Seeding initial 4 weekly inventory records...");
      for (const w of DEFAULT_TRACKER_WEEKS) {
        const wIns = await client.query(
          `INSERT INTO weekly_tracker_weeks (week_date, commission_rate, notes)
           VALUES ($1, $2, $3)
           ON CONFLICT (week_date) DO NOTHING
           RETURNING id`,
          [w.weekDate, w.commissionRate, w.notes]
        );
        if (wIns.rows.length > 0) {
          const weekId = wIns.rows[0].id;
          for (const r of w.rows) {
            const pRef = insertedBySort.get(r.sortOrder);
            if (!pRef) continue;
            await client.query(
              `INSERT INTO weekly_tracker_items
                (week_id, product_id, unit_price, weight_kg, previous_balance, is_prev_manual, new_stock, remaining_stock)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
               ON CONFLICT (week_id, product_id) DO NOTHING`,
              [
                weekId,
                pRef.id,
                pRef.price,
                pRef.weightKg,
                r.previousBalance,
                r.isPrevManual,
                r.newStock,
                r.remainingStock
              ]
            );
          }
        }
      }
    }
  }

  pgSchemaReady = true;
}

async function ensurePgReady(): Promise<pg.Pool | null> {
  if (!isUsingPostgres()) return null;
  const dbPool = getPool();
  if (!dbPool) return null;
  if (!pgSchemaReady) {
    const client = await dbPool.connect();
    try {
      await initWeeklyTrackerSchema(client);
    } finally {
      client.release();
    }
  }
  return dbPool;
}

// ============================================================================
// READ ALL DATA
// ============================================================================

export async function getWeeklyTrackerData(): Promise<{
  products: TrackerProduct[];
  weeks: TrackerWeek[];
}> {
  const dbPool = await ensurePgReady();
  if (dbPool) {
    const [prodRes, weeksRes, itemsRes] = await Promise.all([
      dbPool.query(
        `SELECT id, sort_order, name, price, weight_kg, is_active
         FROM weekly_tracker_products
         ORDER BY sort_order ASC, id ASC`
      ),
      dbPool.query(
        `SELECT id, week_date, commission_rate, notes
         FROM weekly_tracker_weeks
         ORDER BY week_date ASC, id ASC`
      ),
      dbPool.query(
        `SELECT id, week_id, product_id, unit_price, weight_kg, previous_balance, is_prev_manual, new_stock, remaining_stock
         FROM weekly_tracker_items
         ORDER BY id ASC`
      )
    ]);

    const products: TrackerProduct[] = prodRes.rows.map(r => ({
      id: Number(r.id),
      sortOrder: Number(r.sort_order),
      name: String(r.name),
      price: parseFloat(r.price) || 0,
      weightKg: parseFloat(r.weight_kg) || 0,
      isActive: Boolean(r.is_active)
    }));

    const itemsByWeek = new Map<number, TrackerWeekItemInput[]>();
    for (const row of itemsRes.rows) {
      const wid = Number(row.week_id);
      if (!itemsByWeek.has(wid)) itemsByWeek.set(wid, []);
      itemsByWeek.get(wid)!.push({
        id: Number(row.id),
        productId: Number(row.product_id),
        unitPrice: parseFloat(row.unit_price) || 0,
        weightKg: parseFloat(row.weight_kg) || 0,
        previousBalance: parseFloat(row.previous_balance) || 0,
        isPrevManual: Boolean(row.is_prev_manual),
        newStock: parseFloat(row.new_stock) || 0,
        remainingStock: parseFloat(row.remaining_stock) || 0
      });
    }

    const weeks: TrackerWeek[] = weeksRes.rows.map(w => ({
      id: Number(w.id),
      weekDate: formatPgDate(w.week_date),
      commissionRate: parseFloat(w.commission_rate) || 0,
      notes: String(w.notes || ""),
      items: itemsByWeek.get(Number(w.id)) || []
    }));

    return { products, weeks };
  }

  return {
    products: [...memTrackerProducts].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    weeks: [...memTrackerWeeks]
      .sort((a, b) => a.weekDate.localeCompare(b.weekDate) || a.id - b.id)
      .map(w => ({ ...w, items: w.items.map(it => ({ ...it })) }))
  };
}

// ============================================================================
// PRODUCT CRUD
// ============================================================================

export async function createTrackerProduct(payload: any): Promise<{ success: boolean; product: TrackerProduct }> {
  const name = validateString(payload?.name, "اسم المنتج", 200, true);
  const price = validateNonNegNumber(payload?.price, "السعر");
  const weightKg = validateNonNegNumber(payload?.weightKg, "الوزن (كجم)", 1000);
  if (weightKg <= 0) {
    throw new Error("يجب أن يكون وزن المنتج أكبر من صفر");
  }

  const dbPool = await ensurePgReady();
  if (dbPool) {
    const maxSortRes = await dbPool.query("SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM weekly_tracker_products");
    const nextSort = (parseInt(maxSortRes.rows[0].max_sort, 10) || 0) + 1;
    const res = await dbPool.query(
      `INSERT INTO weekly_tracker_products (sort_order, name, price, weight_kg, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, sort_order, name, price, weight_kg, is_active`,
      [nextSort, name, price, weightKg]
    );
    const r = res.rows[0];
    return {
      success: true,
      product: {
        id: Number(r.id),
        sortOrder: Number(r.sort_order),
        name: String(r.name),
        price: parseFloat(r.price),
        weightKg: parseFloat(r.weight_kg),
        isActive: Boolean(r.is_active)
      }
    };
  }

  const maxSort = memTrackerProducts.reduce((m, p) => Math.max(m, p.sortOrder), 0);
  const newProd: TrackerProduct = {
    id: memProductSeq++,
    sortOrder: maxSort + 1,
    name,
    price,
    weightKg,
    isActive: true
  };
  memTrackerProducts.push(newProd);
  return { success: true, product: newProd };
}

export async function updateTrackerProduct(
  idParam: unknown,
  payload: any
): Promise<{ success: boolean; product: TrackerProduct }> {
  const id = validatePositiveInt(idParam, "المنتج");
  const name = validateString(payload?.name, "اسم المنتج", 200, true);
  const price = validateNonNegNumber(payload?.price, "السعر");
  const weightKg = validateNonNegNumber(payload?.weightKg, "الوزن (كجم)", 1000);
  if (weightKg <= 0) {
    throw new Error("يجب أن يكون وزن المنتج أكبر من صفر");
  }
  const syncExistingWeeks = Boolean(payload?.syncExistingWeeks);

  const dbPool = await ensurePgReady();
  if (dbPool) {
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");
      const res = await client.query(
        `UPDATE weekly_tracker_products
         SET name = $1, price = $2, weight_kg = $3
         WHERE id = $4
         RETURNING id, sort_order, name, price, weight_kg, is_active`,
        [name, price, weightKg, id]
      );
      if (res.rows.length === 0) {
        throw new Error("المنتج غير موجود");
      }
      if (syncExistingWeeks) {
        await client.query(
          `UPDATE weekly_tracker_items
           SET unit_price = $1, weight_kg = $2
           WHERE product_id = $3`,
          [price, weightKg, id]
        );
      }
      await client.query("COMMIT");
      const r = res.rows[0];
      return {
        success: true,
        product: {
          id: Number(r.id),
          sortOrder: Number(r.sort_order),
          name: String(r.name),
          price: parseFloat(r.price),
          weightKg: parseFloat(r.weight_kg),
          isActive: Boolean(r.is_active)
        }
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  const idx = memTrackerProducts.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("المنتج غير موجود");
  memTrackerProducts[idx] = { ...memTrackerProducts[idx], name, price, weightKg };
  if (syncExistingWeeks) {
    memTrackerWeeks.forEach(w => {
      w.items.forEach(it => {
        if (it.productId === id) {
          it.unitPrice = price;
          it.weightKg = weightKg;
        }
      });
    });
  }
  return { success: true, product: memTrackerProducts[idx] };
}

export async function deleteTrackerProduct(idParam: unknown): Promise<{ success: boolean }> {
  const id = validatePositiveInt(idParam, "المنتج");
  const dbPool = await ensurePgReady();
  if (dbPool) {
    const res = await dbPool.query("DELETE FROM weekly_tracker_products WHERE id = $1", [id]);
    if (res.rowCount === 0) {
      throw new Error("المنتج غير موجود");
    }
    return { success: true };
  }

  const idx = memTrackerProducts.findIndex(p => p.id === id);
  if (idx === -1) throw new Error("المنتج غير موجود");
  memTrackerProducts.splice(idx, 1);
  memTrackerWeeks.forEach(w => {
    w.items = w.items.filter(it => it.productId !== id);
  });
  return { success: true };
}

// ============================================================================
// WEEKLY INVENTORY CRUD
// ============================================================================

function validateWeekItems(rawItems: unknown): TrackerWeekItemInput[] {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new Error("يجب أن يحتوي السجل الأسبوعي على منتج واحد على الأقل");
  }
  return rawItems.map((it: any) => ({
    productId: validatePositiveInt(it?.productId, "المنتج"),
    unitPrice: validateNonNegNumber(it?.unitPrice, "السعر"),
    weightKg: validateNonNegNumber(it?.weightKg, "الوزن", 1000),
    previousBalance: validateNonNegNumber(it?.previousBalance, "الرصيد السابق"),
    isPrevManual: Boolean(it?.isPrevManual),
    newStock: validateNonNegNumber(it?.newStock, "الكمية الجديدة"),
    remainingStock: validateNonNegNumber(it?.remainingStock, "الكمية المتبقية")
  }));
}

export async function createTrackerWeek(payload: any): Promise<{ success: boolean; weekId: number }> {
  const weekDate = validateDateStr(payload?.weekDate);
  const commissionRate = validateNonNegNumber(payload?.commissionRate ?? 10, "نسبة العمولة", 100);
  const notes = validateString(payload?.notes, "الملاحظات", 2000, false);
  const items = validateWeekItems(payload?.items);

  const dbPool = await ensurePgReady();
  if (dbPool) {
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");
      const dupCheck = await client.query(
        "SELECT id FROM weekly_tracker_weeks WHERE week_date = $1",
        [weekDate]
      );
      if (dupCheck.rows.length > 0) {
        throw new Error(`يوجد سجل مسجل بالفعل لتاريخ ${weekDate}`);
      }

      const wRes = await client.query(
        `INSERT INTO weekly_tracker_weeks (week_date, commission_rate, notes)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [weekDate, commissionRate, notes]
      );
      const weekId = Number(wRes.rows[0].id);

      for (const it of items) {
        await client.query(
          `INSERT INTO weekly_tracker_items
            (week_id, product_id, unit_price, weight_kg, previous_balance, is_prev_manual, new_stock, remaining_stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            weekId,
            it.productId,
            it.unitPrice,
            it.weightKg,
            it.previousBalance,
            it.isPrevManual,
            it.newStock,
            it.remainingStock
          ]
        );
      }

      await client.query("COMMIT");
      return { success: true, weekId };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  if (memTrackerWeeks.some(w => w.weekDate === weekDate)) {
    throw new Error(`يوجد سجل مسجل بالفعل لتاريخ ${weekDate}`);
  }
  const weekId = memWeekSeq++;
  memTrackerWeeks.push({
    id: weekId,
    weekDate,
    commissionRate,
    notes,
    items: items.map(it => ({ ...it, id: memItemSeq++ }))
  });
  return { success: true, weekId };
}

export async function updateTrackerWeek(
  idParam: unknown,
  payload: any
): Promise<{ success: boolean }> {
  const id = validatePositiveInt(idParam, "الأسبوع");
  const weekDate = validateDateStr(payload?.weekDate);
  const commissionRate = validateNonNegNumber(payload?.commissionRate ?? 10, "نسبة العمولة", 100);
  const notes = validateString(payload?.notes, "الملاحظات", 2000, false);
  const items = validateWeekItems(payload?.items);

  const dbPool = await ensurePgReady();
  if (dbPool) {
    const client = await dbPool.connect();
    try {
      await client.query("BEGIN");
      const exists = await client.query("SELECT id FROM weekly_tracker_weeks WHERE id = $1", [id]);
      if (exists.rows.length === 0) {
        throw new Error("السجل الأسبوعي غير موجود");
      }

      const dupCheck = await client.query(
        "SELECT id FROM weekly_tracker_weeks WHERE week_date = $1 AND id <> $2",
        [weekDate, id]
      );
      if (dupCheck.rows.length > 0) {
        throw new Error(`يوجد سجل آخر مسجل لتاريخ ${weekDate}`);
      }

      await client.query(
        `UPDATE weekly_tracker_weeks
         SET week_date = $1, commission_rate = $2, notes = $3
         WHERE id = $4`,
        [weekDate, commissionRate, notes, id]
      );

      for (const it of items) {
        await client.query(
          `INSERT INTO weekly_tracker_items
            (week_id, product_id, unit_price, weight_kg, previous_balance, is_prev_manual, new_stock, remaining_stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (week_id, product_id)
           DO UPDATE SET
             unit_price = EXCLUDED.unit_price,
             weight_kg = EXCLUDED.weight_kg,
             previous_balance = EXCLUDED.previous_balance,
             is_prev_manual = EXCLUDED.is_prev_manual,
             new_stock = EXCLUDED.new_stock,
             remaining_stock = EXCLUDED.remaining_stock`,
          [
            id,
            it.productId,
            it.unitPrice,
            it.weightKg,
            it.previousBalance,
            it.isPrevManual,
            it.newStock,
            it.remainingStock
          ]
        );
      }

      await client.query("COMMIT");
      return { success: true };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  const idx = memTrackerWeeks.findIndex(w => w.id === id);
  if (idx === -1) throw new Error("السجل الأسبوعي غير موجود");
  if (memTrackerWeeks.some(w => w.weekDate === weekDate && w.id !== id)) {
    throw new Error(`يوجد سجل آخر مسجل لتاريخ ${weekDate}`);
  }
  memTrackerWeeks[idx] = {
    id,
    weekDate,
    commissionRate,
    notes,
    items: items.map(it => ({ ...it, id: it.id || memItemSeq++ }))
  };
  return { success: true };
}

export async function deleteTrackerWeek(idParam: unknown): Promise<{ success: boolean }> {
  const id = validatePositiveInt(idParam, "الأسبوع");
  const dbPool = await ensurePgReady();
  if (dbPool) {
    const res = await dbPool.query("DELETE FROM weekly_tracker_weeks WHERE id = $1", [id]);
    if (res.rowCount === 0) {
      throw new Error("السجل الأسبوعي غير موجود");
    }
    return { success: true };
  }

  const idx = memTrackerWeeks.findIndex(w => w.id === id);
  if (idx === -1) throw new Error("السجل الأسبوعي غير موجود");
  memTrackerWeeks.splice(idx, 1);
  return { success: true };
}
