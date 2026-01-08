import React, { useEffect, useState } from "react";
import axios from "axios";

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

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchData = async () => {
    try {
      const me = await axios.get("/me", authHeader);
      setRole(me.data.Role);

      const res = await axios.get(`/customers/${userEmail}`, authHeader);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addCustomer = async () => {
    if (!name || !email || !position || !salary) {
      alert("Fill all fields");
      return;
    }

    try {
      await axios.post(
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
      fetchData();
    } catch (err) {
      alert("Failed to add customer");
      console.error(err);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Customer Management — {role}</h2>

      {role !== "Employee" && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Add Customer</h3>

          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <br />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <br />

          <input
            placeholder="Applied Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <br />

          <input
            type="number"
            placeholder="Salary"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
          />
          <br />

          <button onClick={addCustomer}>Add Customer</button>
        </div>
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
