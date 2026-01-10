// server.js — FIXED (adds /api routes + root route)

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

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.send("Backend running");
});

/* ================= DATABASE ================= */
const client = new MongoClient(MONGO_URI);
let users;
let customers;

async function connectDB() {
  await client.connect();
  const db = client.db("Users");

  users = db.collection("user");
  customers = db.collection("Customers");
}

/* ================= JWT ================= */
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
app.post("/api/login", async (req, res) => {
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
app.get("/api/me", auth, async (req, res) => {
  const user = await users.findOne(
    { Email: req.user.email },
    { projection: { Password: 0 } }
  );

  res.json(user);
});

/* ================= CUSTOMERS ================= */
app.get("/api/customers/:email", auth, async (req, res) => {
  const user = await users.findOne({ Email: req.params.email });
  if (!user) return res.json([]);

  const list = await customers.find({ Company: user.Company }).toArray();
  res.json(list);
});

app.post("/api/add-customer", auth, async (req, res) => {
  const user = await users.findOne({ Email: req.user.email });
  if (user.Role === "Employee") return res.sendStatus(403);

  const { Name, Email, Salary, ["Applied Position"]: Position } = req.body;

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

app.put("/api/update-customer/:email", auth, async (req, res) => {
  const user = await users.findOne({ Email: req.user.email });
  if (!["Manager", "Admin", "SuperAdmin"].includes(user.Role))
    return res.sendStatus(403);

  await customers.updateOne(
    { Email: req.params.email },
    { $set: req.body }
  );

  res.json({ success: true });
});

app.delete("/api/customer/:email", auth, async (req, res) => {
  const user = await users.findOne({ Email: req.user.email });
  if (!["Admin", "SuperAdmin"].includes(user.Role))
    return res.sendStatus(403);

  await customers.deleteOne({ Email: req.params.email });
  res.json({ success: true });
});

/* ================= START ================= */
connectDB().then(() =>
  app.listen(PORT, () => console.log(`Server running on ${PORT}`))
);
