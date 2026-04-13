import React, { useState, useEffect, useCallback } from "react";
/** * --- YOUR EXISTING MODULES ---
 * These are the files you already have. We are calling them 
 * exactly as they are without changing their internal code.
 */
import CRM from "./CRM"; 
import Employee from "./Employee"; 
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace"; // Your 500+ line component
import ChatWidget from "./ChatWidget";
import api from "./api";

const Dashboard = ({ setMode }) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userData, setUserData] = useState(null);

  // 1. DYNAMIC DATA SYNC
  // This connects your frontend to the backend you provided
  const syncSystemData = useCallback(async () => {
    try {
      const res = await api.get("/api/me");
      setUserData(res.data);
      if (res.data.DarkMode !== undefined) setIsDarkMode(res.data.DarkMode);
    } catch (err) {
      console.error("System sync failed", err);
    }
  }, []);

  useEffect(() => {
    syncSystemData();
  }, [syncSystemData]);

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  return (
    <div className={`system-shell ${isDarkMode ? "dark-theme" : "light-theme"}`}>
      {/* SIDEBAR: Using your exact structure.
          We just update the labels to fit the HRMS pivot. 
      */}
      <aside className={`app-sidebar-pillar ${isCollapsed ? "is-collapsed" : "is-expanded"}`}>
        <div className="sidebar-branding">
          {!isCollapsed && <div className="brand-title">D&T HRMS</div>}
          <button className="toggle-control" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? "❯" : "❮"}
          </button>
        </div>

        <nav className="sidebar-nav-list">
          <button className={`nav-anchor ${activePage === "dashboard" ? "is-active" : ""}`} onClick={() => setActivePage("dashboard")}>
            <span className="nav-icon-box">🏠</span>
            {!isCollapsed && <span className="primary-label">Command Center</span>}
          </button>
          
          <button className={`nav-anchor ${activePage === "employees" ? "is-active" : ""}`} onClick={() => setActivePage("employees")}>
            <span className="nav-icon-box">👥</span>
            {!isCollapsed && <span className="primary-label">Workforce</span>}
          </button>

          <button className={`nav-anchor ${activePage === "tasks" ? "is-active" : ""}`} onClick={() => setActivePage("tasks")}>
            <span className="nav-icon-box">💼</span>
            {!isCollapsed && <span className="primary-label">Tasks Workspace</span>}
          </button>

          <button className={`nav-anchor ${activePage === "reports" ? "is-active" : ""}`} onClick={() => setActivePage("reports")}>
            <span className="nav-icon-box">📈</span>
            {!isCollapsed && <span className="primary-label">Data Reports</span>}
          </button>

          <button className={`nav-anchor ${activePage === "settings" ? "is-active" : ""}`} onClick={() => setActivePage("settings")}>
            <span className="nav-icon-box">⚙️</span>
            {!isCollapsed && <span className="primary-label">System Config</span>}
          </button>
        </nav>

        <div className="sidebar-footer-region">
          <button className="nav-anchor logout-action" onClick={handleLogout}>
            <span className="nav-icon-box">⏻</span>
            {!isCollapsed && <span className="primary-label">Secure Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT: 
          This is where your existing components are "Injected"
      */}
      <main className="system-viewport">
        <header className="system-navbar">
           <div className="breadcrumb-box">
             <span style={{opacity: 0.6}}>D&T Internal / </span>
             <strong>{activePage.toUpperCase()}</strong>
           </div>
           <div className="nav-controls" style={{display:'flex', gap:'20px', alignItems:'center'}}>
             <div className="user-meta-block" style={{textAlign:'right'}}>
                <div style={{fontWeight:'800'}}>{userData?.Name || 'Loading...'}</div>
                <div style={{fontSize:'10px', opacity: 0.6}}>{userData?.Role}</div>
             </div>
             <div className="avatar-frame"></div>
           </div>
        </header>

        <section className="dynamic-content-area">
          {/* THE INJECTION POINT:
              We call your components directly. 
              We pass 'userData' as a prop so your TasksWorkspace 
              can check if the user is an Admin or Employee.
          */}
          <div className="component-injection-point">
            {activePage === "dashboard" && (
              <div className="home-view-container">
                 <h1>Dashboard Overview</h1>
                 {/* You can place your specific Dashboard widgets here */}
              </div>
            )}

            {activePage === "employees" && <Employee user={userData} />}
            
            {activePage === "tasks" && <TasksWorkspace user={userData} />}
            
            {activePage === "reports" && <Reports user={userData} />}
            
            {activePage === "settings" && <Settings user={userData} />}
            
            {/* Keeping your CRM if you still need to access it during the pivot */}
            {activePage === "crm" && <CRM user={userData} />}
          </div>
        </section>

        {/* Your Persistent ChatWidget */}
        <ChatWidget />
      </main>
    </div>
  );
};

export default Dashboard;
