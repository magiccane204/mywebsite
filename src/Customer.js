const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ===============================
   MongoDB Connection
================================ */
const MONGO_URL = "mongodb://127.0.0.1:27017";
const DB_NAME = "crm";

let db, customersCollection;

MongoClient.connect(MONGO_URL)
  .then((client) => {
    db = client.db(DB_NAME);
    customersCollection = db.collection("customers");
    console.log("✅ MongoDB connected");
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

/* ===============================
   Mock Auth / Role Endpoint
================================ */
app.get("/me", (req, res) => {
  // Change role to test UI permissions
  res.json({ Role: "Admin" }); 
});

/* ===============================
   Get All Customers
================================ */
app.get("/customers", async (req, res) => {
  try {
    const customers = await customersCollection.find({}).toArray();
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
});

/* ===============================
   Add Customer (MATCHES UI)
================================ */
app.post("/add-customer", async (req, res) => {
  try {
    const {
      Name,
      Email,
      Salary,
      ["Applied Position"]: appliedPosition,
    } = req.body;

    if (!Name || !Email || !appliedPosition || Salary === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await customersCollection.findOne({ Email });
    if (exists) {
      return res.status(409).json({ message: "Customer already exists" });
    }

    const customer = {
      Name,
      Email,
      "Applied Position": appliedPosition,
      Salary,
    };

    await customersCollection.insertOne(customer);
    res.status(201).json({ message: "Customer added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Update Customer
================================ */
app.put("/update-customer/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const {
      Name,
      Salary,
      ["Applied Position"]: appliedPosition,
    } = req.body;

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Delete Customer
================================ */
app.delete("/customer/:email", async (req, res) => {
  try {
    const email = req.params.email;

    const result = await customersCollection.deleteOne({ Email: email });

    if (!result.deletedCount) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   Start Server
================================ */
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
