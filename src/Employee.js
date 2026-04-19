import React, { useEffect, useState } from "react";
import api from "./api.js";

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
    if (role === "Employee") return;
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
    if (role === "Employee") return;
    try {
      await api.put(`/api/Employees/lock/${id}`);
      showMessage("Lock status updated");
      loadEmployees();
    } catch {
      showMessage("Failed to update lock status", "error");
    }
  };

  const openRoleModal = (emp) => {
    if (role !== "SuperAdmin") return;
    setSelectedEmployee(emp);
    setNewRole(emp.Role || "Employee");
    setRoleDuration(30);
    setShowRoleModal(true);
  };

  const changeRole = async () => {
    if (role !== "SuperAdmin" || !selectedEmployee) return;
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

  const isEmployee = role === "Employee";
  const isSuperAdmin = role === "SuperAdmin";

  if (!role) return <div style={{ color: 'white', padding: '20px' }}>Loading...</div>;

  return (
    <div className="Employee-wrapper">
      <style>
        {`
          .Employee-wrapper {
            background-color: #0a0b14;
            min-height: 100vh;
            padding: 40px;
            color: #e0e0e0;
            font-family: 'Inter', sans-serif;
          }
          .Employee-title {
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin-bottom: 40px;
            font-weight: 800;
          }
          .user-role { color: #8a2be2; text-shadow: 0 0 10px rgba(138, 43, 226, 0.5); }
          .Employee-card {
            background: #111322;
            border: 1px solid #2e324d;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
          }
          .section-subtitle {
            margin-top: 0;
            margin-bottom: 25px;
            font-size: 0.9rem;
            color: #646cff;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .Employee-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
          }
          .Employee-form-grid input {
            background: #0a0b14;
            border: 1px solid #2e324d;
            padding: 14px;
            color: white;
            border-radius: 8px;
            outline: none;
          }
          .Employee-form-grid input:focus { border-color: #8a2be2; }
          .primary-submit-btn {
            background: #8a2be2;
            border: none;
            padding: 14px 45px;
            color: white;
            font-weight: 800;
            border-radius: 8px;
            cursor: pointer;
            transition: 0.3s;
          }
          .primary-submit-btn:hover:not(:disabled) { background: #9d4edd; }
          .primary-submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }
          .cancel-btn-outline {
            background: transparent;
            border: 1px solid #2e324d;
            padding: 14px 40px;
            color: #8c92ac;
            margin-left: 15px;
            border-radius: 8px;
            cursor: pointer;
          }
          .scheme-table-container {
            border: 2px solid #8a2be2;
            border-radius: 12px;
            overflow: hidden;
            background: #111322;
          }
          .scheme-table { width: 100%; border-collapse: collapse; }
          .scheme-table th {
            background: rgba(138, 43, 226, 0.1);
            color: #8c92ac;
            font-size: 0.75rem;
            font-weight: 800;
            padding: 18px;
            text-align: center;
            border-bottom: 2px solid #8a2be2;
          }
          .scheme-table td {
            padding: 20px 15px;
            text-align: center;
            border-bottom: 1px solid #2e324d;
            border-right: 1px solid #2e324d;
          }
          .scheme-table td:last-child { border-right: none; }
          .bold-cell { font-weight: 700; color: #fff; }
          .status-pill {
            display: inline-block;
            padding: 6px 18px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .pill-approved { border: 1px solid #00ff88; color: #00ff88; background: rgba(0, 255, 136, 0.05); }
          .pill-rejected { border: 1px solid #ff4d4d; color: #ff4d4d; background: rgba(255, 77, 77, 0.05); }
          .role-pill {
            padding: 5px 12px;
            border-radius: 4px;
            background: #2e324d;
            font-size: 0.7rem;
            font-weight: 600;
          }
          .role-pill.admin { background: #6c5ce7; color: white; }
          .role-pill.superadmin { background: #e84393; color: white; }
          .scheme-actions { display: flex; justify-content: center; gap: 10px; }
          .scheme-btn {
            background: #1a1c2e;
            border: 1px solid #2e324d;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            transition: 0.2s;
          }
          .scheme-btn:hover:not(:disabled) { border-color: #8a2be2; }
          .scheme-search {
            background: #0a0b14;
            border: 1px solid #2e324d;
            padding: 12px 25px;
            border-radius: 25px;
            color: white;
            width: 350px;
            outline: none;
          }
          .status-msg { margin-top: 15px; font-weight: 700; text-align: center; font-size: 0.9rem; }
          .status-msg.error { color: #ff4d4d; }
          .status-msg.success { color: #00ff88; }
          .view-only-tag { color: #ff4d4d; font-weight: 900; letter-spacing: 2px; font-size: 0.8rem; }
          .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal-content {
            background: #111322;
            border: 2px solid #8a2be2;
            padding: 30px;
            border-radius: 12px;
            width: 400px;
          }
          .modal-input {
            width: 100%;
            background: #0a0b14;
            border: 1px solid #2e324d;
            padding: 12px;
            color: white;
            border-radius: 6px;
            margin: 10px 0 20px 0;
            display: block;
          }
        `}
      </style>

      <h2 className="Employee-title">
        Employee Management — <span className="user-role">{role}</span>
      </h2>

      <div className="Employee-card">
        <h3 className="section-subtitle">{editingId ? "Update Existing Record" : "Register New Employee"}</h3>
        {isEmployee && <p className="view-only-tag">READ-ONLY ACCESS</p>}

        <div className="Employee-form-grid">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            disabled={isEmployee}
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            type="email"
            disabled={isEmployee}
          />
          <input
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="Position"
            disabled={isEmployee}
          />
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="Salary"
            disabled={isEmployee}
          />
        </div>
        
        <div className="form-actions">
          <button
            onClick={submitEmployee}
            disabled={isEmployee}
            className="primary-submit-btn"
          >
            {editingId ? "SAVE CHANGES" : "PROCEED"}
          </button>

          {editingId && (
            <button onClick={resetForm} className="cancel-btn-outline">
              DISCARD
            </button>
          )}
        </div>

        {message && <p className={`status-msg ${messageType}`}>{message}</p>}
      </div>

      <div className="Employee-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h3 className="section-subtitle" style={{ margin: 0 }}>Active Directory ({filteredEmployees.length})</h3>
          <input
            placeholder="Search directory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="scheme-search"
          />
        </div>

        <div className="scheme-table-container">
          <table className="scheme-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>POSITION</th>
                <th>SALARY</th>
                <th>ROLE</th>
                <th>STATUS</th>
                {!isEmployee && <th>ACTIONS</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp._id || emp.Id}>
                  <td className="bold-cell">
                    {emp.locked && <span style={{ marginRight: '8px' }}>🔒</span>}
                    {emp.Name}
                  </td>
                  <td style={{ color: '#8c92ac', fontSize: '0.85rem' }}>{emp.Email}</td>
                  <td>{emp["Applied Position"]}</td>
                  <td className="bold-cell">₹{Number(emp.Salary || 0).toLocaleString("en-IN")}</td>
                  <td>
                    <span className={`role-pill ${(emp.Role || "Employee").toLowerCase()}`}>
                      {emp.Role || "Employee"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${emp.locked ? "pill-rejected" : "pill-approved"}`}>
                      {emp.locked ? "LOCKED" : "ACTIVE"}
                    </span>
                  </td>

                  {!isEmployee && (
                    <td className="action-cell">
                      <div className="scheme-actions">
                        <button
                          onClick={() => editEmployee(emp)}
                          disabled={emp.locked}
                          className="scheme-btn"
                        >
                          ✏️
                        </button>

                        <button
                          onClick={() => toggleLock(emp._id || emp.Id)}
                          className="scheme-btn"
                        >
                          {emp.locked ? "🔓" : "🔒"}
                        </button>

                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => openRoleModal(emp)}
                              className="scheme-btn"
                            >
                              👤
                            </button>
                            <button
                              onClick={() => deleteEmployee(emp._id || emp.Id)}
                              disabled={emp.locked}
                              className="scheme-btn"
                            >
                              🗑
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRoleModal && selectedEmployee && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="section-subtitle">Privilege Escalation</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem' }}>Modifying: <strong>{selectedEmployee.Name}</strong></p>
            
            <label style={{ fontSize: '0.8rem', color: '#8c92ac' }}>Target Role</label>
            <select className="modal-input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>

            <label style={{ fontSize: '0.8rem', color: '#8c92ac' }}>Persistence (Days)</label>
            <input
              className="modal-input"
              type="number"
              value={roleDuration}
              onChange={(e) => setRoleDuration(Math.max(1, parseInt(e.target.value) || 1))}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={changeRole} className="primary-submit-btn" style={{ flex: 1 }}>CONFIRM</button>
              <button onClick={() => setShowRoleModal(false)} className="cancel-btn-outline" style={{ flex: 1, margin: 0 }}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
