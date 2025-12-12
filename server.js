const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { MongoClient } = require("mongodb");
const multer = require("multer");
//const axios = require("axios");
const fs = require("fs");
//const FormData = require("form-data");
const pdfParse = require("pdf-parse").default || require("pdf-parse");
const mammoth = require("mammoth");

const app = express();
const port = 5002;

app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));


const uri = "mongodb://localhost:27017/";
const client = new MongoClient(uri);
let usersCollection;

async function getCustomerCollection() {
  const db = client.db("Users");
  return db.collection("Customers");
}


const OWNER_EMAIL = "dhruvbhatiaxcyz@gmail.com";

// ------------------ CONNECT DATABASE ------------------
async function connectDB() {
  try {
    await client.connect();
    const db = client.db("Users");
    usersCollection = db.collection("user");
    console.log("✅ Connected to MongoDB");

    const customers = await getCustomerCollection();
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


async function ensureSuperAdmin() {
  if (!usersCollection) return;

  try {
    const user = await usersCollection.findOne({ Email: OWNER_EMAIL });
    if (!user) {
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
      console.log("🛠️ Created SuperAdmin account automatically.");
    } else if (user.Role !== "SuperAdmin") {
      await usersCollection.updateOne(
        { Email: OWNER_EMAIL },
        { $set: { Role: "SuperAdmin" } }
      );
      console.log("🛠️ Ensured SuperAdmin privileges for Dhruv.");
    } else {
      console.log("✅ SuperAdmin verified.");
    }
  } catch (err) {
    console.error("❌ Error ensuring SuperAdmin:", err);
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
  const customers = await getCustomerCollection();
  const cursor = customers.find({ Company: { $exists: false } });
  let updated = 0;
  for await (const doc of cursor) {
    const company = await getCompanyByEmail(doc.userEmail);
    if (company) {
      await customers.updateOne({ _id: doc._id }, { $set: { Company: company } });
      updated++;
    }
  }
  if (updated) console.log(`🏷️ Backfilled ${updated} customers with Company.`);
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

// ------------------ AUTH ------------------
app.post("/register", async (req, res) => {
  const { name, email, password, company } = req.body;
  if (!name || !email || !password || !company)
    return res.status(400).json({ message: "All fields required" });

  const existing = await usersCollection.findOne({ Email: email });
  if (existing) return res.status(400).json({ message: "User already exists" });

  let role = email === OWNER_EMAIL ? "SuperAdmin" : "Employee";

  await usersCollection.insertOne({
    Name: name,
    Email: email,
    Password: password,
    Company: company,
    Role: role,
  });

  res.json({ message: `✅ Registered successfully with role: ${role}` });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await usersCollection.findOne({ Email: email });
  if (!user) return res.status(401).json({ message: "No account found" });
  if (user.Password !== password)
    return res.status(401).json({ message: "Bad credentials" });
  res.status(200).json({ message: "OTP required", name: user.Name });
});

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
      subject: "Your OTP Code",
      text: `Hi ${user.Name}, your OTP is ${otp}`,
    });
    console.log("📧 OTP sent:", otp);
    res.json({ message: "OTP sent successfully!" });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await usersCollection.findOne({ Email: email });
  if (!user) return res.json({ success: false, message: "User not found" });

  if (otpStore[email] && otpStore[email] === otp) {
    delete otpStore[email];
    res.json({ success: true, message: "✅ OTP verified!", name: user.Name });
  } else {
    res.json({ success: false, message: "❌ Invalid OTP" });
  }
});

// ------------------ CUSTOMER ROUTES ------------------
app.post("/add-customer", async (req, res) => {
  try {
    const { userEmail, Name, Email, "Applied Position": position, Salary } = req.body;
    if (!userEmail || !Name || !Email || !position || !Salary)
      return res.status(400).json({ message: "All fields are required" });

    if (!(await checkAccess(userEmail, "add")))
      return res.status(403).json({ message: "❌ No add permission" });

    const company = await getCompanyByEmail(userEmail);
    const customers = await getCustomerCollection();
    const customer = {
      userEmail,
      Company: company,
      Name,
      Email,
      "Applied Position": position,
      Salary: Number(Salary),
      createdAt: new Date(),
    };
    await customers.insertOne(customer);
    res.json({ message: "✅ Customer added successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Error adding customer" });
  }
});

