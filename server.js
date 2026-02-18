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



/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================= DATABASE ================= */
const client = new MongoClient(MONGO_URI);
let db, users, Employees, otps, sessions, auditLogs;

async function connectDB() {
  await client.connect();
  db = client.db("Users");
  users = db.collection("user");
  Employees = db.collection("Employees");
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
/* ================= SIGNUP ================= */
app.post("/api/signup", async (req, res) => {
  const {
    Email,
    Password,
    Company,
    Role = "Employee"
  } = req.body;

  if (!Email || !Password || !Company)
    return res.status(400).json({ message: "Missing fields" });

  const exists = await users.findOne({ Email });
  if (exists)
    return res.status(409).json({ message: "User already exists" });

  await users.insertOne({
    Email,
    Password: hashPassword(Password),
    Company,
    Role,
    DarkMode: false,
    createdAt: new Date()
  });

  logAudit("SIGNUP", Email, { Company, Role });

  res.json({ success: true });
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

/* ================= EmployeeS ================= */
app.get("/api/Employees", auth, async (req, res) => {
  const list = await Employees
    .find({ Company: req.user.company })
    .toArray();
  res.json(list);
});

app.post("/api/add-Employee", auth, async (req, res) => {
  if (req.user.role === "Employee")
    return res.status(403).json({ message: "View only" });

  const { Name, Email, Salary, ["Applied Position"]: Position } = req.body;
  if (!Name || !Email || !Position || Salary == null)
    return res.status(400).json({ message: "Missing fields" });

  await Employees.insertOne({
    Name,
    Email,
    Salary,
    "Applied Position": Position,
    Company: req.user.company,
    createdAt: new Date(),
  });

  logAudit("ADD_Employee", req.user.email, { Email });
  res.json({ success: true });
});

/* ================= UPDATE Employee ================= */
app.put("/api/update-Employee", auth, async (req, res) => {
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

  const result = await Employees.updateOne(
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
    return res.status(404).json({ message: "Employee not found" });

  logAudit("UPDATE_Employee", req.user.email, { Email });
  res.json({ success: true });
});
/* ================= DELETE Employee ================= */
app.delete("/api/delete-Employee/:id", auth, async (req, res) => {
  if (req.user.role !== "SuperAdmin")
    return res.status(403).json({ message: "Only SuperAdmin can delete" });

  const { ObjectId } = require("mongodb");

  await Employees.deleteOne({
    _id: new ObjectId(req.params.id),
    Company: req.user.company,
  });

  logAudit("DELETE_Employee", req.user.email, { id: req.params.id });
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


/* ================= UTIL ================= */

const clean = s => (s || "").replace(/\s+/g, " ").trim();

/* ================= EMAIL ================= */

function extractEmail(text) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "No email";
}

/* ================= PHONE (STRICT: IGNORE DATES) ================= */

function extractPhone(text) {
  const candidates = text.match(/(\+?\d[\d\s().-]{7,20}\d)/g);
  if (!candidates) return "No phone";

  for (const raw of candidates) {
    if (/\b(18|19|20)\d{2}\s*[-–]\s*(18|19|20)\d{2}\b/.test(raw)) continue;
    if (/\b(18|19|20)\d{2}\b/.test(raw)) continue;

    const digits = raw.replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) {
      return raw.trim();
    }
  }
  return "No phone";
}

/* ================= NAME ================= */

function extractName(lines, email) {
  const blacklist = [
    "profile","info","resume","summary","curriculum","vitae","personal",
    "experience","education","skills","languages","contact","seeking",
    "objective","national","state","city","country"
  ];

  for (const line of lines.slice(0, 8)) {
    const l = line.toLowerCase();
    if (
      line.length < 50 &&
      !/\d/.test(line) &&
      !blacklist.some(b => l.includes(b))
    ) {
      return line;
    }
  }

  if (email !== "No email") {
    return email.split("@")[0].replace(/[._-]/g, " ").toUpperCase();
  }

  return "No name";
}

/* ================= WORLD LANGUAGES (ISO-639 + COMMON NAMES) ================= */

const LANGUAGE_SET = new Set([
  // major
  "english","spanish","french","german","italian","portuguese","russian",
  "arabic","hindi","urdu","bengali","punjabi","marathi","gujarati","tamil",
  "telugu","kannada","malayalam","oriya","assamese","nepali","sinhala",
  "chinese","mandarin","cantonese","japanese","korean",
  // europe
  "dutch","swedish","norwegian","danish","finnish","icelandic",
  "polish","czech","slovak","hungarian","romanian","bulgarian",
  "serbian","croatian","bosnian","slovenian","albanian","greek",
  "estonian","latvian","lithuanian","irish","welsh","scottish","gaelic",
  // asia
  "thai","vietnamese","indonesian","malay","filipino","tagalog",
  "burmese","khmer","lao","mongolian","kazakh","uzbek","tajik","kyrgyz",
  // middle east / africa
  "hebrew","farsi","persian","pashto","kurdish","turkish",
  "swahili","zulu","xhosa","afrikaans","yoruba","igbo","hausa",
  "amharic","tigrinya","somali",
  // americas
  "quechua","guarani","nahuatl","aymara",
  // others / catch-all
  "latin","esperanto"
]);

/* ================= GEO / LOCATION FILTER ================= */

const GEO_WORDS = new Set([
  "state","city","province","district","country","national","international",
  "india","philippines","pakistan","china","japan","korea","uae","dubai",
  "abu","dhabi","malaysia","singapore","indonesia","thailand","vietnam",
  "bukidnon","misamis","oriental","malaybalay","manila","mumbai","delhi",
  "london","paris","berlin","rome","madrid","new","york","los","angeles"
]);

/* ================= UNIVERSAL SKILLS (EVERYTHING, NO LIST DEPENDENCY) ================= */

function extractSkills(text) {
  const tokens = text.match(/\b[A-Za-z][A-Za-z0-9.+#\/()-]{2,40}\b/g) || [];

  const skills = tokens.filter(w => {
    const lw = w.toLowerCase();

    if (LANGUAGE_SET.has(lw)) return false;
    if (GEO_WORDS.has(lw)) return false;
    if (/^\d+$/.test(w)) return false;
    if (/(18|19|20)\d{2}/.test(w)) return false;
    if (lw.length < 3) return false;

    return true; // EVERYTHING ELSE IS A SKILL
  });

  const unique = [...new Set(skills)];
  return unique.length ? unique.slice(0, 25) : ["No skills"];
}

/* ================= LANGUAGES (STRICT: ONLY FROM WORLD SET) ================= */

function extractLanguages(text) {
  const tokens = text.match(/\b[A-Za-z]{3,25}\b/g) || [];
  const langs = tokens.filter(w => LANGUAGE_SET.has(w.toLowerCase()));
  const unique = [...new Set(langs)];
  return unique.length ? unique : ["No languages"];
}

/* ================= MAIN PARSER ================= */

function parseResumeText(text) {
  const lines = text.split(/\r?\n/).map(l => clean(l)).filter(Boolean);
  const email = extractEmail(text);

  return {
    name: extractName(lines, email),
    email,
    phone: extractPhone(text),
    linkedIn:
      text.match(/https?:\/\/(www\.)?linkedin\.com\/[^\s)]+/i)?.[0] ||
      "No LinkedIn",
    skills: extractSkills(text),
    languages: extractLanguages(text),
    experience: "Present",
    education: "Present"
  };
}

/* ================= API ================= */

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

    const data = parseResumeText(text);
    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
/* ================= START ================= */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
});


