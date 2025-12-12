const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { MongoClient } = require("mongodb");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse").default || require("pdf-parse");
const mammoth = require("mammoth");

const app = express();

// ------------------- RENDER FIX -------------------
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/";
const client = new MongoClient(MONGO_URI);
// ---------------------------------------------------

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

let usersCollection;

// ------------------ CONNECT DATABASE ------------------
async function connectDB() {
  try {
    await client.connect();
    const db = client.db("Users");
    usersCollection = db.collection("user");
    console.log("✅ Connected to MongoDB");

    const customers = db.collection("Customers");
    await customers.createIndex({ Company: 1 });
    await customers.createIndex({ Email: 1, Company: 1 });
    await usersCollection.createIndex({ Email: 1 }, { unique: true });

    await backfillCustomerCompanies();
    await ensureSuperAdmin();
  } catch (e) {
    console.error("❌ Mongo connection error:", e);
  }
}
connectDB();

function getCustomerCollection() {
  return client.db("Users").collection("Customers");
}

// ------------------ SUPER ADMIN ------------------
const OWNER_EMAIL = "dhruvbhatiaxcyz@gmail.com";

async function ensureSuperAdmin() {
  try {
    const existing = await usersCollection.findOne({ Email: OWNER_EMAIL });

    if (!existing) {
      await usersCollection.insertOne({
        Name: "Dhruv Bhatia",
        Email: OWNER_EMAIL,
        Password: "Password",
        Company: "Apple",
        Role: "SuperAdmin",
        verified: true,
        DarkMode: false,
        createdAt: new Date(),
      });
      console.log("🛠️ Created SuperAdmin");
    } else {
      await usersCollection.updateOne(
        { Email: OWNER_EMAIL },
        { $set: { Role: "SuperAdmin" } }
      );
      console.log("🛠️ Verified SuperAdmin privileges");
    }
  } catch (err) {
    console.log("Error SuperAdmin:", err);
  }
}

// ------------------ HELPERS ------------------
async function getCompanyByEmail(email) {
  const user = await usersCollection.findOne(
    { Email: email },
    { projection: { Company: 1 } }
  );
  return user?.Company || null;
}

async function getUserRole(email) {
  const user = await usersCollection.findOne(
    { Email: email },
    { projection: { Role: 1 } }
  );
  return user?.Role || "Employee";
}

async function checkAccess(userEmail, action) {
  const role = await getUserRole(userEmail);
  const permissions = {
    SuperAdmin: ["view", "add", "edit", "delete", "admin"],
    Admin: ["view", "add", "edit", "delete"],
    Manager: ["view", "add", "edit"],
    Employee: ["view"],
  };
  return permissions[role]?.includes(action);
}

async function backfillCustomerCompanies() {
  const customers = getCustomerCollection();
  const cursor = customers.find({ Company: { $exists: false } });

  for await (const doc of cursor) {
    const company = await getCompanyByEmail(doc.userEmail);
    if (company) {
      await customers.updateOne({ _id: doc._id }, { $set: { Company: company } });
    }
  }
}

// ------------------ MAILER ------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dhruvbhatiaxcyz565@gmail.com",
    pass: "jtha uwny zimp yano",
  },
});

let otpStore = {};

// ------------------ AUTH ROUTES ------------------
app.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body;
  if (!name || !email || !password || !company)
    return res.status(400).json({ message: "All fields required" });

  const existing = await usersCollection.findOne({ Email: email });
  if (existing) return res.status(400).json({ message: "User exists" });

  const role = email === OWNER_EMAIL ? "SuperAdmin" : "Employee";

  await usersCollection.insertOne({
    Name: name,
    Email: email,
    Password: password,
    Company: company,
    Role: role,
  });

  res.json({ message: `Registered with role ${role}` });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await usersCollection.findOne({ Email: email });
  if (!user) return res.status(401).json({ message: "No account" });

  if (user.Password !== password)
    return res.status(401).json({ message: "Bad password" });

  res.json({ message: "OTP required", name: user.Name });
});

// ------------------ OTP ROUTES ------------------
app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  const user = await usersCollection.findOne({ Email: email });
  if (!user) return res.status(401).json({ message: "Invalid email" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  try {
    await transporter.sendMail({
      from: "dhruvbhatiaxcyz565@gmail.com",
      to: email,
      subject: "Your OTP",
      text: `Hi ${user.Name}, your OTP is ${otp}`,
    });

    console.log("OTP:", otp);
    res.json({ message: "OTP sent" });
  } catch {
    res.status(500).json({ message: "Email failed" });
  }
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] === otp) {
    delete otpStore[email];
    return res.json({ success: true });
  }

  res.json({ success: false, message: "Invalid OTP" });
});

// ------------------ CUSTOMER ROUTES ------------------
app.post("/add-customer", async (req, res) => {
  try {
    const { userEmail, Name, Email, "Applied Position": pos, Salary } = req.body;

    if (!(await checkAccess(userEmail, "add")))
      return res.status(403).json({ message: "No permission" });

    const customers = getCustomerCollection();
    const company = await getCompanyByEmail(userEmail);

    await customers.insertOne({
      userEmail,
      Company: company,
      Name,
      Email,
      "Applied Position": pos,
      Salary: Number(Salary),
      createdAt: new Date(),
    });

    res.json({ message: "Customer added" });
  } catch {
    res.status(500).json({ message: "Error adding" });
  }
});

// ------------------ FILE UPLOAD ------------------
const upload = multer({ dest: "uploads/" });

app.post("/resume-extract", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const buf = fs.readFileSync(req.file.path);
    let text = "";

    if (req.file.mimetype === "application/pdf") {
      text = (await pdfParse(buf)).text;
    } else {
      const out = await mammoth.extractRawText({ buffer: buf });
      text = out.value || "";
    }

    fs.unlinkSync(req.file.path);
    res.json({ text });
  } catch (err) {
    console.error("Resume error:", err);
    res.status(500).json({ message: "Parsing failed" });
  }
});

// ------------------ SERVE REACT BUILD ------------------
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
