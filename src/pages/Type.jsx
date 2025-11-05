import { message, Table, Input, Button, Switch, Form, Select, Spin, Pagination } from 'antd';
import { Modal } from 'react-bootstrap';
import React, { useEffect, useState } from 'react';
import { useForm } from 'antd/es/form/Form';
import API from '../CustomHooks/MasterApiHooks/api';
import { useMediaQuery } from 'react-responsive';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { AiFillCloseSquare } from "react-icons/ai";
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
const { Option } = Select;
const { Search } = Input;
import { useTranslation } from 'react-i18next';
import { success, error } from '../CustomHooks/Services/AlertMessageService';

const Type = () => {
    const { t } = useTranslation();
    const { getCssClasses } = useStore(themeStore);
    const cssClasses = getCssClasses();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;
    const [types, setTypes] = useState([]);
    const [filteredTypes, setFilteredTypes] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [processMap, setProcessMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [associatedProcessIds, setAssociatedProcessIds] = useState([]);
    const [requiredProcessIds, setRequiredProcessIds] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingType, setEditingType] = useState('');
    const [editingProcessIds, setEditingProcessIds] = useState([]);
    const [requirededitingProcessIds, setRequiredEditingProcessIds] = useState([]);
    const [editingStatus, setEditingStatus] = useState(true);
    const [originalData, setOriginalData] = useState({});
    const [form] = useForm();
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const response = await API.get('/PaperTypes');
            setTypes(response.data);
            setFilteredTypes(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProcesses = async () => {
        setLoading(true);
        try {
            const response = await API.get('/Processes');
            setProcesses(response.data);
            const map = response.data.reduce((acc, proc) => {
                acc[proc.id] = proc.name;
                return acc;
            }, {});
            setProcessMap(map);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
        fetchProcesses();
    }, []);

    useEffect(() => {
        const filtered = types.filter(type =>
            type.types.toLowerCase().includes(searchText.toLowerCase()) ||
            type.associatedProcessId.some(id => processMap[id]?.toLowerCase().includes(searchText.toLowerCase()))
        );
        setFilteredTypes(filtered);
        setCurrentPage(1);
    }, [searchText, types, processMap]);

    const handleAddType = async (values) => {
        const { associatedProcessId,requiredProcessId } = values;

        try {
            const typeExists = types.some(type => type.types.toLowerCase() === values.types.toLowerCase());
            if (typeExists) {
                // error(t("thisTypeAlreadyExists"));
                return;
            }
            const postData = {
                ...values,
                associatedProcessId: associatedProcessIds,
                requiredProcessId: requiredProcessIds
            };
            const response = await API.post('/PaperTypes', postData);
            setTypes(prev => [...prev, response.data]);
            setFilteredTypes(prev => [...prev, response.data]);
            success(t("typeCreatedSuccessfully"));
            setIsModalVisible(false);
            form.resetFields();
            setRequiredProcessIds([])
        } catch (err) {
            console.error(err);
            error(t("failedToCreateType"));
        }
    };

    const handleEditSave = async (index) => {
        const updatedType = {
            ...types[index],
            types: editingType,
            associatedProcessId: editingProcessIds,
            requiredProcessId:requirededitingProcessIds,
            status: editingStatus,
        };

        try {
            await API.put(`/PaperTypes/${updatedType.typeId}`, updatedType);
            const updatedTypes = [...types];
            updatedTypes[index] = updatedType;
            setTypes(updatedTypes);
            setFilteredTypes(updatedTypes);
            success(t('typeUpdatedSuccessfully'));
            setEditingIndex(null);
        } catch (err) {
            console.error(err);
            error(t('failedToUpdateType'));
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditingType(originalData.types);
        setEditingProcessIds(originalData.associatedProcessId);
        setRequiredEditingProcessIds(originalData.requiredProcessId)
        setEditingStatus(originalData.status);
    };
console.log(originalData.requiredProcessIds)
    const handleSearch = (value) => {
        setSearchText(value);
    };

    const getResponsiveWidth = (key) => {
        if (isMobile) {
            switch(key) {
                case 'serial': return '15%';
                case 'types': return '25%';
                case 'associatedProcessId': return '30%';
                case 'requiredProcessId': return '30%';
                case 'action': return '20%';
                default: return 'auto';
            }
        } else if (isTablet) {
            switch(key) {
                case 'serial': return '10%';
                case 'types': return '15%';
                case 'associatedProcessId': return '25%';
                case 'requiredProcessId': return '25%';
                case 'status': return '15%';
                case 'action': return '15%';
                default: return 'auto';
            }
        } else {
            switch(key) {
                case 'serial': return '5%';
                case 'types': return '15%';
                case 'associatedProcessId': return '25%';
                case 'requiredProcessId': return '25%';
                case 'status': return '15%';
                case 'action': return '15%';
                default: return 'auto';
            }
        }
    };

    const columns = [
        {
            title:t('srNo'),
            align: 'center',
            dataIndex: 'serial',
            key: 'serial',
            render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
            width: getResponsiveWidth('serial'),
        },
        {
            title: t('type'),
            dataIndex: 'types',
            key: 'types',
            width: getResponsiveWidth('types'),
            sorter: (a, b) => a.types.localeCompare(b.types),
            render: (text, record, index) => (
                editingIndex === index ? (
                    <Input
                        value={editingType}
                        onChange={(e) => setEditingType(e.target.value)}
                        onPressEnter={() => handleEditSave(index)}
                    />
                ) : (
                    <span>{text}</span>
                )
            ),
        },
        {
            title: t('associatedProcess'),
            dataIndex: 'associatedProcessId',
            key: 'associatedProcessId',
            width: getResponsiveWidth('associatedProcessId'),
            sorter: (a, b) => {
                const aProcesses = a.associatedProcessId?.map(id => processMap[id]).join(', ') || '';
                const bProcesses = b.associatedProcessId?.map(id => processMap[id]).join(', ') || '';
                return aProcesses.localeCompare(bProcesses);
            },
            render: (ids, record, index) => (
                editingIndex === index ? (
                    <Select
                        mode="multiple"
                        value={editingProcessIds}
                        onChange={(selected) => {
                            setEditingProcessIds(selected);
                            setRequiredEditingProcessIds(prev => prev.filter(id => selected.includes(id)));
                        }}
                        style={{ width: '100%' }}
                    >
                        {processes.map(proc => (
                            <Option key={proc.id} value={proc.id}>
                                {proc.name}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    <div style={{wordWrap: 'break-word', whiteSpace: 'normal'}}>
                        {ids?.map(id => processMap[id]).join(', ') || ''}
                    </div>
                )
            ),
        },
      
        {
            title: t('requiredProcess'),
            dataIndex: 'requiredProcessId',
            key: 'requiredProcessId',
            width: getResponsiveWidth('requiredProcessId'),
            sorter: (a, b) => {
                const aProcesses = a.requiredProcessId?.map(id => processMap[id]).join(', ') || '';
                const bProcesses = b.requiredProcessId?.map(id => processMap[id]).join(', ') || '';
                return aProcesses.localeCompare(bProcesses);
            },
            render: (ids, record, index) => (
                editingIndex === index ? (
                    <Select
                        mode="multiple"
                        value={requirededitingProcessIds}
                        onChange={setRequiredEditingProcessIds}
                        style={{ width: '100%' }}
                    >
                        {editingProcessIds.map(id => (
                            <Option key={id} value={id}>
                                {processMap[id]}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    <div style={{wordWrap: 'break-word', whiteSpace: 'normal'}}>
                        {ids?.map(id => processMap[id]).join(', ') || ''}
                    </div>
                )
            ),
        },
        {
            title: t('status'),
            align: 'center',
            dataIndex: 'status',
            key: 'status',
            width: getResponsiveWidth('status'),
            sorter: (a, b) => (a.status === b.status ? 0 : a.status ? -1 : 1),
            render: (status, record, index) => (
                editingIndex === index ? (
                    <Switch
                        checked={editingStatus}
                        onChange={setEditingStatus}
                        checkedChildren={t("active")}
                        unCheckedChildren={t("inactive")}
                    />
                ) : (
                    <Switch
                        checked={status}
                        disabled
                        checkedChildren={t("active")}
                        unCheckedChildren={t("inactive")}
                    />
                )
            ),
        },
        {
            title: t('action'),
            key: 'action',
            width: getResponsiveWidth('action'),
            render: (_, record, index) => (
                editingIndex === index ? (
                    <div style={{ display: 'flex', justifyContent: '' }}>
                        <Button type="link" onClick={() => handleEditSave(index)} className={`${customDark === "dark-dark" ? `${customMid} border` : `${customLight} ${customDarkBorder}`} text-white d-flex align-items-center gap-1 `}>
                            <SaveOutlined className={`${customDark === "dark-dark" ? `` : `${customDarkText}`} `} />
                            <span className={`${customDark === "dark-dark" ? `` : `${customDarkText}`} `}>{t("save")}</span>
                        </Button>
                        <Button type="link" onClick={handleCancelEdit} className={`${customDark === "dark-dark" ? `${customMid} border` : `${customLight} ${customDarkBorder}`} text-white ms-3 d-flex align-items-center gap-1`}>
                            <CloseOutlined className={`${customDark === "dark-dark" ? `` : `${customDarkText}`} `} />
                            <span className={`${customDark === "dark-dark" ? `` : `${customDarkText}`} `}>{t("cancel")}</span>
                        </Button>
                    </div>
                ) : (
                    <Button type="link" icon={<EditOutlined />} onClick={() => {
                        setEditingIndex(index);
                        setEditingType(record.types);
                        setEditingProcessIds(record.associatedProcessId);
                        setRequiredEditingProcessIds(record.requiredProcessId)
                        setEditingStatus(record.status);
                        setOriginalData(record);
                    }} className={`${customBtn} text-white me-1 d-flex align-items-center gap-1`}>{t("edit")}</Button>
                )
            ),
        },
    ];

    const responsiveColumns = isMobile ? columns.filter(col => col.key !== 'status') : columns;

    const handleClose = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const paginatedTypes = filteredTypes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div style={{
            padding: isMobile ? '10px' : '20px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            overflow: 'auto'
        }}
            className={`${customDark === "dark-dark" ? customDark : ``}`}>
            <h2 className={`${customDarkText}`}>{t("projectType")}</h2>
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '10px' : '0',
                marginBottom: isMobile ? '10px' : '20px'
            }}>
                <Button className={`${customBtn}  custom-zoom-btn ${customDark === "dark-dark" ? customLightBorder : ""}`} onClick={() => setIsModalVisible(true)}>
                    {t("addType")}
                </Button>
                <Search
                    placeholder={t("searchTypesOrProcesses")}
                    allowClear
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: isMobile ? '100%' : 300 }}
                />
            </div>

            {loading ? (
                <Spin size="large" />
            ) : (
                <>
                    <Table
                        dataSource={paginatedTypes}
                        columns={responsiveColumns}
                        rowKey="typeId"
                        pagination={false}
                        bordered
                        size={isMobile ? "small" : "default"}
                        className={`${customDark === "default-dark" ? "thead-default" : ""}
                        ${customDark === "red-dark" ? "thead-red" : ""}
                        ${customDark === "green-dark" ? "thead-green" : ""}
                        ${customDark === "blue-dark" ? "thead-blue" : ""}
                        ${customDark === "dark-dark" ? "thead-dark" : ""}
                        ${customDark === "pink-dark" ? "thead-pink" : ""}
                        ${customDark === "purple-dark" ? "thead-purple" : ""}
                        ${customDark === "light-dark" ? "thead-light" : ""}
                        ${customDark === "brown-dark" ? "thead-brown" : ""} rounded-2`}
                        style={{
                            fontSize: isMobile ? '12px' : '14px',
                            width: '100%'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', background: 'white', padding: '10px' }} className='rounded-2 rounded-top-0'>
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={filteredTypes.length}
                            onChange={(page, pageSize) => {
                                setCurrentPage(page);
                                setPageSize(pageSize);
                            }}
                            showSizeChanger
                            showQuickJumper
                            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                        />
                    </div>
                </>
            )}

            <Modal
                show={isModalVisible}
                onHide={handleClose}
                centered
                size='md'
            >
                <Modal.Header closeButton={false} className={`rounded-top-2 ${customDark} ${customLightText} ${customDark === "dark-dark" ? `border ` : `border-0`} w border d-flex justify-content-between `}>
                    <Modal.Title>{t('addType')}</Modal.Title>
                    <AiFillCloseSquare
                        size={35}
                        onClick={handleClose}
                        className={`rounded-2 ${customDark === "dark-dark" ? "text-dark bg-white " : `${customDark} custom-zoom-btn text-white  ${customDarkBorder}`}`}
                        aria-label={t('close')}
                        style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                    />
                </Modal.Header>
                <Modal.Body className={`rounded-bottom-2 ${customMid} ${customDark === "dark-dark" ? `border border-top-0` : `border-0`} `}>
                    <Form
                        form={form}
                        onFinish={handleAddType}
                        layout="vertical"
                    >
                        <Form.Item
                            name="types"
                            label={<span className={`${customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`} fs-5 `}>{t('type')}</span>}
                            rules={[
                                { 
                                    required: true,
                                    validator: async (_, value) => {
                                        if (!value) {
                                            throw new Error(t('pleaseInputType'));
                                        }
                                        if (types.some(type => type.types.toLowerCase() === value.toLowerCase())) {
                                            throw new Error(t('thisTypeAlreadyExists'));
                                        }
                                    }
                                }
                            ]}
                        >
                            <Input placeholder={t('type')} />
                        </Form.Item>
                        <Form.Item
                            name="associatedProcessId"
                            label={<span className={`${customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`} fs-5 `}>{t('associatedProcess')}</span>}
                            rules={[{ required: true, message: t('pleaseSelectProcess') }]}
                        >
                            <Select
                                mode="multiple"
                                placeholder={t('selectProcess')}
                                onChange={(selected) => {
                                    setAssociatedProcessIds(selected); 
                                    setRequiredProcessIds(selected); 
                                }}
                                style={{ width: '100%' }}
                            >
                                {processes.map(proc => (
                                    <Option key={proc.id} value={proc.id}>
                                        {proc.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item label={<span className={`${customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`} fs-5 `}>{t('requiredProcess')}</span>}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {requiredProcessIds?.map(id => (
                                    <span key={id} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px', display: 'flex', alignItems: 'center' }} className={`${customLight} ${customDarkText}`}>
                                        {processMap[id]}
                                        <AiFillCloseSquare
                                            style={{ marginLeft: '8px', cursor: 'pointer' }}
                                            onClick={() => setRequiredProcessIds(requiredProcessIds.filter(processId => processId !== id))}
                                            className='rounded-circle'
                                            size={20}
                                        />
                                    </span>
                                ))}
                            </div>
                        </Form.Item>

                        <Form.Item name="status" label={<span className={`${customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`} fs-5 `}>{t('status')}</span>} valuePropName="checked" initialValue={true}>
                            <Switch
                                checkedChildren={t('active')}
                                unCheckedChildren={t('inactive')}
                                defaultChecked
                            />
                        </Form.Item>

                        <Form.Item>

                            <Button type="" htmlType="submit" className={`rounded-2 ${customBtn} ${customDark === "dark-dark" ? `` : `border-0`} custom-zoom-btn d-flex align-items-center gap-1`}>
                                Submit

                            </Button>
                        </Form.Item>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default Type;
