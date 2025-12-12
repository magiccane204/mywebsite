import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, Title);

function ScatterChart({ chartDataX, chartDataY, title }) {
  if (!chartDataX || !chartDataY || chartDataX.length !== chartDataY.length) {
    return (
      <div style={{ textAlign: "center", padding: "20px", color: "#555" }}>
        Not enough data for scatter plot
      </div>
    );
  }

  const data = {
    datasets: [
      {
        label: "Data Correlation",
        data: chartDataX.map((x, i) => ({ x, y: chartDataY[i] })),
        backgroundColor: "rgba(244, 63, 94, 0.8)", // vibrant pink
        borderColor: "#be123c",
        pointBorderWidth: 2,
        pointHoverRadius: 8,
        pointHoverBorderColor: "#fff",
        pointRadius: 6,
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
        text: `Relationship for ${title}`,
        color: "#111",
        font: { size: 16, weight: "bold" },
      },
    },
    scales: {
      x: {
        title: { display: true, text: "X Values", color: "#333" },
        ticks: { color: "#333" },
        grid: { color: "rgba(200,200,200,0.2)" },
      },
      y: {
        title: { display: true, text: "Y Values", color: "#333" },
        ticks: { color: "#333" },
        grid: { color: "rgba(200,200,200,0.2)" },
      },
    },
  };

  return <Scatter data={data} options={options} />;
}

export default ScatterChart;
 
