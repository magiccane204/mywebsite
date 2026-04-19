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
    setName(emp.Name || emp.name);
    setEmail(emp.Email || emp.email);
    setPosition(emp["Applied Position"] || emp.position || "");
    setSalary(emp.Salary || emp.salary || "");
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
    (c.Name || c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.Email || c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const isEmployee = role === "Employee";
  const isAdmin = role === "Admin";
  const isSuperAdmin = role === "SuperAdmin";

  if (!role) return <div style={{ background: '#0a0b14', color: 'white', height: '100vh', padding: '20px' }}>Loading...</div>;

  return (
    <div className="Employee-wrapper">
      <style>
        {`
          .Employee-wrapper {
            background-color: #0d0e12;
            min-height: 100vh;
            padding: 20px 40px;
            color: #e0e0e0;
            font-family: 'Inter', sans-serif;
          }
          .Employee-title {
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 30px;
            font-size: 1.4rem;
          }
          .user-role { color: #646cff; }

          /* Card Styling */
          .Employee-card {
            background: #15171e;
            border: 1px solid #2e324d;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
          }

          /* Form & Input Styling */
          .Employee-form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }
          .Employee-form-grid input {
            background: #1a1b23;
            border: 1px solid #3a3f58;
            padding: 12px;
            color: #fff;
            border-radius: 6px;
            outline: none;
          }
          .Employee-form-grid input:focus { border-color: #8a2be2; }

          /* Header area with Search */
          .table-header-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .section-title-blue {
            color: #5d5fef;
            font-weight: 800;
            text-transform: uppercase;
            font-size: 0.9rem;
          }
          .search-bar-rounded {
            background: #0d0e12;
            border: 1px solid #2e324d;
            color: #fff;
            padding: 8px 24px;
            border-radius: 20px;
            width: 300px;
          }

          /* Table Styling matching screenshot */
          .scheme-table-container {
            border: 1px solid #8a2be2;
            border-radius: 8px;
            overflow: hidden;
            background: #15171e;
          }
          .scheme-table { width: 100%; border-collapse: collapse; }
          .scheme-table th {
            background: #1e1f29;
            color: #a0a0a0;
            font-size: 0.75rem;
            padding: 16px;
            text-align: center;
            border-bottom: 2px solid #8a2be2;
          }
          .scheme-table td {
            padding: 16px;
            text-align: center;
            border-bottom: 1px solid #2e324d;
            border-right: 1px solid #2e324d;
            color: #d1d1d1;
            font-size: 0.85rem;
          }
          .scheme-table td:last-child { border-right: none; }
          
          /* Status Pills */
          .status-pill-outline {
            border: 1.5px solid #00ff88;
            color: #00ff88;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 800;
            background: transparent;
          }
          .status-pill-locked {
            border: 1.5px solid #ff4d4d;
            color: #ff4d4d;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 800;
          }
          .role-tag {
            background: #4834d4;
            color: #fff;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.7rem;
          }
          .role-tag.employee { background: #2f3542; }

          /* Action Buttons */
          .action-btn-box {
            background: #1a1b23;
            border: 1px solid #3a3f58;
            color: #fff;
            padding: 6px 10px;
            margin: 0 4px;
            border-radius: 4px;
            cursor: pointer;
          }
          .action-btn-box:hover:not(:disabled) { background: #2e324d; border-color: #8a2be2; }
          .action-btn-box:disabled { opacity: 0.3; cursor: not-allowed; }

          .btn-primary {
            background: #8a2be2;
            border: none;
            color: white;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
          }
          .btn-primary:disabled { opacity: 0.3; }
        `}
      </style>

      <h2 className="Employee-title">
        Employee Management — <span className="user-role">{role}</span>
      </h2>

      {!isEmployee && (
        <div className="Employee-card">
          <div className="Employee-form-grid">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" type="email" />
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Position" />
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary" />
          </div>
          <button onClick={submitEmployee} className="btn-primary">
            {editingId ? "UPDATE EMPLOYEE" : "ADD EMPLOYEE"}
          </button>
          {message && <p style={{ color: messageType === 'error' ? '#ff4d4d' : '#00ff88', marginTop: '10px' }}>{message}</p>}
        </div>
      )}

      <div className="Employee-card">
        <div className="table-header-flex">
          <div className="section-title-blue">Active Directory ({filteredEmployees.length})</div>
          <input 
            className="search-bar-rounded" 
            placeholder="Search directory..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                  <td style={{ fontWeight: '700', color: '#fff' }}>
                    {emp.locked && "🔒 "}{emp.Name || emp.name || "—"}
                  </td>
                  <td>{emp.Email || emp.email}</td>
                  <td style={{ color: '#a0a0a0' }}>{emp["Applied Position"] || emp.position || "—"}</td>
                  <td style={{ color: '#fff' }}>
                    {emp.Salary || emp.salary ? `₹${Number(emp.Salary || emp.salary).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td>
                    <span className={`role-tag ${(emp.Role || emp.role || "Employee").toLowerCase()}`}>
                      {emp.Role || emp.role || "Employee"}
                    </span>
                  </td>
                  <td>
                    <span className={emp.locked ? "status-pill-locked" : "status-pill-outline"}>
                      {emp.locked ? "LOCKED" : "ACTIVE"}
                    </span>
                  </td>
                  {!isEmployee && (
                    <td>
                      <button onClick={() => editEmployee(emp)} disabled={emp.locked} className="action-btn-box" title="Edit">✏️</button>
                      <button onClick={() => toggleLock(emp._id || emp.Id)} className="action-btn-box" title="Lock">{emp.locked ? "🔓" : "🔒"}</button>
                      
                      {isSuperAdmin && (
                        <>
                          <button onClick={() => openRoleModal(emp)} className="action-btn-box" title="Role">👤</button>
                          <button onClick={() => deleteEmployee(emp._id || emp.Id)} disabled={emp.locked} className="action-btn-box" title="Delete">🗑</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRoleModal && selectedEmployee && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="Employee-card" style={{ width: '400px' }}>
            <h3 className="section-title-blue">Change Role: {selectedEmployee.Name || selectedEmployee.name}</h3>
            <select 
              style={{ width: '100%', padding: '10px', background: '#0d0e12', color: '#fff', border: '1px solid #2e324d', margin: '20px 0' }}
              value={newRole} 
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={changeRole} className="btn-primary" style={{ flex: 1 }}>SAVE</button>
              <button onClick={() => setShowRoleModal(false)} className="btn-primary" style={{ flex: 1, background: '#3a3f58' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
