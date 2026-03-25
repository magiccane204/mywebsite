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
  const [Employees, setEmployees] = useState([]);
  
  // --- DATA INITIALIZATION (CRITICAL FIX) ---
  // We use a function to initialize state so it never starts as 'undefined'
  const [headers, setHeaders] = useState(() => {
    try {
      const saved = localStorage.getItem("crm_vault_headers");
      return saved ? JSON.parse(saved) : ["Name", "Email", "Value", "Status", "Date"];
    } catch (e) { return ["Name", "Email", "Value", "Status", "Date"]; }
  });

  const [tableData, setTableData] = useState(() => {
    try {
      const saved = localStorage.getItem("crm_vault_main_data");
      const parsed = saved ? JSON.parse(saved) : null;
      // Ensure it's a valid 2D array, otherwise return default
      if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
        return parsed;
      }
    } catch (e) { console.error("Data Corrupt:", e); }
    return Array(10).fill(null).map(() => Array(5).fill(""));
  });

  const [selectedStats, setSelectedStats] = useState([]);
  const [selectedColumnName, setSelectedColumnName] = useState("No Column Selected");

  // --- PERSISTENCE ---
  useEffect(() => {
    if (tableData) localStorage.setItem("crm_vault_main_data", JSON.stringify(tableData));
  }, [tableData]);

  useEffect(() => {
    if (headers) localStorage.setItem("crm_vault_headers", JSON.stringify(headers));
  }, [headers]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) setMode("login");
  }, [setMode]);

  // --- HANDLERS ---
  const handleColumnSelect = (columnValues, colIndex) => {
    if (!columnValues) return;
    const numeric = columnValues.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
    setSelectedStats(numeric);
    setSelectedColumnName(headers[colIndex] || `Column ${colIndex + 1}`);
  };

  const fetchData = async (route, section) => {
    try {
      setActiveSection(section);
      const res = await api.get(route);
      if (section === "Employees") setEmployees(res.data);
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setMode("login");
  };

  const displayName = localStorage.getItem("loggedInName") || "Admin";

  return (
    <div className="app">
      <div className="sidebar">
        <button className={activeSection === "dashboard" ? "active" : ""} onClick={() => setActiveSection("dashboard")}>🏠</button>
        <button onClick={() => fetchData("/Employees", "Employees")}>👥</button>
        <button onClick={() => setActiveSection("reports")}>📊</button>
        <button onClick={() => setActiveSection("workspace")}>💼</button>
        <button onClick={() => setActiveSection("settings")}>⚙️</button>
        <button onClick={handleLogout} className="logout-btn">⏻</button>
      </div>

      <div className="content">
        <div className="horizontalbar">CRM Enterprise — Welcome {displayName}</div>

        {activeSection === "dashboard" && (
          <div className="dashboard-container">
            {/* KPI METRICS */}
            <div className="dashboard-grid">
              <div className="kpi-card"><h3>💰 Revenue</h3><h1>₹1,24,000</h1></div>
              <div className="kpi-card"><h3>📈 Leads</h3><h1>342</h1></div>
              <div className="kpi-card"><h3>🎯 Conv.</h3><h1>24%</h1></div>
              <div className="kpi-card"><h3>✅ Tasks</h3><h1>89</h1></div>
            </div>

            {/* CHARTS WITH OPTIONAL CHAINING GUARD */}
            <div className="charts-container">
              <div className="chart-card" onClick={() => setExpandedChart("bar")}>
                <div className="chart-header">{selectedColumnName}</div>
                <MyBarChart chartData={selectedStats || []} />
              </div>

              <div className="chart-card" onClick={() => setExpandedChart("pie")}>
                <div className="chart-header">Distribution</div>
                <MyPieChart chartData={selectedStats || []} />
              </div>

              <div className="chart-card" onClick={() => setExpandedChart("line")}>
                <div className="chart-header">Timeline</div>
                <LineChart chartData={selectedStats || []} />
              </div>

              <div className="chart-card" onClick={() => setExpandedChart("scatter")}>
                <div className="chart-header">Correlation</div>
                <ScatterChart
                  chartDataX={(selectedStats || []).slice(0, -1)}
                  chartDataY={(selectedStats || []).slice(1)}
                />
              </div>
            </div>

            {/* TABLE SECTION */}
            <div className="table-section">
              <div className="table-header-tabs">
                <button className={!showTableEditor ? "tab-active" : ""} onClick={() => setShowTableEditor(false)}>📁 Master Table</button>
                <button className={showTableEditor ? "tab-active" : ""} onClick={() => setShowTableEditor(true)}>✏️ Header Editor</button>
              </div>

              <div className="table-view-port">
                {/* FIX: Ensure tableData[0] exists before rendering */}
                {tableData && tableData.length > 0 ? (
                  showTableEditor ? (
                    <TableEditor tableData={tableData} setTableData={setTableData} headers={headers} setHeaders={setHeaders} />
                  ) : (
                    <ExcelTable tableData={tableData} setTableData={setTableData} headers={headers} onColumnSelect={handleColumnSelect} />
                  )
                ) : (
                  <div className="no-data-msg">Table is empty. Use "Add Row" in Excel View.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL ANALYTICS */}
        {expandedChart && (
          <div className="chart-modal-overlay" onClick={() => setExpandedChart(null)}>
            <div className="chart-modal-body" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal-btn" onClick={() => setExpandedChart(null)}>✕</button>
              <div className="modal-viz">
                {expandedChart === "bar" && <MyBarChart chartData={selectedStats} />}
                {expandedChart === "pie" && <MyPieChart chartData={selectedStats} />}
                {/* ... other cases ... */}
              </div>
              <div className="modal-stats">
                <p>Count: {selectedStats?.length || 0}</p>
                <p>Avg: {(selectedStats?.reduce((a, b) => a + b, 0) / (selectedStats?.length || 1)).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* SECTIONS */}
        {activeSection === "Employees" && <Employee Employees={Employees} />}
        {activeSection === "reports" && <Reports />}
        {activeSection === "workspace" && <TasksWorkspace />}
        {activeSection === "settings" && <Settings />}
      </div>
    </div>
  );
}

export default CRM;
