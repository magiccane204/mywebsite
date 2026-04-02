import React, { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com/api"
});

function TasksWorkspace() {
  // --- STATE ---
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
  const [uploadingId, setUploadingId] = useState(null);

  // ✅ ROLE LOGIC: Case-insensitive so "SuperAdmin" always works
  const rawRole = (localStorage.getItem("role") || "").trim().toLowerCase();
  const isAdmin = rawRole === "admin" || rawRole === "superadmin";
  const userEmail = localStorage.getItem("email");

  // ✅ HELPER: Always get fresh token
  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    loadTasks();
    loadEmployees();
    loadLeaves();
  }, []);

  // ================= LOAD DATA =================

  async function loadTasks() {
    try {
      const res = await api.get("/tasks", getHeaders());
      setTasks(res.data);
    } catch (err) { console.log("Tasks error:", err); }
  }

  async function loadEmployees() {
    try {
      const res = await api.get("/Employees", getHeaders());
      setEmployees(res.data);
    } catch (err) { console.log("Employees error:", err); }
  }

  async function loadLeaves() {
    try {
      const res = await api.get("/leaves", getHeaders());
      setLeaves(res.data);
    } catch (err) { console.log("Leaves error:", err); }
  }

  // ================= CREATE TASK =================

  async function createTask() {
    if (!title || !description || !employeeEmail) {
      alert("Please fill all fields for the task");
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
    } catch (err) { alert("Failed to create task"); }
  }

  async function updateTaskStatus(id, newStatus) {
    try {
      await api.put(`/tasks/status/${id}`, { Status: newStatus }, getHeaders());
      loadTasks();
    } catch (err) { alert("Status update failed"); }
  }

  // ================= FILE HANDLING =================

  async function handleUpload(id, file) {
    if (!file) return;
    setUploadingId(id);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`https://mywebsite-im3c.onrender.com/api/tasks/upload/${id}`, formData, {
        headers: { 
          ...getHeaders().headers, 
          "Content-Type": "multipart/form-data" 
        }
      });
      alert("File uploaded!");
      loadTasks();
    } catch (err) { alert("Upload failed"); } finally { setUploadingId(null); }
  }

  function downloadFile(id) {
    const token = localStorage.getItem("token");
    window.open(`https://mywebsite-im3c.onrender.com/api/tasks/file/${id}?token=${token}`, "_blank");
  }

  // ================= LEAVE ACTIONS =================

  async function applyLeave() {
    if (!leaveDate || !leaveReason) { alert("Fill all leave fields"); return; }
    try {
      await api.post("/leaves", { Date: leaveDate, Reason: leaveReason }, getHeaders());
      setLeaveDate(""); setLeaveReason(""); setShowLeaveModal(false);
      loadLeaves();
    } catch (err) { console.log(err); }
  }

  // ✅ NEW: Accept/Reject Leaves
  async function handleLeaveDecision(id, status) {
    try {
      // NOTE: Ensure your backend has a PUT route for /api/leaves/status/:id
      await api.put(`/leaves/status/${id}`, { Status: status }, getHeaders());
      loadLeaves();
    } catch (err) { alert("Decision failed"); }
  }

  // ================= UI =================

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Task Workspace</h2>
        {/* ✅ FIXED: Button now shows correctly for SuperAdmin */}
        <div>
          {isAdmin && (
            <button 
              onClick={() => setShowTaskModal(true)} 
              style={{ background: "#7c3aed", color: "white", padding: "10px 15px", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              ➕ Create Task
            </button>
          )}
          <button 
            onClick={() => setShowLeaveModal(true)} 
            style={{ marginLeft: "10px", padding: "10px 15px", border: "1px solid #ddd", borderRadius: "5px", cursor: "pointer" }}
          >
            📅 Apply Leave
          </button>
        </div>
      </div>

      {/* --- TASK MODAL --- */}
      {showTaskModal && (
        <div className="chart-modal" onClick={() => setShowTaskModal(false)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: "25px", borderRadius: "10px" }}>
            <h3>Create New Task</h3>
            <input 
              placeholder="Task Title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              style={{ width: "100%", marginBottom: "10px", padding: "8px" }} 
            />
            <textarea 
              placeholder="Description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              style={{ width: "100%", marginBottom: "10px", padding: "8px", minHeight: "60px" }} 
            />
            <select 
              value={employeeEmail} 
              onChange={e => setEmployeeEmail(e.target.value)}
              style={{ width: "100%", marginBottom: "20px", padding: "8px" }}
            >
              <option value="">Assign To Employee...</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp.Email}>{emp.Name} ({emp.Email})</option>
              ))}
            </select>
            <button onClick={createTask} style={{ width: "100%", padding: "10px", background: "#7c3aed", color: "white", border: "none", borderRadius: "5px" }}>
              Send Task
            </button>
          </div>
        </div>
      )}

      {/* --- LEAVE MODAL --- */}
      {showLeaveModal && (
        <div className="chart-modal" onClick={() => setShowLeaveModal(false)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: "25px", borderRadius: "10px" }}>
            <h3>Apply for Leave</h3>
            <input 
              type="date" 
              value={leaveDate} 
              onChange={e => setLeaveDate(e.target.value)} 
              style={{ width: "100%", marginBottom: "10px", padding: "8px" }} 
            />
            <textarea 
              placeholder="Reason" 
              value={leaveReason} 
              onChange={e => setLeaveReason(e.target.value)} 
              style={{ width: "100%", marginBottom: "20px", padding: "8px", minHeight: "60px" }} 
            />
            <button onClick={applyLeave} style={{ width: "100%", padding: "10px", background: "#7c3aed", color: "white", border: "none", borderRadius: "5px" }}>
              Submit Application
            </button>
          </div>
        </div>
      )}

      {/* --- TASK TABLE --- */}
      <table className="excel-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Status</th>
            <th>Files</th>
            <th>Upload</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id}>
              <td><strong>{task.Title}</strong></td>
              <td>{task.Description}</td>
              <td>
                <select 
                  value={task.Status} 
                  onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                  style={{ padding: "4px" }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </td>
              <td>
                {task.FileId ? (
                  <button onClick={() => downloadFile(task._id)} style={{ background: "#10b981", color: "white", border: "none", borderRadius: "3px", padding: "4px 8px" }}>
                    Download
                  </button>
                ) : <span style={{ color: "#999" }}>None</span>}
              </td>
              <td>
                <input 
                  type="file" 
                  style={{ fontSize: "11px" }} 
                  onChange={(e) => handleUpload(task._id, e.target.files[0])} 
                />
                {uploadingId === task._id && "..."}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- LEAVE SECTION --- */}
      {/* ✅ FIXED: Now checks isAdmin boolean correctly */}
      {isAdmin && (
        <div style={{ marginTop: "40px" }}>
          <h2>Leave Applications</h2>
          <table className="excel-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map(leave => (
                <tr key={leave._id}>
                  <td>{leave.Date}</td>
                  <td>{leave.Reason}</td>
                  <td style={{ color: leave.Status === "Accepted" ? "#10b981" : leave.Status === "Rejected" ? "#ef4444" : "#f59e0b" }}>
                    {leave.Status || "Pending"}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleLeaveDecision(leave._id, "Accepted")}
                      style={{ background: "#10b981", color: "white", border: "none", padding: "5px 8px", cursor: "pointer", borderRadius: "3px" }}
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleLeaveDecision(leave._id, "Rejected")}
                      style={{ background: "#ef4444", color: "white", border: "none", padding: "5px 8px", marginLeft: "5px", cursor: "pointer", borderRadius: "3px" }}
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TasksWorkspace;
