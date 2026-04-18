import React, { useEffect, useState } from "react";
import axios from "axios";

const api = axios.create({
  baseURL: "https://mywebsite-im3c.onrender.com/api"
});

function TasksWorkspace() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const getHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });

  useEffect(() => {
    loadTasks();
    loadEmployees();
  }, []);

  async function loadTasks() {
    try {
      const res = await api.get("/tasks", getHeaders());
      setTasks(res.data);
    } catch {}
  }

  async function loadEmployees() {
    try {
      const res = await api.get("/Employees", getHeaders());
      setEmployees(res.data);
    } catch {}
  }

  async function createTask() {
    if (!title || !description || !employeeEmail) {
      alert("Fill all fields");
      return;
    }
    try {
      await api.post("/tasks", { Title: title, Description: description, EmployeeEmail: employeeEmail }, getHeaders());
      setTitle("");
      setDescription("");
      setEmployeeEmail("");
      setShowTaskModal(false);
      loadTasks();
    } catch {
      alert("Failed to create task");
    }
  }

  async function updateTaskStatus(id, status) {
    try {
      await api.put(`/tasks/status/${id}`, { Status: status }, getHeaders());
      loadTasks();
    } catch {
      alert("Status update failed");
    }
  }

  async function handleFileUpload(id, file) {
    if (!file) return;
    setUploadingId(id);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`https://mywebsite-im3c.onrender.com/api/tasks/upload/${id}`, formData, {
        headers: { ...getHeaders().headers, "Content-Type": "multipart/form-data" }
      });
      loadTasks();
    } catch {
      alert("Upload failed");
    }
    setUploadingId(null);
  }

  function downloadFile(id) {
    const token = localStorage.getItem("token");
    window.open(`https://mywebsite-im3c.onrender.com/api/tasks/file/${id}?token=${token}`);
  }

  return (
    <div style={{ padding: "20px", color: "white", fontFamily: "sans-serif" }}>
      
      {/* INTERNAL CSS */}
      <style>{`
        .chart-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7); /* Darkens the background */
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000; /* Ensures it's on top of the table */
        }
        .chart-modal-content {
          background: #1e1e26; /* Solid background so table doesn't bleed through */
          padding: 25px;
          border-radius: 12px;
          width: 400px;
          display: flex;
          flex-direction: column;
          gap: 15px;
          border: 1px solid #444;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }
        .chart-modal-content input, 
        .chart-modal-content textarea, 
        .chart-modal-content select {
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #444;
          background: #2d2d3a;
          color: white;
        }
        .chart-modal-content button {
          background: #7c3aed;
          color: white;
          padding: 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }
        .excel-table {
          border-collapse: collapse;
          margin-top: 10px;
          background: #1a1a21;
        }
        .excel-table th, .excel-table td {
          border: 1px solid #333;
          padding: 12px;
          text-align: left;
        }
        .excel-table th {
          background: #2d2d3a;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 1px;
        }
        select, button {
          cursor: pointer;
        }
      `}</style>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>Task Workspace</h2>
        <button
          onClick={() => setShowTaskModal(true)}
          style={{ background: "#7c3aed", color: "white", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
          ➕ Add Task
        </button>
      </div>

      {/* MODAL */}
      {showTaskModal && (
        <div className="chart-modal" onClick={() => setShowTaskModal(false)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Create New Task</h3>
            <input placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder="Description" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} />
            <select value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)}>
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp.Email}>{emp.Name}</option>
              ))}
            </select>
            <button onClick={createTask}>Create Task</button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <table className="excel-table" style={{ width: "100%" }}>
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
            <tr><td colSpan="5" style={{ textAlign: "center" }}>No tasks found</td></tr>
          ) : (
            tasks.map((task) => (
              <tr key={task._id}>
                <td>{task.Title}</td>
                <td>{task.Description}</td>
                <td>
                  <select
                    style={{ background: "#2d2d3a", color: "white", border: "1px solid #444", padding: "5px" }}
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
                    <button style={{ padding: "5px 10px" }} onClick={() => downloadFile(task._id)}>Download</button>
                  ) : "None"}
                </td>
                <td>
                  <input type="file" onChange={(e) => handleFileUpload(task._id, e.target.files[0])} />
                  {uploadingId === task._id && " ..."}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TasksWorkspace;
