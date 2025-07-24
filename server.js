// server.js - ARMAH INTERNATIONAL HOTEL - FINAL MASTERPIECE VERSION (Corrected Paths)

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- Databases and System Configuration ---
// === THIS IS THE MASTER FIX ===
// The paths now correctly point inside the 'public' folder.
const menuFilePath = path.join(__dirname, "public", "menu.json");
const servicesFilePath = path.join(__dirname, "public", "services.json");
// The orders.json file stays in the root, as it contains private sales data.
const ordersFilePath = path.join(__dirname, "orders.json");

const roomCodes = {
  1: "1001",
  2: "1002",
  3: "1003",
  4: "1004",
  5: "1005",
  6: "1006",
  7: "1007",
  8: "1008",
  9: "1009",
  10: "1010",
  11: "1011",
  12: "1012",
  13: "1013",
  14: "1014",
  15: "1015",
  16: "1016",
  17: "1017",
  18: "1018",
  19: "1019",
  20: "1020",
  21: "1021",
  22: "1022",
  23: "1023",
  24: "1024",
  25: "1025",
  26: "1026",
  27: "1027",
  28: "1028",
  29: "1029",
};
const tableCodes = {
  1: "5001",
  2: "5002",
  3: "5003",
  4: "5004",
  5: "5005",
  6: "5006",
  7: "5007",
  8: "5008",
  9: "5009",
  10: "5010",
  11: "5011",
  12: "5012",
  13: "5013",
  14: "5014",
  15: "5015",
};

let pendingOrders = {};
let pendingServiceRequests = {};
const ADMIN_USER = {
  username: "admin@armahhotel.com",
  password: "password123",
};
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "public/uploads/"),
    filename: (req, file, cb) =>
      cb(null, Date.now() + path.extname(file.originalname)),
  }),
});

// --- Middleware ---
app.use(express.json());
app.use(express.static("public"));

// --- Helper Functions ---
const readFileSafely = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data || "[]");
  } catch (e) {
    return [];
  }
};
const writeFileSafely = (filePath, data) =>
  fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

