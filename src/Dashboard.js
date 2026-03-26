import { useState, useEffect } from "react";
import CRM from "./CRM";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace";
import MyBarChart from "./chart";
import MyPieChart from "./pchart";
import LineChart from "./LineChart";
import api from "./api";
import "./CRM.css";

function Dashboard({ setMode }) {

  const [activePage, setActivePage] = useState("dashboard");
  const [kpis, setKpis] = useState(null);
  const [stats, setStats] = useState([10, 20, 30, 40]);
  const [currentTime, setCurrentTime] = useState("");

  // 🔥 LIVE TIME
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 LOAD DATA
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/api/reports");
      const data = res.data;

      setKpis(data);
      setStats(data.roles?.map(r => r.value) || []);

    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  // 🏠 CLEAN DASHBOARD (NO SIDEBAR)
  if (activePage === "dashboard") {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        background: "#f9fafb",
        position: "relative",
        padding: "40px"
      }}>

        {/* TIME */}
        <div className="time-display">
          {currentTime}
        </div>

        {/* DASHBOARD GRID */}
        <div className="bitrix-grid">

          <div className="bitrix-card">
            <h3>Closed Business</h3>
            <MyBarChart chartData={stats} title="Performance" />
          </div>

          <div className="bitrix-card">
            <h3>Pipeline</h3>
            <LineChart chartData={stats} title="Pipeline" />
          </div>

          <div className="bitrix-card">
            <h3>Activities</h3>
            <MyPieChart chartData={stats} title="Activities" />
          </div>

        </div>

        {/* ENTER CRM BUTTON */}
        <div style={{
          position: "absolute",
          bottom: "40px",
          right: "40px"
        }}>
          <button
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              background: "#7c3aed",
              color: "white",
              cursor: "pointer"
            }}
            onClick={() => setActivePage("crm")}
          >
            Enter CRM →
          </button>
        </div>

      </div>
    );
  }

  // 🔥 FULL SYSTEM (SIDEBAR + CONTENT)
  return (
    <div className="app">

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo">
          <img src="D&T.png" alt="logo" />
        </div>

        <button onClick={()=>setActivePage("dashboard")}>
          <span>🏠</span><span>Home</span>
        </button>

        <button onClick={()=>setActivePage("crm")}>
          <span>📊</span><span>Analytics</span>
        </button>

        <button onClick={()=>setActivePage("employees")}>
          <span>👥</span><span>Employees</span>
        </button>

        <button onClick={()=>setActivePage("workspace")}>
          <span>💼</span><span>Workspace</span>
        </button>

        <button onClick={()=>setActivePage("reports")}>
          <span>📈</span><span>Reports</span>
        </button>

        <button onClick={()=>setActivePage("settings")}>
          <span>⚙️</span><span>Settings</span>
        </button>

        <button onClick={handleLogout}>
          <span>⏻</span><span>Logout</span>
        </button>
      </div>

      {/* CONTENT */}
      <div className="content">

        {/* TIME (still visible but clean) */}
        <div className="time-display">
          {currentTime}
        </div>

        {activePage === "crm" && <CRM />}
        {activePage === "employees" && <Employee />}
        {activePage === "workspace" && <TasksWorkspace />}
        {activePage === "reports" && <Reports />}
        {activePage === "settings" && <Settings />}

      </div>
    </div>
  );
}

export default Dashboard;
