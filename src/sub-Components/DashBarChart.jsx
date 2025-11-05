import React, { useState, useEffect } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { Switch } from 'antd';
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';

const DashBarChart = ({ selectedChart, lotsData, handleBarClick, projectId }) => {
  const [processData, setProcessData] = useState({});
  const [processNames, setProcessNames] = useState({});
  const [showRemaining, setShowRemaining] = useState(false);
  const [isLoading, setIsLoading] = useState({
    processes: true,
    names: true
  });
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const customDark = cssClasses[0];
  const customMid = cssClasses[1];
  const customLight = cssClasses[2];
  const customBtn = cssClasses[3];
  const customDarkText = cssClasses[4];
  const customLightText = cssClasses[5];
  const customLightBorder = cssClasses[6];
  const customDarkBorder = cssClasses[7];

  // Fetch process completion data
  useEffect(() => {
    const fetchProcessData = async () => {
      setIsLoading(prev => ({ ...prev, processes: true }));
      try {
        const response = await API.get(`/Transactions/combined-percentages?projectId=${projectId}`);
        setProcessData(response.data.lotProcessWeightageSum);
      } catch (error) {
        console.error("Error fetching process data:", error);
        setProcessData({});
      } finally {
        setIsLoading(prev => ({ ...prev, processes: false }));
      }
    };

    if (projectId) {
      fetchProcessData();
    }
  }, [projectId]);
  // Fetch process names
  useEffect(() => {
    const fetchProcessNames = async () => {
      setIsLoading(prev => ({ ...prev, names: true }));
      try {
        const response = await API.get(`/ProjectProcess/GetProjectProcesses/${projectId}`);
        const nameMapping = response.data.reduce((acc, process) => {
          acc[process.id] = process.name;
          return acc;
        }, {});
        setProcessNames(nameMapping);
      } catch (error) {
        console.error("Error fetching process names:", error);
        setProcessNames({});
      } finally {
        setIsLoading(prev => ({ ...prev, names: false }));
      }
    };

    if (projectId) {
      fetchProcessNames();
    }
  }, [projectId]);

  // Get the selected lot's process data
  const selectedLotProcesses = processData[selectedChart.lotNumber] || {};
  
  // Create labels only for existing processes
  const processLabels = Object.keys(processNames).map(processId => 
    processNames[processId] || `${t('process')} ${processId}`
  );
  
  // Get completion values only for existing processes
  const processValues = Object.keys(processNames).map(processId => {
    const value = selectedLotProcesses[processId] || 0;
    return showRemaining ? 100 - value : value;
  });

  return (
    <Card className="shadow-lg" style={{ height: "400px" }}>
    <Card.Body
      style={{
        height: "90%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {(isLoading.processes || isLoading.names) ? (
        <div className="d-flex justify-content-center align-items-center h-100">
          <Spinner 
            animation="border" 
            role="status"
            className={customDarkText}
          >
            <span className="visually-hidden">{t('loading')}</span>
          </Spinner>
        </div>
      ) : (
        <>
          <div
            className="mt-3"
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h4 className="text-dark">
              {t('lot')} {selectedChart.lotNumber} {showRemaining ? t('remainingWork') : t('processCompletion')}
            </h4>
            <Switch
              checkedChildren={t('showCompleted')}
              unCheckedChildren={t('showRemaining')}
              checked={showRemaining}
              onChange={(checked) => setShowRemaining(checked)}
              style={{ marginLeft: '10px' }}
            />
          </div>
          <div style={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <Bar
              className="mt-2"
              data={{
                labels: processLabels,
                datasets: [
                  {
                    data: processValues,
                    backgroundColor: processValues.map(value => {
                      const actualValue = showRemaining ? 100 - value : value;
                      return actualValue > 0 
                        ? showRemaining 
                          ? "rgba(255, 99, 132, 0.6)" // Red for remaining
                          : "rgba(75, 192, 192, 0.6)" // Green for completed
                        : "rgba(200, 200, 200, 0.6)";
                    }),
                    borderColor: processValues.map(value => {
                      const actualValue = showRemaining ? 100 - value : value;
                      return actualValue > 0 
                        ? showRemaining 
                          ? "rgb(255, 99, 132)" // Red for remaining
                          : "rgb(75, 192, 192)" // Green for completed
                        : "rgb(180, 180, 180)";
                    }),
                    borderWidth: 1,
                    borderRadius: 5,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                onClick: (event, elements) => handleBarClick(elements),
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                      display: true,
                      text: showRemaining ? t('remainingPercentage') : t('completionPercentage')
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: t('processes')
                    },
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    enabled: true,
                    callbacks: {
                      label: (tooltipItem) => {
                        const processId = Object.keys(processNames)[tooltipItem.dataIndex];
                        const processName = processNames[processId] || `${t('process')} ${processId}`;
                        return `${processName}: ${tooltipItem.raw.toFixed(2)}% ${showRemaining ? t('remaining') : t('completed')}`;
                      },
                    },
                  },
                },
              }}
              height={300}
            />
          </div>
        </>
      )}
    </Card.Body>
  </Card>
  );
};

export default DashBarChart;
