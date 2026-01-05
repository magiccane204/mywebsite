import React, { useEffect, useState } from "react";
import api from "./api";
import "./CRM.css";

function Customer() {
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [editEmail, setEditEmail] = useState(null);

  const fetchUserAndCustomers = async () => {
    try {
      const userRes = await api.get("/me");
      setRole(userRes.data.Role);

      const custRes = await api.get("/customers");
      setCustomerData(custRes.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndCustomers();
    const interval = setInterval(fetchUserAndCustomers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddOrUpdate = async () => {
    if (!name || !email || !position || !salary) {
      setMessage("All fields are required.");
      return;
    }

    const payload = {
      Name: name,
      Email: email,
      "Applied Position": position,
      Salary: Number(salary),
    };

    try {
      if (editEmail) {
        await api.put(`/update-customer/${editEmail}`, payload);
        setMessage("✏️ Customer updated successfully!");
        setEditEmail(null);
      } else {
        await api.post("/add-customer", payload);
        setMessage("✅ Customer added successfully!");
      }

      setName("");
      setEmail("");
      setPosition("");
      setSalary("");
      fetchUserAndCustomers();
    } catch (err) {
      console.error(err);
      setMessage("Failed to save customer.");
    }
  };

  const handleDeleteCustomer = async (email) => {
    if (!window.confirm(`Delete ${email}?`)) return;

    try {
      await api.delete(`/customer/${email}`);
      setMessage("🗑️ Customer deleted successfully!");
      fetchUserAndCustomers();
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete customer.");
    }
  };

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

        {role !== "Employee" ? (
          <div className="add-customer-form">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={!!editEmail}
            />
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Applied Position" />
            <input value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary" type="number" />
            <button onClick={handleAddOrUpdate}>
              {editEmail ? "✏️ Update Customer" : "+ Add Customer"}
            </button>
          </div>
        ) : (
          <p style={{ fontStyle: "italic" }}>
            👀 View Only Mode — You cannot add or edit customers.
          </p>
        )}

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
              {customerData.length ? (
                customerData.map((c, i) => (
                  <tr key={i}>
                    <td>{c.Name}</td>
                    <td>{c.Email}</td>
                    <td>{c["Applied Position"]}</td>
                    <td>{c.Salary}</td>
                    <td>
                      {(role === "Admin" || role === "SuperAdmin") && (
                        <>
                          <button onClick={() => handleEditCustomer(c)}>✏️</button>
                          <button onClick={() => handleDeleteCustomer(c.Email)}>🗑️</button>
                        </>
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
