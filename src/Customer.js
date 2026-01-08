import React, { useEffect, useState } from "react";
import api from "./api";
import "./Customer.css";

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");

  const loggedInUser = localStorage.getItem("loggedInUser");

  useEffect(() => {
    const loadData = async () => {
      try {
        const meRes = await api.get("/me");
        setRole(meRes.data.Role);

        const custRes = await api.get(`/customers/${loggedInUser}`);
        setCustomers(custRes.data);
      } catch (err) {
        setMessage("Unauthorized or failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loggedInUser]);

  const addCustomer = async () => {
    if (!name || !email || !position || !salary) {
      setMessage("All fields are required");
      return;
    }

    try {
      await api.post("/add-customer", {
        Name: name,
        Email: email,
        Salary: Number(salary),
        "Applied Position": position,
      });

      setMessage("Customer added successfully");

      setName("");
      setEmail("");
      setPosition("");
      setSalary("");

      const res = await api.get(`/customers/${loggedInUser}`);
      setCustomers(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setMessage("You are not authorized to add customers");
      } else {
        setMessage("Failed to add customer");
      }
    }
  };

  if (loading) return <div className="customer-page">Loading…</div>;

  return (
    <div className="customer-page">
      <h2>
        Customer Management{" "}
        <span className="role-badge">{role || "Unknown"}</span>
      </h2>

      {message && <div className="message">{message}</div>}

      {role !== "Employee" && (
        <div className="customer-form">
          <h3>Add Customer</h3>

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

          <button onClick={addCustomer}>Add Customer</button>
        </div>
      )}

      {role === "Employee" && (
        <div className="view-only">
          View only mode — you cannot add customers
        </div>
      )}

      <h3>Customer List</h3>

      {customers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <table className="customer-table">
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
