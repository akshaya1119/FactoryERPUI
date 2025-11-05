import React, { useState, useEffect } from 'react';
import { Tabs, Table, Button, Modal, Input, Select, notification, Switch } from 'antd';
import { AppstoreAddOutlined, BuildOutlined, EditOutlined } from '@ant-design/icons';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';



const ItemType = 'FEATURE';

// DraggableRow component remains unchanged
const DraggableRow = ({ index, moveRow, className, style, ...restProps }) => {
  const ref = React.useRef();
  const [, drop] = useDrop({
    accept: ItemType,
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <tr ref={ref} style={{ ...style, opacity: isDragging ? 0.5 : 1 }} {...restProps} />
  );
};

const SystemSettings = () => {
  const [featureModalVisible, setFeatureModalVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [features, setFeatures] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [isEditingFeature, setIsEditingFeature] = useState(false);
  const [isEditingProcess, setIsEditingProcess] = useState(false);
  const [editingFeatureId, setEditingFeatureId] = useState(null);
  const [editingProcessId, setEditingProcessId] = useState(null);
  const [featureName, setFeatureName] = useState('');
  const [processName, setProcessName] = useState('');
  const [processStatus, setProcessStatus] = useState(true);
  const [processWeightage, setProcessWeightage] = useState('');
  const [processInstalledFeatures, setProcessInstalledFeatures] = useState([]);
  const { t } = useTranslation();
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await API.get('/Features');
        setFeatures(response.data.map(feature => ({
          key: feature.featureId,
          name: feature.features,
        })));
      } catch (error) {
        console.error('Error fetching features:', error);
        notification.error({ message: 'Failed to fetch features' });
      }
    };

    const fetchProcesses = async () => {
      try {
        const response = await API.get('/Processes');
        setProcesses(response.data.map(process => ({
          key: process.id.toString(),
          id: process.id,
          name: process.name,
          status: process.status,
          weightage: process.weightage,
          installedFeatures: process.installedFeatures,
        })));
      } catch (error) {
        console.error('Error fetching processes:', error);
        notification.error({ message: t('failedToFetchProcesses') });
      }
    };

    fetchFeatures();
    fetchProcesses();
  }, []);

  const moveFeatureRow = (dragIndex, hoverIndex) => {
    const updatedFeatures = [...features];
    const draggedRow = updatedFeatures.splice(dragIndex, 1)[0];
    updatedFeatures.splice(hoverIndex, 0, draggedRow);
    setFeatures(updatedFeatures);
  };

  const components = {
    body: {
      row: DraggableRow,
    },
  };

  const showAddFeatureModal = (feature = null) => {
    if (feature) {
      setFeatureName(feature.name);
      setIsEditingFeature(true);
      setEditingFeatureId(feature.key);
    } else {
      setFeatureName('');
      setIsEditingFeature(false);
      setEditingFeatureId(null);
    }
    setFeatureModalVisible(true);
  };

  const showAddProcessModal = (process = null) => {
    if (process) {
      setProcessName(process.name);
      setProcessStatus(process.status);
      setProcessWeightage(process.weightage?.toString());
      setProcessInstalledFeatures(process.installedFeatures.map(featureId => {
        const feature = features.find(f => f.key === featureId);
        return feature ? feature.name : null;
      }).filter(Boolean));
      setIsEditingProcess(true);
      setEditingProcessId(process.id);
    } else {
      setProcessName('');
      setProcessStatus(true);
      setProcessWeightage('');
      setProcessInstalledFeatures([]);
      setIsEditingProcess(false);
      setEditingProcessId(null);
    }
    setProcessModalVisible(true);
  };

  const handleAddFeature = async () => {
    if (!featureName) {
      notification.error({ message: 'Feature name cannot be empty!' });
      return;
    }

    const featurePayload = {
      featureId: editingFeatureId || 0,
      features: featureName,
      status: false,
    };

    if (isEditingFeature) {
      try {
        const response = await API.put(`/Features/${editingFeatureId}`, featurePayload, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain',
          },
        });

        if (response.status === 200) {
          setFeatures(prevFeatures =>
            prevFeatures.map(feature =>
              feature.key === editingFeatureId ? { ...feature, name: featureName } : feature
            )
          );
          notification.success({ message: t('featureUpdatedSuccessfully') });
        } else {
          notification.error({ message: t('failedToUpdateFeature') });
        }
      } catch (error) {
        console.error('Error updating feature:', error);
        notification.error({ message: t('anErrorOccurredWhileUpdatingTheFeature') });
      }
    } else {
      try {
        const response = await API.post('/Features', featurePayload, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain',
          },
        });

        if (response.status === 200) {
          const addedFeature = response.data;
          setFeatures([...features, { key: addedFeature.featureId, name: addedFeature.features }]);
          notification.success({ message: t('featureAddedSuccessfully') });
        } else {
          notification.error({ message: t('failedToAddFeature') });
        }
      } catch (error) {
        console.error('Error adding feature:', error);
        notification.error({ message:  t('anErrorOccurredWhileAddingTheFeature') });
      }
    }

    setFeatureModalVisible(false);
  };

  const featureConfigurationColumns = [
    { title: 'Feature Name', dataIndex: 'name', key: 'name' },
    ...processes.map((process) => ({
      title: process.name,
      dataIndex: process.name,
      key: process.name,
      render: (text, record) => (
        <Switch
          checked={featureConfigurationColumns.process}
          
        />
      ),
    })),
  ];

  const handleAddProcess = async () => {
    if (!processName) {
      notification.error({ message: 'Process name cannot be empty!' });
      return;
    }

    const newProcess = {
      id: editingProcessId || 0,
      name: processName,
      weightage: parseFloat(processWeightage),
      status: processStatus,
      installedFeatures: processInstalledFeatures.map(name => {
        const feature = features.find(f => f.name === name);
        return feature ? feature.key : null;
      }).filter(Boolean),
    };

    if (isEditingProcess) {
      try {
        const response = await API.put(`/Processes/${editingProcessId}`, newProcess, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain',
          },
        });

        if (response.status === 200) {
          setProcesses(prevProcesses =>
            prevProcesses.map(process =>
              process.id === editingProcessId ? { ...process, ...newProcess } : process
            )
          );
          notification.success({ message: t('processUpdatedSuccessfully') });
        } else {
          notification.error({ message: t('failedToUpdateProcess') });
        }
      } catch (error) {
        console.error('Error updating process:', error);
        notification.error({ message: t('anErrorOccurredWhileUpdatingTheProcess') });
      }
    } else {
      try {
        const response = await API.post('/Processes', newProcess, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/plain',
          },
        });

        if (response.status === 200) {
          const addedProcess = response.data;
          setProcesses([...processes, { key: addedProcess.id.toString(), ...newProcess }]);
          notification.success({ message: t('processAddedSuccessfully') });
        } else {
          notification.error({ message: t('failedToAddProcess') });
        }
      } catch (error) {
        console.error('Error adding process:', error);
        notification.error({ message: t('anErrorOccurredWhileAddingTheProcess') });
      }
    }

    setProcessModalVisible(false);
  };

  const featureColumns = [
    { title: 'ID', dataIndex: 'key', key: 'key' },
    { title: 'Feature Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Action',
      key: 'action',
      render: (_, feature) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => showAddFeatureModal(feature)}
        />
      ),
    },
  ];

  const processColumns = [
    { title: 'ID', dataIndex: 'key', key: 'key' },
    { title: 'Process Name', dataIndex: 'name', key: 'name' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => (status ? 'Active' : 'Inactive') },
    {
      title: 'Action',
      key: 'action',
      render: (_, process) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => showAddProcessModal(process)}
        />
      ),
    },
  ];

  const items = [
    {
      key: "1",
      label: (
        <span>
          <AppstoreAddOutlined style={{ fontSize: '25px', marginRight: '8px' }} /> Feature
        </span>
      ),
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Feature List</h3>
            <Button type="primary" onClick={() => showAddFeatureModal()}>Add New Feature</Button>
          </div>
          <Table
            dataSource={features}
            columns={featureColumns}
            components={components}
            onRow={(record, index) => ({
              index,
              moveRow: moveFeatureRow,
            })}
            rowKey="key"
          />
        </div>
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <BuildOutlined style={{ fontSize: '25px', marginRight: '8px' }} /> Processes
        </span>
      ),
      children: (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Process List</h3>
            <Button type="primary" onClick={() => showAddProcessModal()}>Add New Process</Button>
          </div>
          <Table dataSource={processes} columns={processColumns} />
        </div>
      ),
    },
    {
      key: "3",
      label: <span>Feature Configuration</span>,
      children: (
        <Table
          dataSource={features.map(feature => ({
            key: feature.key,
            name: feature.name,
            installedFeatures: feature.installedFeatures || [],
          }))}
          columns={featureConfigurationColumns} // Add your configuration columns here
        />
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <DndProvider backend={HTML5Backend}>
        <Tabs defaultActiveKey="1" items={items} />
        
        <Modal
          title={isEditingFeature ? 'Edit Feature' : 'Add Feature'}
          open={featureModalVisible}
          onOk={handleAddFeature}
          onCancel={() => setFeatureModalVisible(false)}
        >
          <Input
            placeholder="Feature Name"
            value={featureName}
            onChange={e => setFeatureName(e.target.value)}
          />
        </Modal>

        <Modal
          title={isEditingProcess ? 'Edit Process' : 'Add Process'}
          open={processModalVisible}
          onOk={handleAddProcess}
          onCancel={() => setProcessModalVisible(false)}
        >
          <Input
            placeholder="Process Name"
            value={processName}
            onChange={e => setProcessName(e.target.value)}
          />
          <Select
            placeholder="Select Status"
            value={processStatus}
            onChange={setProcessStatus}
            style={{ width: '100%', marginTop: '10px' }}
          >
            <Select.Option value={true}>Active</Select.Option>
            <Select.Option value={false}>Inactive</Select.Option>
          </Select>
          <Input
            placeholder="Weightage"
            value={processWeightage}
            onChange={e => setProcessWeightage(e.target.value)}
            style={{ marginTop: '10px' }}
          />
          <Select
            mode="multiple"
            placeholder="Select Installed Features"
            value={processInstalledFeatures}
            onChange={setProcessInstalledFeatures}
            style={{ width: '100%', marginTop: '10px' }}
          >
            {features.map(feature => (
              <Select.Option key={feature.key} value={feature.name}>
                {feature.name}
              </Select.Option>
            ))}
          </Select>
        </Modal>
      </DndProvider>
    </div>
  );
};

export default SystemSettings;

