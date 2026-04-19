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
  "rgba(16, 124, 65, 0.7)",  
  "rgba(124, 58, 237, 0.7)", 
  "rgba(59, 130, 246, 0.7)",  
  "rgba(245, 158, 11, 0.7)",  
];

const BORDER_COLORS = [
  "rgb(16, 124, 65)",
  "rgb(124, 58, 237)",
  "rgb(59, 130, 246)",
  "rgb(245, 158, 11)",
];

function MyBarChart({ chartData, labels, title }) {

  if (!chartData || chartData.length === 0 || !labels || labels.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
        Select numeric columns in the table to view analytics.
      </div>
    );
  }


  const xAxisLabels = chartData.map((item) => item.name);

  const datasets = labels.map((label, index) => {
    return {
      label: label, 
      data: chartData.map((item) => item[label]),
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
        grid: { display: false } 
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
