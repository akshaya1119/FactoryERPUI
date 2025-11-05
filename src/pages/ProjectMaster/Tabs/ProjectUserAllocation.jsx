import React, { useEffect, useState } from 'react';
import { Select, Table, Button, message } from 'antd';
import API from '../../../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import themeStore from './../../../store/themeStore';
// import { useTranslation } from 'react-i18next';

const { Option } = Select;

const ProjectUserAllocation = ({ selectedProject, activeKey }) => {
  const [processes, setProcesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSelections, setUserSelections] = useState({});
  const [projectName, setProjectName] = useState(''); // State for project name
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

  useEffect(() => {
    if (selectedProject) {
      fetchProjectName(selectedProject); // Fetch project name when selectedProject changes
      fetchProcessesWithUsers();
    }
    fetchUsers();
  }, [selectedProject, activeKey]);
  
  const fetchProjectName = async (projectId) => {
    try {
      const response = await API.get(`/Project/${projectId}`);
      setProjectName(response.data.name); // Assuming response has a 'name' field
    } catch (error) {
      console.error(t("failedToFetchProjectName"), error);
    }
  };



  const fetchUsers = async () => {
    try {
      const response = await API.get("/User");
      const filteredUsers = response.data.filter(user => user.roleId === 5 || user.roleId === 1 || user.roleId === 4 || user.roleId === 3);
      setUsers(filteredUsers);
    } catch (error) {
      console.error(t("failedToFetchUsers"), error);
    }
  };

  const fetchProcessesWithUsers = async () => {
    try {
      // Fetch processes for the selected project
      const response = await API.get(`/ProjectProcess/GetProcessesWithUsers/${selectedProject}`);
      const { processes } = response.data;
  
      setProcesses(processes);
  
      // Prepare userSelections based on the fetched processes
      const newUserSelections = {};
  
      // Check each process
      for (const process of processes) {
        if (process.userId && process.userId.length > 0) {
          // If userId is present, map it directly
          newUserSelections[process.processId] = process.userId;
        } else {
          // If userId is not present, fetch the previous project's userId for the same processId
          const previousProjectResponse = await API.get(`/ProjectProcess/GetProcessesWithUsers/${selectedProject - 1}`);
          const previousProcesses = previousProjectResponse.data.processes;
  
          // Find the process from the previous project with the same processId
          const previousProcess = previousProcesses.find(p => p.processId === process.processId);
  
          // If a corresponding process is found, use its userId
          if (previousProcess && previousProcess.userId && previousProcess.userId.length > 0) {
            newUserSelections[process.processId] = previousProcess.userId;
          } else {
            // If no userId is found in the previous project, set as an empty array
            newUserSelections[process.processId] = [];
          }
        }
      }
  
      // Set the user selections
      setUserSelections(newUserSelections);
  
    } catch (error) {
      console.error(t("failedToFetchProcesses"), error);
    }
  };
  

  const handleUserChange = (processId, selectedUsers) => {
    setUserSelections(prev => ({
      ...prev,
      [processId]: selectedUsers,
    }));
  };

  const handleSubmit = async () => {
    try {
      const userAssignments = Object.entries(userSelections).reduce((acc, [processId, userIds]) => {
        acc[parseInt(processId, 10)] = userIds.map(userId => parseInt(userId, 10));
        return acc;
      }, {});

      await API.post(`/ProjectProcess/UpdateProcessUsers/${selectedProject}`, userAssignments);
      message.success(t("usersAssignedSuccessfully"));
      fetchProcessesWithUsers(selectedProject); // Refresh the process list
    } catch (error) {
      console.error("Failed to assign users", error);
      message.error(t("failedToAssignUsers"));
    }
  };

  const columns = [
    {
      title: t('processName'),
      dataIndex: 'processName',
      key: 'processName',
    },
    {
      title: t('assignSupervisor'),
      key: 'assignUser',
      render: (text, record) => (
        <Select
          mode="multiple"
          placeholder="Select Users"
          value={userSelections[record.processId] || []}
          onChange={(selectedUsers) => handleUserChange(record.processId, selectedUsers)}
          style={{  width: 400, whiteSpace: 'nowrap' }}
        >
          {users.map(user => (
            <Option key={user.userId} value={user.userId}>
              {user.firstName} {user.lastName}
            </Option>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <div>
      <h3>{t("projectUserAllocationFor")} {projectName}</h3>
      <Table
        dataSource={processes}
        columns={columns}
        rowKey="processId" // Ensure this matches your data structure
        pagination={false}
      />
      <Button type="primary" onClick={handleSubmit} style={{ marginTop: '20px' }}>
        {t("submitUserAssignments")}
      </Button>
    </div>
  );
};

export default ProjectUserAllocation;
