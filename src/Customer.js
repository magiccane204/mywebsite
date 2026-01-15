import React, { useEffect, useState } from "react";
import api from "./api";
import "./Customer.css";

export default function Customer() {
  const [customers, setCustomers] = useState([]);
  const [role, setRole] = useState(null);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadMe();
    loadCustomers();
  }, []);

  const loadMe = async () => {
    try {
      const res = await api.get("/api/me");
      setRole(res.data.Role);
    } catch {
      setRole("Unknown");
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get("/api/customers");
      setCustomers(res.data);
    } catch {
      setCustomers([]);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPosition("");
    setSalary("");
    setEditingId(null);
  };

  const submitCustomer = async () => {
    if (!name || !email || !position || !salary) {
      setMessage("All fields required");
      return;
    }

    try {
      if (editingId === null) {
        await api.post("/api/add-customer", {
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });
        setMessage("Customer added");
      } else {
        await api.put("/api/update-customer", {
          Id: editingId,
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });
        setMessage("Customer updated");
      }

      resetForm();
      loadCustomers();
    } catch (err) {
      if (err.response?.status === 403) {
        setMessage("Permission denied");
      } else if (err.response?.status === 400) {
        setMessage(err.response.data.message || "Invalid data");
      } else {
        setMessage("Something went wrong");
      }
    }
  };

  const editCustomer = (c) => {
    setEditingId(c.Id);
    setName(c.Name);
    setEmail(c.Email);
    setPosition(c["Applied Position"]);
    setSalary(c.Salary);
    setMessage("");
  };

  if (!role) return <div className="customer-wrapper">Loading...</div>;

  return (
    <div className="customer-wrapper">
      <h2 className="customer-title">
        Customer Management — <span>{role}</span>
      </h2>

      <div className="customer-card">
        <h3>{editingId ? "Update Customer" : "Add Customer"}</h3>

        {role === "Employee" && <p className="empty">View only mode</p>}

        <div className="customer-form">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Applied Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <input
            placeholder="Salary"
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />

          <button onClick={submitCustomer} disabled={role === "Employee"}>
            {editingId ? "Update Customer" : "Add Customer"}
          </button>
        </div>

        {message && <p className="empty">{message}</p>}
      </div>

      <div className="customer-card">
        <h3>Customer List</h3>

        {customers.length === 0 ? (
          <p className="empty">No customers found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.Id}>
                  <td>{c.Name}</td>
                  <td>{c.Email}</td>
                  <td>{c["Applied Position"]}</td>
                  <td>{c.Salary}</td>
                  <td>
                    <button
                      onClick={() => editCustomer(c)}
                      disabled={role === "Employee"}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
