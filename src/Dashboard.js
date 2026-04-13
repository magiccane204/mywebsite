import React, { useState, useEffect, useCallback } from "react";
/** --- YOUR EXISTING MODULES --- */
import Employee from "./Employee"; 
import TasksWorkspace from "./TasksWorkspace";
import Settings from "./Settings";
import api from "./api";

const Dashboard = ({ setMode }) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/api/me").then(res => setUser(res.data));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  return (
    <div className="system-shell dark-theme">
      <style>{`
        /* 1. CORE THEME COLORS (Matched to your image) */
        :root {
          --bg-sidebar: #0b0a1a;
          --bg-viewport: #12112a;
          --accent-purple: #7c3aed;
          --text-main: #ffffff;
          --text-muted: #64748b;
          --border-color: #2d2b55;
          --sidebar-w: 260px;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        .system-shell { display: flex; width: 100vw; height: 100vh; background: var(--bg-viewport); color: var(--text-main); font-family: 'Inter', sans-serif; }

        /* 2. SIDEBAR NAVIGATION */
        .sidebar-pillar { 
          width: var(--sidebar-w); 
          background: var(--bg-sidebar); 
          display: flex; 
          flex-direction: column; 
          border-right: 1px solid var(--border-color);
        }
        
        .sidebar-header { padding: 25px; border-bottom: 1px solid var(--border-color); }
        .brand-text { font-weight: 900; font-size: 1.4rem; letter-spacing: 1px; color: var(--text-main); }
        
        .nav-group { margin-top: 20px; }
        .group-label { font-size: 10px; font-weight: 800; color: var(--text-muted); padding: 10px 25px; text-transform: uppercase; letter-spacing: 1.5px; }

        .nav-btn { 
          width: 100%; padding: 14px 25px; border: none; background: transparent; 
          color: var(--text-main); display: flex; align-items: center; gap: 15px; 
          cursor: pointer; text-align: left; transition: 0.2s; font-size: 14px;
        }
        .nav-btn.active { background: var(--accent-purple); color: #fff; }
        .nav-btn:hover:not(.active) { background: rgba(124, 58, 237, 0.1); }

        /* 3. SIDEBAR FOOTER CARDS */
        .sidebar-footer { margin-top: auto; padding: 20px; }
        .system-status-card { 
          background: #a5b4fc30; border-radius: 15px; padding: 15px; 
          margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.1);
        }
        .status-title { font-weight: 700; font-size: 14px; margin-bottom: 5px; }
        .status-meta { font-size: 10px; color: var(--text-muted); margin-bottom: 10px; }
        .active-session-pill { 
          background: rgba(255,255,255,0.2); text-align: center; 
          padding: 6px; border-radius: 8px; font-size: 10px; font-weight: 800; 
        }

        .logout-action { 
          background: var(--accent-purple); color: #fff; width: 100%; 
          padding: 12px; border-radius: 0; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: flex-start; gap: 10px;
          font-weight: 600;
        }

        /* 4. MAIN CONTENT AREA */
        .main-viewport { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        
        .top-navbar { 
          height: 80px; display: flex; align-items: center; justify-content: space-between; 
          padding: 0 40px; border-bottom: 1px solid var(--border-color);
        }
        
        .search-input { 
          background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); 
          padding: 12px 20px; border-radius: 10px; color: #fff; width: 350px;
        }

        .user-profile-block { display: flex; align-items: center; gap: 15px; }
        .user-info { text-align: right; }
        .user-name { font-weight: 800; font-size: 15px; }
        .user-role { font-size: 10px; color: var(--text-muted); }
        .avatar-circle { width: 45px; height: 45px; background: #a5b4fc; border-radius: 50%; border: 2px solid var(--border-color); }

        .content-scroller { flex: 1; overflow-y: auto; padding: 0; }
      `}</style>

      {/* --- SIDEBAR PILLAR --- */}
      <aside className="sidebar-pillar">
        <div className="sidebar-header">
           <div className="brand-text">D&T</div>
        </div>

        <div className="nav-group">
          <div className="group-label">Main</div>
          <button className={`nav-btn ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
            📊 Dashboard
          </button>
          <button className={`nav-btn ${activePage === 'leaves' ? 'active' : ''}`} onClick={() => setActivePage('leaves')}>
            📋 Leave Management
          </button>
          <button className={`nav-btn ${activePage === 'settings' ? 'active' : ''}`} onClick={() => setActivePage('settings')}>
            ⚙️ Settings
          </button>
        </div>

        <div className="nav-group">
          <div className="group-label">Team Management</div>
          <button className={`nav-btn ${activePage === 'employees' ? 'active' : ''}`} onClick={() => setActivePage('employees')}>
            👥 Employees
          </button>
          <button className={`nav-btn ${activePage === 'tasks' ? 'active' : ''}`} onClick={() => setActivePage('tasks')}>
            📂 Project Tasks
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="system-status-card">
            <div className="status-title">System Status</div>
            <div className="status-meta">Logged in as: <strong>{user?.Role || 'Admin'}</strong></div>
            <div className="active-session-pill">ACTIVE SESSION</div>
          </div>
        </div>
        
        <button className="logout-action" onClick={handleLogout}>
          <span>⏻</span> Secure Logout
        </button>
      </aside>

      {/* --- MAIN VIEWPORT --- */}
      <main className="main-viewport">
        <header className="top-navbar">
          <input type="text" className="search-input" placeholder="Search employee records..." />
          
          <div className="user-profile-block">
            <button style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem'}}>☀️</button>
            <div className="user-info">
              <div className="user-name">{user?.Name || 'Dhruv Bhatia'}</div>
              <div className="user-role">{user?.Role || 'SuperAdmin'}</div>
            </div>
            <div className="avatar-circle"></div>
          </div>
        </header>

        <section className="content-scroller">
          {activePage === "dashboard" && <div style={{padding:'40px'}}><h1>Dashboard Stats Here</h1></div>}
          
          {/* YOUR WORKFORCE LOGIC FROM PREVIOUS SCREENSHOT */}
          {activePage === "employees" && <Employee />}
          
          {/* YOUR 500+ LINE TASKS LOGIC */}
          {activePage === "tasks" && <TasksWorkspace user={user} />}
          
          {activePage === "settings" && <Settings user={user} />}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
