// server.js — FINAL FIX (API routes protected from React catch-all)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();

/* ================= CONFIG ================= */
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

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

/* ================= AUTH ================= */
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

/* ================= API ================= */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await users.findOne({ Email: email });
  if (!user || user.Password !== password)
    return res.status(401).json({ success: false });

  const token = jwt.sign(
    {
      email: user.Email,
      role: user.Role,
      company: user.Company,
    },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  res.json({ success: true, token });
});

app.get("/api/me", auth, (req, res) => {
  res.json({
    Email: req.user.email,
    Role: req.user.role,
    Company: req.user.company,
  });
});

app.put("/api/me/darkmode", auth, async (req, res) => {
  const { DarkMode } = req.body;

  await users.updateOne(
    { Email: req.user.email },
    { $set: { DarkMode } }
  );

  res.json({ success: true });
});

app.get("/api/customers", auth, async (req, res) => {
  const list = await customers
    .find({ Company: req.user.company })
    .toArray();

  res.json(list);
});

app.post("/api/add-customer", auth, async (req, res) => {
  if (req.user.role === "Employee")
    return res.status(403).json({ message: "View only" });

  const { Name, Email, Salary, ["Applied Position"]: Position } = req.body;
  if (!Name || !Email || !Position || Salary == null)
    return res.status(400).json({ message: "Missing fields" });

  await customers.insertOne({
    Name,
    Email,
    Salary,
    "Applied Position": Position,
    Company: req.user.company,
    createdAt: new Date(),
  });

  res.json({ success: true });
});

/* ================= REACT ================= */
app.use(express.static(path.join(__dirname, "build")));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

/* ================= START ================= */
connectDB().then(() =>
  app.listen(PORT, () => console.log(`Server running on ${PORT}`))
);
