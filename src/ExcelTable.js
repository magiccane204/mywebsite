import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Resizable } from "react-resizable";
import {
  Plus, Download, Upload, FileText,
  Trash2, AlertTriangle, Save, CheckCircle,
  X, Table as TableIcon, Loader2
} from "lucide-react";
import "./ExcelTable.css";

export default function ExcelTable({ onColumnSelect }) {
  const [tableData, setTableData] = useState([Array(10).fill("")]);
  const [colHeaders, setColHeaders] = useState(["Name", "Email", "Phone", "LinkedIn", "Skills", "Experience", "Education"]);
  const [colWidths, setColWidths] = useState({});
  const [selectedCell, setSelectedCell] = useState({ r: 0, c: 0 });
  const [selectedCols, setSelectedCols] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [formatConfirmText, setFormatConfirmText] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("crm-data");
    const savedHeaders = localStorage.getItem("crm-headers");
    const savedWidths = localStorage.getItem("crm-widths");

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.length > 0) setTableData(parsed);
      } catch (e) {}
    } else {
      setTableData(Array(15).fill(null).map(() => Array(10).fill("")));
    }

    if (savedHeaders) setColHeaders(JSON.parse(savedHeaders));
    if (savedWidths) setColWidths(JSON.parse(savedWidths));
  }, []);

  // Auto-save
  useEffect(() => {
    setIsAutoSaving(true);
    const timer = setTimeout(() => {
      localStorage.setItem("crm-data", JSON.stringify(tableData));
      localStorage.setItem("crm-headers", JSON.stringify(colHeaders));
      localStorage.setItem("crm-widths", JSON.stringify(colWidths));
      setIsAutoSaving(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [tableData, colHeaders, colWidths]);

  // Import Excel/CSV
  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data.length > 0) {
        setColHeaders(data[0]);
        setTableData(data.slice(1).map(row => [...row, ...Array(10 - row.length).fill("")]));
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  // AI Resume Upload
  const handleAiResumeUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setIsParsing(true);
    const formData = new FormData();
    for (const file of files) formData.append("resumes", file);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/resume/extract", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        const newRows = res.data.resumes
          .filter(r => r.success)
          .map(r => [
            r.data.name || "N/A",
            r.data.email || "N/A",
            r.data.phone || "N/A",
            r.data.linkedIn || "N/A",
            r.data.skills || "N/A",
            r.data.experience || "N/A",
            r.data.education || "N/A",
            ...Array(3).fill("N/A")
          ]);

        if (newRows.length > 0) {
          setTableData(prev => [...newRows, ...prev]);
        }
      }
    } catch (err) {
      alert("AI Resume parsing failed. Please try again.");
    } finally {
      setIsParsing(false);
      e.target.value = null;
    }
  };

  // Column selection for charts
  const handleColumnHeaderClick = (colIndex) => {
    const nextSelected = selectedCols.includes(colIndex)
      ? selectedCols.filter(i => i !== colIndex)
      : [...selectedCols, colIndex];

    setSelectedCols(nextSelected);

    const chartData = tableData.map((row, rIdx) => {
      const dataPoint = { name: row[0] || `Row ${rIdx + 1}` };
      nextSelected.forEach(idx => {
        const key = colHeaders[idx] || `Field ${idx + 1}`;
        const val = parseFloat(row[idx]) || 0;
        dataPoint[key] = val;
      });
      return dataPoint;
    }).filter(point => nextSelected.some(idx => point[colHeaders[idx] || `Field ${idx + 1}`] !== 0));

    const activeLabels = nextSelected.map(idx => colHeaders[idx] || `Field ${idx + 1}`);
    if (onColumnSelect) onColumnSelect(chartData, activeLabels);
  };

  const handleCellChange = (r, c, value) => {
    const newData = [...tableData];
    newData[r][c] = value;
    setTableData(newData);
  };

  const handleHeaderChange = (c, value) => {
    const newHeaders = [...colHeaders];
    while (newHeaders.length <= c) newHeaders.push("");
    newHeaders[c] = value;
    setColHeaders(newHeaders);
  };

  const addRow = () => {
    const numCols = tableData[0]?.length || 10;
    setTableData([...tableData, Array(numCols).fill("")]);
  };

  const deleteRow = (rowIndex) => {
    if (tableData.length <= 1) return;
    setTableData(tableData.filter((_, i) => i !== rowIndex));
  };

  const insertColumn = (cIndex) => {
    const newData = tableData.map(row => {
      const newRow = [...row];
      newRow.splice(cIndex + 1, 0, "");
      return newRow;
    });
    const newHeaders = [...colHeaders];
    newHeaders.splice(cIndex + 1, 0, "");
    setColHeaders(newHeaders);
    setTableData(newData);
  };

  const deleteColumn = (cIndex) => {
    if (tableData[0].length <= 1) return;
    const newData = tableData.map(row => row.filter((_, i) => i !== cIndex));
    const newHeaders = colHeaders.filter((_, i) => i !== cIndex);
    setColHeaders(newHeaders);
    setTableData(newData);
    setSelectedCols(prev => prev.filter(i => i !== cIndex));
  };

  const onResize = (index) => (e, { size }) => {
    setColWidths(prev => ({ ...prev, [index]: size.width }));
  };

  const exportToExcel = () => {
    const exportData = [colHeaders, ...tableData];
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CRM_Data");
    XLSX.writeFile(wb, `CRM_Export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const triggerReset = () => {
    if (formatConfirmText === "FORMAT") {
      setTableData(Array(15).fill(null).map(() => Array(10).fill("")));
      setColHeaders(["Name", "Email", "Phone", "LinkedIn", "Skills", "Experience", "Education"]);
      setColWidths({});
      setSelectedCols([]);
      setIsFormatModalOpen(false);
      setFormatConfirmText("");
    }
  };

  return (
    <div className="crm-app-container">
      <style jsx>{`
        .crm-app-container {
          background: var(--bg-card);
          border-radius: 20px;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
          color: var(--text-main);
        }

        .crm-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--bg-sidebar);
          border-bottom: 1px solid var(--border);
        }

        .toolbar-left, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .tool-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-main);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .tool-btn:hover {
          background: rgba(124, 58, 237, 0.1);
          border-color: var(--accent);
        }

        .tool-btn.primary {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }

        .status-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-tag.saved {
          background: #10b98122;
          color: #10b981;
        }

        .status-tag.saving {
          background: #eab30822;
          color: #eab308;
        }

        .formula-bar {
          display: flex;
          align-items: center;
          padding: 10px 24px;
          background: var(--bg-viewport);
          border-bottom: 1px solid var(--border);
          gap: 12px;
          font-size: 14px;
        }

        .grid-viewport {
          flex: 1;
          overflow: auto;
          padding: 10px;
          background: var(--bg-card);
        }

        .excel-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--bg-card);
          color: var(--text-main);
        }

        .excel-table th, .excel-table td {
          border: 1px solid var(--border);
          padding: 8px;
          text-align: left;
          vertical-align: middle;
        }

        .excel-table th {
          background: var(--bg-sidebar);
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .excel-table td {
          background: var(--bg-card);
          min-width: 120px;
        }

        .cell-editor {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main);
          font-size: 14px;
          padding: 4px 6px;
        }

        .cell-editor:focus {
          background: rgba(124, 58, 237, 0.15);
          border-radius: 4px;
        }

        .header-edit-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-weight: 600;
          color: var(--text-main);
        }

        .header-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .selected-column-header {
          background: rgba(124, 58, 237, 0.25) !important;
        }

        .active-cell {
          box-shadow: inset 0 0 0 2px var(--accent);
        }

        .row-number-cell, .row-number-header, .actions-header {
          background: var(--bg-sidebar);
          text-align: center;
          width: 50px;
          font-weight: 600;
        }

        .del-row-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          opacity: 0.6;
        }

        .del-row-btn:hover {
          opacity: 1;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .modal-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          max-width: 380px;
        }
      `}</style>

      {/* Toolbar */}
      <header className="crm-toolbar">
        <div className="toolbar-left">
          <div className="brand">
            <TableIcon size={20} />
            <span>CRM AI Engine</span>
          </div>
          <button className="tool-btn primary" onClick={addRow}>
            <Plus size={16} /> Add Row
          </button>
          <button className="tool-btn" onClick={exportToExcel}>
            <Download size={16} /> Export
          </button>
          <label className="tool-btn">
            <Upload size={16} /> Import
            <input type="file" hidden accept=".xlsx,.xls,.csv" onChange={handleImportExcel} />
          </label>
          <label className={`tool-btn ${isParsing ? 'loading' : ''}`}>
            {isParsing ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
            <span>{isParsing ? "Parsing..." : "Parse Resumes"}</span>
            <input type="file" hidden multiple accept=".pdf,.docx" onChange={handleAiResumeUpload} disabled={isParsing} />
          </label>
        </div>

        <div className="toolbar-right">
          <div className={`status-tag ${isAutoSaving ? 'saving' : 'saved'}`}>
            {isAutoSaving ? <Save size={12} className="spin" /> : <CheckCircle size={12} />}
            {isAutoSaving ? "Saving..." : "All Changes Saved"}
          </div>
          <button className="tool-btn danger" onClick={() => setIsFormatModalOpen(true)}>
            <AlertTriangle size={16} />
          </button>
        </div>
      </header>

      {/* Formula Bar */}
      <div className="formula-bar">
        <div className="cell-id">
          {String.fromCharCode(65 + selectedCell.c)}{selectedCell.r + 1}
        </div>
        <div className="fx-label">fx</div>
        <input
          className="formula-input"
          value={tableData[selectedCell.r]?.[selectedCell.c] || ""}
          onChange={(e) => handleCellChange(selectedCell.r, selectedCell.c, e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="grid-viewport">
        <table className="excel-table">
          <thead>
            <tr>
              <th className="row-number-header">#</th>
              {colHeaders.map((_, c) => (
                <Resizable
                  key={c}
                  width={colWidths[c] || 160}
                  height={0}
                  onResize={onResize(c)}
                  minConstraints={[100, 0]}
                >
                  <th
                    style={{ width: colWidths[c] || 160 }}
                    onClick={() => handleColumnHeaderClick(c)}
                    className={selectedCols.includes(c) ? "selected-column-header" : ""}
                  >
                    <div className="header-cell">
                      <input
                        className="header-edit-input"
                        value={colHeaders[c] || ""}
                        placeholder={`Field ${c + 1}`}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleHeaderChange(c, e.target.value)}
                      />
                      <div className="header-actions">
                        <button onClick={(e) => { e.stopPropagation(); insertColumn(c); }}>+</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteColumn(c); }}><X size={10} /></button>
                      </div>
                    </div>
                  </th>
                </Resizable>
              ))}
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, r) => (
              <tr key={r}>
                <td className="row-number-cell">{r + 1}</td>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    className={selectedCell.r === r && selectedCell.c === c ? "active-cell" : ""}
                    onClick={() => setSelectedCell({ r, c })}
                  >
                    <input
                      className="cell-editor"
                      value={cell || ""}
                      onChange={(e) => handleCellChange(r, c, e.target.value)}
                    />
                  </td>
                ))}
                <td className="row-action-cell">
                  <button className="del-row-btn" onClick={() => deleteRow(r)}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reset Modal */}
      {isFormatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <AlertTriangle size={48} color="#ef4444" />
            <h2>Reset Table</h2>
            <p>This action will permanently clear all data.</p>
            <input
              type="text"
              placeholder="Type FORMAT to confirm"
              value={formatConfirmText}
              onChange={(e) => setFormatConfirmText(e.target.value)}
              style={{ width: "100%", margin: "16px 0", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
            />
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={() => setIsFormatModalOpen(false)}>Cancel</button>
              <button className="confirm-btn" onClick={triggerReset} style={{ background: "#ef4444", color: "white" }}>
                Wipe Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
