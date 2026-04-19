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
    setEditingId(emp._id || emp.Id);
    setName(emp.Name || emp.name || "");
    setEmail(emp.Email || emp.email || "");
    setPosition(emp["Applied Position"] || emp.position || "");
    setSalary(emp.Salary || emp.salary || "");
  };

  const deleteEmployee = async (id) => {
    if (role !== "SuperAdmin") return;
    if (!window.confirm("Permanently delete this employee?")) return;
    try {
      await api.delete(`/api/Employees/${id}`);
      showMessage("Employee removed");
      loadEmployees();
    } catch {
      showMessage("Delete failed", "error");
    }
  };

  const toggleLock = async (id) => {
    if (role === "Employee") return;
    try {
      await api.put(`/api/Employees/lock/${id}`);
      loadEmployees();
    } catch {
      showMessage("Lock status update failed", "error");
    }
  };

  const openRoleModal = (emp) => {
    if (role !== "SuperAdmin") return;
    setSelectedEmployee(emp);
    setNewRole(emp.Role || emp.role || "Employee");
    setShowRoleModal(true);
  };

  const changeRole = async () => {
    try {
      await api.put("/api/employees/change-role", {
        employeeId: selectedEmployee._id || selectedEmployee.Id,
        newRole,
        durationDays: Number(roleDuration),
      });
      setShowRoleModal(false);
      loadEmployees();
      showMessage("Role updated successfully");
    } catch {
      showMessage("Failed to update role", "error");
    }
  };

  const filteredEmployees = employees.filter((c) =>
    (c.Name || c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.Email || c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const isEmployee = role === "Employee";
  const isSuperAdmin = role === "SuperAdmin";

  if (!role) return <div style={{ background: '#0a0b14', color: 'white', minHeight: '100vh', padding: '20px' }}>Syncing Permissions...</div>;

  return (
    <div className="Employee-wrapper">
      <style>
        {`
          .Employee-wrapper {
            background-color: #0a0b14 !important;
            min-height: 100vh;
            padding: 40px;
            color: #ffffff;
            font-family: 'Inter', sans-serif;
          }
          .Employee-card {
            background: #15171e !important;
            border: 1px solid #2e324d;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .scheme-table-container {
            border: 2px solid #8a2be2;
            border-radius: 12px;
            overflow: hidden;
            background: #111322 !important;
          }
          .scheme-table { 
            width: 100%; 
            border-collapse: collapse; 
            background: #111322 !important;
          }
          .scheme-table tr { background: #111322 !important; }
          .scheme-table th {
            background: #1e1f29 !important;
            color: #a0a0a0;
            font-size: 0.75rem;
            padding: 16px;
            border-bottom: 2px solid #8a2be2;
            text-transform: uppercase;
          }
          .scheme-table td {
            background: #111322 !important;
            padding: 18px;
            text-align: center;
            border-bottom: 1px solid #2e324d;
            border-right: 1px solid #2e324d;
            color: #ffffff;
          }
          .scheme-table td:last-child { border-right: none; }
          .role-tag {
            background: #4834d4;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 0.7rem;
            text-transform: capitalize;
          }
          .status-pill {
            border: 1px solid #00ff88;
            color: #00ff88;
            padding: 4px 14px;
            border-radius: 20px;
            font-size: 0.7rem;
          }
          .action-btn {
            background: #1a1b23;
            border: 1px solid #3a3f58;
            color: white;
            padding: 8px;
            margin: 0 4px;
            border-radius: 6px;
            cursor: pointer;
          }
          .action-btn:hover { border-color: #8a2be2; }
          .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .modal-content {
            background: #15171e;
            border: 2px solid #8a2be2;
            padding: 30px;
            border-radius: 12px;
            width: 400px;
          }
          .search-input {
            background: #0d0e12;
            border: 1px solid #2e324d;
            padding: 10px 20px;
            border-radius: 20px;
            color: white;
            width: 280px;
          }
        `}
      </style>

      <h2 style={{ letterSpacing: '2px', marginBottom: '30px' }}>
        EMPLOYEE MANAGEMENT — <span style={{ color: '#8a2be2' }}>{role}</span>
      </h2>

      {!isEmployee && (
        <div className="Employee-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <input style={{ padding: '12px', background: '#0a0b14', border: '1px solid #2e324d', color: 'white', borderRadius: '8px' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
            <input style={{ padding: '12px', background: '#0a0b14', border: '1px solid #2e324d', color: 'white', borderRadius: '8px' }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" />
            <input style={{ padding: '12px', background: '#0a0b14', border: '1px solid #2e324d', color: 'white', borderRadius: '8px' }} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Position" />
            <input style={{ padding: '12px', background: '#0a0b14', border: '1px solid #2e324d', color: 'white', borderRadius: '8px' }} type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary" />
          </div>
          <button onClick={submitEmployee} style={{ background: '#8a2be2', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {editingId ? "SAVE CHANGES" : "ADD TO DIRECTORY"}
          </button>
          {message && <p style={{ color: messageType === 'error' ? '#ff4d4d' : '#00ff88', marginTop: '15px' }}>{message}</p>}
        </div>
      )}

      <div className="Employee-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#8a2be2' }}>ACTIVE DIRECTORY ({filteredEmployees.length})</h3>
          <input className="search-input" placeholder="Search directory..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  <td style={{ fontWeight: 'bold' }}>{emp.Name || emp.name || "—"}</td>
                  <td style={{ color: '#8c92ac' }}>{emp.Email || emp.email}</td>
                  <td>{emp["Applied Position"] || emp.position || "Staff"}</td>
                  <td style={{ fontWeight: 'bold' }}>₹{Number(emp.Salary || emp.salary || 0).toLocaleString("en-IN")}</td>
                  <td><span className="role-tag">{emp.Role || emp.role || "Employee"}</span></td>
                  <td><span className="status-pill">{emp.locked ? "LOCKED" : "ACTIVE"}</span></td>
                  {!isEmployee && (
                    <td>
                      <button className="action-btn" onClick={() => editEmployee(emp)}>✏️</button>
                      <button className="action-btn" onClick={() => toggleLock(emp._id || emp.Id)}>{emp.locked ? "🔓" : "🔒"}</button>
                      {isSuperAdmin && (
                        <>
                          <button className="action-btn" onClick={() => openRoleModal(emp)}>👤</button>
                          <button className="action-btn" onClick={() => deleteEmployee(emp._id || emp.Id)}>🗑</button>
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#8a2be2', marginTop: 0 }}>Escalate Privileges</h3>
            <p>Target: <strong>{selectedEmployee.Name || selectedEmployee.name}</strong></p>
            
            <label style={{ fontSize: '0.8rem', color: '#8c92ac' }}>Assigned Role</label>
            <select 
              style={{ width: '100%', padding: '12px', background: '#0a0b14', color: 'white', border: '1px solid #2e324d', borderRadius: '6px', margin: '10px 0 20px 0' }}
              value={newRole} 
              onChange={(e) => setNewRole(e.target.value)}
            >
              <option value="Employee">Employee</option>
              <option value="Admin">Admin</option>
              <option value="SuperAdmin">SuperAdmin</option>
            </select>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={changeRole} style={{ flex: 1, background: '#8a2be2', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>UPDATE</button>
              <button onClick={() => setShowRoleModal(false)} style={{ flex: 1, background: '#3a3f58', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer' }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
