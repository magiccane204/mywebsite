import { useState, useEffect } from "react";
import MyBarChart from "./chart";
import MyPieChart from "./pchart";
import ExcelTable from "./ExcelTable";
import TableEditor from "./TableEditor";
import ScatterChart from "./ScatterChart";
import LineChart from "./LineChart";
import api from "./api";
import "./CRM.css";

function CRM({ setMode }) {
  const [backendData, setBackendData] = useState(null);
  const [showTableEditor, setShowTableEditor] = useState(false);
  
  // These states are now managed within ExcelTable for persistence, 
  // but we keep them here if TableEditor needs them.
  const [headers, setHeaders] = useState([]);
  const [tableData, setTableData] = useState([]);

  // --- MULTIVARIATE STATES ---
  const [selectedChartData, setSelectedChartData] = useState([]); // Array of objects: [{name: 'John', Salary: 5000}, ...]
  const [activeLabels, setActiveLabels] = useState([]); // Array of strings: ["Salary", "Experience"]
  const [expandedChart, setExpandedChart] = useState(null);

  // Authentication Check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMode("login");
    }
  }, [setMode]);

  // Modal Escape Key logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setExpandedChart(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- UPDATED HANDLER ---
  // This now matches the (data, labels) signature from the new ExcelTable
  const handleMultivariateUpdate = (data, labels) => {
    setSelectedChartData(data);
    setActiveLabels(labels);
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
    <div className="crm-module">
      <div className="horizontalbar">
        <div className="title">Data Analysis & CRM Systems</div>
        <div className="user-info">
          <img src="/user.png" alt="user" />
          <span>Welcome, {displayName}</span>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="charts-container">
        <div className="chart" onClick={() => setExpandedChart("bar")}>
          <MyBarChart 
            chartData={selectedChartData} 
            labels={activeLabels} 
            title={activeLabels.join(" vs ")} 
          />
        </div>

        <div className="chart" onClick={() => setExpandedChart("pie")}>
          <MyPieChart 
            chartData={selectedChartData} 
            labels={activeLabels} 
            title={activeLabels[0] || "No Data"} 
          />
        </div>

        <div className="chart" onClick={() => setExpandedChart("line")}>
          <LineChart 
            chartData={selectedChartData} 
            labels={activeLabels} 
            title="Trend Analysis" 
          />
        </div>

        <div className="chart" onClick={() => setExpandedChart("scatter")}>
          <ScatterChart
            chartData={selectedChartData}
            labels={activeLabels}
            title="Correlation Map"
          />
        </div>

        {/* EXPANDED MODAL */}
        {expandedChart && (
          <div className="chart-modal" onClick={() => setExpandedChart(null)}>
            <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setExpandedChart(null)}>
                ✖ Close
              </button>

              <div className="modal-main-chart">
                {expandedChart === "bar" && (
                  <MyBarChart chartData={selectedChartData} labels={activeLabels} />
                )}
                {expandedChart === "pie" && (
                  <MyPieChart chartData={selectedChartData} labels={activeLabels} />
                )}
                {expandedChart === "line" && (
                  <LineChart chartData={selectedChartData} labels={activeLabels} />
                )}
                {expandedChart === "scatter" && (
                  <ScatterChart chartData={selectedChartData} labels={activeLabels} />
                )}
              </div>

              <div className="chart-stats">
                {activeLabels.length > 0 ? (
                  <div className="multivariate-stats-grid">
                    {activeLabels.map(label => {
                        const values = selectedChartData.map(d => d[label]).filter(v => !isNaN(v));
                        if (values.length === 0) return null;
                        const avg = values.reduce((a, b) => a + b, 0) / values.length;
                        return (
                          <div key={label} className="stat-pill">
                            <strong>{label}:</strong> Avg: {avg.toFixed(2)} | Max: {Math.max(...values)}
                          </div>
                        );
                    })}
                  </div>
                ) : (
                  <p>Select columns in the table below to see detailed analytics.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="table-section">
        <div className="table-toolbar">
          <button className={!showTableEditor ? "active" : ""} onClick={() => setShowTableEditor(false)}>
            📑 Excel Table
          </button>
          <button className={showTableEditor ? "active" : ""} onClick={() => setShowTableEditor(true)}>
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
              onColumnSelect={handleMultivariateUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default CRM;
