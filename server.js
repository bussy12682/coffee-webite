const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.ORDER_DATA_FILE || path.join(__dirname, "data", "orders.json");
const app = express();

function ensureOrdersFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf8");
  }
}

function readOrders(filePath) {
  ensureOrdersFile(filePath);
  const raw = fs.readFileSync(filePath, "utf8");

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Invalid orders.json content, resetting file: ${error}`);
    const empty = [];
    writeOrders(filePath, empty);
    return empty;
  }
}

function writeOrders(filePath, orders) {
  ensureOrdersFile(filePath);
  fs.writeFileSync(filePath, JSON.stringify(orders, null, 2), "utf8");
}

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/api/orders", (req, res) => {
  const search = (req.query.search || "").toString().toLowerCase();
  const statusFilter = (req.query.status || "").toString().toLowerCase();
  let orders = readOrders(DATA_FILE)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (search) {
    orders = orders.filter(order =>
      (order.coffeeType || "").toLowerCase().includes(search) ||
      (order.email || "").toLowerCase().includes(search) ||
      (order.location || "").toLowerCase().includes(search) ||
      (order.id || "").toLowerCase().includes(search)
    );
  }

  if (statusFilter) {
    orders = orders.filter(order => (order.status || "").toLowerCase() === statusFilter);
  }

  res.json({ success: true, orders });
});

app.post("/api/orders", (req, res) => {
  const { coffeeType, size, quantity, location, email, note, payment, paymentReference } = req.body || {};

  if (!coffeeType || !size || !location || !email || !payment) {
    return res.status(400).json({ success: false, message: "Please fill in the required order details" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address" });
  }

  const order = {
    id: `order-${Date.now()}`,
    coffeeType,
    size,
    quantity: Number(quantity) || 1,
    location,
    email,
    note: note || "",
    payment,
    paymentReference: paymentReference || "",
    status: payment === "card" ? "paid" : "pending",
    createdAt: new Date().toISOString()
  };

  const orders = readOrders(DATA_FILE);
  orders.push(order);
  writeOrders(DATA_FILE, orders);

  res.status(201).json({
    success: true,
    message: `Order received for ${order.quantity} x ${order.coffeeType} (${order.size}). We will contact you shortly at ${order.email}.`,
    orderId: order.id
  });
});

app.put("/api/orders/:id", (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body || {};

  if (!status) {
    return res.status(400).json({ success: false, message: "Status is required" });
  }

  const orders = readOrders(DATA_FILE);
  const order = orders.find((order) => order.id === orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  order.status = status;
  writeOrders(DATA_FILE, orders);
  res.json({ success: true, message: "Order status updated", order });
});

app.delete("/api/orders/:id", (req, res) => {
  const orderId = req.params.id;
  const orders = readOrders(DATA_FILE);
  const remaining = orders.filter(order => order.id !== orderId);

  if (remaining.length === orders.length) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  writeOrders(DATA_FILE, remaining);
  res.json({ success: true, message: "Order deleted successfully", orders: remaining });
});

app.delete("/api/orders", (req, res) => {
  writeOrders(DATA_FILE, []);
  res.json({ success: true, message: "All orders have been deleted", orders: [] });
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

const server = app.listen(PORT, () => {
  console.log(`Coffee website backend running at http://localhost:${PORT}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the process using the port or set PORT to a different value.`);
    process.exit(1);
  }
  console.error(error);
  process.exit(1);
});
