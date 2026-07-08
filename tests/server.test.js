const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { createServer } = require("../server.js");

test("POST /api/orders saves a valid order", async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "coffee-orders-"));
  const ordersFile = path.join(tempDir, "orders.json");
  const server = createServer({ rootDir: path.join(__dirname, ".."), ordersFile });

  await new Promise((resolve) => server.listen(0, resolve));

  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coffeeType: "Latte",
      size: "Medium",
      quantity: 2,
      location: "Downtown",
      email: "user@example.com",
      note: "No sugar",
      payment: "cash"
    })
  });

  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.match(body.message, /Order received/i);

  const savedOrders = JSON.parse(fs.readFileSync(ordersFile, "utf8"));
  assert.equal(savedOrders.length, 1);
  assert.equal(savedOrders[0].email, "user@example.com");

  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
