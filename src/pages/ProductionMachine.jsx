import React, { useEffect, useState } from 'react';
import { Table, Input, Select, Switch, Spin, Pagination } from 'antd';
import { Row, Col, Modal, Button } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid'; // Importing uuid for unique IDs
import API from '../CustomHooks/MasterApiHooks/api';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { FaSearch } from "react-icons/fa";
import { AiFillCloseSquare } from "react-icons/ai";
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { success, error } from '../CustomHooks/Services/AlertMessageService';

const { Search } = Input;

const Machine = () => {
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

  const [machines, setMachines] = useState([]);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineProcessId, setNewMachineProcessId] = useState(null);
  const [newMachineStatus, setNewMachineStatus] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingProcessId, setEditingProcessId] = useState(null);
  const [editingStatus, setEditingStatus] = useState(true);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchMachines = async () => {
    setLoading(true);
    try {
      const response = await API.get('/Machines');
      setMachines(response.data);
    } catch (err) {
      error(t('Failed to fetch machines'));
    } finally {
      setLoading(false);
    }
  };

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const response = await API.get('/Processes');
      setProcesses(response.data);
    } catch (err) {
      error(t('Failed to fetch processes'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
    fetchProcesses();
  }, []);

  const handleAddMachine = async () => {
    if (!newMachineName || !newMachineProcessId) {
      error(t('Please fill in all fields!'));
      return;
    }

    const newMachine = {
      machineName: newMachineName,
      status: newMachineStatus,
      processId: newMachineProcessId
    };

    try {
      const response = await API.post('/Machines', newMachine);
      await fetchMachines(); // Fetch updated machines list
      setNewMachineName('');
      setNewMachineProcessId(null);
      setNewMachineStatus(true);
      setIsModalVisible(false);
      success(t('Machine added successfully!'));
    } catch (err) {
      error(t('Failed to add machine'));
    }
  };

  const handleEditSave = async (index) => {
    if (!editingValue || !editingProcessId) {
      error(t('Please fill in all fields!'));
      return;
    }

    const updatedMachine = {
      ...machines[index],
      machineName: editingValue,
      processId: editingProcessId,
      status: editingStatus,
    };

    try {
      await API.put(`/Machines/${updatedMachine.machineId}`, updatedMachine);
      await fetchMachines(); // Fetch updated machines list
      success(t('Machine updated successfully!'));
      setEditingIndex(null);
      setEditingValue('');
      setEditingProcessId(null);
      setEditingStatus(true);
    } catch (err) {
      error(t('Failed to update machine'));
    }
  };

  const columns = [
    {
      title: t('SN.'),
      dataIndex: 'serial',
      key: 'serial',
      render: (_, __, index) => (currentPage - 1) * pageSize + index + 1,
      width: '10%',
    },
    {
      title: t('Machine Name'),
      dataIndex: 'machineName',
      key: 'machineName',
      sorter: (a, b) => a.machineName.localeCompare(b.machineName),
      render: (text, record, index) => (
        editingIndex === index ? (
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onPressEnter={() => handleEditSave(index)}
          />
        ) : (
          <span>{text}</span>
        )
      ),
      width: '30%',
    },
    {
      title: t('Process'),
      dataIndex: 'processId',
      key: 'processId',
      sorter: (a, b) => a.processName.localeCompare(b.processName),
      render: (text, record, index) => (
        editingIndex === index ? (
          <Select
            value={editingProcessId}
            onChange={setEditingProcessId}
            style={{ width: '100%' }}
          >
            {processes.map(process => (
              <Select.Option key={process.id} value={process.id}>
                {process.name}
              </Select.Option>
            ))}
          </Select>
        ) : (
          <span>{record.processName}</span>
        )
      ),
      width: '30%',
    },
    {
      title: t('status'),
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => a.status - b.status,
      render: (status, record, index) => (
        editingIndex === index ? (
          <Switch
            checked={editingStatus}
            onChange={setEditingStatus}
            checkedChildren={t('Functional')}
            unCheckedChildren={t('Dysfunctional')}
          />
        ) : (
          <Switch checked={status} checkedChildren={t('Functional')} unCheckedChildren={t('Dysfunctional')} disabled />
        )
      ),
    },
    {
      title: t('action'),
      key: 'action',
      render: (_, record, index) => (
        editingIndex === index ? (
          <div style={{ display: 'flex', justifyContent: '' }}>
            <Button type="link" onClick={() => handleEditSave(index)} className={`${customDark === "dark-dark" ? `${customMid} border` : `${customLight} ${customDarkBorder}`} text-white `}>
              <SaveOutlined className={`${customDark === "dark-dark" ? `` : `${customDarkText}` } me-1`}/> 
              <span className={`${customDark === "dark-dark" ? `` : `${customDarkText}` } `}>{t('save')}</span> 
            </Button>
            <Button type="link" onClick={() => setEditingIndex(null)} className={`${customDark === "dark-dark" ? `${customMid} border` : `${customLight} ${customDarkBorder}`} text-white ms-3`}>
              <CloseOutlined className={`${customDark === "dark-dark" ? `` : `${customDarkText}` } me-1`}/> 
              <span className={`${customDark === "dark-dark" ? `` : `${customDarkText}` } `}>{t('cancel')}</span> 
            </Button>
          </div>
        ) : (
          <Button 
            type="link" 
            onClick={() => {
              setEditingIndex(index);
              setEditingValue(record.machineName);
              setEditingProcessId(record.processId);
              setEditingStatus(record.status);
            }} 
            className={`${customBtn} text-white me-1 border-0`}
            style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}
          >
            <EditOutlined /> {t('edit')}
          </Button>
        )
      ),
    },
  ];

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const filteredMachines = machines.filter(machine =>
    machine.machineName.toLowerCase().includes(searchText.toLowerCase()) ||
    machine.processName.toLowerCase().includes(searchText.toLowerCase()) ||
    (machine.status ? t('Functional') : t('Dysfunctional')).toLowerCase().includes(searchText.toLowerCase())
  );

  const paginatedMachines = filteredMachines.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className={`${customDark === "dark-dark" ? `${customDark} border` : `border-0`}`} style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}>
      <h2 style={{ marginBottom: '20px', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }} className={`${customDark === "dark-dark" ? ` text-white` : `${customDarkText}`}`}>{t('Production Machines')}</h2>

      <div className="mb-3 d-flex flex-wrap justify-content-between align-items-center">
        <div style={{ marginBottom: '10px', marginRight: '10px' }}>
          <Button className={`rounded-2 ${customBtn} ${customDark === "dark-dark" ? `border-white` : `border-0`}`} onClick={() => setIsModalVisible(true)}>
            {t('Add Machine')}
          </Button>
        </div>
        <div className="d-flex align-items-center justify-content-start" style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
          <Input
            placeholder={t('Search machines')}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: '100%', height: '32px' }}
            allowClear
            className={`rounded-2 ${customDark === "dark-dark" ? `${customLightBorder} text-dark` : customDarkText} ${customDarkBorder} rounded-end-0`}
          />
          <Button
            onClick={() => {/* Add search functionality here */}}
            className={`rounded-2 ${customBtn} ${customDark === "dark-dark" ? 'border-white' : 'border-0'} rounded-start-0`}
            style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FaSearch size={20}/>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center">
          <Spin />
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table
            dataSource={paginatedMachines}
            columns={columns}
            rowKey="machineId"
            pagination={false}
            className={`${customDark === "default-dark" ? "thead-default" : ""}
              ${customDark === "red-dark" ? "thead-red" : ""}
              ${customDark === "green-dark" ? "thead-green" : ""}
              ${customDark === "blue-dark" ? "thead-blue" : ""}
              ${customDark === "dark-dark" ? "thead-dark" : ""}
              ${customDark === "pink-dark" ? "thead-pink" : ""}
              ${customDark === "purple-dark" ? "thead-purple" : ""}
              ${customDark === "light-dark" ? "thead-light" : ""}
              ${customDark === "brown-dark" ? "thead-brown" : ""} custom-pagination`}
            bordered
            style={{ marginTop: '20px' }}
            scroll={{ x: 'max-content' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', background: 'white', padding: '10px' }} className='rounded-2 rounded-top-0'>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredMachines.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={['5', '10', '20']}
              showTotal={(total, range) => t('', { range0: range[0], range1: range[1], total: total })}
            />
          </div>
        </div>
      )}

      <Modal
        show={isModalVisible}
        onHide={() => setIsModalVisible(false)}
        centered
        size="lg"
        className={`rounded-2 ${customDark === "" ? `${customDark}` : ''}  `}
      >
        <Modal.Header closeButton={false} className={`rounded-top-2 ${customDark} ${customLightText} ${customDark === "dark-dark" ? `border ` : `border-0`} border d-flex justify-content-between `}>
          <Modal.Title>{t('Add Machine')}</Modal.Title>
          <AiFillCloseSquare
            size={35}
            onClick={() => setIsModalVisible(false)}
            className={`rounded-2 ${customDark === "dark-dark" ? "text-dark bg-white " : `${customDark} custom-zoom-btn text-white  ${customDarkBorder}`}`}
            aria-label="Close"
            style={{ cursor: 'pointer', fontSize: '1.5rem' }}
          />
        </Modal.Header>
        <Modal.Body className={customMid}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="machineName" style={{ display: 'block', marginBottom: '5px' }} className={`${customDarkText}`}>
              {t('Machine Name')} <span style={{ color: 'red' }}>*</span>
            </label>
            <Input
              id="machineName"
              placeholder={t('Enter Machine Name')}
              value={newMachineName}
              onChange={(e) => setNewMachineName(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="processSelect" style={{ display: 'block', marginBottom: '5px' }}>
              {t('Select Process')} <span style={{ color: 'red' }}>*</span>
            </label>
            <Select
              id="processSelect"
              placeholder={t('Select Process')}
              value={newMachineProcessId}
              onChange={setNewMachineProcessId}
              style={{ width: '100%' }}
              required
            >
              {processes.map(process => (
                <Select.Option key={process.id} value={process.id}>
                  {process.name}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="machineStatus" style={{ display: 'block', marginBottom: '5px' }}>
              {t('Machine Status')}
            </label>
            <Switch
              id="machineStatus"
              checked={newMachineStatus}
              checkedChildren={t('Functional')}
              unCheckedChildren={t('Dysfunctional')}
              onChange={setNewMachineStatus}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className={customMid}>
          <Button variant="secondary" className={`rounded-2 ${customBtn} ${customDark === "dark-dark" ? `border-white` : `border-0`}`} onClick={() => setIsModalVisible(false)}>{t('cancel')}</Button>
          <Button variant="primary" className={`rounded-2 ${customBtn} ${customDark === "dark-dark" ? `border-white` : `border-0`}`} onClick={handleAddMachine}>{t('add')}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Machine;
