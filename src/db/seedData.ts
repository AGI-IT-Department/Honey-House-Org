export interface CustomerSeed {
  id: string;
  name: string;
  phone: string;
  location: string;
  notes: string;
}

export interface BatchItemSeed {
  productName: string;
  quantity: number;
  purchasePrice: number;
  shippingPrice: number;
  localCost: number;
  totalCost: number;
  status: string;
  notes?: string;
}

export interface BatchSeed {
  id: string;
  name: string;
  egyPhone: string;
  uaePhone: string;
  passportNumber: string;
  locationEgypt: string;
  flightDetails: string;
  arrivalDate: string;
  status: string;
  notes: string;
  items: BatchItemSeed[];
}

export interface OrderSeed {
  orderId: string;
  orderDate: string;
  customerId: string;
  customerName: string; // fallback if join misses
  customerPhone: string;
  customerLocation: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  totalSale: number;
  totalCost: number;
  profit: number;
  deliveryStatus: string;
  paymentStatus: string;
  batchId: string;
}

export interface ExpenseSeed {
  id: string;
  date: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  notes: string;
}

export interface BalanceSeed {
  id: string;
  date: string;
  type: string;
  details: string;
  amount: number;
  balance: number;
  note: string;
}

export const SEED_CUSTOMERS: CustomerSeed[] = [
  { id: "CUST000066", name: "Mina mammdouh", phone: "558542930", location: "Ajman", notes: "" },
  { id: "CUST0004", name: "Rafiq Yousef", phone: "555667507", location: "Sharjah", notes: "" },
  { id: "CUST0005", name: "Karolos El Dress", phone: "557904531", location: "Sharjah", notes: "" },
  { id: "CUST000067", name: "George Gym", phone: "522843537", location: "Dubai", notes: "" },
  { id: "CUST0006", name: "Wagdi Gamal", phone: "562010563", location: "Sharjah", notes: "" },
  { id: "CUST0007", name: "Chaima Diab", phone: "586746651", location: "Dubai", notes: "" },
  { id: "CUST0008", name: "Josh Nurse", phone: "554125498", location: "Dubai", notes: "" },
  { id: "CUST0010", name: "Sahara", phone: "569694914", location: "Dubai", notes: "" },
  { id: "CUST0011", name: "Saltant", phone: "585969080", location: "Dubai", notes: "" },
  { id: "CUST0012", name: "Ahmed Ghabbor", phone: "552000470", location: "Dubai", notes: "" },
  { id: "CUST0013", name: "Awadullah", phone: "564085965", location: "Dubai", notes: "" },
  { id: "CUST0015", name: "Gene", phone: "585969080", location: "Dubai", notes: "" },
  { id: "CUST0016", name: "Fatima Younis", phone: "562162282", location: "Dubai", notes: "" },
  { id: "CUST0017", name: "Munisha", phone: "543640363", location: "Dubai", notes: "" },
  { id: "CUST0018", name: "Asma Jad", phone: "589969518", location: "Dubai", notes: "" },
  { id: "CUST0019", name: "Ibrahim", phone: "568837778", location: "Dubai", notes: "" },
  { id: "CUST0020", name: "Amurutah", phone: "585410288", location: "Dubai", notes: "" },
  { id: "CUST0021", name: "Ilya Gym", phone: "586728038", location: "Dubai", notes: "" },
  { id: "CUST0025", name: "Adel Muflah", phone: "561502156", location: "Sharjah", notes: "" },
  { id: "CUST0026", name: "Salwa Alnaimi", phone: "561117166", location: "Ajman", notes: "" },
  { id: "CUST0028", name: "Atif Ayad", phone: "528492630", location: "Sharjah", notes: "" },
  { id: "CUST0029", name: "Nancy mina", phone: "569761410", location: "Sharjah", notes: "" },
  { id: "CUST0030", name: "Mina Romany", phone: "553527443", location: "Sharjah", notes: "" },
  { id: "CUST0031", name: "FR.Youhana", phone: "504589589", location: "Sharjah", notes: "" },
  { id: "CUST0032", name: "church kitchen", phone: "568326116", location: "Sharjah", notes: "" },
  { id: "CUST0049", name: "Ereny Edouard", phone: "502180335", location: "Sharjah", notes: "" },
  { id: "CUST0058", name: "soumaya", phone: "561316857", location: "Dubai", notes: "" },
  { id: "CUST0059", name: "Remonda", phone: "501013470", location: "Sharjah", notes: "" },
  { id: "CUST0060", name: "Marita", phone: "504509791", location: "Dubai", notes: "" },
  { id: "CUST0062", name: "Samir atif", phone: "545540354", location: "Ajman", notes: "" },
  { id: "CUST0064", name: "Rany", phone: "502138858", location: "Sharjah", notes: "" },
  { id: "CUST0065", name: "Fatema Abdulla", phone: "505848855", location: "Dubai", notes: "" },
  { id: "CUST0001", name: "Wasted distribution", phone: "568326116", location: "Sharjah", notes: "" },
  { id: "CUST0002", name: "Free samples", phone: "561117166", location: "Ajman", notes: "" }
];

