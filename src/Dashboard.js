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
  const [currentTime, setCurrentTime] = useState("");

  // --- MULTIVARIATE STATES ---
  // chartData will now be an array of objects: [{name: 'John', Salary: 5000, Age: 30}, ...]
  const [multivariateData, setMultivariateData] = useState([]);
  // activeLabels will be the column names: ["Salary", "Age"]
  const [activeLabels, setActiveLabels] = useState([]);

  // 🔥 LIVE TIME
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 LOAD INITIAL DATA
  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/api/reports");
      const data = res.data;

      // Set default multivariate data from reports if available
      if (data.roles) {
        setMultivariateData(data.roles); // Assuming roles is [{name: 'Dev', value: 10}, ...]
        setActiveLabels(["value"]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 MULTIVARIATE BRIDGE
  // This function receives the selection from the CRM/ExcelTable
  const handleCrmDataUpdate = (chartData, labels) => {
    setMultivariateData(chartData);
    setActiveLabels(labels);
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  // 🏠 CLEAN DASHBOARD (NO SIDEBAR)
  if (activePage === "dashboard") {
    return (
      <div style={{
        width: "100vw", height: "100vh", background: "#6990b8",
        position: "relative", padding: "40px"
      }}>
        <div className="time-display">{currentTime}</div>

        <div className="bitrix-grid">
          <div className="bitrix-card">
            <h3>Performance Analysis</h3>
            {/* Pass multivariate props to the Bar Chart */}
            <MyBarChart 
              chartData={multivariateData} 
              labels={activeLabels} 
              title="Metric Comparison" 
            />
          </div>

          <div className="bitrix-card">
            <h3>Pipeline Trends</h3>
            <LineChart 
              chartData={multivariateData} 
              labels={activeLabels} 
              title="Trend Analysis" 
            />
          </div>

          <div className="bitrix-card">
            <h3>Activity Distribution</h3>
            <MyPieChart 
              chartData={multivariateData} 
              labels={activeLabels} 
              title={activeLabels[0] || "Activities"} 
            />
          </div>
        </div>

        <div style={{ position: "absolute", bottom: "40px", right: "40px" }}>
          <button
            style={{
              padding: "12px 20px", borderRadius: "8px", border: "none",
              background: "#7c3aed", color: "white", cursor: "pointer"
            }}
            onClick={() => setActivePage("crm")}
          >
            Enter CRM →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo"><img src="D&T.png" alt="logo" /></div>
        <button onClick={() => setActivePage("dashboard")}><span>🏠</span><span>Home</span></button>
        <button onClick={() => setActivePage("crm")}><span>📊</span><span>Analytics</span></button>
        <button onClick={() => setActivePage("employees")}><span>👥</span><span>Employees</span></button>
        <button onClick={() => setActivePage("workspace")}><span>💼</span><span>Workspace</span></button>
        <button onClick={() => setActivePage("reports")}><span>📈</span><span>Reports</span></button>
        <button onClick={() => setActivePage("settings")}><span>⚙️</span><span>Settings</span></button>
        <button onClick={handleLogout}><span>⏻</span><span>Logout</span></button>
      </div>

      <div className="content">
        <div className="time-display">{currentTime}</div>

        {/* Passing handleCrmDataUpdate to the CRM component */}
        {activePage === "crm" && (
          <CRM onCrmUpdate={handleCrmDataUpdate} />
        )}

        {activePage === "employees" && <Employee />}
        {activePage === "workspace" && <TasksWorkspace />}
        {activePage === "reports" && <Reports />}
        {activePage === "settings" && <Settings />}
      </div>
    </div>
  );
}

export default Dashboard;
