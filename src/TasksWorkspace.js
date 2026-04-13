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

  const rawRole = (localStorage.getItem("role") || "").trim();
  const isAdmin = rawRole === "Admin" || rawRole === "SuperAdmin";

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
    } catch (err) {}
  }

  async function loadEmployees() {
    try {
      const res = await api.get("/Employees", getHeaders());
      setEmployees(res.data);
    } catch (err) {}
  }

  async function createTask() {
    if (!title || !description || !employeeEmail) {
      alert("Fill all fields");
      return;
    }

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
  }

  async function updateTaskStatus(id, status) {
    await api.put(`/tasks/status/${id}`, { Status: status }, getHeaders());
    loadTasks();
  }

  async function handleFileUpload(id, file) {
    if (!file) return;

    setUploadingId(id);

    const formData = new FormData();
    formData.append("file", file);

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

    setUploadingId(null);
    loadTasks();
  }

  function downloadFile(id) {
    const token = localStorage.getItem("token");
    window.open(
      `https://mywebsite-im3c.onrender.com/api/tasks/file/${id}?token=${token}`
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Task Workspace</h2>

      {isAdmin && (
        <button onClick={() => setShowTaskModal(true)}>
          Create Task
        </button>
      )}

      {showTaskModal && (
        <div>
          <input
            placeholder="Title"
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
            <option value="">Select</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp.Email}>
                {emp.Name}
              </option>
            ))}
          </select>

          <button onClick={createTask}>Send</button>
        </div>
      )}

      <table>
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
              <td>{task.Title}</td>
              <td>{task.Description}</td>

              <td>
                <select
                  value={task.Status}
                  onChange={e =>
                    updateTaskStatus(task._id, e.target.value)
                  }
                >
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                </select>
              </td>

              <td>
                {task.FileId && (
                  <button onClick={() => downloadFile(task._id)}>
                    Download
                  </button>
                )}
              </td>

              <td>
                <input
                  type="file"
                  onChange={e =>
                    handleFileUpload(task._id, e.target.files[0])
                  }
                />
                {uploadingId === task._id && "..."}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TasksWorkspace;