app.get("/customers/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    if (!(await checkAccess(userEmail, "view")))
      return res.status(403).json({ message: "❌ No view permission" });

    const role = await getUserRole(userEmail);
    const customers = await getCustomerCollection();
    let list;

    if (role === "SuperAdmin") {
      list = await customers.find({}).toArray(); 
    } else {
      const company = await getCompanyByEmail(userEmail);
      list = await customers.find({ Company: company }).toArray();
    }

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Error fetching customers" });
  }
});

app.put("/update-customer/:email/:userEmail", async (req, res) => {
  try {
    const { email, userEmail } = req.params;
    const { Name, "Applied Position": position, Salary } = req.body;

    if (!(await checkAccess(userEmail, "edit")))
      return res.status(403).json({ message: "❌ No edit permission" });

    const role = await getUserRole(userEmail);
    const customers = await getCustomerCollection();

    const filter =
      role === "SuperAdmin"
        ? { Email: email }
        : { Email: email, Company: await getCompanyByEmail(userEmail) };

    const result = await customers.updateOne(filter, {
      $set: { Name, "Applied Position": position, Salary: Number(Salary) },
    });

    if (!result.matchedCount)
      return res.status(404).json({ message: "Customer not found" });

    res.json({ message: "✏️ Updated successfully!" });
  } catch {
    res.status(500).json({ message: "Error updating customer" });
  }
});

app.delete("/customer/:email/:userEmail", async (req, res) => {
  try {
    const { email, userEmail } = req.params;

    if (!(await checkAccess(userEmail, "delete")))
      return res.status(403).json({ message: "❌ No delete permission" });

    const role = await getUserRole(userEmail);
    const customers = await getCustomerCollection();

    const filter =
      role === "SuperAdmin"
        ? { Email: email }
        : { Email: email, Company: await getCompanyByEmail(userEmail) };

    const result = await customers.deleteOne(filter);

    if (!result.deletedCount)
      return res.status(404).json({ message: "Customer not found" });

    res.json({ message: "🗑️ Customer deleted successfully!" });
  } catch {
    res.status(500).json({ message: "Error deleting customer" });
  }
});

// ------------------ SETTINGS ROUTES (for Settings.js) ------------------
app.get("/user/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await usersCollection.findOne({ Email: email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ message: "Error fetching user" });
  }
});

app.put("/user/:email/darkmode", async (req, res) => {
  try {
    const { email } = req.params;
    const { DarkMode } = req.body;
    await usersCollection.updateOne(
      { Email: email },
      { $set: { DarkMode: !!DarkMode } }
    );
    res.json({ message: "Dark mode updated" });
  } catch (err) {
    console.error("❌ Error updating dark mode:", err);
    res.status(500).json({ message: "Error updating dark mode" });
  }
});

// ------------------ 📄 Resume Extractor (PDF/DOCX) ------------------
const upload = multer({ dest: "uploads/" });

function clean(s = "") {
  return (s || "").replace(/\s+/g, " ").trim();
}

function guessName(lines) {
  for (const L of lines.slice(0, 8)) {
    const t = clean(L);
    if (!t) continue;
    if (/^(resume|curriculum vitae|cv)$/i.test(t)) continue;
    if (t.length > 70) continue;
    if (!/[0-9]/.test(t) && (t.match(/[A-Za-z]/g) || []).length >= 4) {
      return t.replace(/[|,;]+$/g, "").trim();
    }
  }
  return "";
}

