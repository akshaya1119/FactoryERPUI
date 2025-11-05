import React, { useEffect, useState } from 'react';
import { Input, Button, Select, Table, Form, Pagination, Divider, Checkbox } from 'antd';
import { Modal } from 'react-bootstrap';
import API from '../CustomHooks/MasterApiHooks/api';
import { useMediaQuery } from 'react-responsive';
import { AiFillCloseSquare } from "react-icons/ai";
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { SortAscendingOutlined, SortDescendingOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { success, error } from '../CustomHooks/Services/AlertMessageService';

const { Option } = Select;
const { Search } = Input;

const Zone = () => {
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

  const [zones, setZones] = useState([]);
  const [camera, setCamera] = useState([]);
  const [machine, setMachine] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingZone, setEditingZone] = useState({});
  const [originalZone, setOriginalZone] = useState({});
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [tempEditingZone, setTempEditingZone] = useState({});

  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([getCamera(), getMachine()]);
      await getZone();
    };

    fetchData();
  }, []);

  const getZone = async () => {
    try {
      const response = await API.get('/Zones');
      setZones(response.data);
    } catch (err) {
      error(t("Failed to fetch zones"));
    }
  };

  const getCamera = async () => {
    try {
      const response = await API.get('/Cameras');
      setCamera(response.data);
    } catch (err) {
      error(t("Failed to fetch cameras"));
    }
  };

  const getMachine = async () => {
    try {
      const response = await API.get('/Machines');
      setMachine(response.data);
    } catch (err) {
      error(t("Failed to fetch machines"));
    }
  };

  const handleAddZone = async (values) => {
    const { zoneNo, cameraIds, machineId } = values;
    const existingZone = zones.find(zone => zone.zoneNo === zoneNo);
    if (existingZone) {
      error(t('Zone Name already exists!'));
      return;
    }

    const assignedCameras = zones.flatMap(zone => zone.cameraIds || []);
    const alreadyAssignedCameras = cameraIds.filter(id => assignedCameras.includes(id));
    if (alreadyAssignedCameras.length > 0) {
      const cameraNames = alreadyAssignedCameras.map(id => camera.find(c => c.cameraId === id)?.name).join(', ');
      error(t('The following cameras are already assigned to other zones: {{cameraNames}}', { cameraNames }));
      return;
    }

    if (machineId && machineId.length > 0) {
      const assignedMachines = zones.flatMap(zone => zone.machineId || []);
      const alreadyAssignedMachines = machineId.filter(id => assignedMachines.includes(id));
      if (alreadyAssignedMachines.length > 0) {
        const machineNames = alreadyAssignedMachines.map(id => machine.find(m => m.machineId === id)?.machineName).join(', ');
        error(t('The following machines are already assigned to other zones: {{machineNames}}', { machineNames }));
        return;
      }
    }

    const newZone = {
      zoneNo,
      zoneDescription: values.zoneDescription || '',
      cameraIds: Array.isArray(cameraIds) ? cameraIds : [cameraIds],
      machineId: machineId ? (Array.isArray(machineId) ? machineId : [machineId]) : [],
    };

    try {
      await API.post('/Zones', newZone);
      getZone();
      form.resetFields();
      setIsModalVisible(false);
      success(t('Zone added successfully!'));
    } catch (err) {
      error(t('Failed to add zone. Please try again.'));
    }
  };

  const handleEditZone = async (index) => {
    if (!tempEditingZone.zoneNo || !tempEditingZone.cameraIds || tempEditingZone.cameraIds.length === 0) {
      error(t('pleaseFillInAllRequiredFields'));
      return;
    }

    const updatedZone = {
      ...originalZone,
      ...tempEditingZone,
      cameraIds: tempEditingZone.cameraIds || originalZone.cameraIds,
      machineId: tempEditingZone.machineId || [],
    };

    const existingZone = zones.find(zone => zone.zoneNo === updatedZone.zoneNo && zone.zoneNo !== originalZone.zoneNo);
    if (existingZone) {
      error(t('Zone Name already exists'));
      return;
    }

    const assignedCameras = zones.flatMap(zone => zone.zoneId !== updatedZone.zoneId ? zone.cameraIds : []);
    const alreadyAssignedCameras = updatedZone.cameraIds.filter(id => assignedCameras.includes(id));
    if (alreadyAssignedCameras.length > 0) {
      const cameraNames = alreadyAssignedCameras.map(id => camera.find(c => c.cameraId === id)?.name).join(', ');
      error(t('The following cameras are already assigned to other zones: {{cameraNames}}', { cameraNames }));
      return;
    }

    if (updatedZone.machineId && updatedZone.machineId.length > 0) {
      const assignedMachines = zones.flatMap(zone => zone.zoneId !== updatedZone.zoneId ? zone.machineId : []);
      const alreadyAssignedMachines = updatedZone.machineId.filter(id => assignedMachines.includes(id));
      if (alreadyAssignedMachines.length > 0) {
        const machineNames = alreadyAssignedMachines.map(id => machine.find(m => m.machineId === id)?.machineName).join(', ');
        error(t('The following machines are already assigned to other zones:', { machineNames }));
        return;
      }
    }

    try {
      await API.put(`/Zones/${originalZone.zoneId}`, updatedZone);
      const updatedZones = [...zones];
      updatedZones[index] = updatedZone;
      setZones(updatedZones);
      getZone();
      success(t('Zone updated successfully!'));
    } catch (err) {
      error(t('Failed to update zone. Please try again.'));
    } finally {
      setEditingIndex(null);
      setEditingZone({});
      setTempEditingZone({});
      setOriginalZone({});
      setEditModalVisible(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingZone({});
    setTempEditingZone({});
    setOriginalZone({});
    setEditModalVisible(false);
  };

  const hasChanges = () => {
    return JSON.stringify(tempEditingZone) !== JSON.stringify(editingZone);
  };

  const columns = [
    {
      title: t('SN.'),
      key: 'serial',
      render: (text, record, index) => index + 1,
      sorter: (a, b) => a.key - b.key,
    },
    {
      title: t('Zone Name'),
      dataIndex: 'zoneNo',
      key: 'zoneNo',
      sorter: (a, b) => a.zoneNo.localeCompare(b.zoneNo),
    },
    showDescription && {
      title: t('Zone Description'),
      dataIndex: 'zoneDescription',
      key: 'zoneDescription',
      sorter: (a, b) => a.zoneDescription.localeCompare(b.zoneDescription),
    },
    {
      title: t('Assign Camera Names'),
      dataIndex: 'cameraNames',
      key: 'cameraNames',
      render: (cameraNames) => cameraNames.join(', '),
    },
    {
      title: t('Assign Machine Names'),
      dataIndex: 'machineNames',
      key: 'machineNames',
      render: (machineNames) => machineNames.join(', '),
    },
    {
      title: t('actions'),
      key: 'action',
      render: (_, record, index) => (
        <Button 
          type="link" 
          icon={<EditOutlined />} 
          onClick={() => {
            const initialZone = { 
              zoneNo: record.zoneNo, 
              zoneDescription: record.zoneDescription,
              cameraIds: record.cameraIds,
              machineId: record.machineId
            };
            setEditingIndex(index);
            setEditingZone(initialZone);
            setTempEditingZone(initialZone);
            setOriginalZone(record);
            setEditModalVisible(true);
          }} 
          className={`${customBtn} d-flex align-items-center gap-1`}
        >
          {t('edit')}
        </Button>
      ),
    },
  ].filter(Boolean);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const responsiveColumns = isMobile ? columns.slice(0, 2) : isTablet ? columns.slice(0, 4) : columns;

  const filteredZones = zones.filter(zone => 
    zone.zoneNo.toLowerCase().includes(searchText.toLowerCase()) ||
    zone.zoneDescription.toLowerCase().includes(searchText.toLowerCase())
  );

  const paginatedZones = filteredZones.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', maxWidth: '100%', overflowX: 'auto' }} className={`${customDark === "dark-dark" ? `${customDark}` : ""}`}>
      <Divider className={`fs-3 mt-0 ${customDarkText}`}>
        {t('Zone Management')}
      </Divider>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Button onClick={showModal} className={`${customBtn}`}>
          {t('Add Zone')}
        </Button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Checkbox 
            checked={showDescription}
            onChange={(e) => setShowDescription(e.target.checked)}
            className={customDarkText}
          >
            {t('Show Description')}
          </Checkbox>
          
          <Search
            placeholder={t("Search zones")}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
        </div>
      </div>

      <Table
        dataSource={paginatedZones.map((zone, index) => ({ ...zone, key: index }))}
        columns={responsiveColumns}
        pagination={false}
        bordered
        style={{ marginTop: '20px', background: 'white' }}
        scroll={{ x: 'max-content' }}
        className={`${customDark === "default-dark" ? "thead-default" : ""}
                    ${customDark === "red-dark" ? "thead-red" : ""}
                    ${customDark === "green-dark" ? "thead-green" : ""}
                    ${customDark === "blue-dark" ? "thead-blue" : ""}
                    ${customDark === "dark-dark" ? "thead-dark" : ""}
                    ${customDark === "pink-dark" ? "thead-pink" : ""}
                    ${customDark === "purple-dark" ? "thead-purple" : ""}
                    ${customDark === "light-dark" ? "thead-light" : ""}
                    ${customDark === "brown-dark" ? "thead-brown" : ""} rounded-2`}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', background: 'white', padding: '10px' }} className='rounded-2 rounded-top-0'>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={filteredZones.length}
          onChange={(page, pageSize) => {
            setCurrentPage(page);
            setPageSize(pageSize);
          }}
          showSizeChanger
          showQuickJumper
          showTotal={(total, range) => t('{{start}}-{{end}} of {{total}} items', { start: range[0], end: range[1], total })}
        />
      </div>

      {/* Add Zone Modal */}
      <Modal
        show={isModalVisible}
        onHide={handleCancel}
        centered
        size={isMobile ? "sm" : "lg"}
        backdrop="static"
        keyboard={false}
        className={`rounded-2 ${customDark === "" ? `${customDark}` : ''}  `}
      >
        <Modal.Header closeButton={false} className={`rounded-top-2 ${customDark} ${customLightText} ${customDark === "dark-dark" ? `border ` : `border-0`} border d-flex justify-content-between `}>
          <Modal.Title>{t('Add Zone')}</Modal.Title>
          <AiFillCloseSquare
            size={35}
            onClick={handleCancel}
            className={`rounded-2 ${customDark === "dark-dark" ? "text-dark bg-white " : `${customDark} custom-zoom-btn text-white  ${customDarkBorder}`}`}
            aria-label="Close"
            style={{ cursor: 'pointer', fontSize: '1.5rem' }}
          />
        </Modal.Header>
        <Modal.Body className={`rounded-bottom-2 ${customMid} ${customDark === "dark-dark" ? `border border-top-0` : `border-0`}`}>
          <Form form={form} onFinish={handleAddZone} layout="vertical">
            <Form.Item 
              name="zoneNo" 
              label={<span className={customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`}>{t('Zone Name')} <span className="text-danger">*</span></span>}
            >
              <Input placeholder={t("Zone Name")} required />
            </Form.Item>
            <Form.Item 
              name="zoneDescription"
              label={<span className={customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`}>{t('Zone Description')}</span>}
            >
              <Input.TextArea placeholder={t("Zone Description")} />
            </Form.Item>
            <Form.Item 
              name="cameraIds"
              label={<span className={customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`}>{t('Assign Camera')} <span className="text-danger">*</span></span>}
            >
              <Select mode="multiple" placeholder={t("Select Camera")} required>
                {camera.map(c => (
                  <Option key={c.cameraId} value={c.cameraId} disabled={zones.some(zone => zone.cameraIds.includes(c.cameraId))}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              name="machineId" 
              label={<span className={customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`}>{t('Assign Machine')}</span>}
            >
              <Select mode="multiple" placeholder={t("Select Machine")}>
                {machine.map(m => (
                  <Option 
                    key={m.machineId} 
                    value={m.machineId}
                    disabled={zones.some(zone => zone.machineId.includes(m.machineId))}
                  >
                    {m.machineName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item className="d-flex justify-content-end gap-2">
              <Button onClick={handleCancel} className={customDark === "dark-dark" ? `${customLightBorder} text-white` : ''}>
                {t('Cancel')}
              </Button>
              <Button htmlType="submit" className={`${customBtn}`}>
                {t('Add Zone')} 
              </Button>
            </Form.Item>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Zone Modal */}
      <Modal
        show={editModalVisible}
        onHide={handleCancelEdit}
        centered
        size={isMobile ? "sm" : "lg"}
        backdrop="static"
        keyboard={false}
        className={`rounded-2 ${customDark === "" ? `${customDark}` : ''}  `}
      >
        <Modal.Header closeButton={false} className={`rounded-top-2 ${customDark} ${customLightText} ${customDark === "dark-dark" ? `border ` : `border-0`} border d-flex justify-content-between `}>
          <Modal.Title>{t('Edit Zone')}</Modal.Title>
          <AiFillCloseSquare
            size={35}
            onClick={handleCancelEdit}
            className={`rounded-2 ${customDark === "dark-dark" ? "text-dark bg-white " : `${customDark} custom-zoom-btn text-white  ${customDarkBorder}`}`}
            aria-label="Close"
            style={{ cursor: 'pointer', fontSize: '1.5rem' }}
          />
        </Modal.Header>
        <Modal.Body className={`rounded-bottom-2 ${customMid} ${customDark === "dark-dark" ? `border border-top-0` : `border-0`}`}>
          <Form layout="vertical">
            <Form.Item 
              label={<span className={customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`}>{t('Zone Name')} <span className="text-danger">*</span></span>}
            >
              <Input
                value={tempEditingZone.zoneNo}
                onChange={(e) => setTempEditingZone({ ...tempEditingZone, zoneNo: e.target.value })}
                required
              />
            </Form.Item>
            <Form.Item 
              label={<span className={customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`}>{t('Zone Description')}</span>}
            >
              <Input.TextArea
                value={tempEditingZone.zoneDescription}
                onChange={(e) => setTempEditingZone({ ...tempEditingZone, zoneDescription: e.target.value })}
              />
            </Form.Item>
            <Form.Item 
              label={<span className={customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`}>{t('Assign Camera')} <span className="text-danger">*</span></span>}
            >
              <Select
                mode="multiple"
                value={tempEditingZone.cameraIds}
                onChange={(value) => setTempEditingZone({ ...tempEditingZone, cameraIds: value })}
                required
              >
                {camera.map(c => (
                  <Option 
                    key={c.cameraId} 
                    value={c.cameraId}
                    disabled={zones.some(zone => zone.zoneId !== originalZone.zoneId && zone.cameraIds.includes(c.cameraId))}
                  >
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              label={<span className={customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`}>{t('Assign Machine')}</span>}
            >
              <Select
                mode="multiple"
                value={tempEditingZone.machineId}
                onChange={(value) => setTempEditingZone({ ...tempEditingZone, machineId: value })}
              >
                {machine.map(m => (
                  <Option 
                    key={m.machineId} 
                    value={m.machineId}
                    disabled={zones.some(zone => zone.zoneId !== originalZone.zoneId && zone.machineId.includes(m.machineId))}
                  >
                    {m.machineName}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div className="d-flex justify-content-end gap-2">
              <Button onClick={handleCancelEdit} className={customDark === "dark-dark" ? `${customLightBorder} text-white` : ''}>
                {t('Cancel')}
              </Button>
              <Button 
                onClick={() => handleEditZone(editingIndex)} 
                className={`${customBtn}`}
                disabled={!hasChanges()}
              >
                {t('Save')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Zone;
