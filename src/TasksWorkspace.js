import React, { useState, useEffect } from "react";
import CRM from "./CRM";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import TasksWorkspace from "./TasksWorkspace";
import MyBarChart from "./chart"; // Assuming this is your Bar Chart
import MyPieChart from "./pchart";
import LineChart from "./LineChart";
import api from "./api";
import "./CRM.css";

function Dashboard({ setMode }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState("");
  
  // --- MULTIVARIATE STATE ---
  const [multivariateData, setMultivariateData] = useState([]); 
  const [activeLabels, setActiveLabels] = useState([]); // Column names like ["Salary", "Experience"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/api/reports");
      // For the initial "Home" view, we can still use default report data
      // but once you start clicking in the CRM, multivariateData will take over.
      if (res.data.roles) {
        setMultivariateData(res.data.roles); 
        setActiveLabels(["value"]); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  // This handler will be passed to the CRM component
  const handleCrmDataUpdate = (data, labels) => {
    setMultivariateData(data);
    setActiveLabels(labels);
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  if (activePage === "dashboard") {
    return (
      <div className="dashboard-home-view">
        <div className="time-display">{currentTime}</div>

        <div className="bitrix-grid">
          {/* BAR CHART: Comparison of multiple metrics */}
          <div className="bitrix-card">
            <h3>Multivariate Performance</h3>
            <MyBarChart 
              chartData={multivariateData} 
              labels={activeLabels} 
              title="Metric Comparison" 
            />
          </div>

          {/* LINE CHART: Trends across multiple metrics */}
          <div className="bitrix-card">
            <h3>Pipeline Analysis</h3>
            <LineChart 
              chartData={multivariateData} 
              labels={activeLabels} 
              title="Multivariate Trends" 
            />
          </div>

          <div className="bitrix-card">
            <h3>Distribution</h3>
            <MyPieChart chartData={multivariateData} title="Activities" />
          </div>
        </div>

        <div className="crm-enter-container">
          <button className="enter-crm-btn" onClick={() => setActivePage("crm")}>
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

        {/* Passing the handler to CRM so it can update the Dashboard charts */}
        {activePage === "crm" && (
          <CRM onDataUpdate={handleCrmDataUpdate} />
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
