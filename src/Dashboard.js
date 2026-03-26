import { useState, useEffect } from "react";
import CRM from "./CRM";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace";
import MyBarChart from "./chart";
import MyPieChart from "./pchart";
import LineChart from "./LineChart";
import ScatterChart from "./ScatterChart";
import api from "./api";
import "./CRM.css";

function Dashboard({ setMode }) {

  const [activePage, setActivePage] = useState("dashboard");
  const [kpis, setKpis] = useState(null);
  const [stats, setStats] = useState([10,20,30,40]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/api/reports");
      const data = res.data;

      setKpis(data);
      setStats(data.roles.map(r => r.value));

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

        <button onClick={()=>setActivePage("crm")}>
          <span>📊</span><span>Analytics</span>
        </button>

        <button onClick={()=>setActivePage("employees")}>
          <span>👥</span><span>Employees</span>
        </button>

        <button onClick={()=>setActivePage("workspace")}>
          <span>💼</span><span>Workspace</span>
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

        <div className="horizontalbar">
          <h2>Sales Dashboard</h2>
        </div>

        {/* DASHBOARD MAIN */}
        {activePage === "dashboard" && (
          <div className="bitrix-grid">

            {/* CARD 1 */}
            <div className="bitrix-card">
              <h3>My Closed Business</h3>
              <MyBarChart chartData={stats} title="Performance" />
            </div>

            {/* CARD 2 */}
            <div className="bitrix-card">
              <h3>My Pipeline</h3>
              <LineChart chartData={stats} title="Pipeline" />
            </div>

            {/* CARD 3 */}
            <div className="bitrix-card">
              <h3>My Activities</h3>
              <MyPieChart chartData={stats} title="Activities" />
            </div>

            {/* CARD 4 */}
            <div className="bitrix-card">
              <h3>Team Leaderboard</h3>
              <MyBarChart chartData={stats} title="Leaderboard" />
            </div>

            {/* CARD 5 */}
            <div className="bitrix-card">
              <h3>Forecast</h3>
              <LineChart chartData={stats} title="Forecast" />
            </div>

            {/* CARD 6 */}
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

        {activePage === "crm" && <CRM />}
        {activePage === "employees" && <Employee />}
        {activePage === "workspace" && <TasksWorkspace />}
        {activePage === "settings" && <Settings />}

      </div>
    </div>
  );
}

export default Dashboard;
