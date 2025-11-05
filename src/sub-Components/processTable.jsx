import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, Spinner, Row, Col } from "react-bootstrap";
import ProjectDetailsTable from "./projectDetailTable";
import StatusPieChart from "./StatusPieChart";
import StatusBarChart from "./StatusBarChart";
import "./../styles/processTable.css";
import { Switch } from "antd";
import CatchProgressBar from "./CatchProgressBar";
import CatchDetailModal from "../menus/CatchDetailModal";
import themeStore from "../store/themeStore";
import { useStore } from "zustand";
import { useTranslation } from "react-i18next";
import API from "../CustomHooks/MasterApiHooks/api";
import { useUserData } from "../store/userDataStore";
import { getProjectProcessAndFeature, getProjectProcessByProjectAndSequence, } from "../CustomHooks/ApiServices/projectProcessAndFeatureService";
import useCurrentProcessStore from "../store/currentProcessStore";
import { decrypt } from "../Security/Security";
import { getCombinedPercentages, getProjectTransactionsData, } from "../CustomHooks/ApiServices/transacationService";
import ToggleProject from "../pages/processPage/Components/ToggleProject";
import ToggleProcess from "../pages/processPage/Components/ToggleProcess";
import PreviousProcess from "../pages/processPage/Components/PreviousProcess";
import MarqueeAlert from "../pages/processPage/Components/MarqueeAlert";
import DispatchPage from "../pages/dispatchPage/DispatchPage";
import { IoIosArrowDropdownCircle } from "react-icons/io";
import { Collapse } from "react-bootstrap";
import ProcessProgressTrain from "./ProcessProgressTrain";
import ProcessTrainModals from "./ProcessTrainModals ";

