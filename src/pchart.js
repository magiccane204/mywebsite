import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  "rgba(124, 58, 237, 0.8)", 
  "rgba(59, 130, 246, 0.8)",  
  "rgba(16, 124, 65, 0.8)",  
  "rgba(245, 158, 11, 0.8)",  
  "rgba(239, 68, 68, 0.8)",   
  "rgba(14, 165, 233, 0.8)",  
];

const BORDER_COLORS = [
  "rgb(124, 58, 237)",
  "rgb(59, 130, 246)",
  "rgb(16, 124, 65)",
  "rgb(245, 158, 11)",
  "rgb(239, 68, 68)",
  "rgb(14, 165, 233)",
];

function MyPieChart({ chartData, labels }) {
  if (!chartData || chartData.length === 0 || !labels || labels.length === 0) {
    return null;
  }

  // Ensure we extract a 1D array even if the user clicks multiple table columns
  const isMultiDimensional = Array.isArray(chartData[0]);
  const pieDataArray = isMultiDimensional 
    ? chartData.map(row => row[0]) 
    : chartData;

  const data = {
    labels: labels,
    datasets: [
      {
        data: pieDataArray,
        backgroundColor: COLORS,
        borderColor: BORDER_COLORS,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: { usePointStyle: true, boxWidth: 8, color: "#cbd5e1" }
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f8fafc",
        bodyColor: "#cbd5e1",
        borderColor: "#334155",
        borderWidth: 1,
        padding: 10,
      }
    },
  };

  return (
    <div style={{ height: "300px", width: "100%", display: "flex", justifyContent: "center" }}>
      <Pie data={data} options={options} />
    </div>
  );
}

export default MyPieChart;
