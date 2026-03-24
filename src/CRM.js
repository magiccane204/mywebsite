import { useState, useEffect } from "react";
import MyBarChart from "./chart";
import MyPieChart from "./pchart";
import ExcelTable from "./ExcelTable";
import TableEditor from "./TableEditor";
import Employee from "./Employee";
import Reports from "./Reports";
import Settings from "./Settings";
import ScatterChart from "./ScatterChart";
import TasksWorkspace from"./TasksWorkspace";
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
    if (!token) {
      setMode("login");
    }
  }, [setMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setExpandedChart(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInName");
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
      console.error("Error fetching data:", err);
    }
  };

  const handleColumnSelect = (columnValues, colIndex) => {
    const columnName = headers[colIndex] || `Column ${colIndex + 1}`;
    const numericValues = columnValues
      .map((v) => parseFloat(v))
      .filter((v) => !isNaN(v));
    setSelectedColumnName(columnName);
    setSelectedStats(numericValues.length > 0 ? numericValues : []);
  };

  const storedName = localStorage.getItem("loggedInName");
  const storedEmail = localStorage.getItem("loggedInUser");

  let displayName = "User";
  if (storedName) {
    displayName = storedName;
  } else if (storedEmail) {
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

      <button onClick={() => fetchData("/hello", "dashboard")}>
          <span>🏠</span> <span>Dashboard</span>
        </button>

        <button onClick={() => fetchData("/Employees", "Employees")}>
          <span>👥</span> <span>Employees</span>
        </button>

        <button onClick={() => setActiveSection("reports")}>
          <span>📊</span> <span>Reports</span>
        </button>

         <button onClick={() => setActiveSection("workspace")}>
          <span>💼</span> <span>Workspace</span>
        </button>
  
        <button onClick={() => setActiveSection("settings")}>
          <span>⚙️</span> <span>Settings</span>
        </button>

        <button onClick={handleLogout}>
          <span>⏻</span> <span>Logout</span>
        </button>
      </div>

      <div className="content">
        <div className="horizontalbar">
          <span>Data and Technology CRM Systems</span>
 <div className="user-info">
  <img src="/user.png" alt="user" />
  <span>Welcome, {displayName}</span>
</div>
        </div>

 {activeSection === "dashboard" && (
  <>
    <div className="dashboard-grid">

      <div className="kpi-card">
        <h3>Total Revenue</h3>
        <h1>₹1,24,000</h1>
        <span className="growth">+12.5%</span>
      </div>

      <div className="kpi-card">
        <h3>Active Leads</h3>
        <h1>342</h1>
        <span className="growth">+5%</span>
      </div>

      <div className="kpi-card">
        <h3>Conversion Rate</h3>
        <h1>24%</h1>
        <span className="growth down">-2%</span>
      </div>

      <div className="kpi-card">
        <h3>Tasks Completed</h3>
        <h1>89</h1>
        <span className="growth">+18%</span>
      </div>

    </div>
   </>
)}

          <div className="charts-container">
            <div className="chart" onClick={() => setExpandedChart("bar")}>
              <MyBarChart
                chartData={selectedStats}
                headers={headers}
                title={selectedColumnName}
              />
            </div>

            <div className="chart" onClick={() => setExpandedChart("pie")}>
              <MyPieChart
                chartData={selectedStats}
                headers={headers}
                title={selectedColumnName}
              />
            </div>

            <div className="chart" onClick={() => setExpandedChart("line")}>
              <LineChart
                chartData={selectedStats}
                headers={headers}
                title={selectedColumnName}
              />
            </div>

            <div className="chart" onClick={() => setExpandedChart("scatter")}>
              <ScatterChart
                chartDataX={selectedStats.slice(0, selectedStats.length - 1)}
                chartDataY={selectedStats.slice(1)}
                title={selectedColumnName}
              />
            </div>

            {expandedChart && (
              <div className="chart-modal" onClick={() => setExpandedChart(null)}>
                <div
                  className="chart-modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="close-btn"
                    onClick={() => setExpandedChart(null)}
                  >
                    ✖ Close
                  </button>

                  {expandedChart === "bar" && (
                    <MyBarChart
                      chartData={selectedStats}
                      headers={headers}
                      title={selectedColumnName}
                    />
                  )}
                  {expandedChart === "pie" && (
                    <MyPieChart
                      chartData={selectedStats}
                      headers={headers}
                      title={selectedColumnName}
                    />
                  )}
                  {expandedChart === "line" && (
                    <LineChart
                      chartData={selectedStats}
                      headers={headers}
                      title={selectedColumnName}
                    />
                  )}
                  {expandedChart === "scatter" && (
                    <ScatterChart
                      chartDataX={selectedStats.slice(
                        0,
                        selectedStats.length - 1
                      )}
                      chartDataY={selectedStats.slice(1)}
                      title={selectedColumnName}
                    />
                  )}

                  {selectedStats && selectedStats.length > 0 ? (
                    <div className="chart-stats">
                      <p>
                        <strong>Count:</strong> {selectedStats.length}
                      </p>
                      <p>
                        <strong>Min:</strong>{" "}
                        {Math.min(...selectedStats).toFixed(2)}
                      </p>
                      <p>
                        <strong>Max:</strong>{" "}
                        {Math.max(...selectedStats).toFixed(2)}
                      </p>
                      <p>
                        <strong>Average:</strong>{" "}
                        {(
                          selectedStats.reduce((a, b) => a + b, 0) /
                          selectedStats.length
                        ).toFixed(2)}
                      </p>
                    </div>
                  ) : (
                    <div className="chart-stats">
                      No numeric statistics found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "Employees" && (
          <div className="Employees-section">
            <Employee Employees={Employees} />
          </div>
        )}

        {activeSection === "reports" && (
          <div className="reports-section">
            <Reports />
          </div>
        )}
          {activeSection === "workspace" && (
          <div className="workspace-section">
            <TasksWorkspace />
            </div>
)}
        {activeSection === "settings" && (
          <div className="settings-section">
            <Settings />
          </div>
        )}

{activeSection !== "Employees" &&
 activeSection !== "reports" &&
 activeSection !== "settings" &&
 activeSection !== "workspace" && (
            <div className="table-section">
              <div className="table-toolbar">
                <button onClick={() => setShowTableEditor(false)}>
                  📑 Excel Table
                </button>
                <button onClick={() => setShowTableEditor(true)}>
                  🧮 Table Editor
                </button>
              </div>
              <div className="excel-container">
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
                    setHeaders={setHeaders}
                    onColumnSelect={handleColumnSelect}
                  />
                )}
              </div>
            </div>
          )}

        {backendData && (
          <div className="backend-response">
            <h3>Response from backend:</h3>
            <pre>{JSON.stringify(backendData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default CRM;





