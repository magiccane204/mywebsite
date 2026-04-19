import React, { useEffect, useState } from "react";
import api from "./api.js";
import "./Employee.css";

export default function Employee() {
  const [employees, setEmployees] = useState([]);
  const [role, setRole] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [salary, setSalary] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [roleDuration, setRoleDuration] = useState(30);

  useEffect(() => {
    loadMe();
    loadEmployees();
  }, []);

  const loadMe = async () => {
    try {
      const res = await api.get("/api/me");
      setRole(res.data.Role || res.data.role);
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

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
  };

  const submitEmployee = async () => {
    if (role === "Employee") return;
    if (!name || !email || !position || salary === "") {
      showMessage("All fields are required", "error");
      return;
    }

    try {
      if (editingId) {
        const emp = employees.find((c) => (c._id || c.Id) === editingId);
        if (emp?.locked) {
          showMessage("Locked employees cannot be modified", "error");
          return;
        }
        await api.put("/api/update-employee", {
          Id: editingId,
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });
        showMessage("Employee updated successfully");
      } else {
        await api.post("/api/Employees", {
          Name: name,
          Email: email,
          "Applied Position": position,
          Salary: Number(salary),
        });
        showMessage("Employee added & Offer Letter sent");
      }
      resetForm();
      loadEmployees();
    } catch {
      showMessage("Operation failed", "error");
    }
  };

  const editEmployee = (emp) => {
    if (emp.locked) {
      showMessage("This employee is locked and cannot be edited", "error");
      return;
    }
    setEditingId(emp._id || emp.Id);
    setName(emp.Name);
    setEmail(emp.Email);
    setPosition(emp["Applied Position"] || "");
    setSalary(emp.Salary || "");
  };

  const deleteEmployee = async (id) => {
    if (role !== "SuperAdmin") return;
    const emp = employees.find((c) => (c._id || c.Id) === id);
    if (emp?.locked) {
      showMessage("Locked employees cannot be deleted", "error");
      return;
    }
    if (!window.confirm("Delete this employee permanently?")) return;

    try {
      await api.delete(`/api/Employees/${id}`);
      showMessage("Employee deleted & Termination Letter sent");
      loadEmployees();
    } catch {
      showMessage("Delete failed", "error");
    }
  };

  const toggleLock = async (id) => {
    if (role !== "SuperAdmin") return;
    try {
      await api.put(`/api/Employees/lock/${id}`);
      showMessage("Lock status updated");
      loadEmployees();
    } catch {
      showMessage("Failed to update lock status", "error");
    }
  };

  const openRoleModal = (emp) => {
    if (role !== "SuperAdmin") {
      showMessage("Only SuperAdmin can change roles", "error");
      return;
    }
    setSelectedEmployee(emp);
    setNewRole(emp.Role || "Employee");
    setRoleDuration(30);
    setShowRoleModal(true);
  };

  const changeRole = async () => {
    if (!selectedEmployee) return;
    try {
      await api.put("/api/employees/change-role", {
        employeeId: selectedEmployee._id || selectedEmployee.Id,
        newRole,
        durationDays: Number(roleDuration),
      });
      showMessage(`Role changed to ${newRole} for ${roleDuration} days`);
      setShowRoleModal(false);
      loadEmployees();
    } catch {
      showMessage("Failed to change role", "error");
    }
  };

  const filteredEmployees = employees.filter((c) =>
    (c.Name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.Email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!role) return <div className="Employee-wrapper">Loading...</div>;

  return (
    <div className="Employee-wrapper">
      <h2 className="Employee-title">
        Employee Management — <span className="user-role">{role}</span>
      </h2>


      <div className="Employee-card">
        <h3>{editingId ? "Update Employee" : "Add New Employee"}</h3>
        {role === "Employee" && <p className="view-only">View Only Mode</p>}

        <div className="Employee-form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            type="email"
          />
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Position"
          />
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="Salary"
          />

          <button
            onClick={submitEmployee}
            disabled={role === "Employee"}
            className="add-btn"
          >
            {editingId ? "Update Employee" : "Add Employee"}
          </button>

          {editingId && (
            <button onClick={resetForm} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>

        {message && <p className={`message ${messageType}`}>{message}</p>}
      </div>

      <div className="Employee-card">
        <div className="list-header">
          <h3>Employee Directory ({filteredEmployees.length})</h3>
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Salary</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp._id || emp.Id}
                  className={emp.locked ? "locked-row" : ""}
                >
                  <td>
                    {emp.locked && <span className="lock-icon">🔒</span>}
                    {emp.Name}
                  </td>
                  <td>{emp.Email}</td>
                  <td>{emp["Applied Position"]}</td>
                  <td>₹{Number(emp.Salary || 0).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`role-badge ${(emp.Role || "Employee").toLowerCase()}`}>
                      {emp.Role || "Employee"}
                    </span>
                  </td>
                  <td>
                    <span className={`status ${emp.locked ? "locked" : "active"}`}>
                      {emp.locked ? "Locked" : "Active"}
                    </span>
                  </td>

                  
                  <td className="action-cell">
                    <div className="actions-wrapper">
                      <button
                        title="Edit"
                        onClick={() => editEmployee(emp)}
                        disabled={emp.locked}
                        className="action-btn edit"
                      >
                        ✏️
                      </button>

                      {role === "SuperAdmin" && (
                        <>
                          <button
                            title="Change Role"
                            onClick={() => openRoleModal(emp)}
                            className="action-btn role-btn"
                          >
                            👤
                          </button>

                          <button
                            title="Lock / Unlock"
                            onClick={() => toggleLock(emp._id || emp.Id)}
                            className="action-btn lock-btn"
                          >
                            🔒
                          </button>

                          <button
                            title="Delete"
                            onClick={() => deleteEmployee(emp._id || emp.Id)}
                            disabled={emp.locked}
                            className="action-btn delete-btn"
                          >
                            🗑
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
      {showRoleModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Change Role - {selectedEmployee.Name}</h3>
            <p>
              <strong>Current Role:</strong> {selectedEmployee.Role || "Employee"}
            </p>

            <label>New Role:</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>

            <label>Temporary Duration (in days):</label>
            <input
              type="number"
              value={roleDuration}
              onChange={(e) => setRoleDuration(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="365"
            />

            <div className="modal-actions">
              <button onClick={() => setShowRoleModal(false)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={changeRole} className="submit-btn">
                Update Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
