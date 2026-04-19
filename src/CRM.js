import React, { useState, useEffect } from "react";
import MyBarChart from "./chart";
import MyPieChart from "./pchart";
import ExcelTable from "./ExcelTable";
import TableEditor from "./TableEditor";
import ScatterChart from "./ScatterChart";
import LineChart from "./LineChart";
import "./CRM.css";

function CRM({ setMode }) {
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [selectedChartData, setSelectedChartData] = useState([]);   // numeric values for charts
  const [activeLabels, setActiveLabels] = useState([]);             // labels (e.g., names, categories)
  const [selectedColumns, setSelectedColumns] = useState([]);       // for info display
  const [expandedChart, setExpandedChart] = useState(null);

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMode("login");
    }
  }, [setMode]);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setExpandedChart(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // This is called from ExcelTable when user selects columns
  const handleMultivariateUpdate = (data, labels, columnsInfo = []) => {
    setSelectedChartData(data);     // e.g. array of numbers for Y-axis
    setActiveLabels(labels);        // e.g. names or categories for X-axis / legend
    setSelectedColumns(columnsInfo);
  };

  return (
    <div className="crm-module" style={{ height: "100%" }}>
      <style>{`
        /* Your existing styles here - unchanged */
        .crm-module { font-family: 'Inter', system-ui, sans-serif; color: var(--text-main); }
        .crm-header { margin-bottom: 40px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
        .crm-title { font-size: 2.4rem; font-weight: 800; letter-spacing: -0.5px; }
        .crm-subtitle { color: var(--text-dim); font-size: 1.1rem; margin-top: 6px; }
        .charts-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
          gap: 24px;
          margin-bottom: 50px;
        }
        .chart-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s ease;
          cursor: pointer;
          min-height: 380px;
          display: flex;
          flex-direction: column;
        }
        .chart-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        .chart-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 18px;
          color: var(--text-main);
        }
        .empty-placeholder {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          font-style: italic;
          text-align: center;
        }
        /* ... rest of your styles ... */
      `}</style>

      <div className="crm-header">
        <h1 className="crm-title">CRM Analytics</h1>
        <p className="crm-subtitle">
          Advanced data visualization and workforce insights
          {selectedColumns.length > 0 && ` • Using: ${selectedColumns.join(", ")}`}
        </p>
      </div>

      {/* Charts Grid */}
      <div className="charts-container">
        <div className="chart-card" onClick={() => setExpandedChart("bar")}>
          <div className="chart-title">Distribution Analysis</div>
          {selectedChartData.length > 0 ? (
            <MyBarChart chartData={selectedChartData} labels={activeLabels} title="Bar Analysis" />
          ) : (
            <div className="empty-placeholder">
              Select numeric columns in the table below to view distribution
            </div>
          )}
        </div>

        <div className="chart-card" onClick={() => setExpandedChart("pie")}>
          <div className="chart-title">Proportional Breakdown</div>
          {selectedChartData.length > 0 ? (
            <MyPieChart chartData={selectedChartData} labels={activeLabels} />
          ) : (
            <div className="empty-placeholder">
              Select a numeric column to see distribution
            </div>
          )}
        </div>

        <div className="chart-card" onClick={() => setExpandedChart("line")}>
          <div className="chart-title">Trend Analysis</div>
          {selectedChartData.length > 0 ? (
            <LineChart chartData={selectedChartData} labels={activeLabels} />
          ) : (
            <div className="empty-placeholder">
              Select multiple numeric columns to compare trends
            </div>
          )}
        </div>

        <div className="chart-card" onClick={() => setExpandedChart("scatter")}>
          <div className="chart-title">Correlation Map</div>
          {selectedChartData.length > 1 ? (   // needs at least 2 for scatter
            <ScatterChart chartData={selectedChartData} labels={activeLabels} />
          ) : (
            <div className="empty-placeholder">
              Select at least TWO numeric columns to see correlation (X vs Y)
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="table-section">
        <div className="table-toolbar">
          <button
            className={!showTableEditor ? "active" : ""}
            onClick={() => setShowTableEditor(false)}
          >
            📑 Live Data Table
          </button>
          <button
            className={showTableEditor ? "active" : ""}
            onClick={() => setShowTableEditor(true)}
          >
            🧮 Table Editor
          </button>
        </div>

        <div className="excel-container">
          {showTableEditor ? (
            <TableEditor
              tableData={[]}
              setTableData={() => {}}
              headers={[]}
              setHeaders={() => {}}
            />
          ) : (
            <ExcelTable onColumnSelect={handleMultivariateUpdate} />
          )}
        </div>
      </div>

      {/* Expanded Modal */}
      {expandedChart && (
        <div className="chart-modal" onClick={() => setExpandedChart(null)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setExpandedChart(null)}>
              ✕ Close
            </button>

            <div style={{ padding: "40px 40px 20px" }}>
              <h2 style={{ marginBottom: "30px", textAlign: "center" }}>
                {expandedChart === "bar" && "Distribution Analysis"}
                {expandedChart === "pie" && "Proportional Breakdown"}
                {expandedChart === "line" && "Trend Analysis"}
                {expandedChart === "scatter" && "Correlation Map"}
              </h2>

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
          </div>
        </div>
      )}
    </div>
  );
}

export default CRM;
