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

const YEAR_REGEX = /\b(19|20)\d{2}\b/;

const extractEmail = (t) =>
  t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)?.[0] || "No email";

const extractLinkedIn = (t) =>
  t.match(/https?:\/\/(www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || "No LinkedIn";
function extractPhone(text) {
  // 1️⃣ Best-case: semantic extraction (library intelligence)
  try {
    if (typeof phoneUtil.parsePhoneNumberFromText === "function") {
      const phone = phoneUtil.parsePhoneNumberFromText(text);
      if (phone && phone.isValid()) {
        return phone.formatInternational();
      }
    }
  } catch {}

  // 2️⃣ Fallback: scan numeric candidates, then VALIDATE (not guess)
  const candidates = text.match(/(\+?\d[\d\s().-]{6,20}\d)/g) || [];

  for (let raw of candidates) {
    const digits = raw.replace(/\D/g, "");

    // ❌ Reject dates / years / ranges
    if (
      /\b(19|20)\d{2}\b/.test(raw) ||
      raw.includes("-") && /\d{4}\s*-\s*\d{4}/.test(raw)
    ) continue;

    // ❌ Impossible phone lengths
    if (digits.length < 7 || digits.length > 15) continue;

    // Normalize: enforce international format without assuming country
    const normalized = raw.startsWith("+")
      ? raw
      : "+" + digits;

    try {
      if (typeof phoneUtil.parsePhoneNumber === "function") {
        const parsed = phoneUtil.parsePhoneNumber(normalized);
        if (parsed && parsed.isValid()) {
          return parsed.formatInternational();
        }
      }
    } catch {}
  }

  return "No phone";
}
/* ===== NAME (FIXED) ===== */
function extractName(lines, email) {
  const blacklist = /profile|info|resume|cv|personal|details/i;

  for (const l of lines.slice(0, 8)) {
    if (
      l.length < 40 &&
      !/\d/.test(l) &&
      !blacklist.test(l)
    ) {
      return clean(l);
    }
  }

  if (email !== "No email") {
    return email.split("@")[0].replace(/[._-]/g, " ").toUpperCase();
  }

  return "No name";
}

/* ================== SECTION SPLITTER ================== */

function splitSections(text) {
  const sections = {
    experience: [],
    education: [],
    skills: [],
    summary: [],
    languages: [],
    hobbies: []
  };

  let current = null;

  text.split(/\r?\n/).forEach(line => {
    const l = line.trim();
    if (!l) return;

    if (/summary|objective|profile/i.test(l)) current = "summary";
    else if (/experience|work/i.test(l)) current = "experience";
    else if (/education|academic|qualification/i.test(l)) current = "education";
    else if (/skills|technical|competencies/i.test(l)) current = "skills";
    else if (/languages/i.test(l)) current = "languages";
    else if (/hobbies|interests/i.test(l)) current = "hobbies";

    if (current) sections[current].push(l);
  });

  return sections;
}

/* ================== DATE-AWARE ROUTING ================== */

function routeByDates(lines) {
  const experience = [];
  const education = [];

  for (const l of lines) {
    if (YEAR_REGEX.test(l)) {
      if (/school|college|university|degree|bachelor|master/i.test(l)) {
        education.push(l);
      } else {
        experience.push(l);
      }
    }
  }

  return { experience, education };
}

/* ================== CLEAN SKILLS ================== */

function extractSkills(text) {
  const blacklist = new Set([
    "PROFILE","INFO","SUMMARY","EXPERIENCE","EDUCATION",
    "LANGUAGE","LANGUAGES","HOBBIES","INTERESTS",
    "UAE","DUBAI","DRIVER"
  ]);

  const words = text.match(/\b[A-Z][A-Za-z0-9.+#-]{2,20}\b/g) || [];

  const skills = Array.from(new Set(words))
    .filter(w => !blacklist.has(w.toUpperCase()))
    .slice(0, 20);

  return skills.length ? skills : ["No skills"];
}

function extractLanguages(text) {
  const langs = text.match(/\b(English|Hindi|Arabic|French|Tagalog|Urdu)\b/gi) || [];
  return langs.length ? Array.from(new Set(langs)) : ["No languages"];
}

/* ================== MAIN PARSER ================== */

async function parseResumeText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const blob = text.replace(/\s+/g, " ");

  const sections = splitSections(text);
  const dateRouted = routeByDates(lines);

  const experienceText = [
    ...sections.experience,
    ...dateRouted.experience
  ];

  const educationText = [
    ...sections.education,
    ...dateRouted.education
  ];

  return {
    name: extractName(lines, extractEmail(blob)),
    email: extractEmail(blob),
    phone: extractPhone(blob),
    linkedIn: extractLinkedIn(blob),

    summary: clean(sections.summary.join(" ")) || "No summary",
    experience: clean(experienceText.join(" ")) || "No experience",
    education: clean(educationText.join(" ")) || "No education",

    skills: extractSkills(sections.skills.join(" ")),
    languages: extractLanguages(sections.languages.join(" ")),
    hobbies: clean(sections.hobbies.join(" ")) || "No hobbies"
  };
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
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

/* ================= START ================= */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
});






