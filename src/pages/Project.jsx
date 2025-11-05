// import React, { useEffect, useState } from 'react';
// import { useTranslation } from 'react-i18next';

// import AddProjectProcess from './AddProjectProcess';
// import ProjectUserAllocation from './ProjectUserAllocation';


// import { Table, Tabs, Button, Input, Switch, Form, message, Card, Row, Col, Select, Pagination } from 'antd';
// import { Modal } from 'antd'; // Change this import to use Ant Design's Modal
// import { useNavigate } from 'react-router-dom';
// import API from '../CustomHooks/MasterApiHooks/api';
// import themeStore from './../store/themeStore';
// import { useStore } from 'zustand';
// import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';

// const { Option } = Select;

// const Project = () => {
//   const { t } = useTranslation();

//   const { getCssClasses } = useStore(themeStore);
//   const cssClasses = getCssClasses();
//   const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

//   const SERIES_1 = "ABCDEFGH";
//   const SERIES_2 = "PQRSTUVW";

//   const [projects, setProjects] = useState([]);
//   const [groups, setGroups] = useState([]);
//   const [types, setTypes] = useState([]);
//   const [isModalVisible, setIsModalVisible] = useState(false);
//   const [form] = Form.useForm();
//   const [editingIndex, setEditingIndex] = useState(null);
//   const [editingName, setEditingName] = useState('');
//   const [editingDescription, setEditingDescription] = useState('');
//   const [editingStatus, setEditingStatus] = useState(false);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [selectedType, setSelectedType] = useState(null);
//   const [showSeriesFields, setShowSeriesFields] = useState(false);
//   const [numberOfSeries, setNumberOfSeries] = useState(0);
//   const navigate = useNavigate();

//   const { TabPane } = Tabs;
//   const [activeTabKey, setActiveTabKey] = useState("1"); // State for active tab
//   const [selectedProject, setSelectedProject] = useState();


//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(5);
//   const [searchText, setSearchText] = useState('');
//   const [sortedInfo, setSortedInfo] = useState({});
//   const [total, setTotal] = useState(0);

//   const validateSeriesInput = (_, value) => {
//     if (!value) {
//       return Promise.reject();
//     }

//     if (value.length !== numberOfSeries) {
//       return Promise.resolve();
//     }

//     // Convert to uppercase for validation
//     value = value.toUpperCase();

//     // Check if characters are sequential but can start from any letter
//     const startCharCode = value.charCodeAt(0);
//     for (let i = 1; i < value.length; i++) {
//       if (value.charCodeAt(i) !== startCharCode + i) {
//         return Promise.reject(new Error('Characters must be sequential'));
//       }
//     }

//     return Promise.resolve();
//   };

//   const getProjects = async () => {
//     try {
//       const response = await API.get('/Project');
//       setProjects(response.data);
//       setTotal(response.data.length);
//     } catch (error) {
//       console.error('Failed to fetch projects', error);
//       message.error(t('unableToFetchProjects'));
//     }
//   };

//   const getGroups = async () => {
//     try {
//       const response = await API.get('/Groups');
//       setGroups(response.data);
//     } catch (error) {
//       console.error('Failed to fetch groups', error);
//       message.error(t('unableToFetchGroups'));
//     }
//   };

//   const getTypes = async () => {
//     try {
//       const response = await API.get('/PaperTypes');
//       setTypes(response.data);
//     } catch (error) {
//       console.error('Failed to fetch types', error);
//       message.error(t('unableToFetchTypes'));
//     }
//   };

//   useEffect(() => {
//     getProjects();
//     getGroups();
//     getTypes();
//   }, []);

//   const handleAddProject = async (values) => {
//     const { name, status, description, numberOfSeries, seriesName } = values;

//     const existingProject = projects.find(
//       (project) => project.name.toLowerCase() === name.toLowerCase()
//     );
//     if (existingProject) {
//       message.error(t('projectNameAlreadyExists'));
//       return;
//     }

//     const newProject = {
//       name,
//       status,
//       description,
//       groupId: selectedGroup?.id || 0,
//       typeId: selectedType?.typeId || 0,
//       noOfSeries: numberOfSeries,
//       seriesName
//     };

