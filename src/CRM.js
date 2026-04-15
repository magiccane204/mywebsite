import React, { useState, useEffect } from "react";
import MyBarChart from "./chart";
import MyPieChart from "./pchart";
import ExcelTable from "./ExcelTable";
import TableEditor from "./TableEditor";
import ScatterChart from "./ScatterChart";
import LineChart from "./LineChart";
import api from "./api";
import "./CRM.css";

function CRM({ setMode }) {
  const [showTableEditor, setShowTableEditor] = useState(false);
  const [selectedChartData, setSelectedChartData] = useState([]);
  const [activeLabels, setActiveLabels] = useState([]);
  const [expandedChart, setExpandedChart] = useState(null);

  // Authentication check
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

  const handleMultivariateUpdate = (data, labels) => {
    setSelectedChartData(data);
    setActiveLabels(labels);
  };

  return (
    <div className="crm-module" style={{ height: "100%" }}>
      <style>{`
        .crm-module {
          font-family: 'Inter', system-ui, sans-serif;
          color: var(--text-main);
        }
        .crm-header {
          margin-bottom: 40px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 20px;
        }
        .crm-title {
          font-size: 2.4rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .crm-subtitle {
          color: var(--text-dim);
          font-size: 1.1rem;
          margin-top: 6px;
        }

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

        .table-section {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px;
        }
        .table-toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
        }
        .table-toolbar button {
          padding: 10px 24px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-main);
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .table-toolbar button.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }

        .chart-modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .chart-modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          width: 92%;
          max-width: 1100px;
          max-height: 90vh;
          overflow: hidden;
          position: relative;
        }
        .close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          z-index: 10;
        }
      `}</style>

      <div className="crm-header">
        <h1 className="crm-title">CRM Analytics</h1>
        <p className="crm-subtitle">Advanced data visualization and workforce insights</p>
      </div>

      {/* Charts Grid */}
      <div className="charts-container">
        <div className="chart-card" onClick={() => setExpandedChart("bar")}>
          <div className="chart-title">Distribution Analysis</div>
          <MyBarChart 
            chartData={selectedChartData} 
            labels={activeLabels} 
            title="Bar Analysis" 
          />
        </div>

        <div className="chart-card" onClick={() => setExpandedChart("pie")}>
          <div className="chart-title">Proportional Breakdown</div>
          <MyPieChart 
            chartData={selectedChartData} 
            labels={activeLabels} 
          />
        </div>

        <div className="chart-card" onClick={() => setExpandedChart("line")}>
          <div className="chart-title">Trend Analysis</div>
          <LineChart 
            chartData={selectedChartData} 
            labels={activeLabels} 
          />
        </div>

        <div className="chart-card" onClick={() => setExpandedChart("scatter")}>
          <div className="chart-title">Correlation Map</div>
          <ScatterChart 
            chartData={selectedChartData} 
            labels={activeLabels} 
          />
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

      {/* Expanded Chart Modal */}
      {expandedChart && (
        <div className="chart-modal" onClick={() => setExpandedChart(null)}>
          <div className="chart-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setExpandedChart(null)}>
              ✕ Close
            </button>
            
            <div style={{ padding: "40px 40px 20px" }}>
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
