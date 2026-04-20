require("dotenv").config();

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const path = require("path");
const mongoose = require("mongoose");
const { Resend } = require("resend");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const { GridFSBucket , ObjectId } = require("mongodb");
const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NODE_ENV = process.env.NODE_ENV || "production";
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


app.use(cors({   origin: [     "https://mywebsite-im3c.onrender.com"   ],   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],   allowedHeaders: ["Content-Type", "Authorization"],   credentials: true }));
app.options("*", cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));


let db, users, otps, sessions, auditLogs, bucket;

const resend = new Resend(RESEND_API_KEY);
function generate() {
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

const rateMap = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const last = rateMap.get(ip) || 0;


  if (now - last < 800) {
    return res.status(429).json({ message: "Too fast" });
  }

  rateMap.set(ip, now);
  next();
}
const employeeSchema = new mongoose.Schema({
  Name: { type: String, required: true },
  Email: { type: String, required: true },
  Salary: { type: Number, required: true },
  "Applied Position": { type: String, required: true },
  Company: { type: String, required: true },
  Role: {
    type: String,
    default: "Employee",
    enum: ["Employee", "Admin", "SuperAdmin"],
    required: true
  },
  roleExpiresAt: {
    type: Date,
    default: null
  },
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
  employeeSchema,
  "Employee"
);



async function auth(req, res, next) {
  const raw = req.headers.authorization;
  if (!raw) return res.sendStatus(401);

  const token = raw.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
  
    let employee = await EmployeesModel.findOne({ 
      Email: { $regex: new RegExp(`^${decoded.email}$`, "i") }, 
      Company: decoded.company 
    });

 
    const isAdminRole = decoded.role === "SuperAdmin" || decoded.role === "Super Admin" || decoded.role === "Admin";

    if (!employee && isAdminRole) {
        req.user = {
            id: decoded.id,
            email: decoded.email.toLowerCase(),
            role: decoded.role === "Super Admin" ? "SuperAdmin" : decoded.role,
           
            company: decoded.company 
        };
        return next();
    }

    if (!employee) return res.status(403).json({ message: "User record not found" });
    if (employee.locked) return res.status(403).json({ message: "Account is locked" });

    req.user = {
      id: decoded.id,
      email: employee.Email.toLowerCase(),
      role: employee.Role,
      company: employee.Company
    };

    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, company } = req.body;
    if (!email || !password || !company) return res.status(400).json({ message: "Missing fields" });

    // Ensure they exist in the Employee table for this specific company
    const employee = await EmployeesModel.findOne({ Email: email.toLowerCase(), Company: company });
    if (!employee) return res.status(403).json({ message: "No invitation found for this email at this company." });

    const existingUser = await users.findOne({ Email: email.toLowerCase() });
    if (existingUser) return res.status(409).json({ message: "Account already activated" });

    const hashed = await bcrypt.hash(password, 10);
    await users.insertOne({
      Name: employee.Name, Email: email.toLowerCase(), Password: hashed, Company: employee.Company,
      Role: "Employee", DarkMode: false, createdAt: new Date()
    });

    logAudit("ACCOUNT_ACTIVATED", email, { company: employee.Company });
    res.json({ success: true, message: "Account activated successfully" });
  } catch (err) { res.status(500).json({ message: "Internal server error" }); }
});
app.put("/api/employees/change-role", auth, async (req, res) => {
  if (req.user.role !== "SuperAdmin") {
    return res.status(403).json({ message: "Only SuperAdmin can change roles" });
  }

  const { employeeId, newRole, durationDays } = req.body;

  if (!employeeId || !newRole || !durationDays) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (!["Employee", "Admin", "SuperAdmin"].includes(newRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return res.status(400).json({ message: "Invalid employee ID" });
  }

  try {
    const expiresAt = durationDays > 0 
      ? new Date(Date.now() + Number(durationDays) * 24 * 60 * 60 * 1000) 
      : null;


    const employeeResult = await EmployeesModel.updateOne(
      { 
        _id: employeeId, 
        Company: req.user.company  
      },
      { 
        $set: { 
          Role: newRole,
          roleExpiresAt: expiresAt,
          updatedAt: new Date()
        } 
      }
    );

    if (employeeResult.matchedCount === 0) {
      return res.status(404).json({ 
        message: "Employee not found or does not belong to your company" 
      });
    }

 
    const employee = await EmployeesModel.findById(employeeId);


    const userUpdateResult = await users.updateOne(
      { Email: employee.Email.toLowerCase() },
      { $set: { Role: newRole } }
    );

    logAudit("ROLE_CHANGED", req.user.email, {
      employeeId,
      employeeEmail: employee.Email,
      newRole,
      durationDays,
      expiresAt
    });

    res.json({
      success: true,
      message: `Role updated to ${newRole} for ${employee.Name} (expires in ${durationDays} days)`
    });

  } catch (err) {
    console.error("CHANGE_ROLE_ERROR", err);
    res.status(500).json({ message: "Failed to change role" });
  }
});
app.post("/api/login", rateLimit, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const user = await users.findOne({ Email: email });
    if (!user) {
      const employee = await EmployeesModel.findOne({ Email: email });
      if (employee) {
        return res.status(403).json({
          success: false,
          notVerified: true,
          message: "Account not activated"
        });
      }
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    let match = false;

   
    if (user.Password && user.Password.startsWith("$2")) {
      match = await bcrypt.compare(password, user.Password);
    } 
   
    else {
      const sha256Hash = crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
      match = sha256Hash === user.Password;
    }

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Wrong password"
      });
    }

    if (user.Password && user.Password.length === 64 && !user.Password.startsWith("$2")) {
      console.log(`🔄 Auto-migrating password for ${email} to bcrypt`);
      const newHashedPassword = await bcrypt.hash(password, 10);
      
      await users.updateOne(
        { Email: email },
        { $set: { Password: newHashedPassword } }
      );
      
      console.log(`✅ Password successfully migrated to bcrypt for ${email}`);
    }

    
    const otp = generate();
    await otps.deleteMany({ Email: email });
    await otps.insertOne({
      Email: email,
      OTP: otp,
      attempts: 0,
      createdAt: new Date(),
    });

    await resend.emails.send({
      from: "CRM <noreply@dntcrm.work.gd>",
      to: email,
      subject: "Your OTP",
      html: `<h2>Your OTP is <b>${otp}</b></h2>`
    });

    return res.json({
      success: true,
      message: "OTP sent"
    });
  } catch (err) {
    console.error("LOGIN_ERROR", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
app.post("/api/verify-otp", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP required" });

    const record = await otps.findOne({ Email: email });
    if (!record) return res.status(401).json({ success: false, message: "OTP expired" });
    if (record.attempts >= 5) return res.status(403).json({ success: false, message: "Too many attempts" });

    if (record.OTP !== otp) {
      await otps.updateOne({ Email: email }, { $inc: { attempts: 1 } });
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }

    let user = await users.findOne({ Email: email });
    if (!user) return res.status(401).json({ success: false, message: "User not found" });


    let employee = await EmployeesModel.findOne({ 
      Email: { $regex: new RegExp(`^${email}$`, "i") }, 
      ...(user.Company ? { Company: user.Company } : {})
    });


    if (!employee && user.Role === "SuperAdmin") {
        employee = { Role: "SuperAdmin", Company: user.Company || "Apple" }; 
    } else if (!employee) {
        return res.status(403).json({ success: false, message: "No active employee record." });
    }

    const finalRole = employee.Role || user.Role;

 
    if (employee._id && employee.Role && employee.Role !== user.Role) {
      await users.updateOne({ Email: email }, { $set: { Role: employee.Role } });
      user.Role = employee.Role;
    }

    const token = jwt.sign(
      { id: user._id, email: user.Email, role: finalRole, company: user.Company || employee.Company }, 
      JWT_SECRET, { expiresIn: "1h" }
    );

    await sessions.insertOne({ email, token: hashToken(token), createdAt: new Date() });
    await otps.deleteMany({ Email: email });

    return res.json({ success: true, token, role: finalRole });
  } catch (err) { 
    console.error("VERIFY_OTP_ERROR:", err);
    res.status(500).json({ message: "Internal server error" }); 
  }
});
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


