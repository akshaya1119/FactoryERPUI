import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { Button, Card, Tabs, message } from 'antd';

import AddProjectProcess from './Tabs/AddProjectProcess';
import ProjectUserAllocation from './Tabs/ProjectUserAllocation';
import ProjectTab from './Tabs/ProjectTab';

import themeStore from '../../store/themeStore';

const Project = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

  const [activeTabKey, setActiveTabKey] = useState("1");
  const [selectedProject, setSelectedProject] = useState();
  const [activetab3, setActiveTab3] = useState(false);
  const [isProcessSubmitted, setIsProcessSubmitted] = useState(false);


  useEffect(() => {
    if (activeTabKey === "1") {
      setActiveTab3(false);
      setSelectedProject(null);
    }
  }, [activeTabKey]);


  const items = [
    {
      key: "1",
      label: t('projectList'),
      children: (
        <ProjectTab 
          setActiveTabKey={setActiveTabKey}
          setSelectedProject={setSelectedProject}
        />
      )
    },
    {
      key: "2", 
      label: t('selectProcess'),
      disabled: !selectedProject,
      children: (
        <div className="responsive-container">
          <AddProjectProcess selectedProject={selectedProject} setIsProcessSubmitted={setIsProcessSubmitted} />
          <Button 
            type="primary" 
            onClick={() => {setActiveTabKey("3"); setActiveTab3(true);}} 
            style={{ marginTop: '20px' }}
            disabled={!isProcessSubmitted} // Disable if process is not submitted
          >
            {t('next')}
          </Button>
        </div>
      )
    },
    {
      key: "3",
      label: t('allocateProcess'),
      disabled: !selectedProject || !activetab3,
      children: (
        <div className="responsive-container">
          <ProjectUserAllocation selectedProject={selectedProject} activeKey={activeTabKey}/>
        </div>
      )
    }
  ];

  return (
    <Card
      title={t('projects')}
      bordered={true}
      style={{ padding: '1px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', width: '100%' }}
    >
      {console.log(activeTabKey, activetab3)}
      <Tabs 
        activeKey={activeTabKey} 
        onChange={setActiveTabKey}
        items={items}
      />
    </Card>
  );
};

export default Project;
