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

function MyBarChart({ chartData, headers, title }) {
  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", fontWeight: "bold" }}>
        Cannot find statistics
      </div>
    );
  }

  let labels = [];
  let values = [];

  // ✅ Check if dataset is large
  if (chartData.length > 20) {
    // Create histogram-style ranges
    const min = Math.min(...chartData);
    const max = Math.max(...chartData);
    const rangeCount = 10;
    const rangeSize = (max - min) / rangeCount;

    const bins = new Array(rangeCount).fill(0);
    chartData.forEach((val) => {
      const index = Math.min(
        Math.floor((val - min) / rangeSize),
        rangeCount - 1
      );
      bins[index]++;
    });

    labels = bins.map((_, i) => {
      const start = (min + i * rangeSize).toFixed(1);
      const end = (min + (i + 1) * rangeSize).toFixed(1);
      return `${start} - ${end}`;
    });
    values = bins;
  } else {
    // Normal mode: show each value directly
    labels = chartData.map((_, i) => `Row ${i + 1}`);
    values = chartData;
  }

  const data = {
    labels,
    datasets: [
      {
        label: "Frequency / Values",
        data: values,
        backgroundColor: "rgba(59, 130, 246, 0.7)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: `Statistics for ${title || "Selected Column"}`,
      },
    },
  };

  return <Bar data={data} options={options} />;
}

export default MyBarChart;
