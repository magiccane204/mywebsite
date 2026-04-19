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


const COLORS = [
  { border: "rgb(59, 130, 246)", bg: "rgba(59, 130, 246, 0.1)" },
  { border: "rgb(16, 124, 65)", bg: "rgba(16, 124, 65, 0.1)" },
  { border: "rgb(124, 58, 237)", bg: "rgba(124, 58, 237, 0.1)" }, 
  { border: "rgb(245, 158, 11)", bg: "rgba(245, 158, 11, 0.1)" }, 
];

function LineChart({ chartData, labels, title }) {
  
  if (!chartData || chartData.length === 0 || !labels || labels.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#666", fontWeight: "500" }}>
        Select multiple numeric columns to compare trends
      </div>
    );
  }


  const xAxisLabels = chartData.map((row) => row.name);

  
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
      tension: 0.4,
      fill: true,  
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
        mode: 'index', 
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