export const SEED_BATCHES: BatchSeed[] = [
  {
    id: "BATCH01",
    name: "mina mousa",
    egyPhone: "1559722097",
    uaePhone: "568326116",
    passportNumber: "A28228521",
    locationEgypt: "shrouq",
    flightDetails: "From Cairo to Abu Dahib",
    arrivalDate: "2025-05-29",
    status: "Inactive",
    notes: "10 kg honey + 3 kg beeswax + 50 g royal jelly + 50 g grains",
    items: [
      { productName: "Honey 1kg", quantity: 10, purchasePrice: 11, shippingPrice: 11, localCost: 3, totalCost: 25, status: "Inactive" },
      { productName: "Honey 500g", quantity: 10, purchasePrice: 5, shippingPrice: 5.5, localCost: 2, totalCost: 13, status: "Inactive" },
      { productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 10, purchasePrice: 19.5, shippingPrice: 5.5, localCost: 2, totalCost: 27, status: "Inactive" },
      { productName: "Honey 250g", quantity: 10, purchasePrice: 2.5, shippingPrice: 2.75, localCost: 1.5, totalCost: 7, status: "Inactive" }
    ]
  },
  {
    id: "BATCH02",
    name: "mahmoud gamail",
    egyPhone: "1144811939",
    uaePhone: "525526140",
    passportNumber: "A41266921",
    locationEgypt: "Giza",
    flightDetails: "From Cairo to Sharjah",
    arrivalDate: "2025-07-06",
    status: "Inactive",
    notes: "total pric 240 + shipping 200 +jar cos 95 == total Batch cost 535AED\n15 kg honey + 5 kg beeswax + 50 g royal jelly + 50 g grains",
    items: [
      { productName: "Honey 1kg", quantity: 20, purchasePrice: 11, shippingPrice: 11, localCost: 3, totalCost: 25, status: "Inactive" },
      { productName: "Honey 500g", quantity: 15, purchasePrice: 5, shippingPrice: 5.5, localCost: 2, totalCost: 13, status: "Inactive" },
      { productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 10, purchasePrice: 19.5, shippingPrice: 5.5, localCost: 2, totalCost: 27, status: "Inactive" },
      { productName: "Honey 250g", quantity: 15, purchasePrice: 2.5, shippingPrice: 2.75, localCost: 1.5, totalCost: 7, status: "Inactive" }
    ]
  },
  {
    id: "BATCH03",
    name: "Bassam Mohamed",
    egyPhone: "1031701610",
    uaePhone: "505514543",
    passportNumber: "784-1986-2682419-1",
    locationEgypt: "Cairo",
    flightDetails: "From Cairo to Sharjah",
    arrivalDate: "2025-07-10",
    status: "Inactive",
    notes: "total pric 195 + shipping 150 +jar cos 12*200=25 aed +app cost 57 == total Batch cost 427 AED\n10 kg honey + 5 kg beeswax + 50 g royal jelly + 50 g grains",
    items: [
      { productName: "Honey 1kg", quantity: 15, purchasePrice: 11, shippingPrice: 11, localCost: 3, totalCost: 25, status: "Inactive" },
      { productName: "Honey 500g", quantity: 10, purchasePrice: 5, shippingPrice: 5.5, localCost: 2, totalCost: 13, status: "Inactive" },
      { productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 10, purchasePrice: 19.5, shippingPrice: 5.5, localCost: 2, totalCost: 27, status: "Inactive" },
      { productName: "Honey 250g", quantity: 15, purchasePrice: 2.5, shippingPrice: 2.75, localCost: 1.25, totalCost: 7, status: "Inactive" }
    ]
  },
  {
    id: "BATCH04",
    name: "Gebreal Gebreal",
    egyPhone: "1500148899",
    uaePhone: "504252284",
    passportNumber: "784-1984-8432370-8",
    locationEgypt: "cairo",
    flightDetails: "from cairo To Dubai",
    arrivalDate: "2025-10-30",
    status: "Inactive",
    notes: "heater and shrink and sample =55+55=110\n15 kg honey +10 kg beeswax",
    items: [
      { productName: "Honey 1kg", quantity: 25, purchasePrice: 16, shippingPrice: 4.4, localCost: 3, totalCost: 23, status: "Inactive" },
      { productName: "Honey 500g", quantity: 15, purchasePrice: 8, shippingPrice: 2.2, localCost: 1.25, totalCost: 11, status: "Inactive" },
      { productName: "beeswax 500g", quantity: 20, purchasePrice: 9, shippingPrice: 2.2, localCost: 2, totalCost: 13, status: "Inactive" },
      { productName: "Honey 250g", quantity: 15, purchasePrice: 4, shippingPrice: 1.1, localCost: 2, totalCost: 7, status: "Inactive" }
    ]
  },
  {
    id: "BATCH05",
    name: "George sophay",
    egyPhone: "1148287971",
    uaePhone: "523984150",
    passportNumber: "",
    locationEgypt: "cairo",
    flightDetails: "from cairo To Dubai",
    arrivalDate: "2025-11-22",
    status: "Inactive",
    notes: "10kg honey",
    items: [
      { productName: "Honey 1kg", quantity: 10, purchasePrice: 10, shippingPrice: 2.5, localCost: 3, totalCost: 16, status: "Inactive" },
      { productName: "Honey 500g", quantity: 10, purchasePrice: 5, shippingPrice: 1.25, localCost: 2.1, totalCost: 8, status: "Inactive" },
      { productName: "Honey 250g", quantity: 10, purchasePrice: 2.5, shippingPrice: 0.625, localCost: 1.7, totalCost: 5, status: "Inactive" }
    ]
  },
  {
    id: "BATCH06",
    name: "mohamed salah",
    egyPhone: "1277200825",
    uaePhone: "561858487",
    passportNumber: "a37467143",
    locationEgypt: "sharqia",
    flightDetails: "from cairo to sharjah",
    arrivalDate: "2025-12-03",
    status: "Active",
    notes: "15 kg honey +10 kg beeswax",
    items: [
      { productName: "Honey 1kg", quantity: 25, purchasePrice: 11, shippingPrice: 10, localCost: 3, totalCost: 24, status: "Active" },
      { productName: "Honey 500g", quantity: 25, purchasePrice: 5.5, shippingPrice: 5, localCost: 2.1, totalCost: 13, status: "Active" },
      { productName: "beeswax 500g", quantity: 10, purchasePrice: 6, shippingPrice: 5, localCost: 5, totalCost: 16, status: "Active" },
      { productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 10, purchasePrice: 19.5, shippingPrice: 5.5, localCost: 2, totalCost: 27, status: "Active" },
      { productName: "Honey 250g", quantity: 15, purchasePrice: 2.75, shippingPrice: 2.5, localCost: 1.7, totalCost: 7, status: "Active" }
    ]
  },
  {
    id: "BATCH07",
    name: "Robin Smile",
    egyPhone: "1013774496",
    uaePhone: "507065217",
    passportNumber: "",
    locationEgypt: "cairo",
    flightDetails: "from ciro to dubai",
    arrivalDate: "2025-12-15",
    status: "Active",
    notes: "20 kg honey",
    items: [
      { productName: "Honey 1kg", quantity: 20, purchasePrice: 11.5, shippingPrice: 8, localCost: 3, totalCost: 23, status: "Active" },
      { productName: "Honey 500g", quantity: 20, purchasePrice: 5.5, shippingPrice: 5, localCost: 2.1, totalCost: 13, status: "Active" },
      { productName: "Honey (Squeeze 500g)", quantity: 10, purchasePrice: 5.5, shippingPrice: 5, localCost: 4, totalCost: 15, status: "Active" },
      { productName: "Honey (Squeeze 250g)", quantity: 10, purchasePrice: 2.75, shippingPrice: 2.5, localCost: 3, totalCost: 8, status: "Active" },
      { productName: "beeswax 500g", quantity: 10, purchasePrice: 6, shippingPrice: 5, localCost: 5, totalCost: 16, status: "Active" },
      { productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 10, purchasePrice: 19.5, shippingPrice: 5.5, localCost: 2, totalCost: 27, status: "Active" },
      { productName: "Honey 250g", quantity: 15, purchasePrice: 2.75, shippingPrice: 2.5, localCost: 1.7, totalCost: 7, status: "Active" }
    ]
  },
  {
    id: "BATCH08",
    name: "Amer roashdy",
    egyPhone: "1558590522",
    uaePhone: "543024647",
    passportNumber: "",
    locationEgypt: "Cairo",
    flightDetails: "From Cairo to Sharjah",
    arrivalDate: "2026-02-22",
    status: "Active",
    notes: "",
    items: [
      { productName: "Honey 1kg", quantity: 15, purchasePrice: 10, shippingPrice: 10, localCost: 3, totalCost: 23, status: "Active" },
      { productName: "Honey 500g", quantity: 15, purchasePrice: 5, shippingPrice: 5, localCost: 2.5, totalCost: 12.5, status: "Active" },
      { productName: "Honey 250g", quantity: 15, purchasePrice: 2.5, shippingPrice: 2.5, localCost: 1.25, totalCost: 6.25, status: "Active" },
      { productName: "Honey (Squeeze 250g)", quantity: 10, purchasePrice: 2.5, shippingPrice: 2.5, localCost: 3, totalCost: 8, status: "Active" },
      { productName: "Honey (Squeeze 500g)", quantity: 10, purchasePrice: 5, shippingPrice: 5, localCost: 4, totalCost: 14, status: "Active" }
    ]
  },
  {
    id: "BATCH09",
    name: "Mostafa halfy",
    egyPhone: "1068035291",
    uaePhone: "504650882",
    passportNumber: "A40574540",
    locationEgypt: "GIZA",
    flightDetails: "from CAIRO to SHJ",
    arrivalDate: "2026-04-04",
    status: "Active",
    notes: "",
    items: [
      { productName: "Honey 1kg", quantity: 15, purchasePrice: 10.5, shippingPrice: 14, localCost: 3, totalCost: 27.5, status: "Active" },
      { productName: "Honey 500g", quantity: 10, purchasePrice: 5.5, shippingPrice: 7, localCost: 2, totalCost: 14.5, status: "Active" },
      { productName: "Honey 250g", quantity: 10, purchasePrice: 2.75, shippingPrice: 3.5, localCost: 1.5, totalCost: 7.75, status: "Active" },
      { productName: "Honey (Squeeze 250g)", quantity: 10, purchasePrice: 2.75, shippingPrice: 3.5, localCost: 3, totalCost: 9.25, status: "Active" },
      { productName: "Honey (Squeeze 500g)", quantity: 10, purchasePrice: 5.5, shippingPrice: 7, localCost: 4, totalCost: 16.5, status: "Active" },
      { productName: "beeswax 500g", quantity: 10, purchasePrice: 5.5, shippingPrice: 7, localCost: 6, totalCost: 18.5, status: "Active" },
      { productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 5, purchasePrice: 8, shippingPrice: 7, localCost: 3, totalCost: 18, status: "Active" }
    ]
  },
  {
    id: "BATCH10",
    name: "Ahmed adel",
    egyPhone: "+201034140091",
    uaePhone: "971567300207",
    passportNumber: "A42789969",
    locationEgypt: "Cairo",
    flightDetails: "from CAIRO to SHJ",
    arrivalDate: "2026-06-05",
    status: "Active",
    notes: "",
    items: [
      { productName: "Honey 1kg", quantity: 30, purchasePrice: 8, shippingPrice: 12, localCost: 5, totalCost: 25, status: "Active" },
      { productName: "Honey 500g", quantity: 15, purchasePrice: 4, shippingPrice: 6, localCost: 2.5, totalCost: 12.5, status: "Active" },
      { productName: "Honey 250g", quantity: 15, purchasePrice: 2, shippingPrice: 3, localCost: 2, totalCost: 7, status: "Active" },
      { productName: "Honey (Squeeze 250g)", quantity: 10, purchasePrice: 2, shippingPrice: 3, localCost: 3.5, totalCost: 8.5, status: "Active" },
      { productName: "Honey (Squeeze 500g)", quantity: 10, purchasePrice: 4, shippingPrice: 6, localCost: 4, totalCost: 14, status: "Active" },
      { productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 5, purchasePrice: 14, shippingPrice: 6, localCost: 3, totalCost: 23, status: "Active" }
    ]
  }
];

