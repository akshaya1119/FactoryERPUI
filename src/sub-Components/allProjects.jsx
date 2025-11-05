import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Carousel, Button } from "react-bootstrap";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "./../styles/allProjects.css";
import tractor from "./../assets/images/tractor.gif";
import DashboardGrid from "./DashboardGrid";
import { useNavigate, useParams } from "react-router-dom";
import themeStore from '../store/themeStore';
import { useStore } from 'zustand';
import { IoMdArrowDroprightCircle } from "react-icons/io";
import { IoMdArrowDropleftCircle } from "react-icons/io";
import API from '../CustomHooks/MasterApiHooks/api';
import { decrypt, encrypt } from "../Security/Security";
import {Modal} from 'antd';
import DashboardAlarmModal from "../menus/DashboardAlarmModal";
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';

import { getCombinedPercentages } from '../CustomHooks/ApiServices/transacationService';
import DashBarChart from './DashBarChart';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip);
import { hasPermission } from "../CustomHooks/Services/permissionUtils";

const ProjectChart = ({ title, chartKey, chartdata, onClick, tCatch, type }) => (
  <Col xs={12} sm={6} md={4} lg={3} xl={2}>
    <div className="text-center p-3 chart-container c-pointer custom-zoom-btn">
      <Card className="text-center p-1 shadow-lg" onClick={onClick}>
        <h4>{title} {t('lot')}-{chartKey}</h4>
        <h5>{t('type')}-{type}</h5>
        <div className="chart-wrapper">
          <Doughnut
            data={{
              labels: [chartdata[0].title, chartdata[1].title],
              datasets: [
                {
                  data: [chartdata[0].value, chartdata[1].value],
                  backgroundColor: ["rgb(133, 255, 108)", "rgb(255, 99, 132)"],
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: (tooltipItem) => {
                      return `${tooltipItem.label}: ${tooltipItem.raw}%`;
                    },
                  },
                },
              },
            }}
          />
          <span className="">{t('totalCatches')}-{tCatch}</span>
        </div>
      </Card>
    </div>
  </Col>
);

