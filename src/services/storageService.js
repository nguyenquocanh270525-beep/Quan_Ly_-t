const STORAGE_KEY = "PHONE_STORE_SEED_DB_V1";

const DEFAULT_PHONE_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'><rect width='240' height='240' rx='24' fill='%23fef3c7'/><rect x='78' y='28' width='84' height='184' rx='18' fill='%231e293b' stroke='%23d97706' stroke-width='3'/><text x='120' y='125' text-anchor='middle' fill='%23ffffff' font-family='Arial' font-size='12' font-weight='bold'>SmartPhone</text></svg>";

export async function initDatabase(forceReset = false) {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing && !forceReset) {
    return JSON.parse(existing);
  }
  const res = await fetch("/data/seedData.json");
  const data = await res.json();
  const normalized = {
    users: data.users || [],
    categories: data.categories || [],
    brands: data.brands || [],
    suppliers: data.suppliers || [],
    products: data.products || [],
    customers: data.customers || [],
    imports: data.imports || [],
    orders: data.orders || [],
    invoices: data.invoices || [],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function getDB() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function formatVND(amount = 0) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(amount || 0));
}

export function resolveCustomerByNameService(customerName, phone = "") {
  const db = getDB();
  const cleanName = (customerName || "").trim();
  if (!cleanName) {
    throw new Error("Vui lòng nhập tên khách hàng");
  }

  db.customers = db.customers || [];
  const existed = db.customers.find(
    (c) => c.full_name.toLowerCase() === cleanName.toLowerCase()
  );
  if (existed) return existed;

  const newCustomer = {
    customer_id: `KH${String(db.customers.length + 1).padStart(2, "0")}`,
    full_name: cleanName,
    phone: phone.trim() || "0900000000",
    email: "",
    address: "Tại quầy",
  };
  db.customers.unshift(newCustomer);
  saveDB(db);
  return newCustomer;
}

export function addProductService(payload) {
  const db = getDB();
  if (Number(payload.selling_price) < 0 || Number(payload.import_price) < 0) {
    throw new Error("Giá nhập và giá bán không được âm");
  }
  if (Number(payload.quantity) < 0) {
    throw new Error("Số lượng tồn kho không được âm");
  }
  const newProd = {
    product_id: `SP${String(db.products.length + 1).padStart(2, "0")}`,
    product_name: payload.product_name.trim(),
    category_id: payload.category_id,
    brand_id: payload.brand_id,
    color: payload.color || "Tiêu chuẩn",
    storage: payload.storage || "N/A",
    ram: payload.ram || "N/A",
    import_price: Number(payload.import_price),
    selling_price: Number(payload.selling_price),
    quantity: Number(payload.quantity),
    status: payload.status || "ACTIVE",
    image: payload.image?.trim() || DEFAULT_PHONE_SVG,
  };
  db.products.unshift(newProd);
  saveDB(db);
  return newProd;
}

export function updateProductService(productId, payload) {
  const db = getDB();
  if (Number(payload.selling_price) < 0 || Number(payload.import_price) < 0) {
    throw new Error("Giá nhập và giá bán không được âm");
  }
  if (Number(payload.quantity) < 0) {
    throw new Error("Số lượng tồn kho không được âm");
  }
  const idx = db.products.findIndex((p) => p.product_id === productId);
  if (idx === -1) throw new Error("Không tìm thấy sản phẩm");
  db.products[idx] = {
    ...db.products[idx],
    ...payload,
    import_price: Number(payload.import_price),
    selling_price: Number(payload.selling_price),
    quantity: Number(payload.quantity),
    image: payload.image?.trim() || db.products[idx].image || DEFAULT_PHONE_SVG,
  };
  saveDB(db);
  return db.products[idx];
}

export function deleteProductService(productId) {
  const db = getDB();
  db.products = db.products.filter((p) => p.product_id !== productId);
  saveDB(db);
}

