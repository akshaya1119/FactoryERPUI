// SystemSettings.js
import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { AppstoreOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import FeatureManagement from './Feature';
import ProcessManagement from './ProcessManagement';
import FeatureConfiguration from './FeatureConfiguration';
import { useStore } from 'zustand';
import themeStore from '../../store/themeStore';
import { FaSearch } from 'react-icons/fa';
import { Modal } from 'react-bootstrap';
import { AiFillCloseSquare } from 'react-icons/ai';
import API from '../../CustomHooks/MasterApiHooks/api';
import { useUserData } from '../../store/userDataStore';

const { TabPane } = Tabs;

const SystemSettings = () => {
  const userData = useUserData();
  const roleId = userData.role.roleId;
  console.log(roleId);
  const [features, setFeatures] = useState([]);
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

  const updateFeatures = (updatedFeatures) => {
    setFeatures(updatedFeatures);
  };

  const updateProcesses = (updatedProcesses) => {
    // Handle process update logic here if needed
  };

  return (
    <div>
      <Tabs 
        defaultActiveKey="1"
        className={`custom-tabs`}
        tabBarStyle={{
          borderBottom: `2px solid ${customDark}`
        }}
      >
        {roleId === 1 && (
          <TabPane
            tab={
              <span className={`${customDarkText} ${customDark === 'blue-dark' ? customLightText : customDarkText}`}>
                <AppstoreOutlined />
                {t('features')}
              </span>
            }
            key="1"
          >
            <FeatureManagement onUpdateFeatures={updateFeatures} />
          </TabPane>
        )}
        <TabPane
          tab={
            <span className={`${customDarkText} ${customDark === 'blue-dark' ? customLightText : customDarkText}`}>
              <SettingOutlined />
              {t('processes')}
            </span>
          }
          key="2"
        >
          <ProcessManagement features={features} onUpdateProcesses={updateProcesses} />
        </TabPane>
        <TabPane
          tab={
            <span className={`${customDarkText} ${customDark === 'blue-dark' ? customLightText : customDarkText}`}>
              <ToolOutlined />
              {t('featureConfiguration')}
            </span>
          }
          key="3"
        >
          <FeatureConfiguration features={features} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default SystemSettings;
