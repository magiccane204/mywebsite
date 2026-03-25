import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./ExcelTable.css";

export default function ExcelTable({ tableData, setTableData, onColumnSelect, headers }) {
  // --- EXTENDED STATE ---
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [formatConfirmText, setFormatConfirmText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  // --- PERSISTENCE ENGINE ---
  // Ensure the table stays stored in the "CRM Vault"
  useEffect(() => {
    const saved = localStorage.getItem("crm-excel-data-main");
    if (saved && (!tableData || tableData.length === 0)) {
      setTableData(JSON.parse(saved));
    }
  }, [setTableData, tableData]);

  useEffect(() => {
    if (tableData && tableData.length > 0) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        localStorage.setItem("crm-excel-data-main", JSON.stringify(tableData));
        setIsSaving(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tableData]);

  // --- CORE DATA MANIPULATION ---
  const normalize = useCallback((data) => {
    if (!data || data.length === 0) return [Array(10).fill("")];
    const maxCols = Math.max(...data.map((r) => (r ? r.length : 0)), 10);
    return data.map((r) => {
      const row = r ? [...r] : [];
      while (row.length < maxCols) row.push("");
      return row;
    });
  }, []);

  const handleChange = (rowIndex, colIndex, value) => {
    // Deep clone to ensure React detects the change
    const newData = tableData.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        const newRow = [...row];
        newRow[colIndex] = value;
        return newRow;
      }
      return row;
    });
    setTableData(newData);
  };

  const addRow = () => {
    const colCount = tableData[0]?.length || 10;
    const newRow = Array(colCount).fill("");
    setTableData([...tableData, newRow]);
  };

  const deleteRow = (rowIndex) => {
    if (window.confirm("Are you sure you want to delete this row?")) {
      const newData = tableData.filter((_, i) => i !== rowIndex);
      setTableData(newData.length ? newData : [Array(10).fill("")]);
    }
  };

  const insertColumnAt = (colIndex) => {
    const newData = tableData.map((row) => {
      const r = [...row];
      r.splice(colIndex + 1, 0, "");
      return r;
    });
    setTableData(normalize(newData));
  };

  const deleteColumn = (colIndex) => {
    if (tableData[0]?.length <= 1) return;
    if (window.confirm("This will delete the entire column. Continue?")) {
      const newData = tableData.map((row) => {
        const r = [...row];
        r.splice(colIndex, 1);
        return r;
      });
      setTableData(normalize(newData));
    }
  };

  // --- FILE I/O ---
  const saveExcel = () => {
    try {
      const ws = XLSX.utils.aoa_to_sheet(tableData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "CRM_Data_Export");
      XLSX.writeFile(wb, `CRM_Database_${new Date().toLocaleDateString()}.xlsx`);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const handleUploadExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        setTableData(normalize(data));
        setUploadStatus("Excel Imported!");
      } catch (err) {
        setUploadStatus("Import Failed.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- RESUME PARSER (300+ Line Complexity) ---
  const handleUploadResume = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadStatus("Parsing Resumes...");
    const formData = new FormData();
    for (const file of files) {
      formData.append("resumes", file);
    }

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
          // Ensure row matches table width
          const row = Array(Math.max(tableData[0]?.length || 7, values.length)).fill("");
          values.forEach((v, i) => (row[i] = v));
          return row;
        });

      setTableData(normalize([...tableData, ...rowsToAdd]));
      setUploadStatus("Success!");
    } catch (err) {
      console.error("Resume extraction error", err);
      setUploadStatus("Extraction Error.");
    } finally {
      e.target.value = "";
    }
  };

  // --- SECURITY: NUCLEAR FORMAT ---
  const triggerFormat = () => {
    if (formatConfirmText === "FORMAT") {
      const resetData = [Array(10).fill("")];
      setTableData(resetData);
      localStorage.removeItem("crm-excel-data-main");
      setFormatConfirmText("");
      setIsFormatModalOpen(false);
      alert("CRM Database has been wiped clean.");
    } else {
      alert("Incorrect confirmation text. Database NOT deleted.");
    }
  };

  const handleHeaderClick = (c) => {
    setSelectedColumn(c);
    const colValues = tableData.map((row) => row[c]);
    if (onColumnSelect) onColumnSelect(colValues, c);
  };

  return (
    <div className="excel-container">
      <div className="table-toolbar">
        <div className="toolbar-left">
          <button onClick={addRow} className="col-buttons action-btn">➕ Add Row</button>
          <button onClick={saveExcel} className="col-buttons action-btn">💾 Save Excel</button>
          
          <label className="upload-label">
            Import Excel
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleUploadExcel} hidden />
          </label>

          <label className="upload-label resume-btn">
            Bulk Resume Parse
            <input type="file" accept=".pdf,.doc,.docx" multiple onChange={handleUploadResume} hidden />
          </label>
        </div>

        <div className="toolbar-right">
          <span className="status-badge">{isSaving ? "Auto-saving..." : "✓ Saved"}</span>
          <button onClick={() => setIsFormatModalOpen(true)} className="danger-reset-btn">⚠️ FORMAT SYSTEM</button>
        </div>
      </div>

      {uploadStatus && <div className="upload-notification">{uploadStatus}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {tableData[0]?.map((_, c) => (
                <th 
                  key={`head-${c}`} 
                  onClick={() => handleHeaderClick(c)}
                  style={{ background: selectedColumn === c ? "#e3f2fd" : "inherit" }}
                >
                  <div className="th-content">
                    <span className="th-text">{headers[c] || `Column ${c + 1}`}</span>
                    <div className="th-actions">
                      <button onClick={(e) => { e.stopPropagation(); insertColumnAt(c); }}>+</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteColumn(c); }}>🗑</button>
                    </div>
                  </div>
                </th>
              ))}
              <th className="sticky-action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, r) => (
              <tr key={`row-${r}`}>
                {row.map((cell, c) => (
                  <td key={`cell-${r}-${c}`}>
                    <input
                      type="text"
                      className="cell-input"
                      value={cell || ""}
                      onChange={(e) => handleChange(r, c, e.target.value)}
                    />
                  </td>
                ))}
                <td className="sticky-action">
                  <button onClick={() => deleteRow(r)} className="square-btn del-row">🗑</button>
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
            <p>You are about to delete <strong>ALL</strong> entries in your CRM system.</p>
            <p>This cannot be undone. To proceed, please type <strong>FORMAT</strong> below:</p>
            
            <input 
              type="text" 
              className="confirm-input"
              value={formatConfirmText}
              onChange={(e) => setFormatConfirmText(e.target.value)}
              autoFocus
            />

            <div className="modal-buttons">
              <button className="cancel-btn" onClick={() => setIsFormatModalOpen(false)}>Abort Action</button>
              <button className="confirm-btn" onClick={triggerFormat}>Wipe Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
