import React, { useState, useEffect } from "react";
import "./TableEditor.css";

export default function TableEditorApp({ tableData, setTableData }) {

  const [colHeaders, setColHeaders] = useState([]);
  const [rowHeaders, setRowHeaders] = useState([]);

  /* ===== INIT HEADERS ===== */
  useEffect(() => {
    if (tableData.length) {
      setColHeaders(prev =>
        prev.length ? prev : tableData[0].map((_, i) => `Col ${i + 1}`)
      );

      setRowHeaders(prev =>
        prev.length ? prev : tableData.map((_, i) => `Row ${i + 1}`)
      );
    }
  }, [tableData]);

  /* ===== UPDATE CELL ===== */
  const updateCell = (r, c, value) => {
    const newData = [...tableData];
    newData[r][c] = value;
    setTableData(newData);
  };

  /* ===== UPDATE HEADERS ===== */
  const updateColHeader = (c, value) => {
    const newHeaders = [...colHeaders];
    newHeaders[c] = value;
    setColHeaders(newHeaders);
  };

  const updateRowHeader = (r, value) => {
    const newHeaders = [...rowHeaders];
    newHeaders[r] = value;
    setRowHeaders(newHeaders);
  };

  return (
    <div className="editor-container">

      <h2>🎨 Table Editor</h2>

      <div className="table-wrapper">

        <table>

          {/* ===== COLUMN HEADERS ===== */}
          <thead>
            <tr>
              <th></th>

              {colHeaders.map((col, c) => (
                <th key={c}>
                  <input
                    value={col}
                    onChange={(e) => updateColHeader(c, e.target.value)}
                  />
                </th>
              ))}

            </tr>
          </thead>

          {/* ===== TABLE BODY ===== */}
          <tbody>

            {tableData.map((row, r) => (
              <tr key={r}>

                {/* ROW HEADER */}
                <th>
                  <input
                    value={rowHeaders[r] || ""}
                    onChange={(e) => updateRowHeader(r, e.target.value)}
                  />
                </th>

                {row.map((cell, c) => (
                  <td key={c}>
                    <input
                      value={cell}
                      onChange={(e) =>
                        updateCell(r, c, e.target.value)
                      }
                    />
                  </td>
                ))}

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
