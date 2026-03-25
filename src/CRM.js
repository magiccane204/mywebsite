import React, { useState, useEffect, useMemo } from "react";
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
  const [Employees, setEmployees] = useState([]);
  
  // --- DATA INITIALIZATION ---
  // Headers persistence logic
  const [headers, setHeaders] = useState(() => {
    try {
      const saved = localStorage.getItem("crm_vault_headers");
      return saved ? JSON.parse(saved) : ["Name", "Email", "Value", "Status", "Date"];
    } catch (e) { 
      return ["Name", "Email", "Value", "Status", "Date"]; 
    }
  });

  // Table data persistence logic
  const [tableData, setTableData] = useState(() => {
    try {
      const saved = localStorage.getItem("crm_vault_main_data");
      const parsed = saved ? JSON.parse(saved) : null;
      // Critical check to ensure we have a valid 2D array structure
      if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
        return parsed;
      }
    } catch (e) { 
      console.error("Data Corrupt in Storage:", e); 
    }
    // Default fallback to prevent 'undefined' reading errors
    return Array(10).fill(null).map(() => Array(5).fill(""));
  });

  // Analytics state for charts
  const [selectedStats, setSelectedStats] = useState([]);
  const [selectedColumnName, setSelectedColumnName] = useState("No Column Selected");

  // --- CHART DATA PROCESSING (FIXES THE REFERENCE ERRORS) ---
  
  // 1. Simple Data for Bar, Pie, and Line charts
  const simpleChartData = useMemo(() => {
    return selectedStats && selectedStats.length > 0 ? selectedStats : [];
  }, [selectedStats]);

  // 2. Formatted Data for Scatter Plot (Object mapping)
  const scatterData = useMemo(() => {
    if (!selectedStats || selectedStats.length < 2) return [];
    // Creates pairs: [{x: val1, y: val2}, {x: val2, y: val3}]
    return selectedStats.slice(0, -1).map((val, i) => ({
      x: val,
      y: selectedStats[i + 1]
    }));
  }, [selectedStats]);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
    if (tableData) {
      localStorage.setItem("crm_vault_main_data", JSON.stringify(tableData));
    }
  }, [tableData]);

  useEffect(() => {
    if (headers) {
      localStorage.setItem("crm_vault_headers", JSON.stringify(headers));
    }
  }, [headers]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) setMode("login");
  }, [setMode]);

  // --- HANDLERS ---
  const handleColumnSelect = (columnValues, colIndex) => {
    if (!columnValues) return;
    const numeric = columnValues
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));

    setSelectedStats(numeric);
    setSelectedColumnName(headers[colIndex] || `Column ${colIndex + 1}`);
  };

  const fetchData = async (route, section) => {
    try {
      setActiveSection(section);
      const res = await api.get(route);
      if (section === "Employees") {
        setEmployees(res.data);
      }
    } catch (err) { 
      console.error("Fetch Error:", err); 
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  const displayName = localStorage.getItem("loggedInName") || "Admin";

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <button 
          className={activeSection === "dashboard" ? "active" : ""} 
          onClick={() => setActiveSection("dashboard")}
        >🏠</button>
        <button onClick={() => fetchData("/Employees", "Employees")}>👥</button>
        <button onClick={() => setActiveSection("reports")}>📊</button>
        <button onClick={() => setActiveSection("workspace")}>💼</button>
        <button onClick={() => setActiveSection("settings")}>⚙️</button>
        <button onClick={handleLogout} className="logout-btn">⏻</button>
      </div>

      {/* MAIN CONTENT */}
      <div className="content">
        <div className="horizontalbar">
          CRM Enterprise Management — Welcome {displayName}
        </div>

        {activeSection === "dashboard" && (
          <div className="dashboard-container">
            
            {/* KPI METRICS GRID */}
            <div className="dashboard-grid">
              <div className="kpi-card"><h3>💰 Total Revenue</h3><h1>₹1,24,000</h1></div>
              <div className="kpi-card"><h3>📈 Active Leads</h3><h1>342</h1></div>
              <div className="kpi-card"><h3>🎯 Conversion</h3><h1>24%</h1></div>
              <div className="kpi-card"><h3>✅ Task Load</h3><h1>89</h1></div>
            </div>

            {/* CHARTS SECTION */}
            <div className="charts-container">
              
              <div className="chart-card" onClick={() => setExpandedChart("bar")}>
                <div className="chart-header">Bar Analysis: {selectedColumnName}</div>
                {simpleChartData.length > 0 ? (
                  <MyBarChart chartData={simpleChartData} />
                ) : (
                  <div className="chart-placeholder">Select a numeric column from the table</div>
                )}
              </div>

              <div className="chart-card" onClick={() => setExpandedChart("pie")}>
                <div className="chart-header">Distribution</div>
                {simpleChartData.length > 0 ? (
                  <MyPieChart chartData={simpleChartData} />
                ) : (
                  <div className="chart-placeholder">No data available</div>
                )}
              </div>

              <div className="chart-card" onClick={() => setExpandedChart("line")}>
                <div className="chart-header">Growth Timeline</div>
                {simpleChartData.length > 0 ? (
                  <LineChart chartData={simpleChartData} />
                ) : (
                  <div className="chart-placeholder">No data available</div>
                )}
              </div>

              <div className="chart-card" onClick={() => setExpandedChart("scatter")}>
                <div className="chart-header">Correlation Matrix</div>
                {scatterData.length > 0 ? (
                  <ScatterChart chartData={scatterData} />
                ) : (
                  <div className="chart-placeholder">Requires at least 2 data points</div>
                )}
              </div>

            </div>

            {/* TABLE AND EDITOR TOGGLE */}
            <div className="table-section">
              <div className="table-header-tabs">
                <button 
                  className={!showTableEditor ? "tab-active" : ""} 
                  onClick={() => setShowTableEditor(false)}
                >Master Database View</button>
                <button 
                  className={showTableEditor ? "tab-active" : ""} 
                  onClick={() => setShowTableEditor(true)}
                >Configure Headers</button>
              </div>

              <div className="table-view-port">
                {/* Ensure tableData is valid before rendering sub-components */}
                {tableData && tableData.length > 0 ? (
                  showTableEditor ? (
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
                  )
                ) : (
                  <div className="no-data-msg">Initializing Database... Use Excel View to add data.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS MODAL */}
        {expandedChart && (
          <div className="chart-modal-overlay" onClick={() => setExpandedChart(null)}>
            <div className="chart-modal-body" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Detailed Insights: {selectedColumnName}</h2>
                <button className="close-btn" onClick={() => setExpandedChart(null)}>✕</button>
              </div>
              
              <div className="modal-viz">
                {expandedChart === "bar" && <MyBarChart chartData={simpleChartData} />}
                {expandedChart === "pie" && <MyPieChart chartData={simpleChartData} />}
                {expandedChart === "line" && <LineChart chartData={simpleChartData} />}
                {expandedChart === "scatter" && <ScatterChart chartData={scatterData} />}
              </div>

              <div className="modal-stats-footer">
                <p><strong>Sample Count:</strong> {selectedStats.length}</p>
                <p><strong>Average:</strong> {(selectedStats.reduce((a, b) => a + b, 0) / (selectedStats.length || 1)).toFixed(2)}</p>
                <p><strong>Total Sum:</strong> {selectedStats.reduce((a, b) => a + b, 0)}</p>
              </div>
            </div>
          </div>
        )}

        {/* OTHER APP SECTIONS */}
        {activeSection === "Employees" && <Employee Employees={Employees} />}
        {activeSection === "reports" && <Reports />}
        {activeSection === "workspace" && <TasksWorkspace />}
        {activeSection === "settings" && <Settings />}
      </div>
    </div>
  );
}

export default CRM;
