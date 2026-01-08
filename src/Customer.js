import React, { useEffect, useState } from "react";
import api from "./api";
import "./Customer.css";

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [role, setRole] = useState("Loading...");
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");

  const token = localStorage.getItem("token");
  const loggedEmail = localStorage.getItem("loggedInUser");

  /* ================= LOAD USER ROLE ================= */
  const loadMe = async () => {
    try {
      const res = await api.get("/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRole(res.data.Role);
    } catch {
      setRole("Unknown");
    }
  };

  /* ================= LOAD CUSTOMERS ================= */
  const loadCustomers = async () => {
    try {
      const res = await api.get(`/customers/${loggedEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(res.data);
    } catch {
      setCustomers([]);
    }
  };

  useEffect(() => {
    loadMe();
    loadCustomers();
  }, []);

  /* ================= ADD CUSTOMER ================= */
  const addCustomer = async () => {
    if (!name || !email || !position || !salary) {
      setMessage("All fields required");
      return;
    }

    try {
      await api.post(
        "/add-customer",
        {
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage("✅ Customer added");
      setName("");
      setEmail("");
      setPosition("");
      setSalary("");
      loadCustomers();
    } catch (err) {
      if (err.response?.status === 403) {
        setMessage("❌ You are not authorized to add customers");
      } else {
        setMessage("❌ Failed to add customer");
      }
    }
  };

  return (
    <div className="customers-page">
      <h2>Customer Management — {role}</h2>

      {role === "Employee" && (
        <p className="warning">
          👀 View Only Mode — You are not authorized to add customers
        </p>
      )}

      <div className="add-form">
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Applied Position" value={position} onChange={e => setPosition(e.target.value)} />
        <input placeholder="Salary" type="number" value={salary} onChange={e => setSalary(e.target.value)} />

        <button onClick={addCustomer} disabled={role === "Employee"}>
          Add Customer
        </button>
      </div>

      {message && <p className="message">{message}</p>}

      <h3>Customer List</h3>

      {customers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Position</th>
              <th>Salary</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, i) => (
              <tr key={i}>
                <td>{c.Name}</td>
                <td>{c.Email}</td>
                <td>{c["Applied Position"]}</td>
                <td>{c.Salary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Customer;
