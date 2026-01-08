import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Customer.css";

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");

  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("loggedInUser");

  const auth = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const loadData = async () => {
    try {
      const me = await axios.get("/me", auth);
      setRole(me.data.Role);

      const res = await axios.get(`/customers/${userEmail}`, auth);
      setCustomers(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addCustomer = async () => {
    if (!name || !email || !position || !salary) return;

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
  };

  if (loading) return <div className="customer-wrapper">Loading…</div>;

  return (
    <div className="customer-wrapper">
      <h2 className="customer-title">
        Customer Management — <span>{role}</span>
      </h2>

      <div className="customer-card">
        <h3>Add Customer</h3>

        <div className="customer-form">
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="Applied Position" value={position} onChange={e => setPosition(e.target.value)} />
          <input type="number" placeholder="Salary" value={salary} onChange={e => setSalary(e.target.value)} />
          <button onClick={addCustomer}>Add Customer</button>
        </div>
      </div>

      <div className="customer-card">
        <h3>Customers</h3>

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
                  <td>₹{c.Salary}</td>
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
