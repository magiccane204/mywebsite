import React, { useState, useEffect, useCallback, useMemo } from "react";
/** * --- DYNAMIC BACKEND INTEGRATION ---
 * Using your api.js which is already configured with the base URL and Auth headers.
 */
import EmployeeModule from "./Employee"; 
import SettingsModule from "./Settings";
import api from "./api";

const Sidebar = ({ activePage, setActivePage, isCollapsed, setIsCollapsed, onLogout, user }) => {
  const navSections = [
    {
      group: "MAIN",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "🏠" },
        { id: "leave_mgmt", label: "Leave Management", icon: "📋" },
        { id: "settings", label: "Settings", icon: "⚙️" },
      ]
    },
    {
      group: "TEAM MANAGEMENT",
      items: [
        { id: "employees", label: "Employees", icon: "👥" },
        { id: "tasks", label: "Project Tasks", icon: "📂" },
      ]
    }
  ];

  return (
    <aside className={`app-sidebar-pillar ${isCollapsed ? "is-collapsed" : "is-expanded"}`}>
      <div className="sidebar-branding">
        <div className="brand-logo" style={{background: 'var(--accent)', padding: '8px', borderRadius: '8px', color: 'white', fontWeight:'bold'}}>HRM</div>
        {!isCollapsed && <span style={{marginLeft:'10px', fontWeight:'800'}}>D&T</span>}
        <button className="toggle-control" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? "❯" : "❮"}
        </button>
      </div>

      <nav className="sidebar-nav-list">
        {navSections.map((section, idx) => (
          <div key={idx} className="nav-section-group">
            {!isCollapsed && <div className="nav-section-title">{section.group}</div>}
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`nav-anchor ${activePage === item.id ? "is-active" : ""}`}
                onClick={() => setActivePage(item.id)}
              >
                <span className="nav-icon-box">{item.icon}</span>
                {!isCollapsed && <span className="primary-label">{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="announcement-card">
          <div className="ann-title">System Status</div>
          <p style={{fontSize:'10px', opacity:0.8}}>Logged in as: {user?.role}</p>
          <div className="ann-tag">ACTIVE SESSION</div>
        </div>
      )}

      <div className="sidebar-footer-region">
        <button className="nav-anchor logout-action" onClick={onLogout}>
          <span className="nav-icon-box">⏻</span>
          {!isCollapsed && <span className="primary-label">Secure Logout</span>}
        </button>
      </div>
    </aside>
  );
};