const ProcessTable = () => {
  const { encryptedProjectId } = useParams();
  const id = decrypt(encryptedProjectId);
  const [featureData, setFeatureData] = useState(null);
  const { processId, processName } = useCurrentProcessStore();
  const { setProcess } = useCurrentProcessStore((state) => state.actions);
  const userData = useUserData();
  const [isHeaderOpen, setIsHeaderOpen] = useState(() => {
    const saved = localStorage.getItem('processTableHeaderOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('processTableHeaderOpen', JSON.stringify(isHeaderOpen));
  }, [isHeaderOpen]);
  const { t } = useTranslation();


  useEffect(() => {
    localStorage.setItem('processTableHeaderOpen', JSON.stringify(isHeaderOpen));
  }, [isHeaderOpen]);

  // Subscribe to theme store changes
  const themeState = useStore(themeStore);
  const cssClasses = useMemo(() => themeState.getCssClasses(), [themeState]);
  const [
    customDark,
    customMid,
    customLight,
    customBtn,
    customDarkText,
    customLightText,
    customLightBorder,
    customDarkBorder,
  ] = cssClasses;

  // Force re-render when theme changes
  useEffect(() => {
    // This empty dependency array ensures cssClasses are always fresh
  }, [cssClasses]);

  const [tableData, setTableData] = useState([]);
  const [showBarChart, setShowBarChart] = useState(false);
  const [catchDetailModalShow, setCatchDetailModalShow] = useState(false);
  const [catchDetailModalData, setCatchDetailModalData] = useState(null);
  const [selectedLot, setSelectedLot] = useState(
    localStorage.getItem('selectedLot') );
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [projectLots, setProjectLots] = useState([]);
  const [previousProcess, setPreviousProcess] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [dispatchedLots, setDispatchedLots] = useState([]);
  const [
    previousProcessCompletionPercentage,
    setPreviousProcessCompletionPercentage,
  ] = useState(0);
  const [previousProcessTransactions, setPreviousProcessTransactions] =
    useState([]);
  const [selectedProject, setSelectedProject] = useState(() => {
    const savedProject = localStorage.getItem("selectedProject");
    return savedProject ? JSON.parse(savedProject) : null;
  });
  const [showPieChart, setShowPieChart] = useState(false);
  const [digitalandOffsetData, setDigitalandOffsetData] = useState([]);
  const [previousIndependent, setPreviousIndependent] = useState({
    process: null,
    transactions: []
  });
  // processs train states
  const [showProcessTrain, setShowProcessTrain] = useState(false);
  const [processTrainData, setProcessTrainData] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchCombinedPercentages();
  }, [selectedLot, previousProcess]);

  useEffect(() => {
    const fetchIndependentProcess = async () => {
      if (!processId || !selectedProject?.value) return;

      try {
        // Get all processes for the project
        const processData = await getProjectProcessAndFeature(
          userData.userId,
          selectedProject?.value || id
        );

        // Find independent process where rangeEnd matches current processId
        const independentProcess = processData.find(
          p => p.processType === "Independent" && p.rangeEnd === processId
        );

        if (independentProcess) {
          // Fetch transactions for the independent process
          const transactions = await getProjectTransactionsData(
            selectedProject?.value || id,
            independentProcess.processId
          );

          setPreviousIndependent({
            process: independentProcess,
            transactions: transactions.data
          });
        } else {
          setPreviousIndependent({
            process: null,
            transactions: []
          });
        }
      } catch (error) {
        console.error("Error fetching independent process data:", error);
        setPreviousIndependent({
          process: null,
          transactions: []
        });
      }
    };

    fetchIndependentProcess();
  }, [processId, selectedProject, userData.userId, id]);

  const handleProcessChange = async (value) => {
    const selectedProcess = processes.find((p) => p.processId === value);

    if (selectedProcess) {
      setProcess(selectedProcess.processId, selectedProcess.processName, true);
      setIsLoading(true);
      try {
        // Fetch new feature data for selected process
        const data = await getProjectProcessAndFeature(
          userData.userId,
          selectedProject?.value || id
        );
        const processData = data.find((p) => p.processId === value);
        setFeatureData(processData);

        if (processData.sequence > 1) {
          let previousSequence = processData.sequence - 1;
          let previousProcessData;

          // Loop to find the previous valid process based on logic
          do {
            previousProcessData = await getProjectProcessByProjectAndSequence(
              selectedProject?.value || id,
              previousSequence
            );
            if (!previousProcessData) break;

            // Add logic to skip based on your conditions
            // If current process ID is 2, skip process ID 3
            if (processData.processId === 2 && previousProcessData.processId === 3) {
              previousSequence--;
              continue;
            }
            if (processData.processId === 4 && previousProcessData.processId === 3) {
              previousSequence--;
              continue;
            }

            // If current process ID is 3, skip process IDs 2 and 1
            if (processData.processId === 3 &&
              (previousProcessData.processId === 2 || previousProcessData.processId === 1)) {
              previousSequence--;
              continue;
            }

            // Check process type rules
            if (processData.processType === "Independent") {
              // For Independent process, use RangeStart as previous process
              previousProcessData = await getProjectProcessByProjectAndSequence(
                selectedProject?.value || id,
                processData.rangeStart
              );
              setPreviousProcess(previousProcessData);
              break;
            } else if (processData.processType === "Dependent") {
              // For Dependent process, check previous process conditions
              if (previousProcessData.processType === "Dependent") {
                setPreviousProcess(previousProcessData);
                break;
              } else if (previousProcessData.processType === "Independent") {
                if (previousProcessData.rangeStart <= processData.sequence &&
                  previousProcessData.rangeEnd >= processData.sequence) {
                  setPreviousProcess(previousProcessData);
                  break;
                }
                // Check for independent process with rangeEnd matching current processId
                if (previousProcessData.rangeEnd === processData.processId) {
                  setPreviousProcess(previousProcessData);
                  break;
                }
              }
            }
            previousSequence--;
          } while (previousSequence > 0);

          // Fetch transactions for previous process if found
          if (previousProcessData) {
            const prevTransactions = await getProjectTransactionsData(
              selectedProject?.value || id,
              previousProcessData.processId
            );
            setPreviousProcessTransactions(prevTransactions.data);
          } else {
            setPreviousProcess(null);
            setPreviousProcessTransactions([]);
          }
        } else {
          setPreviousProcess(null);
          setPreviousProcessTransactions([]);
        }

        await fetchTransactions();
      } catch (error) {
        console.error("Error updating process data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  //get digital or offset data
  useEffect(() => {
    const fetchDigitalOrOffsetData = async () => {
      try {
        if (selectedProject && previousProcess?.processId === 4) {
          const digitalData = await getProjectTransactionsData(
            selectedProject?.value || id,
            3
          );
          setDigitalandOffsetData(digitalData.data);
        } else if (selectedProject && previousProcess?.processId === 3) {
          const offsetData = await getProjectTransactionsData(
            selectedProject?.value || id,
            4
          );
          setDigitalandOffsetData(offsetData.data);
        }
      } catch (error) {
        console.error("Error fetching digital/offset data:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
        });
      }
    };

    fetchDigitalOrOffsetData();
  }, [selectedProject, previousProcess, id]);

  const setLotInLocal = (lt) => {
    localStorage.setItem("selectedLot", lt)
  }

  const handleProjectChange = async (selectedProject) => {
    if (!selectedProject || selectedProject.value === id) return;
    setSelectedProject(null);
    setProjectName("");
    setProcess(0, "");
    setFeatureData(null);
    setProcesses([]);
    setPreviousProcess(null);
    setPreviousProcessTransactions([]);
    setTableData([]);
    setProjectLots([]);
    setSelectedLot(null);
    setPreviousProcessCompletionPercentage(0);
    localStorage.setItem("selectedProject", JSON.stringify(selectedProject));
    setSelectedProject(selectedProject);
    setProjectName(selectedProject.label);
    setIsLoading(true);

    try {
      // Fetch processes for new project
      const processData = await getProjectProcessAndFeature(
        userData.userId,
        selectedProject.value
      );

      if (Array.isArray(processData) && processData.length > 0) {
        // Set processes for dropdown
        setProcesses(
          processData.map((p) => ({
            processId: p.processId,
            processName: p.processName,
            sequence: p.sequence,
          }))
        );

        // Set first process as default for new project
        const firstProcess = processData[0];
        setProcess(firstProcess.processId, firstProcess.processName);
        setFeatureData(firstProcess);

        // Fetch lots for new project using first process
        const response = await getProjectTransactionsData(
          selectedProject.value,
          firstProcess.processId
        );
        const transactionsData = response.data;
        if (Array.isArray(transactionsData)) {
          const uniqueLots = [
            ...new Set(transactionsData.map((item) => item.lotNo)),
          ].sort((a, b) => a - b);
          setProjectLots(uniqueLots.map((lotNo) => ({ lotNo })));
          if (uniqueLots.length > 0) {
            setSelectedLot(uniqueLots[0]);
            setLotInLocal(uniqueLots[0])
          }
        }
        if (firstProcess.sequence > 1) {
          const prevProcessData = await getProjectProcessByProjectAndSequence(
            selectedProject.value,
            firstProcess.sequence - 1
          );
          if (prevProcessData && prevProcessData.processType === "Dependent") {
            setPreviousProcess(prevProcessData);
            const prevTransactions = await getProjectTransactionsData(
              selectedProject.value,
              prevProcessData.processId
            );
            setPreviousProcessTransactions(prevTransactions.data);
          }
        }
        await fetchTransactions();
      }
    } catch (error) {
      console.error("Error updating project data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCombinedPercentages = async () => {
    try {
      const data = await getCombinedPercentages(selectedProject?.value || id);
      if (data && previousProcess) {
        // Default to 0 if no percentage data exists
        const percentage = data?.lotProcessWeightageSum?.[selectedLot]?.[previousProcess.processId] || 0;
        setPreviousProcessCompletionPercentage(percentage);
      } else {
        // Set to 0 if no previous process or data
        setPreviousProcessCompletionPercentage(0);
      }
    } catch (error) {
      console.error("Error fetching combined percentages:", error);
      // Set to 0 on error
      setPreviousProcessCompletionPercentage(0);
    }
  };

  const hasFeaturePermission = useCallback(
    (featureId) => {
      // Check if the featureId is in the current process's featuresList
      if (featureData?.featuresList) {
        return featureData.featuresList.includes(featureId);
      }
      return false;
    },
    [featureData]
  );

  const formatQuantitySheetData = (item) => ({
    srNo: item.quantitySheetId,
    catchNumber: item.quantitySheetId,
    paper: "",
    course: "",
    subject: "",
    outerEnvelope: "",
    innerEnvelope: "",
    lotNo: item.lotNo,
    quantity: 0,
    percentageCatch: 0,
    projectId: item.projectId,
    pages: item.pages,
    processId: processId,
    status: item.transactions[0]?.status || 0,
    alerts: item.transactions[0]?.alarmId || "",
    interimQuantity: item.transactions[0]?.interimQuantity || 0,
    remarks: item.transactions[0]?.remarks || "",
    previousProcessStats: "",
    voiceRecording: item.transactions[0]?.voiceRecording || "",
    transactionId: item.transactions[0]?.transactionId || null,
    zoneId: item.transactions[0]?.zoneId || 0,
    machineId: item.transactions[0]?.machineId || 0,
    teamId: item.transactions[0]?.teamId || 0,
  });

  const fetchData = useCallback(async () => {
    if (!userData?.userId || id === processId) return;

    setIsLoading(true);
    try {
      const data = await getProjectProcessAndFeature(
        userData.userId,
        selectedProject?.value || id
      );
      if (Array.isArray(data) && data.length > 0) {
        const selectedProcess =
          data.find((p) => p.processId === processId) || data[0];
        setProcess(selectedProcess.processId, selectedProcess.processName);
        setFeatureData(selectedProcess);

        if (selectedProcess.sequence > 1) {
          let previousSequence = selectedProcess.sequence - 1;
          let previousProcessData;

          do {
            // Ensure we don't make an API call if previousSequence is invalid
            if (previousSequence <= 0) {
              setPreviousProcess(null);
              setPreviousProcessTransactions([]);
              break;
            }

            // Fetch previous process
            previousProcessData = await getProjectProcessByProjectAndSequence(
              selectedProject?.value || id,
              previousSequence
            );

            // Handle the case when no previous process is found
            if (!previousProcessData) {
              setPreviousProcess(null);
              setPreviousProcessTransactions([]);
              break;
            }

            // Apply process type rules
            if (selectedProcess.processType === "Independent") {
              // For Independent process, use RangeStart as previous process
              try {
                previousProcessData = await getProjectProcessByProjectAndSequence(
                  selectedProject?.value || id,
                  selectedProcess.rangeStart
                );
                setPreviousProcess(previousProcessData);
              } catch (error) {
                setPreviousProcess(null);
              }
              break;
            } else if (selectedProcess.processType === "Dependent") {
              // For Dependent process, check previous process conditions
              if (previousProcessData.processType === "Dependent") {
                if (selectedProcess.processId === 3 && (previousProcessData.processId === 2 || previousProcessData.processId === 1)) {
                  previousSequence--;
                  continue;
                }
                if (selectedProcess.processId === 2 && previousProcessData.processId === 3) {
                  previousSequence--;
                  continue;
                }
                if (selectedProcess.processId === 4 && previousProcessData.processId === 3) {
                  previousSequence--;
                  continue;
                }
                setPreviousProcess(previousProcessData);
                break;
              } else if (previousProcessData.processType === "Independent") {
                // Check for independent process with rangeEnd matching current processId
                if (previousProcessData.rangeEnd === selectedProcess.processId) {
                  setPreviousProcess(previousProcessData);
                  break;
                }
              }
            }

            // Apply special rules for processes 2 and 3
            if (selectedProcess.processId === 2 && previousProcessData.processId === 3) {
              previousSequence--;
              continue;
            }
            if (selectedProcess.processId === 4 && previousProcessData.processId === 3) {
              previousSequence--;
              continue;
            }

            if (selectedProcess.processId === 3 &&
              (previousProcessData.processId === 2 || previousProcessData.processId === 1)) {
              previousSequence = 0;  // Prevent infinite loop and avoid fetching invalid previous process
              continue;
            }

            previousSequence--;
          } while (previousSequence >= 0);

          // Fetch transactions for previous process if found
          if (previousProcessData) {
            const prevTransactions = await getProjectTransactionsData(
              selectedProject?.value || id,
              previousProcessData.processId
            );
            setPreviousProcessTransactions(prevTransactions.data);
          } else {
            setPreviousProcess(null);
            setPreviousProcessTransactions([]);
          }
        } else {
          setPreviousProcess(null);
          setPreviousProcessTransactions([]);
        }

        setProcesses(
          data.map((p) => ({
            processId: p.processId,
            processName: p.processName,
            sequence: p.sequence,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching project process data:", error);
      setProcess(0, "Unknown Process");
      setFeatureData([]);
      setProcesses([]);
    } finally {
      setIsLoading(false);
    }
  }, [userData, id, processId, setProcess, selectedProject]);

  useEffect(() => {
    const fetchDispatchedLots = async () => {
      try {
        const response = await API.get(`/Dispatch/project/${selectedProject.value}`);
        const dispatchedLotNos = response.data
          .filter((dispatch) => dispatch.status === true) // Filter by status
          .map((dispatch) => dispatch.lotNo);
        console.log(dispatchedLotNos)
        setDispatchedLots(dispatchedLotNos);
      } catch (error) {
        console.error("Failed to fetch dispatched lots:", error);
      }
    };

    fetchDispatchedLots();
  }, [selectedProject]);

  const fetchTransactions = useCallback(async () => {
    if (processId > 0) {
      try {
        const response = await getProjectTransactionsData(
          selectedProject?.value || id,
          processId
        );
        const transactionsData = response.data;

        if (Array.isArray(transactionsData)) {
          // Filter transactions that contain current processId in processIds array
          const validTransactions = transactionsData.filter((item) =>
            item.processIds?.includes(Number(processId))
          );

          const formDataGet = validTransactions.map((item) => {
            // Find matching previous process data
            let previousProcessData = previousProcessTransactions.find(
              (prevTrans) => prevTrans.quantitySheetId === item.quantitySheetId
            );

            // Only try to access transactions if previousProcessData exists
            if (previousProcessData) {

              // Check if transactions array is empty before proceeding
              if (!previousProcessData.transactions?.length &&
                (previousProcess?.processId === 3 || previousProcess?.processId === 4) &&
                digitalandOffsetData) {
                // If no matching previous process data, find a matching digitalandOffsetData
                previousProcessData = digitalandOffsetData.find(
                  (data) => data.quantitySheetId === item.quantitySheetId
                );
              }
            }

            // Find matching independent process data only for the current quantity sheet
            const independentData = previousIndependent.transactions.find(
              (indTrans) => indTrans.quantitySheetId === item.quantitySheetId
            );

            return {
              catchNumber: item.catchNo,
              srNo: item.quantitySheetId,
              seriesName: item.seriesName,
              lotNo: item.lotNo,
              paper: item.paper,
              examDate: item.examDate,
              examTime: item.examTime,
              course: item.course,
              subject: item.subject,
              innerEnvelope: item.innerEnvelope,
              outerEnvelope: item.outerEnvelope,
              pages: item.pages,
              quantity: item.quantity,
              percentageCatch: item.percentageCatch,
              pages: item.pages,
              projectId: selectedProject?.value || id,
              processId: processId,
              status: item.transactions[0]?.status || 0,
              alerts: item.transactions[0]?.alarmId || "",
              interimQuantity: item.transactions[0]?.interimQuantity || 0,
              remarks: item.transactions[0]?.remarks || "",
              previousProcessData:
                previousProcessData && previousProcess
                  ? {
                    status: previousProcessData.transactions?.[0]?.status || 0,
                    interimQuantity:
                      previousProcessData.transactions?.[0]?.interimQuantity || 0,
                    remarks: previousProcessData.transactions?.[0]?.remarks || "",
                    alarmId: previousProcessData.transactions?.[0]?.alarmId || "",
                    teamUserNames:
                      previousProcessData.transactions?.[0]?.teamUserNames || [],
                    machinename:
                      previousProcessData.transactions?.[0]?.machinename || [],
                    alarmMessage:
                      previousProcessData.transactions?.[0]?.alarmMessage || null,
                    thresholdQty: previousProcess?.thresholdQty || 0,
                  }
                  : null,
              voiceRecording: item.transactions[0]?.voiceRecording || "",
              transactionId: item.transactions[0]?.transactionId || null,
              machineId: item.transactions[0]?.machineId || 0,
              machinename:
                item.transactions[0]?.machinename || "No Machine Assigned",
              zoneNo: item.transactions?.[0]?.zoneNo || "No Zone Assigned",
              zoneId: item.transactions?.[0]?.zoneId || 0,
              teamId: item.transactions[0]?.teamId || [],
              teamUserNames: item.transactions[0]?.teamUserNames || [
                "No Team Assigned",
              ],
              alarmMessage: item.transactions[0]?.alarmMessage || null,
              processIds: item.processIds || [],
              independentProcessData: independentData
                ? {
                  status: independentData.transactions[0]?.status || 0,
                  interimQuantity: independentData.transactions[0]?.interimQuantity || 0,
                  remarks: independentData.transactions[0]?.remarks || "",
                  alarmId: independentData.transactions[0]?.alarmId || "",
                  teamUserNames: independentData.transactions[0]?.teamUserNames || [],
                  machinename: independentData.transactions[0]?.machinename || [],
                  alarmMessage: independentData.transactions[0]?.alarmMessage || null,
                  processName: previousIndependent.process?.processName || ""
                }
                : null,
            };
          });

          const filteredData = selectedLot
            ? formDataGet.filter(
              (item) => Number(item.lotNo) === Number(selectedLot)
            )
            : formDataGet;

          setTableData(filteredData);

          const uniqueLots = [
            ...new Set(validTransactions.map((item) => item.lotNo)),
          ].sort((a, b) => a - b);
          const filteredUniqueLots = uniqueLots.filter(
            (lotNo) => !dispatchedLots.includes(lotNo)
          );

          setProjectLots(filteredUniqueLots.map((lotNo) => ({ lotNo })));
        }
      } catch (error) {
        console.error("Error fetching transactions data:", error);
        setTableData([]);
        setProjectLots([]);
      }
    }

  }, [
    id,
    processId,
    selectedLot,
    previousProcessTransactions,
    selectedProject,
    previousProcess,
    previousIndependent
  ]);

  useEffect(() => {
    fetchData();

    const fetchProjectName = async () => {
      try {
        const response = await API.get(
          `/Project/${selectedProject?.value || id}`
        );
        if (!selectedProject) {
          setSelectedProject({ value: id, label: response.data.name });
        }
        setProjectName(response.data.name);
      } catch (error) {
        console.error("Error fetching project details:", error);
      }
    };
    fetchProjectName();
  }, [fetchData, id]);

  useEffect(() => {
    if (selectedLot) {
      fetchTransactions();
    }
  }, [selectedLot, fetchTransactions]);

  useEffect(() => {
    // Set the process from local storage on component mount
    if (processId && processName) {
      setProcess(processId, processName); // This will not update local storage since it's not a manual toggle
    }
  }, [processId, processName, setProcess]);

  const handleLotClick = async (lot) => {
    if (lot !== selectedLot) {
      setSelectedLot(lot);
      setLotInLocal(lot)
      setIsLoading(true);
      try {
        const response = await getProjectTransactionsData(
          selectedProject?.value || id,
          processId
        );
        const transactionsData = response.data;
        const formDataGet = transactionsData.map(formatQuantitySheetData);
        const filteredData = formDataGet.filter(
          (item) => Number(item.lotNo) === Number(lot)
        );
        setTableData(filteredData);
      } catch (error) {
        console.error("Error fetching lot data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCatchClick = (record) => {
    setCatchDetailModalShow(true);
    setCatchDetailModalData(record);
  };

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading project details...</span>
      </div>
    );
  }

  const catchNumbers = tableData
    .map((item) => item.catchNumber)
    .sort((a, b) => a - b);

  const combinedTableData =
    processName !== "Digital Printing" &&
      processName !== "Offset Printing" &&
      processName !== "CTP" &&
      processName !== "Cutting" &&
      processName !== "Proofreading"
      ? tableData.reduce((acc, item) => {
        const existingItem = acc.find(
          (i) => i.catchNumber === item.catchNumber
        );
        if (existingItem) {
          existingItem.quantity += item.quantity;
          // Collect all statuses for this catch number
          existingItem._allStatuses = existingItem._allStatuses || [];
          existingItem._allStatuses.push(item.status);

          // Calculate combined status
          const uniqueStatuses = new Set(existingItem._allStatuses);
          if (uniqueStatuses.has(1)) {
            existingItem.status = 1; // If any status is 1, combined status is 1
          } else if (uniqueStatuses.size === 1 && uniqueStatuses.has(2)) {
            existingItem.status = 2; // If all statuses are 2, combined status is 2
          } else {
            existingItem.status = 0; // Otherwise, combined status is 0
          }

          // Same logic for previous process status if it exists
          if (item.previousProcessData) {
            existingItem._allPreviousStatuses = existingItem._allPreviousStatuses || [];
            existingItem._allPreviousStatuses.push(item.previousProcessData.status);

            const uniquePrevStatuses = new Set(existingItem._allPreviousStatuses);
            if (uniquePrevStatuses.has(1)) {
              existingItem.previousProcessData.status = 1;
            } else if (uniquePrevStatuses.size === 1 && uniquePrevStatuses.has(2)) {
              existingItem.previousProcessData.status = 2;
            } else {
              existingItem.previousProcessData.status = 0;
            }
          }
        } else {
          // Remove seriesName and initialize status arrays for new items
          const { seriesName, ...restItem } = item;
          acc.push({
            ...restItem,
            _allStatuses: [item.status],
            _allPreviousStatuses: item.previousProcessData ? [item.previousProcessData.status] : []
          });
        }
        return acc;
      }, []).map(item => {
        // Clean up temporary arrays before final output
        const { _allStatuses, _allPreviousStatuses, ...cleanItem } = item;
        return cleanItem;
      })
      : tableData;


  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center mb-">
        <IoIosArrowDropdownCircle
          className={`me-2 ${customDarkText}`}
          size={24}
          style={{
            cursor: 'pointer',
            transform: isHeaderOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.3s ease'
          }}
          onClick={() => setIsHeaderOpen(!isHeaderOpen)}
        />
        <span className={`${customDarkText}`}>Project Details</span>
      </div>
      <Collapse in={isHeaderOpen}>
        <div>
          <Row className="mb-">
            <Col lg={12} md={12} xs={12} className="">
              <Card className="shadow-sm">
                <Card.Header
                  as="h3"
                  className={`${customDark === "dark-dark"
                    ? `${customDark} text-white`
                    : `${customDark} text-white`
                    }`}
                >
                  <Row className="d-flex align-items-center">
                    <Col lg={3} md={4} xs={12}>
                      <PreviousProcess
                        previousProcess={previousProcess}
                        previousProcessCompletionPercentage={
                          previousProcessCompletionPercentage
                        }
                      />
                    </Col>
                    <div className="d-flex justify-content-center d-lg-none d-md-none">
                      <hr className="w-100 center" />
                    </div>
                    <Col lg={6} md={4} xs={12}>
                      <ToggleProject
                        projectName={projectName}
                        selectedLot={selectedLot}
                        onChange={handleProjectChange}
                      />
                    </Col>
                    <div className="d-flex justify-content-center d-lg-none d-md-none">
                      <hr className="w-100 center" />
                    </div>
                    <Col lg={3} md={4} xs={12}>
                      <ToggleProcess
                        processes={processes}
                        initialProcessId={processId}
                        onProcessChange={handleProcessChange}
                        customDark={customDark}
                      />
                    </Col>
                  </Row>
                </Card.Header>
              </Card>
            </Col>
          </Row>
        </div>
      </Collapse>

      <Row>
        <Col lg={12} md={12}>
          <div className="marquee-container">
            <MarqueeAlert data={tableData} onClick={handleCatchClick} />
          </div>
        </Col>
      </Row>

      {processName !== "Dispatch" && (

        <Row className="mb-2">
          <div className="d-flex align-items-center justify-content-between">

            <Col lg={2} md={4} className="Progressbarcolor">
              <CatchProgressBar data={combinedTableData} />
            </Col>

            <Col lg={10} md={8} className="mr-2">
              <div>
                <ProcessProgressTrain
                  ProjectID={selectedProject.value}
                  lotNumber={selectedLot}
                  previousProcess={previousProcess}
                  showProcessTrain={showProcessTrain}
                  setShowProcessTrain={setShowProcessTrain}
                  processTrainData={processTrainData}
                  setProcessTrainData={setProcessTrainData}
                  setSelectedStatus={setSelectedStatus}
                  setSelectedProcessId={setSelectedProcessId}
                  setModalVisible={setModalVisible}
                />
              </div>
            </Col>
          </div>
        </Row>

      )}

      {processName === "Dispatch" ? (
        <DispatchPage
          projectId={selectedProject?.value || id}
          processId={processId}
          lotNo={selectedLot}
          projectName={projectName}
        />
      ) : (
        <>
          {modalVisible ? (
            <div className="">
              <ProcessTrainModals
                ProjectID={selectedProject?.value || id}
                lotNumber={selectedLot}
                ProcessID={selectedProcessId}
                status={selectedStatus}
                setModalVisible={setModalVisible}
              />
            </div>
          ) : (
            <Row className="mb-2 mt-1">
              <Col lg={12} md={12} className="">
                {tableData?.length > 0 && (
                  <ProjectDetailsTable
                    tableData={combinedTableData}
                    fetchTransactions={fetchTransactions}
                    setTableData={setTableData}
                    projectId={selectedProject?.value || id}
                    lotNo={selectedLot}
                    featureData={featureData}
                    hasFeaturePermission={hasFeaturePermission}
                    processId={processId}
                    projectLots={projectLots}
                    handleLotClick={handleLotClick}
                    setShowBarChart={setShowBarChart}
                    showBarChart={showBarChart}
                    setShowPieChart={setShowPieChart}
                    showPieChart={showPieChart}
                  />
                )}
              </Col>
            </Row>
          )}


        </>
      )}

      <Row className="mb-4 d-flex justify-content-between">

        {showBarChart && (
          <Col
            lg={12}
            md={12}
            sm={12}
            className="mt-1 d-fle justify-content-center"
          >
            <StatusBarChart
              data={combinedTableData}
              catchNumbers={catchNumbers}
            />
          </Col>
        )}

        {showPieChart && (
          <Col
            lg={12}
            md={12}
            sm={12}
            className="mt-1 d-fle justify-content-center"
          >
            <StatusPieChart data={combinedTableData} />
          </Col>
        )}
      </Row>

      <CatchDetailModal
        show={catchDetailModalShow}
        handleClose={() => setCatchDetailModalShow(false)}
        data={catchDetailModalData}
        fetchTransactions={fetchTransactions}
      />
    </div>
  );
};

export default ProcessTable;