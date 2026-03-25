import React, { useState, useEffect } from "react";
import MyBarChart from "./chart";
import MyPieChart from "./pchart";
import ExcelTable from "./ExcelTable";
import TableEditor from "./TableEditor";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import ScatterChart from "./ScatterChart";
import TasksWorkspace from "./TasksWorkspace";
import LineChart from "./LineChart";
import api from "./api";
import "./CRM.css";

function CRM({ setMode }) {
  // --- UI NAVIGATION STATE ---
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [expandedChart, setExpandedChart] = useState(null);
  
  // --- CRM DATA STATE (Lifted from ExcelTable) ---
  const [Employees, setEmployees] = useState([]);
  
  // Persistence: Initialize Headers from storage or use defaults
  const [headers, setHeaders] = useState(() => {
    const saved = localStorage.getItem("crm_vault_headers");
    return saved ? JSON.parse(saved) : ["Client Name", "Contact Email", "Deal Value", "Lead Status", "Last Contact"];
  });

  // Persistence: Initialize Table Data from storage or use defaults
  const [tableData, setTableData] = useState(() => {
    const saved = localStorage.getItem("crm_vault_main_data");
    return saved ? JSON.parse(saved) : Array(12).fill(null).map(() => Array(5).fill(""));
  });

  // --- ANALYTICS & STATS STATE ---
  const [selectedStats, setSelectedStats] = useState([]);
  const [selectedColumnName, setSelectedColumnName] = useState("No Column Selected");

  // --- PERSISTENCE LAYER ---
  // Save to LocalStorage whenever table or headers change
  useEffect(() => {
    localStorage.setItem("crm_vault_main_data", JSON.stringify(tableData));
  }, [tableData]);

  useEffect(() => {
    localStorage.setItem("crm_vault_headers", JSON.stringify(headers));
  }, [headers]);

  // Auth Check: Ensure user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) setMode("login");
  }, [setMode]);

  // --- ACTIONS & HANDLERS ---
  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  const fetchData = async (route, section) => {
    try {
      setActiveSection(section);
      const res = await api.get(route);
      if (section === "Employees") {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error("CRM Data Fetching Failed:", err);
    }
  };

  const handleColumnSelect = (columnValues, colIndex) => {
    // Process numeric data for the charts
    const numeric = columnValues
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));

    setSelectedStats(numeric);
    setSelectedColumnName(headers[colIndex] || `Column ${colIndex + 1}`);
  };

  const displayName = 
    localStorage.getItem("loggedInName") || 
    (localStorage.getItem("loggedInUser") || "Administrator").split("@")[0];

  return (
    <div className="app">
      {/* 1. SIDEBAR NAVIGATION */}
      <div className="sidebar">
        <div className="sidebar-logo">CRM</div>
        <button 
          className={activeSection === "dashboard" ? "active" : ""} 
          onClick={() => setActiveSection("dashboard")}
          title="Dashboard"
        >🏠</button>
        <button 
          className={activeSection === "Employees" ? "active" : ""} 
          onClick={() => fetchData("/Employees", "Employees")}
          title="Team Members"
        >👥</button>
        <button 
          className={activeSection === "reports" ? "active" : ""} 
          onClick={() => setActiveSection("reports")}
          title="Analytics Reports"
        >📊</button>
        <button 
          className={activeSection === "workspace" ? "active" : ""} 
          onClick={() => setActiveSection("workspace")}
          title="Task Workspace"
        >💼</button>
        <button 
          className={activeSection === "settings" ? "active" : ""} 
          onClick={() => setActiveSection("settings")}
          title="System Settings"
        >⚙️</button>
        <button onClick={handleLogout} className="logout-trigger" title="Sign Out">⏻</button>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="content">
        <div className="horizontalbar">
          <div className="hb-title">Enterprise Management Suite</div>
          <div className="hb-user">Welcome back, <span>{displayName}</span></div>
        </div>

        {/* DASHBOARD SECTION */}
        {activeSection === "dashboard" && (
          <div className="dashboard-container">
            
            {/* KPI METRICS */}
            <div className="dashboard-grid">
              <div className="kpi-card">
                <div className="kpi-icon">💰</div>
                <div className="kpi-info">
                  <h3>Total Revenue</h3>
                  <h1>₹1,24,000</h1>
                  <span className="trend positive">↑ 12.5% vs last month</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">📈</div>
                <div className="kpi-info">
                  <h3>Active Leads</h3>
                  <h1>342</h1>
                  <span className="trend positive">↑ 8 new today</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">🎯</div>
                <div className="kpi-info">
                  <h3>Conversion Rate</h3>
                  <h1>24%</h1>
                  <span className="trend negative">↓ 1.2% this week</span>
                </div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon">✅</div>
                <div className="kpi-info">
                  <h3>Tasks Completed</h3>
                  <h1>89</h1>
                  <span className="trend neutral">9 tasks remaining</span>
                </div>
              </div>
            </div>

            {/* ANALYTICS CHARTS */}
            <div className="charts-container">
              <div className="chart-card" onClick={() => setExpandedChart("bar")}>
                <div className="chart-header">Revenue by {selectedColumnName}</div>
                <MyBarChart chartData={selectedStats} />
              </div>

              <div className="chart-card" onClick={() => setExpandedChart("pie")}>
                <div className="chart-header">Distribution Ratio</div>
                <MyPieChart chartData={selectedStats} />
              </div>

              <div className="chart-card" onClick={() => setExpandedChart("line")}>
                <div className="chart-header">Growth Timeline</div>
                <LineChart chartData={selectedStats} />
              </div>

              <div className="chart-card" onClick={() => setExpandedChart("scatter")}>
                <div className="chart-header">Performance Correlation</div>
                <ScatterChart
                  chartDataX={selectedStats.slice(0, -1)}
                  chartDataY={selectedStats.slice(1)}
                />
              </div>
            </div>

            {/* DATABASE & EDITOR TOGGLE */}
            <div className="table-section">
              <div className="table-header-tabs">
                <button 
                  className={!showTableEditor ? "tab-active" : ""} 
                  onClick={() => setShowTableEditor(false)}
                >
                  📁 Master Excel Table
                </button>
                <button 
                  className={showTableEditor ? "tab-active" : ""} 
                  onClick={() => setShowTableEditor(true)}
                >
                  ✏️ Column Header Editor
                </button>
              </div>

              <div className="table-view-port">
                {showTableEditor ? (
                  <TableEditor
                    tableData={tableData}
                    setTableData={setTableData}
                    headers={headers}
                    setHeaders={setHeaders}
                  />
                ) : (
                  <ExcelTable
                    tableData={tableData}
                    setTableData={setTableData}
                    headers={headers}
                    onColumnSelect={handleColumnSelect}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS MODAL (Expanded View) */}
        {expandedChart && (
          <div className="chart-modal-overlay" onClick={() => setExpandedChart(null)}>
            <div className="chart-modal-body" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detailed Insights: {selectedColumnName}</h2>
                <button className="close-modal-btn" onClick={() => setExpandedChart(null)}>✕</button>
              </div>

              <div className="modal-content-grid">
                <div className="modal-viz">
                  {expandedChart === "bar" && <MyBarChart chartData={selectedStats} />}
                  {expandedChart === "pie" && <MyPieChart chartData={selectedStats} />}
                  {expandedChart === "line" && <LineChart chartData={selectedStats} />}
                  {expandedChart === "scatter" && (
                    <ScatterChart
                      chartDataX={selectedStats.slice(0, -1)}
                      chartDataY={selectedStats.slice(1)}
                    />
                  )}
                </div>

                <div className="modal-stats-sidebar">
                  <h4>Data Summary</h4>
                  {selectedStats.length > 0 ? (
                    <div className="stats-list">
                      <div className="stat-item"><span>Entry Count:</span> <strong>{selectedStats.length}</strong></div>
                      <div className="stat-item"><span>Minimum Value:</span> <strong>{Math.min(...selectedStats)}</strong></div>
                      <div className="stat-item"><span>Maximum Value:</span> <strong>{Math.max(...selectedStats)}</strong></div>
                      <div className="stat-item">
                        <span>Arithmetic Mean:</span> 
                        <strong>{(selectedStats.reduce((a, b) => a + b, 0) / selectedStats.length).toFixed(2)}</strong>
                      </div>
                      <div className="stat-item">
                        <span>Total Sum:</span> 
                        <strong>{selectedStats.reduce((a, b) => a + b, 0).toLocaleString()}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="no-data-msg">Select a numeric column from the table to see deep analytics.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OTHER MODULE SECTIONS */}
        {activeSection === "Employees" && <Employee Employees={Employees} />}
        {activeSection === "reports" && <Reports />}
        {activeSection === "workspace" && <TasksWorkspace />}
        {activeSection === "settings" && <Settings />}
      </div>
    </div>
  );
}

export default CRM;
