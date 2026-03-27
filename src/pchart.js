import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const COLORS = [
  "rgba(255, 99, 132, 0.7)",
  "rgba(54, 162, 235, 0.7)",
  "rgba(255, 206, 86, 0.7)",
  "rgba(75, 192, 192, 0.7)",
  "rgba(153, 102, 255, 0.7)",
  "rgba(255, 159, 64, 0.7)",
  "rgba(201, 203, 207, 0.7)",
  "rgba(139, 92, 246, 0.7)",
  "rgba(16, 185, 129, 0.7)",
  "rgba(239, 68, 68, 0.7)",
];

function MyPieChart({ chartData, labels, title }) {
  // 1. Validation
  if (!chartData || chartData.length === 0 || !labels || labels.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
        Select a numeric column to see distribution
      </div>
    );
  }

  // 2. Logic: Pie charts show ONE variable at a time.
  // We will show the distribution of the FIRST selected column (labels[0])
  const activeMetric = labels[0];
  
  // X-Axis equivalent: The names of the people/rows
  const sliceLabels = chartData.map((item) => item.name);
  
  // Values: The data points for the specific metric
  const sliceValues = chartData.map((item) => item[activeMetric]);

  const data = {
    labels: sliceLabels,
    datasets: [
      {
        label: `${activeMetric} Distribution`,
        data: sliceValues,
        backgroundColor: COLORS,
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          padding: 20,
          usePointStyle: true,
          font: { size: 11 }
        }
      },
      title: {
        display: true,
        text: title || `Distribution of ${activeMetric}`,
        font: { size: 16, weight: "bold" },
        padding: { bottom: 20 }
      },
      tooltip: {
        callbacks: {
          // Adds a percentage calculation to the tooltip
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    // No scales for Pie Charts!
  };

  return (
    <div style={{ height: "300px", width: "100%", padding: "10px" }}>
      <Pie data={data} options={options} />
    </div>
  );
}

export default MyPieChart;
