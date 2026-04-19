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
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const COLORS = [
  "rgba(59, 130, 246, 0.8)",  
  "rgba(16, 124, 65, 0.8)",  
  "rgba(124, 58, 237, 0.8)", 
  "rgba(245, 158, 11, 0.8)",  
];

function LineChart({ chartData, labels }) {
  if (!chartData || chartData.length === 0 || !labels || labels.length === 0) {
    return null;
  }

  // Truncate massive MongoDB IDs so they don't break the layout
  const truncate = (str) => str.length > 15 ? str.slice(0, 6) + "..." + str.slice(-4) : str;
  const safeLabels = labels.map(truncate);

  const isMultiDimensional = Array.isArray(chartData[0]);
  let datasets = [];

  if (!isMultiDimensional) {
    datasets = [{
      label: "Trend",
      data: chartData,
      borderColor: COLORS[0],
      backgroundColor: COLORS[0],
      tension: 0.3, // smooth curves
    }];
  } else {
    const numMetrics = chartData[0].length;
    for (let i = 0; i < numMetrics; i++) {
      datasets.push({
        label: `Metric ${i + 1}`,
        data: chartData.map((row) => row[i]),
        borderColor: COLORS[i % COLORS.length],
        backgroundColor: COLORS[i % COLORS.length],
        tension: 0.3,
      });
    }
  }

  const data = {
    labels: safeLabels,
    datasets: datasets,
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#cbd5e1" } },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
      }
    },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "rgba(255,255,255,0.05)" } },
    },
  };

  return (
    <div style={{ height: "300px", width: "100%" }}>
      <Line data={data} options={options} />
    </div>
  );
}

export default LineChart;
