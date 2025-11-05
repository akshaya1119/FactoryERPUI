import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';

const StatusBarChart = ({ data, catchNumbers }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const { t } = useTranslation();

  //Theme Change Section
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const customDark = cssClasses[0];
  const customMid = cssClasses[1];
  const customLight = cssClasses[2];
  const customBtn = cssClasses[3];
  const customDarkText = cssClasses[4];

  const getItemsPerPage = () => {
    const width = window.innerWidth;
    if (width >= 1200) return 30;  // Large screens
    if (width >= 768) return 20;   // Medium/tablet screens
    return 10;                     // Mobile screens
  };

  const itemsPerPage = getItemsPerPage();
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const chartData = data.slice(startIndex, endIndex).map(item => ({
    catchNumber: item.catchNumber,
    interimQuantity: item.interimQuantity,
    remainingQuantity: item.quantity - item.interimQuantity,
    totalQuantity: item.quantity
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { catchNumber, interimQuantity, remainingQuantity, totalQuantity } = payload[0].payload;
      return (
        <div className="custom-tooltip bg-white p-2 border rounded-3 box-shadow ">
          <p>{`${t("catchNo")}: ${catchNumber}`}</p>
          <p>{`${t("interimQuantity")}: ${interimQuantity}`}</p>
          <p>{`${t("remainingQuantity")}: ${remainingQuantity}`}</p>
          <p>{`${t("totalQuantity")}: ${totalQuantity}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ position: "relative", zIndex: "1" }} className='rounded '>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: 40, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="catchNumber" />
          <YAxis width={60} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="interimQuantity"
            stackId="a"
            fill="#61DB53"
            name={t("interimQuantity")}
          />
          <Bar
            dataKey="remainingQuantity"
            stackId="a"
            fill="#0099ff"
            name={t("remainingQuantity")}
          />
        </BarChart>
      </ResponsiveContainer>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 0))}
          disabled={currentPage === 0}
          className={`btn btn-sm btn-link border rounded ${customBtn}`}
        >
          {t("previous")}
        </button>
        <span style={{ margin: '0 10px' }} className={`${customDarkText}`}>{`${t("page")} ${currentPage + 1} / ${totalPages}`}</span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages - 1))}
          disabled={currentPage === totalPages - 1}
          className={`btn btn-sm btn-link border rounded ${customBtn}`}
        >
          {t("next")}
        </button>
      </div>
    </div>
  );
};

export default StatusBarChart;
