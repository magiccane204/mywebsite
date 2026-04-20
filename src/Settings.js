import React, { useEffect, useState } from "react";
import api from "./api.js"; 

export default function Settings() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
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
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/me'); 
        
        setUser({
          Email: response.data.Email,
          Role: response.data.Role,
          Company: response.data.Company 
        });
        
        setName(response.data.Name || "");
        setLanguage(response.data.Language || "English");
        setTimezone(response.data.Timezone || "UTC");
        setDarkMode(response.data.DarkMode ?? true);
        setEmailNotif(response.data.EmailNotifications ?? true);
        setPublicProfile(response.data.PublicProfile ?? false);
        setAutoLogout(response.data.AutoLogout ?? false);
        
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setMessage("Error loading profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const saveSettings = async () => {
    setMessage("Saving...");
    try {
      await api.put('/api/me/settings', {
        Name: name,
        Language: language,
        Timezone: timezone,
        DarkMode: darkMode,
        EmailNotifications: emailNotif,
        PublicProfile: publicProfile,
        AutoLogout: autoLogout
      });
      setMessage("Settings saved successfully.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to save settings.");
    }
  };

  const changePassword = async () => {
    if (!password) {
      setMessage("Please enter a new password.");
      return;
    }
    setMessage("Updating password...");
    try {
      await api.put('/api/me/password', { password });
      setPassword(""); 
      setMessage("Password updated successfully.");
    } catch (err) {
      console.error(err);
      setMessage("Failed to update password.");
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    setMessage("Deleting account...");
    try {
      await api.delete('/api/me');
      localStorage.removeItem("token"); 
      window.location.href = "/login"; 
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete account.");
    }
  };

  if (loading) return <div style={{ padding: "40px", fontFamily: "sans-serif" }}>Loading your workspace...</div>;

  return (
    <div id="settings-root" className={darkMode ? "dark-theme" : "light-theme"}>
      <style>{`
        #settings-root {
          --bg-main: #f2f3f5;
          --bg-card: #ffffff;
          --text-main: #313338;
          --text-muted: #6d6f78;
          --border-color: #e3e5e8;
          --accent-color: #5865F2;
          --accent-hover: #4752c4;
          --danger-color: #da373c;
          --danger-bg: #fae6e6;
          --input-bg: #e3e5e8;
          --input-text: #313338;
          width: 100%;
          min-height: 100vh;
          background-color: var(--bg-main);
          color: var(--text-main);
          font-family: 'Inter', -apple-system, sans-serif;
          padding: 40px 20px;
          box-sizing: border-box;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        #settings-root.dark-theme {
          --bg-main: #1e1f22; --bg-card: #2b2d31; --border-color: #3f4147;
          --text-main: #f2f3f5; --text-muted: #b5bac1; --danger-bg: rgba(218, 55, 60, 0.1);
          --input-bg: #1e1f22; --input-text: #dbdee1;
        }

        #settings-root * { box-sizing: border-box; }
        #settings-root .settings-container { max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
        #settings-root .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        @media (max-width: 768px) { #settings-root .settings-grid { grid-template-columns: 1fr; } }

        #settings-root .settings-header { display: flex; align-items: center; gap: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color); }
        #settings-root .user-avatar-large { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-color), #904cfa); color: white; font-size: 32px; font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        #settings-root .user-title-info h2 { margin: 0 0 8px 0; font-size: 24px; }
        #settings-root .badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-right: 8px; }
        #settings-root .role-badge { background-color: rgba(88, 101, 242, 0.2); color: var(--accent-color); }
        #settings-root .company-badge { background-color: var(--border-color); color: var(--text-main); }

        #settings-root .settings-card { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; }
        #settings-root .settings-card h3 { margin-top: 0; margin-bottom: 20px; font-size: 14px; text-transform: uppercase; color: var(--text-muted); }

        #settings-root .input-group { display: flex; flex-direction: column; margin-bottom: 16px; }
        #settings-root .input-group label { font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; }
        #settings-root input, #settings-root select { background-color: var(--input-bg); border: 1px solid transparent; color: var(--input-text); padding: 12px; border-radius: 8px; outline: none; }
        
        #settings-root .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color); }
        #settings-root .toggle-row:last-child { border-bottom: none; }
        #settings-root .toggle-info h4 { margin: 0; font-size: 15px; }
        #settings-root .toggle-info p { margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted); }

        #settings-root .switch { position: relative; width: 44px; height: 24px; }
        #settings-root .switch input { opacity: 0; width: 0; height: 0; }
        #settings-root .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #80848e; transition: .4s; border-radius: 34px; }
        #settings-root .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        #settings-root input:checked + .slider { background-color: #23a559; }
        #settings-root input:checked + .slider:before { transform: translateX(20px); }

        #settings-root .btn-primary { width: 100%; background-color: var(--accent-color); color: white; padding: 14px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; margin-top: 20px; }
        #settings-root .btn-danger { background-color: transparent; border: 1px solid var(--danger-color); color: var(--danger-color); padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        #settings-root .danger-zone { border: 1px solid var(--danger-color); background-color: var(--danger-bg); margin-top: 24px; }
      `}</style>

      <div className="settings-container">
        
        <div className="settings-header">
          <div className="user-avatar-large">
            {name ? name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-title-info">
            <h2>{name || "User Profile"}</h2>
            <div>
              <span className="badge role-badge">{user?.Role}</span>
              <span className="badge company-badge">{user?.Company}</span>
            </div>
          </div>
        </div>
        
        {message && <div style={{ background: '#23a559', color: 'white', padding: '12px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>{message}</div>}

        <div className="settings-grid">
          {/* Column 1 */}
          <div className="settings-column">
            <div className="settings-card">
              <h3>Profile Information</h3>
              <div className="input-group">
                <label>Display Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" value={user?.Email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Email cannot be changed directly.</p>
              </div>
            </div>

            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3>Localization</h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    <option>UTC</option>
                    <option>IST</option>
                    <option>EST</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="settings-column">
            <div className="settings-card">
              <h3>App Preferences</h3>
              
              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Dark Mode</h4>
                  <p>Switch between light and dark themes</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Email Notifications</h4>
                  <p>Receive system alerts via email</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Public Profile</h4>
                  <p>Allow other members to see your info</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={publicProfile} onChange={(e) => setPublicProfile(e.target.checked)} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <button className="btn-primary" onClick={saveSettings}>Save All Changes</button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-card danger-zone">
          <h3 style={{ color: '#da373c' }}>Danger Zone</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0 }}>Delete Account</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Permanently remove your data.</p>
            </div>
            <button className="btn-danger" onClick={deleteAccount}>Delete Account</button>
          </div>
        </div>

      </div>
    </div>
  );
}