export function createImportService({ supplier_id, employee_id, product_id, quantity, import_price }) {
  const db = getDB();
  const qty = Number(quantity);
  const price = Number(import_price);
  if (qty <= 0) throw new Error("Số lượng nhập phải lớn hơn 0");
  if (price < 0) throw new Error("Giá nhập không được âm");

  const prod = db.products.find((p) => p.product_id === product_id);
  if (!prod) throw new Error("Không tìm thấy sản phẩm");

  prod.quantity += qty;
  prod.import_price = price;

  const receipt = {
    import_id: `PN${String((db.imports?.length || 0) + 1).padStart(2, "0")}`,
    supplier_id,
    employee_id,
    import_date: new Date().toISOString().slice(0, 10),
    product_id,
    product_name: prod.product_name,
    quantity: qty,
    import_price: price,
    total_amount: qty * price,
  };

  db.imports = db.imports || [];
  db.imports.unshift(receipt);
  saveDB(db);
  return receipt;
}

export function createOrderService({ customer_id, customer_name, customer_phone, employee_id, items, note }) {
  const db = getDB();
  if (!db) throw new Error("Chưa khởi tạo dữ liệu");
  if (!items || items.length === 0) throw new Error("Đơn hàng chưa có sản phẩm");

  let finalCustomerId = customer_id;
  if (customer_name !== undefined) {
    const cust = resolveCustomerByNameService(customer_name, customer_phone || "");
    finalCustomerId = cust.customer_id;
  }
  if (!finalCustomerId) {
    throw new Error("Vui lòng nhập tên khách hàng");
  }

  let totalAmount = 0;
  const normalizedItems = items.map((item) => {
    if (item.quantity <= 0) throw new Error("Số lượng bán phải lớn hơn 0");
    const prod = db.products.find((p) => p.product_id === item.product_id);
    if (!prod) throw new Error(`Không tìm thấy sản phẩm ${item.product_id}`);
    if (prod.quantity < item.quantity) {
      throw new Error(`"${prod.product_name}" không đủ tồn kho (còn ${prod.quantity})`);
    }
    const unitPrice = Number(prod.selling_price);
    totalAmount += unitPrice * item.quantity;
    return {
      product_id: prod.product_id,
      product_name: prod.product_name,
      quantity: item.quantity,
      unit_price: unitPrice,
    };
  });

  normalizedItems.forEach((ni) => {
    const prod = db.products.find((p) => p.product_id === ni.product_id);
    prod.quantity -= ni.quantity;
  });

  const newOrder = {
    order_id: `DH${String(db.orders.length + 1).padStart(2, "0")}`,
    customer_id: finalCustomerId,
    employee_id,
    order_date: new Date().toISOString().slice(0, 10),
    items: normalizedItems,
    total_amount: totalAmount,
    note: note || "",
    status: "PENDING",
  };

  db.orders.unshift(newOrder);
  saveDB(db);
  return newOrder;
}

export function cancelOrderService(orderId) {
  const db = getDB();
  const order = db.orders.find((o) => o.order_id === orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (order.status === "CANCELLED") throw new Error("Đơn hàng đã bị hủy trước đó");

  (order.items || []).forEach((item) => {
    const prod = db.products.find((p) => p.product_id === item.product_id);
    if (prod) prod.quantity += Number(item.quantity);
  });

  order.status = "CANCELLED";
  saveDB(db);
  return order;
}

export function payOrderService(orderId, paymentMethod = "CASH") {
  const db = getDB();
  const order = db.orders.find((o) => o.order_id === orderId);
  if (!order) throw new Error("Không tìm thấy đơn hàng");
  if (order.status === "PAID") throw new Error("Đơn hàng đã thanh toán, không thể thanh toán lại");
  if (order.status === "CANCELLED") throw new Error("Đơn hàng đã hủy");

  order.status = "PAID";

  const newInvoice = {
    invoice_id: `HD${String(db.invoices.length + 1).padStart(2, "0")}`,
    order_id: order.order_id,
    invoice_date: new Date().toISOString().slice(0, 10),
    payment_method: paymentMethod,
    total_amount: order.total_amount,
    status: "PAID",
  };

  db.invoices.unshift(newInvoice);
  saveDB(db);
  return { order, invoice: newInvoice };
}