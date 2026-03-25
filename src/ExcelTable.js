import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./ExcelTable.css";

/**
 * CRM EXCEL ENGINE v2.0
 * Features: Persistence, Resume Extraction, Security Format, Row ID Mapping
 */
export default function ExcelTable({ tableData, setTableData, onColumnSelect }) {
  // --- EXTENDED STATE MANAGEMENT ---
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [colHeaders, setColHeaders] = useState([]);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [formatConfirmText, setFormatConfirmText] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // --- PERSISTENCE LAYER (The "CRM" Storage) ---
  
  // 1. Initial Hydration: Load from LocalStorage or create schema
  useEffect(() => {
    const savedData = localStorage.getItem("crm-vault-main-data");
    const savedHeaders = localStorage.getItem("crm-vault-headers");

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.length > 0) setTableData(parsed);
      } catch (e) {
        console.error("Corrupt CRM data found, resetting...");
      }
    } else {
      // Default CRM Template: 15 rows, 10 columns
      const defaultRows = Array(15).fill(null).map(() => Array(10).fill(""));
      setTableData(defaultRows);
    }

    if (savedHeaders) {
      setColHeaders(JSON.parse(savedHeaders));
    }
  }, [setTableData]);

  // 2. Auto-Save Debounce: Persist every change automatically
  useEffect(() => {
    if (tableData && tableData.length > 0) {
      setIsAutoSaving(true);
      const timer = setTimeout(() => {
        localStorage.setItem("crm-vault-main-data", JSON.stringify(tableData));
        setIsAutoSaving(false);
      }, 800); // 800ms debounce to save battery/performance
      return () => clearTimeout(timer);
    }
  }, [tableData]);

  // --- CORE TABLE LOGIC ---

  const normalize = useCallback((data) => {
    if (!data || !data.length) return [Array(10).fill("")];
    const maxCols = Math.max(...data.map((r) => (r ? r.length : 0)), 10);
    return data.map((r) => {
      const row = r ? [...r] : [];
      while (row.length < maxCols) row.push("");
      return row;
    });
  }, []);

  const handleChange = (r, c, value) => {
    const newData = [...tableData];
    // Ensure the row exists before writing
    if (!newData[r]) newData[r] = Array(newData[0]?.length || 10).fill("");
    newData[r][c] = value;
    setTableData(newData);
  };

  const addRow = () => {
    const cols = tableData[0]?.length || 10;
    setTableData([...tableData, Array(cols).fill("")]);
  };

  const deleteRow = (rowIndex) => {
    if (window.confirm("Are you sure you want to delete this specific record?")) {
      const data = tableData.filter((_, i) => i !== rowIndex);
      setTableData(data.length ? data : [Array(10).fill("")]);
    }
  };

  // --- COLUMN OPERATIONS ---

  const insertColumnAt = (colIndex) => {
    const data = tableData.map((row) => {
      const r = [...row];
      r.splice(colIndex + 1, 0, "");
      return r;
    });
    setTableData(data);
  };

  const deleteColumn = (colIndex) => {
    if (tableData[0]?.length <= 1) return;
    if (window.confirm(`Delete Column ${colIndex + 1}?`)) {
      const data = tableData.map((row) => {
        const r = [...row];
        r.splice(colIndex, 1);
        return r;
      });
      setTableData(data);
    }
  };

  // --- FILE I/O OPERATIONS ---

  const saveExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CRM_Master_Data");
    XLSX.writeFile(wb, `CRM_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleUploadExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      setTableData(normalize(data));
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadResume = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    const formData = new FormData();
    for (const file of files) formData.append("resumes", file);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/resume/extract", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const parsedResumes = res.data?.resumes || [];
      const rowsToAdd = parsedResumes
        .filter((r) => r.success)
        .map((r) => {
          const d = r.data || {};
          const values = [
            d.name || "N/A",
            d.email || "N/A",
            d.phone || "N/A",
            d.linkedIn || "N/A",
            d.experience || "N/A",
            d.education || "N/A",
            (d.skills || []).join(", "),
          ];
          const cols = Math.max(tableData[0]?.length || 10, values.length);
          const row = Array(cols).fill("");
          for (let i = 0; i < values.length; i++) row[i] = values[i];
          return row;
        });

      setTableData([...tableData, ...rowsToAdd]);
    } catch (err) {
      alert("Resume Extraction Failed. Check console.");
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  // --- SECURITY: THE "NUCLEAR" FORMAT ---

  const triggerFormat = () => {
    if (formatConfirmText === "FORMAT") {
      const resetState = [Array(10).fill("")];
      setTableData(resetState);
      localStorage.removeItem("crm-vault-main-data");
      setFormatConfirmText("");
      setIsFormatModalOpen(false);
      alert("System Formatted Successfully.");
    } else {
      alert("Invalid confirmation text. Operation aborted.");
    }
  };

  const handleColumnClick = (colIndex) => {
    setSelectedColumn(colIndex);
    const values = tableData
      .map((row) => parseFloat(row[colIndex]))
      .filter((v) => !isNaN(v));
    if (onColumnSelect) onColumnSelect(values, colIndex);
  };

  return (
    <div className="excel-container">
      {/* HEADER TOOLBAR */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <button onClick={addRow} className="col-buttons">➕ Add Record</button>
          <button onClick={saveExcel} className="col-buttons">💾 Export Excel</button>
          
          <label className="upload-label">
            📁 Import CSV/XLSX
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleUploadExcel} hidden />
          </label>

          <label className="upload-label resume-btn">
            📄 Parse Resumes
            <input type="file" accept=".pdf,.doc,.docx" multiple onChange={handleUploadResume} hidden />
          </label>
        </div>

        <div className="toolbar-right">
            <span className="status-indicator">
                {isAutoSaving ? "Saving..." : "✅ All Changes Saved"}
            </span>
            <button 
                onClick={() => setIsFormatModalOpen(true)} 
                className="col-buttons danger-btn"
            >
                ⚠️ Reset System
            </button>
        </div>
      </div>

      {/* THE DATA GRID */}
      <div className="table-wrapper">
        <table className="crm-table">
          <thead>
            <tr>
              {tableData[0]?.map((_, c) => (
                <th
                  key={c}
                  onClick={() => handleColumnClick(c)}
                  className={selectedColumn === c ? "selected-header" : ""}
                >
                  <div className="header-content">
                    <span className="col-label">
                      {colHeaders[c] || `Field ${c + 1}`}
                    </span>
                    <div className="header-actions">
                        <button type="button" className="mini-btn" onClick={(e) => { e.stopPropagation(); insertColumnAt(c); }}>+</button>
                        <button type="button" className="mini-btn" onClick={(e) => { e.stopPropagation(); deleteColumn(c); }}>🗑</button>
                    </div>
                  </div>
                </th>
              ))}
              <th className="sticky-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {tableData.map((row, r) => (
              <tr key={`row-${r}`}>
                {row.map((cell, c) => (
                  <td key={`cell-${r}-${c}`}>
                    <input
                      className="cell-input"
                      type="text"
                      value={cell || ""}
                      onChange={(e) => handleChange(r, c, e.target.value)}
                      placeholder="..."
                    />
                  </td>
                ))}
                <td className="sticky-col">
                  <button onClick={() => deleteRow(r)} className="row-delete-btn">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SECURITY MODAL */}
      {isFormatModalOpen && (
        <div className="security-overlay">
          <div className="security-modal">
            <h2>⚠️ Critical Security Warning</h2>
            <p>You are about to wipe the entire CRM database. This action is irreversible.</p>
            <p className="instruction">Type <strong>FORMAT</strong> below to confirm:</p>
            
            <input 
              type="text" 
              className="confirm-input"
              value={formatConfirmText}
              onChange={(e) => setFormatConfirmText(e.target.value)}
              placeholder="Enter confirmation text..."
            />

            <div className="modal-footer">
              <button onClick={() => { setIsFormatModalOpen(false); setFormatConfirmText(""); }}>Cancel</button>
              <button onClick={triggerFormat} className="confirm-delete-btn">Wipe Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
