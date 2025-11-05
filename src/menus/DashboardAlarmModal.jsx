import React, { useEffect, useState } from "react";
import { Button, Table, Row, Col, Alert } from "react-bootstrap";
import API from "../CustomHooks/MasterApiHooks/api";
import { useStore } from 'zustand';
import themeStore from '../store/themeStore';

const DashboardAlarmModal = ({ projectId, lotNo, hasResolvePermission }) => {
  const [alarmsData, setAlarmsData] = useState([]);
  const [filteredAlarmsData, setFilteredAlarmsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [projectName, setProjectName] = useState("");

  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn] = cssClasses;

  const processesToSkipGroup = ["Digital Printing", "Offset Printing", "CTP", "Cutting"];

  // Fetch data from APIs
  useEffect(() => {
    const fetchData = async () => {
      if (!projectId) {
        return;
      }

      try {

        // Fetch alarms data
        const alarmsResponse = await API.get(`/Transactions/alarms?projectId=${projectId}`);
        const alarms = alarmsResponse.data;

        // Fetch project details
        const projectResponse = await API.get(`/Project/${projectId}`);
        const projectDetails = projectResponse.data;
        setProjectName(projectDetails.name);

        setAlarmsData(alarms);

      } catch (err) {
        console.error("Error fetching data:", err);
        setError(`No Alerts Found`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Filter alarms based on the selected lotNo
  useEffect(() => {
    if (lotNo && alarmsData.length > 0) {
      const filteredData = alarmsData.filter(
        (alert) => alert.lotNo === Number(lotNo) && alert.alarmId.trim() !== "" // filter out alarms with empty alarmId
      );
      setFilteredAlarmsData(filteredData);
    }
  }, [lotNo, alarmsData]);

  // Group alarms by catchNumber and alarmMessage if process is not in the specified list
  const groupAlarms = (alarms) => {
    const groupedAlarms = {};

    alarms.forEach(alarm => {
      const { catchNumber, alarmMessage, process } = alarm;

      // If process is in the list, don't group by catchNumber or alarmMessage
      if (processesToSkipGroup.includes(process)) {
        const groupKey = `${catchNumber}-${alarmMessage}`;
        if (!groupedAlarms[groupKey]) {
          groupedAlarms[groupKey] = [];
        }
        groupedAlarms[groupKey].push(alarm);
      } else {
        // Otherwise, group by both catchNumber and alarmMessage
        const groupKey = `${catchNumber}-${alarmMessage}`;
        if (!groupedAlarms[groupKey]) {
          groupedAlarms[groupKey] = [];
        }
        groupedAlarms[groupKey].push(alarm);
      }
    });

    return Object.values(groupedAlarms);  // Return grouped alarms as an array
  };

  // Handle resolve functionality
  const handleResolve = async (quantitysheetId) => {
    try {

      const alarmData = filteredAlarmsData.find(
        (alarm) => alarm.quantitysheetId === quantitysheetId
      );
      if (!alarmData) {
        throw new Error(
          `Alarm not found for QuantitySheetId: ${quantitysheetId}`
        );
      }

      // Fetch existing transaction data if it exists (useful for remarks, status, etc.)
      let existingTransactionData = {};
      if (alarmData.transactionId) {
        const response = await API.get(`/Transactions/${alarmData.transactionId}`);
        existingTransactionData = response.data;
      }

      // Prepare the data to send in the POST request
      const postData = {
        transactionId: alarmData.transactionId || 0,
        interimQuantity: alarmData.interimQuantity || 0,
        remarks: existingTransactionData.remarks || "",
        projectId: alarmData.projectId || projectId,
        quantitysheetId: alarmData.quantitysheetId || 0,
        processId: existingTransactionData.processId || 0,
        zoneId: existingTransactionData.zoneId || 0,
        machineId: existingTransactionData.machineId || 0,
        status: existingTransactionData.status || 0,
        alarmId: "0", // Assuming this marks the alarm as resolved
        lotNo: alarmData.lotNo || 0,
        teamId: existingTransactionData.teamId || [],
        voiceRecording: existingTransactionData.voiceRecording || "",
      };


      // Send the POST request to create or update the transaction
      const response = await API.post(`/Transactions`, postData);

      setSuccessMessage("Alarm resolved successfully!");
      const alarmsResponse = await API.get(`/Transactions/alarms?projectId=${projectId}`);
      const updatedAlarms = alarmsResponse.data;

      setAlarmsData(updatedAlarms);
    } catch (error) {
      console.error("Error resolving alarm:", error);
      setError(`Failed to resolve alarm: ${error.message}`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className={`alert alert-success ${customLight}`}>{error}</div>;
  }

  // Group the filtered alarms
  const groupedAlarms = groupAlarms(filteredAlarmsData);

  return (
    <div>
      <Row className="mb-3">
        <Col>
          <h3>Project {projectName} - Alarms</h3>
        </Col>
        <Col>
          <h3>Alarms for Lot {lotNo}</h3>
        </Col>
      </Row>

      {successMessage && (
        <Alert variant="success" className={`mb-3 ${customLight}`} onClose={() => setSuccessMessage("")} dismissible>
          {successMessage}
        </Alert>
      )}

      <Table striped bordered hover className={customLight}>
        <thead>
          <tr>
            <th>Catch No.</th>
            <th>Alarm Message</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {groupedAlarms.length > 0 ? (
            groupedAlarms.map((group, index) => (
              <React.Fragment key={index}>
                {/* Group alarms with the same catchNumber and alarmMessage */}
                {group.map((data, idx) => (
                  <tr key={idx}>
                    {/* Only show catchNumber and alarmMessage for the first item in the group */}
                    {idx === 0 && (
                      <td rowSpan={group.length}>{data.catchNumber}</td>
                    )}
                    {idx === 0 && (
                      <td rowSpan={group.length}>{data.alarmMessage}</td>
                    )}
                    {/* Only show Resolve button once per group */}
                    {idx === 0 && hasResolvePermission && (
                      <td>
                        <Button
                          variant="success"
                          className={`${customBtn} ${customDark === "dark-dark" ? "border" : "border-0"}`}
                          onClick={() => handleResolve(data.quantitysheetId)}
                        >
                          Resolve
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan="3">No alarms found for this lot.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default DashboardAlarmModal;
