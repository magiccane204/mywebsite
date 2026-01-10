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

  useEffect(() => {
    if (!token || !loggedEmail) {
      setRole("Unknown");
      return;
    }
    loadMe();
    loadCustomers();
  }, []);

  const loadMe = async () => {
    try {
      const res = await api.get("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRole(res.data.Role);
    } catch {
      setRole("Unknown");
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.get(`/api/customers/${loggedEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCustomers(res.data);
    } catch {
      setCustomers([]);
    }
  };

  const addCustomer = async () => {
    if (!name || !email || !position || !salary) {
      setMessage("All fields required");
      return;
    }

    try {
      await api.post(
        "/api/add-customer",
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

      setMessage("Customer added");
      setName("");
      setEmail("");
      setPosition("");
      setSalary("");
      loadCustomers();
    } catch (err) {
      setMessage("You are not authorized to add customers");
    }
  };

  return (
    <div className="customer-wrapper">
      <h2 className="customer-title">
        Customer Management — <span>{role}</span>
      </h2>

      <div className="customer-card">
        <h3>Add Customer</h3>

        {role === "Employee" && (
          <p className="empty">View only mode</p>
        )}

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

          <button onClick={addCustomer} disabled={role === "Employee"}>
            Add Customer
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
    </div>
  );
}

export default Customer;
