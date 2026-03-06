import React, { useEffect, useState } from "react";
import api from "./api.js";
import "./Employee.css";

export default function Employee() {
  const [Employees, setEmployees] = useState([]);
  const [role, setRole] = useState(null);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadMe();
    loadEmployees();
  }, []);

  const loadMe = async () => {
    try {
      const res = await api.get("/api/me");
      setRole(res.data.Role);
    } catch {
      setRole("Unknown");
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await api.get("/api/Employees");
      setEmployees(res.data);
    } catch {
      setEmployees([]);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPosition("");
    setSalary("");
    setEditingId(null);
  };

  const submitEmployee = async () => {
    if (!name || !email || !position || salary === "") {
      setMessage("All fields required");
      return;
    }

    try {
      if (editingId) {
        await api.put("/api/update-employee", {
          Id: editingId,
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });

        setMessage("Employee updated");

      } else {
        await api.post("/api/Employees", {
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });

        setMessage("Employee added & Offer Letter sent");
      }

      resetForm();
      loadEmployees();

    } catch (err) {
      setMessage("Operation failed");
    }
  };

  const editEmployee = (c) => {
    if (c.locked) {
      setMessage("Employee is locked");
      return;
    }

    setEditingId(c.Id || c._id);
    setName(c.Name);
    setEmail(c.Email);
    setPosition(c["Applied Position"] || "");
    setSalary(c.Salary);
    setMessage("");
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Delete this Employee?")) return;

    try {
      await api.delete(`/api/Employees/${id}`);

      setMessage("Employee deleted & Termination Letter sent");
      loadEmployees();

    } catch {
      setMessage("Delete failed");
    }
  };

  const toggleLock = async (id) => {
    try {
      await api.put(`/api/Employees/lock/${id}`);
      setMessage("Employee lock status updated");
      loadEmployees();
    } catch {
      setMessage("Lock update failed");
    }
  };

  const filteredEmployees = Employees.filter((c) =>
    (c.Name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.Email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!role) return <div className="Employee-wrapper">Loading...</div>;

  return (
    <div className="Employee-wrapper">
      <h2 className="Employee-title">
        Employee Management — <span>{role}</span>
      </h2>

      <div className="Employee-card">
        <h3>{editingId ? "Update Employee" : "Add Employee"}</h3>

        {role === "Employee" && <p className="empty">View only mode</p>}

        <div className="Employee-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Applied Position" />
          <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary" />

          <button onClick={submitEmployee} disabled={role === "Employee"}>
            {editingId ? "Update Employee" : "Add Employee"}
          </button>
        </div>

        {message && <p className="empty">{message}</p>}
      </div>

      <div className="Employee-card">
        <h3>Employee List</h3>

        <input
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: "10px", padding: "6px", width: "250px" }}
        />

        {filteredEmployees.length === 0 ? (
          <p className="empty">No Employees found</p>
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
              {filteredEmployees.map((c) => (
                <tr
                  key={c.Id || c._id}
                  style={{ opacity: c.locked ? 0.5 : 1 }}
                >
                  <td>
                    {c.locked ? "🔒 " : ""}
                    {c.Name}
                  </td>
                  <td>{c.Email}</td>
                  <td>{c["Applied Position"]}</td>
                  <td>{c.Salary}</td>

                  <td style={{ display: "flex", gap: "8px", justifyContent: "center" }}>

                    <button title="Edit" onClick={() => editEmployee(c)}>
                      ✏️
                    </button>

                    <button title="Lock / Unlock" onClick={() => toggleLock(c.Id || c._id)}>
                      🔒
                    </button>

                    {role === "SuperAdmin" && (
                      <button
                        title="Delete"
                        style={{ background: "red", color: "white" }}
                        onClick={() => deleteEmployee(c.Id || c._id)}
                      >
                        🗑
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
