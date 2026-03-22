import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import "./ExcelTable.css";

export default function ExcelTable({ tableData, setTableData, onColumnSelect }) {

  const [selectedColumn, setSelectedColumn] = useState(null);
  const [colHeaders, setColHeaders] = useState([]);

  /* ================= LOAD TABLE DATA ================= */
  useEffect(() => {
    const saved = localStorage.getItem("excel-table-data");

    if (saved) {
      setTableData(JSON.parse(saved));
    }
  }, [setTableData]);

  /* ================= SAVE TABLE DATA ================= */
  useEffect(() => {
    if (tableData && tableData.length > 0) {
      localStorage.setItem("excel-table-data", JSON.stringify(tableData));
    }
  }, [tableData]);

  /* ================= LOAD HEADERS FROM TABLE EDITOR ================= */
  useEffect(() => {
    const saved = localStorage.getItem("table-editor-data");

    if (saved) {
      const parsed = JSON.parse(saved);
      setColHeaders(parsed.colHeaders || []);
    }
  }, []);

  /* ================= ENSURE TABLE EXISTS ================= */
  useEffect(() => {
    if (!tableData || tableData.length === 0) {
      setTableData([Array(10).fill("")]);
    }
  }, [tableData, setTableData]);

  /* ================= NORMALIZE ================= */
  const normalize = (data) => {
    if (!data.length) return [Array(10).fill("")];

    const maxCols = Math.max(...data.map(r => r.length));

    return data.map(r => {
      const row = [...r];
      while (row.length < maxCols) row.push("");
      return row;
    });
  };

  /* ================= CELL EDIT ================= */
  const handleChange = (r, c, value) => {
    const data = normalize([...tableData]);
    data[r][c] = value;
    setTableData(data);
  };

  /* ================= ROW OPS ================= */
  const addRow = () => {
    const cols = tableData[0]?.length || 10;
    setTableData(normalize([...tableData, Array(cols).fill("")]));
  };

  const deleteRow = (rowIndex) => {
    const data = tableData.filter((_, i) => i !== rowIndex);
    setTableData(data.length ? normalize(data) : [Array(10).fill("")]);
  };

  /* ================= COLUMN OPS ================= */
  const insertColumnAt = (colIndex) => {
    const data = tableData.map(row => {
      const r = [...row];
      r.splice(colIndex + 1, 0, "");
      return r;
    });

    setTableData(normalize(data));
  };

  const deleteColumn = (colIndex) => {
    if (!tableData[0] || tableData[0].length <= 1) return;

    const data = tableData.map(row => {
      const r = [...row];
      r.splice(colIndex, 1);
      return r;
    });

    setTableData(normalize(data));
  };

  /* ================= EXCEL OPS ================= */
  const saveExcel = () => {
    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "Data.xlsx");
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

  /* ================= RESUME UPLOAD ================= */
  const handleUploadResume = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (const file of files) {
      formData.append("resumes", file);
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "/api/resume/extract",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        }
      );

      const parsedResumes = res.data?.resumes || [];

      const rowsToAdd = parsedResumes
        .filter(r => r.success)
        .map(r => {
          const d = r.data || {};

          const values = [
            d.name || "No name",
            d.email || "No email",
            d.phone || "No phone",
            d.linkedIn || "No LinkedIn",
            d.experience || "No experience",
            d.education || "No education",
            (d.skills || ["No skills"]).join(", ")
          ];

          const cols = Math.max(tableData[0]?.length || 10, values.length);
          const row = Array(cols).fill("");

          for (let i = 0; i < values.length; i++) {
            row[i] = values[i];
          }

          return row;
        });

      setTableData(normalize([...tableData, ...rowsToAdd]));

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

    if (onColumnSelect) onColumnSelect(values, colIndex);
  };

  /* ================= UI ================= */
  return (
    <div className="excel-container">

      <div className="table-toolbar">

        <button onClick={addRow} className="col-buttons">➕ Add Row</button>

        <button onClick={saveExcel} className="col-buttons">💾 Save Excel</button>

        <label className="upload-label">
          Upload Excel / CSV
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleUploadExcel}
            hidden
          />
        </label>

        <label className="upload-label">
          Upload Resume
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            multiple
            onChange={handleUploadResume}
            hidden
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
                    cursor: "pointer",
                    background:
                      selectedColumn === c
                        ? "rgba(173,216,230,0.4)"
                        : "transparent"
                  }}
                >

                  <div style={{
                    display: "flex",
                    gap: "4px",
                    justifyContent: "center",
                    alignItems: "center"
                  }}>

                    {/* ✅ HEADER FIX */}
                    <span>
                      {colHeaders && colHeaders.length === tableData[0]?.length
                        ? colHeaders[c]
                        : c + 1}
                    </span>

                    <button
                      type="button"
                      className="square-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        insertColumnAt(c);
                      }}
                    >
                      +
                    </button>

                    <button
                      type="button"
                      className="square-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteColumn(c);
                      }}
                    >
                      🗑
                    </button>

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
                  <button
                    onClick={() => deleteRow(r)}
                    className="square-btn"
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
