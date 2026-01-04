// server.js — FINAL (Resend + JWT + MongoDB OTP + Countdown + Cooldown, Render-ready)

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const { Resend } = require("resend");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();

/* ================== CONFIG ================== */
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const OWNER_EMAIL = "dhruvbhatiaxcyz@gmail.com";

const OTP_VALID_MS = 5 * 60 * 1000;   // 5 minutes
const OTP_RESEND_MS = 30 * 1000;      // 30 seconds

/* ================== VALIDATION ================== */
if (!PORT || !MONGO_URI || !JWT_SECRET || !process.env.RESEND_API_KEY) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================== EMAIL (RESEND) ================== */
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
  await customersCollection.createIndex({ Company: 1 });
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

// LOGIN → SEND OTP (with cooldown + expiry info)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false });

    const user = await usersCollection.findOne({ Email: email });
    if (!user || user.Password !== password)
      return res.status(401).json({ success: false });

    const now = new Date();

    const existing = await otpCollection.findOne({ email });
    if (existing && existing.resendAfter > now) {
      return res.status(429).json({
        success: false,
        retryAfter: Math.ceil((existing.resendAfter - now) / 1000),
        expiresIn: Math.ceil((existing.expiresAt - now) / 1000),
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await otpCollection.deleteMany({ email });

    const expiresAt = new Date(now.getTime() + OTP_VALID_MS);
    const resendAfter = new Date(now.getTime() + OTP_RESEND_MS);

    await otpCollection.insertOne({
      email,
      otp,
      expiresAt,
      resendAfter,
    });

    await resend.emails.send({
      from: "CRM <onboarding@resend.dev>",
      to: email,
      subject: "OTP Verification",
      html: `<h3>Your OTP is ${otp}</h3><p>Valid for 5 minutes</p>`,
    });

    res.json({
      success: true,
      expiresIn: Math.ceil(OTP_VALID_MS / 1000),
      resendIn: Math.ceil(OTP_RESEND_MS / 1000),
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// RESEND OTP (cooldown enforced)
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false });

    const now = new Date();
    const record = await otpCollection.findOne({ email });

    if (!record)
      return res.status(400).json({ success: false });

    if (record.resendAfter > now) {
      return res.status(429).json({
        success: false,
        retryAfter: Math.ceil((record.resendAfter - now) / 1000),
        expiresIn: Math.ceil((record.expiresAt - now) / 1000),
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(now.getTime() + OTP_VALID_MS);
    const resendAfter = new Date(now.getTime() + OTP_RESEND_MS);

    await otpCollection.updateOne(
      { email },
      {
        $set: {
          otp,
          expiresAt,
          resendAfter,
        },
      }
    );

    await resend.emails.send({
      from: "CRM <onboarding@resend.dev>",
      to: email,
      subject: "OTP Verification",
      html: `<h3>Your OTP is ${otp}</h3><p>Valid for 5 minutes</p>`,
    });

    res.json({
      success: true,
      expiresIn: Math.ceil(OTP_VALID_MS / 1000),
      resendIn: Math.ceil(OTP_RESEND_MS / 1000),
    });
  } catch (err) {
    console.error("RESEND ERROR:", err);
    res.status(500).json({ success: false });
  }
});

// VERIFY OTP → ISSUE JWT
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await otpCollection.findOne({ email, otp });
    if (!record) return res.status(401).json({ success: false });

    if (record.expiresAt < new Date()) {
      await otpCollection.deleteOne({ email });
      return res.status(401).json({ success: false });
    }

    await otpCollection.deleteOne({ email });

    const user = await usersCollection.findOne({ Email: email });

    const token = jwt.sign(
      { email: user.Email, role: user.Role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ success: false });
  }
});

/* ================== AUTH MIDDLEWARE ================== */
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

/* ================== CUSTOMERS ================== */
app.get("/customers/:email", auth, async (req, res) => {
  const user = await usersCollection.findOne(
    { Email: req.params.email },
    { projection: { Company: 1 } }
  );

  const customers = await customersCollection
    .find({ Company: user?.Company })
    .toArray();

  res.json(customers);
});

/* ================== FILE UPLOAD ================== */
const upload = multer({ dest: "uploads/" });

app.post("/resume-extract", upload.single("resume"), async (req, res) => {
  const buffer = fs.readFileSync(req.file.path);
  let text = "";

  if (req.file.mimetype === "application/pdf") {
    text = (await pdfParse(buffer)).text;
  } else {
    text = (await mammoth.extractRawText({ buffer })).value;
  }

  fs.unlinkSync(req.file.path);
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