const DashboardHome = ({ reportData, employees, leaves, user }) => {
  // DYNAMIC CALCULATION: On Leave Today
  const onLeaveToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return leaves.filter(l => l.Date === todayStr).length;
  }, [leaves]);

  // DYNAMIC CALCULATION: New Joinees (Last 7 Days)
  const newJoinees = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return employees.filter(emp => new Date(emp.createdAt) > weekAgo).length;
  }, [employees]);

  return (
    <div className="home-view-container">
      <div className="dashboard-header-row">
        <div className="welcome-text">
          <h1>Good Day, {user?.Name || 'User'}</h1>
          <p>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
        <button className="export-btn" onClick={() => window.print()}>📥 Generate PDF Report</button>
      </div>

      <div className="hrm-dashboard-grid">
        {/* ROW 1: DYNAMIC STATS FROM /api/reports */}
        <div className="widget-card stat-split">
          <div className="widget-meta">Total Personnel</div>
          <div className="stat-sub">
            <div className="sub-box">
              <span className="sub-val">{reportData.total || 0}</span>
              <span className="sub-label">Active Database</span>
            </div>
            <div className="sub-box">
              <span className="sub-val">{newJoinees}</span>
              <span className="sub-label">New This Week</span>
            </div>
          </div>
        </div>

        <div className="widget-card">
          <div className="widget-meta">Attendance Status</div>
          <h2 className="huge-val">{reportData.total > 0 ? 'Live' : 'No Data'}</h2>
          <div className="progress-bar-multi">
             <div className="bar-segment" style={{width: '85%', background: 'var(--accent)'}}></div>
             <div className="bar-segment" style={{width: '15%', background: '#fb7185'}}></div>
          </div>
          <p className="display-desc" style={{marginTop:'10px'}}>{onLeaveToday} Registered Leaves Today</p>
        </div>

        <div className="widget-card">
          <div className="widget-meta">Financial Health</div>
          <div className="stat-sub">
             <div className="sub-box">
                <span className="sub-val">₹{reportData.avgSalary?.toLocaleString() || 0}</span>
                <span className="sub-label">Avg. Monthly CTC</span>
             </div>
          </div>
        </div>

        {/* ROW 2: DYNAMIC ROLES FROM /api/reports */}
        <div className="widget-card span-two performance-widget">
          <div className="widget-meta">Department Composition</div>
          <div className="performance-list">
            {(reportData.roles || []).map((role, i) => (
              <div key={i} className="perf-row">
                <span className="perf-name">{role.name}</span>
                <div className="perf-bar-track">
                    <div className="perf-bar-fill" style={{width: `${(role.value / reportData.total) * 100}%`}}></div>
                </div>
                <span className="perf-val">{role.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="widget-card span-one income-widget">
          <div className="widget-meta">Salary Range Analysis</div>
          <div className="stat-row-simple">
             <div className="m-row"><span>Max:</span> <strong>₹{reportData.maxSalary?.toLocaleString()}</strong></div>
             <div className="m-row"><span>Min:</span> <strong>₹{reportData.minSalary?.toLocaleString()}</strong></div>
          </div>
        </div>

        {/* ROW 3: DYNAMIC TABLE FROM /api/Employees */}
        <div className="widget-card span-three table-widget">
          <div className="table-header">
            <h3>Recent Employee Activity</h3>
          </div>
          <table className="hrm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 5).map((emp, i) => (
                <tr key={i}>
                  <td style={{fontWeight:'bold'}}>{emp.Name}</td>
                  <td>{emp["Applied Position"]}</td>
                  <td>{emp.Email}</td>
                  <td>
                    <span className={`status-badge ${emp.locked ? 'locked' : 'active'}`}>
                        {emp.locked ? 'Terminated' : 'Full-time'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

function Dashboard({ setMode }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // DYNAMIC DATA STATES
  const [user, setUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [reportData, setReportData] = useState({});
  const [leaves, setLeaves] = useState([]);

  // FETCH ALL DATA FROM YOUR BACKEND
  const refreshData = useCallback(async () => {
    try {
      const [userRes, empRes, reportRes, leaveRes] = await Promise.all([
        api.get("/api/me"),
        api.get("/api/Employees"),
        api.get("/api/reports"),
        api.get("/api/leaves")
      ]);

      setUser(userRes.data);
      setEmployees(empRes.data);
      setReportData(reportRes.data);
      setLeaves(leaveRes.data);
      
      // Sync DarkMode from Backend
      if(userRes.data.DarkMode !== undefined) setIsDarkMode(userRes.data.DarkMode);

    } catch (err) {
      console.error("DASHBOARD_SYNC_ERROR", err);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 60000); // Auto refresh every minute
    return () => clearInterval(interval);
  }, [refreshData]);

  const handleLogout = useCallback(() => {
    localStorage.clear();
    if (setMode) setMode("login");
  }, [setMode]);

  return (
    <div className={`system-shell ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      <style>{`
        /* PRESERVING YOUR CYBER-PRO STYLING */
        .light-theme { --bg-primary: #f8fafc; --bg-card: #ffffff; --bg-side: #ffffff; --text-p: #1e293b; --text-s: #64748b; --border: #e2e8f0; --accent: #7c3aed; }
        .dark-theme { --bg-primary: #0f172a; --bg-card: #1e293b; --bg-side: #020617; --text-p: #f1f5f9; --text-s: #94a3b8; --border: #334155; --accent: #a78bfa; }
        
        .system-shell { display: flex; width: 100vw; height: 100vh; background: var(--bg-primary); color: var(--text-p); font-family: 'Inter', sans-serif; overflow: hidden; }
        .app-sidebar-pillar { width: 260px; background: var(--bg-side); border-right: 1px solid var(--border); transition: 0.3s; display: flex; flex-direction: column; padding: 20px 0; }
        .is-collapsed { width: 80px; }
        
        .nav-section-title { font-size: 10px; color: var(--text-s); padding: 20px 25px 5px; font-weight: 800; }
        .nav-anchor { padding: 12px 25px; display: flex; align-items: center; gap: 15px; color: var(--text-s); border: none; background: none; width: 100%; cursor: pointer; }
        .nav-anchor.is-active { color: var(--accent); background: #7c3aed10; border-right: 3px solid var(--accent); }
        
        .announcement-card { margin: auto 20px 20px; background: var(--accent); color: white; padding: 15px; border-radius: 12px; }
        .ann-tag { font-size: 9px; background: rgba(255,255,255,0.2); padding: 4px; border-radius: 4px; margin-top: 10px; text-align: center; }

        .system-viewport { flex: 1; overflow-y: auto; }
        .home-view-container { padding: 40px; }
        .hrm-dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .widget-card { background: var(--bg-card); border: 1px solid var(--border); padding: 25px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .span-two { grid-column: span 2; }
        .span-three { grid-column: span 3; }
        
        .huge-val { font-size: 2.8rem; font-weight: 900; color: var(--accent); letter-spacing: -1px; }
        .widget-meta { font-size: 11px; font-weight: 800; color: var(--text-s); text-transform: uppercase; margin-bottom: 15px; }
        
        .perf-row { display: flex; align-items: center; gap: 15px; margin-bottom: 12px; }
        .perf-name { width: 140px; font-size: 12px; font-weight: 600; }
        .perf-bar-track { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
        .perf-bar-fill { height: 100%; background: var(--accent); }
        
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: 700; }
        .status-badge.active { background: #10b98120; color: #10b981; }
        .status-badge.locked { background: #ef444420; color: #ef4444; }

        .hrm-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .hrm-table th { text-align: left; padding: 12px; font-size: 11px; color: var(--text-s); border-bottom: 2px solid var(--border); }
        .hrm-table td { padding: 15px 12px; font-size: 13px; border-bottom: 1px solid var(--border); }
      `}</style>

      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        onLogout={handleLogout}
        user={user}
      />

      <main className="system-viewport">
        <header className="system-navbar" style={{padding:'20px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg-card)', borderBottom:'1px solid var(--border)'}}>
           <div className="search-box">
             <input type="text" placeholder="Search employee records..." style={{background:'var(--bg-primary)', border:'1px solid var(--border)', padding:'10px 20px', borderRadius:'10px', width:'300px'}} />
           </div>
           <div className="user-meta" style={{display:'flex', alignItems:'center', gap:'20px'}}>
              <button onClick={() => setIsDarkMode(!isDarkMode)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem'}}>{isDarkMode ? '☀️' : '🌙'}</button>
              <div style={{textAlign:'right'}}>
                <div style={{fontWeight:'800', fontSize:'14px'}}>{user?.Name}</div>
                <div style={{fontSize:'10px', color:'var(--text-s)'}}>{user?.Role}</div>
              </div>
              <div style={{width:'40px', height:'40px', borderRadius:'50%', background:'var(--accent)', border:'2px solid var(--border)'}}></div>
           </div>
        </header>

        <section className="dynamic-content-area">
          {activePage === "dashboard" && (
            <DashboardHome 
                reportData={reportData} 
                employees={employees} 
                leaves={leaves} 
                user={user}
            />
          )}
          {activePage === "employees" && <EmployeeModule />}
          {activePage === "settings" && <SettingsModule />}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
