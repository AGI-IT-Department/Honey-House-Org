import pg from "pg";
import {
  SEED_CUSTOMERS,
  SEED_BATCHES,
  SEED_ORDERS,
  SEED_EXPENSES,
  SEED_BALANCE,
  CustomerSeed,
  BatchSeed,
  BatchItemSeed,
  OrderSeed,
  ExpenseSeed,
  BalanceSeed
} from "./seedData.js";

const { Pool } = pg;

// Product weight mapping in grams
export const PRODUCT_WEIGHTS: Record<string, number> = {
  "Honey 250g": 250,
  "Honey 500g": 500,
  "Honey 1kg": 1000,
  "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)": 500,
  "beeswax 500g": 500,
  "Energy Package (750g + Pollen + Royal Jelly)": 750,
  "Honey (Squeeze 250g)": 250,
  "Honey (Squeeze 500g)": 500
};

// Database connection pool setup - lazily initialized
let pool: pg.Pool | null = null;
let usePostgres = false;

// Global in-memory states (fallback DB)
let memCustomers: CustomerSeed[] = [...SEED_CUSTOMERS];
let memBatches: BatchSeed[] = JSON.parse(JSON.stringify(SEED_BATCHES));
let memExpenses: ExpenseSeed[] = [...SEED_EXPENSES];
let memBalance: BalanceSeed[] = [...SEED_BALANCE];
// Flatten seed orders into list of order items
let memOrders: OrderSeed[] = [...SEED_ORDERS];

export function getPool(): pg.Pool | null {
  if (!pool && process.env.DATABASE_URL) {
    try {
      const connectionString = process.env.DATABASE_URL;
      const poolConfig: any = {
        connectionString,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      };

      // Force SSL rejectUnauthorized fallback for Supabase
      if (connectionString.includes("sslmode=") || process.env.NODE_ENV === "production" || connectionString.includes("@db.")) {
        poolConfig.ssl = {
          rejectUnauthorized: false
        };
      }

      pool = new Pool(poolConfig);
      usePostgres = true;
      console.log("PostgreSQL Pool created successfully using DATABASE_URL.");
    } catch (e: any) {
      console.error("Failed to configure Postgres Pool. Falling back to in-memory mode.", e.message);
      pool = null;
      usePostgres = false;
    }
  }
  return pool;
}

