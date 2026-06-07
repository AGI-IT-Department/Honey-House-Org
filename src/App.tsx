import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Wallet,
  Users,
  Search,
  Plus,
  Trash2,
  Filter,
  CheckCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  X,
  RotateCcw,
  Sparkles,
  Info,
  Scale,
  Edit2
} from "lucide-react";

// Product weight mapping in grams for frontend UI calculation
const PRODUCT_WEIGHTS: Record<string, number> = {
  "Honey 250g": 250,
  "Honey 500g": 500,
  "Honey 1kg": 1000,
  "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)": 500,
  "beeswax 500g": 500,
  "Energy Package (750g + Pollen + Royal Jelly)": 750,
  "Honey (Squeeze 250g)": 250,
  "Honey (Squeeze 500g)": 500
};

// Types corresponding to backend/db properties
interface Customer {
  "Customer ID": string;
  "Customer Name": string;
  "Customer Phone": string;
  "Customer Location": string;
  "Order Count": number;
  "Total Spent": number;
}

interface OrderItem {
  "Order ID": string;
  "Order Date": string;
  "Customer ID": string;
  "Customer Name (Auto)": string;
  "Customer Phone (Auto)": string;
  "Customer Location (Auto)": string;
  "Product": string;
  "Quantity": number;
  "Unit Price": number;
  "Cost Price": number;
  "Total Sale": number;
  "Total Cost": number;
  "Profit": number;
  "Delivery Status": string;
  "Payment Status": string;
  "Import Batch ID": string;
  "Notes": string;
}

interface BatchProduct {
  Product: string;
  Quantity: number;
  "Purchase Price": number;
  "Shipping Cost": number;
  "Local Cost": number;
  "Total Cost per product": number;
  "Product Weight": number;
  "Available Weight": number;
}

interface Batch {
  "Import Batch ID": string;
  Name: string;
  "EGY Phone": string;
  "UAE Phone": string;
  "Passport Number": string;
  "Location in Egypt": string;
  "Flight Dep/Des": string;
  "Arrival Date (UAE)": string;
  Notes: string;
  Status: string;
  "Total Weight": number;
  "Available Weight": number;
  Products: BatchProduct[];
}

interface Expense {
  "Expense ID": string;
  Date: string;
  Type: string;
  Category: string;
  Description: string;
  Amount: number;
  "Payment Method": string;
  "Receipt/Reference": string;
  Notes: string;
}

interface BalanceTransaction {
  "Transaction ID": string;
  Date: string;
  Type: string;
  Details: string;
  Amount: number;
  Balance: number;
  Note: string;
}

interface DashboardData {
  totalSales: number;
  grossProfit: number;
  netProfit: number;
  currentBalance: number;
  distributableProfit: number;
  totalExpenses: number;
  totalProfitDistributions: number;
  totalOrders: number;
  totalOrdersWeight: number;
  totalWeightKG: number;
  availableWeightTotal: number;
  wastedWeight: number;
  freeSamplesWeight: number;
  totalWastedAndSamples: number;
  totalImportedWeight: number;
  avgWeightPerOrder: number;
  avgOrderValue: number;
  grossProfitMargin: number;
  netProfitMargin: number;
  wastedMargin: number;
  paidOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  pendingDelivery: number;
  monthlyTrend: Array<{
    month: string;
    sales: number;
    profit: number;
    expenses: number;
    profitDistributions: number;
  }>;
  topProductsByVolume: Array<{ name: string; volume: number }>;
  expenseCategories: Array<{ name: string; amount: number }>;
  profitDistributionTypes: Array<{ name: string; amount: number }>;
}

