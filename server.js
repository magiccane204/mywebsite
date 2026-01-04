

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const nodemailer = require("nodemailer");

const app = express();

/* ================== CONFIG ================== */
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const OWNER_EMAIL = "dhruvbhatiaxcyz@gmail.com";

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================== DATABASE ================== */
const client = new MongoClient(MONGO_URI);
let usersCollection;
let customersCollection;

/* ================== OTP STORE ================== */
const otpStore = new Map();

/* ================== NODEMAILER ================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ================== CONNECT DB ================== */
async function connectDB() {
  await client.connect();
  const db = client.db("Users");

  usersCollection = db.collection("user");
  customersCollection = db.collection("Customers");

  await usersCollection.createIndex({ Email: 1 }, { unique: true });
  await customersCollection.createIndex({ Company: 1 });

  await ensureSuperAdmin();
}

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

// LOGIN → SEND OTP
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await usersCollection.findOne({ Email: email });
  if (!user || user.Password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ message: "Email failed" });
  }
});

// RESEND OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
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
  app.listen(PORT, () => console.log("Server running on", PORT))
);
