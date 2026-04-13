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
      await api.post(
        "/tasks",
        {
          Title: title,
          Description: description,
          EmployeeEmail: employeeEmail
        },
        getHeaders()
      );

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
      await api.put(
        `/tasks/status/${id}`,
        { Status: status },
        getHeaders()
      );
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
      await axios.post(
        `https://mywebsite-im3c.onrender.com/api/tasks/upload/${id}`,
        formData,
        {
          headers: {
            ...getHeaders().headers,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      loadTasks();
    } catch {
      alert("Upload failed");
    }

    setUploadingId(null);
  }

  function downloadFile(id) {
    const token = localStorage.getItem("token");
    window.open(
      `https://mywebsite-im3c.onrender.com/api/tasks/file/${id}?token=${token}`
    );
  }

  return (
    <div style={{ padding: "20px", color: "white" }}>

      {/* HEADER */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h2>Task Workspace</h2>

        <button
          onClick={() => setShowTaskModal(true)}
          style={{
            background: "#7c3aed",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          ➕ Add Task
        </button>
      </div>

      {/* MODAL */}
      {showTaskModal && (
        <div className="chart-modal" onClick={() => setShowTaskModal(false)}>
          <div
            className="chart-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Create Task</h3>

            <input
              placeholder="Task Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <select
              value={employeeEmail}
              onChange={(e) => setEmployeeEmail(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp.Email}>
                  {emp.Name}
                </option>
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
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No tasks found
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task._id}>
                <td>{task.Title}</td>
                <td>{task.Description}</td>

                <td>
                  <select
                    value={task.Status}
                    onChange={(e) =>
                      updateTaskStatus(task._id, e.target.value)
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </td>

                <td>
                  {task.FileId ? (
                    <button onClick={() => downloadFile(task._id)}>
                      Download
                    </button>
                  ) : (
                    "None"
                  )}
                </td>

                <td>
                  <input
                    type="file"
                    onChange={(e) =>
                      handleFileUpload(task._id, e.target.files[0])
                    }
                  />
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
