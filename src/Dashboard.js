import { useState, useEffect } from "react";
import CRM from "./CRM";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace";
import "./CRM.css";

function Dashboard({ setMode }) {
  const [activePage, setActivePage] = useState("crm");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) setMode("login");
  }, [setMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  const storedName = localStorage.getItem("loggedInName");
  const storedEmail = localStorage.getItem("loggedInUser");

  let displayName = "User";
  if (storedName) displayName = storedName;
  else if (storedEmail) {
    displayName =
      storedEmail.split("@")[0].charAt(0).toUpperCase() +
      storedEmail.split("@")[0].slice(1);
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">
          <img src="D&T.png" alt="logo" />
        </div>

        <button className={activePage==="crm"?"active":""} onClick={()=>setActivePage("crm")}>
          <span>🏠</span><span>Dashboard</span>
        </button>

        <button className={activePage==="employees"?"active":""} onClick={()=>setActivePage("employees")}>
          <span>👥</span><span>Employees</span>
        </button>

        <button className={activePage==="reports"?"active":""} onClick={()=>setActivePage("reports")}>
          <span>📊</span><span>Reports</span>
        </button>

        <button className={activePage==="workspace"?"active":""} onClick={()=>setActivePage("workspace")}>
          <span>💼</span><span>Workspace</span>
        </button>

        <button className={activePage==="settings"?"active":""} onClick={()=>setActivePage("settings")}>
          <span>⚙️</span><span>Settings</span>
        </button>

        <button onClick={handleLogout}>
          <span>⏻</span><span>Logout</span>
        </button>
      </div>

      <div className="content">
        <div className="horizontalbar">
          <span>CRM Dashboard</span>
          <div style={{marginTop:"10px", fontSize:"14px"}}>
            🕒 {currentTime} | 👤 {displayName}
          </div>
        </div>

        {activePage==="crm" && <CRM />}
        {activePage==="employees" && <Employee />}
        {activePage==="reports" && <Reports />}
        {activePage==="workspace" && <TasksWorkspace />}
        {activePage==="settings" && <Settings />}
      </div>
    </div>
  );
}

export default Dashboard;
