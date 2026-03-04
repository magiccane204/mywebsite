require("dotenv").config();
console.log("🔥 SERVER FILE RUNNING");

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const { Resend } = require("resend");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Joi = require("joi");

const app = express();
const upload = multer({ dest: "uploads/" });

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NODE_ENV = process.env.NODE_ENV || "production";

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
const client = new MongoClient(MONGO_URI);

let db, users, otps, sessions, auditLogs;

async function connectDB() {

  await client.connect();

  db = client.db("Users");

  users = db.collection("user");
  otps = db.collection("OTPs");
  sessions = db.collection("Sessions");
  auditLogs = db.collection("AuditLogs");

  await otps.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 });
  await sessions.createIndex({ token: 1 });

  await mongoose.connect(MONGO_URI);

  console.log("MongoDB connected");
}
const resend = new Resend(RESEND_API_KEY);
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function logAudit(action, email, meta = {}) {
  auditLogs.insertOne({
    action,
    email,
    meta,
    timestamp: new Date(),
  });
}
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
const mockAuth = (req, res, next) => {

  req.user = {
    email: "admin@company.com",
    role: "SuperAdmin",
    company: "YourCompany Pvt Ltd",
  };

  next();
};
const rateMap = new Map();

function rateLimit(req, res, next) {

  const ip = req.ip;

  const now = Date.now();

  const last = rateMap.get(ip) || 0;

  if (now - last < 800)
    return res.status(429).json({ message: "Too fast" });

  rateMap.set(ip, now);

  next();
}
app.post("/api/signup", async (req, res) => {

  try {

    const { Email, Password, Company, Role = "Employee" } = req.body;

    if (!Email || !Password || !Company) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await users.findOne({ Email });

    if (exists)
      return res.status(409).json({ message: "User already exists" });

    await users.insertOne({
      Email,
      Password: hashPassword(Password),
      Company,
      Role,
      DarkMode: false,
      createdAt: new Date(),
    });

    logAudit("SIGNUP", Email, { Company, Role });

    return res.json({ success: true });

  } catch (err) {

    console.error("SIGNUP_ERROR", err);

    return res.status(500).json({ message: "Internal server error" });

  }
});
/* ================= LOGIN – SEND OTP ================= */

app.post("/api/login", rateLimit, async (req, res) => {

  try {

    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await users.findOne({ Email: email });

    if (!user || user.Password !== hashPassword(password)) {

      logAudit("LOGIN_FAIL", email);

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });

    }

    const otp = generateOTP();

    await otps.deleteMany({ Email: email });

    await otps.insertOne({
      Email: email,
      OTP: otp,
      attempts: 0,
      createdAt: new Date(),
    });

    await resend.emails.send({
      from: "CRM <onboarding@resend.dev>",
      to: email,
      subject: "Your OTP",
      html: `<h2>Your OTP is <b>${otp}</b></h2>`,
    });

    logAudit("OTP_SENT", email);

    return res.json({
      success: true,
      message: "OTP sent to email",
    });

  } catch (err) {

    console.error("LOGIN_ERROR", err);

    return res.status(500).json({
      message: "Internal server error",
    });

  }

});


/* ================= VERIFY OTP ================= */

app.post("/api/verify-otp", async (req, res) => {

  try {

    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {

      return res.status(400).json({
        success: false,
        message: "Email and OTP required",
      });

    }

    const record = await otps.findOne({ Email: email });

    if (!record) {

      logAudit("OTP_FAIL", email);

      return res.status(401).json({
        success: false,
        message: "OTP expired or not found",
      });

    }

    if (record.attempts >= 5) {

      return res.status(403).json({
        success: false,
        message: "Too many OTP attempts",
      });

    }

    if (record.OTP !== otp) {

      await otps.updateOne(
        { Email: email },
        { $inc: { attempts: 1 } }
      );

      logAudit("OTP_FAIL", email);

      return res.status(401).json({
        success: false,
        message: "Invalid OTP",
      });

    }

    const user = await users.findOne({ Email: email });

    if (!user)
      return res.status(401).json({
        success: false,
        message: "User not found",
      });

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

    return res.json({
      success: true,
      token,
    });

  } catch (err) {

    console.error("VERIFY_OTP_ERROR", err);

    return res.status(500).json({
      message: "Internal server error",
    });

  }

});
/* ================= EMPLOYEE SCHEMA ================= */

const employeeSchema = new mongoose.Schema({

  Name: { type: String, required: true },

  Email: { type: String, required: true },

  Salary: { type: Number, required: true },

  "Applied Position": { type: String, required: true },

  Company: { type: String, required: true },

  locked: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now },

});

employeeSchema.index(
  { Email: 1, Company: 1 },
  { unique: true }
);

const EmployeesModel = mongoose.model(
  "Employee",
  employeeSchema
);
/* ================= VALIDATION SCHEMA ================= */

