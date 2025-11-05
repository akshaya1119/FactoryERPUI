// BarChart.js
import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Spinner } from 'react-bootstrap';
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import themeStore from '../store/themeStore';
import { useStore } from 'zustand';

Chart.register(...registerables);

const BarChart = ({ projectId }) => {
  const { t } = useTranslation();
  const chartRef = useRef(null);
  const [lotData, setLotData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getCssClasses } = useStore(themeStore);
  const [
    customDark,
    customMid, 
    customLight,
    customBtn,
    customDarkText,
    customLightText,
    customLightBorder,
    customDarkBorder,
    customThead
  ] = getCssClasses();

  useEffect(() => {
    const fetchLotPercentages = async () => {
      setIsLoading(true);
      try {
        const response = await API.get(`/Transactions/combined-percentages?projectId=${projectId}`);
        setLotData(response.data.totalLotPercentages);
      } catch (error) {
        console.error("Error fetching lot percentages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchLotPercentages();
    }
  }, [projectId]);

  useEffect(() => {
    if (!lotData || !chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    const lotNumbers = Object.keys(lotData);
    const percentages = Object.values(lotData);

    const chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: lotNumbers.map(num => `${t("lot")} ${num}`),
        datasets: [
          {
            label: t('completion%'),
            data: percentages,
            backgroundColor: '#29ce6a',
          },
          {
            label: t('remaining%'),
            data: percentages.map(value => 100 - value),
            backgroundColor: '#ff6384',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              color: '#000000',
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#000000',
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#000000',
            }
          }
        }
      }
    });

    return () => {
      chartInstance.destroy();
    };
  }, [lotData, t]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <Spinner 
          animation="border" 
          role="status"
          className={customDarkText}
        >
          <span className="visually-hidden">{t('loading')}</span>
        </Spinner>
      </div>
    );
  }

  if (!lotData) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <p className={customDarkText}>{t('noDataAvailable')}</p>
      </div>
    );
  }

  return (
    <canvas 
      ref={chartRef} 
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default BarChart;