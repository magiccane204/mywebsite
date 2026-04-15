import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Resizable } from "react-resizable";
import {
  Plus, Download, Upload, FileText,
  Trash2, AlertTriangle, Save, CheckCircle,
  X, Table as TableIcon, Loader2
} from "lucide-react";

export default function ExcelTable({ onColumnSelect }) {
  const [tableData, setTableData] = useState([Array(7).fill("")]);
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
      setTableData(Array(15).fill(null).map(() => Array(7).fill("")));
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

  // --- NEWLY IMPLEMENTED HANDLER FUNCTIONS ---

  const addRow = () => {
    const newRow = Array(colHeaders.length).fill("");
    setTableData(prev => [...prev, newRow]);
  };

  const deleteRow = (rowIndex) => {
    setTableData(prev => prev.filter((_, i) => i !== rowIndex));
  };

  const insertColumn = (colIndex) => {
    // Add to headers
    const newHeaders = [...colHeaders];
    newHeaders.splice(colIndex + 1, 0, `New Field`);
    setColHeaders(newHeaders);

    // Add to each row
    const newData = tableData.map(row => {
      const newRow = [...row];
      newRow.splice(colIndex + 1, 0, "");
      return newRow;
    });
    setTableData(newData);
  };

  const deleteColumn = (colIndex) => {
    if (colHeaders.length <= 1) return; // Prevent deleting the last column
    setColHeaders(prev => prev.filter((_, i) => i !== colIndex));
    setTableData(prev => prev.map(row => row.filter((_, i) => i !== colIndex)));
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    setTableData(prev => {
      const newData = [...prev];
      newData[rowIndex][colIndex] = value;
      return newData;
    });
  };

  const handleHeaderChange = (colIndex, value) => {
    setColHeaders(prev => {
      const newHeaders = [...prev];
      newHeaders[colIndex] = value;
      return newHeaders;
    });
  };

  const handleColumnHeaderClick = (colIndex) => {
    setSelectedCols(prev => 
      prev.includes(colIndex) ? prev.filter(c => c !== colIndex) : [...prev, colIndex]
    );
    if (onColumnSelect) onColumnSelect(colIndex);
  };

  const exportToExcel = () => {
    const wsData = [colHeaders, ...tableData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CRM Data");
    XLSX.writeFile(wb, "CRM_Export.xlsx");
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      if (data.length > 0) {
        setColHeaders(data[0]);
        // If there's data below headers, use it; otherwise create one empty row
        const rows = data.slice(1);
        setTableData(rows.length > 0 ? rows : [Array(data[0].length).fill("")]);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // reset input
  };

  const handleAiResumeUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsParsing(true);
    
    // Simulate API call for resume parsing
    setTimeout(() => {
      const newRows = Array.from(files).map((file) => {
        const row = Array(colHeaders.length).fill("");
        row[0] = file.name.replace(/\.[^/.]+$/, ""); // Name
        row[1] = "parsed@example.com";               // Email
        row[4] = "React, Node.js";                   // Skills
        return row;
      });
      
      setTableData(prev => [...prev, ...newRows]);
      setIsParsing(false);
      e.target.value = null; // reset input
    }, 2000);
  };

  const triggerReset = () => {
    if (formatConfirmText === "FORMAT") {
      setTableData([Array(colHeaders.length).fill("")]);
      setIsFormatModalOpen(false);
      setFormatConfirmText("");
      localStorage.removeItem("crm-data");
    }
  };

  const onResize = (index) => (e, { size }) => {
    setColWidths(prev => ({ ...prev, [index]: size.width }));
  };

  return (
    <div className="crm-app-container">
      <style jsx>{`
        .crm-app-container {
          background: var(--bg-card, #ffffff);
          border-radius: 20px;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
          color: var(--text-main, #333333);
        }

        .crm-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: var(--bg-sidebar, #f8fafc);
          border-bottom: 1px solid var(--border, #e2e8f0);
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
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 10px;
          color: var(--text-main, #333333);
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .tool-btn:hover {
          background: rgba(124, 58, 237, 0.1);
          border-color: var(--accent, #7c3aed);
        }

        .tool-btn.primary {
          background: var(--accent, #7c3aed);
          color: white;
          border-color: var(--accent, #7c3aed);
        }
        
        .tool-btn.danger:hover {
          background: #fef2f2;
          border-color: #ef4444;
          color: #ef4444;
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
          background: var(--bg-viewport, #f1f5f9);
          border-bottom: 1px solid var(--border, #e2e8f0);
          gap: 12px;
          font-size: 14px;
        }
        
        .formula-input {
          flex: 1;
          background: transparent;
          border: 1px solid var(--border, #e2e8f0);
          padding: 6px 12px;
          border-radius: 6px;
          outline: none;
        }

        .grid-viewport {
          flex: 1;
          overflow: auto;
          padding: 10px;
          background: var(--bg-card, #ffffff);
        }

        /* FIXED & CLEAN TABLE */
        .excel-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;           /* This fixes alignment */
          background: var(--bg-card, #ffffff);
        }

        .excel-table th,
        .excel-table td {
          border: 1px solid var(--border, #e2e8f0);
          padding: 8px 10px;
          box-sizing: border-box;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .excel-table th {
          background: var(--bg-sidebar, #f8fafc);
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
          height: 52px;
        }

        .excel-table td {
          background: var(--bg-card, #ffffff);
          min-height: 42px;
        }

        /* Force consistent column widths */
        .header-cell {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .header-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .header-cell:hover .header-actions {
          opacity: 1;
        }
        
        .header-actions button {
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px;
          color: var(--text-main, #64748b);
          border-radius: 4px;
        }
        
        .header-actions button:hover {
          background: rgba(0,0,0,0.05);
        }

        .row-number-header,
        .row-number-cell {
          width: 50px !important;
          min-width: 50px !important;
          max-width: 50px !important;
          text-align: center;
          background: var(--bg-sidebar, #f8fafc);
        }

        .actions-header,
        .row-action-cell {
          width: 70px !important;
          min-width: 70px !important;
          max-width: 70px !important;
          text-align: center;
        }

        .cell-editor {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-main, #333333);
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
          color: var(--text-main, #333333);
        }

        .selected-column-header {
          background: rgba(124, 58, 237, 0.25) !important;
        }

        .active-cell {
          box-shadow: inset 0 0 0 2px var(--accent, #7c3aed);
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
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          max-width: 380px;
        }
        
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Toolbar */}
      <header className="crm-toolbar">
        <div className="toolbar-left">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <TableIcon size={20} color="var(--accent, #7c3aed)" />
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
            {isAutoSaving ? <Loader2 size={12} className="spin" /> : <CheckCircle size={12} color="#10b981" />}
            <span style={{ color: isAutoSaving ? 'var(--text-main)' : '#10b981' }}>
               {isAutoSaving ? "Saving..." : "All Changes Saved"}
            </span>
          </div>
          <button className="tool-btn danger" onClick={() => setIsFormatModalOpen(true)}>
            <AlertTriangle size={16} />
          </button>
        </div>
      </header>

      {/* Formula Bar */}
      <div className="formula-bar">
        <div className="cell-id" style={{ fontWeight: '600', minWidth: '40px' }}>
          {String.fromCharCode(65 + selectedCell.c)}{selectedCell.r + 1}
        </div>
        <div className="fx-label" style={{ color: '#64748b', fontStyle: 'italic' }}>fx</div>
        <input
          className="formula-input"
          value={tableData[selectedCell.r]?.[selectedCell.c] || ""}
          onChange={(e) => handleCellChange(selectedCell.r, selectedCell.c, e.target.value)}
        />
      </div>

      {/* Table - Fixed Alignment */}
      <div className="grid-viewport">
        <table className="excel-table">
          <thead>
            <tr>
              <th className="row-number-header">#</th>
              {colHeaders.map((header, c) => (
                <Resizable
                  key={c}
                  width={colWidths[c] || 160}
                  height={0}
                  onResize={onResize(c)}
                  minConstraints={[100, 0]}
                >
                  <th
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
                        value={header || ""}
                        placeholder={`Field ${c + 1}`}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleHeaderChange(c, e.target.value)}
                      />
                      <div className="header-actions">
                        <button title="Insert column right" onClick={(e) => { e.stopPropagation(); insertColumn(c); }}>+</button>
                        <button title="Delete column" onClick={(e) => { e.stopPropagation(); deleteColumn(c); }}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  </th>
                </Resizable>
              ))}
              <th className="actions-header">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, r) => (
              <tr key={r}>
                <td className="row-number-cell">{r + 1}</td>
                {row.map((cell, c) => (
                  <td
                    key={c}
                    style={{
                      width: colWidths[c] || 160,
                      minWidth: colWidths[c] || 160,
                      maxWidth: colWidths[c] || 160,
                    }}
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
               <AlertTriangle size={48} color="#ef4444" />
            </div>
            <h2 style={{ margin: '0 0 8px 0' }}>Reset Table</h2>
            <p style={{ margin: '0 0 16px 0', color: '#64748b' }}>This action will permanently clear all data.</p>
            <input
              type="text"
              placeholder="Type FORMAT to confirm"
              value={formatConfirmText}
              onChange={(e) => setFormatConfirmText(e.target.value)}
              style={{ width: "100%", margin: "16px 0", padding: "10px", borderRadius: "8px", border: "1px solid var(--border, #e2e8f0)", boxSizing: 'border-box' }}
            />
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
              <button 
                onClick={() => setIsFormatModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={triggerReset} 
                disabled={formatConfirmText !== "FORMAT"}
                style={{ 
                  background: formatConfirmText === "FORMAT" ? "#ef4444" : "#fca5a5", 
                  color: "white",
                  padding: '8px 16px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: formatConfirmText === "FORMAT" ? 'pointer' : 'not-allowed'
                }}
              >
                Wipe Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
