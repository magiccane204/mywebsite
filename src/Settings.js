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
        setName(response.data.Name);
        
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setMessage("Error loading profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleThemeChange = (isDark) => {
    setDarkMode(isDark);
  };

  const saveSettings = async () => {
    setMessage("Saving...");
    setTimeout(() => setMessage("Settings saved successfully."), 1000);
  };

  const changePassword = async () => {
    if (!password) return;
    setMessage("Updating password...");
    setTimeout(() => { setPassword(""); setMessage("Password updated."); }, 1000);
  };

  const deleteAccount = async () => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    setMessage("Deleting account...");
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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          padding: 40px 20px;
          box-sizing: border-box;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

#settings-root.dark-theme {
  /* Change these three to match your website */
  --bg-main: #1e1f22;       /* The deep background behind everything */
  --bg-card: #2b2d31;       /* The color of the actual settings boxes */
  --border-color: #3f4147;  /* The lines separating sections */

  --text-main: #f2f3f5;
  --text-muted: #b5bac1;
  --danger-bg: rgba(218, 55, 60, 0.1);
  --input-bg: #1e1f22;
  --input-text: #dbdee1;
}

        #settings-root * {
          box-sizing: border-box;
        }

        #settings-root .settings-container {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        #settings-root .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        @media (max-width: 768px) {
          #settings-root .settings-grid { grid-template-columns: 1fr; }
        }

        #settings-root .settings-header {
          display: flex;
          align-items: center;
          gap: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
        }

        #settings-root .user-avatar-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-color), #904cfa);
          color: white;
          font-size: 32px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        #settings-root .user-title-info h2 { margin: 0 0 8px 0; font-size: 24px; }
        #settings-root .user-badge-row { display: flex; gap: 10px; margin: 0; }
        #settings-root .badge { padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        #settings-root .role-badge { background-color: rgba(88, 101, 242, 0.2); color: var(--accent-color); }
        #settings-root .company-badge { background-color: var(--border-color); color: var(--text-main); }

        #settings-root .settings-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        #settings-root .settings-card h3 {
          margin-top: 0; margin-bottom: 20px; font-size: 16px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;
        }

        #settings-root .input-group { display: flex; flex-direction: column; margin-bottom: 16px; }
        #settings-root .input-group label { font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; text-transform: uppercase; }
        
        #settings-root .input-group input, 
        #settings-root .input-group select, 
        #settings-root .danger-input {
          background-color: var(--input-bg);
          border: 1px solid transparent;
          color: var(--input-text);
          padding: 12px 14px;
          border-radius: 8px;
          font-size: 15px;
          outline: none;
          transition: border 0.2s;
        }

        #settings-root .input-group input:focus, 
        #settings-root .input-group select:focus, 
        #settings-root .danger-input:focus {
          border: 1px solid var(--accent-color);
        }

        #settings-root .disabled-input { opacity: 0.6; cursor: not-allowed; }
        #settings-root .input-hint { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
        
        #settings-root .row-group { flex-direction: row; gap: 16px; }
        #settings-root .half-width { flex: 1; display: flex; flex-direction: column; }

        #settings-root .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color); }
        #settings-root .toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
        #settings-root .toggle-info h4 { margin: 0 0 4px 0; font-size: 15px; font-weight: 500; }
        #settings-root .toggle-info p { margin: 0; font-size: 13px; color: var(--text-muted); }

        #settings-root .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        #settings-root .switch input { opacity: 0; width: 0; height: 0; }
        #settings-root .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--text-muted); transition: .4s; border-radius: 34px; }
        #settings-root .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        #settings-root input:checked + .slider { background-color: #23a559; }
        #settings-root input:checked + .slider:before { transform: translateX(20px); }

        #settings-root button { font-family: inherit; font-weight: 600; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.2s, transform 0.1s; }
        #settings-root button:active { transform: translateY(1px); }

        #settings-root .btn-primary { width: 100%; background-color: var(--accent-color); color: white; padding: 14px; font-size: 16px; margin-top: auto; }
        #settings-root .btn-primary:hover { background-color: var(--accent-hover); }
        
        #settings-root .btn-secondary { background-color: var(--border-color); color: var(--text-main); padding: 10px 20px; }
        #settings-root .btn-secondary:hover { opacity: 0.8; }
        
        #settings-root .btn-danger { background-color: transparent; border: 1px solid var(--danger-color); color: var(--danger-color); padding: 10px 20px; }
        #settings-root .btn-danger:hover { background-color: var(--danger-color); color: white; }

        #settings-root .danger-zone { border: 1px solid var(--danger-color); background-color: var(--danger-bg); }
        #settings-root .danger-header h3 { color: var(--danger-color); margin-bottom: 4px; }
        #settings-root .danger-header p { color: var(--text-muted); font-size: 13px; margin: 0 0 20px 0; }
        #settings-root .danger-action-row { display: flex; justify-content: space-between; align-items: center; gap: 20px; }
        #settings-root .danger-info h4 { margin: 0 0 6px 0; }
        #settings-root .danger-info p { margin: 0; font-size: 13px; color: var(--text-muted); }
        #settings-root .danger-divider { height: 1px; background-color: var(--border-color); margin: 20px 0; }

        #settings-root .settings-alert { background-color: #23a559; color: white; padding: 12px; border-radius: 8px; text-align: center; font-weight: 500; margin-bottom: 24px; }
      `}</style>

      <div className="settings-container">
        

        <div className="settings-header">
          <div className="user-avatar-large">
            {name ? name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="user-title-info">
            <h2>{name || "User Profile"}</h2>
            <p className="user-badge-row">
              <span className="badge role-badge">{user?.Role}</span>
              <span className="badge company-badge">{user?.Company}</span>
            </p>
          </div>
        </div>
        {message && <div className="settings-alert">{message}</div>}

        <div className="settings-grid">

          <div className="settings-column">
            
            <div className="settings-card">
              <h3>Profile Information</h3>
              <div className="input-group">
                <label>Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter your name"
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input type="email" value={user?.Email} disabled className="disabled-input" />
                <span className="input-hint">Email cannot be changed directly. Contact support.</span>
              </div>
            </div>

            <div className="settings-card">
              <h3>Localization</h3>
              <div className="input-group row-group">
                <div className="half-width">
                  <label>Language</label>
                  <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
                <div className="half-width">
                  <label>Timezone</label>
                  <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    <option>UTC</option>
                    <option>GMT</option>
                    <option>EST</option>
                    <option>PST</option>
                    <option>IST</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          <div className="settings-column">
            
            <div className="settings-card">
              <h3>App Preferences</h3>
              
              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Dark Mode</h4>
                  <p>Switch between light and dark themes</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={darkMode} onChange={(e) => handleThemeChange(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Email Notifications</h4>
                  <p>Receive system alerts via email</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Public Profile</h4>
                  <p>Allow other tenant members to see your info</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={publicProfile} onChange={() => setPublicProfile(!publicProfile)} />
                  <span className="slider round"></span>
                </label>
              </div>
              
              <div className="toggle-row">
                <div className="toggle-info">
                  <h4>Auto-Logout</h4>
                  <p>Log out after 30 minutes of inactivity</p>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={autoLogout} onChange={() => setAutoLogout(!autoLogout)} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>

            <button className="btn-primary" onClick={saveSettings}>
              Save All Changes
            </button>

          </div>
        </div>


        <div className="settings-card danger-zone">
          <div className="danger-header">
            <h3>Danger Zone</h3>
            <p>Destructive actions that cannot be easily undone.</p>
          </div>
          
          <div className="danger-action-row">
            <div className="danger-info">
              <h4>Update Password</h4>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter new password"
                className="danger-input"
              />
            </div>
            <button className="btn-secondary" onClick={changePassword}>Update</button>
          </div>

          <div className="danger-divider"></div>

          <div className="danger-action-row">
            <div className="danger-info">
              <h4>Delete Account</h4>
              <p>Permanently remove your SuperAdmin access and data.</p>
            </div>
            <button className="btn-danger" onClick={deleteAccount}>Delete Account</button>
          </div>
        </div>

      </div>
    </div>
  );
}
