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
        await api.put("/api/update-Employee", {
          Id: editingId,
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });

        setMessage("Employee updated");

      } else {

        await api.post("/api/add-Employee", {
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });

        await api.post("/api/send-letter", {
          type: "officiation",
          employeeName: name,
          employeeEmail: email,
          position: position,
          companyName: "Your Company Pvt Ltd"
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
    setEditingId(c.Id || c._id);
    setName(c.Name);
    setEmail(c.Email);
    setPosition(c["Applied Position"]);
    setSalary(c.Salary);
    setMessage("");
  };

  const deleteEmployee = async (id, employeeData) => {
    if (!window.confirm("Delete this Employee?")) return;

    try {

      await api.post("/api/send-letter", {
        type: "termination",
        employeeName: employeeData.Name,
        employeeEmail: employeeData.Email,
        position: employeeData["Applied Position"],
        companyName: "Your Company Pvt Ltd"
      });

      await api.delete(`/api/delete-Employee/${id}`);

      setMessage("Employee deleted & Termination Letter sent");
      loadEmployees();

    } catch {
      setMessage("Delete failed");
    }
  };

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

        {Employees.length === 0 ? (
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
              {Employees.map((c) => (
                <tr key={c.Id || c._id}>
                  <td>{c.Name}</td>
                  <td>{c.Email}</td>
                  <td>{c["Applied Position"]}</td>
                  <td>{c.Salary}</td>
                  <td>
                    <button onClick={() => editEmployee(c)}>Edit</button> <br/>

                    {role === "SuperAdmin" && (
                      <button
                        style={{ marginLeft: "8px", background: "red" }}
                        onClick={() => deleteEmployee(c.Id || c._id, c)}
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
