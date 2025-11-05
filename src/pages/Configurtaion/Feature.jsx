import React, { useState, useEffect } from 'react';
import { Table, Button, Input, notification } from 'antd';
import { AppstoreAddOutlined, EditOutlined } from '@ant-design/icons';
import API from '../../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import themeStore from '../../store/themeStore';
import { FaSearch } from 'react-icons/fa';
import { Modal } from 'react-bootstrap';
import { AiFillCloseSquare } from 'react-icons/ai';
import { success } from '../../CustomHooks/Services/AlertMessageService';

const FeatureManagement = ({ onUpdateFeatures, onAddFeature = () => {} }) => {
    const { t } = useTranslation();
    const { getCssClasses } = useStore(themeStore);
    const cssClasses = getCssClasses();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;
    const [featureModalVisible, setFeatureModalVisible] = useState(false);
    const [features, setFeatures] = useState([]);
    const [isEditingFeature, setIsEditingFeature] = useState(false);
    const [editingFeatureId, setEditingFeatureId] = useState(null);
    const [featureName, setFeatureName] = useState('');
    const [isFeatureNameChanged, setIsFeatureNameChanged] = useState(false);

    const [pageSize, setPageSize] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    const [searchText, setSearchText] = useState('');

    // Fetch features
    const fetchFeatures = async () => {
        try {
            const response = await API.get('/Features');
            setFeatures(response.data.map(feature => ({ key: feature.featureId, name: feature.features })));
        } catch (error) {
            console.error('Error fetching features:', error);
            error(t('failedToFetchFeaturesPleaseTryAgain'));
        }
    };

    useEffect(() => {
        fetchFeatures();
    }, []);

    // Validation checks
    const validateFeature = (name) => {
        // Check for duplicate feature names
        if (features.some(feature => feature.name.toLowerCase() === name.toLowerCase())) {
            error(t('featureNameAlreadyExists'));
            return false;
        }

        // Check if name is alphanumeric (must not be a combination of letters and numbers)
        const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(name);
        const isOnlyLetters = /^[a-zA-Z]+$/.test(name);
        const isOnlyNumbers = /^[0-9]+$/.test(name);

        if (isAlphanumeric && !(isOnlyLetters || isOnlyNumbers)) {
            error(t('featureNameCannotContainBothLettersAndNumbers'));
            return false;
        }

        return true;
    };

    // Open modal for adding/editing feature
    const showAddFeatureModal = (feature = null) => {
        if (feature) {
            setFeatureName(feature.name);
            setIsEditingFeature(true);
            setEditingFeatureId(feature.key);
            setIsFeatureNameChanged(false);
        } else {
            setFeatureName('');
            setIsEditingFeature(false);
            setEditingFeatureId(null);
        }
        setFeatureModalVisible(true);
    };

    // Update the feature name and track changes
    const handleFeatureNameChange = (e) => {
        setFeatureName(e.target.value);
        setIsFeatureNameChanged(e.target.value !== (isEditingFeature ? features.find(f => f.key === editingFeatureId)?.name : ''));
    };

    // Handle adding/updating feature
    const handleAddFeature = async () => {
        if (!featureName) {
            error(t('featureNameCannotBeEmpty'));
            return;
        }

        if (!validateFeature(featureName)) {
            return;
        }

        const featurePayload = {
            featureId: editingFeatureId || 0,
            features: featureName,
        };

        try {
            console.log('Feature Payload:', featurePayload);

            if (isEditingFeature) {
                // Update existing feature
                await API.put(`/Features/${editingFeatureId}`, featurePayload);
                success(t('featureUpdatedSuccessfully'));
            } else {
                // Add new feature
                const response = await API.post('/Features', featurePayload);
                const addedFeature = response.data;
                onAddFeature({ key: addedFeature.featureId, name: addedFeature.features });
                success(t('featureAddedSuccessfully'));
            }
            
            setFeatureModalVisible(false);
            await fetchFeatures(); // Refresh data after successful operation
            
        } catch (error) {
            console.error('Error handling feature:', error);

            error(isEditingFeature ? t('failedToUpdateFeature') : t('failedToAddFeature'));

        }
    };

    // Handle key down event in the Input
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleAddFeature();
        }
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchText(value);
        setCurrentPage(1); // Reset to first page when searching
    };

    // Filter features based on search text
    const filteredFeatures = features.filter(feature =>
        feature.name.toLowerCase().includes(searchText.toLowerCase()) ||
        feature.key.toString().includes(searchText)
    );

    // Handle pagination change
    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    // Columns for Feature table
    const featureColumns = [
        { 
            title: t('sn'), 
            dataIndex: 'key', 
            key: 'key',
            width: '8%',
            align: 'center',
            sorter: (a, b) => a.key - b.key
        },
        { 
            title: t('featureName'), 
            dataIndex: 'name', 
            key: 'name',
            width: '65%',
            sorter: (a, b) => a.name.localeCompare(b.name)
        },
        {
            title: t('actions'),

            key: 'actions',
            width: '10%',
            align: 'center',
            render: (text, record) => (
                <Button 
                    icon={<EditOutlined />} 
                    onClick={() => showAddFeatureModal(record)}
                    type="primary"
                    size="large"
                    className={`${customBtn} d-flex align-items-center gap-1`}
                >
                    {t('edit')}
                </Button>

            ),
        },
    ];

    return (
        <div className="feature-management-container">
           
            <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '20px' }}>
                <Button 
                    type="primary" 
                    className={`${customBtn}`}
                    onClick={() => showAddFeatureModal()}
                >
                    {t('addNewFeature')}
                </Button>
                <div className="d-flex align-items-center" style={{ width: '300px' }}>
                    <Input
                        placeholder={t('searchFeatures')}
                        value={searchText}
                        onChange={(e) => handleSearch(e.target.value)}
                        allowClear
                        className={`rounded-2 ${customDark === "dark-dark" ? `${customLightBorder} text-dark` : customDarkText} ${customDarkBorder} rounded-end-0`}
                    />
                    <Button
                        className={`rounded-2 ${customBtn} ${customDark === "dark-dark" ? 'border-white' : 'border-0'} rounded-start-0`}
                        style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <FaSearch size={20}/>
                    </Button>
                </div>
            </div>
            <Table
                dataSource={filteredFeatures}
                columns={featureColumns}
                rowKey="key"
                pagination={{ 
                    className:`${customDark === 'dark-dark' || customDark === 'blue-dark' ? "bg-white" : ""} p-3 rounded-bottom`,
                    total: filteredFeatures.length,
                    pageSize: pageSize,
                    current: currentPage,
                    showSizeChanger: true,
                    pageSizeOptions: ['5', '10', '15'],
                    onChange: (page, pageSize) => {
                        setCurrentPage(page);
                        setPageSize(pageSize);
                    },
                    onShowSizeChange: (current, size) => {
                        setCurrentPage(1);
                        setPageSize(size);

                    },
                }}
                onChange={handleTableChange}
                bordered
                size="small"
                scroll={{ x: 'max-content' }}
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

            {/* Feature Modal */}
            <Modal
                show={featureModalVisible}
                onHide={() => setFeatureModalVisible(false)}
                centered
                size="small"
                className={`rounded-2 ${customDark === "" ? `${customDark}` : ''}`}
            >
                <Modal.Header closeButton={false} className={`rounded-top-2 ${customDark} ${customLightText} ${customDark === "dark-dark" ? `border ` : `border-0`} border d-flex justify-content-between`}>
                    <Modal.Title>{isEditingFeature ? t('editFeature') : t('addFeature')}</Modal.Title>
                    <AiFillCloseSquare
                        size={35}
                        onClick={() => setFeatureModalVisible(false)}
                        className={`rounded-2 ${customDark === "dark-dark" ? "text-dark bg-white " : `${customDark} custom-zoom-btn text-white  ${customDarkBorder}`}`}
                        aria-label="Close"
                    />
                </Modal.Header>
                <Modal.Body className={`${customDarkText} ${customLight}`}>
                    <Input
                        placeholder={t('enterFeatureName')}
                        value={featureName}
                        onChange={handleFeatureNameChange}
                        onKeyDown={handleKeyDown}
                    />
                </Modal.Body>
                <Modal.Footer className={`rounded-bottom-2 ${customDark} ${customLightText} ${customDark === "dark-dark" ? `border ` : `border-0`} border`}>
                    <Button className={`${customBtn}`} onClick={handleAddFeature} disabled={!isFeatureNameChanged}>
                        {isEditingFeature ? t('update') : t('add')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default FeatureManagement;
