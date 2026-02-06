import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./ExcelTable.css";

export default function ExcelTable({ tableData, setTableData, onColumnSelect }) {
  const [selectedColumn, setSelectedColumn] = useState(null);

  /* ================= CELL EDIT ================= */

  const handleChange = (r, c, value) => {
    const newData = [...tableData];
    newData[r][c] = value;
    setTableData(newData);
  };

  /* ================= ROW OPS ================= */

  const addRow = () => {
    const cols = tableData[0]?.length || 1;
    setTableData([...tableData, Array(cols).fill("")]);
  };

  const deleteRow = (rowIndex) => {
    const updated = tableData.filter((_, i) => i !== rowIndex);
    setTableData(updated.length ? updated : [[""]]);
  };

  /* ================= COLUMN OPS ================= */

  const insertColumnAt = (colIndex) => {
    const newData = tableData.map((row) => {
      const newRow = [...row];
      newRow.splice(colIndex + 1, 0, "");
      return newRow;
    });
    setTableData(newData);
  };

  const deleteColumn = (colIndex) => {
    const newData = tableData.map((row) => {
      if (row.length <= 1) return row;
      const newRow = [...row];
      newRow.splice(colIndex, 1);
      return newRow;
    });
    setTableData(newData);
  };

  /* ================= EXCEL OPS ================= */

  const saveExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "File1.xlsx");
  };

  const handleUploadExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheetName],
        { header: 1 }
      );
      setTableData(data);
    };
    reader.readAsBinaryString(file);
  };

  /* ================= RESUME UPLOAD (FIXED ONLY HERE) ================= */

  const handleUploadResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await axios.post("/api/resume/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const parsed = res.data?.data;
      if (!parsed) return;

      // Existing column count (DO NOT CHANGE DESIGN)
      const cols = tableData[0]?.length || 1;

      // Resume fields (order only, no layout logic)
      const resumeValues = [
        parsed.name || "",
        parsed.email || "",
        parsed.phone || "",
        parsed.linkedIn || "",
        parsed.experienceYears || "",
        parsed.location || "",
        (parsed.skills || []).join(", ")
      ];

      // Create row that matches existing table width
      const newRow = Array(cols).fill("");
      for (let i = 0; i < Math.min(cols, resumeValues.length); i++) {
        newRow[i] = resumeValues[i];
      }

      setTableData([...tableData, newRow]);
      alert("✅ Resume parsed and added!");
    } catch (err) {
      console.error("Resume upload failed:", err);
      alert("❌ Failed to extract resume data");
    } finally {
      e.target.value = "";
    }
  };

  /* ================= COLUMN SELECT ================= */

  const handleColumnClick = (colIndex) => {
    setSelectedColumn(colIndex);
    const columnValues = tableData
      .map((row) => parseFloat(row[colIndex]))
      .filter((v) => !isNaN(v));

    if (onColumnSelect) onColumnSelect(columnValues, colIndex);
  };

  /* ================= UI (UNCHANGED DESIGN) ================= */

  return (
    <div className="excel-container">
      <div className="table-toolbar">
        <button onClick={addRow}>➕ Add Row</button>
        <button onClick={saveExcel}>💾 Save Excel</button>

        <label className="upload-label">
          Upload Excel/CSV
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleUploadExcel}
            style={{ display: "none" }}
          />
        </label>

        <label className="upload-label">
          Upload Resume
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleUploadResume}
            style={{ display: "none" }}
          />
        </label>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {tableData[0]?.map((_, c) => (
                <th
                  key={c}
                  onClick={() => handleColumnClick(c)}
                  style={{
                    backgroundColor:
                      selectedColumn === c
                        ? "rgba(173, 216, 230, 0.4)"
                        : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{c + 1}</span>
                    <div className="col-buttons">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          insertColumnAt(c);
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteColumn(c);
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {tableData.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c}>
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) =>
                        handleChange(r, c, e.target.value)
                      }
                    />
                  </td>
                ))}
                <td>
                  <button onClick={() => deleteRow(r)}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