async function sendAppointmentEmail({
  to,
  name,
  position,
  salary,
  company,
}) {

try {

const result = await resend.emails.send({
  from: "HR <noreply@dntcrm.work.gd>",
  to: to,
  subject: "Appointment Letter",
  html: `
    <h2>Congratulations ${name}</h2>
    <p>You have been appointed as <b>${position}</b> at <b>${company}</b>.</p>
    <p>Your salary will be <b>${salary}</b>.</p>
    <p>Welcome to the team!</p>
  `,
});

console.log("EMAIL SENT:", result);

} catch (err) {

console.error("EMAIL FAILED:", err);

}

}
async function sendTerminationEmail({
  to,
  name,
  position,
  company,
}) {

try {

const result = await resend.emails.send({
  from: "HR <noreply@dntcrm.work.gd>",
  to: to,
  subject: "Termination Notice",
  html: `
    <h2>Dear ${name}</h2>
    <p>Your role as <b>${position}</b> at <b>${company}</b> has been terminated.</p>
    <p>We appreciate your time with the organization.</p>
  `,
});

console.log("TERMINATION EMAIL SENT:", result);

} catch (err) {

console.error("TERMINATION EMAIL FAILED:", err);

}

}


app.post("/api/employees", auth, async (req, res) => {
  if (req.user.role === "Employee")
    return res.status(403).json({ message: "Forbidden" });

  const { error, value } = addEmployeeSchema.validate(req.body);
  if (error)
    return res.status(400).json({ message: error.details[0].message });

  try {
    const employee = await EmployeesModel.create({
      ...value,
      Company: req.user.company,
      Role: "Employee",
      roleExpiresAt: null,
      locked: false,
      createdAt: new Date(),
      updatedAt: new Date()
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
      return res.status(409).json({ message: "Employee already exists" });

    console.error("ADD_EMPLOYEE_ERROR", err);
    return res.status(500).json({ message: "Something went wrong" });
  }
});


app.get("/api/Employees", auth, async (req, res) => {

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


app.put("/api/update-employee", auth, async (req, res) => {

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


app.delete("/api/Employees/:id", auth, async (req, res) => {

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

  if (employee.locked)
    return res.status(403).json({
      message: "Locked employees cannot be deleted",
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

  logAudit("DELETE_EMPLOYEE", req.user.email, {
    EmployeeId: id,
  });

  return res.json({ success: true });

});


const messageSchema = new mongoose.Schema({
  SenderEmail: { type: String, required: true },
  SenderName: { type: String, required: true },
  Content: { type: String, required: true },
  Company: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model("Message", messageSchema);


app.get("/api/messages", auth, async (req, res) => {
  try {
    const messages = await Message.find({ Company: req.user.company })
      .sort({ createdAt: -1 })
      .limit(50); 
    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ message: "Error fetching messages" });
  }
});


app.post("/api/messages", auth, async (req, res) => {
  try {
    const { Content } = req.body;
    if (!Content || Content.trim() === "") return res.status(400).send();

   
    const newMessage = await Message.create({
      SenderEmail: req.user.email,
      SenderName: req.user.email.split('@')[0], 
      Content: Content.trim(),
      Company: req.user.company
    });

    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ message: "Message failed" });
  }
});

app.put("/api/Employees/lock/:id", auth, async (req, res) => {

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


app.post("/api/forgot-password", rateLimit, async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

  
    const user = await users.findOne({ Email: email });
    if (!user) {
      
      return res.json({ success: true, message: "If your email is registered, you will receive an OTP." });
    }


    const otp = generate();
    await otps.deleteMany({ Email: email });
    await otps.insertOne({
      Email: email,
      OTP: otp,
      attempts: 0,
      createdAt: new Date(),
    });

   
    await resend.emails.send({
      from: "CRM Support <noreply@dntcrm.work.gd>",
      to: email,
      subject: "Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP to reset your password is <b>${otp}</b></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `
    });

   
    logAudit("FORGOT_PASSWORD_REQUESTED", email, { company: user.Company });

    return res.json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    console.error("FORGOT_PASSWORD_ERROR", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();
    const newPassword = String(req.body.newPassword || "").trim();

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

   
    const record = await otps.findOne({ Email: email });
    if (!record) return res.status(401).json({ success: false, message: "OTP expired or invalid" });
    if (record.attempts >= 5) return res.status(403).json({ success: false, message: "Too many attempts" });

    if (record.OTP !== otp) {
      await otps.updateOne({ Email: email }, { $inc: { attempts: 1 } });
      return res.status(401).json({ success: false, message: "Invalid OTP" });
    }


    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await users.updateOne(
      { Email: email },
      { $set: { Password: hashed } }
    );

    if (result.matchedCount === 0) {
       return res.status(404).json({ success: false, message: "User not found" });
    }


    await otps.deleteMany({ Email: email });
    logAudit("PASSWORD_RESET_SUCCESS", email);

    return res.json({ success: true, message: "Password updated successfully. You can now log in." });
  } catch (err) {
    console.error("RESET_PASSWORD_ERROR", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.post("/api/resume/extract", auth, upload.array("resumes", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ success: false, message: "No files uploaded" });

    const results = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      try {
        const buffer = fs.readFileSync(file.path);
        let text = "";

   
        if (file.mimetype === "application/pdf") {
          const parsed = await pdfParse(buffer);
          text = parsed.text || "";
        } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const out = await mammoth.extractRawText({ buffer });
          text = out.value || "";
        } else {
          results.push({ filename: file.originalname, success: false, error: "Unsupported file type" });
          continue;
        }

        if (!text.trim()) {
          results.push({ filename: file.originalname, success: false, error: "Empty file content" });
          continue;
        }

 
        const parsedData = {
          name: "N/A",
          email: "N/A",
          phone: "N/A",
          linkedIn: "N/A",
          skills: "N/A",
          experience: "N/A",
          education: "N/A"
        };


        const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
        if (emailMatch) parsedData.email = emailMatch[1];

      
        const phoneMatch = text.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
        if (phoneMatch) parsedData.phone = phoneMatch[0];

  
        const linkedInMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
        if (linkedInMatch) parsedData.linkedIn = linkedInMatch[0];

 
        
        const staticBlacklist = [
            "resume", "cv", "curriculum vitae", "profile", "page", 
            "contact", "email", "phone", "personal details"
        ];


        const nameParts = file.originalname.split('.');
        const rawFilename = (nameParts.length > 1 ? nameParts.slice(0, -1).join('.') : file.originalname).toLowerCase();
        const fullBlacklist = [...staticBlacklist, rawFilename];


        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const cleanLines = lines.filter(line => {
            const lowerLine = line.toLowerCase();
            
      
            const isBlacklisted = fullBlacklist.some(badWord => lowerLine.includes(badWord));
            if (isBlacklisted) return false;

        
            if (line.includes("[") || line.includes("]") || lowerLine.includes(".pdf") || lowerLine.includes(".docx")) return false;
            
            return true;
        });

        if (cleanLines.length > 0) {
            const firstLineWords = cleanLines[0].split(/\s+/);
            if (firstLineWords.length > 0 && firstLineWords.length <= 4) {
              
                const cleanedName = cleanLines[0].replace(/[^a-zA-Z\s.-]/g, "");
                parsedData.name = cleanedName.trim() || "N/A";
            }
        }


        const sectionKeywords = {
            skills: ["SKILLS", "CORE COMPETENCIES", "TECHNOLOGIES", "TECHNICAL SKILLS"],
            experience: ["EXPERIENCE", "WORK HISTORY", "EMPLOYMENT", "PROFESSIONAL EXPERIENCE"],
            education: ["EDUCATION", "ACADEMIC BACKGROUND", "QUALIFICATIONS"]
        };

        function findSectionIndices(keywords) {
            let bestIndex = -1;
            for (const kw of keywords) {
                const regex = new RegExp(`(?:^|\\n)\\s*${kw}\\s*(?:\\n|:|\\r)`, 'i');
                const match = regex.exec(text); 
                if (match) {
                    bestIndex = match.index;
                    break;
                }
            }
            return bestIndex;
        }

        const indices = {
            skills: findSectionIndices(sectionKeywords.skills),
            experience: findSectionIndices(sectionKeywords.experience),
            education: findSectionIndices(sectionKeywords.education)
        };

        function extractSection(startIndex, currentKey) {
            if (startIndex === -1) return "N/A";

            let nextIndex = text.length;
            for (const [key, idx] of Object.entries(indices)) {
                if (key !== currentKey && idx > startIndex && idx < nextIndex) {
                    nextIndex = idx;
                }
            }
            
            const rawSection = text.substring(startIndex, nextIndex).trim();
            const sectionLines = rawSection.split('\n');
            if (sectionLines.length > 1) {
                return sectionLines.slice(1).join('\n').trim(); 
            }
            return rawSection;
        }

        parsedData.skills = extractSection(indices.skills, 'skills');
        parsedData.experience = extractSection(indices.experience, 'experience');
        parsedData.education = extractSection(indices.education, 'education');


        results.push({
          filename: file.originalname,
          success: true,
          data: parsedData
        });

      } catch (fileErr) {
        console.error(`Error processing ${file.originalname}:`, fileErr.message);
        results.push({ filename: file.originalname, success: false, error: "Parsing Failed" });
      } finally {
        // CLEANUP: Always delete the temp file
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    return res.json({ success: true, resumes: results });

  } catch (err) {
    console.error("CRITICAL_SERVER_ERROR:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});
app.get("/api/reports", auth, async (req, res) => {

  try {

    const employees = await EmployeesModel.find({
      Company: req.user.company
    }).lean();

    if (!employees || employees.length === 0)
      return res.json({
        success: true,
        total: 0,
        avgSalary: 0,
        maxSalary: 0,
        minSalary: 0,
        roles: []
      });

    const salaries = employees.map(e => e.Salary || 0);

    const roles = {};

    employees.forEach(emp => {

      const role = emp["Applied Position"] || "Unknown";

      roles[role] = (roles[role] || 0) + 1;

    });

    const total = employees.length;

    const avgSalary =
      Math.round(
        salaries.reduce((a, b) => a + b, 0) / total
      );

    const maxSalary = Math.max(...salaries);

    const minSalary = Math.min(...salaries);

    const roleData = Object.keys(roles).map(r => ({
      name: r,
      value: roles[r]
    }));

    return res.json({
      success: true,
      total,
      avgSalary,
      maxSalary,
      minSalary,
      roles: roleData
    });

  }

  catch (err) {

    console.error("REPORTS_ERROR", err);

    return res.status(500).json({
      message: "Failed to generate reports"
    });

  }

});


app.put("/api/me/darkmode", auth, async (req, res) => {

  try {

    const { DarkMode } = req.body;

    if (typeof DarkMode !== "boolean")
      return res.status(400).json({
        message: "Invalid value"
      });

    const result = await users.updateOne(
      { Email: req.user.email },
      { $set: { DarkMode } }
    );

    if (!result.matchedCount)
      return res.status(404).json({
        message: "User not found"
      });

    logAudit("DARKMODE_UPDATED", req.user.email, { DarkMode });

    return res.json({
      success: true,
      DarkMode
    });

  }

  catch (err) {

    console.error("DARKMODE_UPDATE_ERROR", err);

    return res.status(500).json({
      message: "Failed to update dark mode"
    });

  }

});


app.get("/api/validate-session", auth, async (req, res) => {

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



const UserSchema = new mongoose.Schema({

  Name: String,
  Email: String,
  Password: String,
  Role: String,
  Company: String,

  DarkMode: { type: Boolean, default: false },
  EmailNotifications: { type: Boolean, default: true },
  PublicProfile: { type: Boolean, default: false },
  AutoLogout: { type: Boolean, default: false },

  Language: { type: String, default: "English" },
  Timezone: { type: String, default: "UTC" }

});

const User = mongoose.model("User", UserSchema, "user");




app.get("/api/me", auth, async (req, res) => {

  try {

    const user = await User.findOne({ _id: req.user.id }).select("-Password");

    if (!user)
      return res.status(404).json({ error: "User not found" });

    res.json(user);

  } catch {

    res.status(500).json({ error: "Failed to load user" });

  }

});




app.put("/api/me/settings", auth, async (req, res) => {

  try {

    const update = {
      DarkMode: req.body.DarkMode,
      EmailNotifications: req.body.EmailNotifications,
      PublicProfile: req.body.PublicProfile,
      AutoLogout: req.body.AutoLogout,
      Name: req.body.Name,
      Language: req.body.Language,
      Timezone: req.body.Timezone
    };

    const user = await User.findOneAndUpdate(
      { _id: req.user.id },
      update,
      { new: true }
    ).select("-Password");

    if (!user)
      return res.status(404).json({ error: "User not found" });

    res.json(user);

  } catch (err) {

    console.error("SETTINGS_UPDATE_ERROR", err);
    res.status(500).json({ error: "Failed to update settings" });

  }

});



app.put("/api/me/password", auth, async (req, res) => {
  const { password } = req.body;
  if (!password)
    return res.status(400).json({ error: "Password required" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    

    const result = await users.updateOne(
      { Email: req.user.email },
      { $set: { Password: hashed } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("PASSWORD_UPDATE_ERROR", err);
    res.status(500).json({ error: "Failed to update password" });
  }
});



app.delete("/api/me", auth, async (req, res) => {

  try {

    await User.findByIdAndDelete(req.user.id);

    res.json({ message: "Account deleted" });

  } catch {

    res.status(500).json({ error: "Failed to delete account" });

  }

});


const taskSchema = new mongoose.Schema({
  Title: { type: String, required: true },
  Description: { type: String, default: "" },
  EmployeeEmail: { type: String, required: true },
  Company: { type: String, required: true },

  FileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  UploadedBy: { type: String, default: null },

  Status: {
    type: String,
    default: "Pending"
  },

  Deadline: {
    type: Date,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Task = mongoose.model("Task", taskSchema);
const leaveSchema = new mongoose.Schema({
  Date: { type: String, required: true },
  Reason: { type: String, required: true },
  EmployeeEmail: String,
  Company: String,
  Status: { 
    type: String, 
    default: "Submitted" 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Leave = mongoose.model("Leave", leaveSchema);


const taskDir = path.join(__dirname, "taskUploads");

if (!fs.existsSync(taskDir)) {
  fs.mkdirSync(taskDir, { recursive: true });
}

const taskUpload = multer({
  storage: multer.memoryStorage()
});



app.post("/api/tasks", auth, async (req, res) => {

  try {

  if (req.user.role !== "Admin" && req.user.role !== "SuperAdmin") {
  return res.status(403).json({ message: "Only admins can create tasks" });
}

    const { Title, Description, EmployeeEmail } = req.body;

    if (!Title || !EmployeeEmail)
      return res.status(400).json({ message: "Missing fields" });

    const task = await Task.create({

      Title,

      Description,

      EmployeeEmail,

      Company: req.user.company,

      Status: "Pending"

    });

    return res.json({
      success: true,
      task
    });

  }

  catch (err) {

    console.error("CREATE_TASK_ERROR", err);

    return res.status(500).json({
      message: "Failed to create task"
    });

  }

});

const attendanceSchema = new mongoose.Schema({
  EmployeeEmail: { type: String, required: true },
  Company: { type: String, required: true },
  Date: { type: String, required: true },
  Status: { type: String, default: "Present" },
  createdAt: { type: Date, default: Date.now }
});

attendanceSchema.index({ EmployeeEmail: 1, Date: 1 }, { unique: true });
const Attendance = mongoose.model("Attendance", attendanceSchema, "attendance");

const payrollSchema = new mongoose.Schema({
  EmployeeEmail: { type: String, required: true },
  Company: { type: String, required: true },
  Amount: { type: Number, required: true },
  Method: { type: String, required: true }, 
  PaidBy: { type: String, required: true }, 
  Date: { type: Date, default: Date.now }
});
const Payroll = mongoose.model("Payroll", payrollSchema, "payroll");




app.post("/api/attendance/mark", auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]; 

    const existing = await Attendance.findOne({ 
      EmployeeEmail: req.user.email, 
      Date: today 
    });

    if (existing) {
      return res.status(400).json({ message: "Attendance already marked for today." });
    }

    const attendance = await Attendance.create({
      EmployeeEmail: req.user.email,
      Company: req.user.company,
      Date: today,
      Status: "Present"
    });

    res.json({ success: true, attendance });
  } catch (err) {
    console.error("ATTENDANCE_MARK_ERROR", err);
    res.status(500).json({ message: "Failed to mark attendance." });
  }
});


app.get("/api/attendance", auth, async (req, res) => {
  try {
    let filter = { Company: req.user.company };
    if (req.user.role === "Employee") {
      filter.EmployeeEmail = req.user.email;
    } else if (req.query.email) {
      filter.EmployeeEmail = req.query.email; 
    }

    const records = await Attendance.find(filter).sort({ Date: -1 }).lean();
    res.json(records);
  } catch (err) {
    console.error("ATTENDANCE_GET_ERROR", err);
    res.status(500).json({ message: "Failed to fetch attendance." });
  }
});



app.post("/api/payroll/pay", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin" && req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Only admins can process payroll." });
    }

    const { targetEmail, amount, method } = req.body;
    if (!targetEmail || !amount || !method) {
      return res.status(400).json({ message: "Missing required fields." });
    }

  
    const employee = await EmployeesModel.findOne({ Email: targetEmail, Company: req.user.company });
    if (!employee) return res.status(404).json({ message: "Employee not found." });

    const payment = await Payroll.create({
      EmployeeEmail: targetEmail,
      Company: req.user.company,
      Amount: amount,
      Method: method,
      PaidBy: req.user.email
    });

    logAudit("PAYROLL_PROCESSED", req.user.email, { targetEmail, amount, method });
    res.json({ success: true, payment });
  } catch (err) {
    console.error("PAYROLL_ERROR", err);
    res.status(500).json({ message: "Failed to process payroll." });
  }
});


app.get("/api/payroll", auth, async (req, res) => {
  try {
    let filter = { Company: req.user.company };
    if (req.user.role === "Employee") {
      filter.EmployeeEmail = req.user.email;
    } else if (req.query.email) {
      filter.EmployeeEmail = req.query.email;
    }

    const records = await Payroll.find(filter).sort({ Date: -1 }).lean();
    res.json(records);
  } catch (err) {
    console.error("PAYROLL_GET_ERROR", err);
    res.status(500).json({ message: "Failed to fetch payroll history." });
  }
});


app.post("/api/leaves", auth, async (req,res)=>{
try{

const { Date, Reason } = req.body;

if(!Date || !Reason)
return res.status(400).json({message:"Missing fields"});

const leave = await Leave.create({
Date,
Reason,
EmployeeEmail: req.user.email,
Company: req.user.company
});

res.json({success:true, leave});

}catch(err){
console.error("LEAVE_CREATE_ERROR",err);
res.status(500).json({message:"Failed to apply leave"});
}
});



app.get("/api/leaves", auth, async (req, res) => {
  try {
    let filter = { Company: req.user.company };


    if (req.user.role === "Employee") {
      filter.EmployeeEmail = req.user.email;
    }

    const leaves = await Leave.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "Employee",
          localField: "EmployeeEmail",
          foreignField: "Email",
          as: "employeeData"
        }
      },
      {
       
        $addFields: {
          employeeName: { $arrayElemAt: ["$employeeData.Name", 0] }
        }
      },
      {

        $project: {
          employeeData: 0 
        }
      }
    ]);

    res.json(leaves);

  } catch (err) {
    console.error("GET_LEAVES_ERROR", err);
    res.status(500).json({ message: "Failed to fetch leaves" });
  }
});

app.put("/api/leaves/status/:id", auth, async (req, res) => {
  try {
    const { status } = req.body; 
    
  
    if (req.user.role !== "Admin" && req.user.role !== "SuperAdmin") {
      return res.status(403).json({ message: "Access Denied" });
    }

    const updatedLeave = await Leave.findOneAndUpdate(
      { _id: req.params.id, Company: req.user.company },
      { $set: { Status: status } },
      { new: true }
    );

    if (!updatedLeave) return res.status(404).json({ message: "Leave not found" });

    res.json({ success: true, leave: updatedLeave });
  } catch (err) {
    console.error("LEAVE_STATUS_ERROR", err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/api/tasks", auth, async (req, res) => {

  try {

    let filter = { Company: req.user.company };

    if (req.user.role === "Employee")
      filter.EmployeeEmail = req.user.email;

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.json(tasks);

  }

  catch (err) {

    console.error("GET_TASKS_ERROR", err);

    return res.status(500).json({
      message: "Failed to fetch tasks"
    });

  }

});


app.put("/api/tasks/status/:id", auth, async (req,res)=>{

try{

const { Status } = req.body;

const task = await Task.findById(req.params.id);

if (!task)
return res.status(404).json({ message: "Task not found" });
  


if (req.user.role === "Employee" && task.EmployeeEmail !== req.user.email)
  return res.status(403).json({ message: "Not your task" });

task.Status = Status;

await task.save();

res.json({success:true});

}catch(err){

console.error("TASK_STATUS_UPDATE_ERROR",err);

res.status(500).json({message:"Failed to update task"});

}

});

app.post("/api/tasks/upload/:id", auth, taskUpload.single("file"), async (req,res)=>{

try{

console.log("UPLOAD START");
console.log("Task ID:", req.params.id);
console.log("File:", req.file);
console.log("Bucket:", bucket);

const task = await Task.findById(req.params.id);

if(!task)
return res.status(404).json({message:"Task not found"});

if(req.user.role==="Employee" && task.EmployeeEmail!==req.user.email)
return res.status(403).json({message:"Not your task"});

if(!req.file)
return res.status(400).json({message:"No file uploaded"});

if(!bucket){
console.log("❌ Bucket not ready");
return res.status(500).json({message:"Storage not ready"});
}

const uploadStream = bucket.openUploadStream(req.file.originalname);

uploadStream.write(req.file.buffer);
uploadStream.end();

uploadStream.on("finish", async ()=>{

task.FileId = uploadStream.id;
task.UploadedBy = req.user.email;


await task.save();

res.json({success:true});

});

uploadStream.on("error",(err)=>{
console.error("GRIDFS ERROR:",err);
res.status(500).json({message:"Upload failed"});
});

}catch(err){

console.error("UPLOAD_ERROR",err);
res.status(500).json({message:"Upload failed"});

}

});

app.get("/api/tasks/file/:id", async (req,res)=>{
try{

let token = req.headers.authorization?.split(" ")[1];

if(!token && req.query.token)
token = req.query.token;

if(!token)
return res.status(401).send("Unauthorized");

const user = jwt.verify(token,JWT_SECRET);

const task = await Task.findById(req.params.id);

if(!task)
return res.status(404).send("Task not found");

if(!task.FileId)
return res.status(404).send("No file uploaded");

if(task.Company !== user.company)
return res.status(403).send("Forbidden");

if(user.role==="Employee" && task.EmployeeEmail!==user.email)
return res.status(403).send("Not your task");

const fileDoc = await mongoose.connection.db
.collection("taskFiles.files")
.findOne({_id:task.FileId});

const filename = fileDoc?.filename || "taskfile";

if(req.query.download==="true"){
res.setHeader(
"Content-Disposition",
`attachment; filename="${filename}"`
);
}

bucket.openDownloadStream(task.FileId).pipe(res);

}catch(err){
console.error("FILE_STREAM_ERROR",err);
res.status(500).send("File error");
}
});



app.use((err, req, res, next) => {

  console.error("UNHANDLED_ERROR", err);

  res.status(500).json({
    success: false,
    message: "Unexpected error occurred",
  });

});

app.get("/api/health", (req, res) => {

  res.json({
    status: "ok",
    uptime: process.uptime(),
    env: NODE_ENV,
    time: new Date(),
  });

});


const frontendPath = path.join(__dirname, "build");

app.use(express.static(frontendPath));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});


setInterval(async () => {
  try {
    const now = new Date();

  
    const expiredEmployees = await EmployeesModel.find({
      roleExpiresAt: { $lte: now },
      Role: { $ne: "Employee" }
    });

    if (expiredEmployees.length > 0) {
      const emailsToUpdate = expiredEmployees.map(emp => emp.Email.toLowerCase());

 
      const result = await EmployeesModel.updateMany(
        {
          roleExpiresAt: { $lte: now },
          Role: { $ne: "Employee" }
        },
        {
          $set: {
            Role: "Employee",
            roleExpiresAt: null,
            updatedAt: now
          }
        }
      );

   
      if (emailsToUpdate.length > 0) {
        await users.updateMany(
          { Email: { $in: emailsToUpdate } },
          {
            $set: {
              Role: "Employee"
            }
          }
        );
      }

      console.log(`✅ Auto-expired ${result.modifiedCount} temporary role(s) and synced to users collection`);
    }
  } catch (err) {
    console.error("AUTO_ROLE_EXPIRATION_ERROR:", err);
  }
}, 15 * 60 * 1000); 
async function startServer() {

  await mongoose.connect(MONGO_URI);

  db = mongoose.connection.db;

  users = db.collection("user");
  otps = db.collection("OTPs");
  sessions = db.collection("Sessions");
  auditLogs = db.collection("AuditLogs");

  bucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "taskFiles"
  });

  console.log("✅ DB + GridFS ready");

  app.listen(PORT, () => {
    console.log(`🔥 Server running on PORT ${PORT}`);
  });

}

startServer();
