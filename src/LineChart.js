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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function LineChart({ chartData, title }) {
  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#555" }}>
        No data for line chart
      </div>
    );
  }

  const labels = chartData.map((_, i) => `Row ${i + 1}`);

  const data = {
    labels,
    datasets: [
      {
        label: "Trend / Progress",
        data: chartData,
        borderColor: "rgba(59, 130, 246, 1)", // bright blue
        backgroundColor: "rgba(59, 130, 246, 0.25)", // subtle fill
        pointBackgroundColor: "#1e3a8a", // deep blue
        pointBorderColor: "#fff",
        pointHoverRadius: 6,
        pointHoverBorderWidth: 2,
        fill: true,
        tension: 0.4, // smooth curve
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", labels: { color: "#333" } },
      title: {
        display: true,
        text: `Trend for ${title}`,
        color: "#111",
        font: { size: 16, weight: "bold" },
      },
    },
    scales: {
      x: {
        ticks: { color: "#333" },
        grid: { color: "rgba(200,200,200,0.2)" },
      },
      y: {
        ticks: { color: "#333" },
        grid: { color: "rgba(200,200,200,0.2)" },
      },
    },
  };

  return <Line data={data} options={options} />;
}

export default LineChart;
