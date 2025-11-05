// import React from "react";
// import { Pie } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// // Register required chart elements
// ChartJS.register(ArcElement, Tooltip, Legend);

// const PieChart = ({ data }) => {
//   // Calculate total weightage
//   const totalWeightage = data.reduce((sum, item) => sum + item.percentage, 0);

//   // Normalize data to ensure total percentage is 100
//   const normalizedData = data.map((item) => ({
//     ...item,
//     normalizedPercentage: (item.percentage / totalWeightage) * 100,
//   }));

//   const chartData = {
//     labels: normalizedData.map((item) => item.processName),
//     datasets: [
//       {
//         label: "Percentage",
//         data: normalizedData.map((item) => item.normalizedPercentage),
//         backgroundColor: [
//           "#FF6384",
//           "#36A2EB",
//           "#FFCE56",
//           "#4BC0C0",
//           "#9966FF",
//           "#FF9F40",
//           "#FF8A80",
//           "#82B1FF",
//           "#B9F6CA",
//           "#FFFF8D",
//           "#EA80FC",
//           "#FFD180",
//         ],
//         hoverOffset: 4,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false, // Ensure it scales with the parent container
//     plugins: {
//       legend: {
//         display: true,
//         position: "right",
//         labels: {
//           color: "#000", // Legend text color set to dark black
//         },
//       },
//       tooltip: {
//         callbacks: {
//           label: (context) => {
//             const label = context.label || "";
//             const value = context.parsed || 0;
//             return `${label}: ${value.toFixed(2)}%`;
//           },
//         },
//         titleColor: '#ffffff', // Tooltip title color
//         bodyColor: '#ffffff',  // Tooltip body text color
//       },
//     },
//   };

//   return (
//     <div style={{ width: "100%", height: "100%" }}>
//       <Pie data={chartData} options={options} />
//     </div>
//   );
// };

// export default PieChart;


import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Register required chart elements
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = () => {
  // Random data for demonstration
  const randomData = [
    { processName: "Process A", percentage: 25 },
    { processName: "Process B", percentage: 30 },
    { processName: "Process C", percentage: 15 },
    { processName: "Process D", percentage: 20 },
    { processName: "Process E", percentage: 10 },
  ];

  // Calculate total weightage
  const totalWeightage = randomData.reduce((sum, item) => sum + item.percentage, 0);

  // Normalize data to ensure total percentage is 100
  const normalizedData = randomData.map((item) => ({
    ...item,
    normalizedPercentage: (item.percentage / totalWeightage) * 100,
  }));

  const chartData = {
    labels: normalizedData.map((item) => item.processName),
    datasets: [
      {
        label: "Percentage",
        data: normalizedData.map((item) => item.normalizedPercentage),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
        ],
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Ensure it scales with the parent container
    plugins: {
      legend: {
        display: true,
        position: "right",
        labels: {
          color: "#000", // Legend text color set to dark black
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || "";
            const value = context.parsed || 0;
            return `${label}: ${value.toFixed(2)}%`;
          },
        },
        titleColor: '#ffffff', // Tooltip title color
        bodyColor: '#ffffff',  // Tooltip body text color
      },
    },
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default PieChart;
