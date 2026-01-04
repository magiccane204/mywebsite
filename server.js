require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();

/* ================== CONFIG ================== */
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGODB_URI;
const OWNER_EMAIL = "dhruvbhatiaxcyz@gmail.com";

/* ================== BASIC VALIDATION ================== */
if (!PORT) {
  console.error("❌ PORT missing");
  process.exit(1);
}
if (!MONGO_URI) {
  console.error("❌ MONGODB_URI missing");
  process.exit(1);
}
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("❌ EMAIL creds missing");
  process.exit(1);
}

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================== DATABASE ================== */
const client = new MongoClient(MONGO_URI);
let usersCollection;
let customersCollection;

async function connectDB() {
  await client.connect();
  const db = client.db("Users");

  usersCollection = db.collection("user");
  customersCollection = db.collection("Customers");

  await usersCollection.createIndex({ Email: 1 }, { unique: true });
  await customersCollection.createIndex({ Company: 1 });

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

/* ================== OTP STORE ================== */
const otpStore = new Map();

/* ================== NODEMAILER ================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

/* ================== AUTH ================== */

// LOGIN → SEND OTP
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await usersCollection.findOne({ Email: email });
    if (!user || user.Password !== password)
      return res.status(401).json({ message: "Invalid credentials" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    console.log("✅ OTP SENT:", email);
    res.json({ success: true });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// RESEND OTP
app.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore.set(email, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    console.log("✅ OTP RESENT:", email);
    res.json({ success: true });

  } catch (err) {
    console.error("RESEND ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// VERIFY OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore.get(email);
  if (!record) return res.json({ success: false });

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.json({ success: false });
  }

  if (record.otp !== otp) {
    return res.json({ success: false });
  }

  otpStore.delete(email);
  res.json({ success: true });
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
