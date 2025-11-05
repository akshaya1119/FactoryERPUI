import React, { useEffect, useState } from "react";
import "./../styles/ProcessProgressTrain.css";
import API from "../CustomHooks/MasterApiHooks/api";
import useCurrentProcessStore from "../store/currentProcessStore";
import { Popover } from "antd";

const TooltipSection = ({ title, children }) => (
  <Popover placement="bottom" content={title} trigger="hover">
    <div className="trsection" style={{ cursor: 'pointer' }}>{children}</div>
  </Popover>
);

const ProcessProgressTrain = ({ ProjectID, lotNumber, previousProcess, showProcessTrain, setShowProcessTrain, processTrainData, setProcessTrainData, setSelectedStatus, setSelectedProcessId, setModalVisible }) => {
  const [visibleSections, setVisibleSections] = useState(2);
  const [sectionsData, setsectionsData] = useState([]);
  const { processId, processName } = useCurrentProcessStore();
  const [isDispatched, setIsDispatched] = useState(false);
  // const [modalVisible, setModalVisible] = useState(false);
  // const [selectedStatus, setSelectedStatus] = useState(null);
  // const [selectedProcessId, setSelectedProcessId] = useState(null);

  console.log(ProjectID, lotNumber);
  useEffect(() => {
    const fetchDispatch = async () =>{
      if(ProjectID && lotNumber)
      {
        const projectIdInt = parseInt(ProjectID, 10);

        const response = await API.get(
          `/Dispatch/project/${projectIdInt}/lot/${lotNumber}`
        );
        console.log(response.data);
        if (response.data.length !=0 && response.data[0].status === true) {
          setIsDispatched(true);
        }
      }
    };

    fetchDispatch()
  },[ProjectID,lotNumber])
  
  
  
  useEffect(() => {
    const fetchData = async () => {
      if (ProjectID && lotNumber) {
        const projectIdInt = parseInt(ProjectID, 10);
        const lotNumberInt = parseInt(lotNumber, 10);

        const response = await API.get(
          `Transactions/Process-Train?projectId=${projectIdInt}&LotNo=${lotNumberInt}`
        );

        if(response.data == 'Dispatched') {
          setsectionsData([]);
        }
        setsectionsData(response.data);
        console.log(response.data);
      }
    };

    fetchData();
  }, [ProjectID, lotNumber]);

  useEffect(() => {
    console.log(sectionsData);
  }, [sectionsData]);

  const handleExpand = () => {
    setVisibleSections(sectionsData.length);
  };

  const handleCollapse = () => {
    setVisibleSections(2);
  };

  const handleStatusClick = (status, processId) => {
    setModalVisible(true);
    setSelectedStatus(status);
    setSelectedProcessId(processId);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedStatus(null);
    setSelectedProcessId(null);
  };

  // Find the previous process data in sectionsData
  const previousProcessData = sectionsData.find(
    (section) => section.processId === previousProcess?.processId
  );

  // Find the current process data in sectionsData
  const currentProcessData = sectionsData.find(
    (section) => section.processId === processId
  );

  const getCardColorClass = (section) => {
    if (
      section?.wipCount == 0 &&
      section?.wipTotalQuantity == 0 &&
      section?.remainingCatchNo == 0 &&
      section?.remainingQuantity == 0 &&
      (section?.completedCount == 0) & (section?.completedTotalQuantity == 0)
    ) {
      return "lightred-card";
    } else if (section?.wipCount !== 0 && section?.wipTotalQuantity !== 0) {
      return "lightblue-card";
    } else if (
      section?.remainingCatchNo === 0 &&
      section?.remainingQuantity === 0 &&
      section?.wipCount === 0 &&
      section?.wipTotalQuantity === 0
    ) {
      return "lightgreen-card";
    } else if (
      section?.wipCount === 0 &&
      section?.wipTotalQuantity === 0 &&
      (section?.remainingCatchNo !== 0 || section?.remainingQuantity !== 0)
    ) {
      return "lightred-card";
    }
    return ""; // Default class if none of the conditions match
  };

  return (
    <div className="trcontainer">
      {isDispatched ? (
        <div className="box7">Dispatched</div>
      ) : (
        <>
          {visibleSections === 2 ? (
            <>
              {previousProcessData && (
                <div className={`box ${getCardColorClass(previousProcessData)}`}>
                  <div className="box2">
                    {previousProcessData.processName
                      .split(" ")
                      .slice(0, 2)
                      .join(" ")}
                  </div>
                  <div className="box3">
                    <div onClick={() => handleStatusClick('Pending', previousProcessData.processId)} style={{ cursor: 'pointer' }}>
                      <TooltipSection title="Pending">
                        {previousProcessData.remainingCatchNo}/
                        {previousProcessData.remainingQuantity}
                      </TooltipSection>
                    </div>
                    <div onClick={() => handleStatusClick('WIP', previousProcessData.processId)} style={{ cursor: 'pointer' }}>
                      <TooltipSection title="WIP">
                        {previousProcessData.wipCount}/
                        {previousProcessData.wipTotalQuantity}
                      </TooltipSection>
                    </div>
                    <div onClick={() => handleStatusClick('Completed', previousProcessData.processId)} style={{ cursor: 'pointer' }}>
                      <TooltipSection title="Completed">
                        {previousProcessData.completedCount}/
                        {previousProcessData.completedTotalQuantity}
                      </TooltipSection>
                    </div>
                  </div>
                </div>
              )}
              <div className={`box ${getCardColorClass(currentProcessData)}`}>
                <div className="box2">
                  {currentProcessData
                    ? currentProcessData.processName
                        .split(" ")
                        .slice(0, 2)
                        .join(" ")
                    : "No Current Process"}
                </div>
                <div className="box3">
                <div onClick={() => handleStatusClick('Pending', currentProcessData?.processId)} style={{ cursor: 'pointer' }}>
                  <TooltipSection title="Pending">
                    {currentProcessData?.remainingCatchNo}/
                    {currentProcessData?.remainingQuantity}
                  </TooltipSection>
                </div>
                <div onClick={() => handleStatusClick('WIP', currentProcessData?.processId)} style={{ cursor: 'pointer' }}>
                  <TooltipSection title="WIP">
                    {currentProcessData?.wipCount}/
                    {currentProcessData?.wipTotalQuantity}
                  </TooltipSection>
                </div>
                <div onClick={() => handleStatusClick('Completed', currentProcessData?.processId)} style={{ cursor: 'pointer' }}>
                  <TooltipSection title="Completed">
                    {currentProcessData?.completedCount}/
                    {currentProcessData?.completedTotalQuantity}
                  </TooltipSection>
                </div>
                </div>
              </div>
            </>
          ) : (
            sectionsData.slice(0, visibleSections).map((section, index) => (
              <div key={index} className={`box ${getCardColorClass(section)}`}>
                <div className="box2">
                  {section.processName.split(" ").slice(0, 2).join(" ")}
                </div>
                <div className="box3">
                <div onClick={() => handleStatusClick('Pending', section.processId)} style={{ cursor: 'pointer' }}>
                  <TooltipSection title="Pending">
                    {section.remainingCatchNo}/{section.remainingQuantity}
                  </TooltipSection>
                </div>
                <div onClick={() => handleStatusClick('WIP', section.processId)} style={{ cursor: 'pointer' }}>
                  <TooltipSection title="WIP">
                    {section?.wipCount}/{section?.wipTotalQuantity}
                  </TooltipSection>
                </div>
                <div onClick={() => handleStatusClick('Completed', section.processId)} style={{ cursor: 'pointer' }}>
                  <TooltipSection title="Completed">
                    {section.completedCount}/{section?.completedTotalQuantity}
                  </TooltipSection>
                </div>
                </div>
              </div>
            ))
          )}
          {visibleSections < sectionsData.length && (
            <button onClick={handleExpand} className="expand-button">
              &gt;&gt;
            </button>
          )}
          {visibleSections > 2 && (
            <button onClick={handleCollapse} className="collapse-button">
              &lt;&lt;
            </button>
          )}
        </>
      )}
      {/* <ProcessTrainModals
        ProjectID={ProjectID}
        lotNumber={lotNumber}
        ProcessID={selectedProcessId}
        status={selectedStatus}
        visible={modalVisible}
        onClose={handleModalClose}
      /> */}
    </div>
  );
};

export default ProcessProgressTrain;