export const SEED_ORDERS: OrderSeed[] = [
  { orderId: "ORD0001", orderDate: "2025-06-27", customerId: "CUST0004", customerName: "Rafiq Yousef", customerPhone: "555667507", customerLocation: "Sharjah", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 50, costPrice: 22, totalSale: 50, totalCost: 22, profit: 28, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0004", orderDate: "2025-06-23", customerId: "CUST0006", customerName: "Wagdi Gamal", customerPhone: "562010563", customerLocation: "Sharjah", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 75, costPrice: 22, totalSale: 75, totalCost: 22, profit: 53, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0006", orderDate: "2025-06-24", customerId: "CUST0008", customerName: "Josh Nurse", customerPhone: "554125498", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 14, totalSale: 30, totalCost: 14, profit: 16, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0007", orderDate: "2025-06-26", customerId: "CUST0008", customerName: "Josh Nurse", customerPhone: "554125498", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 14, totalSale: 30, totalCost: 14, profit: 16, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0008", orderDate: "2025-06-24", customerId: "CUST0010", customerName: "Sahara", customerPhone: "569694914", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 14, totalSale: 30, totalCost: 14, profit: 16, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0009", orderDate: "2025-06-24", customerId: "CUST0011", customerName: "Saltant", customerPhone: "585969080", customerLocation: "Dubai", productName: "Honey 250g", quantity: 1, unitPrice: 15, costPrice: 7, totalSale: 15, totalCost: 7, profit: 8, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0010", orderDate: "2025-06-24", customerId: "CUST0012", customerName: "Ahmed Ghabbor", customerPhone: "552000470", customerLocation: "Dubai", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 75, costPrice: 22, totalSale: 75, totalCost: 22, profit: 53, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0011", orderDate: "2025-06-24", customerId: "CUST0013", customerName: "Awadullah", customerPhone: "564085965", customerLocation: "Dubai", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 75, costPrice: 22, totalSale: 75, totalCost: 22, profit: 53, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0012", orderDate: "2025-06-24", customerId: "CUST0019", customerName: "Ibrahim", customerPhone: "568837778", customerLocation: "Dubai", productName: "Honey 1kg", quantity: 2, unitPrice: 50, costPrice: 28, totalSale: 100, totalCost: 56, profit: 44, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0013", orderDate: "2025-06-25", customerId: "CUST0015", customerName: "Gene", customerPhone: "585969080", customerLocation: "Dubai", productName: "Honey 250g", quantity: 1, unitPrice: 15, costPrice: 7, totalSale: 15, totalCost: 7, profit: 8, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0014", orderDate: "2025-06-25", customerId: "CUST0016", customerName: "Fatima Younis", customerPhone: "562162282", customerLocation: "Dubai", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 28, totalSale: 50, totalCost: 28, profit: 22, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0015", orderDate: "2025-06-26", customerId: "CUST0017", customerName: "Munisha", customerPhone: "543640363", customerLocation: "Dubai", productName: "Honey 250g", quantity: 1, unitPrice: 15, costPrice: 7, totalSale: 15, totalCost: 7, profit: 8, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0016", orderDate: "2025-06-26", customerId: "CUST0018", customerName: "Asma Jad", customerPhone: "589969518", customerLocation: "Dubai", productName: "Honey 250g", quantity: 1, unitPrice: 15, costPrice: 7, totalSale: 15, totalCost: 7, profit: 8, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0017", orderDate: "2025-06-27", customerId: "CUST0018", customerName: "Asma Jad", customerPhone: "589969518", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 13, totalSale: 30, totalCost: 13, profit: 17, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0023", orderDate: "2025-06-27", customerId: "CUST0019", customerName: "Ibrahim", customerPhone: "568837778", customerLocation: "Dubai", productName: "Honey 1kg", quantity: 2, unitPrice: 50, costPrice: 25, totalSale: 100, totalCost: 50, profit: 50, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH01" },
  { orderId: "ORD0002", orderDate: "2025-07-12", customerId: "CUST0004", customerName: "Rafiq Yousef", customerPhone: "555667507", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 3, unitPrice: 30, costPrice: 7, totalSale: 90, totalCost: 21, profit: 69, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0003", orderDate: "2025-06-18", customerId: "CUST0005", customerName: "Karolos El Dress", customerPhone: "557904531", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 2, unitPrice: 30, costPrice: 14, totalSale: 60, totalCost: 28, profit: 32, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0005", orderDate: "2025-06-24", customerId: "CUST0007", customerName: "Chaima Diab", customerPhone: "586746651", customerLocation: "Dubai", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 28, totalSale: 50, totalCost: 28, profit: 22, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0018", orderDate: "2025-07-07", customerId: "CUST0018", customerName: "Asma Jad", customerPhone: "589969518", customerLocation: "Dubai", productName: "Honey 250g", quantity: 2, unitPrice: 15, costPrice: 7, totalSale: 30, totalCost: 14, profit: 16, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0025", orderDate: "2025-06-27", customerId: "CUST0020", customerName: "Amurutah", customerPhone: "585410288", customerLocation: "Dubai", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 25, totalSale: 50, totalCost: 25, profit: 25, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0026", orderDate: "2025-07-07", customerId: "CUST0021", customerName: "Ilya Gym", customerPhone: "586728038", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 13, totalSale: 30, totalCost: 13, profit: 17, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0027", orderDate: "2025-06-27", customerId: "CUST0025", customerName: "Adel Muflah", customerPhone: "561502156", customerLocation: "Sharjah", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 50, costPrice: 22, totalSale: 50, totalCost: 22, profit: 28, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0028", orderDate: "2025-07-04", customerId: "CUST0002", customerName: "Free samples", customerPhone: "561117166", customerLocation: "Ajman", productName: "Honey 1kg", quantity: 2, unitPrice: 0, costPrice: 9, totalSale: 0, totalCost: 18, profit: -18, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0029", orderDate: "2025-07-08", customerId: "CUST0002", customerName: "Free samples", customerPhone: "561117166", customerLocation: "Ajman", productName: "Honey 500g", quantity: 2, unitPrice: 0, costPrice: 22, totalSale: 0, totalCost: 44, profit: -44, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0030", orderDate: "2025-07-17", customerId: "CUST0028", customerName: "Atif Ayad", customerPhone: "528492630", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 60, costPrice: 9, totalSale: 60, totalCost: 9, profit: 51, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0031", orderDate: "2025-11-02", customerId: "CUST0029", customerName: "Nancy mina", customerPhone: "569761410", customerLocation: "Sharjah", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 60, costPrice: 27, totalSale: 60, totalCost: 27, profit: 33, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0032", orderDate: "2025-07-18", customerId: "CUST0030", customerName: "Mina Romany", customerPhone: "553527443", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 1, unitPrice: 20, costPrice: 7, totalSale: 20, totalCost: 7, profit: 13, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0034", orderDate: "2025-07-18", customerId: "CUST0002", customerName: "Free samples", customerPhone: "504589589", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 4, unitPrice: 0, costPrice: 25, totalSale: 0, totalCost: 100, profit: -100, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0067", orderDate: "2025-12-13", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 5, unitPrice: 15, costPrice: 7, totalSale: 75, totalCost: 35, profit: 40, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0068", orderDate: "2025-12-14", customerId: "CUST0019", customerName: "Ibrahim", customerPhone: "568837778", customerLocation: "Dubai", productName: "beeswax 500g", quantity: 1, unitPrice: 30, costPrice: 12, totalSale: 30, totalCost: 12, profit: 18, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0070", orderDate: "2025-12-13", customerId: "CUST000067", customerName: "George Gym", customerPhone: "522843537", customerLocation: "Dubai", productName: "Honey 1kg", quantity: 2, unitPrice: 75, costPrice: 24, totalSale: 150, totalCost: 48, profit: 102, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0075", orderDate: "2025-12-14", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 6, unitPrice: 15, costPrice: 7, totalSale: 90, totalCost: 41, profit: 49, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH02" },
  { orderId: "ORD0022", orderDate: "2025-11-02", customerId: "CUST0018", customerName: "Asma Jad", customerPhone: "589969518", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 13, totalSale: 30, totalCost: 13, profit: 17, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0033", orderDate: "2025-12-05", customerId: "CUST0030", customerName: "Mina Romany", customerPhone: "553527443", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 60, costPrice: 22, totalSale: 60, totalCost: 22, profit: 38, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0035", orderDate: "2025-07-19", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 3, unitPrice: 57, costPrice: 25, totalSale: 171, totalCost: 75, profit: 96, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0036", orderDate: "2025-11-02", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 2, unitPrice: 30, costPrice: 13, totalSale: 60, totalCost: 25, profit: 35, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0037", orderDate: "2025-07-19", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 4, unitPrice: 13.5, costPrice: 7, totalSale: 54, totalCost: 26, profit: 28, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0038", orderDate: "2025-11-02", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 2, unitPrice: 15, costPrice: 7, totalSale: 30, totalCost: 13, profit: 17, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0039", orderDate: "2025-11-02", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 25, totalSale: 50, totalCost: 25, profit: 25, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0040", orderDate: "2025-11-22", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 25, totalSale: 50, totalCost: 25, profit: 25, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0041", orderDate: "2025-11-22", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 2, unitPrice: 30, costPrice: 13, totalSale: 60, totalCost: 25, profit: 35, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0042", orderDate: "2025-11-22", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 1, unitPrice: 10, costPrice: 7, totalSale: 10, totalCost: 7, profit: 3, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0051", orderDate: "2025-12-06", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 0, totalSale: 30, totalCost: 0, profit: 30, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0052", orderDate: "2025-12-06", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 1, unitPrice: 15, costPrice: 7, totalSale: 15, totalCost: 7, profit: 8, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0054", orderDate: "2025-12-07", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 40, costPrice: 25, totalSale: 40, totalCost: 25, profit: 15, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0057", orderDate: "2025-12-05", customerId: "CUST0049", customerName: "Ereny Edouard", customerPhone: "502180335", customerLocation: "Sharjah", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 70, costPrice: 27, totalSale: 70, totalCost: 27, profit: 43, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0062", orderDate: "2025-12-12", customerId: "CUST0062", customerName: "Samir atif", customerPhone: "545540354", customerLocation: "Ajman", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 60, costPrice: 27, totalSale: 60, totalCost: 27, profit: 33, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0066", orderDate: "2025-12-13", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 24, totalSale: 50, totalCost: 24, profit: 26, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0069", orderDate: "2025-12-14", customerId: "CUST0019", customerName: "Ibrahim", customerPhone: "568837778", customerLocation: "Dubai", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 70, costPrice: 27, totalSale: 70, totalCost: 27, profit: 43, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0072", orderDate: "2025-12-14", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 1, unitPrice: 25, costPrice: 13, totalSale: 25, totalCost: 13, profit: 12, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH03" },
  { orderId: "ORD0043", orderDate: "2025-11-23", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 7, unitPrice: 50, costPrice: 23, totalSale: 350, totalCost: 161, profit: 189, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0044", orderDate: "2025-11-23", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 7, unitPrice: 30, costPrice: 11, totalSale: 210, totalCost: 77, profit: 133, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0045", orderDate: "2025-11-23", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 7, unitPrice: 15, costPrice: 7, totalSale: 105, totalCost: 49, profit: 56, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0046", orderDate: "2025-11-29", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 11, totalSale: 30, totalCost: 11, profit: 19, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0047", orderDate: "2025-11-29", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 2, unitPrice: 50, costPrice: 23, totalSale: 100, totalCost: 46, profit: 54, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0048", orderDate: "2025-11-29", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 2, unitPrice: 30, costPrice: 11, totalSale: 60, totalCost: 22, profit: 38, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0050", orderDate: "2025-12-06", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 2, unitPrice: 50, costPrice: 23, totalSale: 100, totalCost: 46, profit: 54, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0053", orderDate: "2025-12-07", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 9, unitPrice: 15, costPrice: 7, totalSale: 135, totalCost: 63, profit: 72, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0055", orderDate: "2025-12-07", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 2, unitPrice: 50, costPrice: 23, totalSale: 100, totalCost: 46, profit: 54, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0056", orderDate: "2025-12-07", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 11, totalSale: 30, totalCost: 11, profit: 19, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0058", orderDate: "2025-12-05", customerId: "CUST0049", customerName: "Ereny Edouard", customerPhone: "502180335", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 23, totalSale: 50, totalCost: 23, profit: 27, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0059", orderDate: "2025-12-07", customerId: "CUST0058", customerName: "soumaya", customerPhone: "561316857", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 50, costPrice: 11, totalSale: 50, totalCost: 11, profit: 39, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0060", orderDate: "2025-12-07", customerId: "CUST0059", customerName: "Remonda", customerPhone: "501013470", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 11, totalSale: 30, totalCost: 11, profit: 19, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0061", orderDate: "2025-12-07", customerId: "CUST0060", customerName: "Marita", customerPhone: "504509791", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 50, costPrice: 11, totalSale: 50, totalCost: 11, profit: 39, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH04" },
  { orderId: "ORD0024", orderDate: "2025-12-07", customerId: "CUST0019", customerName: "Ibrahim", customerPhone: "568837778", customerLocation: "Dubai", productName: "Honey 1kg", quantity: 4, unitPrice: 100, costPrice: 16, totalSale: 400, totalCost: 64, profit: 336, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH05" },
  { orderId: "ORD0063", orderDate: "2025-12-12", customerId: "CUST0062", customerName: "Samir atif", customerPhone: "545540354", customerLocation: "Ajman", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 11, totalSale: 30, totalCost: 11, profit: 19, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH05" },
  { orderId: "ORD0064", orderDate: "2025-12-09", customerId: "CUST0065", customerName: "Fatema Abdulla", customerPhone: "505848855", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 50, costPrice: 8, totalSale: 50, totalCost: 8, profit: 42, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH05" },
  { orderId: "ORD0065", orderDate: "2025-12-12", customerId: "CUST000066", customerName: "Mina mammdouh", customerPhone: "558542930", customerLocation: "Ajman", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 16, totalSale: 50, totalCost: 16, profit: 34, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH05" },
  { orderId: "ORD0071", orderDate: "2025-12-14", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 4, unitPrice: 60, costPrice: 16, totalSale: 240, totalCost: 64, profit: 176, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH05" },
  { orderId: "ORD0049", orderDate: "2025-11-29", customerId: "CUST0032", customerName: "Church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 4, unitPrice: 15, costPrice: 7, totalSale: 60, totalCost: 28, profit: 32, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0073", orderDate: "2025-12-14", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "beeswax 500g", quantity: 2, unitPrice: 40, costPrice: 16, totalSale: 80, totalCost: 32, profit: 48, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0074", orderDate: "2025-12-12", customerId: "CUST0002", customerName: "Free samples", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 3, unitPrice: 0, costPrice: 24, totalSale: 0, totalCost: 72, profit: -72, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0076", orderDate: "2025-12-14", customerId: "CUST0001", customerName: "Wasted distribution", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 0, costPrice: 24, totalSale: 0, totalCost: 24, profit: -24, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0077", orderDate: "2025-12-14", customerId: "CUST0001", customerName: "Wasted distribution", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 2, unitPrice: 0, costPrice: 13, totalSale: 0, totalCost: 25, profit: -25, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0078", orderDate: "2025-12-17", customerId: "CUST000068", customerName: "Mousa Patient 30603", customerPhone: "506275566", customerLocation: "Dubai", productName: "Honey 500g", quantity: 2, unitPrice: 50, costPrice: 13, totalSale: 100, totalCost: 25, profit: 75, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0079", orderDate: "2025-12-18", customerId: "CUST000069", customerName: "Lera gym", customerPhone: "79149704845", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 50, costPrice: 13, totalSale: 50, totalCost: 13, profit: 37, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0081", orderDate: "2025-12-23", customerId: "CUST000071", customerName: "Mohamed Rady", customerPhone: "555973137", customerLocation: "Dubai", productName: "beeswax 500g", quantity: 1, unitPrice: 50, costPrice: 12, totalSale: 50, totalCost: 12, profit: 38, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0082", orderDate: "2025-12-24", customerId: "CUST000072", customerName: "Dr. Rania Tantawi", customerPhone: "503770504", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 45, costPrice: 13, totalSale: 45, totalCost: 13, profit: 32, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0082", orderDate: "2025-12-24", customerId: "CUST000072", customerName: "Dr. Rania Tantawi", customerPhone: "503770504", customerLocation: "Dubai", productName: "beeswax 500g", quantity: 1, unitPrice: 50, costPrice: 12, totalSale: 50, totalCost: 12, profit: 38, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0088", orderDate: "2026-01-03", customerId: "CUST000077", customerName: "Michael grade 3", customerPhone: "505383931", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 2, unitPrice: 35, costPrice: 13, totalSale: 70, totalCost: 25, profit: 45, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0089", orderDate: "2026-01-04", customerId: "CUST000078", customerName: "mina mammdoh0", customerPhone: "971558542930", customerLocation: "Ajman", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 25, totalSale: 50, totalCost: 25, profit: 25, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0091", orderDate: "2026-01-04", customerId: "CUST000079", customerName: "Mina Gad", customerPhone: "522363892", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 60, costPrice: 25, totalSale: 60, totalCost: 25, profit: 35, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0092", orderDate: "2026-01-04", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 2, unitPrice: 17.5, costPrice: 7, totalSale: 35, totalCost: 14, profit: 21, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0093", orderDate: "2026-01-04", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 6, unitPrice: 35, costPrice: 13, totalSale: 210, totalCost: 76, profit: 134, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0090", orderDate: "2026-01-04", customerId: "CUST0029", customerName: "Nancy mina", customerPhone: "569761410", customerLocation: "Sharjah", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 2, unitPrice: 50, costPrice: 21, totalSale: 100, totalCost: 42, profit: 58, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0094", orderDate: "2026-01-10", customerId: "CUST000080", customerName: "Rany Talmiza", customerPhone: "502138858", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 24, totalSale: 50, totalCost: 24, profit: 26, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0095", orderDate: "2026-01-10", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 2, unitPrice: 15, costPrice: 7, totalSale: 30, totalCost: 14, profit: 16, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0096", orderDate: "2026-01-11", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "beeswax 500g", quantity: 1, unitPrice: 40, costPrice: 16, totalSale: 40, totalCost: 16, profit: 24, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0097", orderDate: "2026-01-11", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 24, totalSale: 50, totalCost: 24, profit: 26, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0097", orderDate: "2026-01-11", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 13, totalSale: 30, totalCost: 13, profit: 17, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0098", orderDate: "2026-01-11", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 50, costPrice: 24, totalSale: 50, totalCost: 24, profit: 26, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0098", orderDate: "2026-01-11", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 1, unitPrice: 15, costPrice: 7, totalSale: 15, totalCost: 7, profit: 8, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0099", orderDate: "2026-01-11", customerId: "CUST000081", customerName: "Kerols magdy", customerPhone: "521191295", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 13, totalSale: 30, totalCost: 13, profit: 17, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0100", orderDate: "2026-01-17", customerId: "CUST000082", customerName: "Michael bashay", customerPhone: "522231519", customerLocation: "Ajman", productName: "Honey 500g", quantity: 1, unitPrice: 30, costPrice: 13, totalSale: 30, totalCost: 13, profit: 17, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0101", orderDate: "2026-01-25", customerId: "CUST0002", customerName: "Free samples", customerPhone: "561117166", customerLocation: "Ajman", productName: "Honey 1kg", quantity: 1, unitPrice: 4, costPrice: 24, totalSale: 4, totalCost: 24, profit: -20, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0101", orderDate: "2026-01-25", customerId: "CUST0002", customerName: "Free samples", customerPhone: "561117166", customerLocation: "Ajman", productName: "beeswax 500g", quantity: 1, unitPrice: 4, costPrice: 16, totalSale: 4, totalCost: 16, profit: -12, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0102", orderDate: "2026-02-07", customerId: "CUST0001", customerName: "Wasted distribution", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 3, unitPrice: 0.1, costPrice: 13, totalSale: 0.3, totalCost: 38, profit: -38, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0103", orderDate: "2026-02-07", customerId: "CUST000083", customerName: "Lio Home", customerPhone: "568326116", customerLocation: "Dubai", productName: "Honey 250g", quantity: 1, unitPrice: 0.05, costPrice: 7, totalSale: 0.05, totalCost: 7, profit: -7, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" },
  { orderId: "ORD0104", orderDate: "2026-02-11", customerId: "CUST0007", customerName: "Chaima Diab", customerPhone: "586746651", customerLocation: "Dubai", productName: "Honey (Squeeze 500g)", quantity: 1, unitPrice: 21.75, costPrice: 15, totalSale: 21.75, totalCost: 15, profit: 7, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0105", orderDate: "2026-02-14", customerId: "CUST0005", customerName: "Karolos El Dress", customerPhone: "557904531", customerLocation: "Sharjah", productName: "Honey (Squeeze 250g)", quantity: 2, unitPrice: 20, costPrice: 8, totalSale: 40, totalCost: 17, profit: 23, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0106", orderDate: "2026-02-15", customerId: "CUST000084", customerName: "bishoy monier", customerPhone: "556023305", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 1, unitPrice: 35, costPrice: 13, totalSale: 35, totalCost: 13, profit: 22, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0107", orderDate: "2026-02-21", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey (Squeeze 250g)", quantity: 2, unitPrice: 20, costPrice: 8, totalSale: 40, totalCost: 17, profit: 23, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0108", orderDate: "2026-02-21", customerId: "CUST000085", customerName: "Rania amen", customerPhone: "564704826", customerLocation: "Sharjah", productName: "Honey (Squeeze 250g)", quantity: 1, unitPrice: 0.01, costPrice: 8, totalSale: 0.01, totalCost: 8, profit: -8, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0109", orderDate: "2026-02-22", customerId: "CUST0002", customerName: "Free samples", customerPhone: "561117166", customerLocation: "Dubai", productName: "Honey 250g", quantity: 1, unitPrice: 0.01, costPrice: 7, totalSale: 0.01, totalCost: 7, profit: -7, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0110", orderDate: "2026-03-18", customerId: "CUST000086", customerName: "verna aziz", customerPhone: "544730320", customerLocation: "Dubai", productName: "Honey (Squeeze 500g)", quantity: 1, unitPrice: 35, costPrice: 15, totalSale: 35, totalCost: 15, profit: 20, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0111", orderDate: "2026-04-06", customerId: "CUST000087", customerName: "Diana fayez", customerPhone: "568326116", customerLocation: "Dubai", productName: "Honey (Squeeze 500g)", quantity: 1, unitPrice: 50, costPrice: 15, totalSale: 50, totalCost: 15, profit: 35, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0111", orderDate: "2026-04-06", customerId: "CUST000087", customerName: "Diana fayez", customerPhone: "568326116", customerLocation: "Dubai", productName: "Honey 500g", quantity: 1, unitPrice: 45, costPrice: 13, totalSale: 45, totalCost: 13, profit: 32, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0112", orderDate: "2026-04-14", customerId: "CUST000088", customerName: "George Abo Ila", customerPhone: "557543501", customerLocation: "Dubai", productName: "beeswax 500g", quantity: 1, unitPrice: 50, costPrice: 16, totalSale: 50, totalCost: 16, profit: 34, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0113", orderDate: "2026-04-19", customerId: "CUST000089", customerName: "Magda church kitchen", customerPhone: "123456789", customerLocation: "Sharjah", productName: "Honey (Squeeze 250g)", quantity: 1, unitPrice: 30, costPrice: 8, totalSale: 30, totalCost: 8, profit: 22, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0114", orderDate: "2026-04-19", customerId: "CUST0062", customerName: "Samir atif", customerPhone: "545540354", customerLocation: "Ajman", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 2, unitPrice: 100, costPrice: 27, totalSale: 200, totalCost: 54, profit: 146, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0115", orderDate: "2026-04-19", customerId: "CUST0062", customerName: "Samir atif", customerPhone: "545540354", customerLocation: "Ajman", productName: "Honey (Squeeze 500g)", quantity: 1, unitPrice: 50, costPrice: 15, totalSale: 50, totalCost: 15, profit: 35, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0117", orderDate: "2026-04-19", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 2, unitPrice: 60, costPrice: 23, totalSale: 120, totalCost: 46, profit: 74, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0117", orderDate: "2026-04-19", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey (Squeeze 250g)", quantity: 3, unitPrice: 30, costPrice: 8, totalSale: 90, totalCost: 24, profit: 66, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0117", orderDate: "2026-04-19", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "beeswax 500g", quantity: 1, unitPrice: 50, costPrice: 16, totalSale: 50, totalCost: 16, profit: 34, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0118", orderDate: "2026-04-19", customerId: "CUST000090", customerName: "Gezael nashit", customerPhone: "3697821", customerLocation: "Sharjah", productName: "Honey (Squeeze 250g)", quantity: 2, unitPrice: 30, costPrice: 8, totalSale: 60, totalCost: 16, profit: 44, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0118", orderDate: "2026-04-19", customerId: "CUST000090", customerName: "Gezael nashit", customerPhone: "3697821", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 1, unitPrice: 25, costPrice: 7, totalSale: 25, totalCost: 7, profit: 18, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0119", orderDate: "2026-04-27", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey (Squeeze 500g)", quantity: 2, unitPrice: 50, costPrice: 15, totalSale: 100, totalCost: 30, profit: 70, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0119", orderDate: "2026-04-27", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 1kg", quantity: 1, unitPrice: 70, costPrice: 23, totalSale: 70, totalCost: 23, profit: 47, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0120", orderDate: "2026-05-05", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 1, unitPrice: 20, costPrice: 7, totalSale: 20, totalCost: 7, profit: 13, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0120", orderDate: "2026-05-05", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 500g", quantity: 1, unitPrice: 45, costPrice: 13, totalSale: 45, totalCost: 13, profit: 32, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0120", orderDate: "2026-05-05", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 100, costPrice: 27, totalSale: 100, totalCost: 27, profit: 73, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0121", orderDate: "2026-05-10", customerId: "CUST0029", customerName: "Nancy mina", customerPhone: "569761410", customerLocation: "Sharjah", productName: "beeswax 500g", quantity: 1, unitPrice: 50, costPrice: 16, totalSale: 50, totalCost: 16, profit: 34, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0122", orderDate: "2026-05-10", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 1, unitPrice: 15, costPrice: 7, totalSale: 15, totalCost: 7, profit: 8, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0123", orderDate: "2026-05-10", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 1, unitPrice: 50, costPrice: 7, totalSale: 50, totalCost: 7, profit: 43, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0123", orderDate: "2026-05-10", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey (Squeeze 250g)", quantity: 1, unitPrice: 20, costPrice: 8, totalSale: 20, totalCost: 8, profit: 12, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0123", orderDate: "2026-05-10", customerId: "CUST0032", customerName: "church kitchen", customerPhone: "568326116", customerLocation: "Sharjah", productName: "Honey 250g", quantity: 1, unitPrice: 15, costPrice: 7, totalSale: 15, totalCost: 7, profit: 8, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0124", orderDate: "2026-05-18", customerId: "CUST000091", customerName: "Islam mashour", customerPhone: "566778169", customerLocation: "Dubai", productName: "beeswax 500g", quantity: 1, unitPrice: 50, costPrice: 16, totalSale: 50, totalCost: 16, profit: 34, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0124", orderDate: "2026-05-18", customerId: "CUST000091", customerName: "Islam mashour", customerPhone: "566778169", customerLocation: "Dubai", productName: "Energy Package (500g honey + 10g Royal Jelly+ 10g Pollen)", quantity: 1, unitPrice: 100, costPrice: 27, totalSale: 100, totalCost: 27, profit: 73, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0125", orderDate: "2026-06-06", customerId: "CUST0007", customerName: "Chaima Diab", customerPhone: "586746651", customerLocation: "Dubai", productName: "Honey (Squeeze 500g)", quantity: 3, unitPrice: 50, costPrice: 15, totalSale: 150, totalCost: 44, profit: 106, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH07" },
  { orderId: "ORD0126", orderDate: "2026-06-06", customerId: "CUST000083", customerName: "Lio Home", customerPhone: "568326116", customerLocation: "Dubai", productName: "Honey 250g", quantity: 4, unitPrice: 1, costPrice: 7, totalSale: 4, totalCost: 28, profit: -24, deliveryStatus: "Delivered", paymentStatus: "Paid", batchId: "BATCH06" }
];

export const SEED_EXPENSES: ExpenseSeed[] = [
  { id: "EXP0001", date: "2025-06-30", type: "Expense", category: "Marketing", description: "Facebook Ads Promotion", amount: 120, paymentMethod: "Credit Card", reference: "FB-99882", notes: "First month promotion" },
  { id: "EXP0002", date: "2025-07-20", type: "Expense", category: "Transportation", description: "DHL Shipment from Egypt Jars", amount: 250, paymentMethod: "Bank Transfer", reference: "DHL-001283", notes: "Extra jars shipping" },
  { id: "EXP0003", date: "2025-12-15", type: "Profit Distribution", category: "Owner Salary", description: "Mina Owner Salary Nov", amount: 1500, paymentMethod: "Bank Transfer", reference: "TXN-881923", notes: "" },
  { id: "EXP0004", date: "2026-01-10", type: "Expense", category: "Supplies", description: "Printer ink and paper for labels", amount: 85, paymentMethod: "Cash", reference: "", notes: "" },
  { id: "EXP0005", date: "2026-02-15", type: "Profit Distribution", category: "Partner Distribution", description: "Profit Distribution Partners Year 2025", amount: 2000, paymentMethod: "Bank Transfer", reference: "TXN-9912", notes: "" }
];

export const SEED_BALANCE: BalanceSeed[] = [
  { id: "BAL0001", date: "2025-05-01", type: "Income", details: "Initial Capital Seed Balance", amount: 5000, balance: 5000, note: "Starting bank roll" },
  { id: "BAL0002", date: "2025-05-29", type: "Expense", details: "Payment for Batch 01 purchase & transit", amount: 390, balance: 4610, note: "Initial batch" },
  { id: "BAL0003", date: "2025-06-30", type: "Income", details: "Cumulative Customer Payments Jun 2025", amount: 1105, balance: 5715, note: "Paid orders" }
];