//     try {
//       const response = await API.post('/Project', newProject, {
//         headers: { 'Content-Type': 'application/json' },
//       });
//       setProjects([...projects, response.data]);
//       form.resetFields();
//       setIsModalVisible(false);
//       message.success(t('projectAddedSuccessfully'));
//       setActiveTabKey("2"); // Switch to Select Process tab
//       setSelectedProject(response.data.projectId);
//     } catch (error) {
//       console.error('Error adding project:', error);
//       message.error(t('errorAddingProject'));
//     }
//   };

//   const handleEditSave = async (index) => {
//     const updatedProject = {
//       ...projects[index],
//       name: editingName,
//       description: editingDescription,
//       status: editingStatus,
//     };

//     try {
//       await API.put(`/Project/${updatedProject.projectId}`, updatedProject, {
//         headers: { 'Content-Type': 'application/json' },
//       });
//       const updatedProjects = [...projects];
//       updatedProjects[index] = updatedProject;
//       setProjects(updatedProjects);
//       setEditingIndex(null);
//       message.success(t('projectUpdatedSuccessfully'));
//     } catch (error) {
//       console.error('Failed to update project:', error);
//       message.error(t('failedToUpdateProject'));
//     }
//   };

//   const handleTableChange = (pagination, filters, sorter) => {
//     setSortedInfo(sorter);
//     setCurrentPage(pagination.current);
//     setPageSize(pagination.pageSize);
//   };

//   const columns = [
//     {
//       // width: '1%',
//       align: 'center',
//       title: t('sn'),
//       dataIndex: 'serial',
//       key: 'serial',
//       render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
//     },
//     {
//       title: t('projectName'),
//       dataIndex: 'name',
//       key: 'name',
//       sorter: (a, b) => a.name.localeCompare(b.name),
//       sortOrder: sortedInfo.columnKey === 'name' && sortedInfo.order,
//       render: (text, record, index) =>

//         editingIndex === index ? (
//           <Input
//             value={editingName}
//             onChange={(e) => setEditingName(e.target.value)}
//             onPressEnter={() => handleEditSave(index)}
//           />
//         ) : (
//           <a
//             onClick={() => {
//               setActiveTabKey("2"); // Switch to Select Process tab
//               setSelectedProject(record.projectId); // Navigate to process
//             }}
//           >
//             {text}
//           </a>
//           //<span>{text}</span>
//         ),
//     },
//     {
//       title: t('projectDescription'),
//       dataIndex: 'description',
//       key: 'description',
//       render: (text, record, index) =>
//         editingIndex === index ? (
//           <Input
//             value={editingDescription}
//             onChange={(e) => setEditingDescription(e.target.value)}
//             onPressEnter={() => handleEditSave(index)}
//           />
//         ) : (
//           <span>{text}</span>
//         ),
//     },
//     {
//       title: t('status'),
//       dataIndex: 'status',
//       key: 'status',
//       sorter: (a, b) => a.status - b.status,
//       sortOrder: sortedInfo.columnKey === 'status' && sortedInfo.order,
//       render: (status, record, index) =>
//         editingIndex === index ? (
//           <Switch
//             checked={editingStatus}
//             onChange={(checked) => setEditingStatus(checked)}
//             checkedChildren={t('active')}
//             unCheckedChildren={t('inactive')}
//           />
//         ) : (
//           <Switch
//             checked={status}
//             disabled
//             checkedChildren={t('active')}
//             unCheckedChildren={t('inactive')}
//           />
//         ),
//     },
//     {
//       title: t('action'),
//       key: 'action',
//       render: (_, record, index) =>
//         editingIndex === index ? (
//           <div style={{ display: 'flex', gap: '8px' }}>
//             <Button 
//               className={`${customBtn} d-flex align-items-center justify-content-center`}
//               onClick={() => handleEditSave(index)}
//               icon={<SaveOutlined />}
//             >
//               {t('save')}
//             </Button>
//             <Button 
//               className={`${customBtn} d-flex align-items-center justify-content-center`}
//               onClick={() => setEditingIndex(null)}
//               icon={<CloseOutlined />}
//             >
//               {t('cancel')}
//             </Button>
//           </div>
//         ) : (
//           <Button
//             className={`${customBtn} d-flex align-items-center justify-content-center`}
//             onClick={() => {
//               setEditingIndex(index);
//               setEditingName(record.name);
//               setEditingDescription(record.description);
//               setEditingStatus(record.status);
//             }}
//             icon={<EditOutlined />}
//           >
//             {t('edit')}
//           </Button>
//         ),
//     },
//   ];

