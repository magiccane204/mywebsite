import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Resizable } from "react-resizable";
import {
  Plus, Download, Upload, FileText,
  Trash2, AlertTriangle, Save, CheckCircle,
  X, Table as TableIcon, Loader2
} from "lucide-react";

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

  // ... (keep all your existing functions: handleImportExcel, handleAiResumeUpload, etc.)

  const onResize = (index) => (e, { size }) => {
    setColWidths(prev => ({ ...prev, [index]: size.width }));
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

        /* FIXED TABLE STYLES */
        .excel-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;           /* Important for alignment */
          background: var(--bg-card);
        }

        .excel-table th,
        .excel-table td {
          border: 1px solid var(--border);
          padding: 8px 10px;
          text-align: left;
          vertical-align: middle;
          box-sizing: border-box;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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
        }

        /* Column width enforcement */
        .excel-table th.col-resizable,
        .excel-table td.col-resizable {
          min-width: 120px;
        }

        .row-number-header,
        .row-number-cell {
          width: 50px !important;
          min-width: 50px !important;
          max-width: 50px !important;
          text-align: center;
          background: var(--bg-sidebar);
        }

        .actions-header,
        .row-action-cell {
          width: 60px !important;
          min-width: 60px !important;
          max-width: 60px !important;
          text-align: center;
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

      {/* Toolbar - keep as is */}
      <header className="crm-toolbar">
        {/* ... your existing toolbar code ... */}
      </header>

      {/* Formula Bar - keep as is */}
      <div className="formula-bar">
        {/* ... your existing formula bar ... */}
      </div>

      {/* FIXED TABLE */}
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
                    className="col-resizable"
                    style={{
                      width: colWidths[c] || 160,
                      minWidth: colWidths[c] || 160,
                      maxWidth: colWidths[c] || 160,
                    }}
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
                        <button onClick={(e) => { e.stopPropagation(); deleteColumn(c); }}>
                          <X size={10} />
                        </button>
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
                    className={`col-resizable ${selectedCell.r === r && selectedCell.c === c ? "active-cell" : ""}`}
                    style={{
                      width: colWidths[c] || 160,
                      minWidth: colWidths[c] || 160,
                      maxWidth: colWidths[c] || 160,
                    }}
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

      {/* Reset Modal - keep as is */}
      {isFormatModalOpen && (
        <div className="modal-overlay">
          {/* ... your modal code ... */}
        </div>
      )}
    </div>
  );
}
