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

function ScatterChart({ chartData, labels, title }) {
  // 1. Validation: Scatter plots need at least 2 variables (X and Y)
  if (!chartData || chartData.length === 0 || !labels || labels.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#64748b", fontWeight: "500" }}>
        Select at least TWO numeric columns to see correlation (X vs Y).
      </div>
    );
  }

  // 2. Define our X and Y axes based on selection order
  const xLabel = labels[0];
  const yLabel = labels[1];

  // 3. Map data into {x, y} coordinates for Chart.js
  const dataPoints = chartData.map((item) => ({
    x: parseFloat(item[xLabel]) || 0,
    y: parseFloat(item[yLabel]) || 0,
    name: item.name // We store the name to show in the tooltip
  }));

  const data = {
    datasets: [
      {
        label: `${xLabel} vs ${yLabel}`,
        data: dataPoints,
        backgroundColor: "rgba(244, 63, 94, 0.6)", // Vibrant pink/rose
        borderColor: "#be123c",
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 9,
        pointHitRadius: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: title || `Correlation: ${xLabel} vs ${yLabel}`,
        font: { size: 16, weight: "bold" },
        padding: { bottom: 20 }
      },
      tooltip: {
        callbacks: {
          // Custom tooltip to show the Person's name + the coordinates
          label: (context) => {
            const point = context.raw;
            return `${point.name}: (${xLabel}: ${point.x}, ${yLabel}: ${point.y})`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: xLabel, font: { weight: 'bold' } },
        grid: { color: "#f1f5f9" }
      },
      y: {
        beginAtZero: true,
        title: { display: true, text: yLabel, font: { weight: 'bold' } },
        grid: { color: "#f1f5f9" }
      },
    },
  };

  return (
    <div style={{ height: "300px", width: "100%", padding: "10px" }}>
      <Scatter data={data} options={options} />
    </div>
  );
}

export default ScatterChart;
