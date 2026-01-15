// server.js — INDUSTRIAL-GRADE, FULLY-FEATURED BACKEND (OTP ACTUALLY FIXED)

require("dotenv").config();

/* ================= CORE DEPENDENCIES ================= */
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const { MongoClient } = require("mongodb");
const { Resend } = require("resend");

/* ================= APP INIT ================= */
const app = express();

/* ================= ENV ================= */
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NODE_ENV = process.env.NODE_ENV || "production";

/* ================= BASIC SAFETY ================= */
if (!MONGO_URI || !JWT_SECRET || !RESEND_API_KEY) {
  console.error("Missing env variables");
  process.exit(1);
}

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================= DATABASE ================= */
const client = new MongoClient(MONGO_URI);
let db, users, customers, otps, sessions, auditLogs;

async function connectDB() {
  await client.connect();
  db = client.db("Users");
  users = db.collection("user");
  customers = db.collection("Customers");
  otps = db.collection("OTPs");
  sessions = db.collection("Sessions");
  auditLogs = db.collection("AuditLogs");

  await otps.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });
  await sessions.createIndex({ token: 1 });
  console.log("MongoDB connected");
}

/* ================= EMAIL ================= */
const resend = new Resend(RESEND_API_KEY);

/* ================= UTILITIES ================= */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function logAudit(action, email, meta = {}) {
  auditLogs.insertOne({
    action,
    email,
    meta,
    timestamp: new Date(),
  });
}

/* ================= AUTH ================= */
function auth(req, res, next) {
  const raw = req.headers.authorization;
  if (!raw) return res.sendStatus(401);

  const token = raw.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.sendStatus(403);
  }
}

/* ================= RATE LIMIT (LOGIN ONLY) ================= */
const rateMap = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const last = rateMap.get(ip) || 0;
  if (now - last < 800) return res.status(429).json({ message: "Too fast" });
  rateMap.set(ip, now);
  next();
}

/* ================= LOGIN (SEND OTP) ================= */
app.post("/api/login", rateLimit, async (req, res) => {
  const email = String(req.body.email || "").trim();
  const password = String(req.body.password || "");

  const user = await users.findOne({ Email: email });
  if (!user || user.Password !== password) {
    logAudit("LOGIN_FAIL", email);
    return res.status(401).json({ success: false });
  }

  const otp = generateOTP();

  await otps.deleteMany({ Email: email });
  await otps.insertOne({
    Email: email,
    OTP: otp,
    createdAt: new Date(),
  });

  await resend.emails.send({
    from: "CRM <onboarding@resend.dev>",
    to: email,
    subject: "Your OTP",
    html: `<h2>Your OTP is <b>${otp}</b></h2>`,
  });

  logAudit("OTP_SENT", email);
  res.json({ success: true });
});

/* ================= VERIFY OTP (FINAL FIX) ================= */
app.post("/api/verify-otp", async (req, res) => {
  const email = String(req.body.email || "").trim();
  const otp = String(req.body.otp || "").trim();

  if (!email || !otp)
    return res.status(400).json({ success: false });

  const record = await otps.findOne({
    Email: email,
    OTP: otp,
  });

  if (!record) {
    logAudit("OTP_FAIL", email);
    return res
      .status(401)
      .json({ success: false, message: "OTP invalid or expired" });
  }

  const user = await users.findOne({ Email: email });
  if (!user)
    return res.status(401).json({ success: false });

  const token = jwt.sign(
    {
      email: user.Email,
      role: user.Role,
      company: user.Company,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  await sessions.insertOne({
    email,
    token: hashToken(token),
    createdAt: new Date(),
  });

  await otps.deleteMany({ Email: email });

  logAudit("LOGIN_SUCCESS", email);
  res.json({ success: true, token });
});

/* ================= CURRENT USER ================= */
app.get("/api/me", auth, (req, res) => {
  res.json({
    Email: req.user.email,
    Role: req.user.role,
    Company: req.user.company,
  });
});

/* ================= SETTINGS ================= */
app.put("/api/me/darkmode", auth, async (req, res) => {
  await users.updateOne(
    { Email: req.user.email },
    { $set: { DarkMode: !!req.body.DarkMode } }
  );
  logAudit("DARKMODE_CHANGE", req.user.email);
  res.json({ success: true });
});

/* ================= CUSTOMERS ================= */
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

  logAudit("ADD_CUSTOMER", req.user.email, { Email });
  res.json({ success: true });
});

/* ================= LOGOUT ================= */
app.post("/api/logout", auth, async (req, res) => {
  await sessions.deleteMany({ email: req.user.email });
  logAudit("LOGOUT", req.user.email);
  res.json({ success: true });
});

/* ================= HEALTH ================= */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    env: NODE_ENV,
    time: new Date(),
  });
});

/* ================= STATIC FRONTEND ================= */
app.use(express.static(path.join(__dirname, "build")));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

/* ================= START ================= */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
});