const addEmployeeSchema = Joi.object({

  Name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

  Email: Joi.string()
    .email()
    .required(),

  Salary: Joi.number()
    .min(0)
    .required(),

  "Applied Position": Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required(),

});
/* ================= EMAIL FUNCTIONS ================= */

async function sendAppointmentEmail({
  to,
  name,
  position,
  salary,
  company,
}) {

  await resend.emails.send({

    from: "HR <onboarding@resend.dev>",

    to,

    subject: "Appointment Letter",

    html: `
      <h2>Congratulations ${name}</h2>
      <p>You have been appointed as <b>${position}</b> at <b>${company}</b>.</p>
      <p>Your salary will be <b>${salary}</b>.</p>
      <p>Welcome to the team!</p>
    `,

  });

}

async function sendTerminationEmail({
  to,
  name,
  position,
  company,
}) {

  await resend.emails.send({

    from: "HR <onboarding@resend.dev>",

    to,

    subject: "Termination Notice",

    html: `
      <h2>Dear ${name}</h2>
      <p>Your role as <b>${position}</b> at <b>${company}</b> has been terminated.</p>
    `,

  });

}
/* ================= ADD EMPLOYEE ================= */

app.post("/api/employees", mockAuth, async (req, res) => {

  if (req.user.role === "Employee")
    return res.status(403).json({ message: "Forbidden" });

  const { error, value } = addEmployeeSchema.validate(req.body);

  if (error)
    return res.status(400).json({
      message: error.details[0].message,
    });

  try {

    const employee = await EmployeesModel.create({

      ...value,

      Company: req.user.company,

      createdAt: new Date(),

      locked: false,

    });

    sendAppointmentEmail({
      to: value.Email,
      name: value.Name,
      position: value["Applied Position"],
      salary: value.Salary,
      company: req.user.company,
    }).catch((err) =>
      console.error("EMAIL_SEND_FAILED", err.message)
    );

    return res.status(201).json({
      success: true,
      id: employee._id,
    });

  } catch (err) {

    if (err.code === 11000)
      return res.status(409).json({
        message: "Employee already exists",
      });

    console.error("ADD_EMPLOYEE_ERROR", err);

    return res.status(500).json({
      message: "Something went wrong",
    });

  }

});
/* ================= GET EMPLOYEES ================= */

