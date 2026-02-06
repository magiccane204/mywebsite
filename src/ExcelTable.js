import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./ExcelTable.css";

export default function ExcelTable({ tableData, setTableData, onColumnSelect }) {
  const [selectedColumn, setSelectedColumn] = useState(null);

  /* ================= NORMALIZE TABLE ================= */
  const normalizeTable = (data) => {
    const maxCols = Math.max(...data.map(r => r.length));
    return data.map(row => {
      const r = [...row];
      while (r.length < maxCols) r.push("");
      return r;
    });
  };

  /* ================= CELL EDIT ================= */
  const handleChange = (r, c, value) => {
    const data = normalizeTable([...tableData]);
    data[r][c] = value;
    setTableData(data);
  };

  /* ================= ROW OPS ================= */
  const addRow = () => {
    const cols = tableData[0]?.length || 1;
    setTableData([...tableData, Array(cols).fill("")]);
  };

  const deleteRow = (rowIndex) => {
    const updated = tableData.filter((_, i) => i !== rowIndex);
    setTableData(updated.length ? normalizeTable(updated) : [[""]]);
  };

  /* ================= COLUMN OPS ================= */
  const insertColumnAt = (colIndex) => {
    const data = tableData.map(row => {
      const r = [...row];
      r.splice(colIndex + 1, 0, "");
      return r;
    });
    setTableData(normalizeTable(data));
  };

  const deleteColumn = (colIndex) => {
    const data = tableData.map(row => {
      const r = [...row];
      if (r.length > 1) r.splice(colIndex, 1);
      return r;
    });
    setTableData(normalizeTable(data));
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
      const wb = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      setTableData(normalizeTable(data));
    };
    reader.readAsBinaryString(file);
  };

  /* ================= RESUME UPLOAD ================= */
  const handleUploadResume = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await axios.post("/api/resume/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const d = res.data?.data;
      if (!d) return;

      const cols = tableData[0]?.length || 1;

      const values = [
        d.name || "",
        d.email || "",
        d.phone || "",
        d.linkedIn || "",
        d.experience || "",
        d.education || "",
        (d.skills || []).join(", ")
      ];

      const row = Array(cols).fill("");
      for (let i = 0; i < Math.min(cols, values.length); i++) {
        row[i] = values[i];
      }

      setTableData(normalizeTable([...tableData, row]));
    } catch (err) {
      console.error("Resume upload failed:", err);
    } finally {
      e.target.value = "";
    }
  };

  /* ================= COLUMN SELECT ================= */
  const handleColumnClick = (colIndex) => {
    setSelectedColumn(colIndex);
    const values = tableData
      .map(row => parseFloat(row[colIndex]))
      .filter(v => !isNaN(v));
    onColumnSelect?.(values, colIndex);
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
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                    <span>{c + 1}</span>
                    <button onClick={(e) => { e.stopPropagation(); insertColumnAt(c); }}>+</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteColumn(c); }}>🗑</button>
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
                      onChange={(e) => handleChange(r, c, e.target.value)}
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
