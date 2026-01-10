// Settings.js — FIXED (correct routes + works with backend)

import React, { useState, useEffect } from "react";
import api from "./api";
import "./CRM.css";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    api
      .get("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        setDarkMode(res.data.DarkMode || false);
      })
      .catch(() => setMessage("Failed to load settings"));
  }, []);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const handleToggleDarkMode = async () => {
    const newMode = !darkMode;

    try {
      await api.put(
        "/api/me/darkmode",
        { DarkMode: newMode },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setDarkMode(newMode);
      setMessage(`Dark mode ${newMode ? "enabled" : "disabled"}`);
    } catch {
      setMessage("Failed to update dark mode");
    }
  };

  if (!user) return <div className="settings">Loading...</div>;

  return (
    <div className="settings">
      <h2>Settings</h2>

      <p><b>Name:</b> {user.Name}</p>
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
