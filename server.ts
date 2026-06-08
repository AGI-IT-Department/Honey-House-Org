import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Import core DB repository operations
import {
  initDb,
  getDashboardData,
  getAllCustomers,
  searchCustomers,
  getCustomerById,
  updateCustomer,
  getBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchIdsWithStatus,
  getActiveProductsFromBatch,
  getProductsForNewOrder,
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  getProfitDistributionCategories,
  getBalanceTransactions,
  getBalanceStatistics,
  createBalanceTransaction,
  deleteBalanceTransaction,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  isUsingPostgres,
  getDbError
} from "./src/db/db.js";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Essential Middlewares
  app.use(express.json());

  // Log all request transactions
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Run schema migration & seed database
  try {
    await initDb();
  } catch (err: any) {
    console.error("Database startup failed. Fallback to Memory will handle interactions.", err.message);
  }

  /* ==========================================================================
     API ROUTES - PREFIX '/api'
     ========================================================================== */

  // 0. Database Status Endpoint
  app.get("/api/db-status", (req, res) => {
    res.json({
      usePostgres: isUsingPostgres(),
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      dbError: getDbError()
    });
  });

  // 1. Dashboard BI Metrics
  app.get("/api/dashboard", async (req, res) => {
    try {
      const { startDate, endDate, batchId } = req.query;
      const data = await getDashboardData(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined,
        batchId ? String(batchId) : undefined
      );
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 2. Customers Endpoints
  app.get("/api/customers", async (req, res) => {
    try {
      const list = await getAllCustomers();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/customers/search", async (req, res) => {
    try {
      const { query } = req.query;
      const list = await searchCustomers(query ? String(query) : "");
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const details = await getCustomerById(req.params.id);
      if (!details) {
        res.status(404).json({ success: false, error: "Customer not found" });
        return;
      }
      res.json(details);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const result = await updateCustomer(req.params.id, req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 2.5. Product Catalog Endpoints
  app.get("/api/products", async (req, res) => {
    try {
      const products = await getProducts();
      res.json(products);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const result = await createProduct(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/products/:name", async (req, res) => {
    try {
      const result = await updateProduct(req.params.name, req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/products/:name", async (req, res) => {
    try {
      const result = await deleteProduct(req.params.name);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 3. Batches Endpoints
  app.get("/api/batches", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const list = await getBatches(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined
      );
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/batches/status-list", async (req, res) => {
    try {
      const list = await getBatchIdsWithStatus();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/batches/products/new-order", async (req, res) => {
    try {
      const list = await getProductsForNewOrder();
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/batches/:id", async (req, res) => {
    try {
      const batch = await getBatchById(req.params.id);
      if (!batch) {
        res.status(404).json({ success: false, error: "Batch not found" });
        return;
      }
      res.json(batch);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/batches/:id/products", async (req, res) => {
    try {
      const products = await getActiveProductsFromBatch(req.params.id);
      res.json(products);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/batches", async (req, res) => {
    try {
      const result = await createBatch(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/batches/:id", async (req, res) => {
    try {
      const result = await updateBatch(req.params.id, req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/batches/:id", async (req, res) => {
    try {
      const result = await deleteBatch(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 4. Orders Endpoints
  app.get("/api/orders", async (req, res) => {
    try {
      const { startDate, endDate, batchId, deliveryStatus, paymentStatus } = req.query;
      const list = await getOrders(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined,
        batchId ? String(batchId) : undefined,
        deliveryStatus ? String(deliveryStatus) : undefined,
        paymentStatus ? String(paymentStatus) : undefined
      );
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await getOrderById(req.params.id);
      if (!order) {
        res.status(404).json({ success: false, error: "Order not found" });
        return;
      }
      res.json(order);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const result = await createOrder(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const result = await updateOrder(req.params.id, req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const result = await deleteOrder(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 5. Expenses / Distributions Endpoints
  app.get("/api/expenses", async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      const list = await getExpenses(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined,
        type ? String(type) : undefined
      );
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/expenses/categories", (req, res) => {
    res.json(getExpenseCategories());
  });

  app.get("/api/expenses/distribution-categories", (req, res) => {
    res.json(getProfitDistributionCategories());
  });

  app.get("/api/expenses/:id", async (req, res) => {
    try {
      const exp = await getExpenseById(req.params.id);
      if (!exp) {
        res.status(404).json({ success: false, error: "Expense record not found" });
        return;
      }
      res.json(exp);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const result = await createExpense(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const result = await updateExpense(req.params.id, req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const result = await deleteExpense(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 6. Running Balance Sheet Transactions
  app.get("/api/balance/stats", async (req, res) => {
    try {
      const stats = await getBalanceStatistics();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get("/api/balance/transactions", async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      const list = await getBalanceTransactions(
        startDate ? String(startDate) : undefined,
        endDate ? String(endDate) : undefined,
        type ? String(type) : undefined
      );
      res.json(list);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post("/api/balance/transactions", async (req, res) => {
    try {
      const result = await createBalanceTransaction(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.delete("/api/balance/transactions/:id", async (req, res) => {
    try {
      const result = await deleteBalanceTransaction(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  /* ==========================================================================
     VITE FRONTEND STATIC AND HMR ROUTING MIDDLEWARE
     ========================================================================== */

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Listen exclusively
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Honey House Engine] Full stack application loaded. Binding port ${PORT}.`);
    console.log(`Point your browser to http://localhost:${PORT}`);
  });
}

startServer();
