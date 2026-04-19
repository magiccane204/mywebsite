import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const COLORS = [
  "rgba(16, 124, 65, 0.8)",  
  "rgba(124, 58, 237, 0.8)", 
  "rgba(59, 130, 246, 0.8)",  
  "rgba(245, 158, 11, 0.8)",  
  "rgba(239, 68, 68, 0.8)",   
  "rgba(14, 165, 233, 0.8)",  
];

const BORDER_COLORS = [
  "rgb(16, 124, 65)",
  "rgb(124, 58, 237)",
  "rgb(59, 130, 246)",
  "rgb(245, 158, 11)",
  "rgb(239, 68, 68)",
  "rgb(14, 165, 233)",
];

function MyBarChart({ chartData, labels, title }) {
  if (!chartData || chartData.length === 0 || !labels || labels.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
        Select numeric columns in the table to view analytics.
      </div>
    );
  }

  // Check if we are receiving an array of arrays (multiple columns selected)
  const isMultiDimensional = Array.isArray(chartData[0]);

  let datasets = [];

  if (!isMultiDimensional) {
    // SINGLE COLUMN SELECTED
    datasets = [
      {
        label: "Values",
        data: chartData,
        backgroundColor: COLORS, // Colors each bar differently
        borderColor: BORDER_COLORS,
        borderWidth: 1,
        borderRadius: 4,
      },
    ];
  } else {
    // MULTIPLE COLUMNS SELECTED
    const numMetrics = chartData[0].length;
    for (let i = 0; i < numMetrics; i++) {
      datasets.push({
        label: `Metric ${i + 1}`,
        data: chartData.map((row) => row[i]),
        backgroundColor: COLORS[i % COLORS.length], // Solid color for the series
        borderColor: BORDER_COLORS[i % BORDER_COLORS.length],
        borderWidth: 1,
        borderRadius: 4,
      });
    }
  }

  const data = {
    labels: labels, // Automatically mapped from your table's first column
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: isMultiDimensional, // Only show legend if comparing multiple metrics
        position: "top",
        labels: { usePointStyle: true, boxWidth: 6, color: "#cbd5e1" }
      },
      title: {
        display: true,
        text: title || "Multivariate Comparison",
        font: { size: 14, weight: 'bold' },
        color: "#f8fafc"
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        borderColor: "#334155",
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#94a3b8" }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#94a3b8" }
      },
    },
  };

  return (
    <div style={{ height: "300px", width: "100%" }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default MyBarChart;
