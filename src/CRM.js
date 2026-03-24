import { useState, useEffect } from "react";
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
  const [backendData, setBackendData] = useState(null);
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [Employees, setEmployees] = useState([]);
  const [headers, setHeaders] = useState(["Header 1", "Header 2", "Header 3"]);
  const [tableData, setTableData] = useState([
    ["10", "20", "30"],
    ["15", "25", "35"],
    ["12", "22", "32"],
  ]);
  const [selectedStats, setSelectedStats] = useState([]);
  const [selectedColumnName, setSelectedColumnName] =
    useState("No Column Selected");
  const [expandedChart, setExpandedChart] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) setMode("login");
  }, [setMode]);

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
        setBackendData(null);
      } else {
        setBackendData(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleColumnSelect = (columnValues, colIndex) => {
    const numeric = columnValues
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));

    setSelectedStats(numeric);
    setSelectedColumnName(headers[colIndex] || `Column ${colIndex + 1}`);
  };

  const displayName =
    localStorage.getItem("loggedInName") ||
    (localStorage.getItem("loggedInUser") || "User").split("@")[0];

  return (
    <div className="app">
      {/* SIDEBAR */}
      <div className="sidebar">
        <button onClick={() => setActiveSection("dashboard")}>🏠</button>
        <button onClick={() => fetchData("/Employees", "Employees")}>👥</button>
        <button onClick={() => setActiveSection("reports")}>📊</button>
        <button onClick={() => setActiveSection("workspace")}>💼</button>
        <button onClick={() => setActiveSection("settings")}>⚙️</button>
        <button onClick={handleLogout}>⏻</button>
      </div>

      {/* CONTENT */}
      <div className="content">
        <div className="horizontalbar">
          CRM Dashboard — Welcome {displayName}
        </div>

        {/* DASHBOARD */}
        {activeSection === "dashboard" && (
          <>
            {/* KPI */}
            <div className="dashboard-grid">
              <div className="kpi-card">
                <h3>💰 Revenue</h3>
                <h1>₹1,24,000</h1>
              </div>
              <div className="kpi-card">
                <h3>📈 Leads</h3>
                <h1>342</h1>
              </div>
              <div className="kpi-card">
                <h3>🎯 Conversion</h3>
                <h1>24%</h1>
              </div>
              <div className="kpi-card">
                <h3>✅ Tasks</h3>
                <h1>89</h1>
              </div>
            </div>

            {/* CHARTS */}
            <div className="charts-container">
              <div className="chart" onClick={() => setExpandedChart("bar")}>
                <MyBarChart chartData={selectedStats} />
              </div>

              <div className="chart" onClick={() => setExpandedChart("pie")}>
                <MyPieChart chartData={selectedStats} />
              </div>

              <div className="chart" onClick={() => setExpandedChart("line")}>
                <LineChart chartData={selectedStats} />
              </div>

              <div className="chart" onClick={() => setExpandedChart("scatter")}>
                <ScatterChart
                  chartDataX={selectedStats.slice(0, -1)}
                  chartDataY={selectedStats.slice(1)}
                />
              </div>
            </div>

            {/* MODAL WITH ANALYTICS */}
            {expandedChart && (
              <div
                className="chart-modal"
                onClick={() => setExpandedChart(null)}
              >
                <div
                  className="chart-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => setExpandedChart(null)}>Close</button>

                  {expandedChart === "bar" && (
                    <MyBarChart chartData={selectedStats} />
                  )}
                  {expandedChart === "pie" && (
                    <MyPieChart chartData={selectedStats} />
                  )}
                  {expandedChart === "line" && (
                    <LineChart chartData={selectedStats} />
                  )}
                  {expandedChart === "scatter" && (
                    <ScatterChart
                      chartDataX={selectedStats.slice(0, -1)}
                      chartDataY={selectedStats.slice(1)}
                    />
                  )}

                  {/* DATA ANALYTICS */}
                  <div className="chart-stats">
                    {selectedStats.length > 0 ? (
                      <>
                        <p>Count: {selectedStats.length}</p>
                        <p>Min: {Math.min(...selectedStats)}</p>
                        <p>Max: {Math.max(...selectedStats)}</p>
                        <p>
                          Avg:{" "}
                          {(
                            selectedStats.reduce((a, b) => a + b, 0) /
                            selectedStats.length
                          ).toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p>No data</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* OTHER SECTIONS */}
        {activeSection === "Employees" && (
          <Employee Employees={Employees} />
        )}
        {activeSection === "reports" && <Reports />}
        {activeSection === "workspace" && <TasksWorkspace />}
        {activeSection === "settings" && <Settings />}

        {/* TABLE */}
        {activeSection === "dashboard" && (
          <div className="table-section">
            <button onClick={() => setShowTableEditor(false)}>
              Excel Table
            </button>
            <button onClick={() => setShowTableEditor(true)}>
              Editor
            </button>

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
                headers={headers}
                onColumnSelect={handleColumnSelect}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CRM;
