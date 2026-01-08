// server.js — FINAL, Render-safe, roles from DB, customers separate

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");

const app = express();

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI || !JWT_SECRET) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */
const client = new MongoClient(MONGO_URI);
let users;
let customers;

async function connectDB() {
  await client.connect();
  const db = client.db("Users"); // SAME DB YOU ALREADY USE

  users = db.collection("user");        // users collection
  customers = db.collection("Customers"); // customers collection

  console.log("✅ MongoDB connected");
}

/* ================= JWT MIDDLEWARE ================= */
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.sendStatus(403);
  }
}

/* ================= AUTH ================= */
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await users.findOne({ Email: email });
  if (!user || user.Password !== password)
    return res.status(401).json({ success: false });

  const token = jwt.sign(
    { email: user.Email, role: user.Role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ success: true, token });
});

/* ================= CURRENT USER ================= */
app.get("/me", auth, async (req, res) => {
  const user = await users.findOne(
    { Email: req.user.email },
    { projection: { Password: 0 } }
  );

  res.json(user);
});

/* ================= CUSTOMERS ================= */

// GET customers (company based)
app.get("/customers/:email", auth, async (req, res) => {
  const user = await users.findOne({ Email: req.params.email });
  if (!user) return res.json([]);

  const list = await customers
    .find({ Company: user.Company })
    .toArray();

  res.json(list);
});

// ADD customer
app.post("/add-customer", auth, async (req, res) => {
  const user = await users.findOne({ Email: req.user.email });

  if (user.Role === "Employee")
    return res.status(403).json({ message: "View only" });

  const { Name, Email, Salary, ["Applied Position"]: Position } = req.body;

  if (!Name || !Email || !Position || Salary == null)
    return res.status(400).json({ message: "Missing fields" });

  await customers.insertOne({
    Name,
    Email,
    Salary,
    "Applied Position": Position,
    Company: user.Company,
    createdAt: new Date(),
  });

  res.json({ success: true });
});

// UPDATE customer
app.put("/update-customer/:email", auth, async (req, res) => {
  const user = await users.findOne({ Email: req.user.email });

  if (!["Manager", "Admin", "SuperAdmin"].includes(user.Role))
    return res.sendStatus(403);

  await customers.updateOne(
    { Email: req.params.email },
    { $set: req.body }
  );

  res.json({ success: true });
});

// DELETE customer
app.delete("/customer/:email", auth, async (req, res) => {
  const user = await users.findOne({ Email: req.user.email });

  if (!["Admin", "SuperAdmin"].includes(user.Role))
    return res.sendStatus(403);

  await customers.deleteOne({ Email: req.params.email });
  res.json({ success: true });
});

/* ================= START ================= */
connectDB().then(() =>
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  )
);
