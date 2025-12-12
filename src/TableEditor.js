import React, { useState } from "react";
import "./TableEditor.css";

export default function TableEditorApp({ tableData, setTableData }) {
  const [selectedCell, setSelectedCell] = useState({ row: null, col: null });
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("Arial");

  const updateCell = (r, c, value) => {
    const newData = [...tableData];
    newData[r][c] = value;
    setTableData(newData);
  };

  const applyFont = () => {
    if (selectedCell.row === null) return;
    const cell = document.getElementById(`cell-${selectedCell.row}-${selectedCell.col}`);
    if (cell) {
      cell.style.fontSize = fontSize;
      cell.style.fontFamily = fontFamily;
    }
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
        <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
          <option>Arial</option>
          <option>Times New Roman</option>
          <option>Courier New</option>
          <option>Verdana</option>
        </select>
        <button onClick={applyFont}>Apply Font</button>
      </div>

      <div className="table-wrapper">
        <table>
          <tbody>
            {tableData.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td
                    id={`cell-${r}-${c}`}
                    key={c}
                    onClick={() => setSelectedCell({ row: r, col: c })}
                    contentEditable
                    suppressContentEditableWarning={true}
                    onBlur={(e) => updateCell(r, c, e.target.textContent)}
                  >
                    {cell}
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
