import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com/api"
});

function TasksWorkspace() {
  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // UI States
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [uploading, setUploading] = useState(null);

  // ✅ ROLE LOGIC (Fixing the SuperAdmin visibility)
  const rawRole = (localStorage.getItem("role") || "").trim();
  const userEmail = localStorage.getItem("email");
  const isAdmin = rawRole === "Admin" || rawRole === "SuperAdmin";
  const isSuper = rawRole === "SuperAdmin";

  // ✅ FRESH HEADERS HELPER
  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  // --- INITIAL LOAD ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    loadTasks();
    loadEmployees();
    loadLeaves();
  }, []);

  // ================= DATA FETCHING =================

  async function loadTasks() {
    try {
      const res = await api.get("/tasks", getHeaders());
      setTasks(res.data);
    } catch (err) {
      console.error("Task load error:", err);
    }
  }

  async function loadEmployees() {
    try {
      const res = await api.get("/Employees", getHeaders());
      setEmployees(res.data);
    } catch (err) {
      console.error("Employee load error:", err);
    }
  }

  async function loadLeaves() {
    try {
      const res = await api.get("/leaves", getHeaders());
      setLeaves(res.data);
    } catch (err) {
      console.error("Leave load error:", err);
    }
  }

  // ================= TASK ACTIONS =================

  async function createTask() {
    if (!title || !employeeEmail) {
      alert("Title and Employee Email are required");
      return;
    }

    try {
      await api.post("/tasks", {
        Title: title,
        Description: description,
        EmployeeEmail: employeeEmail
      }, getHeaders());

      setTitle("");
      setDescription("");
      setEmployeeEmail("");
      setShowTaskModal(false);
      loadTasks();
    } catch (err) {
      alert("Failed to create task");
    }
  }

  async function updateTaskStatus(id, newStatus) {
    try {
      await api.put(`/tasks/status/${id}`, { Status: newStatus }, getHeaders());
      loadTasks();
    } catch (err) {
      alert("Failed to update status");
    }
  }

  async function handleFileUpload(taskId, file) {
    if (!file) return;
    setUploading(taskId);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`https://mywebsite-im3c.onrender.com/api/tasks/upload/${taskId}`, formData, {
        headers: {
          ...getHeaders().headers,
          "Content-Type": "multipart/form-data"
        }
      });
      alert("File uploaded successfully");
      loadTasks();
    } catch (err) {
      alert("Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function downloadFile(taskId) {
    const token = localStorage.getItem("token");
    window.open(`https://mywebsite-im3c.onrender.com/api/tasks/file/${taskId}?token=${token}`, "_blank");
  }

  // ================= LEAVE ACTIONS =================

  async function applyLeave() {
    if (!leaveDate || !leaveReason) {
      alert("Fill all fields");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    if (leaveDate < today) {
      alert("Cannot select past date");
      return;
    }

    try {
      await api.post("/leaves", {
        Date: leaveDate,
        Reason: leaveReason
      }, getHeaders());

      setLeaveDate("");
      setLeaveReason("");
      setShowLeaveModal(false);
      loadLeaves();
    } catch (err) {
      alert("Failed to apply for leave");
    }
  }

  // ================= UI RENDER =================

  return (
    <div style={{ padding: "20px", color: "#333" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h2>Workspace Management</h2>
        <div style={{ fontSize: "14px", color: "#666" }}>
          Logged in as: <strong>{userEmail}</strong> ({rawRole})
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {isAdmin && (
          <button className="crm-btn" onClick={() => setShowTaskModal(true)} style={{ background: "#7c3aed", color: "white", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            ➕ Create Task
          </button>
        )}
        <button onClick={() => setShowLeaveModal(true)} style={{ marginLeft: "10px", padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer" }}>
          📅 Apply Leave
        </button>
      </div>

      {/* --- TASK MODAL --- */}
      {showTaskModal && (
        <div className="chart-modal" onClick={() => setShowTaskModal(false)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "white", padding: "30px", borderRadius: "12px", width: "400px" }}>
            <h3>Assign New Task</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <input
                placeholder="Task Title"
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              <textarea
                placeholder="Task Description"
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd", minHeight: "80px" }}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <select
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                value={employeeEmail}
                onChange={e => setEmployeeEmail(e.target.value)}
              >
                <option value="">Assign To...</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp.Email}>{emp.Name} ({emp.Email})</option>
                ))}
              </select>
              <button onClick={createTask} style={{ background: "#7c3aed", color: "white", padding: "12px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Send Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LEAVE MODAL --- */}
      {showLeaveModal && (
        <div className="chart-modal" onClick={() => setShowLeaveModal(false)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "white", padding: "30px", borderRadius: "12px", width: "400px" }}>
            <h3>Request Leave</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
              <input
                type="date"
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd" }}
                value={leaveDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setLeaveDate(e.target.value)}
              />
              <textarea
                placeholder="Reason for leave"
                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #ddd", minHeight: "80px" }}
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
              />
              <button onClick={applyLeave} style={{ background: "#7c3aed", color: "white", padding: "12px", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TASK TABLE --- */}
      <h3>Task Board</h3>
      <table className="excel-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
          <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
            <th style={{ padding: "12px" }}>Title</th>
            <th style={{ padding: "12px" }}>Description</th>
            <th style={{ padding: "12px" }}>Status</th>
            <th style={{ padding: "12px" }}>Files</th>
            <th style={{ padding: "12px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.length === 0 ? (
            <tr><td colSpan="5" style={{ padding: "20px", textAlign: "center", color: "#999" }}>No tasks found.</td></tr>
          ) : (
            tasks.map(task => (
              <tr key={task._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "12px" }}><strong>{task.Title}</strong></td>
                <td style={{ padding: "12px", color: "#666" }}>{task.Description || "---"}</td>
                <td style={{ padding: "12px" }}>
                  <select
                    value={task.Status}
                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                    style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ddd" }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
                <td style={{ padding: "12px" }}>
                  {task.FileId ? (
                    <button onClick={() => downloadFile(task._id)} style={{ background: "#10b981", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px", cursor: "pointer" }}>
                      📥 Download
                    </button>
                  ) : (
                    <span style={{ color: "#aaa", fontSize: "12px" }}>No attachment</span>
                  )}
                </td>
                <td style={{ padding: "12px" }}>
                  <label style={{ background: "#3b82f6", color: "white", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}>
                    {uploading === task._id ? "Uploading..." : "📁 Upload"}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => handleFileUpload(task._id, e.target.files[0])}
                    />
                  </label>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* --- LEAVE SECTION (Fixing Visibility) --- */}
      {isAdmin && (
        <div style={{ marginTop: "50px" }}>
          <h3>Leave Applications</h3>
          <table className="excel-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                <th style={{ padding: "12px" }}>Date</th>
                <th style={{ padding: "12px" }}>Reason</th>
                <th style={{ padding: "12px" }}>Employee</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan="3" style={{ padding: "20px", textAlign: "center", color: "#999" }}>No leave requests.</td></tr>
              ) : (
                leaves.map(leave => (
                  <tr key={leave._id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "12px" }}>{leave.Date}</td>
                    <td style={{ padding: "12px" }}>{leave.Reason}</td>
                    <td style={{ padding: "12px", color: "#666" }}>{leave.EmployeeEmail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TasksWorkspace;
