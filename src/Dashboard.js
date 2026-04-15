import React, { useState, useEffect, useCallback, useMemo } from "react";
import ChatWidget from "./ChatWidget";
import Employee from "./Employee";
import TasksWorkspace from "./TasksWorkspace";
import Settings from "./Settings";
import LeaveManagement from "./LeaveManagement";
import Reports from "./Reports";
import CRM from "./CRM";                    // ← Added
import api from "./api";

// Live Clock Hook
const useClock = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
};

const Dashboard = ({ setMode }) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total: 0, avgSalary: 0, maxSalary: 0, minSalary: 0, roles: [] });
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const currentTime = useClock();

  // Sync Engine
  const syncSystem = useCallback(async () => {
    try {
      const [meRes, reportRes, leaveRes] = await Promise.all([
        api.get("/api/me"),
        api.get("/api/reports"),
        api.get("/api/leaves")
      ]);

      const userData = meRes.data;
      setUser(userData);
      setStats(reportRes.data);
      setLeaves(leaveRes.data);
      setIsDarkMode(userData.DarkMode || true);

      // Persist identity
      localStorage.setItem("userRole", userData.Role);
      localStorage.setItem("userCompany", userData.Company);
      localStorage.setItem("userName", userData.Name);
      localStorage.setItem("userEmail", userData.Email);
    } catch (err) {
      console.error("SYNC_FAIL:", err);
      setNotifications([{ type: 'error', msg: 'Backend synchronization offline.' }]);
    }
  }, []);

  useEffect(() => {
    syncSystem();
    const heartbeat = setInterval(syncSystem, 30000);
    return () => clearInterval(heartbeat);
  }, [syncSystem]);

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    try {
      await api.put("/api/me/darkmode", { DarkMode: newMode });
      setIsDarkMode(newMode);
    } catch (err) {
      console.warn("Theme sync failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  const dailyMetrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      onLeave: leaves.filter(l => l.Date === today).length,
      recentJoins: stats.total > 10 ? Math.floor(stats.total * 0.05) : 2,
    };
  }, [leaves, stats]);

  return (
    <div className={`system-shell ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      <style>{`
        :root {
          --accent: #7c3aed;
          --accent-glow: rgba(124, 58, 237, 0.45);
          --sidebar-w: 280px;
          --sidebar-w-slim: 82px;
          --transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dark-theme {
          --bg-sidebar: #0b0a1a;
          --bg-viewport: #0f0e24;
          --bg-card: #161533;
          --text-main: #ffffff;
          --text-dim: #94a3b8;
          --border: #2d2b55;
        }
        .light-theme {
          --bg-sidebar: #ffffff;
          --bg-viewport: #f8fafc;
          --bg-card: #ffffff;
          --text-main: #0f172a;
          --text-dim: #64748b;
          --border: #e2e8f0;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        .system-shell {
          display: flex; width: 100vw; height: 100vh; background: var(--bg-viewport);
          color: var(--text-main); font-family: 'Inter', system-ui, sans-serif; overflow: hidden;
        }

        /* Sidebar */
        .sidebar-pillar {
          width: ${isCollapsed ? 'var(--sidebar-w-slim)' : 'var(--sidebar-w)'};
          background: var(--bg-sidebar); border-right: 1px solid var(--border);
          display: flex; flex-direction: column; transition: var(--transition);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5); z-index: 500;
        }
        .brand-zone { padding: 28px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
        .logo-text { font-weight: 900; font-size: 1.45rem; letter-spacing: -0.6px; display: flex; align-items: center; gap: 10px; }
        .logo-icon { background: var(--accent); color: white; padding: 7px 14px; border-radius: 10px; font-size: 1.1rem; box-shadow: 0 0 20px var(--accent-glow); }

        .nav-scroller { flex: 1; overflow-y: auto; padding: 20px 0; }
        .nav-label { font-size: 10px; color: var(--text-dim); padding: 20px 25px 8px; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px; }
        .nav-btn {
          width: 100%; padding: 14px 25px; border: none; background: transparent;
          color: inherit; display: flex; align-items: center; gap: 14px; cursor: pointer;
          transition: all 0.25s ease; position: relative; font-size: 14.5px;
        }
        .nav-btn.active {
          background: linear-gradient(90deg, var(--accent) 0%, transparent 100%);
          color: white; font-weight: 600;
        }
        .nav-btn.active::after {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: white;
        }
        .nav-btn:hover:not(.active) { background: rgba(124, 58, 237, 0.08); }

        .sidebar-footer { padding: 20px; border-top: 1px solid var(--border); }

        /* Main Area */
        .main-viewport { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .top-nav {
          height: 82px; background: var(--bg-sidebar); border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between; padding: 0 40px;
        }
        .search-container { position: relative; width: 420px; }
        .search-input {
          width: 100%; background: var(--bg-viewport); border: 1px solid var(--border);
          padding: 12px 48px; border-radius: 14px; color: var(--text-main); font-size: 14.5px;
        }
        .search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); opacity: 0.6; }

        .user-block { display: flex; align-items: center; gap: 18px; }
        .clock-box {
          font-family: monospace; background: var(--bg-viewport); padding: 6px 16px;
          border-radius: 9999px; font-weight: 700; border: 1px solid var(--border); font-size: 14px;
        }
        .avatar {
          width: 46px; height: 46px; border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #38bdf8);
          border: 3px solid var(--border); cursor: pointer;
        }

        .content-wrap { flex: 1; overflow-y: auto; padding: 40px; }
        .widget-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
        .card-stat {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 22px;
          padding: 28px; transition: all 0.3s ease;
        }
        .card-stat:hover { transform: translateY(-6px); border-color: var(--accent); box-shadow: 0 15px 35px rgba(0,0,0,0.3); }
        .stat-label { font-size: 11.5px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .stat-val { font-size: 3.4rem; font-weight: 900; line-height: 1; margin-bottom: 8px; }
      `}</style>

      {/* Sidebar */}
      <aside className="sidebar-pillar">
        <div className="brand-zone">
          <div className="logo-text">
            <span className="logo-icon">D&T</span>
            {!isCollapsed && "HRMS"}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} style={{background:'none', border:'none', color:'var(--text-dim)', fontSize:'1.4rem', cursor:'pointer'}}>
            {isCollapsed ? "❯" : "❮"}
          </button>
        </div>

        <nav className="nav-scroller">
          <div className="nav-group">
            {!isCollapsed && <div className="nav-label">Core Ops</div>}
            <button className={`nav-btn ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
              📊 {!isCollapsed && "Command Center"}
            </button>
            <button className={`nav-btn ${activePage === 'leaves' ? 'active' : ''}`} onClick={() => setActivePage('leaves')}>
              📅 {!isCollapsed && "Leave Control"}
            </button>
          </div>

          <div className="nav-group">
            {!isCollapsed && <div className="nav-label">Personnel</div>}
            <button className={`nav-btn ${activePage === 'employees' ? 'active' : ''}`} onClick={() => setActivePage('employees')}>
              👥 {!isCollapsed && "Staff Directory"}
            </button>
            <button className={`nav-btn ${activePage === 'tasks' ? 'active' : ''}`} onClick={() => setActivePage('tasks')}>
              📂 {!isCollapsed && "Task Workspace"}
            </button>
            <button className={`nav-btn ${activePage === 'reports' ? 'active' : ''}`} onClick={() => setActivePage('reports')}>
              📈 {!isCollapsed && "Financial Reports"}
            </button>
          </div>

          <div className="nav-group">
            {!isCollapsed && <div className="nav-label">Analytics</div>}
            <button className={`nav-btn ${activePage === 'crm' ? 'active' : ''}`} onClick={() => setActivePage('crm')}>
              📊 {!isCollapsed && "CRM & Analytics"}
            </button>
          </div>

          <div className="nav-group" style={{ marginTop: 'auto' }}>
            {!isCollapsed && <div className="nav-label">Configuration</div>}
            <button className={`nav-btn ${activePage === 'settings' ? 'active' : ''}`} onClick={() => setActivePage('settings')}>
              ⚙️ {!isCollapsed && "System Settings"}
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="status-box" style={{background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '16px', borderRadius: '14px'}}>
              <div style={{fontSize:'13px', fontWeight:700}}>Live Node: {user?.Company || "HQ"}</div>
              <div style={{fontSize:'11px', opacity:0.7, marginTop:'4px'}}>Session • Secure</div>
            </div>
          )}
          <button className="logout-final" onClick={handleLogout} style={{marginTop:'16px', width:'100%', padding:'13px', background:'#ef444415', color:'#ef4444', border:'1px solid #ef444430', borderRadius:'10px', fontWeight:800, cursor:'pointer'}}>
            ⏻ {!isCollapsed && "Terminate Session"}
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-viewport">
        <header className="top-nav">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input type="text" className="search-input" placeholder="Search employees, reports, or telemetry..." />
          </div>

          <div className="user-block">
            <button onClick={toggleTheme} style={{background:'none', border:'none', fontSize:'1.6rem', cursor:'pointer'}}>
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <div className="clock-box">{currentTime}</div>

            <div className="user-info" style={{textAlign:'right', lineHeight:'1.3'}}>
              <div style={{fontWeight:800, fontSize:'15.5px'}}>{user?.Name || "Super Admin"}</div>
              <div style={{fontSize:'11px', color:'var(--accent)', fontWeight:700}}>{user?.Role?.toUpperCase()}</div>
            </div>
            <div className="avatar" />
          </div>
        </header>

        <section className="content-wrap">
          {activePage === "dashboard" && (
            <div>
              <div style={{marginBottom: '40px'}}>
                <h1 style={{fontSize: '2.4rem', fontWeight: 800}}>Command Center</h1>
                <p style={{color: 'var(--text-dim)', marginTop: '8px'}}>Real-time overview of <strong>{user?.Company}</strong> operations</p>
              </div>

              <div className="widget-grid">
                {/* Your existing dashboard cards remain here... */}
                {/* (I kept them similar but you can enhance further) */}
                <div className="card-stat">
                  <div className="stat-label">Total Personnel</div>
                  <div className="stat-val" style={{color: 'var(--accent)'}}>{stats.total}</div>
                </div>
                <div className="card-stat">
                  <div className="stat-label">Today on Leave</div>
                  <div className="stat-val" style={{color: '#ef4444'}}>{dailyMetrics.onLeave}</div>
                </div>
                <div className="card-stat">
                  <div className="stat-label">Avg Salary</div>
                  <div className="stat-val" style={{fontSize: '2.3rem'}}>₹{stats.avgSalary?.toLocaleString() || '0'}</div>
                </div>
                <div className="card-stat">
                  <div className="stat-label">New Joinees</div>
                  <div className="stat-val" style={{color: '#10b981'}}>{dailyMetrics.recentJoins}</div>
                </div>
              </div>
            </div>
          )}

          {/* Module Rendering */}
          {activePage === "employees" && <Employee user={user} />}
          {activePage === "tasks" && <TasksWorkspace user={user} />}
          {activePage === "leaves" && <LeaveManagement user={user} />}
          {activePage === "reports" && <Reports user={user} />}
          {activePage === "settings" && <Settings user={user} refresh={syncSystem} />}
          {activePage === "crm" && <CRM setMode={setMode} />}   {/* ← CRM Added */}
        </section>

        <ChatWidget user={user} />
      </main>
    </div>
  );
};

export default Dashboard;