app.get("/api/employees", mockAuth, async (req, res) => {

  try {

    const employees = await EmployeesModel.find({
      Company: req.user.company,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(employees);

  } catch (err) {

    console.error("GET_EMPLOYEES_ERROR", err);

    return res.status(500).json({
      message: "Failed to fetch employees",
    });

  }

});
/* ================= UPDATE EMPLOYEE ================= */

app.put("/api/update-employee", mockAuth, async (req, res) => {

  if (req.user.role === "Employee")
    return res.status(403).json({ message: "View only" });

  const { Id, Name, Email, Salary, ["Applied Position"]: Position } = req.body;

  if (!Id || !Name || !Email || !Salary || !Position)
    return res.status(400).json({
      message: "Missing fields",
    });

  const employee = await EmployeesModel.findOne({
    _id: Id,
    Company: req.user.company,
  });

  if (!employee)
    return res.status(404).json({
      message: "Employee not found",
    });

  if (employee.locked)
    return res.status(403).json({
      message: "Employee is locked",
    });

  await EmployeesModel.updateOne(
    { _id: Id },
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

  logAudit("UPDATE_EMPLOYEE", req.user.email, { Email });

  return res.json({ success: true });

});
/* ================= DELETE EMPLOYEE ================= */

app.delete("/api/employees/:id", mockAuth, async (req, res) => {

  if (req.user.role !== "SuperAdmin")
    return res.status(403).json({
      message: "Only SuperAdmin can delete",
    });

  const { id } = req.params;

  const employee = await EmployeesModel.findOne({
    _id: id,
    Company: req.user.company,
  });

  if (!employee)
    return res.status(404).json({
      message: "Employee not found",
    });

  await EmployeesModel.deleteOne({ _id: id });

  sendTerminationEmail({
    to: employee.Email,
    name: employee.Name,
    position: employee["Applied Position"],
    company: req.user.company,
  }).catch((err) =>
    console.error("TERMINATION_EMAIL_FAILED", err.message)
  );

  return res.json({ success: true });

});
/* ================= LOCK / UNLOCK EMPLOYEE ================= */

app.put("/api/employees/lock/:id", mockAuth, async (req, res) => {

  if (req.user.role !== "SuperAdmin")
    return res.status(403).json({
      message: "Only SuperAdmin can lock/unlock employees",
    });

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({
      message: "Invalid employee ID",
    });

  const employee = await EmployeesModel.findOne({
    _id: id,
    Company: req.user.company,
  });

  if (!employee)
    return res.status(404).json({
      message: "Employee not found",
    });

  const newStatus = !employee.locked;

  employee.locked = newStatus;

  await employee.save();

  logAudit(
    newStatus ? "EMPLOYEE_LOCKED" : "EMPLOYEE_UNLOCKED",
    req.user.email,
    { EmployeeId: id }
  );

  return res.json({
    success: true,
    locked: newStatus,
  });

});
/* ================= RESUME PARSER UTILITIES ================= */

const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

function extractEmail(text) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "No email";
}

function extractPhone(text) {

  const candidates = text.match(/(\+?\d[\d\s().-]{7,20}\d)/g);

  if (!candidates) return "No phone";

  for (const raw of candidates) {

    if (/\b(18|19|20)\d{2}/.test(raw)) continue;

    const digits = raw.replace(/\D/g, "");

    if (digits.length >= 8 && digits.length <= 15)
      return raw.trim();

  }

  return "No phone";

}

function extractName(lines, email) {

  const blacklist = [
    "profile","info","resume","summary","curriculum","vitae","personal",
    "experience","education","skills","languages","contact","objective"
  ];

  for (const line of lines.slice(0, 8)) {

    const l = line.toLowerCase();

    if (line.length < 50 && !/\d/.test(line) && !blacklist.some(b => l.includes(b)))
      return line;

  }

  if (email !== "No email")
    return email.split("@")[0].replace(/[._-]/g, " ").toUpperCase();

  return "No name";

}

function extractSkills(text) {

  const tokens = text.match(/\b[A-Za-z][A-Za-z0-9.+#\/()-]{2,40}\b/g) || [];

  const unique = [...new Set(tokens)];

  return unique.slice(0, 25);

}

function parseResumeText(text) {

  const lines = text.split(/\r?\n/).map(l => clean(l)).filter(Boolean);

  const email = extractEmail(text);

  return {

    name: extractName(lines, email),

    email,

    phone: extractPhone(text),

    linkedIn:
      text.match(/https?:\/\/(www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || "No LinkedIn",

    skills: extractSkills(text),

    experience: "Present",

    education: "Present",

  };

}
/* ================= RESUME UPLOAD API ================= */

app.post("/api/resume/extract", mockAuth, upload.single("resume"), async (req, res) => {

  try {

    if (!req.file)
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });

    const buffer = fs.readFileSync(req.file.path);

    let text = "";

    if (req.file.mimetype === "application/pdf") {

      const parsed = await pdfParse(buffer);

      text = parsed.text || "";

    }

    else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

      const out = await mammoth.extractRawText({ buffer });

      text = out.value || "";

    }

    else {

      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });

    }

    fs.unlinkSync(req.file.path);

    const data = parseResumeText(text);

    return res.json({
      success: true,
      data,
    });

  }

  catch (err) {

    console.error("RESUME_PARSE_ERROR", err);

    return res.status(500).json({
      success: false,
      message: "Failed to parse resume",
    });

  }

});
/* ================= DASHBOARD ================= */

app.get("/api/dashboard", mockAuth, async (req, res) => {

  try {

    const employees = await EmployeesModel.find({
      Company: req.user.company,
    })
      .sort({ createdAt: -1 })
      .lean();

    const visibleEmployees = employees.filter(emp => !emp.locked);

    return res.json({
      success: true,
      employees: visibleEmployees,
    });

  }

  catch (err) {

    console.error("DASHBOARD_ERROR", err);

    return res.status(500).json({
      message: "Failed to load dashboard",
    });

  }

});
/* ================= SESSION VALIDATION ================= */

app.get("/api/validate-session", mockAuth, async (req, res) => {

  try {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
      return res.json({ valid: false });

    const tokenHash = hashToken(token);

    const session = await sessions.findOne({ token: tokenHash });

    return res.json({
      valid: !!session,
    });

  }

  catch (err) {

    console.error("SESSION_VALIDATE_ERROR", err);

    return res.status(500).json({
      valid: false,
    });

  }

});
/* ================= GLOBAL ERROR HANDLER ================= */

app.use((err, req, res, next) => {

  console.error("UNHANDLED_ERROR", err);

  res.status(500).json({
    success: false,
    message: "Unexpected error occurred",
  });

});
/* ================= ROOT / HEALTH ================= */
app.get("/api/health", (req, res) => {

  res.json({
    status: "ok",
    uptime: process.uptime(),
    env: NODE_ENV,
    time: new Date(),
  });

});
/* ================= SERVE FRONTEND ================= */

const frontendPath = path.join(__dirname, "build");

app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});
/* ================= SERVER START ================= */

connectDB()
  .then(() => {

    app.listen(PORT, () => {

      console.log(
        `🔥 Server running on PORT ${PORT} | ENV: ${NODE_ENV}`
      );

    });

  })
  .catch(err => {

    console.error("DB_CONNECTION_FAILED", err);

    process.exit(1);

  });






