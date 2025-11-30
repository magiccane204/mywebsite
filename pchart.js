import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function MyPieChart({ chartData, headers, title }) {
  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", fontWeight: "bold" }}>
        Cannot find statistics
      </div>
    );
  }

  let labels = [];
  let values = [];

  if (chartData.length > 20) {
    // Range mode (like histogram bins)
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
    // Normal mode: show direct data
    labels = chartData.map((_, i) => `Row ${i + 1}`);
    values = chartData;
  }

  const data = {
    labels,
    datasets: [
      {
        label: "Data Distribution",
        data: values,
        backgroundColor: [
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
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "right" },
      title: {
        display: true,
        text: `Distribution for ${title || "Selected Column"}`,
      },
    },
  };

  return <Pie data={data} options={options} />;
}

export default MyPieChart;
