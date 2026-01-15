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
    setMessage("");
  };

  const submitCustomer = async () => {
    if (!name || !email || !position || salary === "") {
      setMessage("All fields required");
      return;
    }

    try {
      if (editingId) {
        await api.put("/api/update-customer", {
          Id: editingId,
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });
        setMessage("Customer updated");
      } else {
        await api.post("/api/add-customer", {
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });
        setMessage("Customer added");
      }

      resetForm();
      loadCustomers();
    } catch (err) {
      if (err.response?.status === 403) {
        setMessage("Permission denied");
      } else if (err.response?.status === 400) {
        setMessage(err.response.data?.message || "Invalid data");
      } else {
        setMessage("Something went wrong");
      }
    }
  };

  const editCustomer = (c) => {
    setEditingId(c.Id || c._id);
    setName(c.Name);
    setEmail(c.Email);
    setPosition(c["Applied Position"]);
    setSalary(c.Salary);
    setMessage("");
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await api.delete(`/api/delete-customer/${id}`);
      setMessage("Customer deleted");
      loadCustomers();
    } catch {
      setMessage("Delete failed");
    }
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
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Applied Position" />
          <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary" />

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
                <tr key={c.Id || c._id}>
                  <td>{c.Name}</td>
                  <td>{c.Email}</td>
                  <td>{c["Applied Position"]}</td>
                  <td>{c.Salary}</td>
                  <td>
                    <button onClick={() => editCustomer(c)}>Edit</button> </br>

                    {role === "SuperAdmin" && (
                      <button
                        style={{ marginLeft: "8px", background: "red" }}
                        onClick={() => deleteCustomer(c.Id || c._id)}
                      >
                        Delete
                      </button>
                    )}
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

