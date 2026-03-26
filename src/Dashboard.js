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

  // 🔥 PAGE TITLES (CLEAN)
  const titles = {
    dashboard: "Sales Dashboard",
    crm: "Analytics",
    employees: "Employees",
    workspace: "Workspace",
    settings: "Settings",
    reports: "Reports"
  };

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

  return (
    <div className="app">

      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="logo">
          <img src="D&T.png" alt="logo" />
        </div>

        <button className={activePage==="dashboard"?"active":""} onClick={()=>setActivePage("dashboard")}>
          <span>🏠</span><span>Dashboard</span>
        </button>

        <button className={activePage==="crm"?"active":""} onClick={()=>setActivePage("crm")}>
          <span>📊</span><span>Analytics</span>
        </button>

        <button className={activePage==="employees"?"active":""} onClick={()=>setActivePage("employees")}>
          <span>👥</span><span>Employees</span>
        </button>

        <button className={activePage==="workspace"?"active":""} onClick={()=>setActivePage("workspace")}>
          <span>💼</span><span>Workspace</span>
        </button>

        <button className={activePage==="reports"?"active":""} onClick={()=>setActivePage("reports")}>
          <span>📈</span><span>Reports</span>
        </button>

        <button className={activePage==="settings"?"active":""} onClick={()=>setActivePage("settings")}>
          <span>⚙️</span><span>Settings</span>
        </button>

        <button onClick={handleLogout}>
          <span>⏻</span><span>Logout</span>
        </button>
      </div>

      {/* CONTENT */}
      <div className="content">

        {/* 🔥 DYNAMIC HEADER */}
        <div className="horizontalbar">
          <h2>{titles[activePage]}</h2>
          <p style={{ fontSize: "13px", color: "#94a3b8" }}>
            Live overview of your system
          </p>
        </div>

        {/* 🏠 DASHBOARD (MAIN HOME) */}
        {activePage === "dashboard" && (
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

            <div className="bitrix-card">
              <h3>Leaderboard</h3>
              <MyBarChart chartData={stats} title="Leaderboard" />
            </div>

            <div className="bitrix-card">
              <h3>Forecast</h3>
              <LineChart chartData={stats} title="Forecast" />
            </div>

            <div className="bitrix-card">
              <h3>Top Opportunities</h3>

              <table className="excel-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stage</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {kpis?.roles?.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>Active</td>
                      <td>₹{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>

          </div>
        )}

        {/* OTHER PAGES */}
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
