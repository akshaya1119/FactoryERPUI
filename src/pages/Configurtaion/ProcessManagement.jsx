import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Switch, Select, notification } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import API from '../../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import themeStore from '../../store/themeStore';
import { Modal } from 'react-bootstrap';

const ProcessManagement = ({ onUpdateProcesses, onAddProcess = () => { } }) => {
    const { t } = useTranslation();
    const [processModalVisible, setProcessModalVisible] = useState(false);
    const [processes, setProcesses] = useState([]);
    const [features, setFeatures] = useState([]);
    const [isEditingProcess, setIsEditingProcess] = useState(false);
    const [editingProcessId, setEditingProcessId] = useState(null);
    const [processName, setProcessName] = useState('');
    const [processStatus, setProcessStatus] = useState(false);
    const [processWeightage, setProcessWeightage] = useState(0);
    const [processInstalledFeatures, setProcessInstalledFeatures] = useState([]);
    const [processType, setProcessType] = useState('');
    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const { getCssClasses } = useStore(themeStore);
    const cssClasses = getCssClasses();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

    // Add state to track original values for comparison
    const [originalValues, setOriginalValues] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    const fetchProcesses = async () => {
        try {
            const response = await API.get('/Processes');
            const processesWithFeatureNames = response.data.map(process => {
                const featureNames = process.installedFeatures?.map(featureId => {
                    const feature = features.find(f => f.id === featureId);
                    return feature?.name;
                }).filter(Boolean);
                
                return {
                    key: process.id.toString(),
                    ...process,
                    featureNames
                };
            });
            setProcesses(processesWithFeatureNames);
        } catch (error) {
            console.error('Error fetching processes:', error);
            notification.error({ message: t('failedToFetchProcesses') });
        }
    };

    const fetchFeatures = async () => {
        try {
            const response = await API.get('/Features');
            setFeatures(response.data.map(feature => ({
                key: feature.featureId,
                id: feature.featureId,
                name: feature.features,
            })));
        } catch (error) {
            console.error('Error fetching features:', error);
            notification.error({ message: t('failedToFetchFeatures') });
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    useEffect(() => {
        if (features.length > 0) {
            fetchProcesses();
        }
    }, [features]);

    // Effect to check for changes
    useEffect(() => {
        if (isEditingProcess) {
            const currentValues = {
                name: processName,
                status: processStatus,
                weightage: processWeightage,
                installedFeatures: processInstalledFeatures,
                processType: processType,
                rangeStart: rangeStart,
                rangeEnd: rangeEnd
            };

            const hasAnyChange = Object.keys(originalValues).some(key => {
                if (Array.isArray(originalValues[key])) {
                    return JSON.stringify(originalValues[key]) !== JSON.stringify(currentValues[key]);
                }
                return originalValues[key] !== currentValues[key];
            });

            setHasChanges(hasAnyChange);
        }
    }, [processName, processStatus, processWeightage, processInstalledFeatures, processType, rangeStart, rangeEnd]);

    const showAddProcessModal = (process = null) => {
        if (process) {
            const originalVals = {
                name: process.name,
                status: process.status,
                weightage: process.weightage,
                installedFeatures: process.installedFeatures || [],
                processType: process.processType,
                rangeStart: process.processType === 'Dependent' ? 0 : (process.rangeStart || ''),
                rangeEnd: process.processType === 'Dependent' ? 0 : (process.rangeEnd || '')
            };
            setOriginalValues(originalVals);
            
            setProcessName(process.name);
            setProcessStatus(process.status);
            setProcessWeightage(process.weightage);
            setProcessInstalledFeatures(process.installedFeatures || []);
            setProcessType(process.processType);
            setIsEditingProcess(true);
            setEditingProcessId(process.id);
            if (process.processType === 'Dependent') {
                setRangeStart(0);
                setRangeEnd(0);
            } else {
                setRangeStart(process.rangeStart || '');
                setRangeEnd(process.rangeEnd || '');
            }
        } else {
            setOriginalValues({});
            setProcessName('');
            setProcessStatus(true);
            setProcessWeightage(0);
            setProcessInstalledFeatures([]);
            setProcessType('');
            setIsEditingProcess(false);
            setEditingProcessId(null);
            setRangeStart('');
            setRangeEnd('');
            setHasChanges(true); // Enable save for new processes
        }
        setProcessModalVisible(true);
    };

    const handleAddProcess = async () => {
        if (!processName) {
            notification.error({ message: t('processNameEmpty') });
            return;
        }

        const isDuplicate = processes.some(process => process.name === processName && process.id !== editingProcessId);
        if (isDuplicate) {
            notification.error({ message: t('processDuplicateName') });
            return;
        }

        const rangeStartNum = parseFloat(rangeStart);
        const rangeEndNum = parseFloat(rangeEnd);

        if (processType === 'Independent') {
            if (isNaN(rangeStartNum) || isNaN(rangeEndNum)) {
                notification.error({ message: t('invalidRangeNumbers') });
                return;
            }
        }

        const newProcess = {
            id: editingProcessId || 0,
            name: processName,
            weightage: processWeightage,
            status: processStatus,
            installedFeatures: processInstalledFeatures.map(Number),
            processType,
            rangeStart: processType === 'Dependent' ? 0 : (rangeStart || 0),
            rangeEnd: processType === 'Dependent' ? 0 : (rangeEnd || 0),
        };

        try {
            let response;
            if (isEditingProcess) {
                response = await API.put(`/Processes/${editingProcessId}`, newProcess);
                fetchProcesses();
            } else {
                response = await API.post('/Processes', newProcess);
                fetchProcesses();
            }

            console.log('API Response:', response);

            if (response.status === 204) {
                notification.success({ 
                    message: isEditingProcess ? t('processUpdateSuccess') : t('processAddSuccess'),
                });
                setProcessModalVisible(false);
                await fetchProcesses();
                await fetchFeatures();
                return;
            }

            // Create processWithKey object
            const processWithKey = {
                ...newProcess,
                key: newProcess.id.toString(),
                featureNames: processInstalledFeatures.map(featureId => {
                    const feature = features.find(f => f.id === Number(featureId));
                    return feature?.name;
                }).filter(Boolean)
            };

            if (isEditingProcess) {
                setProcesses(prevProcesses =>
                    prevProcesses.map(process =>
                        process.id === editingProcessId ? processWithKey : process
                    )
                );
            } else {
                setProcesses(prevProcesses => [...prevProcesses, processWithKey]);
                onAddProcess(processWithKey);
            }

            setProcessModalVisible(false);
            onUpdateProcesses([...processes, processWithKey]);
            notification.success({
                message: isEditingProcess ? t('processUpdatedSuccessfully') : t('newProcessAddedSuccessfully'),
            });

        } catch (error) {
            console.error('Error saving process:', error);
            notification.error({ message: error.message || t('processSaveError') });
        }
    };

    const processColumns = [
        {
            title: t('sn'),
            dataIndex: 'key',
            key: 'key',
            sorter: (a, b) => a.key - b.key
        },
        {
            title: t('processName'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            title: t('weightage'),
            dataIndex: 'weightage',
            key: 'weightage',
            sorter: (a, b) => a.weightage - b.weightage
        },
        {
            title: t('status'),
            dataIndex: 'status',
            key: 'status',
            sorter: (a, b) => a.status - b.status,
            render: status => <Switch checked={status} disabled />
        },
        {
            title: t('installedFeatures'),
            dataIndex: 'featureNames',
            key: 'featureNames',
            sorter: (a, b) => (a.featureNames?.join(',') || '').localeCompare(b.featureNames?.join(',') || ''),
            render: features => features?.join(', ') || 'None',
        },
        {
            title: t('processType'),
            dataIndex: 'processType',
            key: 'processType',
            sorter: (a, b) => a.processType.localeCompare(b.processType)
        },
        {
            title: t('actions'),
            key: 'actions',
            render: (text, record) => (
                <Button
                    icon={<EditOutlined />}
                    onClick={() => showAddProcessModal(record)}
                    className={`${customBtn} d-flex align-items-center gap-1`}
                >
                    {t('edit')}
                </Button>
            )
        }
    ];

    const filteredProcesses = processes.filter(process => {
        const searchContent = Object.values(process).join(' ').toLowerCase();
        return searchContent.includes(searchText.toLowerCase());
    });

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    const paginatedData = filteredProcesses.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                                <Button type="primary" onClick={() => showAddProcessModal()} className={`${customDark} text-white `}>
                    {t('addNewProcess')}
                </Button><Input.Search
                    placeholder={t('searchProcesses')}
                    allowClear
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                />

            </div>

            <Table
                columns={processColumns}
                dataSource={paginatedData}
                onChange={handleTableChange}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: filteredProcesses.length,
                    showSizeChanger: true,
                    pageSizeOptions: [5, 10, 15],
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    className: `bg-white p-3 rounded rounded-top-0`
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

            <Modal
                show={processModalVisible}
                onHide={() => setProcessModalVisible(false)}
                className={``}
            >
                <Modal.Header closeButton className={`${customDark}`}>
                    <Modal.Title className={`${customLightText}`}>{isEditingProcess ? t('editProcess') : t('addProcess')}</Modal.Title>
                </Modal.Header>
                <Modal.Body className={`${customLight}`}>
                    <div style={{ marginBottom: '16px' }}>

                        <label htmlFor="processName" className={`${customDarkText}`}><span className="text-danger">*</span>{t('.processNameLabel')}:</label>

                        <Input
                            id="processName"
                            placeholder={t('processName')}
                            value={processName}
                            onChange={e => setProcessName(e.target.value)}
                            style={{ width: '100%' }}
                            className={` ${customDarkText}`}
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>

                        <label htmlFor="processWeightage" className={`${customDarkText}`}><span className="text-danger">*</span>{t('weightageLabel')}:</label>

                        <Input
                            id="processWeightage"
                            placeholder={t('weightage')}
                            type="number"
                            value={processWeightage || ''}
                            onChange={e => setProcessWeightage(e.target.value ? parseFloat(e.target.value) : '')}
                            style={{ width: '100%' }}
                            className={` ${customDarkText}`}
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>

                        <label htmlFor="processType" className={`${customDarkText}`}><span className="text-danger">*</span>{t('processTypeLabel')}:</label>

                        <Select
                            id="processType"
                            placeholder={t('processType')}
                            value={processType}
                            onChange={(value) => {
                                setProcessType(value);
                                if (value === 'Dependent') {
                                    setRangeStart('');
                                    setRangeEnd('');
                                } else {
                                    setRangeStart('');
                                    setRangeEnd('');
                                }
                            }}
                            style={{ width: '100%' }}
                            className={`${customLight} ${customDarkText}`}
                        >
                            <Select.Option value="Independent">{t('independent')}</Select.Option>
                            <Select.Option value="Dependent">{t('dependent')}</Select.Option>
                        </Select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label htmlFor="processStatus" className={`${customDarkText}`}><span className="text-danger">*</span>{t('statusLabel')}:</label>

                        <Switch
                            id="processStatus"
                            checked={processStatus}
                            onChange={setProcessStatus}
                            checkedChildren={t('active')}
                            unCheckedChildren={t('inactive')}
                            style={{ width: '22%' }}
                            className={`ms-3`}
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label htmlFor="processInstalledFeatures" className={`${customDarkText}`}><span className="text-danger">*</span>{t('installedFeaturesLabel')}:</label>

                        <Select
                            id="processInstalledFeatures"
                            mode="multiple"
                            placeholder={t('installedFeatures')}
                            value={processInstalledFeatures}
                            onChange={setProcessInstalledFeatures}
                            style={{ width: '100%' }}
                            className={`${customLight} ${customDarkText}`}
                        >
                            {features.map(feature => (
                                <Select.Option key={feature.key} value={feature.id}>
                                    {feature.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </div>
                    {processType === 'Independent' && (
                        <div>
                            <div style={{ marginBottom: '16px' }}>

                                <label htmlFor="rangeStart" className={`${customDarkText}`}><span className="text-danger">*</span>{t('rangeStartLabel')}:</label>

                                <Select
                                    id="rangeStart"
                                    placeholder={
                                        rangeStart
                                            ? processes.find(process => process.id === parseInt(rangeStart))?.name || t('selectProcess')
                                            : t('selectProcess')
                                    }
                                    value={rangeStart}
                                    onChange={value => setRangeStart(value)}
                                    style={{ width: '100%' }}
                                    className={`${customLight} ${customDarkText}`}
                                >
                                    {processes.map(process => (
                                        <Select.Option key={process.id} value={process.id}>
                                            {process.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>
                            <div style={{ marginBottom: '16px' }}>

                                <label htmlFor="rangeEnd" className={`${customDarkText}`}><span className="text-danger">*</span>{t('rangeEndLabel')}:</label>

                                <Select
                                    id="rangeEnd"
                                    placeholder={
                                        rangeEnd
                                            ? processes.find(process => process.id === parseInt(rangeEnd))?.name || t('selectProcess')
                                            : t('selectProcess')
                                    }
                                    value={rangeEnd}
                                    onChange={value => setRangeEnd(value)}
                                    style={{ width: '100%' }}
                                    className={`${customLight} ${customDarkText}`}
                                >
                                    {processes.map(process => (
                                        <Select.Option key={process.id} value={process.id}>
                                            {process.name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    )}

                </Modal.Body>
                <Modal.Footer className={`${customDark}`}>
                    <Button variant="secondary" onClick={() => setProcessModalVisible(false)} className={`${customBtn}`}>
                        {t('cancel')}
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleAddProcess} 
                        disabled={isEditingProcess && !hasChanges}
                        className={`${customBtn}`}
                    >
                        {t('save')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default ProcessManagement;
