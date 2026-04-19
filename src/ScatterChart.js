import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

function ScatterChart({ chartData, labels }) {
  // Scatter needs at least 2 columns selected to compare X vs Y
  if (!chartData || chartData.length === 0 || !Array.isArray(chartData[0]) || chartData[0].length < 2) {
    return null;
  }

  // Format data specifically for Scatter plots: [{x, y}]
  const scatterPoints = chartData.map((row) => ({
    x: row[0],
    y: row[1]
  }));

  const data = {
    datasets: [
      {
        label: "Correlation",
        data: scatterPoints,
        backgroundColor: "rgba(239, 68, 68, 0.8)", // Red dots
        pointRadius: 6,
        hoverRadius: 8,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Hide legend to save space
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        callbacks: {
          label: (context) => {
             // Show the row name (MongoDB ID) when hovering over a dot
             const rowName = labels[context.dataIndex] || `Row ${context.dataIndex + 1}`;
             return `${rowName}: (${context.parsed.x}, ${context.parsed.y})`;
          }
        }
      }
    },
    scales: {
      x: { 
        title: { display: true, text: "Metric 1", color: "#94a3b8" },
        ticks: { color: "#94a3b8" }, 
        grid: { color: "rgba(255,255,255,0.05)" } 
      },
      y: { 
        title: { display: true, text: "Metric 2", color: "#94a3b8" },
        ticks: { color: "#94a3b8" }, 
        grid: { color: "rgba(255,255,255,0.05)" } 
      },
    },
  };

  return (
    <div style={{ height: "300px", width: "100%" }}>
      <Scatter data={data} options={options} />
    </div>
  );
}

export default ScatterChart;
