// Settings.js — FIXED (prevents infinite loading, matches backend)

import React, { useEffect, useState } from "react";
import api from "./api.js";
import "./CRM.css";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/me")
      .then((res) => {
        setUser(res.data);
        setDarkMode(res.data.DarkMode || false);
      })
      .catch(() => {
        setMessage("Failed to load settings");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleToggleDarkMode = async () => {
    const newMode = !darkMode;

    try {
      await api.put("/api/me/darkmode", { DarkMode: newMode });
      setDarkMode(newMode);
      setMessage(`Dark mode ${newMode ? "enabled" : "disabled"}`);
    } catch {
      setMessage("Failed to update dark mode");
    }
  };

  if (loading) return <div className="settings">Loading...</div>;

  if (!user)
    return <div className="settings">Unable to load user settings</div>;

  return (
    <div className="settings">
      <h2>Settings</h2>

      <p><b>Email:</b> {user.Email}</p>
      <p><b>Role:</b> {user.Role}</p>
      <p><b>Company:</b> {user.Company}</p>

      <label>
        <input
          type="checkbox"
          checked={darkMode}
          onChange={handleToggleDarkMode}
        />
        Enable Dark Mode
      </label>

      {message && <p>{message}</p>}
    </div>
  );
}

