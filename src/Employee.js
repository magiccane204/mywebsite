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
    const id = emp._id || emp.Id || emp.id;
    setEditingId(id);
    setName(emp.Name || emp.name || "");
    setEmail(emp.Email || emp.email || "");
    setPosition(emp["Applied Position"] || emp.position || "");
    setSalary(emp.Salary || emp.salary || "");
  };

  const deleteEmployee = async (id) => {
    if (role !== "SuperAdmin") return;
    if (!window.confirm("Delete this employee permanently?")) return;
    try {
      await api.delete(`/api/Employees/${id}`);
      showMessage("Employee deleted");
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
      showMessage("Lock update failed", "error");
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
    } catch {
      showMessage("Role change failed", "error");
    }
  };

  const filteredEmployees = employees.filter((c) =>
    (c.Name || c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.Email || c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const isEmployee = role === "Employee";
  const isSuperAdmin = role === "SuperAdmin";

  if (!role) return <div style={{ background: '#0a0b14', color: 'white', minHeight: '100vh', padding: '20px' }}>Loading Access...</div>;

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
            background: #111322 !important;
            border: 1px solid #2e324d;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .table-header-flex {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
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
          .scheme-table tr {
            background: #111322 !important; /* Forces the dark row */
          }
          .scheme-table th {
            background: #1e1f29 !important;
            color: #8c92ac;
            font-size: 0.75rem;
            padding: 16px;
            border-bottom: 2px solid #8a2be2;
          }
          .scheme-table td {
            background: #111322 !important; /* Forces the dark cell */
            padding: 18px;
            text-align: center;
            border-bottom: 1px solid #2e324d;
            border-right: 1px solid #2e324d;
            color: #ffffff;
            font-size: 0.85rem;
          }
          .scheme-table td:last-child { border-right: none; }
          
          .role-badge {
            background: #4834d4;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.7rem;
            color: white;
          }
          .status-pill {
            border: 1px solid #00ff88;
            color: #00ff88;
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: bold;
          }
          .search-directory {
            background: #0d0e12;
            border: 1px solid #2e324d;
            padding: 10px 20px;
            border-radius: 25px;
            color: white;
            width: 300px;
          }
          .action-btn {
            background: #1a1b23;
            border: 1px solid #3a3f58;
            color: white;
            padding: 6px 10px;
            margin: 0 4px;
            border-radius: 4px;
            cursor: pointer;
          }
        `}
      </style>

      <h2 style={{ marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '2px' }}>
        Employee Portal — <span style={{ color: '#8a2be2' }}>{role}</span>
      </h2>

      {!isEmployee && (
        <div className="Employee-card">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <input style={{ padding: '12px', background: '#0a0b14', border: '1px solid #2e324d', color: 'white', borderRadius: '8px' }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
            <input style={{ padding: '12px', background: '#0a0b14', border: '1px solid #2e324d', color: 'white', borderRadius: '8px' }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input style={{ padding: '12px', background: '#0a0b14', border: '1px solid #2e324d', color: 'white', borderRadius: '8px' }} value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Position" />
            <input style={{ padding: '12px', background: '#0a0b14', border: '1px solid #2e324d', color: 'white', borderRadius: '8px' }} type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Salary" />
          </div>
          <button onClick={submitEmployee} style={{ background: '#8a2be2', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {editingId ? "UPDATE" : "ADD EMPLOYEE"}
          </button>
        </div>
      )}

      <div className="Employee-card">
        <div className="table-header-flex">
          <h3 style={{ fontSize: '0.9rem', color: '#646cff' }}>ACTIVE DIRECTORY ({filteredEmployees.length})</h3>
          <input className="search-directory" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                  <td style={{ color: '#fff', fontWeight: 'bold' }}>{emp.Name || emp.name || "N/A"}</td>
                  <td style={{ color: '#8c92ac' }}>{emp.Email || emp.email}</td>
                  <td>{emp["Applied Position"] || emp.position || "Staff"}</td>
                  <td style={{ color: '#fff' }}>₹{Number(emp.Salary || emp.salary || 0).toLocaleString("en-IN")}</td>
                  <td><span className="role-badge">{emp.Role || emp.role || "Employee"}</span></td>
                  <td><span className="status-pill">{emp.locked ? "LOCKED" : "ACTIVE"}</span></td>
                  {!isEmployee && (
                    <td>
                      <button className="action-btn" onClick={() => editEmployee(emp)}>✏️</button>
                      <button className="action-btn" onClick={() => toggleLock(emp._id || emp.Id)}>{emp.locked ? "🔓" : "🔒"}</button>
                      {isSuperAdmin && <button className="action-btn" onClick={() => deleteEmployee(emp._id || emp.Id)}>🗑</button>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
