require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { Resend } = require("resend");

const app = express();

/* ================== CONFIG ================== */
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const OWNER_EMAIL = "dhruvbhatiaxcyz@gmail.com";

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI missing");
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY missing");
  process.exit(1);
}

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================== EMAIL ================== */
const resend = new Resend(process.env.RESEND_API_KEY);
console.log("RESEND KEY:", process.env.RESEND_API_KEY ? "OK" : "MISSING");

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
const otpStore = {}; // { email: otp }

/* ================== AUTH ================== */

// REGISTER
app.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body;
  if (!name || !email || !password || !company) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const exists = await usersCollection.findOne({ Email: email });
  if (exists) return res.status(400).json({ message: "User exists" });

  const role = email === OWNER_EMAIL ? "SuperAdmin" : "Employee";

  await usersCollection.insertOne({
    Name: name,
    Email: email,
    Password: password,
    Company: company,
    Role: role,
    verified: false,
    createdAt: new Date(),
  });

  res.json({ message: "Registered" });
});

// LOGIN → SEND OTP
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("LOGIN:", email);

  const user = await usersCollection.findOne({ Email: email });
  if (!user || user.Password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  console.log("OTP GENERATED:", otp);

  try {
    const response = await resend.emails.send({
      from: "CRM <onboarding@resend.dev>",
      to: email,
      subject: "OTP Verification",
      html: `<h2>Your OTP is ${otp}</h2>`,
    });

    console.log("EMAIL SENT:", response.id);
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    res.status(500).json({ message: "Email failed" });
  }
});

// RESEND OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  console.log("OTP RESENT:", otp);

  await resend.emails.send({
    from: "CRM <onboarding@resend.dev>",
    to: email,
    subject: "OTP Verification",
    html: `<h2>Your OTP is ${otp}</h2>`,
  });

  res.json({ message: "OTP resent" });
});

// VERIFY OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] === otp) {
    delete otpStore[email];
    console.log("OTP VERIFIED");
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

/* ================== CUSTOMERS ================== */
app.get("/customers/:email", async (req, res) => {
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
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT}`)
  )
);
