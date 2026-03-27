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

// Preset Colors for different variables (Excel Green, Purple, Blue, Orange)
const COLORS = [
  "rgba(16, 124, 65, 0.7)",  // Excel Green
  "rgba(124, 58, 237, 0.7)", // Purple
  "rgba(59, 130, 246, 0.7)",  // Blue
  "rgba(245, 158, 11, 0.7)",  // Orange
];

const BORDER_COLORS = [
  "rgb(16, 124, 65)",
  "rgb(124, 58, 237)",
  "rgb(59, 130, 246)",
  "rgb(245, 158, 11)",
];

function MyBarChart({ chartData, labels, title }) {
  // 1. Validation: Check if we have data and multivariate labels
  if (!chartData || chartData.length === 0 || !labels || labels.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
        Select numeric columns in the table to view analytics.
      </div>
    );
  }

  // 2. Map the X-Axis (Labels)
  // These are the names of the people/rows from the first column
  const xAxisLabels = chartData.map((item) => item.name);

  // 3. Create Datasets (One for each selected column)
  const datasets = labels.map((label, index) => {
    return {
      label: label, // Name of the column (e.g., "Salary")
      data: chartData.map((item) => item[label]), // The values for that column
      backgroundColor: COLORS[index % COLORS.length],
      borderColor: BORDER_COLORS[index % BORDER_COLORS.length],
      borderWidth: 1,
      borderRadius: 4,
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
        labels: { usePointStyle: true, boxWidth: 6 }
      },
      title: {
        display: true,
        text: title || "Multivariate Comparison",
        font: { size: 14, weight: 'bold' }
      },
      tooltip: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#1f2937",
        bodyColor: "#4b5563",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { display: false } // Cleaner Excel look
      },
      y: {
        beginAtZero: true,
        grid: { color: "#f1f5f9" }
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
