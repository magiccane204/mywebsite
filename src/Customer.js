import React, { useEffect, useState } from "react";
import axios from "axios";

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [role, setRole] = useState("Loading…");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");

  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("loggedInUser");

  const auth = {
    headers: { Authorization: `Bearer ${token}` },
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const me = await axios.get("/me", auth);
      setRole(me.data.Role || "Unknown");

      const res = await axios.get(`/customers/${userEmail}`, auth);
      setCustomers(res.data);
    } catch (err) {
      console.error("LOAD ERROR:", err.response?.data || err.message);
      setRole("Unauthorized");
    }
  };

  const addCustomer = async () => {
    try {
      await axios.post(
        "/add-customer",
        {
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        },
        auth
      );

      setName("");
      setEmail("");
      setPosition("");
      setSalary("");
      loadData();
    } catch (err) {
      console.error("ADD ERROR:", err.response?.data || err.message);
      alert("Backend route /add-customer not implemented yet");
    }
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Customer Management — {role}</h2>

      <h3>Add Customer</h3>
      <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Position" value={position} onChange={e => setPosition(e.target.value)} />
      <input placeholder="Salary" value={salary} onChange={e => setSalary(e.target.value)} />
      <button onClick={addCustomer}>Add Customer</button>

      <h3>Customers</h3>
      {customers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <ul>
          {customers.map((c, i) => (
            <li key={i}>{c.Name} — {c.Email}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Customer;