//   const showModal = () => {
//     setIsModalVisible(true);
//   };

//   const handleCancel = () => {
//     form.resetFields();
//     setIsModalVisible(false);
//     setSelectedGroup(null);
//     setSelectedType(null);
//     setShowSeriesFields(false);
//     setNumberOfSeries(0);
//   };

//   const handleGroupChange = (value) => {
//     const group = groups.find((g) => g.id === value);
//     setSelectedGroup(group);
//     updateProjectName(group, selectedType);
//   };

//   const handleTypeChange = (value) => {
//     const type = types.find((t) => t.typeId === value);
//     setSelectedType(type);
//     updateProjectName(selectedGroup, type);
//     setShowSeriesFields(type?.types?.toLowerCase() === 'booklet');
//   };

//   const updateProjectName = (group, type) => {
//     const projectName = `${group?.name || ''} ${type?.types || ''}`;
//     form.setFieldsValue({ name: projectName });
//   };

//   const filteredProjects = projects.filter(project =>
//     Object.values(project).some(value =>
//       value && value.toString().toLowerCase().includes(searchText.toLowerCase())
//     )
//   );

//   // Get current projects for pagination
//   const indexOfLastProject = currentPage * pageSize;
//   const indexOfFirstProject = indexOfLastProject - pageSize;
//   const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);

//   return (

