// server.js — INDUSTRIAL-GRADE, FULLY-FEATURED BACKEND (OTP ACTUALLY FIXED)

require("dotenv").config();

console.log("🔥 SERVER FILE RUNNING");

/* ================= CORE DEPENDENCIES ================= */
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const { MongoClient } = require("mongodb");
const { Resend } = require("resend");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const nlp = require("compromise");
const phoneUtil = require("libphonenumber-js");
import OpenAI from "openai";
/* ================= APP INIT ================= */
const app = express();
const upload = multer({ dest: "uploads/" });

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

/* ================= UPDATE CUSTOMER ================= */
app.put("/api/update-customer", auth, async (req, res) => {
  if (req.user.role === "Employee")
    return res.status(403).json({ message: "View only" });

  const {
    Id,
    Name,
    Email,
    Salary,
    ["Applied Position"]: Position,
  } = req.body;

  if (!Id || !Name || !Email || !Position || Salary == null)
    return res.status(400).json({ message: "Missing fields" });

  const { ObjectId } = require("mongodb");

  const result = await customers.updateOne(
    {
      _id: new ObjectId(Id),
      Company: req.user.company,
    },
    {
      $set: {
        Name,
        Email,
        Salary,
        "Applied Position": Position,
        updatedAt: new Date(),
      },
    }
  );

  if (result.matchedCount === 0)
    return res.status(404).json({ message: "Customer not found" });

  logAudit("UPDATE_CUSTOMER", req.user.email, { Email });
  res.json({ success: true });
});
/* ================= DELETE CUSTOMER ================= */
app.delete("/api/delete-customer/:id", auth, async (req, res) => {
  if (req.user.role !== "SuperAdmin")
    return res.status(403).json({ message: "Only SuperAdmin can delete" });

  const { ObjectId } = require("mongodb");

  await customers.deleteOne({
    _id: new ObjectId(req.params.id),
    Company: req.user.company,
  });

  logAudit("DELETE_CUSTOMER", req.user.email, { id: req.params.id });
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
/* ================== UTIL ================== */

const clean = (s = "") => s.replace(/\s+/g, " ").trim();
const isNoise = l =>
  /profile info|resume|curriculum vitae|page \d+/i.test(l);

/* ================== AI CLASSIFIER ================== */

async function classifyLines(lines) {
  const prompt = `
You are a resume parsing AI.

Classify each line strictly into ONE category:
- NAME
- EMAIL
- PHONE
- LINKEDIN
- SKILL
- LANGUAGE
- EXPERIENCE
- EDUCATION
- HOBBY
- NOISE

Rules:
- "PROFILE INFO", "SUMMARY", headers → NOISE
- Languages ≠ skills
- Locations ≠ skills
- Names are human names only

Return JSON array:
[{ "line": "...", "type": "..." }]

Lines:
${lines.map(l => `- ${l}`).join("\n")}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(res.choices[0].message.content);
}

/* ================== MAIN PARSER ================== */

async function parseResumeText(text) {
  const rawLines = text
    .split(/\r?\n/)
    .map(l => clean(l))
    .filter(l => l.length > 2 && !isNoise(l))
    .slice(0, 120); // cost control

  const classified = await classifyLines(rawLines);

  const result = {
    name: "No name",
    email: "No email",
    phone: "No phone",
    linkedIn: "No LinkedIn",
    skills: [],
    languages: [],
    experience: [],
    education: [],
    hobbies: []
  };

  for (const item of classified) {
    const l = item.line;
    switch (item.type) {
      case "NAME":
        if (result.name === "No name") result.name = l;
        break;
      case "EMAIL":
        result.email = l;
        break;
      case "PHONE":
        result.phone = l;
        break;
      case "LINKEDIN":
        result.linkedIn = l;
        break;
      case "SKILL":
        result.skills.push(l);
        break;
      case "LANGUAGE":
        result.languages.push(l);
        break;
      case "EXPERIENCE":
        result.experience.push(l);
        break;
      case "EDUCATION":
        result.education.push(l);
        break;
      case "HOBBY":
        result.hobbies.push(l);
        break;
    }
  }

  // FINAL CLEANUP
  result.skills = [...new Set(result.skills)].slice(0, 10);
  result.languages = [...new Set(result.languages)].slice(0, 5);
  result.experience = result.experience.slice(0, 3);
  result.education = result.education.slice(0, 2);

  if (!result.skills.length) result.skills = ["No skills"];
  if (!result.languages.length) result.languages = ["No languages"];
  if (!result.hobbies.length) result.hobbies = ["No hobbies"];

  return result;
}

/* ================== API ================== */

app.post("/api/resume/extract", upload.single("resume"), async (req, res) => {
  try {
    const buffer = fs.readFileSync(req.file.path);
    let text = "";

    if (req.file.mimetype === "application/pdf") {
      const parsed = await pdfParse(buffer);
      text = parsed.text || "";
    } else {
      const out = await mammoth.extractRawText({ buffer });
      text = out.value || "";
    }

    fs.unlinkSync(req.file.path);

    const data = await parseResumeText(text);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Parsing failed" });
  }
});
/* ================= START ================= */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
});