// Check database connection and run migrations + seeding on startup
export async function initDb(): Promise<boolean> {
  const dbPool = getPool();
  if (!dbPool) {
    console.log("No DATABASE_URL found. Working in interactive In-Memory Mock Mode.");
    return false;
  }

  try {
    const client = await dbPool.connect();
    console.log("Successfully connected to PostgreSQL Database!");
    
    // Create necessary database tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        location VARCHAR(255),
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS batches (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        egy_phone VARCHAR(100),
        uae_phone VARCHAR(100),
        passport_number VARCHAR(100),
        location_egypt VARCHAR(255),
        flight_details VARCHAR(255),
        arrival_date DATE,
        status VARCHAR(50) DEFAULT 'Active',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS batch_items (
        id SERIAL PRIMARY KEY,
        batch_id VARCHAR(50) REFERENCES batches(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 2) DEFAULT 0,
        purchase_price DECIMAL(10, 2) DEFAULT 0,
        shipping_cost DECIMAL(10, 2) DEFAULT 0,
        local_cost DECIMAL(10, 2) DEFAULT 0,
        total_cost_per_product DECIMAL(10, 2) DEFAULT 0,
        total_weight_kg DECIMAL(10, 2) DEFAULT 0,
        available_weight_kg DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        order_date DATE NOT NULL,
        customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE SET NULL,
        delivery_status VARCHAR(50) DEFAULT 'Pending',
        payment_status VARCHAR(50) DEFAULT 'Unpaid',
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(50) REFERENCES orders(id) ON DELETE CASCADE,
        batch_id VARCHAR(50) REFERENCES batches(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity DECIMAL(10, 2) DEFAULT 1,
        unit_price DECIMAL(10, 2) DEFAULT 0,
        cost_price DECIMAL(10, 2) DEFAULT 0,
        total_sale DECIMAL(10, 2) DEFAULT 0,
        total_cost DECIMAL(10, 2) DEFAULT 0,
        profit DECIMAL(10, 2) DEFAULT 0,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        type VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        description TEXT,
        amount DECIMAL(10, 2) DEFAULT 0,
        payment_method VARCHAR(100),
        receipt_reference VARCHAR(100),
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS balance_transactions (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        type VARCHAR(50) NOT NULL,
        details VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) DEFAULT 0,
        balance DECIMAL(10, 2) DEFAULT 0,
        note TEXT
      );
    `);

    // Perform database seeding if empty
    const checkCust = await client.query("SELECT COUNT(*) FROM customers");
    const count = parseInt(checkCust.rows[0].count);
    if (count === 0) {
      console.log("Database table rows empty. Seeding historical database contents...");
      
      // 1. Seed customers
      for (const cust of SEED_CUSTOMERS) {
        await client.query(
          "INSERT INTO customers (id, name, phone, location, notes) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
          [cust.id, cust.name, cust.phone, cust.location, cust.notes]
        );
      }

      // 2. Seed batches & items
      for (const b of SEED_BATCHES) {
        await client.query(
          "INSERT INTO batches (id, name, egy_phone, uae_phone, passport_number, location_egypt, flight_details, arrival_date, status, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING",
          [b.id, b.name, b.egyPhone, b.uaePhone, b.passportNumber, b.locationEgypt, b.flightDetails, b.arrivalDate, b.status, b.notes]
        );

        for (const item of b.items) {
          const weight = (PRODUCT_WEIGHTS[item.productName] || 0) * item.quantity / 1000;
          await client.query(
            "INSERT INTO batch_items (batch_id, product_name, quantity, purchase_price, shipping_cost, local_cost, total_cost_per_product, total_weight_kg, available_weight_kg, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
            [b.id, item.productName, item.quantity, item.purchasePrice, item.shippingPrice, item.localCost, item.totalCost, weight, weight, item.status]
          );
        }
      }

      // 3. Seed orders & items
      // Group flat orders by orderId
      const groupedOrders: Record<string, OrderSeed[]> = {};
      for (const ord of SEED_ORDERS) {
        if (!groupedOrders[ord.orderId]) {
          groupedOrders[ord.orderId] = [];
        }
        groupedOrders[ord.orderId].push(ord);
      }

      for (const [orderId, items] of Object.entries(groupedOrders)) {
        const first = items[0];
        // Ensure customer exists
        await client.query(
          "INSERT INTO customers (id, name, phone, location, notes) VALUES ($1, $2, $3, $4, '') ON CONFLICT DO NOTHING",
          [first.customerId, first.customerName, first.customerPhone, first.customerLocation]
        );

        await client.query(
          "INSERT INTO orders (id, order_date, customer_id, delivery_status, payment_status, notes) VALUES ($1, $2, $3, $4, $5, '') ON CONFLICT DO NOTHING",
          [orderId, first.orderDate, first.customerId, first.deliveryStatus, first.paymentStatus]
        );

        for (const item of items) {
          await client.query(
            "INSERT INTO order_items (order_id, batch_id, product_name, quantity, unit_price, cost_price, total_sale, total_cost, profit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [orderId, item.batchId, item.productName, item.quantity, item.unitPrice, item.costPrice, item.totalSale, item.totalCost, item.profit]
          );

          // Deduct batch available weight
          const itemWeight = (PRODUCT_WEIGHTS[item.productName] || 0) * item.quantity / 1000;
          await client.query(
            "UPDATE batch_items SET available_weight_kg = GREATEST(0, available_weight_kg - $1) WHERE batch_id = $2 AND LOWER(TRIM(product_name)) = LOWER(TRIM($3))",
            [itemWeight, item.batchId, item.productName]
          );
        }
      }

      // 4. Seed Expenses
      for (const exp of SEED_EXPENSES) {
        await client.query(
          "INSERT INTO expenses (id, date, type, category, description, amount, payment_method, receipt_reference, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT DO NOTHING",
          [exp.id, exp.date, exp.type, exp.category, exp.description, exp.amount, exp.paymentMethod, exp.reference, exp.notes]
        );
      }

      // 5. Seed Balance Sheet Ledger
      for (const bal of SEED_BALANCE) {
        await client.query(
          "INSERT INTO balance_transactions (id, date, type, details, amount, balance, note) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING",
          [bal.id, bal.date, bal.type, bal.details, bal.amount, bal.balance, bal.note]
        );
      }

      console.log("Database table Seeding completed with flying colors!");
    } else {
      console.log(`Database tables already populated with ${count} customers.`);
    }

    client.release();
    usePostgres = true;
    return true;
  } catch (err: any) {
    console.error("Database connection check/migration failed. Reverting to graceful in-memory simulation.", err.message);
    usePostgres = false;
    return false;
  }
}

// Helper: Query wrapper with fallback
async function query(text: string, params: any[] = []): Promise<pg.QueryResult<any>> {
  const dbPool = getPool();
  if (usePostgres && dbPool) {
    try {
      return await dbPool.query(text, params);
    } catch (e: any) {
      console.error("Postgres Query failed, fallback may trigger:", e.message);
      throw e;
    }
  }
  throw new Error("PostgreSQL not active");
}

/* ==========================================================================
   CUSTOMERS REPOSITORY
   ========================================================================== */

export async function getAllCustomers(): Promise<any[]> {
  if (usePostgres) {
    try {
      const res = await query(`
        SELECT 
          c.id AS "Customer ID", 
          c.name AS "Customer Name", 
          c.phone AS "Customer Phone", 
          c.location AS "Customer Location",
          COUNT(o.id) AS "Order Count",
          COALESCE(SUM(oi.total_sale), 0) AS "Total Spent"
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        GROUP BY c.id, c.name, c.phone, c.location
        ORDER BY c.name ASC
      `);
      return res.rows.map(r => ({
        ...r,
        "Total Spent": parseFloat(r["Total Spent"])
      }));
    } catch (e) {
      console.error("Postgres query failed for getAllCustomers, running fallback.");
    }
  }

  // Fallback
  return memCustomers.map(cust => {
    // Count user's orders and calculate sum spent
    const relevantOrders = memOrders.filter(o => o.customerId === cust.id);
    const orderIds = new Set(relevantOrders.map(o => o.orderId));
    const totalSpent = relevantOrders.reduce((sum, item) => sum + (item.totalSale || 0), 0);

    return {
      "Customer ID": cust.id,
      "Customer Name": cust.name,
      "Customer Phone": cust.phone,
      "Customer Location": cust.location,
      "Order Count": orderIds.size,
      "Total Spent": totalSpent
    };
  }).sort((a, b) => a["Customer Name"].localeCompare(b["Customer Name"]));
}

export async function searchCustomers(searchTerm: string): Promise<any[]> {
  if (usePostgres) {
    try {
      const cleanSearch = `%${searchTerm}%`;
      const res = await query(`
        SELECT 
          c.id AS "Customer ID", 
          c.name AS "Customer Name", 
          c.phone AS "Customer Phone", 
          c.location AS "Customer Location",
          COUNT(o.id) AS "Order Count",
          COALESCE(SUM(oi.total_sale), 0) AS "Total Spent"
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.id
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE c.name ILIKE $1 OR c.phone LIKE $1
        GROUP BY c.id, c.name, c.phone, c.location
        ORDER BY c.name ASC
      `, [cleanSearch]);
      return res.rows.map(r => ({
        ...r,
        "Total Spent": parseFloat(r["Total Spent"])
      }));
    } catch (e) {
      console.error("searchCustomers fallback triggered");
    }
  }

  const queryLower = searchTerm.toLowerCase();
  const matched = memCustomers.filter(
    c => c.name.toLowerCase().includes(queryLower) || c.phone.includes(searchTerm)
  );

  return matched.map(cust => {
    const relevantOrders = memOrders.filter(o => o.customerId === cust.id);
    const orderIds = new Set(relevantOrders.map(o => o.orderId));
    const totalSpent = relevantOrders.reduce((sum, item) => sum + (item.totalSale || 0), 0);
    return {
      "Customer ID": cust.id,
      "Customer Name": cust.name,
      "Customer Phone": cust.phone,
      "Customer Location": cust.location,
      "Order Count": orderIds.size,
      "Total Spent": totalSpent
    };
  }).sort((a, b) => a["Customer Name"].localeCompare(b["Customer Name"]));
}

export async function getCustomerById(customerId: string): Promise<any | null> {
  if (usePostgres) {
    try {
      const res = await query("SELECT id AS \"Customer ID\", name AS \"Customer Name\", phone AS \"Customer Phone\", location AS \"Customer Location\", notes AS \"Notes\" FROM customers WHERE id = $1", [customerId]);
      if (res.rows.length === 0) return null;

      // Stats
      const statsRes = await query(`
        SELECT 
          COUNT(DISTINCT o.id) AS "Order Count",
          COALESCE(SUM(oi.total_sale), 0) AS "Total Spent",
          MAX(o.order_date) AS "Last Order Date"
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.customer_id = $1
      `, [customerId]);

      const main = res.rows[0];
      const stats = statsRes.rows[0];

      return {
        "Customer ID": main["Customer ID"],
        "Customer Name": main["Customer Name"],
        "Customer Phone": main["Customer Phone"],
        "Customer Location": main["Customer Location"],
        "Order Count": parseInt(stats["Order Count"]) || 0,
        "Total Spent": parseFloat(stats["Total Spent"] || 0).toFixed(2),
        "Last Order Date": stats["Last Order Date"] ? new Date(stats["Last Order Date"]).toISOString().split("T")[0] : "N/A"
      };
    } catch (e) {
      console.error("getCustomerById fallback triggered");
    }
  }

  const cust = memCustomers.find(c => c.id === customerId);
  if (!cust) return null;

  const relevantOrders = memOrders.filter(o => o.customerId === customerId);
  const orderIds = new Set(relevantOrders.map(o => o.orderId));
  const totalSpent = relevantOrders.reduce((sum, item) => sum + (item.totalSale || 0), 0);
  
  let lastDate = "N/A";
  if (relevantOrders.length > 0) {
    const dates = relevantOrders.map(o => new Date(o.orderDate).getTime());
    const maxTime = Math.max(...dates);
    lastDate = new Date(maxTime).toISOString().split("T")[0];
  }

  return {
    "Customer ID": cust.id,
    "Customer Name": cust.name,
    "Customer Phone": cust.phone,
    "Customer Location": cust.location,
    "Order Count": orderIds.size,
    "Total Spent": totalSpent.toFixed(2),
    "Last Order Date": lastDate
  };
}

export async function updateCustomer(customerId: string, customerData: any): Promise<any> {
  if (usePostgres) {
    try {
      const res = await query(
        `UPDATE customers 
         SET name = COALESCE($1, name), 
             phone = COALESCE($2, phone), 
             location = COALESCE($3, location) 
         WHERE id = $4 
         RETURNING *`,
        [customerData["Customer Name"], customerData["Customer Phone"], customerData["Customer Location"], customerId]
      );
      return { success: res.rows.length > 0, updatedRows: res.rows.length };
    } catch (err) {
      console.error("Postgres updateCustomer failed, running fallback.");
    }
  }

  const idx = memCustomers.findIndex(c => c.id === customerId);
  if (idx !== -1) {
    if (customerData["Customer Name"]) memCustomers[idx].name = customerData["Customer Name"];
    if (customerData["Customer Phone"]) memCustomers[idx].phone = customerData["Customer Phone"];
    if (customerData["Customer Location"]) memCustomers[idx].location = customerData["Customer Location"];

    // Sync redundant details in flat memories
    memOrders.forEach(o => {
      if (o.customerId === customerId) {
        if (customerData["Customer Name"]) o.customerName = customerData["Customer Name"];
        if (customerData["Customer Phone"]) o.customerPhone = customerData["Customer Phone"];
        if (customerData["Customer Location"]) o.customerLocation = customerData["Customer Location"];
      }
    });

    return { success: true, updatedRows: 1 };
  }
  return { success: false, updatedRows: 0 };
}

export async function ensureCustomer(customer: { id: string; name: string; phone: string; location: string }): Promise<void> {
  if (usePostgres) {
    try {
      await query(
        `INSERT INTO customers (id, name, phone, location, notes) 
         VALUES ($1, $2, $3, $4, '') 
         ON CONFLICT (id) DO UPDATE SET 
            name = EXCLUDED.name, 
            phone = EXCLUDED.phone, 
            location = EXCLUDED.location`,
        [customer.id, customer.name, customer.phone, customer.location]
      );
      return;
    } catch (e) {
      console.error("ensureCustomer fallback triggered");
    }
  }

  const idx = memCustomers.findIndex(c => c.id === customer.id);
  if (idx === -1) {
    memCustomers.push({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      location: customer.location,
      notes: ""
    });
  } else {
    memCustomers[idx].name = customer.name;
    memCustomers[idx].phone = customer.phone;
    memCustomers[idx].location = customer.location;
  }
}

/* ==========================================================================
   IMPORT BATCHES REPOSITORY
   ========================================================================== */

export async function getBatches(startDate?: string, endDate?: string): Promise<any[]> {
  if (usePostgres) {
    try {
      let q = `
        SELECT 
          b.id AS "Import Batch ID", 
          b.name AS "Name", 
          b.egy_phone AS "EGY Phone", 
          b.uae_phone AS "UAE Phone", 
          b.passport_number AS "Passport Number",
          b.location_egypt AS "Location in Egypt", 
          b.flight_details AS "Flight Dep/Des",
          TO_CHAR(b.arrival_date, 'YYYY-MM-DD') AS "Arrival Date (UAE)",
          b.notes AS "Notes", 
          b.status AS "Status"
        FROM batches b
      `;
      const params: any[] = [];
      if (startDate && endDate) {
        q += " WHERE b.arrival_date >= $1 AND b.arrival_date <= $2";
        params.push(startDate, endDate);
      }
      q += " ORDER BY b.arrival_date DESC, b.id DESC";

      const res = await query(q, params);
      const batchesMap = [];

      for (const row of res.rows) {
        // Fetch products
        const prodRes = await query(`
          SELECT 
            product_name AS "Product",
            quantity AS "Quantity",
            purchase_price AS "Purchase Price",
            shipping_cost AS "Shipping Cost",
            local_cost AS "Local Cost",
            total_cost_per_product AS "Total Cost per product",
            total_weight_kg AS "Product Weight",
            available_weight_kg AS "Available Weight"
          FROM batch_items
          WHERE batch_id = $1
        `, [row["Import Batch ID"]]);

        let totalWeight = 0;
        let availableWeight = 0;

        const products = prodRes.rows.map(p => {
          const qty = parseFloat(p["Quantity"]) || 0;
          const pur = parseFloat(p["Purchase Price"]) || 0;
          const shp = parseFloat(p["Shipping Cost"]) || 0;
          const loc = parseFloat(p["Local Cost"]) || 0;
          const weight = parseFloat(p["Product Weight"]) || 0;
          const availW = parseFloat(p["Available Weight"]) || 0;

          totalWeight += weight;
          availableWeight += availW;

          return {
            Product: p["Product"],
            Quantity: qty,
            "Purchase Price": pur,
            "Shipping Cost": shp,
            "Local Cost": loc,
            "Total Cost per product": parseFloat(p["Total Cost per product"]) || (pur + shp + loc),
            "Product Weight": weight,
            "Available Weight": availW
          };
        });

        batchesMap.push({
          ...row,
          "Total Weight": totalWeight,
          "Available Weight": availableWeight,
          Products: products
        });
      }

      return batchesMap;
    } catch (e) {
      console.error("getBatches fallback triggered");
    }
  }

  // Fallback
  let filtered = [...memBatches];
  if (startDate && endDate) {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    filtered = filtered.filter(b => {
      const d = b.arrivalDate ? new Date(b.arrivalDate).getTime() : 0;
      return d >= s && d <= e;
    });
  }

  return filtered.map(b => {
    let totWeight = 0;
    let availWeight = 0;

    const itemsMapped = b.items.map(item => {
      const totItemWeight = (PRODUCT_WEIGHTS[item.productName] || 0) * item.quantity / 1000;
      
      // Calculate consumed weight for this batch-product from flat memOrders
      const consumedOrders = memOrders.filter(
        ord => ord.batchId === b.id && ord.productName.toLowerCase().trim() === item.productName.toLowerCase().trim()
      );
      const weightConsumed = consumedOrders.reduce((sum, o) => {
        const itemW = PRODUCT_WEIGHTS[o.productName] || 0;
        return sum + (itemW * o.quantity / 1000);
      }, 0);

      const availableItemWeight = Math.max(0, totItemWeight - weightConsumed);
      totWeight += totItemWeight;
      availWeight += availableItemWeight;

      return {
        Product: item.productName,
        Quantity: item.quantity,
        "Purchase Price": item.purchasePrice,
        "Shipping Cost": item.shippingPrice,
        "Local Cost": item.localCost,
        "Total Cost per product": item.totalCost,
        "Product Weight": totItemWeight,
        "Available Weight": availableItemWeight
      };
    });

    return {
      "Import Batch ID": b.id,
      Name: b.name,
      "EGY Phone": b.egyPhone,
      "UAE Phone": b.uaePhone,
      "Passport Number": b.passportNumber,
      "Location in Egypt": b.locationEgypt,
      "Flight Dep/Des": b.flightDetails,
      "Arrival Date (UAE)": b.arrivalDate,
      Notes: b.notes,
      Status: b.status,
      "Total Weight": totWeight,
      "Available Weight": availWeight,
      Products: itemsMapped
    };
  }).sort((a, b) => new Date(b["Arrival Date (UAE)"]).getTime() - new Date(a["Arrival Date (UAE)"]).getTime());
}

export async function getBatchById(batchId: string): Promise<any | null> {
  if (usePostgres) {
    try {
      const res = await query(`
        SELECT 
          id AS "Import Batch ID", 
          name AS "Name", 
          egy_phone AS "EGY Phone", 
          uae_phone AS "UAE Phone", 
          passport_number AS "Passport Number",
          location_egypt AS "Location in Egypt", 
          flight_details AS "Flight Dep/Des",
          TO_CHAR(arrival_date, 'YYYY-MM-DD') AS "Arrival Date (UAE)",
          notes AS "Notes", 
          status AS "Status"
        FROM batches
        WHERE id = $1
      `, [batchId]);

      if (res.rows.length === 0) return null;
      const b = res.rows[0];

      const prodRes = await query(`
        SELECT 
          product_name AS "Product",
          quantity AS "Quantity",
          purchase_price AS "Purchase Price",
          shipping_cost AS "Shipping Cost",
          local_cost AS "Local Cost",
          total_cost_per_product AS "Total Cost per product",
          total_weight_kg AS "Product Weight",
          available_weight_kg AS "Available Weight"
        FROM batch_items
        WHERE batch_id = $1
      `, [batchId]);

      let totalWeight = 0;
      let availableWeight = 0;

      const products = prodRes.rows.map(p => {
        const qty = parseFloat(p["Quantity"]) || 0;
        const pur = parseFloat(p["Purchase Price"]) || 0;
        const shp = parseFloat(p["Shipping Cost"]) || 0;
        const loc = parseFloat(p["Local Cost"]) || 0;
        const weight = parseFloat(p["Product Weight"]) || 0;
        const availW = parseFloat(p["Available Weight"]) || 0;

        totalWeight += weight;
        availableWeight += availW;

        return {
          Product: p["Product"],
          Quantity: qty,
          "Purchase Price": pur,
          "Shipping Cost": shp,
          "Local Cost": loc,
          "Total Cost per product": parseFloat(p["Total Cost per product"]) || (pur + shp + loc),
          "Product Weight": weight,
          "Available Weight": availW
        };
      });

      return {
        ...b,
        "Total Weight": totalWeight,
        "Available Weight": availableWeight,
        Products: products
      };
    } catch (e) {
      console.error("getBatchById fallback triggered");
    }
  }

  // Fallback
  const b = memBatches.find(bat => bat.id === batchId);
  if (!b) return null;

  let totWeight = 0;
  let availWeight = 0;

  const itemsMapped = b.items.map(item => {
    const totItemWeight = (PRODUCT_WEIGHTS[item.productName] || 0) * item.quantity / 1000;
    
    // Calculate consumed weight for this batch-product from flat memOrders
    const consumedOrders = memOrders.filter(
      ord => ord.batchId === b.id && ord.productName.toLowerCase().trim() === item.productName.toLowerCase().trim()
    );
    const weightConsumed = consumedOrders.reduce((sum, o) => {
      const itemW = PRODUCT_WEIGHTS[o.productName] || 0;
      return sum + (itemW * o.quantity / 1000);
    }, 0);

    const availableItemWeight = Math.max(0, totItemWeight - weightConsumed);
    totWeight += totItemWeight;
    availWeight += availableItemWeight;

    return {
      Product: item.productName,
      Quantity: item.quantity,
      "Purchase Price": item.purchasePrice,
      "Shipping Cost": item.shippingPrice,
      "Local Cost": item.localCost,
      "Total Cost per product": item.totalCost,
      "Product Weight": totItemWeight,
      "Available Weight": availableItemWeight
    };
  });

  return {
    "Import Batch ID": b.id,
    Name: b.name,
    "EGY Phone": b.egyPhone,
    "UAE Phone": b.uaePhone,
    "Passport Number": b.passportNumber,
    "Location in Egypt": b.locationEgypt,
    "Flight Dep/Des": b.flightDetails,
    "Arrival Date (UAE)": b.arrivalDate,
    Notes: b.notes,
    Status: b.status,
    "Total Weight": totWeight,
    "Available Weight": availWeight,
    Products: itemsMapped
  };
}

export async function createBatch(batchData: any): Promise<any> {
  const batchId = batchData.batchId || "BATCH" + String(memBatches.length + 1).padStart(2, "0");

  if (usePostgres) {
    try {
      await query(
        `INSERT INTO batches (id, name, egy_phone, uae_phone, passport_number, location_egypt, flight_details, arrival_date, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          egy_phone = EXCLUDED.egy_phone,
          uae_phone = EXCLUDED.uae_phone,
          passport_number = EXCLUDED.passport_number,
          location_egypt = EXCLUDED.location_egypt,
          flight_details = EXCLUDED.flight_details,
          arrival_date = EXCLUDED.arrival_date,
          status = EXCLUDED.status,
          notes = EXCLUDED.notes`,
        [batchId, batchData.name, batchData.egyPhone, batchData.uaePhone, batchData.passportNumber, batchData.locationInEgypt, batchData.flightDetails, batchData.arrivalDate, "Active", batchData.notes]
      );

      // Clear existing batch items to allow complete rebuild of edited items
      await query("DELETE FROM batch_items WHERE batch_id = $1", [batchId]);

      let totalWeight = 0;
      for (const prod of batchData.products) {
        const qty = parseFloat(prod.quantity) || 0;
        const pur = parseFloat(prod.purchasePrice) || 0;
        const shp = parseFloat(prod.shippingCost) || 0;
        const loc = parseFloat(prod.localCost) || 0;
        const tot = pur + shp + loc;
        const wtUnit = PRODUCT_WEIGHTS[prod.productName] || 0;
        const weight = (wtUnit * qty) / 1000;
        totalWeight += weight;

        await query(
          `INSERT INTO batch_items (batch_id, product_name, quantity, purchase_price, shipping_cost, local_cost, total_cost_per_product, total_weight_kg, available_weight_kg, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'Active')`,
          [batchId, prod.productName, qty, pur, shp, loc, tot, weight, weight]
        );
      }

      return { success: true, batchId, totalWeight };
    } catch (e: any) {
      console.error("Postgres createBatch failed, running fallback. Error:", e.message);
    }
  }

  // Fallback
  const idx = memBatches.findIndex(b => b.id === batchId);
  const mappedItems: BatchItemSeed[] = batchData.products.map((p: any) => {
    const qty = parseFloat(p.quantity) || 0;
    const pur = parseFloat(p.purchasePrice) || 0;
    const shp = parseFloat(p.shippingCost) || 0;
    const loc = parseFloat(p.localCost) || 0;
    return {
      productName: p.productName,
      quantity: qty,
      purchasePrice: pur,
      shippingPrice: shp,
      localCost: loc,
      totalCost: pur + shp + loc,
      status: "Active"
    };
  });

  const totalWeight = batchData.products.reduce((sum: number, p: any) => {
    const wt = PRODUCT_WEIGHTS[p.productName] || 0;
    return sum + (wt * (parseFloat(p.quantity) || 0) / 1000);
  }, 0);

  const payload: BatchSeed = {
    id: batchId,
    name: batchData.name,
    egyPhone: batchData.egyPhone,
    uaePhone: batchData.uaePhone,
    passportNumber: batchData.passportNumber,
    locationEgypt: batchData.locationInEgypt,
    flightDetails: batchData.flightDetails,
    arrivalDate: batchData.arrivalDate,
    status: "Active",
    notes: batchData.notes,
    items: mappedItems
  };

  if (idx !== -1) {
    memBatches[idx] = payload;
  } else {
    memBatches.push(payload);
  }

  return { success: true, batchId, totalWeight };
}

export async function updateBatch(batchId: string, batchData: any): Promise<any> {
  // Directly reuse createBatch with the same ID, since it uses an ON CONFLICT logic in Postgres and replaces memory matching entries in Fallback!
  return await createBatch({ ...batchData, batchId });
}

export async function updateBatchWeight(batchId: string, productName: string, weightChange: number): Promise<boolean> {
  if (usePostgres) {
    try {
      const res = await query(
        `UPDATE batch_items 
         SET available_weight_kg = GREATEST(0, available_weight_kg + $1)
         WHERE batch_id = $2 AND LOWER(TRIM(product_name)) = LOWER(TRIM($3))
         RETURNING available_weight_kg`,
        [weightChange, batchId, productName]
      );
      if (res.rows.length > 0) {
        // Dynamically update status if weight drops to empty
        const available = parseFloat(res.rows[0].available_weight_kg) || 0;
        const status = available > 0 ? "Active" : "Out of Stock";
        await query("UPDATE batch_items SET status = $1 WHERE batch_id = $2 AND LOWER(TRIM(product_name)) = LOWER(TRIM($3))", [status, batchId, productName]);
        return true;
      }
      return false;
    } catch (e) {
      console.error("updateBatchWeight fallback triggered");
    }
  }

  // Fallback
  const b = memBatches.find(bat => bat.id === batchId);
  if (b) {
    const p = b.items.find(item => item.productName.toLowerCase().trim() === productName.toLowerCase().trim());
    if (p) {
      // In flat mock, weights are evaluated on-demand from SEED list of orders
      return true;
    }
  }
  return false;
}

export async function deleteBatch(batchId: string): Promise<any> {
  if (usePostgres) {
    try {
      const delItems = await query("DELETE FROM batch_items WHERE batch_id = $1", [batchId]);
      const res = await query("DELETE FROM batches WHERE id = $1", [batchId]);
      return { success: true, deletedRows: res.rowCount };
    } catch (e) {
      console.error("deleteBatch fallback triggered");
    }
  }

  const idx = memBatches.findIndex(b => b.id === batchId);
  if (idx !== -1) {
    memBatches.splice(idx, 1);
    return { success: true, deletedRows: 1 };
  }
  return { success: false, deletedRows: 0 };
}

export async function getAllBatchIds(): Promise<string[]> {
  if (usePostgres) {
    try {
      const res = await query("SELECT id FROM batches ORDER BY id DESC");
      return res.rows.map(r => r.id);
    } catch (e) {
      console.log("getAllBatchIds fallback");
    }
  }
  return memBatches.map(b => b.id).sort((a,b) => b.localeCompare(a));
}

export async function getActiveBatchIds(): Promise<string[]> {
  if (usePostgres) {
    try {
      const res = await query("SELECT id FROM batches WHERE status = 'Active' ORDER BY id DESC");
      return res.rows.map(r => r.id);
    } catch (e) {
      console.log("getActiveBatchIds fallback");
    }
  }
  return memBatches.filter(b => b.status === "Active").map(b => b.id).sort((a,b) => b.localeCompare(a));
}

export async function getBatchIdsWithStatus(): Promise<any[]> {
  const allBatches = await getBatches();
  return allBatches.map(b => ({
    batchId: b["Import Batch ID"],
    status: b["Status"],
    totalWeight: b["Total Weight"],
    availableWeight: b["Available Weight"]
  }));
}

export async function getActiveProductsFromBatch(batchId: string): Promise<any[]> {
  const b = await getBatchById(batchId);
  if (!b) return [];
  return b.Products.map((p: any) => ({
    product: p.Product,
    costPrice: p["Total Cost per product"] || (p["Purchase Price"] + p["Shipping Cost"] + p["Local Cost"]),
    quantity: p.Quantity,
    availableQuantity: p.Quantity, // fallback max
    weightPerUnit: PRODUCT_WEIGHTS[p.Product] || 0,
    availableWeight: p["Available Weight"],
    totalWeight: p["Product Weight"]
  }));
}

export async function getProductsForNewOrder(): Promise<any[]> {
  // Aggregate available products from active batches
  const allBatches = await getBatches();
  const productsMap: Record<string, any> = {};

  for (const b of allBatches) {
    if (b.Status !== "Active") continue;
    for (const p of b.Products) {
      const pName = p.Product;
      const weightUnit = PRODUCT_WEIGHTS[pName] || 0;
      const avQuantityStr = weightUnit > 0 ? String(Math.floor((p["Available Weight"] * 1000) / weightUnit)) : "0";
      const avQuantity = parseInt(avQuantityStr) || 0;

      if (avQuantity <= 0) continue;

      if (!productsMap[pName]) {
        productsMap[pName] = {
          product: pName,
          costPrice: p["Total Cost per product"],
          quantity: p.Quantity,
          availableQuantity: avQuantity,
          weightPerUnit: weightUnit,
          availableWeight: p["Available Weight"],
          totalWeight: p["Product Weight"],
          batches: [b["Import Batch ID"]]
        };
      } else {
        productsMap[pName].quantity += p.Quantity;
        productsMap[pName].availableQuantity += avQuantity;
        productsMap[pName].availableWeight += p["Available Weight"];
        productsMap[pName].totalWeight += p["Product Weight"];
        productsMap[pName].batches.push(b["Import Batch ID"]);
      }
    }
  }

  return Object.values(productsMap);
}

/* ==========================================================================
   ORDERS REPOSITORY
   ========================================================================== */

export async function getOrders(
  startDate?: string, 
  endDate?: string, 
  batchId?: string, 
  deliveryStatus?: string, 
  paymentStatus?: string
): Promise<any[]> {
  if (usePostgres) {
    try {
      let q = `
        SELECT 
          o.id AS "Order ID",
          TO_CHAR(o.order_date, 'YYYY-MM-DD') AS "Order Date",
          o.customer_id AS "Customer ID",
          c.name AS "Customer Name (Auto)",
          c.phone AS "Customer Phone (Auto)",
          c.location AS "Customer Location (Auto)",
          oi.product_name AS "Product",
          oi.quantity AS "Quantity",
          oi.unit_price AS "Unit Price",
          oi.cost_price AS "Cost Price",
          oi.total_sale AS "Total Sale",
          oi.total_cost AS "Total Cost",
          oi.profit AS "Profit",
          o.delivery_status AS "Delivery Status",
          o.payment_status AS "Payment Status",
          oi.batch_id AS "Import Batch ID",
          oi.notes AS "Notes"
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN customers c ON c.id = o.customer_id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCounter = 1;

      if (startDate && endDate) {
        q += ` AND o.order_date >= $${paramCounter} AND o.order_date <= $${paramCounter + 1}`;
        params.push(startDate, endDate);
        paramCounter += 2;
      }

      if (batchId && batchId !== "all") {
        q += ` AND oi.batch_id = $${paramCounter}`;
        params.push(batchId);
        paramCounter++;
      }

      if (deliveryStatus && deliveryStatus !== "all") {
        q += ` AND o.delivery_status = $${paramCounter}`;
        params.push(deliveryStatus);
        paramCounter++;
      }

      if (paymentStatus && paymentStatus !== "all") {
        q += ` AND o.payment_status = $${paramCounter}`;
        params.push(paymentStatus);
        paramCounter++;
      }

      q += " ORDER BY o.order_date DESC, o.id DESC";

      const res = await query(q, params);
      return res.rows.map(item => ({
        ...item,
        Quantity: parseFloat(item["Quantity"]),
        "Unit Price": parseFloat(item["Unit Price"]),
        "Cost Price": parseFloat(item["Cost Price"]),
        "Total Sale": parseFloat(item["Total Sale"]),
        "Total Cost": parseFloat(item["Total Cost"]),
        Profit: parseFloat(item["Profit"])
      }));
    } catch (e) {
      console.error("getOrders postgres fallback triggered");
    }
  }

  // Fallback flat simulation
  let filtered = [...memOrders];

  if (startDate && endDate) {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    filtered = filtered.filter(o => {
      const d = new Date(o.orderDate).getTime();
      return d >= s && d <= e;
    });
  }

  if (batchId && batchId !== "all") {
    filtered = filtered.filter(o => o.batchId === batchId);
  }

  if (deliveryStatus && deliveryStatus !== "all") {
    filtered = filtered.filter(o => o.deliveryStatus === deliveryStatus);
  }

  if (paymentStatus && paymentStatus !== "all") {
    filtered = filtered.filter(o => o.paymentStatus === paymentStatus);
  }

  return filtered.map(o => ({
    "Order ID": o.orderId,
    "Order Date": o.orderDate,
    "Customer ID": o.customerId,
    "Customer Name (Auto)": o.customerName,
    "Customer Phone (Auto)": o.customerPhone,
    "Customer Location (Auto)": o.customerLocation,
    Product: o.productName,
    Quantity: o.quantity,
    "Unit Price": o.unitPrice,
    "Cost Price": o.costPrice,
    "Total Sale": o.totalSale,
    "Total Cost": o.totalCost,
    Profit: o.profit,
    "Delivery Status": o.deliveryStatus,
    "Payment Status": o.paymentStatus,
    "Import Batch ID": o.batchId,
    Notes: `Weight consumed: ${((PRODUCT_WEIGHTS[o.productName] || 0) * o.quantity / 1000).toFixed(3)} KG`
  })).sort((a, b) => new Date(b["Order Date"]).getTime() - new Date(a["Order Date"]).getTime());
}

export async function getOrderById(orderId: string): Promise<any | null> {
  if (usePostgres) {
    try {
      const res = await query(`
        SELECT 
          o.id AS "Order ID",
          TO_CHAR(o.order_date, 'YYYY-MM-DD') AS "Order Date",
          o.customer_id AS "Customer ID",
          c.name AS "Customer Name (Auto)",
          c.phone AS "Customer Phone (Auto)",
          c.location AS "Customer Location (Auto)",
          oi.product_name AS "Product",
          oi.quantity AS "Quantity",
          oi.unit_price AS "Unit Price",
          oi.cost_price AS "Cost Price",
          oi.total_sale AS "Total Sale",
          oi.total_cost AS "Total Cost",
          oi.profit AS "Profit",
          o.delivery_status AS "Delivery Status",
          o.payment_status AS "Payment Status",
          oi.batch_id AS "Import Batch ID",
          oi.notes AS "Notes"
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN customers c ON c.id = o.customer_id
        WHERE o.id = $1
      `, [orderId]);

      if (res.rows.length === 0) return null;
      const item = res.rows[0];

      return {
        ...item,
        Quantity: parseFloat(item["Quantity"]),
        "Unit Price": parseFloat(item["Unit Price"]),
        "Cost Price": parseFloat(item["Cost Price"]),
        "Total Sale": parseFloat(item["Total Sale"]),
        "Total Cost": parseFloat(item["Total Cost"]),
        Profit: parseFloat(item["Profit"])
      };
    } catch (e) {
      console.error("getOrderById fallback triggered");
    }
  }

  const o = memOrders.find(ord => ord.orderId === orderId);
  if (!o) return null;

  return {
    "Order ID": o.orderId,
    "Order Date": o.orderDate,
    "Customer ID": o.customerId,
    "Customer Name (Auto)": o.customerName,
    "Customer Phone (Auto)": o.customerPhone,
    "Customer Location (Auto)": o.customerLocation,
    Product: o.productName,
    Quantity: o.quantity,
    "Unit Price": o.unitPrice,
    "Cost Price": o.costPrice,
    "Total Sale": o.totalSale,
    "Total Cost": o.totalCost,
    Profit: o.profit,
    "Delivery Status": o.deliveryStatus,
    "Payment Status": o.paymentStatus,
    "Import Batch ID": o.batchId,
    Notes: `Weight consumed: ${((PRODUCT_WEIGHTS[o.productName] || 0) * o.quantity / 1000).toFixed(3)} KG`
  };
}

export async function createOrder(orderData: any): Promise<any> {
  const orderId = orderData.orderId || "ORD" + String(Date.now()).substring(8);
  
  // 1. Ensure customer exists first!
  await ensureCustomer({
    id: orderData.customerId,
    name: orderData.customerName,
    phone: orderData.customerPhone,
    location: orderData.customerLocation
  });

  if (usePostgres) {
    try {
      await query(
        `INSERT INTO orders (id, order_date, customer_id, delivery_status, payment_status, notes)
         VALUES ($1, $2, $3, $4, $5, '')
         ON CONFLICT (id) DO UPDATE SET
           order_date = EXCLUDED.order_date,
           customer_id = EXCLUDED.customer_id,
           delivery_status = EXCLUDED.delivery_status,
           payment_status = EXCLUDED.payment_status`,
        [orderId, orderData.orderDate, orderData.customerId, orderData.deliveryStatus, orderData.paymentStatus]
      );

      // Clean old order items to avoid duplication on edits
      await query("DELETE FROM order_items WHERE order_id = $1", [orderId]);

      // Cumulative running revenue of this transaction to log to balance ledger if paid
      let paidRevenueTotal = 0;

      for (const prod of orderData.products) {
        const qty = parseFloat(prod.quantity) || 0;
        const uPrice = parseFloat(prod.unitPrice) || 0;
        const cPrice = parseFloat(prod.costPrice) || 0;
        const totSale = qty * uPrice;
        const totCost = qty * cPrice;
        const profit = totSale - totCost;

        if (orderData.paymentStatus === "Paid") {
          paidRevenueTotal += totSale;
        }

        await query(
          `INSERT INTO order_items (order_id, batch_id, product_name, quantity, unit_price, cost_price, total_sale, total_cost, profit, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '')`,
          [orderId, prod.batchId, prod.productName, qty, uPrice, cPrice, totSale, totCost, profit]
        );

        // Deduct available stock weight from batch configuration dynamically!
        const weightDelta = (PRODUCT_WEIGHTS[prod.productName] || 0) * qty / 1000;
        await updateBatchWeight(prod.batchId, prod.productName, -weightDelta);
      }

      // If order is paid, make a record in Balance sheet ledger!
      if (orderData.paymentStatus === "Paid" && paidRevenueTotal > 0) {
        const balId = "BAL" + String(Date.now()).substring(9);
        await createBalanceTransaction({
          transactionId: balId,
          date: orderData.orderDate,
          type: "Income",
          details: `Order Payment for ${orderId} (${orderData.customerName})`,
          amount: paidRevenueTotal,
          note: `Revenue from database transactional order.`
        });
      }

      return { success: true, orderId };
    } catch (e: any) {
      console.error("Postgres createOrder failed. falling back. Error:", e.message);
    }
  }

  // Fallback dynamic flat state
  // Clean old matching rows if editing
  memOrders = memOrders.filter(o => o.orderId !== orderId);

  let paidRevenueTotal = 0;
  for (const prod of orderData.products) {
    const qty = parseFloat(prod.quantity) || 0;
    const uPrice = parseFloat(prod.unitPrice) || 0;
    const cPrice = parseFloat(prod.costPrice) || 0;
    const totSale = qty * uPrice;
    const totCost = qty * cPrice;
    const profit = totSale - totCost;

    if (orderData.paymentStatus === "Paid") {
      paidRevenueTotal += totSale;
    }

    memOrders.push({
      orderId,
      orderDate: orderData.orderDate,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerLocation: orderData.customerLocation,
      productName: prod.productName,
      quantity: qty,
      unitPrice: uPrice,
      costPrice: cPrice,
      totalSale: totSale,
      totalCost: totCost,
      profit: profit,
      deliveryStatus: orderData.deliveryStatus,
      paymentStatus: orderData.paymentStatus,
      batchId: prod.batchId
    });
  }

  if (orderData.paymentStatus === "Paid" && paidRevenueTotal > 0) {
    const balId = "BAL" + String(Date.now()).substring(9);
    memBalance.push({
      id: balId,
      date: orderData.orderDate,
      type: "Income",
      details: `Order Payment for ${orderId} (${orderData.customerName})`,
      amount: paidRevenueTotal,
      balance: (memBalance[memBalance.length - 1]?.balance || 0) + paidRevenueTotal,
      note: `Cumulative ledger transaction.`
    });
  }

  return { success: true, orderId };
}

export async function updateOrder(orderId: string, orderData: any): Promise<any> {
  // To handle fully robust updates, we can restore previous order item weights, delete, and re-create!
  const prev = await getOrderById(orderId);
  if (prev) {
    // Restore prev weights delta
    const prevWeight = (PRODUCT_WEIGHTS[prev.Product] || 0) * prev.Quantity / 1000;
    await updateBatchWeight(prev["Import Batch ID"], prev.Product, prevWeight);
  }

  // Standard Apps Script structure wraps flat updates for editing.
  // Translating incoming flat order payload to relational structures
  const productsList = [{
    productName: orderData.Product,
    quantity: orderData.Quantity,
    unitPrice: orderData["Unit Price"],
    costPrice: orderData["Cost Price"],
    batchId: orderData["Import Batch ID"]
  }];

  const fullOrderObj = {
    orderId,
    orderDate: orderData["Order Date"],
    customerId: orderData["Customer ID"],
    customerName: orderData["Customer Name (Auto)"],
    customerPhone: orderData["Customer Phone (Auto)"],
    customerLocation: orderData["Customer Location (Auto)"],
    deliveryStatus: orderData["Delivery Status"],
    paymentStatus: orderData["Payment Status"],
    products: productsList
  };

  return await createOrder(fullOrderObj);
}

export async function deleteOrder(orderId: string): Promise<any> {
  const prevList = await getOrders();
  const matched = prevList.filter(o => o["Order ID"] === orderId);

  // Restore inventory stock weights to corresponding batches
  for (const item of matched) {
    const weightToRestore = (PRODUCT_WEIGHTS[item.Product] || 0) * item.Quantity / 1000;
    await updateBatchWeight(item["Import Batch ID"], item.Product, weightToRestore);
  }

  if (usePostgres) {
    try {
      const res = await query("DELETE FROM orders WHERE id = $1", [orderId]);
      return { success: true, deletedRows: res.rowCount };
    } catch (e) {
      console.error("deleteOrder fallback triggered");
    }
  }

  memOrders = memOrders.filter(o => o.orderId !== orderId);
  return { success: true, deletedRows: matched.length };
}

/* ==========================================================================
   EXPENSES & DISTRIBUTIONS REPOSITORY
   ========================================================================== */

export async function getExpenses(startDate?: string, endDate?: string, expenseType?: string): Promise<any[]> {
  if (usePostgres) {
    try {
      let q = `
        SELECT 
          id AS "Expense ID",
          TO_CHAR(date, 'YYYY-MM-DD') AS "Date",
          type AS "Type",
          category AS "Category",
          description AS "Description",
          amount AS "Amount",
          payment_method AS "Payment Method",
          receipt_reference AS "Receipt/Reference",
          notes AS "Notes"
        FROM expenses
        WHERE 1=1
      `;
      const params: any[] = [];
      let counter = 1;

      if (startDate && endDate) {
        q += ` AND date >= $${counter} AND date <= $${counter + 1}`;
        params.push(startDate, endDate);
        counter += 2;
      }

      if (expenseType && expenseType !== "all") {
        q += ` AND type = $${counter}`;
        params.push(expenseType);
        counter++;
      }

      q += " ORDER BY date DESC, id DESC";

      const res = await query(q, params);
      return res.rows.map(r => ({
        ...r,
        Amount: parseFloat(r.Amount)
      }));
    } catch (e) {
      console.error("getExpenses fallback triggered");
    }
  }

  // Fallback
  let filtered = [...memExpenses];
  if (startDate && endDate) {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    filtered = filtered.filter(exp => {
      const d = new Date(exp.date).getTime();
      return d >= s && d <= e;
    });
  }

  if (expenseType && expenseType !== "all") {
    filtered = filtered.filter(exp => exp.type === expenseType);
  }

  return filtered.map(exp => ({
    "Expense ID": exp.id,
    Date: exp.date,
    Type: exp.type,
    Category: exp.category,
    Description: exp.description,
    Amount: exp.amount,
    "Payment Method": exp.paymentMethod,
    "Receipt/Reference": exp.reference,
    Notes: exp.notes
  })).sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
}

export async function getExpenseById(expenseId: string): Promise<any | null> {
  if (usePostgres) {
    try {
      const res = await query(`
        SELECT 
          id AS "Expense ID",
          TO_CHAR(date, 'YYYY-MM-DD') AS "Date",
          type AS "Type",
          category AS "Category",
          description AS "Description",
          amount AS "Amount",
          payment_method AS "Payment Method",
          receipt_reference AS "Receipt/Reference",
          notes AS "Notes"
        FROM expenses
        WHERE id = $1
      `, [expenseId]);
      if (res.rows.length === 0) return null;
      return {
        ...res.rows[0],
        Amount: parseFloat(res.rows[0].Amount)
      };
    } catch (e) {
      console.error("getExpenseById fallback");
    }
  }

  const exp = memExpenses.find(e => e.id === expenseId);
  if (!exp) return null;
  return {
    "Expense ID": exp.id,
    Date: exp.date,
    Type: exp.type,
    Category: exp.category,
    Description: exp.description,
    Amount: exp.amount,
    "Payment Method": exp.paymentMethod,
    "Receipt/Reference": exp.reference,
    Notes: exp.notes
  };
}

export async function createExpense(expenseData: any): Promise<any> {
  const expenseId = expenseData.expenseId || "EXP" + String(memExpenses.length + 1).padStart(4, "0");

  if (usePostgres) {
    try {
      await query(
        `INSERT INTO expenses (id, date, type, category, description, amount, payment_method, receipt_reference, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           date = EXCLUDED.date,
           type = EXCLUDED.type,
           category = EXCLUDED.category,
           description = EXCLUDED.description,
           amount = EXCLUDED.amount,
           payment_method = EXCLUDED.payment_method,
           receipt_reference = EXCLUDED.receipt_reference,
           notes = EXCLUDED.notes`,
        [expenseId, expenseData.date, expenseData.type, expenseData.category, expenseData.description, parseFloat(expenseData.amount) || 0, expenseData.paymentMethod, expenseData.reference, expenseData.notes]
      );

      // Book corresponding transaction inside actual balance ledger automatically!
      const balId = "BAL" + String(Date.now()).substring(9);
      await createBalanceTransaction({
        transactionId: balId,
        date: expenseData.date,
        type: "Expense",
        details: `Expense logged - [${expenseData.category}] ${expenseData.description}`,
        amount: parseFloat(expenseData.amount) || 0,
        note: `Auto booked from expenses module`
      });

      return { success: true, expenseId };
    } catch (e: any) {
      console.error("Postgres createExpense failed. fallback triggers. Error:", e.message);
    }
  }

  // Fallback
  const idx = memExpenses.findIndex(ex => ex.id === expenseId);
  const payload: ExpenseSeed = {
    id: expenseId,
    date: expenseData.date,
    type: expenseData.type,
    category: expenseData.category,
    description: expenseData.description,
    amount: parseFloat(expenseData.amount) || 0,
    paymentMethod: expenseData.paymentMethod || "",
    reference: expenseData.reference || "",
    notes: expenseData.notes || ""
  };

  if (idx !== -1) {
    memExpenses[idx] = payload;
  } else {
    memExpenses.push(payload);
  }

  // Auto ledger sync
  const balId = "BAL" + String(Date.now()).substring(9);
  memBalance.push({
    id: balId,
    date: expenseData.date,
    type: "Expense",
    details: `Expense logged - [${expenseData.category}] ${expenseData.description}`,
    amount: parseFloat(expenseData.amount) || 0,
    balance: (memBalance[memBalance.length - 1]?.balance || 0) - (parseFloat(expenseData.amount) || 0),
    note: "Auto booked from memory expenses."
  });

  return { success: true, expenseId };
}

export async function updateExpense(expenseId: string, expenseData: any): Promise<any> {
  const mapped = {
    expenseId,
    date: expenseData.Date,
    type: expenseData.Type,
    category: expenseData.Category,
    description: expenseData.Description,
    amount: expenseData.Amount,
    paymentMethod: expenseData["Payment Method"],
    reference: expenseData["Receipt/Reference"],
    notes: expenseData.Notes
  };
  return await createExpense(mapped);
}

export async function deleteExpense(expenseId: string): Promise<any> {
  if (usePostgres) {
    try {
      const res = await query("DELETE FROM expenses WHERE id = $1", [expenseId]);
      return { success: true, deletedRows: res.rowCount };
    } catch (e) {
      console.error("deleteExpense fallback triggered");
    }
  }

  const idx = memExpenses.findIndex(ex => ex.id === expenseId);
  if (idx !== -1) {
    memExpenses.splice(idx, 1);
    return { success: true, deletedRows: 1 };
  }
  return { success: false, deletedRows: 0 };
}

/* ==========================================================================
   BALANCE SHEET REPOSITORY (ACTUAL BALANCES)
   ========================================================================== */

export async function getBalanceTransactions(startDate?: string, endDate?: string, type?: string): Promise<any[]> {
  if (usePostgres) {
    try {
      let q = `
        SELECT 
          id AS "Transaction ID",
          TO_CHAR(date, 'YYYY-MM-DD') AS "Date",
          type AS "Type",
          details AS "Details",
          amount AS "Amount",
          balance AS "Balance",
          note AS "Note"
        FROM balance_transactions
        WHERE 1=1
      `;
      const params: any[] = [];
      let counter = 1;

      if (startDate && endDate) {
        q += ` AND date >= $${counter} AND date <= $${counter + 1}`;
        params.push(startDate, endDate);
        counter += 2;
      }

      if (type && type !== "all") {
        q += ` AND type = $${counter}`;
        params.push(type);
        counter++;
      }

      q += " ORDER BY date DESC, id DESC";

      const res = await query(q, params);
      return res.rows.map(r => ({
        ...r,
        Amount: parseFloat(r.Amount),
        Balance: parseFloat(r.Balance)
      }));
    } catch (e) {
      console.error("getBalanceTransactions fallback triggered");
    }
  }

  // Fallback
  let filtered = [...memBalance];
  if (startDate && endDate) {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    filtered = filtered.filter(b => {
      const d = new Date(b.date).getTime();
      return d >= s && d <= e;
    });
  }

  if (type && type !== "all") {
    filtered = filtered.filter(b => b.type === type);
  }

  return filtered.map(b => ({
    "Transaction ID": b.id,
    Date: b.date,
    Type: b.type,
    Details: b.details,
    Amount: b.amount,
    Balance: b.balance,
    Note: b.note
  })).sort((a,b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
}

export async function getBalanceStatistics(): Promise<any> {
  const allTrans = await getBalanceTransactions();
  
  let currentBalance = 0;
  let totalIncome = 0;
  let totalExpenses = 0;

  if (allTrans.length > 0) {
    // Current cumulative balance is the balance column of the chronologically last row!
    // Since our query sorted descending, the chronologically newest row is at index 0.
    const sortedChronological = [...allTrans].sort((a,b) => new Date(a.Date).getTime() - new Date(b.Date).getTime() || a["Transaction ID"].localeCompare(b["Transaction ID"]));
    currentBalance = sortedChronological[sortedChronological.length - 1]?.Balance || 0;
  }

  allTrans.forEach(tr => {
    if (tr.Type === "Income") {
      totalIncome += tr.Amount;
    } else if (tr.Type === "Expense") {
      totalExpenses += tr.Amount;
    }
  });

  return {
    currentBalance,
    totalIncome,
    totalExpenses,
    transactionsCount: allTrans.length,
    recentTransactions: allTrans.slice(0, 5)
  };
}

export async function generateNextBalanceId(): Promise<string> {
  const all = await getBalanceTransactions();
  let maxId = 0;
  for (const b of all) {
    if (b["Transaction ID"] && b["Transaction ID"].startsWith("BAL")) {
      const num = parseInt(b["Transaction ID"].substring(3));
      if (!isNaN(num) && num > maxId) maxId = num;
    }
  }
  return "BAL" + String(maxId + 1).padStart(4, "0");
}

export async function createBalanceTransaction(transactionData: any): Promise<any> {
  const transactionId = transactionData.transactionId || await generateNextBalanceId();
  const amount = parseFloat(transactionData.amount) || 0;

  if (usePostgres) {
    try {
      // Begin transaction to compute running balanced values accurately
      await query("BEGIN");
      
      const lastBalRes = await query("SELECT balance FROM balance_transactions ORDER BY date DESC, id DESC LIMIT 1");
      const lastBalance = lastBalRes.rows.length > 0 ? parseFloat(lastBalRes.rows[0].balance) : 0;
      
      let newBalance = lastBalance;
      if (transactionData.type === "Income") {
        newBalance += amount;
      } else {
        newBalance -= amount;
      }

      await query(
        `INSERT INTO balance_transactions (id, date, type, details, amount, balance, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           date = EXCLUDED.date,
           type = EXCLUDED.type,
           details = EXCLUDED.details,
           amount = EXCLUDED.amount,
           balance = EXCLUDED.balance,
           note = EXCLUDED.note`,
        [transactionId, transactionData.date, transactionData.type, transactionData.details, amount, newBalance, transactionData.note]
      );

      await query("COMMIT");
      return { success: true, transactionId, newBalance };
    } catch (e: any) {
      await query("ROLLBACK");
      console.error("Postgres createBalanceTransaction failed. falls back. Error:", e.message);
    }
  }

  // Fallback memory state calculation
  const idx = memBalance.findIndex(b => b.id === transactionId);
  const lastBalance = memBalance[memBalance.length - 1]?.balance || 0;
  let newBalance = lastBalance;

  if (transactionData.type === "Income") {
    newBalance += amount;
  } else {
    newBalance -= amount;
  }

  const payload: BalanceSeed = {
    id: transactionId,
    date: transactionData.date,
    type: transactionData.type,
    details: transactionData.details,
    amount: amount,
    balance: newBalance,
    note: transactionData.note || ""
  };

  if (idx !== -1) {
    memBalance[idx] = payload;
  } else {
    memBalance.push(payload);
  }

  // Sort and re-calc all memory balances chronologically
  memBalance.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id));
  let running = 0;
  memBalance.forEach(b => {
    if (b.type === "Income") {
      running += b.amount;
    } else {
      running -= b.amount;
    }
    b.balance = running;
  });

  return { success: true, transactionId, newBalance };
}

export async function deleteBalanceTransaction(transactionId: string): Promise<any> {
  if (usePostgres) {
    try {
      await query("BEGIN");
      await query("DELETE FROM balance_transactions WHERE id = $1", [transactionId]);
      
      // Recalculate subsequent running balances in Postgres chronologically!
      const rowsRes = await query("SELECT id, type, amount FROM balance_transactions ORDER BY date ASC, id ASC");
      let runningBalance = 0;
      for (const row of rowsRes.rows) {
        const amt = parseFloat(row.amount);
        if (row.type === "Income") {
          runningBalance += amt;
        } else {
          runningBalance -= amt;
        }
        await query("UPDATE balance_transactions SET balance = $1 WHERE id = $2", [runningBalance, row.id]);
      }

      await query("COMMIT");
      return { success: true, deletedRows: 1 };
    } catch (e) {
      await query("ROLLBACK");
      console.error("deleteBalanceTransaction fallback triggered");
    }
  }

  const idx = memBalance.findIndex(b => b.id === transactionId);
  if (idx !== -1) {
    memBalance.splice(idx, 1);
    // Recalculate balances
    let running = 0;
    memBalance.forEach(b => {
      if (b.type === "Income") {
        running += b.amount;
      } else {
        running -= b.amount;
      }
      b.balance = running;
    });

    return { success: true, deletedRows: 1 };
  }
  return { success: false, deletedRows: 0 };
}

/* ==========================================================================
   DASHBOARD / BI ENGINE REPOSITORY
   ========================================================================== */

export async function getDashboardData(
  startDate?: string, 
  endDate?: string, 
  batchId?: string
): Promise<any> {
  // Aggregate using all existing repo modules to match business calculations perfectly!
  const ordersList = await getOrders(startDate, endDate, batchId);
  const expensesList = await getExpenses(startDate, endDate);

  let totalSales = 0;
  let totalProfit = 0;
  let totalOrders = ordersList.length;
  let paidOrders = 0;
  let pendingOrders = 0;
  let deliveredOrders = 0;
  let pendingDelivery = 0;

  const productVolumeMap: Record<string, number> = {};
  const monthlyDataMap: Record<string, { sales: number; profit: number; expenses: number; distributions: number }> = {};
  const expenseCategoriesMap: Record<string, number> = {};
  const distributionsCategoriesMap: Record<string, number> = {};

  let totalWeightKG = 0;
  let totalOrdersWeight = 0;
  let wastedWeight = 0;
  let freeSamplesWeight = 0;

  for (const item of ordersList) {
    const isPaid = item["Payment Status"] === "Paid";
    const isDelivered = item["Delivery Status"] === "Delivered";
    const sale = item["Total Sale"] || 0;
    const profit = item["Profit"] || 0;
    const qty = item["Quantity"] || 0;
    const pName = item["Product"] || "";
    const notesStr = (item["Notes"] || "").toLowerCase();

    if (isPaid) {
      totalSales += sale;
      totalProfit += profit;
      paidOrders++;
    } else {
      pendingOrders++;
    }

    if (isDelivered) {
      deliveredOrders++;
    } else {
      pendingDelivery++;
    }

    // Weight calculations
    const itemWeightGrams = PRODUCT_WEIGHTS[pName] || 0;
    const itemWeightKG = (itemWeightGrams * qty) / 1000;

    if (isPaid) {
      totalWeightKG += itemWeightKG;
      totalOrdersWeight++;
    }

    // Wasted weight calculation ONLY for customers CUST0001 and CUST0002
    if (item["Customer ID"] === "CUST0001" || item["Customer ID"] === "CUST0002") {
      wastedWeight += itemWeightKG;
    }

    // Free sample weight calculation
    const isFreeSample = (item["Unit Price"] === 0 && sale === 0) || 
                         notesStr.includes("sample") || 
                         (notesStr.includes("free") && !notesStr.includes("wasted"));
    if (isFreeSample && (item["Customer ID"] !== "CUST0001" && item["Customer ID"] !== "CUST0002")) {
      freeSamplesWeight += itemWeightKG;
    }

    // Top products by volume
    if (pName) {
      productVolumeMap[pName] = (productVolumeMap[pName] || 0) + qty;
    }

    // Group sales and profit by Month Trend
    const dateObj = new Date(item["Order Date"]);
    if (isPaid && !isNaN(dateObj.getTime())) {
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { sales: 0, profit: 0, expenses: 0, distributions: 0 };
      }
      monthlyDataMap[monthKey].sales += sale;
      monthlyDataMap[monthKey].profit += profit;
    }
  }

  // Handle expenses & profit distributions
  let totalExpensesVal = 0;
  let totalDistributionsVal = 0;

  for (const exp of expensesList) {
    const amt = exp.Amount || 0;
    if (exp.Type === "Expense") {
      totalExpensesVal += amt;
      expenseCategoriesMap[exp.Category] = (expenseCategoriesMap[exp.Category] || 0) + amt;
    } else if (exp.Type === "Profit Distribution") {
      totalDistributionsVal += amt;
      distributionsCategoriesMap[exp.Category] = (distributionsCategoriesMap[exp.Category] || 0) + amt;
    }

    const dateObj = new Date(exp.Date);
    if (!isNaN(dateObj.getTime())) {
      const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyDataMap[monthKey]) {
        monthlyDataMap[monthKey] = { sales: 0, profit: 0, expenses: 0, distributions: 0 };
      }
      if (exp.Type === "Expense") {
        monthlyDataMap[monthKey].expenses += amt;
      } else {
        monthlyDataMap[monthKey].distributions += amt;
      }
    }
  }

  // Format collections for D3 structures
  const monthlyTrendArray = Object.keys(monthlyDataMap)
    .sort()
    .map(k => ({
      month: k,
      sales: Math.round(monthlyDataMap[k].sales * 100) / 100,
      profit: Math.round(monthlyDataMap[k].profit * 100) / 100,
      expenses: Math.round(monthlyDataMap[k].expenses * 100) / 100,
      profitDistributions: Math.round(monthlyDataMap[k].distributions * 100) / 100
    }));

  const topProductsArray = Object.entries(productVolumeMap)
    .map(([name, volume]) => ({ name, volume }))
    .sort((a,b) => b.volume - a.volume)
    .slice(0, 5);

  const expenseCategoriesArray = Object.entries(expenseCategoriesMap)
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
    .sort((a,b) => b.amount - a.amount);

  const profitDistMapArray = Object.entries(distributionsCategoriesMap)
    .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))
    .sort((a,b) => b.amount - a.amount);

  // Available Weight & Import statistics
  const bList = await getBatches();
  let totalImportedWeight = 0;

  for (const b of bList) {
    if (batchId && batchId !== "all" && b["Import Batch ID"] !== batchId) continue;
    totalImportedWeight += b["Total Weight"] || 0;
  }

  // Calculate dynamic stock remainder matching imports minus outflows
  const totalWastedAndSampleWeight = wastedWeight + freeSamplesWeight;
  const availableWeightTotal = Math.max(0, totalImportedWeight - totalWeightKG - totalWastedAndSampleWeight);

  const balanceStatsValue = await getBalanceStatistics();
  
  // Pivot calculations directly to general ledger flows
  const totalSalesLedger = balanceStatsValue.totalIncome;
  const totalExpensesLedger = balanceStatsValue.totalExpenses;
  const netProfit = totalSalesLedger - totalExpensesLedger;
  const distributableProfit = netProfit;

  return {
    totalSales: Math.round(totalSalesLedger * 100) / 100,
    grossProfit: Math.round(totalProfit * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    currentBalance: Math.round(balanceStatsValue.currentBalance * 100) / 100,
    distributableProfit: Math.round(distributableProfit * 100) / 100,
    totalExpenses: Math.round(totalExpensesLedger * 100) / 100,
    totalProfitDistributions: 0,
    totalOrders,
    totalOrdersWeight,
    totalWeightKG: Math.round(totalWeightKG * 100) / 100,
    availableWeightTotal: Math.round(availableWeightTotal * 100) / 100,
    wastedWeight: Math.round(wastedWeight * 100) / 100,
    freeSamplesWeight: Math.round(freeSamplesWeight * 100) / 100,
    totalWastedAndSamples: Math.round(totalWastedAndSampleWeight * 100) / 100,
    totalImportedWeight: Math.round(totalImportedWeight * 100) / 100,
    avgWeightPerOrder: totalOrdersWeight > 0 ? Math.round((totalWeightKG / totalOrdersWeight) * 100) / 100 : 0,
    avgOrderValue: paidOrders > 0 ? Math.round((totalSalesLedger / paidOrders) * 100) / 100 : 0,
    grossProfitMargin: totalSalesLedger > 0 ? Math.round((totalProfit / totalSalesLedger) * 100 * 100) / 100 : 0,
    netProfitMargin: totalSalesLedger > 0 ? Math.round((netProfit / totalSalesLedger) * 100 * 100) / 100 : 0,
    wastedMargin: totalImportedWeight > 0 ? Math.round((totalWastedAndSampleWeight / totalImportedWeight) * 100 * 100) / 100 : 0,
    paidOrders,
    pendingOrders,
    deliveredOrders,
    pendingDelivery,
    monthlyTrend: monthlyTrendArray,
    topProductsByVolume: topProductsArray,
    expenseCategories: expenseCategoriesArray,
    profitDistributionTypes: profitDistMapArray,
    appliedBatchFilter: batchId || "all"
  };
}

export function getExpenseCategories(): string[] {
  return [
    "Rent",
    "Utilities",
    "Salaries",
    "Marketing",
    "Transportation",
    "Supplies",
    "Maintenance",
    "Insurance",
    "Taxes",
    "Other"
  ];
}

export function getProfitDistributionCategories(): string[] {
  return [
    "Owner Salary",
    "Partner Distribution",
    "Reinvestment",
    "Bonus",
    "Charity",
    "Other Distribution"
  ];
}