// --- API Endpoints ---
app.get("/api/menu", async (req, res) =>
  res.json(await readFileSafely(menuFilePath))
);
app.get("/api/services", async (req, res) =>
  res.json(await readFileSafely(servicesFilePath))
);
app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER.username && password === ADMIN_USER.password)
    res.json({ success: true });
  else
    res.status(401).json({ success: false, message: "Invalid credentials." });
});
app.post("/api/menu/add", upload.single("image"), async (req, res) => {
  try {
    const d = req.body;
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "Image is required." });
    const m = await readFileSafely(menuFilePath);
    m.push({
      id: Date.now(),
      name: d.name,
      name_am: d.name_am,
      category: d.category,
      price: parseFloat(d.price),
      image: `uploads/${req.file.filename}`,
      isAvailable: true,
    });
    await writeFileSafely(menuFilePath, m);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to add item." });
  }
});
app.post("/api/menu/edit", async (req, res) => {
  try {
    const d = req.body;
    const m = await readFileSafely(menuFilePath);
    const i = m.findIndex((x) => x.id === parseInt(d.id));
    if (i === -1) return res.status(404).send();
    m[i] = {
      ...m[i],
      name: d.name,
      name_am: d.name_am,
      category: d.category,
      price: parseFloat(d.price),
    };
    await writeFileSafely(menuFilePath, m);
    res.json({ success: true });
  } catch (e) {
    res.status(500).send();
  }
});
app.post("/api/menu/availability", async (req, res) => {
  try {
    const { id, isAvailable } = req.body;
    const m = await readFileSafely(menuFilePath);
    const i = m.findIndex((x) => x.id === parseInt(id));
    if (i === -1) return res.status(404).send();
    m[i].isAvailable = isAvailable;
    await writeFileSafely(menuFilePath, m);
    res.json({ success: true });
  } catch (e) {
    res.status(500).send();
  }
});
app.post("/api/menu/delete", async (req, res) => {
  try {
    const { id } = req.body;
    const m = await readFileSafely(menuFilePath);
    await writeFileSafely(
      menuFilePath,
      m.filter((item) => item.id !== id)
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).send();
  }
});
app.post("/service-request", (req, res) => {
  const { room, request, request_am } = req.body;
  const requestData = {
    id: Date.now(),
    room,
    request,
    request_am,
    timestamp: new Date().toISOString(),
  };
  pendingServiceRequests[requestData.id] = requestData;
  io.emit("new_service_request", requestData);
  res.json({ success: true });
});
app.post("/acknowledge-service", (req, res) => {
  const { id } = req.body;
  if (pendingServiceRequests[id]) {
    delete pendingServiceRequests[id];
  }
  res.json({ success: true });
});
app.post("/call-waiter", (req, res) => {
  const { table } = req.body;
  io.emit("new_waiter_call", { table, timestamp: new Date().toISOString() });
  res.json({ success: true });
});
app.post("/place-order", async (req, res) => {
  try {
    const { room, table, items } = req.body;
    const location = room || table;
    const locationType = room ? "Room" : "Table";
    const codeList = room ? roomCodes : tableCodes;
    if (!location)
      return res
        .status(400)
        .json({ success: false, message: "Location is required." });
    if (pendingOrders[location])
      return res
        .status(429)
        .json({
          success: false,
          message: `An order is already pending for this ${locationType}.`,
        });
    const menu = await readFileSafely(menuFilePath);
    let total = 0;
    for (const key in items) {
      const menuItem = menu.find((m) => m.name === key);
      if (menuItem) total += menuItem.price * items[key].quantity;
    }
    const orderData = {
      id: Date.now(),
      location,
      locationType,
      items,
      total,
      timestamp: new Date().toISOString(),
    };
    pendingOrders[location] = orderData;
    io.emit("new_order", orderData);
    res.json({ success: true, message: "Order sent!" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error." });
  }
});
app.post("/acknowledge-order", async (req, res) => {
  try {
    const { location } = req.body;
    if (pendingOrders[location]) {
      const orderToSave = pendingOrders[location];
      const orders = await readFileSafely(ordersFilePath);
      orders.push(orderToSave);
      await writeFileSafely(ordersFilePath, orders);
      delete pendingOrders[location];
      res.json({ success: true });
    } else {
      res.status(404).send();
    }
  } catch (e) {
    res.status(500).send();
  }
});
app.get("/api/sales", async (req, res) => {
  try {
    const { period, date } = req.query;
    const allOrders = await readFileSafely(ordersFilePath);
    let filteredOrders = allOrders;
    if (period === "month")
      filteredOrders = allOrders.filter((o) =>
        o.timestamp.startsWith(date.substring(0, 7))
      );
    else if (period === "year")
      filteredOrders = allOrders.filter((o) =>
        o.timestamp.startsWith(date.substring(0, 4))
      );
    else if (period === "day")
      filteredOrders = allOrders.filter((o) => o.timestamp.startsWith(date));
    res.json(filteredOrders);
  } catch (e) {
    res.status(500).send();
  }
});
app.post("/api/sales/clear", async (req, res) => {
  try {
    await writeFileSafely(ordersFilePath, []);
    res.json({ success: true });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: "Failed to clear history." });
  }
});

// --- Socket.IO ---
io.on("connection", (socket) => {
  socket.on("kitchen_dashboard_ready", () => {
    Object.values(pendingOrders).forEach((order) =>
      socket.emit("new_order", order)
    );
  });
  socket.on("maintenance_dashboard_ready", () => {
    Object.values(pendingServiceRequests).forEach((request) =>
      socket.emit("new_service_request", request)
    );
  });
});

// --- Server Start ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 ARMAH HOTEL SERVER IS LIVE ON PORT ${PORT}`));