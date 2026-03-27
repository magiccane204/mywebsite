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
  const [headers, setHeaders] = useState(["Header 1", "Header 2", "Header 3"]);
  const [tableData, setTableData] = useState([
    ["10", "20", "30"],
    ["15", "25", "35"],
    ["12", "22", "32"],
  ]);
  const [selectedStats, setSelectedStats] = useState([]);
  const [selectedColumnName, setSelectedColumnName] = useState("No Column Selected");
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
    <div className="crm-module">
      {/* 1. HORIZONTAL BAR - Moved to top of CRM content */}
      <div className="horizontalbar">
        <div className="title">Data Analysis & CRM Systems</div>
        <div className="user-info">
          <img src="/user.png" alt="user" />
          <span>Welcome, {displayName}</span>
        </div>
      </div>

      {/* 2. CHARTS SECTION */}
      <div className="charts-container">
        <div className="chart" onClick={() => setExpandedChart("bar")}>
          <MyBarChart chartData={selectedStats} headers={headers} title={selectedColumnName} />
        </div>

        <div className="chart" onClick={() => setExpandedChart("pie")}>
          <MyPieChart chartData={selectedStats} headers={headers} title={selectedColumnName} />
        </div>

        <div className="chart" onClick={() => setExpandedChart("line")}>
          <LineChart chartData={selectedStats} headers={headers} title={selectedColumnName} />
        </div>

        <div className="chart" onClick={() => setExpandedChart("scatter")}>
          <ScatterChart
            chartDataX={selectedStats.slice(0, selectedStats.length - 1)}
            chartDataY={selectedStats.slice(1)}
            title={selectedColumnName}
          />
        </div>

        {/* 3. EXPANDED MODAL */}
        {expandedChart && (
          <div className="chart-modal" onClick={() => setExpandedChart(null)}>
            <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setExpandedChart(null)}>
                ✖ Close
              </button>

              {expandedChart === "bar" && (
                <MyBarChart chartData={selectedStats} headers={headers} title={selectedColumnName} />
              )}
              {expandedChart === "pie" && (
                <MyPieChart chartData={selectedStats} headers={headers} title={selectedColumnName} />
              )}
              {expandedChart === "line" && (
                <LineChart chartData={selectedStats} headers={headers} title={selectedColumnName} />
              )}
              {expandedChart === "scatter" && (
                <ScatterChart
                  chartDataX={selectedStats.slice(0, selectedStats.length - 1)}
                  chartDataY={selectedStats.slice(1)}
                  title={selectedColumnName}
                />
              )}

              <div className="chart-stats">
                {selectedStats.length > 0 ? (
                  <>
                    <p><strong>Count:</strong> {selectedStats.length}</p>
                    <p><strong>Min:</strong> {Math.min(...selectedStats).toFixed(2)}</p>
                    <p><strong>Max:</strong> {Math.max(...selectedStats).toFixed(2)}</p>
                    <p><strong>Avg:</strong> {(selectedStats.reduce((a, b) => a + b, 0) / selectedStats.length).toFixed(2)}</p>
                  </>
                ) : (
                  <p>No numeric statistics found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. TABLE SECTION */}
      <div className="table-section">
        <div className="table-toolbar">
          <button onClick={() => setShowTableEditor(false)}>📑 Excel Table</button>
          <button onClick={() => setShowTableEditor(true)}>🧮 Table Editor</button>
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

      {backendData && (
        <div className="backend-response">
          <h3>Response from backend:</h3>
          <pre>{JSON.stringify(backendData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default CRM;
