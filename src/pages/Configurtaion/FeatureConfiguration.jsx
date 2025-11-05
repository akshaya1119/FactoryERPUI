import React, { useEffect, useState } from 'react';
import { Table, Button, Popconfirm, Select, Switch, message } from 'antd';
import API from '../../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import themeStore from '../../store/themeStore';

const FeatureConfiguration = () => {
    const [features, setFeatures] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [checkedFeatures, setCheckedFeatures] = useState({});
    const { t } = useTranslation();
    const { getCssClasses } = useStore(themeStore);
    const cssClasses = getCssClasses();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

    const fetchProcesses = async () => {
        try {
            const response = await API.get('/Processes');
            setProcesses(response.data);
            console.log('Fetched processes:', response.data);
        } catch (error) {
            console.error("Failed to fetch processes", error);
        }
    };

    const fetchFeatures = async () => {
        try {
            const response = await API.get('/Features');
            setFeatures(response.data);
            console.log('Fetched features:', response.data);
        } catch (error) {
            console.error("Failed to fetch features", error);
        }
    };

    useEffect(() => {
        fetchProcesses();
        fetchFeatures();
    }, []);

    const handleSwitchChange = async (processId, featureId, checked) => {
        try {
            const process = processes.find(p => p.id === processId);
            let updatedInstalledFeatures = [...(process.installedFeatures || [])];
            
            if (checked) {
                updatedInstalledFeatures.push(featureId);
            } else {
                updatedInstalledFeatures = updatedInstalledFeatures.filter(id => id !== featureId);
            }

            await API.put(`/Processes/${processId}`, {
                ...process,
                installedFeatures: updatedInstalledFeatures
            });

            setProcesses(prevProcesses => prevProcesses.map(p => 
                p.id === processId ? {...p, installedFeatures: updatedInstalledFeatures} : p
            ));

            setCheckedFeatures(prev => ({
                ...prev,
                [processId]: {
                    ...prev[processId],
                    [featureId]: checked
                }
            }));

            message.success(t(checked ? 'featureEnabledSuccess' : 'featureDisabledSuccess'));
        } catch (error) {
            console.error("Failed to update process", error);
            message.error(t('featureUpdateError'));
        }
    };

    const columns = [
        {
            title: t('processName'),
            dataIndex: 'name',
            key: 'name',
            render: (text) => <span style={{ fontWeight: 'bold' }}>{text || t('unnamedProcess')}</span>,
        },
        ...features.map(feature => ({
            title: feature.features,
            dataIndex: feature.featureId,
            key: feature.featureId,
            render: (_, process) => {
                const isChecked = checkedFeatures[process.id]?.[feature.featureId] ||
                    (process.installedFeatures && process.installedFeatures.includes(feature.featureId));
                return (
                    <Switch
                        checked={isChecked}
                        onChange={(checked) => handleSwitchChange(process.id, feature.featureId, checked)}
                        size="small"
                    />
                );
            },
            align: 'center',
        })),
    ];

    return (
        <div className="feature-configuration-container">
            <Table
                rowKey="id"
                dataSource={processes}
                columns={columns}
                pagination={false}
                bordered
                scroll={{ x: true }}
                style={{ 
                    boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                }}
                className={`${customDark === "default-dark" ? "thead-default" : ""}
                    ${customDark === "red-dark" ? "thead-red" : ""}
                    ${customDark === "green-dark" ? "thead-green" : ""}
                    ${customDark === "blue-dark" ? "thead-blue" : ""}
                    ${customDark === "dark-dark" ? "thead-dark" : ""}
                    ${customDark === "pink-dark" ? "thead-pink" : ""}
                    ${customDark === "purple-dark" ? "thead-purple" : ""}
                    ${customDark === "light-dark" ? "thead-light" : ""}
                    ${customDark === "brown-dark" ? "thead-brown" : ""} custom-pagination`}
            />
        </div>
    );
};

export default FeatureConfiguration;