function parseResumeText(text) {
  const raw = text || "";
  const lines = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const blob = raw.replace(/\s+/g, " ");
  const emailMatch = blob.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const email = emailMatch ? emailMatch[0] : "";
  const phoneMatch = blob.match(
    /(\+?\d{1,3}[\s-]?)?(\(?\d{3,5}\)?[\s-]?)?\d{3,4}[\s-]?\d{4}/g
  );
  let phone = phoneMatch ? clean(phoneMatch[0]) : "";
  phone = phone.replace(/[^\d+]/g, "");
  if (phone.length > 12) phone = phone.slice(-12);
  const linkedInMatch = blob.match(/https?:\/\/(www\.)?linkedin\.com\/[^\s)]+/i);
  const linkedIn = linkedInMatch ? linkedInMatch[0] : "";
  const locationMatch = blob.match(
    /\b(?:Mumbai|Pune|Delhi|Bengaluru|Bangalore|Hyderabad|Chennai|Kolkata|Gurgaon|Noida|Indore|Jaipur|Ahmedabad|Remote)\b/i
  );
  const location = locationMatch ? locationMatch[0] : "";
  let expYears = "";
  const expMatch = blob.match(/(\d+(?:\.\d+)?)\s*(?:\+?\s*)?(?:years?|yrs?)/i);
  if (expMatch) expYears = expMatch[1];
  let role = "";
  let company = "";
  const roleHit = blob.match(
    /\b(?:Software|Senior|Lead|Principal|Full\s*Stack|Frontend|Backend|Data|ML|AI|DevOps|QA|SDET|Product|Project|Android|iOS)[^,|;]{0,40}\b(?:Engineer|Developer|Manager|Architect|Scientist)\b/i
  );
  if (roleHit) role = clean(roleHit[0]);
  const lastCompanyHit = blob.match(/\b(?:at|@)\s*([A-Z][A-Za-z0-9&.\- ]{2,40})/i);
  if (lastCompanyHit) company = clean(lastCompanyHit[1]);
  const SKILLS = [
    "Java","Python","C++","C#","JavaScript","TypeScript","Node","React","Angular","Vue","Next.js","Express","Spring","Django","Flask","FastAPI",".NET","ASP.NET",
    "SQL","MySQL","PostgreSQL","MongoDB","Redis","Kafka","RabbitMQ","AWS","GCP","Azure","Docker","Kubernetes","CI/CD","Git","Jenkins","Terraform",
    "HTML","CSS","Sass","Tailwind","Bootstrap","Pandas","NumPy","TensorFlow","PyTorch","Scikit","OpenCV","LLM","NLP","Spark","Hadoop"
  ];
  const skills = Array.from(new Set(SKILLS.filter(
    (s) => new RegExp(`\\b${s.replace(/[.+]/g, "\\$&")}\\b`, "i").test(blob)
  ))).slice(0, 20);
  let name = guessName(lines);
  if (!name && email) {
    const local = email.split("@")[0].replace(/[._-]+/g, " ");
    name = local.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  return { name: clean(name), email: clean(email), phone: clean(phone), location: clean(location), linkedIn: clean(linkedIn), experienceYears: clean(expYears), currentRole: clean(role), currentCompany: clean(company), skills };
}

function toRow(fields) {
  return [
    fields.name || "",
    fields.email || "",
    fields.phone || "",
    fields.currentRole || "",
    fields.currentCompany || "",
    fields.experienceYears || "",
    fields.location || "",
    fields.skills.join(", ")
  ];
}

app.post("/resume-extract", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    const filePath = req.file.path;
    const mime = req.file.mimetype;
    let text = "";
    const buf = fs.readFileSync(filePath);
    if (mime === "application/pdf") {
      const parsed = await pdfParse(buf);
      text = parsed.text || "";
    } else if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword"
    ) {
      const isDocx = mime.includes("officedocument");
      if (isDocx) {
        const out = await mammoth.extractRawText({ buffer: buf });
        text = out.value || "";
      } else {
        text = buf.toString("utf8");
      }
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Unsupported file type." });
    }
    const fields = parseResumeText(text || "");
    const row = toRow(fields);
    fs.unlinkSync(filePath);
    return res.json({ row, fields });
  } catch (err) {
    console.error("❌ /resume-extract error:", err);
    return res.status(500).json({ message: "Failed to extract resume data." });
  }
});

// ------------------ SERVER ------------------
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));   
