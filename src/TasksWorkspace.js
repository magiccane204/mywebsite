import React, { useEffect, useState } from "react";
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
  const [uploadingId, setUploadingId] = useState(null);

  // ✅ FIX: Matching your MongoDB screenshot exactly ("Admin" / "SuperAdmin")
  const rawRole = (localStorage.getItem("role") || "").trim();
  const isAdmin = rawRole === "Admin" || rawRole === "SuperAdmin";
  const userEmail = localStorage.getItem("email");

  // ✅ HELPER: Always get fresh token from storage
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

  // ================= DATA FETCHING =================

  async function loadTasks() {
    try {
      const res = await api.get("/tasks", getHeaders());
      setTasks(res.data);
    } catch (err) { console.log("Task fetch error:", err); }
  }

  async function loadEmployees() {
    try {
      const res = await api.get("/Employees", getHeaders());
      setEmployees(res.data);
    } catch (err) { console.log("Employee fetch error:", err); }
  }

  async function loadLeaves() {
    try {
      const res = await api.get("/leaves", getHeaders());
      setLeaves(res.data);
    } catch (err) { console.log("Leave fetch error:", err); }
  }

  // ================= TASK ACTIONS =================

  async function createTask() {
    if (!title || !description || !employeeEmail) {
      alert("Please fill all task fields");
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

  async function handleFileUpload(id, file) {
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
      alert("File uploaded successfully");
      loadTasks();
    } catch (err) { alert("Upload failed"); } finally { setUploadingId(null); }
  }

  function downloadFile(id) {
    const token = localStorage.getItem("token");
    window.open(`https://mywebsite-im3c.onrender.com/api/tasks/file/${id}?token=${token}`, "_blank");
  }

  // ================= LEAVE ACTIONS =================

  async function applyLeave() {
    if (!leaveDate || !leaveReason) { alert("Fill all fields"); return; }
    try {
      await api.post("/leaves", { Date: leaveDate, Reason: leaveReason }, getHeaders());
      setLeaveDate(""); setLeaveReason(""); setShowLeaveModal(false);
      loadLeaves();
    } catch (err) { console.log("Leave application failed", err); }
  }

  // ✅ NEW: Accept/Reject Leaves
  async function updateLeaveStatus(id, status) {
    try {
      // NOTE: Requires app.put("/api/leaves/status/:id") on your backend
      await api.put(`/leaves/status/${id}`, { Status: status }, getHeaders());
      loadLeaves();
    } catch (err) { alert("Failed to update leave status"); }
  }

  // ================= UI RENDER =================

  return (
    <div style={{ padding: "20px" }}>
      
      {/* HEADER: Keeping Buttons Grouped */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Task Workspace</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          {isAdmin && (
            <button 
              onClick={() => setShowTaskModal(true)} 
              style={{ background: "#7c3aed", color: "white", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              ➕ Create Task
            </button>
          )}
          <button 
            onClick={() => setShowLeaveModal(true)} 
            style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid #ddd", cursor: "pointer" }}
          >
            📅 Apply Leave
          </button>
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      {showTaskModal && (
        <div className="chart-modal" onClick={() => setShowTaskModal(false)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Assign New Task</h3>
            <input 
              placeholder="Task Title" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
            />
            <textarea 
              placeholder="Description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
            />
            <select 
              value={employeeEmail} 
              onChange={e => setEmployeeEmail(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp.Email}>{emp.Name} ({emp.Email})</option>
              ))}
            </select>
            <button onClick={createTask}>Send Task</button>
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL */}
      {showLeaveModal && (
        <div className="chart-modal" onClick={() => setShowLeaveModal(false)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Request Leave</h3>
            <input 
              type="date" 
              value={leaveDate} 
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setLeaveDate(e.target.value)} 
            />
            <textarea 
              placeholder="Reason" 
              value={leaveReason} 
              onChange={e => setLeaveReason(e.target.value)} 
            />
            <button onClick={applyLeave}>Submit Application</button>
          </div>
        </div>
      )}

      {/* TASK TABLE */}
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
          {tasks.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No tasks found.</td></tr>
          ) : (
            tasks.map(task => (
              <tr key={task._id}>
                <td><strong>{task.Title}</strong></td>
                <td>{task.Description}</td>
                <td>
                  <select 
                    value={task.Status} 
                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>
                <td>
                  {task.FileId ? (
                    <button onClick={() => downloadFile(task._id)} style={{ background: "#10b981", color: "white", border: "none", borderRadius: "4px", padding: "5px 10px" }}>
                      Download
                    </button>
                  ) : <span style={{ color: "#888" }}>None</span>}
                </td>
                <td>
                  <input 
                    type="file" 
                    onChange={(e) => handleFileUpload(task._id, e.target.files[0])} 
                  />
                  {uploadingId === task._id && " ..."}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* LEAVE SECTION */}
      {/* ✅ FIXED: Now using isAdmin check for SuperAdmin/Admin visibility */}
      {isAdmin && (
        <div style={{ marginTop: "50px" }}>
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
              {leaves.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No leave records found.</td></tr>
              ) : (
                leaves.map(leave => (
                  <tr key={leave._id}>
                    <td>{leave.Date}</td>
                    <td>{leave.Reason}</td>
                    <td style={{ fontWeight: 'bold', color: leave.Status === "Accepted" ? "#10b981" : leave.Status === "Rejected" ? "#ef4444" : "#f59e0b" }}>
                      {leave.Status || "Pending"}
                    </td>
                    <td>
                      <button 
                        onClick={() => updateLeaveStatus(leave._id, "Accepted")}
                        style={{ background: "#10b981", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => updateLeaveStatus(leave._id, "Rejected")}
                        style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", marginLeft: "8px" }}
                      >
                        Reject
                      </button>
                    </td>
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
