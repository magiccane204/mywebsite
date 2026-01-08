import React, { useEffect, useState } from "react";
import api from "./api";

function Customer() {
  const [customers, setCustomers] = useState([]);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");

  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("loggedInUser");

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    if (!token || !userEmail) return;

    api.get("/me", authHeader).then((res) => {
      setRole(res.data.Role);
    });

    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    api
      .get(`/customers/${userEmail}`, authHeader)
      .then((res) => setCustomers(res.data))
      .catch(() => setCustomers([]));
  };

  const addCustomer = async () => {
    if (!name || !email || !position || !salary) return;

    await api.post(
      "/add-customer",
      {
        Name: name,
        Email: email,
        "Applied Position": position,
        Salary: Number(salary),
      },
      authHeader
    );

    setName("");
    setEmail("");
    setPosition("");
    setSalary("");
    fetchCustomers();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Customer Management — {role}</h2>

      {role !== "Employee" && (
        <>
          <h3>Add Customer</h3>

          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="Applied Position" value={position} onChange={e => setPosition(e.target.value)} />
          <input placeholder="Salary" type="number" value={salary} onChange={e => setSalary(e.target.value)} />

          <button onClick={addCustomer}>Add Customer</button>
        </>
      )}

      <h3>Customers</h3>

      {customers.length === 0 ? (
        <p>No customers found</p>
      ) : (
        <ul>
          {customers.map((c, i) => (
            <li key={i}>
              {c.Name} — {c.Email} — {c["Applied Position"]} — ₹{c.Salary}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Customer;

