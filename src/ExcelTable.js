import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { Resizable } from "react-resizable";
import { 
  Plus, Download, Upload, FileText, 
  Trash2, AlertTriangle, Save, CheckCircle,
  ChevronDown, X, Table as TableIcon
} from "lucide-react";
import "./ExcelTable.css";

// Added onColumnSelect to props
export default function ExcelTable({ onColumnSelect }) {
  // --- STATE MANAGEMENT ---
  const [tableData, setTableData] = useState([Array(10).fill("")]);
  const [colHeaders, setColHeaders] = useState([]);
  const [colWidths, setColWidths] = useState({});
  const [selectedCell, setSelectedCell] = useState({ r: 0, c: 0 });
  const [selectedCols, setSelectedCols] = useState([]); // Array for Multivariate selection
  const [isFormatModalOpen, setIsFormatModalOpen] = useState(false);
  const [formatConfirmText, setFormatConfirmText] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // --- 1. PERSISTENCE (HYDRATION) ---
  useEffect(() => {
    const savedData = localStorage.getItem("crm-data");
    const savedHeaders = localStorage.getItem("crm-headers");
    const savedWidths = localStorage.getItem("crm-widths");

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.length > 0) setTableData(parsed);
      } catch (e) { console.error("Data corruption detected."); }
    } else {
      setTableData(Array(15).fill(null).map(() => Array(10).fill("")));
    }

    if (savedHeaders) setColHeaders(JSON.parse(savedHeaders));
    if (savedWidths) setColWidths(JSON.parse(savedWidths));
  }, []);

  // --- 2. AUTO-SAVE LOGIC ---
  useEffect(() => {
    setIsAutoSaving(true);
    const timer = setTimeout(() => {
      localStorage.setItem("crm-data", JSON.stringify(tableData));
      localStorage.setItem("crm-headers", JSON.stringify(colHeaders));
      localStorage.setItem("crm-widths", JSON.stringify(colWidths));
      setIsAutoSaving(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [tableData, colHeaders, colWidths]);

  // --- 3. MULTIVARIATE SELECTION LOGIC ---
  const handleColumnHeaderClick = (colIndex) => {
    // Toggle Logic: Add if not present, remove if it is
    const nextSelected = selectedCols.includes(colIndex)
      ? selectedCols.filter(i => i !== colIndex)
      : [...selectedCols, colIndex];

    setSelectedCols(nextSelected);

    // Prepare Multivariate data for the Dashboard
    const chartData = tableData.map((row, rIdx) => {
      // Use first column (Name) as the label, or "Row #" if empty
      const dataPoint = { name: row[0] || `Row ${rIdx + 1}` };
      
      nextSelected.forEach(idx => {
        const key = colHeaders[idx] || `Field ${idx + 1}`;
        const val = parseFloat(row[idx]);
        dataPoint[key] = isNaN(val) ? 0 : val; // Convert to number for graph
      });
      return dataPoint;
    }).filter(point => {
        // Filter out rows that have 0 for all selected variables to keep graph clean
        return nextSelected.some(idx => point[colHeaders[idx] || `Field ${idx + 1}`] > 0);
    });

    const activeLabels = nextSelected.map(idx => colHeaders[idx] || `Field ${idx + 1}`);
    
    // Send to Dashboard
    if (onColumnSelect) onColumnSelect(chartData, activeLabels);
  };

  // --- 4. CELL & HEADER EDITING ---
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

  // --- 5. ROW/COLUMN MANIPULATION ---
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
    setSelectedCols(prev => prev.filter(i => i !== cIndex)); // Clean selection
  };

  // --- 6. RESIZING & EXPORT ---
  const onResize = (index) => (e, { size }) => {
    setColWidths(prev => ({ ...prev, [index]: size.width }));
  };

  const exportToExcel = () => {
    const exportData = [
      colHeaders.map((h, i) => h || `Field ${i + 1}`),
      ...tableData
    ];
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CRM_Export");
    XLSX.writeFile(wb, `CRM_Data_${new Date().toLocaleDateString()}.xlsx`);
  };

  const triggerReset = () => {
    if (formatConfirmText === "FORMAT") {
      setTableData(Array(15).fill(null).map(() => Array(10).fill("")));
      setColHeaders([]);
      setColWidths({});
      setSelectedCols([]);
      setIsFormatModalOpen(false);
      setFormatConfirmText("");
    }
  };

  return (
    <div className="crm-app-container">
      <header className="crm-toolbar">
        <div className="toolbar-left">
          <div className="brand">
            <TableIcon className="brand-icon" size={20} />
            <span>CRM Engine v2.0</span>
          </div>
          <div className="v-divider"></div>
          <button className="tool-btn primary" onClick={addRow}><Plus size={16}/> Add Row</button>
          <button className="tool-btn" onClick={exportToExcel}><Download size={16}/> Export</button>
          <label className="tool-btn">
            <Upload size={16}/> Import
            <input type="file" hidden onChange={() => {}} />
          </label>
        </div>

        <div className="toolbar-right">
          <div className={`status-tag ${isAutoSaving ? 'saving' : 'saved'}`}>
            {isAutoSaving ? <Save size={12} className="spin" /> : <CheckCircle size={12} />}
            {isAutoSaving ? "Syncing..." : "Saved to Vault"}
          </div>
          <button className="tool-btn danger" onClick={() => setIsFormatModalOpen(true)}>
            <AlertTriangle size={16}/>
          </button>
        </div>
      </header>

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

      <div className="grid-viewport">
        <table className="excel-table">
          <thead>
            <tr>
              <th className="row-number-header"></th>
              {tableData[0]?.map((_, c) => (
                <Resizable
                  key={c}
                  width={colWidths[c] || 150}
                  height={0}
                  onResize={onResize(c)}
                  minConstraints={[80, 0]}
                >
                  <th 
                    style={{ width: colWidths[c] || 150 }}
                    onClick={() => handleColumnHeaderClick(c)}
                    className={selectedCols.includes(c) ? "selected-column-header" : ""}
                  >
                    <div className="header-cell">
                      <input 
                        className="header-edit-input"
                        value={colHeaders[c] || ""}
                        placeholder={`Field ${c + 1}`}
                        onClick={(e) => e.stopPropagation()} // Stop chart trigger when typing
                        onChange={(e) => handleHeaderChange(c, e.target.value)}
                      />
                      <div className="header-actions">
                        <button onClick={(e) => { e.stopPropagation(); insertColumn(c); }}>+</button>
                        <button onClick={(e) => { e.stopPropagation(); deleteColumn(c); }}><X size={10}/></button>
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
                    <Trash2 size={12}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormatModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <AlertTriangle size={48} color="#ef4444" />
            <h2>System Format</h2>
            <p>This will wipe the <strong>entire database</strong> permanently.</p>
            <input 
              type="text" 
              placeholder="Type FORMAT to confirm" 
              value={formatConfirmText}
              onChange={(e) => setFormatConfirmText(e.target.value)}
            />
            <div className="modal-btns">
              <button onClick={() => setIsFormatModalOpen(false)}>Cancel</button>
              <button className="confirm-btn" onClick={triggerReset}>Wipe Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
