

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

/* ===============================
   MIDDLEWARE
================================ */
app.use(cors());
app.use(express.json()); // ✅ body-parser NOT needed

/* ===============================
   MongoDB Connection
================================ */
const MONGO_URL = process.env.MONGODB_URI; // ✅ FIXED
const DB_NAME = "crm";

if (!MONGO_URL) {
  console.error("❌ MONGODB_URI is missing");
  process.exit(1);
}

let db, customersCollection;

MongoClient.connect(MONGO_URL)
  .then((client) => {
    db = client.db(DB_NAME);
    customersCollection = db.collection("customers");
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  });

/* ===============================
   Mock Auth / Role Endpoint
================================ */
app.get("/me", (req, res) => {
  res.json({ Role: "Admin" }); // Employee | Manager | Admin | SuperAdmin
});

/* ===============================
   Get All Customers
================================ */
app.get("/customers", async (req, res) => {
  try {
    const customers = await customersCollection.find({}).toArray();
    res.json(customers);
  } catch {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

/* ===============================
   Add Customer
================================ */
app.post("/add-customer", async (req, res) => {
  try {
    const { Name, Email, Salary, ["Applied Position"]: appliedPosition } =
      req.body;

    if (!Name || !Email || !appliedPosition || Salary == null) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await customersCollection.findOne({ Email });
    if (exists) {
      return res.status(409).json({ message: "Customer already exists" });
    }

    await customersCollection.insertOne({
      Name,
      Email,
      "Applied Position": appliedPosition,
      Salary,
    });

    res.status(201).json({ message: "Customer added successfully" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Update Customer
================================ */
app.put("/update-customer/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const { Name, Salary, ["Applied Position"]: appliedPosition } = req.body;

    const result = await customersCollection.updateOne(
      { Email: email },
      {
        $set: {
          Name,
          Salary,
          "Applied Position": appliedPosition,
        },
      }
    );

    if (!result.matchedCount) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer updated successfully" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Delete Customer
================================ */
app.delete("/customer/:email", async (req, res) => {
  try {
    const result = await customersCollection.deleteOne({
      Email: req.params.email,
    });

    if (!result.deletedCount) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Start Server
================================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