//     <Card
//       title={t('projects')}
//       bordered={true}
//       style={{ padding: '1px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', width: '100%' }}
//     >
//       <Tabs activeKey={activeTabKey} onChange={setActiveTabKey}>
//         <TabPane tab={t('projectList')} key="1">
//           <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
//             <Col xs={24} sm={12} style={{ textAlign: 'left', marginTop: { xs: '10px', sm: '0' } }}>
//               <Button type="primary" className={`${customBtn} mt-1`} onClick={showModal}>
//                 {t('addNewProject')}
//               </Button>
//             </Col>
//             <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
//               <Input.Search
//                 placeholder={t('searchProjects')} 
//                 onChange={e => setSearchText(e.target.value)}
//                 style={{ width: '100%', maxWidth: '300px' }}
//                 className={`${customDarkText} mt-1`}
//               />
//             </Col>
//           </Row>
//           <div className="table-responsive">
//             <Table
//               columns={columns}
//               dataSource={currentProjects.map((project, index) => ({ ...project, serial: index + 1 }))}
//               onChange={handleTableChange}
//               pagination={{
//                 className: 'p-3 rounded rounded-top-0',
//                 current: currentPage,
//                 pageSize: pageSize,
//                 total: filteredProjects.length,
//                 showSizeChanger: true,
//                 // showQuickJumper: true,
//                 showTotal: (total, range) => `${range[0]}-${range[1]} ${t('of')} ${total} ${t('items')}`,
//                 pageSizeOptions: ['10', '15','20']
//               }}
//               rowKey="projectId"
//               bordered
//               scroll={{ x: 'max-content' }}
//               className={`${customDark === "default-dark" ? "thead-default" : ""}
//                   ${customDark === "red-dark" ? "thead-red" : ""}
//                   ${customDark === "green-dark" ? "thead-green" : ""}
//                   ${customDark === "blue-dark" ? "thead-blue" : ""}
//                   ${customDark === "dark-dark" ? "thead-dark" : ""}
//                   ${customDark === "pink-dark" ? "thead-pink" : ""}
//                   ${customDark === "purple-dark" ? "thead-purple" : ""}
//                   ${customDark === "light-dark" ? "thead-light" : ""}
//                   ${customDark === "brown-dark" ? "thead-brown" : ""} custom-pagination`}
//             />
//           </div>
//           <Modal
//             title={t('addNewProject')}
//             visible={isModalVisible}
//             onCancel={handleCancel}
//             footer={null}
//             width="95%"
//             style={{ maxWidth: '600px' }}
//           >
//             <Form form={form} onFinish={handleAddProject} layout="vertical" initialValues={{ status: true }}>
//               <Row gutter={[16, 0]}>
//                 <Col xs={24} sm={24}>
//                   <Form.Item
//                     name="group"
//                     label={t('group')}
//                     rules={[{ required: true, message: t('pleaseSelectGroup') }]}
//                   >
//                     <Select onChange={handleGroupChange} placeholder={t('selectGroup')}>
//                       {groups.map((group) => (
//                         <Option key={group.id} value={group.id}>{group.name}</Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24} sm={24}>
//                   <Form.Item
//                     name="type"
//                     label={<span className={customDarkText}>{t('type')}</span>}
//                     rules={[{ required: true, message: t('pleaseSelectType') }]}
//                   >
//                     <Select onChange={handleTypeChange} placeholder={t('selectType')}>
//                       {types.map((type) => (
//                         <Option key={type.typeId} value={type.typeId}>{type.types}</Option>
//                       ))}
//                     </Select>
//                   </Form.Item>
//                 </Col>
//               </Row>
//               {showSeriesFields && (
//                 <Row gutter={[16, 0]}>
//                   <Col xs={24} sm={12}>
//                     <Form.Item
//                       name="numberOfSeries"
//                       label={<span className={customDarkText}>{t('numberOfSeries')}</span>}
//                       rules={[{ required: true, message: t('pleaseEnterNumberOfSeries') }]}
//                     >
//                       <Select
//                         placeholder={t('selectNumberOfSeries')}
//                         onChange={(value) => setNumberOfSeries(value)}
//                       >
//                         {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
//                           <Option key={num} value={num}>{num}</Option>
//                         ))}
//                       </Select>
//                     </Form.Item>
//                   </Col>
//                   <Col xs={24} sm={12}>
//                     <Form.Item
//                       name="seriesName"
//                       label={<span className={customDarkText}>{t('seriesName')}</span>}
//                       rules={[
//                         { required: true, message: t('pleaseEnterSeriesName') },
//                         { validator: validateSeriesInput }
//                       ]}
//                     >
//                       <Input 
//                         placeholder={t('enterSeriesName')}
//                         maxLength={numberOfSeries}
//                         style={{ textTransform: 'uppercase' }}
//                       />
//                     </Form.Item>
//                   </Col>
//                 </Row>
//               )}
//               <Row gutter={[16, 0]}>
//                 <Col xs={24}>
//                   <Form.Item
//                     name="name"
//                     label={<span className={customDarkText}>{t('projectName')}</span>}
//                     rules={[{ required: true, message: t('pleaseEnterProjectName') }]}
//                   >
//                     <Input placeholder={t('enterProjectName')} />
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24}>
//                   <Form.Item
//                     name="description"
//                     label={<span className={customDarkText}>{t('description')}</span>}
//                   >
//                     <Input.TextArea rows={4} placeholder={t('enterDescription')} />
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24}>
//                   <Form.Item
//                     name="status"
//                     label={t('status')}
//                     valuePropName="checked"
//                   >
//                     <Switch />
//                   </Form.Item>
//                 </Col>
//               </Row>
//               <Row justify="end" gutter={[8, 0]}>
//                 <Col>
//                   <Button onClick={handleCancel}>{t('cancel')}</Button>
//                 </Col>
//                 <Col>
//                   <Button type="primary" htmlType="submit">
//                     {t('save')}
//                   </Button>
//                 </Col>
//               </Row>
//             </Form>
//           </Modal>
//         </TabPane>
//         <TabPane tab={t('selectProcess')} key="2" disabled={!selectedProject}>

//           <div className="responsive-container">
//             <AddProjectProcess selectedProject={selectedProject} />
//             <Button 
//               type="primary" 
//               onClick={() => setActiveTabKey("3")} 
//               style={{ marginTop: '20px' }}
//             >
//               {t('next')}
//             </Button>
//           </div>
//         </TabPane>


//         <TabPane tab={t('allocateProcess')} key="3" disabled={!selectedProject}>

//           <div className="responsive-container">
//             <ProjectUserAllocation selectedProject={selectedProject}/>
//           </div>
//         </TabPane>
//       </Tabs>
//     </Card>
//   );
// };

// export default Project;