const AllProjects = () => {
  const { encryptedProjectId } = useParams();
  const projectId = decrypt(encryptedProjectId);
  const [lotsData, setLotsData] = useState([]);
  const [catchesData, setCatchesData] = useState({}); // Added to store catches data
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

  const { t } = useTranslation();

  const [selectedChart, setSelectedChart] = useState({
    label: "",
    lotNumber: "",
    barLabel: "",
  });
  const [alerts,setAlerts] = useState([])// get data from transaction
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [alarmModalVisible, setAlarmModalVisible] = useState(false); // Modal visibility state
  const [selectedAlerts, setSelectedAlerts] = useState([]); // Store alerts for modal


  const [lotPercentages, setLotPercentages] = useState({});


  useEffect(() => {
    const fetchLotsData = async () => {
      try {
        const response = await API.get(`/QuantitySheet/ReleasedLots?ProjectId=${projectId}`);
        setLotsData(response.data);
        if (response.data.length > 0) {
          setSelectedChart({
            label: "Lot",
            lotNumber: response.data[0],
            barLabel: "",
          });
        }
      } catch (error) {
        console.error("Error fetching lots data:", error);
      }
    };

    fetchLotsData();
  }, [projectId]);

  useEffect(() => {
    const fetchCatchesData = async () => {
      try {
        const catchesResponses = await Promise.all(lotsData.map(async (lot) => {
          const response = await API.get(`/QuantitySheet/Catch?ProjectId=${projectId}&lotNo=${lot}`);
          return { lot, catches: response.data.length };
        }));
        setCatchesData(catchesResponses.reduce((acc, curr) => {
          acc[curr.lot] = curr.catches;
          return acc;
        }, {}));
      } catch (error) {
        console.error("Error fetching catches data:", error);
      }
    };

    fetchCatchesData();
  }, [lotsData, projectId]);

  useEffect(() => {
    const fetchPercentages = async () => {
      try {
        const data = await getCombinedPercentages(projectId);
      
        setLotPercentages(data.totalLotPercentages);
      } catch (error) {
        console.error("Error fetching percentages:", error);
      }
    };

    fetchPercentages();
  }, [projectId]);

  const handleCardClick = (lotNumber) => {
    setSelectedChart((prev) => ({
      ...prev,
      label: "Lot",
      lotNumber,
    }));
  };

  const handleAlarmsButtonClick = () => {
    setSelectedAlerts(alerts); // Set the alerts data to be shown in modal
    setAlarmModalVisible(true); // Open the modal
  };

  const handleTitleClick = (project) => {
    setLotInLocal(project.lotNumber)
    navigate(`/project-details/${encrypt(projectId)}`, { state: { project, projectId } });
  };
  const setLotInLocal = (lt) => {
    localStorage.setItem("selectedLot", lt)
  }
  

  const handleBarClick = (elements) => {
    if (elements.length > 0) {
      const clickedIndex = elements[0].index;
      const clickedBarLabel = lotsData[clickedIndex];

      setSelectedChart((prev) => ({
        ...prev,
        barLabel: clickedBarLabel,
      }));
    }
  };

  const handleCarouselControl = (direction) => {
    if (carouselRef.current) {
      if (direction === 'prev') {
        carouselRef.current.prev();
      } else {
        carouselRef.current.next();
      }
    }
  };

  const itemsPerSlide = 6;

  const carouselItems = [];
  const [projectName, setProjectName] = useState('');
  const [type, setType] = useState('');
  

  useEffect(() => {
    const fetchProjectName = async () => {
      try {
        const response = await API.get(`/Project/${projectId}`);
        setProjectName(response.data.name);
        setType(response.data.projectType);
      } catch (error) {
        console.error("Error fetching project name:", error);
      }
    };

    fetchProjectName();
  }, [projectId]);

  for (let i = 0; i < lotsData.length; i += itemsPerSlide) {
    carouselItems.push(
      <Carousel.Item key={i} style={{ background: "transparent" }}>
        <Row className="flex-nowrap">
          {lotsData.slice(i, i + itemsPerSlide).map((lotNumber, idx) => (
            <ProjectChart
              key={idx}
              title={`${projectName}`}
              chartdata={[
                {title: t('complete'), value: lotPercentages[lotNumber] || 0},
                {title: t('remaining'), value: 100 - (lotPercentages[lotNumber] || 0)}
              ]}
              chartKey={lotNumber}
              tCatch={catchesData[lotNumber] || 0}
              type={type}
              onClick={() => handleCardClick(lotNumber)}
            />
          ))}
        </Row>
      </Carousel.Item>
    );
  }

  return (
    <Container fluid>
      <div className="position-relative mb-4">
        {lotsData.length > 0 ? (
          <>
            <div className="d-none d-lg-block">
              <div
                className={`position-absolute top-50 start-0 translate-middle-y rounded-circle  ${customDark}`} style={{ zIndex: "9", width: "0px", height: "0px" }}
                onClick={() => handleCarouselControl('prev')}
              >
                <IoMdArrowDropleftCircle size={40} className={`${customBtn}  rounded-circle custom-zoom-btn`} />
              </div>
              <div
                className={`position-absolute top-50 end- translate-middle-y rounded-circle ${customDark} ${customDark === "dark-dark" ? `${customMid} border-light border-1` : "border-0"}`} style={{ zIndex: "9", width: "0px", height: "0px", right: "20px" }}
                onClick={() => handleCarouselControl('next')}
              >
                <IoMdArrowDroprightCircle size={40} className={`${customBtn}  rounded-circle custom-zoom-btn`} />
              </div>
            </div>

            <Carousel
              ref={carouselRef}
              interval={null}
              indicators={false}
              controls={false}
              touch={true}
              slide={true}
            >
              {carouselItems}
            </Carousel>
          </>
        ) : (
          <div className="text-center p-5">
            <h3>{t('noLotsReleasedForProduction')}</h3>
          </div>
        )}
      </div>

      {alerts.length > 0 && (
        <marquee className="marquee" style={{ color: "red", fontWeight: "bold" }}>
          <img
            className="mb-3"
            src={tractor}
            alt="Tractor"
            style={{
              transform: "scaleX(-1)",
              width: "80px",
              marginRight: 10 + "px",
            }}
          />
          {alerts.map((alert, index) => (
            <span key={index} className="ms-2">{alert}</span>
          ))}
        </marquee>
      )}

      <Row>
        <Col xs={12} lg={8}>
          <Card className="dcard shadow-lg" style={{ height: "400px" }}>
            <h4 className="text-dark d-flex justify-content-between">
              <div>
                {selectedChart.label} {selectedChart.lotNumber}{" "}
                {selectedChart.barLabel && `| ${selectedChart.barLabel}`}
              </div>
                    <button
                type="button"
                onClick={() => handleTitleClick(selectedChart)}
                className="btn btn-outline-info"
                disabled={!selectedChart.lotNumber}
              >
                {t('manageProcess')}
              </button>          
              {hasPermission('2.8.2') && (
                <button
              type="button"
              onClick={handleAlarmsButtonClick} // Open modal with alerts
              className="btn btn-outline-info"
            >
             {t('alarms')}
            </button>
              )}
            </h4>
            <DashboardGrid projectId={projectId} lotNo={selectedChart.lotNumber} />
          </Card>
        </Col>

        <Col xs={12} lg={4}>
          <DashBarChart 
            selectedChart={selectedChart}
            lotsData={lotsData}
            handleBarClick={handleBarClick}
            projectId={projectId}
          />
        </Col>
      </Row>
      <Modal
      title="Alarms"
      visible={alarmModalVisible}
      onCancel={() => setAlarmModalVisible(false)} // Close the modal
      footer={[
        <Button key="close" type="primary" onClick={() => setAlarmModalVisible(false)}>
          {t('close')}
        </Button>,
      ]}
      centered
      width={600}
    >
     <DashboardAlarmModal selectedAlerts={selectedAlerts}  projectId={projectId} lotNo = {selectedChart.lotNumber} hasResolvePermission={hasPermission('2.8.3')} />
    </Modal>

    </Container>
  );
};

export default AllProjects;
