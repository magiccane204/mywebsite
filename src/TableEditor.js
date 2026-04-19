import React, { useState, useEffect } from "react";
import "./TableEditor.css";

export default function TableEditorApp({ tableData, setTableData }) {

  const [selectedCell, setSelectedCell] = useState({ row: null, col: null });

  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("Arial");

  const [colHeaders, setColHeaders] = useState([]);
  const [rowHeaders, setRowHeaders] = useState([]);


  useEffect(() => {
    const saved = localStorage.getItem("table-editor-data");

    if (saved) {
      const parsed = JSON.parse(saved);

      setTableData(parsed.tableData || []);
      setColHeaders(parsed.colHeaders || []);
      setRowHeaders(parsed.rowHeaders || []);
    }
  }, []);

 
  useEffect(() => {
    if (!tableData.length) return;

    setColHeaders(prev =>
      prev.length === tableData[0].length
        ? prev
        : tableData[0].map((_, i) => `Col ${i + 1}`)
    );

    setRowHeaders(prev =>
      prev.length === tableData.length
        ? prev
        : tableData.map((_, i) => `Row ${i + 1}`)
    );
  }, [tableData]);

  useEffect(() => {
    localStorage.setItem(
      "table-editor-data",
      JSON.stringify({ tableData, colHeaders, rowHeaders })
    );
  }, [tableData, colHeaders, rowHeaders]);


  const updateCell = (r, c, value) => {
    const newData = [...tableData];
    newData[r][c] = value;
    setTableData(newData);
  };


  const applyFont = () => {
    if (selectedCell.row === null) return;

    const cell = document.getElementById(
      `cell-${selectedCell.row}-${selectedCell.col}`
    );

    if (cell) {
      cell.style.fontSize = fontSize;
      cell.style.fontFamily = fontFamily;
    }
  };


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

  const resetData = () => {
    localStorage.removeItem("table-editor-data");
    window.location.reload();
  };

  return (
    <div className="editor-container">

      <h2>🎨 Table Editor</h2>

  
      <div className="toolbar">
        <label>Font Size:</label>
        <input
          type="number"
          value={parseInt(fontSize)}
          onChange={(e) => setFontSize(e.target.value + "px")}
        />

        <label>Font Family:</label>
        <select
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          <option>Arial</option>
          <option>Times New Roman</option>
          <option>Courier New</option>
          <option>Verdana</option>
        </select>

        <button onClick={applyFont}>Apply Font</button>

        <button onClick={resetData}>Reset</button>
      </div>

      <div className="table-wrapper">

        <table>

       
          <thead>
            <tr>
              <th></th>
              {colHeaders.map((col, c) => (
                <th key={c}>
                  <input
                    value={col}
                    onChange={(e) =>
                      updateColHeader(c, e.target.value)
                    }
                  />
                </th>
              ))}
            </tr>
          </thead>


          <tbody>

            {tableData.map((row, r) => (
              <tr key={r}>


                <th>
                  <input
                    value={rowHeaders[r] || ""}
                    onChange={(e) =>
                      updateRowHeader(r, e.target.value)
                    }
                  />
                </th>

                {row.map((cell, c) => (
                  <td
                    id={`cell-${r}-${c}`}
                    key={c}
                    onClick={() =>
                      setSelectedCell({ row: r, col: c })
                    }
                  >
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
