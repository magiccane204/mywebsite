import React, { useState, useEffect } from "react";
import axios from "axios";
import "./CRM.css";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("loggedInUser");
    if (!email) return;

    axios
      .get(`http://localhost:5002/user/${email}`)
      .then((res) => {
        setUser(res.data);
        setDarkMode(res.data.DarkMode || false);
      })
      .catch(() => setMessage("⚠️ Failed to load user settings"));
  }, []);

  const handleToggleDarkMode = async () => {
    if (!user) return;
    const newMode = !darkMode;

    try {
      await axios.put(`http://localhost:5002/user/${user.Email}/darkmode`, {
        DarkMode: newMode,
      });
      setDarkMode(newMode);
      setMessage(`✅ Dark mode ${newMode ? "enabled" : "disabled"}`);
    } catch {
      setMessage("❌ Failed to update dark mode");
    }
  };

  if (!user) return <div className="settings">Loading settings...</div>;

  return (
    <div className="settings">
      <h2>⚙️ Settings</h2>
      <div className="settings-card">
        <p><strong>Name:</strong> {user.Name}</p>
        <p><strong>Email:</strong> {user.Email}</p>
        <p><strong>Role:</strong> {user.Role}</p>
        <p><strong>Company:</strong> {user.Company}</p>

        <div className="toggle-section">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={handleToggleDarkMode}
            />
            Enable Dark Mode
          </label>
        </div>
      </div>

      {message && <p className="settings-message">{message}</p>}
    </div>
  );
}
