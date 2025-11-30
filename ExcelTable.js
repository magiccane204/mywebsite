import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./ExcelTable.css";

export default function ExcelTable({ tableData, setTableData, onColumnSelect }) {
  const [selectedColumn, setSelectedColumn] = useState(null);

  const handleChange = (r, c, value) => {
    const newData = [...tableData];
    newData[r][c] = value;
    setTableData(newData);
  };

  const addRow = () => {
    const cols = tableData[0]?.length || 1;
    setTableData([...tableData, Array(cols).fill("")]);
  };

  const deleteRow = (rowIndex) => {
    const updated = tableData.filter((_, i) => i !== rowIndex);
    setTableData(updated.length ? updated : [[""]]);
  };

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
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
      setTableData(data);
    };
    reader.readAsBinaryString(file);
  };

 const handleUploadResume = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("resume", file);

  try {
    const res = await axios.post("http://localhost:5002/resume-extract", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const newRow = res.data?.row || [];
    // Keep your table width stable
    const cols = tableData[0]?.length || newRow.length || 8; // default to 8 columns (Name..Skills)
    const adjustedRow = [...newRow];
    while (adjustedRow.length < cols) adjustedRow.push("");

    setTableData([...tableData, adjustedRow]);
    alert("✅ Resume parsed and added to the table!");
  } catch (err) {
    console.error("Resume upload failed:", err.response?.data || err.message);
    alert(err.response?.data?.message || "❌ Failed to extract resume data.");
  } finally {
    // reset input value so same file can be re-selected
    e.target.value = "";
  }
};

  const handleColumnClick = (colIndex) => {
    setSelectedColumn(colIndex);
    const columnValues = tableData
      .map((row) => parseFloat(row[colIndex]))
      .filter((v) => !isNaN(v));
    if (onColumnSelect) onColumnSelect(columnValues, colIndex);
  };

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
                      selectedColumn === c ? "rgba(173, 216, 230, 0.4)" : "transparent",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
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
                    <span>Column {c + 1}</span>
                    <div className="col-buttons">
                      <button
                        type="button"
                        className="insert-col-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          insertColumnAt(c);
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="delete-col-btn"
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
                      onChange={(e) => handleChange(r, c, e.target.value)}
                    />
                  </td>
                ))}
                <td>
                  <button
                    className="delete-row-btn"
                    title="Delete Row"
                    onClick={() => deleteRow(r)}
                  >
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
