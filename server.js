// server.js — FINAL (NO fs, Render-safe)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { Resend } = require("resend");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();

/* ================== CONFIG ================== */
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const OWNER_EMAIL = "dhruvbhatiaxcyz@gmail.com";

const OTP_VALID_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 30 * 1000;

/* ================== VALIDATION ================== */
if (!PORT || !MONGO_URI || !JWT_SECRET || !process.env.RESEND_API_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================== EMAIL ================== */
const resend = new Resend(process.env.RESEND_API_KEY);

/* ================== DATABASE ================== */
const client = new MongoClient(MONGO_URI);
let usersCollection;
let customersCollection;
let otpCollection;

async function connectDB() {
  await client.connect();
  const db = client.db("Users");

  usersCollection = db.collection("user");
  customersCollection = db.collection("Customers");
  otpCollection = db.collection("otp");

  await usersCollection.createIndex({ Email: 1 }, { unique: true });
  await otpCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  await ensureSuperAdmin();
  console.log("✅ MongoDB connected");
}

/* ================== SUPER ADMIN ================== */
async function ensureSuperAdmin() {
  const exists = await usersCollection.findOne({ Email: OWNER_EMAIL });
  if (!exists) {
    await usersCollection.insertOne({
      Name: "Dhruv Bhatia",
      Email: OWNER_EMAIL,
      Password: "Password",
      Company: "Apple",
      Role: "SuperAdmin",
      verified: true,
      createdAt: new Date(),
    });
  }
}

/* ================== AUTH ================== */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await usersCollection.findOne({ Email: email });
    if (!user || user.Password !== password)
      return res.status(401).json({ success: false });

    const now = new Date();
    const existing = await otpCollection.findOne({ email });

    if (existing && existing.resendAfter > now) {
      return res.json({
        success: true,
        expiresIn: Math.ceil((existing.expiresAt - now) / 1000),
        resendIn: Math.ceil((existing.resendAfter - now) / 1000),
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await otpCollection.deleteMany({ email });

    await otpCollection.insertOne({
      email,
      otp,
      expiresAt: new Date(now.getTime() + OTP_VALID_MS),
      resendAfter: new Date(now.getTime() + OTP_RESEND_MS),
    });

    await resend.emails.send({
      from: "CRM <onboarding@resend.dev>",
      to: email,
      subject: "OTP Verification",
      html: `<h3>Your OTP is ${otp}</h3>`,
    });

    res.json({
      success: true,
      expiresIn: OTP_VALID_MS / 1000,
      resendIn: OTP_RESEND_MS / 1000,
    });
  } catch {
    res.status(500).json({ success: false });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const record = await otpCollection.findOne({ email, otp });
  if (!record || record.expiresAt < new Date())
    return res.status(401).json({ success: false });

  await otpCollection.deleteOne({ email });

  const user = await usersCollection.findOne({ Email: email });

  const token = jwt.sign(
    { email: user.Email, role: user.Role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ success: true, token });
});

/* ================== JWT MIDDLEWARE ================== */
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

/* ================== CURRENT USER ================== */
app.get("/me", auth, async (req, res) => {
  const user = await usersCollection.findOne(
    { Email: req.user.email },
    { projection: { Password: 0 } }
  );
  res.json(user);
});

/* ================== FILE UPLOAD (NO fs) ================== */
const upload = multer({ storage: multer.memoryStorage() });

app.post("/resume-extract", upload.single("resume"), async (req, res) => {
  let text = "";

  if (req.file.mimetype === "application/pdf") {
    text = (await pdfParse(req.file.buffer)).text;
  } else {
    text = (await mammoth.extractRawText({ buffer: req.file.buffer })).value;
  }

  res.json({ text });
});

/* ================== FRONTEND ================== */
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (_, res) =>
  res.sendFile(path.join(__dirname, "build", "index.html"))
);

/* ================== START ================== */
connectDB().then(() =>
  app.listen(PORT, () => console.log("🚀 Server running on", PORT))
);
