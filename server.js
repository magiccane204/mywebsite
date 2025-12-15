const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const app = express();

/* ================== CONFIG ================== */
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const OWNER_EMAIL = "dhruvbhatiaxcyz@gmail.com";

if (!MONGO_URI) {
  console.error("❌ MONGODB_URI is missing");
  process.exit(1);
}

/* ================== MIDDLEWARE ================== */
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true }));

/* ================== DATABASE ================== */
const client = new MongoClient(MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
});

let usersCollection;
let customersCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("Users");

    usersCollection = db.collection("user");
    customersCollection = db.collection("Customers");

    await usersCollection.createIndex({ Email: 1 }, { unique: true });
    await customersCollection.createIndex({ Company: 1 });
    await customersCollection.createIndex({ Email: 1 });

    await ensureSuperAdmin();
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

/* ================== SUPER ADMIN ================== */
async function ensureSuperAdmin() {
  const existing = await usersCollection.findOne({ Email: OWNER_EMAIL });

  if (!existing) {
    await usersCollection.insertOne({
      Name: "Dhruv Bhatia",
      Email: OWNER_EMAIL,
      Password: "Password",
      Company: "Apple",
      Role: "SuperAdmin",
      verified: true,
      createdAt: new Date(),
    });
  } else {
    await usersCollection.updateOne(
      { Email: OWNER_EMAIL },
      { $set: { Role: "SuperAdmin" } }
    );
  }
}

/* ================== MAIL ================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* ================== OTP STORE ================== */
const otpStore = {};

/* ================== AUTH ================== */

// REGISTER
app.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body;

  if (!name || !email || !password || !company) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const exists = await usersCollection.findOne({ Email: email });
  if (exists) {
    return res.status(400).json({ message: "User exists" });
  }

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

  const user = await usersCollection.findOne({ Email: email });
  if (!user || user.Password !== password) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });
  } catch (err) {
    console.error("Email failed. OTP is:", otp);
  }

  res.json({ message: "OTP sent" });
});

// RESEND OTP
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const user = await usersCollection.findOne({ Email: email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });
  } catch (err) {
    console.error("Email failed. OTP is:", otp);
  }

  res.json({ message: "OTP resent" });
});

// VERIFY OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] === otp) {
    delete otpStore[email];
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

/* ================== HELPERS ================== */
async function getUserRole(email) {
  const user = await usersCollection.findOne(
    { Email: email },
    { projection: { Role: 1 } }
  );
  return user?.Role || "Employee";
}

async function getCompany(email) {
  const user = await usersCollection.findOne(
    { Email: email },
    { projection: { Company: 1 } }
  );
  return user?.Company || null;
}

async function checkAccess(email, action) {
  const role = await getUserRole(email);
  const permissions = {
    SuperAdmin: ["view", "add", "edit", "delete", "admin"],
    Admin: ["view", "add", "edit", "delete"],
    Manager: ["view", "add", "edit"],
    Employee: ["view"],
  };
  return permissions[role]?.includes(action);
}

/* ================== CUSTOMERS ================== */
app.get("/customers/:email", async (req, res) => {
  const company = await getCompany(req.params.email);
  const customers = await customersCollection
    .find({ Company: company })
    .toArray();
  res.json(customers);
});

app.post("/add-customer", async (req, res) => {
  const { userEmail, Name, Email, Salary } = req.body;

  if (!(await checkAccess(userEmail, "add"))) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const company = await getCompany(userEmail);

  await customersCollection.insertOne({
    userEmail,
    Company: company,
    Name,
    Email,
    Salary: Number(Salary),
    createdAt: new Date(),
  });

  res.json({ message: "Customer added" });
});

/* ================== FILE UPLOAD ================== */
const upload = multer({ dest: "uploads/" });

app.post("/resume-extract", upload.single("resume"), async (req, res) => {
  try {
    const buffer = fs.readFileSync(req.file.path);
    let text = "";

    if (req.file.mimetype === "application/pdf") {
      text = (await pdfParse(buffer)).text;
    } else {
      text = (await mammoth.extractRawText({ buffer })).value;
    }

    fs.unlinkSync(req.file.path);
    res.json({ text });
  } catch {
    res.status(500).json({ message: "Resume parse failed" });
  }
});

/* ================== FRONTEND ================== */
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

/* ================== START ================== */
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
