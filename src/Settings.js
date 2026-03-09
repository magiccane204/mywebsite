import React, { useEffect, useState } from "react";
import api from "./api.js";
import "./CRM.css";

export default function Settings() {

  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [autoLogout, setAutoLogout] = useState(false);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [language, setLanguage] = useState("English");
  const [timezone, setTimezone] = useState("UTC");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/me")
      .then((res) => {
        const data = res.data;

        setUser(data);
        setDarkMode(data.DarkMode || false);
        setEmailNotif(data.EmailNotifications ?? true);
        setPublicProfile(data.PublicProfile ?? false);
        setAutoLogout(data.AutoLogout ?? false);

        setName(data.Name || "");
        setLanguage(data.Language || "English");
        setTimezone(data.Timezone || "UTC");
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

  const saveSettings = async () => {
    try {
      await api.put("/api/me/settings", {
        DarkMode: darkMode,
        EmailNotifications: emailNotif,
        PublicProfile: publicProfile,
        AutoLogout: autoLogout,
        Name: name,
        Language: language,
        Timezone: timezone
      });

      setMessage("Settings saved successfully");
    } catch {
      setMessage("Failed to save settings");
    }
  };

  const changePassword = async () => {
    try {
      await api.put("/api/me/password", { password });
      setPassword("");
      setMessage("Password updated");
    } catch {
      setMessage("Failed to update password");
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Delete your account permanently?")) return;

    try {
      await api.delete("/api/me");
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch {
      setMessage("Failed to delete account");
    }
  };

  if (loading) return <div className="settings">Loading...</div>;
  if (!user) return <div className="settings">Unable to load settings</div>;

  return (
    <div className="settings-wrapper">

      <div className="settings">

        <h2>Account Settings</h2>

        <p><b>Email:</b> {user.Email}</p>
        <p><b>Role:</b> {user.Role}</p>
        <p><b>Company:</b> {user.Company}</p>

        <h3>Profile</h3>

        <input
          type="text"
          value={name}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
        />

        <h3>Preferences</h3>

        <label>
          <input
            type="checkbox"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
          />
          Dark Mode
        </label>

        <label>
          <input
            type="checkbox"
            checked={emailNotif}
            onChange={() => setEmailNotif(!emailNotif)}
          />
          Email Notifications
        </label>

        <label>
          <input
            type="checkbox"
            checked={publicProfile}
            onChange={() => setPublicProfile(!publicProfile)}
          />
          Public Profile
        </label>

        <label>
          <input
            type="checkbox"
            checked={autoLogout}
            onChange={() => setAutoLogout(!autoLogout)}
          />
          Auto Logout After Inactivity
        </label>

        <h3>Language</h3>

        <select value={language} onChange={(e)=>setLanguage(e.target.value)}>
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
        </select>

        <h3>Timezone</h3>

        <select value={timezone} onChange={(e)=>setTimezone(e.target.value)}>
          <option>UTC</option>
          <option>GMT</option>
          <option>EST</option>
          <option>PST</option>
          <option>IST</option>
        </select>

        <h3>Security</h3>

        <input
          type="password"
          value={password}
          placeholder="New Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button onClick={changePassword}>
          Change Password
        </button>

        <h3>Account</h3>

        <button className="save-btn" onClick={saveSettings}>
          Save Settings
        </button>

        <button className="delete-btn" onClick={deleteAccount}>
          Delete Account
        </button>

        {message && <p>{message}</p>}

      </div>
    </div>
  );
}
