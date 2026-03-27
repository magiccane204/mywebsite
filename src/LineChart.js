import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Filler to support the 'fill' property
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Color palette for multiple lines
const COLORS = [
  { border: "rgb(59, 130, 246)", bg: "rgba(59, 130, 246, 0.1)" }, // Blue
  { border: "rgb(16, 124, 65)", bg: "rgba(16, 124, 65, 0.1)" },  // Excel Green
  { border: "rgb(124, 58, 237)", bg: "rgba(124, 58, 237, 0.1)" }, // Purple
  { border: "rgb(245, 158, 11)", bg: "rgba(245, 158, 11, 0.1)" }, // Orange
];

function LineChart({ chartData, labels, title }) {
  // 1. Validation for Multivariate data
  if (!chartData || chartData.length === 0 || !labels || labels.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#666", fontWeight: "500" }}>
        Select multiple numeric columns to compare trends
      </div>
    );
  }

  // 2. Map the X-Axis (Names/Labels from the first column)
  const xAxisLabels = chartData.map((row) => row.name);

  // 3. Create Datasets (One line for every selected column)
  const datasets = labels.map((label, index) => {
    const color = COLORS[index % COLORS.length];
    return {
      label: label,
      data: chartData.map((row) => row[label]),
      borderColor: color.border,
      backgroundColor: color.bg,
      pointBackgroundColor: color.border,
      pointBorderColor: "#fff",
      pointHoverRadius: 6,
      tension: 0.4, // Smooth curves
      fill: true,   // Area chart style
      borderWidth: 2,
    };
  });

  const data = {
    labels: xAxisLabels,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: "top", 
        labels: { usePointStyle: true, padding: 20, font: { size: 12 } } 
      },
      title: {
        display: true,
        text: title || "Multivariate Trend Analysis",
        font: { size: 16, weight: "bold" },
        padding: { bottom: 20 }
      },
      tooltip: {
        mode: 'index', // Shows all values for a point on hover
        intersect: false,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#111",
        bodyColor: "#444",
        borderColor: "#ddd",
        borderWidth: 1,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: { font: { size: 11 } }
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div style={{ height: "300px", width: "100%" }}>
      <Line data={data} options={options} />
    </div>
  );
}

export default LineChart;