export default function App() {
  const [page, setPage] = useState<"dashboard" | "orders" | "batches" | "balance" | "customers">("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Navigation Tabs
  const [ordersTab, setOrdersTab] = useState<"view" | "create">("view");
  const [batchesTab, setBatchesTab] = useState<"view" | "create">("view");
  const [balanceTab, setBalanceTab] = useState<"balance" | "expenses" | "add-expense">("balance");

  // Notifications Toast State
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "danger" | "warning" | "info" }>>([]);

  // Filter values
  const [dashMonth, setDashMonth] = useState("");
  const [dashBatch, setDashBatch] = useState("all");
  const [dashFrom, setDashFrom] = useState("");
  const [dashTo, setDashTo] = useState("");

  const [ordersMonth, setOrdersMonth] = useState("");
  const [ordersBatch, setOrdersBatch] = useState("all");
  const [ordersDelivery, setOrdersDelivery] = useState("all");
  const [ordersPayment, setOrdersPayment] = useState("all");
  const [ordersFrom, setOrdersFrom] = useState("");
  const [ordersTo, setOrdersTo] = useState("");

  const [batchMonth, setBatchMonth] = useState("");
  const [batchFrom, setBatchFrom] = useState("");
  const [batchTo, setBatchTo] = useState("");

  const [expMonth, setExpMonth] = useState("");
  const [expType, setExpType] = useState("all");
  const [expFrom, setExpFrom] = useState("");
  const [expTo, setExpTo] = useState("");

  const [balMonth, setBalMonth] = useState("");
  const [balType, setBalType] = useState("all");
  const [balFrom, setBalFrom] = useState("");
  const [balTo, setBalTo] = useState("");

  // Search States
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // Core Data Stores
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balanceTransactions, setBalanceTransactions] = useState<BalanceTransaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // List of active batch IDs
  const [batchIdsWithStatus, setBatchIdsWithStatus] = useState<any[]>([]);
  
  // Dropdown lists
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [distributionCategories, setDistributionCategories] = useState<string[]>([]);

  // Form parameters
  const [newOrder, setNewOrder] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerLocation: "Dubai",
    deliveryStatus: "Pending",
    paymentStatus: "Unpaid",
    orderDate: new Date().toISOString().split("T")[0],
    products: [{ productName: "", quantity: 1, unitPrice: 0, costPrice: 0, batchId: "", availableQuantity: 0, maxWeight: 0 }]
  });

  const [newBatch, setNewBatch] = useState({
    name: "",
    egyPhone: "",
    uaePhone: "",
    passportNumber: "",
    locationInEgypt: "",
    flightDetails: "",
    arrivalDate: new Date().toISOString().split("T")[0],
    notes: "",
    products: [{ productName: "Honey 1kg", quantity: 10, purchasePrice: 10, shippingCost: 5, localCost: 2 }]
  });

  const [newExpense, setNewExpense] = useState({
    type: "Expense",
    category: "",
    description: "",
    amount: 0,
    paymentMethod: "Cash",
    reference: "",
    notes: "",
    date: new Date().toISOString().split("T")[0]
  });

  const [newBalance, setNewBalance] = useState({
    type: "Income",
    details: "",
    amount: 0,
    note: "",
    date: new Date().toISOString().split("T")[0]
  });

  // Edit Modals states
  const [editOrderObj, setEditOrderObj] = useState<OrderItem | null>(null);
  const [editCustomerObj, setEditCustomerObj] = useState<Customer | null>(null);
  const [editBatchId, setEditBatchId] = useState<string | null>(null);
  const [customerSearchDropdown, setCustomerSearchDropdown] = useState<any[]>([]);

  // Available months cache
  const [monthsList, setMonthsList] = useState<string[]>([]);

  // Trigger toast alert
  const showToast = (message: string, type: "success" | "danger" | "warning" | "info" = "info") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // ----------------------------------------------------
  // DATA FETCHING TRIGGERS
  // ----------------------------------------------------

  const fetchDashboardData = async () => {
    try {
      let url = `/api/dashboard?dash=1`;
      if (dashMonth === "custom") {
        if (dashFrom && dashTo) url += `&startDate=${dashFrom}&endDate=${dashTo}`;
      } else if (dashMonth) {
        // Compute month dates on frontend or send month string
        url += `&startDate=${dashFrom}&endDate=${dashTo}`;
      }
      if (dashBatch !== "all") url += `&batchId=${dashBatch}`;

      const res = await fetch(url);
      const data = await res.json();
      setDashboard(data);
    } catch (e: any) {
      showToast("Error retrieving dashboard statistics.", "danger");
    }
  };

  const fetchOrders = async () => {
    try {
      let url = "/api/orders?1=1";
      if (ordersMonth === "custom") {
        if (ordersFrom && ordersTo) url += `&startDate=${ordersFrom}&endDate=${ordersTo}`;
      } else if (ordersMonth) {
        url += `&startDate=${ordersFrom}&endDate=${ordersTo}`;
      }
      if (ordersBatch !== "all") url += `&batchId=${ordersBatch}`;
      if (ordersDelivery !== "all") url += `&deliveryStatus=${ordersDelivery}`;
      if (ordersPayment !== "all") url += `&paymentStatus=${ordersPayment}`;

      const res = await fetch(url);
      const arr = await res.json();
      setOrders(arr);
    } catch (e) {
      showToast("Error retrieving orders list.", "danger");
    }
  };

  const fetchBatches = async () => {
    try {
      let url = "/api/batches?1=1";
      if (batchMonth === "custom") {
        if (batchFrom && batchTo) url += `&startDate=${batchFrom}&endDate=${batchTo}`;
      } else if (batchMonth) {
        url += `&startDate=${batchFrom}&endDate=${batchTo}`;
      }
      const res = await fetch(url);
      const arr = await res.json();
      setBatches(arr);
    } catch (e) {
      showToast("Error retrieving import batches.", "danger");
    }
  };

  const fetchExpenses = async () => {
    try {
      let url = "/api/expenses?1=1";
      if (expMonth === "custom") {
        if (expFrom && expTo) url += `&startDate=${expFrom}&endDate=${expTo}`;
      } else if (expMonth) {
        url += `&startDate=${expFrom}&endDate=${expTo}`;
      }
      if (expType !== "all") url += `&type=${expType}`;

      const res = await fetch(url);
      const arr = await res.json();
      setExpenses(arr);
    } catch (e) {
      showToast("Error retrieving expenses metadata.", "danger");
    }
  };

  const fetchBalanceTransactions = async () => {
    try {
      let url = "/api/balance/transactions?1=1";
      if (balMonth === "custom") {
        if (balFrom && balTo) url += `&startDate=${balFrom}&endDate=${balTo}`;
      } else if (balMonth) {
        url += `&startDate=${balFrom}&endDate=${balTo}`;
      }
      if (balType !== "all") url += `&type=${balType}`;

      const res = await fetch(url);
      const arr = await res.json();
      setBalanceTransactions(arr);
    } catch (e) {
      showToast("Error retrieving general ledger balance transactions.", "danger");
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      setCustomers(data);
    } catch (e) {
      showToast("Error retrieving customers roster.", "danger");
    }
  };

  const fetchStaticConfig = async () => {
    try {
      const [expCat, distCat, bIds] = await Promise.all([
        fetch("/api/expenses/categories").then(r => r.json()),
        fetch("/api/expenses/distribution-categories").then(r => r.json()),
        fetch("/api/batches/status-list").then(r => r.json())
      ]);
      setExpenseCategories(expCat);
      setDistributionCategories(distCat);
      setBatchIdsWithStatus(bIds);

      // Generate a mock list of months for selectors
      const months = [];
      const currentYear = new Date().getFullYear();
      for (let m = 11; m >= 0; m--) {
        const d = new Date(currentYear, m, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }
      setMonthsList(months);
    } catch (e) {
      console.error(e);
    }
  };

  // Run initial loadings
  useEffect(() => {
    fetchStaticConfig();
    fetchDashboardData();
    fetchOrders();
    fetchBatches();
    fetchExpenses();
    fetchBalanceTransactions();
    fetchCustomers();
  }, []);

  // Update dates automatically when a Month value changes
  const handleRangeCompute = (monthVal: string, setterFrom: any, setterTo: any) => {
    if (!monthVal || monthVal === "custom") return;
    const [year, month] = monthVal.split("-").map(Number);
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    setterFrom(start);
    setterTo(end);
  };

  useEffect(() => {
    handleRangeCompute(dashMonth, setDashFrom, setDashTo);
  }, [dashMonth]);

  useEffect(() => {
    handleRangeCompute(ordersMonth, setOrdersFrom, setOrdersTo);
  }, [ordersMonth]);

  useEffect(() => {
    handleRangeCompute(batchMonth, setBatchFrom, setBatchTo);
  }, [batchMonth]);

  useEffect(() => {
    handleRangeCompute(expMonth, setExpFrom, setExpTo);
  }, [expMonth]);

  useEffect(() => {
    handleRangeCompute(balMonth, setBalFrom, setBalTo);
  }, [balMonth]);

  // Handle page transitions
  const handlePageChange = (to: typeof page) => {
    setPage(to);
    setMenuOpen(false); // Close mobile sidebar overlay
    if (to === "dashboard") fetchDashboardData();
    if (to === "orders") fetchOrders();
    if (to === "batches") fetchBatches();
    if (to === "balance") {
      fetchBalanceTransactions();
      fetchExpenses();
    }
    if (to === "customers") fetchCustomers();
  };

  // ----------------------------------------------------
  // TRANSACTION SUBMISSIONS
  // ----------------------------------------------------

  // 1. Create Order
  const handleAddProductRow = () => {
    setNewOrder(prev => ({
      ...prev,
      products: [...prev.products, { productName: "", quantity: 1, unitPrice: 0, costPrice: 0, batchId: "", availableQuantity: 0, maxWeight: 0 }]
    }));
  };

  const handleRemoveProductRow = (index: number) => {
    setNewOrder(prev => {
      const copy = [...prev.products];
      copy.splice(index, 1);
      return { ...prev, products: copy.length === 0 ? [{ productName: "", quantity: 1, unitPrice: 0, costPrice: 0, batchId: "", availableQuantity: 0, maxWeight: 0 }] : copy };
    });
  };

  const handleNewOrderChange = (field: string, val: any) => {
    setNewOrder(prev => ({ ...prev, [field]: val }));
  };

  const handleProductRowChange = async (index: number, fld: string, val: any) => {
    const updatedProducts = [...newOrder.products];
    const item = { ...updatedProducts[index], [fld]: val };

    if (fld === "batchId") {
      // Look up available products for this batch
      try {
        const res = await fetch(`/api/batches/${val}/products`);
        const list = await res.json();
        // store the products options on item
        (item as any).availableProductsOptions = list;
        item.productName = "";
        item.availableQuantity = 0;
        item.costPrice = 0;
      } catch (err) {
        showToast("Error matching products for batch.", "danger");
      }
    }

    if (fld === "productName") {
      const options = (item as any).availableProductsOptions || [];
      const prodOpt = options.find((o: any) => o.product === val);
      if (prodOpt) {
        item.costPrice = prodOpt.costPrice;
        item.availableQuantity = prodOpt.availableQuantity;
        item.maxWeight = prodOpt.availableWeight;
        item.unitPrice = Math.round(prodOpt.costPrice * 1.5); // Default 50% markup
      }
    }

    updatedProducts[index] = item;
    setNewOrder(prev => ({ ...prev, products: updatedProducts }));
  };

  const handleCustomerSearchType = async (term: string) => {
    if (term.length < 2) {
      setCustomerSearchDropdown([]);
      return;
    }
    try {
      const res = await fetch(`/api/customers/search?query=${encodeURIComponent(term)}`);
      const list = await res.json();
      setCustomerSearchDropdown(list);
    } catch (e) {
      console.error(e);
    }
  };

  const selectSuggestedCustomer = (c: any) => {
    setNewOrder(prev => ({
      ...prev,
      customerId: c["Customer ID"],
      customerName: c["Customer Name"],
      customerPhone: c["Customer Phone"],
      customerLocation: c["Customer Location"]
    }));
    setCustomerSearchQuery("");
    setCustomerSearchDropdown([]);
    showToast(`Autofilled customer ${c["Customer Name"]} details!`, "success");
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName || !newOrder.customerPhone) {
      showToast("Customer Name and Phone are required parameters.", "warning");
      return;
    }

    const invalidItem = newOrder.products.find(p => !p.productName || !p.batchId || p.quantity <= 0);
    if (invalidItem) {
      showToast("Please ensure all products, quantities, and Batch IDs are selected.", "warning");
      return;
    }

    // Assign customer_id if not present
    const payload = {
      ...newOrder,
      customerId: newOrder.customerId || "CUST" + String(Date.now()).substring(7)
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("Order transaction successfully submitted!", "success");
        setNewOrder({
          customerId: "",
          customerName: "",
          customerPhone: "",
          customerLocation: "Dubai",
          deliveryStatus: "Pending",
          paymentStatus: "Unpaid",
          orderDate: new Date().toISOString().split("T")[0],
          products: [{ productName: "", quantity: 1, unitPrice: 0, costPrice: 0, batchId: "", availableQuantity: 0, maxWeight: 0 }]
        });
        setOrdersTab("view");
        fetchOrders();
        fetchDashboardData();
      } else {
        showToast(`Transaction declined: ${data.error || "unknown DB error."}`, "danger");
      }
    } catch (err: any) {
      showToast(`Network submission error: ${err.message}`, "danger");
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm(`Confirm deletion of order ${id}? This restores product stock weights automatically.`)) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Order ${id} removed and dynamic stock restored!`, "success");
        fetchOrders();
        fetchDashboardData();
      } else {
        showToast(`Delete failed: ${data.error}`, "danger");
      }
    } catch (e) {
      showToast("Network delete attempt failed.", "danger");
    }
  };

  // 2. Clear / Save Batch
  const handleAddBatchProductRow = () => {
    setNewBatch(prev => ({
      ...prev,
      products: [...prev.products, { productName: "Honey 1kg", quantity: 10, purchasePrice: 10, shippingCost: 5, localCost: 2 }]
    }));
  };

  const handleRemoveBatchProductRow = (index: number) => {
    setNewBatch(prev => {
      const copy = [...prev.products];
      copy.splice(index, 1);
      return { ...prev, products: copy.length === 0 ? [{ productName: "Honey 1kg", quantity: 10, purchasePrice: 10, shippingCost: 5, localCost: 2 }] : copy };
    });
  };

  const saveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.uaePhone) {
      showToast("Carrier Name and UAE contact are required.", "warning");
      return;
    }

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBatch)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Import batch ${data.batchId || ""} registered successfully!`, "success");
        setNewBatch({
          name: "",
          egyPhone: "",
          uaePhone: "",
          passportNumber: "",
          locationInEgypt: "",
          flightDetails: "",
          arrivalDate: new Date().toISOString().split("T")[0],
          notes: "",
          products: [{ productName: "Honey 1kg", quantity: 10, purchasePrice: 10, shippingCost: 5, localCost: 2 }]
        });
        setBatchesTab("view");
        fetchBatches();
        fetchDashboardData();
        fetchStaticConfig(); // reload batch IDs
      } else {
        showToast("Database declined importing.", "danger");
      }
    } catch (err: any) {
      showToast("Request failed: " + err.message, "danger");
    }
  };

  const handleDeleteBatch = async (id: string) => {
    if (!confirm(`Are you absolutely sure you want to delete batch ${id}? All stock will be wiped.`)) return;
    try {
      const res = await fetch(`/api/batches/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Batch ${id} and stock records deleted!`, "success");
        fetchBatches();
        fetchDashboardData();
        fetchStaticConfig();
      }
    } catch (e) {
      showToast("Delete connection error.", "danger");
    }
  };

  // 3. Save Expense
  const saveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.category || !newExpense.description || newExpense.amount <= 0) {
      showToast("Please fill in category, details description, and valid cost.", "warning");
      return;
    }

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense)
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Expense booked under category: ${newExpense.category}!`, "success");
        setNewExpense({
          type: "Expense",
          category: "",
          description: "",
          amount: 0,
          paymentMethod: "Cash",
          reference: "",
          notes: "",
          date: new Date().toISOString().split("T")[0]
        });
        setBalanceTab("expenses");
        fetchExpenses();
        fetchDashboardData();
        fetchBalanceTransactions();
      } else {
        showToast("Server declined booking.", "danger");
      }
    } catch (e: any) {
      showToast("Network error: " + e.message, "danger");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm(`Delete expense record ${id}?`)) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const r = await res.json();
      if (r.success) {
        showToast(`Expense ${id} deleted!`, "success");
        fetchExpenses();
        fetchDashboardData();
      }
    } catch (e) {
      showToast("Connection failed.", "danger");
    }
  };

  // 4. Save Manual Balance Transaction
  const saveBalanceEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBalance.details || newBalance.amount <= 0) {
      showToast("Please supply the transaction details and positive amount value.", "warning");
      return;
    }
    try {
      const res = await fetch("/api/balance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBalance)
      });
      const r = await res.json();
      if (r.success) {
        showToast(`Ledger updated! New cumulative balance: ${r.newBalance.toFixed(2)} AED`, "success");
        setNewBalance({
          type: "Income",
          details: "",
          amount: 0,
          note: "",
          date: new Date().toISOString().split("T")[0]
        });
        fetchBalanceTransactions();
        fetchDashboardData();
      }
    } catch (e: any) {
      showToast("Request failed: " + e.message, "danger");
    }
  };

  const handleDeleteBalance = async (id: string) => {
    if (!confirm(`Are you sure you want to delete balance transaction ${id}? Dynamic cumulative balances will re-calculate.`)) return;
    try {
      const res = await fetch(`/api/balance/transactions/${id}`, { method: "DELETE" });
      const r = await res.json();
      if (r.success) {
        showToast(`Ledger transaction ${id} deleted. Running values reconciled.`, "success");
        fetchBalanceTransactions();
        fetchDashboardData();
      }
    } catch (e) {
      showToast("Request timeout error.", "danger");
    }
  };

  // 5. Update Customer details
  const saveCustomerChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCustomerObj) return;
    try {
      const res = await fetch(`/api/customers/${editCustomerObj["Customer ID"]}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editCustomerObj)
      });
      const r = await res.json();
      if (r.success) {
        showToast(`Customer profiles updated!`, "success");
        setEditCustomerObj(null);
        fetchCustomers();
      }
    } catch (e) {
      showToast("Connection failed.", "danger");
    }
  };

  // Format Helper for Numbers
  const formatAED = (val: number | undefined) => {
    return (val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " AED";
  };

  return (
    <div className="flex min-h-screen text-slate-900 bg-[#f1f5f9] font-sans antialiased">
      
      {/* Toast Overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center justify-between p-4 rounded-xl shadow-lg border text-white animate-fade-in transition-all ${
              t.type === "success"
                ? "bg-emerald-600 border-emerald-500"
                : t.type === "danger"
                ? "bg-rose-600 border-rose-500"
                : t.type === "warning"
                ? "bg-amber-500 border-amber-600"
                : "bg-slate-700 border-slate-600"
            }`}
          >
            <span className="text-sm font-medium">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))} className="text-white/80 hover:text-white ml-3">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Mobile Sidebar backdrop */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-all duration-300"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Persistent Left Sidebar (Desktop) / Sliding Overlay Sidebar (Mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 bg-white text-slate-700 flex flex-col flex-shrink-0 border-r border-slate-200 z-50 w-64 transform transition-transform duration-300 md:static md:translate-x-0
        ${menuOpen ? "translate-x-0" : "-translate-x-full md:flex"}
      `}>
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-amber-50/15">
          <div className="flex items-center gap-3">
            {/* Custom SVG logo representing physical bait al asal / Honey House logo */}
            <svg viewBox="0 0 100 100" className="w-11 h-11 flex-shrink-0">
              <defs>
                <linearGradient id="honeyGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="60%" stopColor="#d97706" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
              </defs>
              
              {/* Dripping Honey Circular Frame (inspired by image) */}
              <path 
                d="M 50 10 
                   C 72 10, 90 28, 90 50 
                   C 90 55, 87 58, 88 64 
                   C 89 71, 93 75, 89 81 
                   C 85 87, 77 85, 72 87 
                   C 67 89, 64 93, 59 92 
                   C 54 91, 51 86, 46 88 
                   C 41 90, 36 93, 31 91 
                   C 25 89, 22 84, 18 79 
                   C 14 74, 10 69, 14 61 
                   C 16 56, 14 52, 14 47 
                   C 14 27, 30 10, 50 10 Z" 
                fill="none" 
                stroke="url(#honeyGoldGrad)" 
                strokeWidth="5" 
                strokeLinecap="round" 
              />
              
              {/* Splashes & Drips at Bottom */}
              <path d="M 50 82 Q 50 96 48 97 Q 46 96 46 82" fill="none" stroke="url(#honeyGoldGrad)" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 28 80 Q 23 88 21 89 Q 19 88 23 79" fill="none" stroke="url(#honeyGoldGrad)" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 72 80 Q 77 88 79 87 Q 81 85 75 79" fill="none" stroke="url(#honeyGoldGrad)" strokeWidth="2.5" strokeLinecap="round" />

              {/* House Outline (Amber-950) */}
              <path 
                d="M 33 49 L 50 32 L 67 49 
                   M 38 43 L 38 68 L 62 68 L 62 43" 
                fill="none" 
                stroke="#451a03" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <path d="M 57 38 L 57 33 L 60 33 L 60 41" fill="none" stroke="#451a03" strokeWidth="3.5" strokeLinecap="round" />

              {/* Dome Beehive with layered honey segments */}
              <g fill="url(#honeyGoldGrad)" stroke="#451a03" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M 43 64 C 43 65.5, 57 65.5, 57 64 C 57 62.5, 43 62.5, 43 64 Z" />
                <path d="M 41 60 C 41 62, 59 62, 59 60 C 59 58, 41 58, 41 60 Z" />
                <path d="M 39 56 C 39 58, 61 58, 61 56 C 61 54, 39 54, 39 56 Z" />
                <path d="M 42 51 C 42 54, 58 54, 58 51 C 58 48, 42 48, 42 51 Z" />
                <path d="M 46 47 C 46 49, 54 49, 54 47 C 54 45, 46 45, 46 47 Z" />
              </g>
              {/* Hive entrance */}
              <circle cx="50" cy="56" r="2.5" fill="#451a03" />
              
              {/* Mini Flying Bee */}
              <g transform="translate(64, 46) scale(1)">
                <ellipse cx="0" cy="0" rx="4.5" ry="3.5" fill="#fbbf24" stroke="#451a03" strokeWidth="1" />
                <path d="M -1.5 -3.2 L -1.5 3.2 M 1.5 -3.2 L 1.5 3.2" stroke="#451a03" strokeWidth="1" />
                <ellipse cx="-1.2" cy="-4" rx="1.8" ry="2.5" fill="#ffffff" stroke="#451a03" strokeWidth="0.8" transform="rotate(-15)" opacity="0.95" />
                <ellipse cx="1.2" cy="-4" rx="1.2" ry="2" fill="#ffffff" stroke="#451a03" strokeWidth="0.8" transform="rotate(15)" opacity="0.95" />
                <path d="M 3.5 -1 Q 4.5 -2 4.2 -3" stroke="#451a03" strokeWidth="0.8" fill="none" />
              </g>
            </svg>
            <div>
              <h1 className="font-bold text-lg leading-none text-slate-900 tracking-tight">Honey House</h1>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-amber-600 font-bold tracking-wide uppercase">بيت العسل</span>
                <span className="text-[8px] bg-amber-100 text-amber-800 font-extrabold px-1 py-0.2 rounded font-mono">CORE v2</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setMenuOpen(false)} 
            className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => handlePageChange("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${
              page === "dashboard" ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${page === "dashboard" ? "text-blue-600" : "text-slate-500"}`} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handlePageChange("orders")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${
              page === "orders" ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <ShoppingCart className={`w-5 h-5 flex-shrink-0 ${page === "orders" ? "text-blue-600" : "text-slate-500"}`} />
            <span>Customer Orders</span>
          </button>

          <button
            onClick={() => handlePageChange("batches")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${
              page === "batches" ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <Boxes className={`w-5 h-5 flex-shrink-0 ${page === "batches" ? "text-blue-600" : "text-slate-500"}`} />
            <span>Import Stock</span>
          </button>

          <button
            onClick={() => handlePageChange("balance")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${
              page === "balance" ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <Wallet className={`w-5 h-5 flex-shrink-0 ${page === "balance" ? "text-blue-600" : "text-slate-500"}`} />
            <span>General Ledger</span>
          </button>

          <button
            onClick={() => handlePageChange("customers")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-medium ${
              page === "customers" ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/5 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
            }`}
          >
            <Users className={`w-5 h-5 flex-shrink-0 ${page === "customers" ? "text-blue-600" : "text-slate-500"}`} />
            <span>Customers List</span>
          </button>
        </nav>

        {/* Dynamic status footer in drawer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="status-pulse animate-pulse bg-emerald-500 w-2 h-2 rounded-full"></div>
            <span className="text-xs text-slate-700 font-semibold uppercase tracking-wider">
              Supabase PostgreSQL Live
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">
            {process.env.DATABASE_URL ? "Supabase Dedicated" : "In-Memory Fallback Client"}
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 max-w-7xl mx-auto w-full">
        
        {/* App Bar / Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            {/* Hamburger Button on Mobile */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg bg-white border border-slate-205 text-slate-700 hover:bg-slate-50 transition focus:ring-2 focus:ring-blue-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight capitalize">
                {page === "dashboard" ? "Business Intelligence Dashboard" : `${page} modules`}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time enterprise metrics for UAE Honey House. Reconciled Local timezone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-full font-mono shadow-sm">
              UTC: {new Date().toISOString().split("T")[0]}
            </span>
          </div>
        </header>

        {/* ----------------------------------------------------
           DASHBOARD VIEW
           ---------------------------------------------------- */}
        {page === "dashboard" && (
          <div className="space-y-8">
            
            {/* Extended Filter Control Ribbon */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/40">
              <div className="flex flex-wrap items-end gap-5">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Month Filter</label>
                  <select
                    value={dashMonth}
                    onChange={e => {
                      setDashMonth(e.target.value);
                      if (e.target.value === "") {
                        setDashFrom("");
                        setDashTo("");
                      }
                    }}
                    className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  >
                    <option value="">All Historic Months</option>
                    {monthsList.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                {dashMonth === "custom" && (
                  <>
                    <div className="w-[180px]">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">From Date</label>
                      <input
                        type="date"
                        value={dashFrom}
                        onChange={e => setDashFrom(e.target.value)}
                        className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="w-[180px]">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">To Date</label>
                      <input
                        type="date"
                        value={dashTo}
                        onChange={e => setDashTo(e.target.value)}
                        className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </>
                )}

                <div className="w-[180px]">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Batch Filter</label>
                  <select
                    value={dashBatch}
                    onChange={e => setDashBatch(e.target.value)}
                    className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">All Batches</option>
                    {batchIdsWithStatus.map(b => (
                      <option key={b.batchId} value={b.batchId}>{b.batchId}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={fetchDashboardData}
                    className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 shadow-sm transition"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => {
                      setDashMonth("");
                      setDashFrom("");
                      setDashTo("");
                      setDashBatch("all");
                      setDashboard(null);
                      setTimeout(fetchDashboardData, 10);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-xs transition"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            </section>

            {/* KPI Cards Panel - Row 1 */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Total Revenue */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/20 flex flex-col justify-between hover:border-slate-300 transition duration-205">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Revenue</span>
                  <h3 className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                    {formatAED(dashboard?.totalSales)}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium font-sans">General ledger inflow</span>
                  <span className="text-emerald-500 font-semibold flex items-center gap-1 font-mono">
                    {dashboard?.paidOrders} approved
                  </span>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/20 flex flex-col justify-between hover:border-slate-300 transition duration-205">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Expenses</span>
                  <h3 className="text-2xl font-bold font-mono text-rose-600 tracking-tight">
                    {formatAED(dashboard?.totalExpenses)}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium font-sans">General ledger outflow</span>
                  <span className="text-rose-600 font-bold font-mono bg-rose-50 px-2 py-0.5 rounded-md">
                    Actual cost
                  </span>
                </div>
              </div>

              {/* Net Profit */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/20 flex flex-col justify-between hover:border-slate-300 transition duration-205">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Net Profit</span>
                  <h3 className="text-2xl font-bold font-mono text-emerald-600 tracking-tight">
                    {formatAED(dashboard?.netProfit)}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">After all expenses</span>
                  <span className="text-emerald-600 font-bold font-mono bg-emerald-50 px-2 py-0.5 rounded-md">
                    {dashboard?.netProfitMargin}% net ratio
                  </span>
                </div>
              </div>

              {/* Current Balance */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/20 flex flex-col justify-between hover:border-slate-300 transition duration-205">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Balance</span>
                  <h3 className="text-2xl font-bold font-mono text-indigo-600 tracking-tight">
                    {formatAED(dashboard?.currentBalance)}
                  </h3>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">From Balance Management</span>
                  <span className="font-bold uppercase font-mono text-indigo-600 text-[10px] bg-indigo-50 px-2 py-0.5 rounded">
                    Reconciled
                  </span>
                </div>
              </div>

            </section>

            {/* KPI Cards Panel - Row 2 */}
            <section className="grid grid-cols-1 gap-6">

              {/* Stock Summary Balance (KG) - converted to an elegant full-width statistics ribbon */}
              <div className="bg-gradient-to-br from-violet-600 to-indigo-750 p-6 rounded-2xl text-white shadow-lg flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Scale className="w-4.5 h-4.5 text-indigo-200" />
                    <span>Stock Summary Balance (KG)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-4 gap-x-8 text-xs text-indigo-100 font-medium">
                    <div className="flex justify-between sm:flex-col sm:items-start sm:gap-1.5 pb-2 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10 sm:pr-4">
                      <span>Total Sold Weight:</span>
                      <span className="font-mono font-bold text-white text-base sm:text-lg">{(dashboard?.totalWeightKG || 0).toFixed(2)} KG</span>
                    </div>
                    <div className="flex justify-between sm:flex-col sm:items-start sm:gap-1.5 pb-2 border-b border-white/10 sm:border-b-0 lg:border-r lg:border-white/10 lg:pr-4">
                      <span>Available Stock:</span>
                      <span className="font-mono font-bold text-white text-base sm:text-lg">{(dashboard?.availableWeightTotal || 0).toFixed(2)} KG</span>
                    </div>
                    <div className="flex justify-between sm:flex-col sm:items-start sm:gap-1.5 pb-2 border-b border-white/10 sm:border-b-0 sm:border-r sm:border-white/10 sm:pr-4">
                      <span>Wasted & Free Samples:</span>
                      <span className="font-mono font-bold text-rose-300 text-base sm:text-lg">{(dashboard?.totalWastedAndSamples || 0).toFixed(2)} KG</span>
                    </div>
                    <div className="flex justify-between sm:flex-col sm:items-start sm:gap-1.5 pb-2 sm:border-b-0">
                      <span>Total Imported Weight:</span>
                      <span className="font-mono font-bold text-white text-base sm:text-lg">{(dashboard?.totalImportedWeight || 0).toFixed(2)} KG</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-2.5 border-t border-white/15 flex justify-between items-center text-xs">
                  <span className="text-indigo-200 font-medium font-sans">Wasted & Sample Ratio:</span>
                  <span className="font-mono font-bold text-emerald-300 bg-white/15 px-2 py-0.5 rounded-md">
                    {(dashboard?.wastedMargin || 0).toFixed(1)}% ratio
                  </span>
                </div>
              </div>

            </section>

            {/* Custom Responsive SVG Charting Engine */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Financial Trend Visualizer */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/10 lg:col-span-2 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <span>Monthly Financial Trend</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Running sales metrics and cash flows compiled chronologically.
                  </p>
                </div>

                <div className="h-64 my-6 flex items-end justify-between relative bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                  {/* Empty fallback screen if no trend data */}
                  {!dashboard?.monthlyTrend || dashboard.monthlyTrend.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <p>No transactions dataset matching this range.</p>
                    </div>
                  ) : (
                    // Draw Custom CSS Bar charts indicating dynamic income comparisons
                    <div className="w-full h-full flex items-end justify-around pt-6">
                      {dashboard.monthlyTrend.map((m, i) => {
                        const maxVal = Math.max(...dashboard.monthlyTrend.map(x => Math.max(x.sales, x.profit, x.expenses))) || 1;
                        const salesPct = Math.round((m.sales / maxVal) * 80) + "%";
                        const profitPct = Math.round((m.profit / maxVal) * 80) + "%";
                        const expensesPct = Math.round((m.expenses / maxVal) * 80) + "%";

                        return (
                          <div key={i} className="flex flex-col items-center flex-1 max-w-[80px] h-full justify-end group relative cursor-pointer">
                            {/* Running tooltips */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg p-2.5 text-[10px] space-y-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 w-32 pointer-events-none">
                              <p className="font-semibold text-blue-400 border-b border-white/10 pb-0.5">{m.month}</p>
                              <p>Revenue: {m.sales.toFixed(1)}</p>
                              <p>Profit: {m.profit.toFixed(1)}</p>
                              <p>Expenses: {m.expenses.toFixed(1)}</p>
                            </div>

                            <div className="flex items-end gap-1.5 w-full h-[85%] justify-center">
                              {/* Sales Bar */}
                              <div style={{ height: salesPct }} className="w-2.5 bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600"></div>
                              {/* Profit Bar */}
                              <div style={{ height: profitPct }} className="w-2.5 bg-emerald-500 rounded-t-sm transition-all hover:bg-emerald-600"></div>
                              {/* Expenses Bar */}
                              <div style={{ height: expensesPct }} className="w-2.5 bg-rose-500 rounded-t-sm transition-all hover:bg-rose-600"></div>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 mt-2 font-mono">{m.month.split("-")[1]}/{m.month.split("-")[0].substring(2)}</span>
                          </div>
                    );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-4 items-center justify-center text-xs font-semibold pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span>
                    <span className="text-slate-500">Sales Rec</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                    <span className="text-slate-500">Gross Profit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                    <span className="text-slate-500">Operational Cost</span>
                  </div>
                </div>
              </div>

              {/* Top Products Visualizer */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/10 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <span>Top 5 Products sold</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    High volume inventory items purchased.
                  </p>
                </div>

                <div className="space-y-4 my-6">
                  {dashboard?.topProductsByVolume.map((item, i) => {
                    const maxVol = Math.max(...dashboard.topProductsByVolume.map(x => x.volume)) || 1;
                    const pct = Math.round((item.volume / maxVol) * 100) + "%";
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium text-slate-700">
                          <span className="truncate max-w-[180px]">{item.name}</span>
                          <span className="font-mono font-bold text-slate-900">{item.volume} units</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div style={{ width: pct }} className="bg-blue-600 h-full rounded-full transition-all"></div>
                        </div>
                      </div>
                    );
                  })}
                  {!dashboard?.topProductsByVolume || dashboard.topProductsByVolume.length === 0 && (
                    <div className="text-center font-medium text-slate-400 text-xs py-10">No products dataset logged yet.</div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 bg-[#fbfbf8] rounded-xl p-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Avg ticket price:</span>
                    <strong className="text-slate-900 font-mono">{formatAED(dashboard?.avgOrderValue)}</strong>
                  </div>
                </div>
              </div>

            </section>

          </div>
        )}

        {/* ----------------------------------------------------
           CUSTOMER ORDERS VIEW
           ---------------------------------------------------- */}
        {page === "orders" && (
          <div className="space-y-6">
            
            {/* Embedded Order Tab Ribbon */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setOrdersTab("view")}
                className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
                  ordersTab === "view" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                All Orders Book
              </button>
              <button
                onClick={() => setOrdersTab("create")}
                className={`px-6 py-3 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
                  ordersTab === "create" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Create New Order</span>
              </button>
            </div>

            {/* Sub-tab 1: ALL ORDERS BOOK */}
            {ordersTab === "view" && (
              <div className="space-y-6">
                
                {/* Advanced Multi-Filter controls */}
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Month Filter</label>
                    <select
                      value={ordersMonth}
                      onChange={e => setOrdersMonth(e.target.value)}
                      className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                    >
                      <option value="">All Months</option>
                      {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {ordersMonth === "custom" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-450 uppercase mb-2">From</label>
                        <input
                          type="date"
                          value={ordersFrom}
                          onChange={e => setOrdersFrom(e.target.value)}
                          className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-450 uppercase mb-2">To</label>
                        <input
                          type="date"
                          value={ordersTo}
                          onChange={e => setOrdersTo(e.target.value)}
                          className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Batch</label>
                    <select
                      value={ordersBatch}
                      onChange={e => setOrdersBatch(e.target.value)}
                      className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                    >
                      <option value="all">All Batches</option>
                      {batchIdsWithStatus.map(b => (
                        <option key={b.batchId} value={b.batchId}>{b.batchId}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Delivery Status</label>
                    <select
                      value={ordersDelivery}
                      onChange={e => setOrdersDelivery(e.target.value)}
                      className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                    >
                      <option value="all">All</option>
                      <option value="Pending">Pending</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-450 uppercase mb-2">Payment Status</label>
                    <select
                      value={ordersPayment}
                      onChange={e => setOrdersPayment(e.target.value)}
                      className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                    >
                      <option value="all">All</option>
                      <option value="Paid">Paid</option>
                      <option value="Unpaid">Unpaid</option>
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={fetchOrders}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                    >
                      Apply Filter
                    </button>
                    <button
                      onClick={() => {
                        setOrdersMonth("");
                        setOrdersBatch("all");
                        setOrdersDelivery("all");
                        setOrdersPayment("all");
                        setOrdersFrom("");
                        setOrdersTo("");
                        setOrders([]);
                        setTimeout(fetchOrders, 10);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-xs transition"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </section>

                {/* Orders Book Grid/List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-4">Order ID</th>
                          <th className="p-4">Date</th>
                          <th className="p-4">Customer Name</th>
                          <th className="p-4">Honey Product</th>
                          <th className="p-4">Qty</th>
                          <th className="p-4">Total Sale</th>
                          <th className="p-4">Product Cost</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4">Import Batch</th>
                          <th className="p-4 text-right">Row Operations</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150">
                        {orders.map((item, idx) => {
                          const isPaid = item["Payment Status"] === "Paid";
                          const isDelivered = item["Delivery Status"] === "Delivered";

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition">
                              <td className="p-4 font-mono font-bold text-slate-950">{item["Order ID"]}</td>
                              <td className="p-4 whitespace-nowrap">{item["Order Date"]}</td>
                              <td className="p-4 font-medium text-slate-900">
                                <div className="space-y-0.5">
                                  <p>{item["Customer Name (Auto)"] || "Walk-in Guest"}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">{item["Customer Phone (Auto)"]}</p>
                                </div>
                              </td>
                              <td className="p-4 font-semibold text-slate-700">{item["Product"]}</td>
                              <td className="p-4 font-medium font-mono">{item["Quantity"]}</td>
                              <td className="p-4 font-mono font-semibold text-slate-900">
                                {formatAED(item["Total Sale"])}
                              </td>
                              <td className="p-4 font-mono text-slate-500 whitespace-nowrap">
                                <div className="space-y-0.5 text-left">
                                  <p>Unit: <span className="font-semibold text-slate-700">{formatAED(item["Cost Price"])}</span></p>
                                  <p className="text-[10px] text-slate-400">Total: {formatAED(item["Total Cost"])}</p>
                                </div>
                              </td>
                              <td className="p-4 text-center whitespace-nowrap">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mr-1.5 ${
                                  isDelivered ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                                }`}>
                                  {item["Delivery Status"]}
                                </span>
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPaid ? "bg-blue-50 text-blue-700" : "bg-rose-50 text-rose-700"
                                }`}>
                                  {item["Payment Status"]}
                                </span>
                              </td>
                              <td className="p-4 font-mono font-semibold text-slate-500">{item["Import Batch ID"]}</td>
                              <td className="p-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleDeleteOrder(item["Order ID"])}
                                  className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {orders.length === 0 && (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-slate-400 font-medium font-sans">
                              No orders found. Set filters or add a new order transaction using the tab above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: CREATE NEW ORDER */}
            {ordersTab === "create" && (
              <form onSubmit={saveOrder} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-3xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span>Customer Details Summary</span>
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Search Roster Customers</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Filter database by name or phone to autofill..."
                        value={customerSearchQuery}
                        onChange={e => {
                          setCustomerSearchQuery(e.target.value);
                          handleCustomerSearchType(e.target.value);
                        }}
                        className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs"
                      />
                      {customerSearchDropdown.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 overflow-hidden z-25 max-h-56 overflow-y-auto">
                          {customerSearchDropdown.map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectSuggestedCustomer(c)}
                              className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 text-xs flex justify-between items-center transition"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{c["Customer Name"]}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{c["Customer Phone"]}</p>
                              </div>
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold uppercase font-mono">Select</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Client Full Name *</label>
                      <input
                        type="text"
                        value={newOrder.customerName}
                        onChange={e => handleNewOrderChange("customerName", e.target.value)}
                        required
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contact Phone *</label>
                      <input
                        type="text"
                        value={newOrder.customerPhone}
                        onChange={e => handleNewOrderChange("customerPhone", e.target.value)}
                        required
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-semibold focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Emirates Location *</label>
                      <select
                        value={newOrder.customerLocation}
                        onChange={e => handleNewOrderChange("customerLocation", e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold transition"
                      >
                        <option value="Dubai">Dubai</option>
                        <option value="Sharjah">Sharjah</option>
                        <option value="Ajman">Ajman</option>
                        <option value="Abu Dhabi">Abu Dhabi</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Delivery Status</label>
                      <select
                        value={newOrder.deliveryStatus}
                        onChange={e => handleNewOrderChange("deliveryStatus", e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold transition"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Payment Status</label>
                      <select
                        value={newOrder.paymentStatus}
                        onChange={e => handleNewOrderChange("paymentStatus", e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold transition"
                      >
                        <option value="Unpaid">Unpaid</option>
                        <option value="Paid">Paid</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-5 h-5 text-blue-600" />
                      <span>Items to purchase</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddProductRow}
                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </h3>

                  <div className="space-y-4">
                    {newOrder.products.map((item, index) => {
                      const avOptions: any[] = (item as any).availableProductsOptions || [];

                      return (
                        <div key={index} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 grid grid-cols-1 md:grid-cols-5 gap-3 items-end relative group">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Batch ID *</label>
                            <select
                              value={item.batchId}
                              onChange={e => handleProductRowChange(index, "batchId", e.target.value)}
                              required
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            >
                              <option value="">Select Batch</option>
                              {batchIdsWithStatus.map(b => (
                                <option key={b.batchId} value={b.batchId}>
                                  {b.batchId} ({b.availableWeight.toFixed(1)} KG av.)
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Product *</label>
                            <select
                              value={item.productName}
                              onChange={e => handleProductRowChange(index, "productName", e.target.value)}
                              required
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                            >
                              <option value="">Select product</option>
                              {avOptions.map((opt, i) => (
                                <option key={i} value={opt.product}>
                                  {opt.product} ({opt.availableQuantity} units av.)
                                </option>
                              ))}
                            </select>
                            {item.costPrice > 0 && (
                              <p className="text-[9px] text-emerald-600 font-bold mt-1.5 font-mono bg-emerald-50 px-1 py-0.5 rounded border border-emerald-150 inline-block">
                                Unit Cost: {formatAED(item.costPrice)}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity *</label>
                            <input
                              type="number"
                              min={1}
                              max={item.availableQuantity || 9999}
                              value={item.quantity}
                              onChange={e => handleProductRowChange(index, "quantity", parseInt(e.target.value) || 1)}
                              required
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                            />
                            {item.availableQuantity > 0 && (
                              <p className="text-[9px] text-blue-600 font-bold mt-0.5">Max allowed: {item.availableQuantity}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Selling Price *</label>
                            <div className="relative">
                              <input
                                type="number"
                                min={0}
                                value={item.unitPrice}
                                onChange={e => handleProductRowChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                required
                                className="w-full bg-white border border-slate-200 rounded-lg pl-2.5 pr-8 py-1.5 text-xs font-mono font-bold"
                              />
                              <span className="absolute inset-y-0 right-2 flex items-center text-[9px] text-slate-400 font-bold">AED</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Cost</span>
                              <span className="text-xs font-bold font-mono text-slate-500 block py-1.5 px-0.5">
                                {formatAED(item.quantity * item.unitPrice)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveProductRow(index)}
                              className="text-slate-400 hover:text-rose-600 transition py-1.5"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewOrder({
                        customerId: "",
                        customerName: "",
                        customerPhone: "",
                        customerLocation: "Dubai",
                        deliveryStatus: "Pending",
                        paymentStatus: "Unpaid",
                        orderDate: new Date().toISOString().split("T")[0],
                        products: [{ productName: "", quantity: 1, unitPrice: 0, costPrice: 0, batchId: "", availableQuantity: 0, maxWeight: 0 }]
                      });
                      setOrdersTab("view");
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    Cancel Draft
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-7 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition"
                  >
                    Book Order Transaction
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ----------------------------------------------------
           IMPORT BATCHES VIEW
           ---------------------------------------------------- */}
        {page === "batches" && (
          <div className="space-y-6">
            
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setBatchesTab("view")}
                className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
                  batchesTab === "view" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                Stock Batches list
              </button>
              <button
                onClick={() => setBatchesTab("create")}
                className={`px-6 py-3 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
                  batchesTab === "create" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Log New Import Batch</span>
              </button>
            </div>

            {/* Sub-tab 1: VIEW BATCHES */}
            {batchesTab === "view" && (
              <div className="space-y-6">
                
                {/* Search dates ribbon */}
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                  <div className="w-[200px]">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Month Filter</label>
                    <select
                      value={batchMonth}
                      onChange={e => setBatchMonth(e.target.value)}
                      className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                    >
                      <option value="">All Months</option>
                      {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {batchMonth === "custom" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">From</label>
                        <input
                          type="date"
                          value={batchFrom}
                          onChange={e => setBatchFrom(e.target.value)}
                          className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To</label>
                        <input
                          type="date"
                          value={batchTo}
                          onChange={e => setBatchTo(e.target.value)}
                          className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={fetchBatches}
                      className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition"
                    >
                      Filter
                    </button>
                    <button
                      onClick={() => {
                        setBatchMonth("");
                        setBatchFrom("");
                        setBatchTo("");
                        setBatches([]);
                        setTimeout(fetchBatches, 10);
                      }}
                      className="bg-slate-100 hover:bg-[#eaeae8] border border-slate-200/85 px-4 py-2.5 rounded-xl transition"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-650" />
                    </button>
                  </div>
                </section>

                <div className="grid grid-cols-1 gap-6">
                  {batches.map((batch, index) => (
                    <div key={index} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                      <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-slate-900 font-mono">{batch["Import Batch ID"]}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                          <span className="text-sm font-semibold text-slate-700">{batch.Name}</span>
                          {batch.Status === "Active" && batch["Available Weight"] > 0 ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 px-2 py-0.5 rounded-md text-[10px] font-bold">Active in Stock</span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Closed</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteBatch(batch["Import Batch ID"])}
                            className="bg-rose-50 text-rose-600 hover:bg-rose-105 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Batch</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 font-bold block">Arrival Date (UAE)</span>
                            <span className="text-slate-900 font-mono font-medium mt-0.5 block">{batch["Arrival Date (UAE)"]}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">UAE Phone</span>
                            <span className="text-slate-900 mt-0.5 block font-mono">{batch["UAE Phone"]}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Total Weight Imported</span>
                            <span className="text-slate-900 font-semibold font-mono mt-0.5 block">{batch["Total Weight"].toFixed(2)} KG</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold block">Available Weight Stock</span>
                            <span className="text-blue-600 font-extrabold font-mono mt-0.5 block">{batch["Available Weight"].toFixed(2)} KG</span>
                          </div>
                        </div>

                        {batch.Notes && (
                          <div className="bg-[#fafaf8] p-3 rounded-lg border border-slate-100/80 text-[10px] text-slate-500 font-medium">
                            <strong>Carrier notes:</strong> {batch.Notes}
                          </div>
                        )}

                        <div className="border border-slate-150 rounded-xl overflow-hidden mt-4">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50/70 border-b border-slate-150 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                <th className="p-3">Imported Product Name</th>
                                <th className="p-3">Imported Qty</th>
                                <th className="p-3">Unit Purchase (AED)</th>
                                <th className="p-3">Freight Unit Cost</th>
                                <th className="p-3">Custom Jars Toll</th>
                                <th className="p-3 font-semibold">Loaded Total Cost</th>
                                <th className="p-3 text-right">Computed Weight</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {batch.Products.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/40 font-medium text-slate-700">
                                  <td className="p-3 font-semibold text-slate-900">{p.Product}</td>
                                  <td className="p-3 font-mono">{p.Quantity}</td>
                                  <td className="p-3 font-mono">{parseFloat(p["Purchase Price"] as any || 0).toFixed(1)}</td>
                                  <td className="p-3 font-mono">{parseFloat(p["Shipping Cost"] as any || 0).toFixed(1)}</td>
                                  <td className="p-3 font-mono">{parseFloat(p["Local Cost"] as any || 0).toFixed(1)}</td>
                                  <td className="p-3 font-mono font-bold text-slate-900">{parseFloat(p["Total Cost per product"] as any || 0).toFixed(1)}</td>
                                  <td className="p-3 text-right font-mono text-[10px] text-slate-500">{p["Product Weight"]?.toFixed(2)} KG</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}

                  {batches.length === 0 && (
                    <div className="text-center py-10 font-bold text-slate-400 text-sm">
                      Nobatches present.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Sub-tab 2: LOG NEW IMPORT BATCH */}
            {batchesTab === "create" && (
              <form onSubmit={saveBatch} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-4xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span>Import Batch Flight Metadata</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Carrier Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Bassam Mohamed"
                      value={newBatch.name}
                      onChange={e => setNewBatch(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">EGY Contact Phone</label>
                    <input
                      type="text"
                      value={newBatch.egyPhone}
                      onChange={e => setNewBatch(prev => ({ ...prev, egyPhone: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">UAE Contact Phone *</label>
                    <input
                      type="text"
                      value={newBatch.uaePhone}
                      onChange={e => setNewBatch(prev => ({ ...prev, uaePhone: e.target.value }))}
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-semibold focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Passport Number</label>
                    <input
                      type="text"
                      value={newBatch.passportNumber}
                      onChange={e => setNewBatch(prev => ({ ...prev, passportNumber: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Location in Egypt</label>
                    <input
                      type="text"
                      value={newBatch.locationInEgypt}
                      onChange={e => setNewBatch(prev => ({ ...prev, locationInEgypt: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Carrier Flight Details</label>
                    <input
                      type="text"
                      value={newBatch.flightDetails}
                      onChange={e => setNewBatch(prev => ({ ...prev, flightDetails: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Arrival Date (UAE) *</label>
                    <input
                      type="date"
                      value={newBatch.arrivalDate}
                      onChange={e => setNewBatch(prev => ({ ...prev, arrivalDate: e.target.value }))}
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center justify-between">
                    <span>Products packed in Batch</span>
                    <button
                      type="button"
                      onClick={handleAddBatchProductRow}
                      className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Item</span>
                    </button>
                  </h3>

                  <div className="space-y-4">
                    {newBatch.products.map((item, index) => (
                      <div key={index} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 grid grid-cols-1 md:grid-cols-5 gap-3 items-end relative group">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Honey Product Type *</label>
                          <select
                            value={item.productName}
                            onChange={e => {
                              const copy = [...newBatch.products];
                              copy[index].productName = e.target.value;
                              setNewBatch(prev => ({ ...prev, products: copy }));
                            }}
                            required
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                          >
                            {Object.keys(PRODUCT_WEIGHTS).map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity Box *</label>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => {
                              const copy = [...newBatch.products];
                              copy[index].quantity = parseInt(e.target.value) || 1;
                              setNewBatch(prev => ({ ...prev, products: copy }));
                            }}
                            required
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Purchase Unit Cost *</label>
                          <input
                            type="number"
                            value={item.purchasePrice}
                            onChange={e => {
                              const copy = [...newBatch.products];
                              copy[index].purchasePrice = parseFloat(e.target.value) || 0;
                              setNewBatch(prev => ({ ...prev, products: copy }));
                            }}
                            required
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Item Cost</span>
                            <span className="text-xs font-bold font-mono text-slate-500 block py-1.5 px-0.5">
                              {((item.purchasePrice + item.shippingCost + item.localCost) * item.quantity).toFixed(1)} AED
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveBatchProductRow(index)}
                            className="text-slate-400 hover:text-rose-600 transition py-1.5 font-bold"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>

                        {/* Extra Toll/Freight details expandable */}
                        <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 pt-2 border-t border-dashed border-slate-200">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">Custom jars packing cost (Unit)</span>
                            <input
                              type="number"
                              value={item.localCost}
                              onChange={e => {
                                const copy = [...newBatch.products];
                                copy[index].localCost = parseFloat(e.target.value) || 0;
                                setNewBatch(prev => ({ ...prev, products: copy }));
                              }}
                              className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-mono w-full"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold block uppercase">Flight cargo share (Unit)</span>
                            <input
                              type="number"
                              value={item.shippingCost}
                              onChange={e => {
                                const copy = [...newBatch.products];
                                copy[index].shippingCost = parseFloat(e.target.value) || 0;
                                setNewBatch(prev => ({ ...prev, products: copy }));
                              }}
                              className="bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-mono w-full"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Carrier Notes / Freight References</label>
                  <textarea
                    rows={3}
                    placeholder="Batch transit tracking notes, flight logs..."
                    value={newBatch.notes}
                    onChange={e => setNewBatch(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-[#fafaf9] border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700"
                  />
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNewBatch({
                        name: "",
                        egyPhone: "",
                        uaePhone: "",
                        passportNumber: "",
                        locationInEgypt: "",
                        flightDetails: "",
                        arrivalDate: new Date().toISOString().split("T")[0],
                        notes: "",
                        products: [{ productName: "Honey 1kg", quantity: 10, purchasePrice: 10, shippingCost: 5, localCost: 2 }]
                      });
                      setBatchesTab("view");
                    }}
                    className="bg-slate-105 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    Cancel Draft
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-7 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition"
                  >
                    Save Stock Batch
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ----------------------------------------------------
           GENERAL LEDGER VIEW
           ---------------------------------------------------- */}
        {page === "balance" && (
          <div className="space-y-6">
            
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setBalanceTab("balance")}
                className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
                  balanceTab === "balance" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                Cash Balance Book
              </button>
              <button
                onClick={() => setBalanceTab("expenses")}
                className={`px-6 py-3 font-semibold text-sm border-b-2 transition ${
                  balanceTab === "expenses" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                Business Expenses ledger
              </button>
              <button
                onClick={() => setBalanceTab("add-expense")}
                className={`px-6 py-3 font-semibold text-sm border-b-2 transition flex items-center gap-2 ${
                  balanceTab === "add-expense" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-800"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
            </div>

            {/* TAB 1: CASH BALANCE BOOK */}
            {balanceTab === "balance" && (
              <div className="space-y-8">
                
                {/* Ledger manual insertion form */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Ledger form */}
                  <form onSubmit={saveBalanceEntry} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span>Log Manual Transaction</span>
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Inject capital, initial bank seed, or manual adjustments.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Transaction type</label>
                      <select
                        value={newBalance.type}
                        onChange={e => setNewBalance(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                      >
                        <option value="Income">Income (Deposit)</option>
                        <option value="Expense">Expense (Withdrawal)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount AED *</label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={newBalance.amount || ""}
                          onChange={e => setNewBalance(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Post Date</label>
                        <input
                          type="date"
                          value={newBalance.date}
                          onChange={e => setNewBalance(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Post details</label>
                      <input
                        type="text"
                        placeholder="e.g. Bank credit share payment"
                        value={newBalance.details}
                        onChange={e => setNewBalance(prev => ({ ...prev, details: e.target.value }))}
                        required
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Post notes</label>
                      <input
                        type="text"
                        placeholder="Internal auditing notes..."
                        value={newBalance.note}
                        onChange={e => setNewBalance(prev => ({ ...prev, note: e.target.value }))}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-2 text-xs"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition uppercase tracking-wider"
                    >
                      Post Ledger Entry
                    </button>
                  </form>

                  {/* Ledger list view */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Filter Months</label>
                        <select
                          value={balMonth}
                          onChange={e => setBalMonth(e.target.value)}
                          className="bg-slate-55 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold"
                        >
                          <option value="">AllMonths</option>
                          {monthsList.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Category Type</label>
                        <select
                          value={balType}
                          onChange={e => setBalType(e.target.value)}
                          className="bg-slate-55 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold border-slate-200/80"
                        >
                          <option value="all">All Types</option>
                          <option value="Income">Income (Inflow)</option>
                          <option value="Expense">Expense (Outflow)</option>
                        </select>
                      </div>

                      <button
                        onClick={fetchBalanceTransactions}
                        className="bg-slate-900 text-white rounded-lg text-xs font-semibold px-4 py-2 hover:bg-slate-800 transition"
                      >
                        Apply Filter
                      </button>
                    </section>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-450 uppercase font-bold text-[10px]">
                            <th className="p-3">Reference ID</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">In/Out Inflow</th>
                            <th className="p-3">Details</th>
                            <th className="p-3">Movement Cash</th>
                            <th className="p-3">Running Balance</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {balanceTransactions.map((tr, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 transition">
                              <td className="p-3 text-[10px] font-bold text-slate-450">{tr["Transaction ID"]}</td>
                              <td className="p-3 text-slate-650">{tr.Date}</td>
                              <td className="p-3 truncate font-sans">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  tr.Type === "Income" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                                }`}>
                                  {tr.Type}
                                </span>
                              </td>
                              <td className="p-3 truncate max-w-[150px] font-sans text-slate-800 font-medium" title={tr.Details}>{tr.Details}</td>
                              <td className={`p-3 font-semibold ${tr.Type === "Income" ? "text-emerald-600" : "text-rose-500"}`}>
                                {tr.Type === "Income" ? "+" : "-"}{tr.Amount.toFixed(1)}
                              </td>
                              <td className="p-3 font-extrabold text-slate-900">{tr.Balance.toFixed(1)}</td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleDeleteBalance(tr["Transaction ID"])}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: BUSINESS EXPENSES LEDGER */}
            {balanceTab === "expenses" && (
              <div className="space-y-6">
                
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
                  <div className="w-[180px]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Month Filter</label>
                    <select
                      value={expMonth}
                      onChange={e => setExpMonth(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="">All Months</option>
                      {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-[185px]">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Category Type</label>
                    <select
                      value={expType}
                      onChange={e => setExpType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="all">All Expenses</option>
                      <option value="Expense">Business Expenses</option>
                    </select>
                  </div>

                  <button
                    onClick={fetchExpenses}
                    className="bg-slate-900 text-white rounded-lg text-xs font-bold px-6 py-2.5 hover:bg-slate-800 transition"
                  >
                    Filter list
                  </button>
                </section>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-450 uppercase font-bold text-[10px]">
                        <th className="p-4">ID</th>
                        <th className="p-4">Post Date</th>
                        <th className="p-4">Category Type</th>
                        <th className="p-4">Budget Classification</th>
                        <th className="p-4">Details Description</th>
                        <th className="p-4">Cost AED</th>
                        <th className="p-4">Paid Method</th>
                        <th className="p-4 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {expenses.map((exp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="p-4 font-mono font-bold text-slate-450">{exp["Expense ID"]}</td>
                          <td className="p-4 whitespace-nowrap font-mono">{exp.Date}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              exp.Type === "Expense" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {exp.Type}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="bg-slate-150 text-slate-700 border border-slate-200/50 px-2 py-0.5 rounded text-[10px] font-semibold">{exp.Category}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-900" title={exp.Description}>{exp.Description}</td>
                          <td className="p-4 font-mono font-bold text-slate-950">{exp.Amount.toFixed(1)}</td>
                          <td className="p-4">{exp["Payment Method"]}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteExpense(exp["Expense ID"])}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-medium font-sans">No expenses logged.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB 3: ADD EXPENSE / DISTRIBUTION */}
            {balanceTab === "add-expense" && (
              <form onSubmit={saveExpense} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span>Log Expense Ledger Event</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date</label>
                    <input
                      type="date"
                      value={newExpense.date}
                      onChange={e => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Budget Classification</label>
                    <input
                      type="text"
                      value="Business Expenses"
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category *</label>
                    <select
                      value={newExpense.category}
                      onChange={e => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white transition"
                    >
                      <option value="">Select Category</option>
                      {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Amount (AED) *</label>
                    <input
                      type="number"
                      min={1}
                      value={newExpense.amount || ""}
                      onChange={e => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      required
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Event Description / Details *</label>
                  <input
                    type="text"
                    placeholder="e.g. Monthly rent payout or shareholder dividend share..."
                    value={newExpense.description}
                    onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    required
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Payment Method</label>
                    <select
                      value={newExpense.paymentMethod}
                      onChange={e => setNewExpense(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white transition"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Reference Number</label>
                    <input
                      type="text"
                      placeholder="Receipt or bill transaction hash..."
                      value={newExpense.reference}
                      onChange={e => setNewExpense(prev => ({ ...prev, reference: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBalanceTab("expenses")}
                    className="bg-slate-105 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white hover:bg-blue-700 px-7 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition"
                  >
                    Post Expense Ledger
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* ----------------------------------------------------
           CUSTOMERS ROSTER VIEW
           ---------------------------------------------------- */}
        {page === "customers" && (
          <div className="space-y-6">
            
            {/* Find customer ribbon */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-450" />
                </div>
                <input
                  type="text"
                  placeholder="Filter client records by name pattern or phone digits..."
                  value={customerSearchQuery}
                  onChange={e => {
                    setCustomerSearchQuery(e.target.value);
                    setCustomerSearchQuery(e.target.value);
                    if (e.target.value === "") {
                      fetchCustomers();
                    } else {
                      // Apply inline search on searchCustomers API
                      fetch(`/api/customers/search?query=${encodeURIComponent(e.target.value)}`)
                        .then(r => r.json())
                        .then(data => setCustomers(data));
                    }
                  }}
                  className="w-full bg-slate-50/60 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:bg-white transition"
                />
              </div>

              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Total active clients: <span className="font-mono text-slate-900 bg-slate-100 px-2.5 py-1 rounded border border-slate-200/80">{customers.length}</span>
              </div>
            </section>

            {/* Customers table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-450 uppercase font-bold text-[10px]">
                    <th className="p-4">Customer ID</th>
                    <th className="p-4">Client Name</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4">Location Field</th>
                    <th className="p-4">Orders Placed</th>
                    <th className="p-4">Total Revenue</th>
                    <th className="p-4 text-right">Profile Edit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {customers.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono font-bold text-slate-450">{c["Customer ID"]}</td>
                      <td className="p-4 font-semibold text-slate-900">{c["Customer Name"]}</td>
                      <td className="p-4 font-mono">{c["Customer Phone"]}</td>
                      <td className="p-4">{c["Customer Location"] || "Other"}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-800 border border-slate-200/50 px-2 py-0.5 rounded text-[10px] font-bold">
                          {c["Order Count"]} orders
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900">{formatAED(c["Total Spent"])}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setEditCustomerObj(c)}
                          className="text-slate-400 hover:text-blue-600 p-1.5 rounded transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-medium font-sans">No customer profiles found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal - CUSTOMER PROFILE EDIT Overlay */}
            {editCustomerObj && (
              <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in">
                <form onSubmit={saveCustomerChanges} className="bg-white p-8 rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl space-y-5 animate-scale-up">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span>Edit Customer Profile</span>
                    </span>
                    <button type="button" onClick={() => setEditCustomerObj(null)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Customer Identifier</label>
                      <input
                        type="text"
                        value={editCustomerObj["Customer ID"]}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Client Name *</label>
                      <input
                        type="text"
                        value={editCustomerObj["Customer Name"]}
                        onChange={e => setEditCustomerObj(prev => prev ? { ...prev, "Customer Name": e.target.value } : null)}
                        required
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Phone *</label>
                      <input
                        type="text"
                        value={editCustomerObj["Customer Phone"]}
                        onChange={e => setEditCustomerObj(prev => prev ? { ...prev, "Customer Phone": e.target.value } : null)}
                        required
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono font-semibold focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Emirates Location *</label>
                      <select
                        value={editCustomerObj["Customer Location"]}
                        onChange={e => setEditCustomerObj(prev => prev ? { ...prev, "Customer Location": e.target.value } : null)}
                        required
                        className="w-full border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold"
                      >
                        <option value="Dubai">Dubai</option>
                        <option value="Sharjah">Sharjah</option>
                        <option value="Ajman">Ajman</option>
                        <option value="Abu Dhabi">Abu Dhabi</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEditCustomerObj(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 text-white hover:bg-blue-700 px-5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
