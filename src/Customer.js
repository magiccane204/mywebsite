import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CRM.css";

function Customer() {
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState(""); // ✅ Logged-in user's role

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [editEmail, setEditEmail] = useState(null); // for update mode

  // ✅ Fetch logged-in user's role
  const fetchRole = async () => {
    try {
      const userEmail = localStorage.getItem("loggedInUser");
      if (!userEmail) return;
      const res = await axios.get(`/user/${userEmail}`);
      setRole(res.data.Role || "Employee");
    } catch (err) {
      console.error("Failed to fetch role:", err);
    }
  };

  // ✅ Load customers for logged-in user
  const fetchCustomers = async () => {
    try {
      const userEmail = localStorage.getItem("loggedInUser");
      if (!userEmail) {
        setMessage("You must be logged in to view customers.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`/customers/${userEmail}`);
      setCustomerData(res.data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setMessage("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
    fetchCustomers();
    const interval = setInterval(fetchCustomers, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Add or Update customer
  const handleAddOrUpdate = async () => {
    const userEmail = localStorage.getItem("loggedInUser");
    if (!userEmail) {
      setMessage("You must be logged in to add a customer.");
      return;
    }

    if (!name || !email || !position || !salary) {
      setMessage("All fields are required.");
      return;
    }

    const payload = {
      userEmail,
      Name: name,
      Email: email,
      "Applied Position": position,
      Salary: Number(salary),
    };

    try {
      if (editEmail) {
        await axios.put(
          `/update-customer/${editEmail}/${userEmail}`,
          payload
        );
        setMessage("✏️ Customer updated successfully!");
        setEditEmail(null);
      } else {
        await axios.post("/add-customer", payload);
        setMessage("✅ Customer added successfully!");
      }

      setName("");
      setEmail("");
      setPosition("");
      setSalary("");
      fetchCustomers();
    } catch (err) {
      console.error("Save customer error:", err);
      setMessage("Failed to save customer.");
    }
  };

  // 🗑️ Delete customer
  const handleDeleteCustomer = async (email) => {
    const userEmail = localStorage.getItem("loggedInUser");
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      await axios.delete(`/customer/${email}/${userEmail}`);
      setMessage("🗑️ Customer deleted successfully!");
      fetchCustomers();
    } catch (err) {
      console.error("Delete error:", err);
      setMessage("Failed to delete customer.");
    }
  };

  // ✏️ Start editing
  const handleEditCustomer = (c) => {
    setEditEmail(c.Email);
    setName(c.Name);
    setEmail(c.Email);
    setPosition(c["Applied Position"]);
    setSalary(c.Salary);
    setMessage("Editing customer: " + c.Email);
  };

  return (
    <div className="content">
      <div className="horizontalbar">
        Customer Management — <strong>{role}</strong>
      </div>

      <div className="customers-section">
        <h3>{editEmail ? "Edit Customer" : "Add New Customer"}</h3>

        <div className="add-customer-form">
          {/* ✅ Only allow Add/Edit for non-Employees */}
          {role !== "Employee" ? (
            <>
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!!editEmail}
              />
              <input
                type="text"
                placeholder="Applied Position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
              <input
                type="number"
                placeholder="Salary"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
              <button onClick={handleAddOrUpdate}>
                {editEmail ? "✏️ Update Customer" : "+ Add Customer"}
              </button>
              {editEmail && (
                <button
                  style={{
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    padding: "4px 8px",
                    borderRadius: "5px",
                    marginLeft: "8px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setEditEmail(null);
                    setName("");
                    setEmail("");
                    setPosition("");
                    setSalary("");
                    setMessage("Edit cancelled.");
                  }}
                >
                  ❌ Cancel
                </button>
              )}
            </>
          ) : (
            <p style={{ color: "#555", fontStyle: "italic" }}>
              👀 View Only Mode — You cannot add or edit customers.
            </p>
          )}
        </div>

        {message && <div className="message">{message}</div>}

        <h3>Customer List</h3>
        {loading ? (
          <div>Loading customers…</div>
        ) : (
          <table className="excel-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Applied Position</th>
                <th>Salary</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customerData.length > 0 ? (
                customerData.map((c, idx) => (
                  <tr key={idx}>
                    <td>{c.Name}</td>
                    <td>{c.Email}</td>
                    <td>{c["Applied Position"]}</td>
                    <td>{c.Salary}</td>
                    <td>
                      {/* ✏️ Edit button for Manager/Admin/SuperAdmin */}
                      {(role === "Manager" ||
                        role === "Admin" ||
                        role === "SuperAdmin") && (
                        <button
                          style={{
                            backgroundColor: "#3b82f6",
                            color: "white",
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "5px",
                            cursor: "pointer",
                            marginRight: "5px",
                          }}
                          onClick={() => handleEditCustomer(c)}
                        >
                          ✏️ Edit
                        </button>
                      )}

                      {/* 🗑 Delete button for Admin/SuperAdmin only */}
                      {(role === "Admin" || role === "SuperAdmin") && (
                        <button
                          style={{
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "4px 8px",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleDeleteCustomer(c.Email)}
                        >
                          🗑 Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Customer;

