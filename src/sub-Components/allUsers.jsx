import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Table, Select, Input, Space, Button, Row, Col, Checkbox, Form, Dropdown, Menu, message } from 'antd';
import { Modal } from 'react-bootstrap';
import { EyeOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { fetchUsers } from '../CustomHooks/ApiServices/userService';
import API from '../CustomHooks/MasterApiHooks/api';
import SampleUser from "./../assets/sampleUsers/defaultUser.jpg";
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { useMediaQuery } from 'react-responsive';
import { AiFillCloseSquare } from 'react-icons/ai';
import { BsFunnelFill } from "react-icons/bs";
import { useTranslation } from 'react-i18next';
import { success, error } from '../CustomHooks/Services/AlertMessageService';
import { useUserData } from '../store/userDataStore';
const BaseUrl = import.meta.env.VITE_API_BASE_URL;

const { Option } = Select;

const AllUsers = () => {
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;
  const userData = useUserData()
  const userRole = userData?.role
  
  // console.log(userRole.priorityOrder)

  const [users, setUsers] = useState([]);
  const [filterType, setFilterType] = useState('none');
  const [filterValue, setFilterValue] = useState('');
  const [editingUserId, setEditingUserId] = useState(null);
  const [currentUserData, setCurrentUserData] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    profilePicture: false,
    address: false,
    mobileNo: false,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [roles, setRoles] = useState([]);
  const [pageSize, setPageSize] = useState(5); // Default page size
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const isMobile = useMediaQuery({ maxWidth: 767 });

  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await fetchUsers();
        setUsers(res);
      } catch (error) {
        console.error(t("errorFetchingUsers"), error);
      }
    };
    getUsers();

    const getRoles = async () => {
      try {
        const response = await API.get('/Roles');
        setRoles(response.data);
      } catch (error) {
        console.error(t("errorFetchingRoles"), error);
      }
    };
    getRoles();
  }, [t]);

  const handleFilterChange = useCallback((value) => {
    setFilterType(value);
    setFilterValue('');
  }, []);

  const clearFilters = useCallback(() => {
    setFilterType('none');
    setFilterValue('');
  }, []);

  const filteredData = useMemo(() => {
    if (filterType === 'name' && filterValue) {
      return users.filter(user =>
        user.firstName.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.lastName.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    return users;
  }, [users, filterType, filterValue]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, pageSize]);

  const handlePageSizeChange = useCallback((value) => {
    setPageSize(value);
  }, []);

  const handlePaginationChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  const handleColumnVisibilityChange = useCallback((e, column) => {
    setVisibleColumns(prev => ({ ...prev, [column]: e.target.checked }));
  }, []);

  const isValidImageUrl = useCallback((url) => {
    return url && url.match(/\.(jpeg|jpg|gif|png)$/) != null;
  }, []);

  const handleEdit = useCallback((record) => {
    setEditingUserId(record.userId);
    setCurrentUserData({ ...record });
  }, []);

  const isEditDisabled = (record) => {
    const roledata = roles.find(r => r.roleId === record.roleId);
  
    // User can always edit their own role, but no one else’s role
    if (record.userId === userData?.userId) {
      return false; // Allow user to edit their own role
    }
  
    // User cannot edit if the target user's role is higher or equal to their own
    const res = userRole?.priorityOrder >= roledata?.priorityOrder;
    return res;
  }
  

  const handleSave = useCallback(async (record) => {
    try {
      const updatedUser = {
        userId: record.userId,
        userName: currentUserData.userName,
        firstName: currentUserData.firstName,
        middleName: currentUserData.middleName,
        lastName: currentUserData.lastName,
        roleId: currentUserData.roleId,
        mobileNo: currentUserData.mobileNo,
        status: currentUserData.status,
        gender: currentUserData.gender,
        address: currentUserData.address,
        profilePicturePath: currentUserData.profilePicturePath
      };

      const response = await API.put(`/User/edit/${record.userId}`, updatedUser);

      if (response.status === 200) {
        const newData = users.map(item =>
          item.userId === record.userId ? { ...item, ...updatedUser } : item
        );
        setUsers(newData);
        setEditingUserId(null);
        success(t('userUpdatedSuccessfully'));
      } else {
        error(t('failedToUpdateUser'));
      }
    } catch (error) {
      console.error(t("errorUpdatingUser"), error);
      error(t('errorOccurredWhileUpdatingUser'));
    }
  }, [users, currentUserData, t]);

  const handleCancel = useCallback(() => {
    setEditingUserId(null);
  }, []);

  const columns = useMemo(() => [
    {
      align: "center",
      title: t('srNo'),
      key: 'serial',
      render: (text, record, index) => index + 1,
      width: 70,
    },
    {
      title: t('fullName'),
      key: 'fullName',
      render: (record) => `${record.firstName} ${record.middleName} ${record.lastName}`,
      width: 150,
      sorter: (a, b) => `${a.firstName} ${a.middleName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.middleName} ${b.lastName}`),
    },
    {
      title: t('role'),
      dataIndex: 'roleId',
      key: 'roleId',
      render: (text, record) => {
        const editable = record.userId === editingUserId;
        const currentRole = roles.find(role => role.roleId === text);
        
        return editable ? (
          <Select
            value={currentUserData.roleId}
            onChange={(value) => setCurrentUserData(prev => ({ ...prev, roleId: value }))}
            style={{ width: '200px' }}
          >
            <Option key={currentRole?.roleId} value={currentRole?.roleId}>
              {currentRole?.roleName}
            </Option>
            {roles
              .filter(role => 
                role.priorityOrder > userRole?.priorityOrder && 
                role.roleId !== currentRole?.roleId
              )
              .map(role => (
                <Option key={role.roleId} value={role.roleId}>
                  {role.roleName}
                </Option>
              ))}
          </Select>
        ) : (
          currentRole?.roleName || text
        );
      },
      width: 200,
      sorter: (a, b) => a.roleId - b.roleId,
    },
    visibleColumns.profilePicture && {
      align: "center",
      title: t('profilePicture'),
      dataIndex: 'profilePicturePath',
      key: 'profilePicturePath',
      render: (path) => {
        const fullPath = path ? `${BaseUrl}/${path}` : null;
        return isValidImageUrl(fullPath) ? (
          <img src={fullPath} alt={t("profile")} width={50} height={50} className='rounded-circle' />
        ) : (
          <img src={SampleUser} alt={t("sampleUser")} width={50} height={50} className='rounded-circle' />
        );
      },
      width: 120,
    },
    visibleColumns.address && {
      title: t('address'),
      dataIndex: 'address',
      key: 'address',
      render: (text, record) => {
        const editable = record.userId === editingUserId;
        return editable ? (
          <Input
            value={currentUserData.address}
            onChange={(e) => setCurrentUserData(prev => ({ ...prev, address: e.target.value }))}
          />
        ) : (
          text
        );
      },
      width: 200,
    },
    visibleColumns.mobileNo && {
      title: t('mobileNo'),
      dataIndex: 'mobileNo',
      key: 'mobileNo',
      render: (text, record) => {
        const editable = record.userId === editingUserId;
        return editable ? (
          <Input
            value={currentUserData.mobileNo}
            onChange={(e) => setCurrentUserData(prev => ({ ...prev, mobileNo: e.target.value }))}
          />
        ) : (
          text
        );
      },
      width: 120,
    },
    {
      title: t('actions'),
      key: 'actions',
      width: 200,
      render: (text, record) => {
        const editable = record.userId === editingUserId;
        return editable ? (
          <Space>
            <Button
              icon={<SaveOutlined />}
              onClick={() => handleSave(record)}

              className={`${customDark === "dark-dark" ? `${customMid} text-white border-1 ${customDarkBorder}` : `${customLight} border-1 ${customDarkText} `} ${customDarkBorder} d-flex align-items-center gap-1`}

            >
              <span className="ms-1">{t('save')}</span>
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancel}

              className={`${customDark === "dark-dark" ? `${customMid} text-white border-1 ${customDarkBorder}` : `${customLight} border-1 ${customDarkText} `} ${customDarkBorder} d-flex align-items-center gap-1`}

            >
              <span className="ms-1">{t('cancel')}</span>
            </Button>
          </Space>
        ) : (
          <Space size="middle" wrap>
            <Button
              icon={<EyeOutlined />}
              onClick={() => showUserDetails(record)}
              type="default"

              className={`${customDark === "dark-dark" ? `${customMid} text-white border-1 ${customDarkBorder}` : `${customLight} border-1 ${customDarkText} `} ${customDarkBorder} d-flex align-items-center gap-1`}

            >
              <span className="ms-1">{t('view')}</span>
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              type="primary"
              className={`${customDark}  border-1 ${customLightText}  ${customDarkBorder} d-flex align-items-center gap-1`}
              disabled={isEditDisabled(record)}

            >
              {/* {console.log(isEditDisabled(record))} */}
              <span className="ms-1">{t('edit')}</span>
            </Button>
          </Space>
        );
      },
    },
  ].filter(Boolean), [visibleColumns, isValidImageUrl, editingUserId, currentUserData, handleSave, handleCancel, customBtn, roles, t]);

  const showUserDetails = useCallback((user) => {
    setCurrentUser(user);
    setModalOpen(true);
  }, []);

  const showDeleteConfirmation = useCallback((user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!userToDelete) return;

    try {
      const response = await API.delete(`/User/delete/${userToDelete.userId}`);
      if (response.status === 200) {
        setUsers(users.filter(user => user.userId !== userToDelete.userId));
        success(t('userDeletedSuccessfully'));
      } else {
        error(t('failedToDeleteUser'));
      }
    } catch (error) {
      console.error(t("errorDeletingUser"), error);
      error(t('errorOccurredWhileDeletingUser'));
    } finally {
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  }, [userToDelete, users, t]);

  const menu = (
    <Menu onClick={({ key }) => handleFilterChange(key)}>
      <Menu.Item key="name">{t('filterByName')}</Menu.Item>
    </Menu>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2 className={`${customDark === "dark-dark" || customDark === "blue-dark" ? `text-white` : `${customDarkText}`}  text-start`}>{t('viewAllUsers')}</h2>
      <Row className="mb-2">
        <Col lg={2} md={1} xs={12} className="mb-3 mb-md-0">
          <div className="d-flex align-items-center h-100">
            <Dropdown overlay={menu} trigger={['click']} className="border-0">
              <Button icon={<BsFunnelFill size={20} className={`${customDark === "dark-dark" ? "text-dark" : customDarkText} border-0`} />}>
              </Button>
            </Dropdown>
            {filterType !== 'none' && (
              <Button
                icon={<AiFillCloseSquare size={25} className={`${customBtn} rounded`} />}
                onClick={clearFilters}
                className={`ms-2`}
              />
            )}
          </div>
        </Col>
        <Col lg={8} md={7} xs={12} className="mb-3 mb-md-0">
          <div className="d-flex justify-content-start align-items-center h-100">
            {filterType === 'name' && (
              <Input.Search
                placeholder={t("searchByName")}
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                style={{ width: '100%' }}
                allowClear
              />
            )}
          </div>
        </Col>
        <Col lg={12} md={12} xs={12}>
          <div className={`d-flex ${window.innerWidth >= 992 ? 'flex-row' : 'flex-column'} justify-content-lg-end justify-content-md-end justify-content-center align-items-center h-100 gap-3`}>
            {['profilePicture', 'address', 'mobileNo'].map((column) => (
              <Checkbox
                key={column}
                checked={visibleColumns[column]}
                onChange={(e) => handleColumnVisibilityChange(e, column)}
                className={`${customDark === "dark-dark" ? customDarkText : customDarkText} text-start me-lg-3 me-md-2 me-1 ${window.innerWidth < 992 ? 'w-100' : ''}`}
              >
                {t(column)}
              </Checkbox>
            ))}
          </div>
        </Col>
      </Row>

      <Table
        striped
        columns={columns}
        dataSource={filteredData}
        pagination={{
          current: currentPage,  // Pass current page to the pagination component
          pageSize: pageSize,  // Set the page size
          total: filteredData.length,  // Total number of items for pagination
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '30'],
          showTotal: (total, range) => `${range[0]}-${range[1]} ${t('of')} ${total} ${t('items')}`,
          onChange: handlePaginationChange, // Handle page change
          onShowSizeChange: handlePageSizeChange, // Handle page size change
          style: { backgroundColor: 'white' },
          className: 'custom-pagination p-3 rounded-3 rounded-top-0',
        }}
        bordered
        rowKey="userId"
        scroll={{ x: 'max-content' }}
        size={isMobile ? "small" : "middle"}
        className={`${customDark === "default-dark" ? "thead-default" : ""}
                    ${customDark === "red-dark" ? "thead-red" : ""}
                    ${customDark === "green-dark" ? "thead-green" : ""}
                    ${customDark === "blue-dark" ? "thead-blue" : ""}
                    ${customDark === "dark-dark" ? "thead-dark" : ""}
                    ${customDark === "pink-dark" ? "thead-pink" : ""}
                    ${customDark === "purple-dark" ? "thead-purple" : ""}
                    ${customDark === "light-dark" ? "thead-light" : ""}
                    ${customDark === "brown-dark" ? "thead-brown" : ""} `}
      />
      <Modal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        size={isMobile ? "sm" : "lg"}
        centered
      >
        <Modal.Header className={`${customDark} d-flex justify-content-between align-items-center`}>
          <Modal.Title className={`${customLightText}`}>{t("userDetails")}</Modal.Title>
          <AiFillCloseSquare
            size={35}
            onClick={() => setModalOpen(false)}
            className={`rounded-2 ${customDark === "dark-dark" ? "text-dark bg-white " : `${customDark} custom-zoom-btn text-white  ${customDarkBorder}`}`}
            aria-label={t("close")}
            style={{ cursor: 'pointer', fontSize: '1.5rem' }}
          />
        </Modal.Header>
        <Modal.Body>
          {currentUser && (
            <Row className="g-3">
              <Col xs={12} md={12} className="d-flex justify-content-center align-items-center mb-3">
                <img
                  src={
                    currentUser.profilePicturePath && isValidImageUrl(`${BaseUrl}/${currentUser.profilePicturePath}`)
                      ? `${BaseUrl}/${currentUser.profilePicturePath}`
                      : SampleUser
                  }
                  alt={currentUser.profilePicturePath ? t("profile") : t("sampleUser")}
                  style={{ width: '100%', maxWidth: '200px', height: 'auto', objectFit: 'cover' }}
                  className="rounded-circle"
                />
              </Col>
              <Col xs={12} md={12}>
                {isMobile ? (
                  Object.entries(currentUser).map(([key, value]) => {
                    if (key !== 'profilePicturePath' && key !== 'userId' && value !== null && value !== undefined && value !== '') {
                      if (key === 'roleId') {
                        const role = roles.find(r => r.roleId === value);
                        return (
                          <div key={key} className="mb-2">
                            <strong>{t('role')}:</strong> {role ? role.roleName : value}
                          </div>
                        );
                      }
                      return (
                        <div key={key} className="mb-2">
                          <strong>{t(key)}:</strong> {value}
                        </div>
                      );
                    }
                    return null;
                  })
                ) : (
                  <dl className="row g-2">
                    {Object.entries(currentUser).map(([key, value]) => {
                      if (key !== 'profilePicturePath' && key !== 'userId' && value !== null && value !== undefined && value !== '') {
                        if (key === 'roleId') {
                          const role = roles.find(r => r.roleId === value);
                          return (
                            <React.Fragment key={key}>
                              <dt className="col-sm-5">{t('role')}</dt>
                              <dd className="col-sm-7">{role ? role.roleName : value}</dd>
                            </React.Fragment>
                          );
                        }
                        return (
                          <React.Fragment key={key}>
                            <dt className="col-sm-5">{t(key)}</dt>
                            <dd className="col-sm-7">{value}</dd>
                          </React.Fragment>
                        );
                      }
                      return null;
                    })}
                  </dl>
                )}
              </Col>
            </Row>
          )}
        </Modal.Body>
      </Modal>
      <Modal
        show={deleteModalOpen}
        onHide={() => setDeleteModalOpen(false)}
        centered
        className={` ${customLightText}`}
      >
        <Modal.Header closeButton={false} className={`${customDark} ${customLightText} d-flex justify-content-between`}>
          <Modal.Title>{t('confirmDelete')}</Modal.Title>
          <Button
            variant="link"
            className={`close-button ${customDark} ${customLightText} border-0 d-flex align-items-center gap-1`}
            style={{ padding: 0, fontSize: 18 }}
            onClick={() => setDeleteModalOpen(false)}
          >
            <AiFillCloseSquare size={40} className='rounded-5 ' />
          </Button>
        </Modal.Header>
        <Modal.Body className={`${customMid} ${customLightText}`}>
          {userToDelete && (
            <div className="text-center">
              <img
                src={
                  userToDelete.profilePicturePath && isValidImageUrl(`${BaseUrl}/${userToDelete.profilePicturePath}`)
                    ? `${BaseUrl}/${userToDelete.profilePicturePath}`
                    : SampleUser
                }
                alt={userToDelete.profilePicturePath ? t("profile") : t("sampleUser")}
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                className="rounded-circle mb-3"
              />
              <p className={`${customDark === 'dark-dark' || customDark === 'blue-dark' ? customLightText : customDarkText}`}>
                {t('confirmDeleteUser', { firstName: userToDelete.firstName, lastName: userToDelete.lastName })}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className={`${customDark} ${customLightText}`}>
          <Button
            className={`${customDark === "dark-dark" ? `${customMid} text-white` : `${customLight} border-1 ${customDarkText}`} ${customDarkBorder} d-flex align-items-center gap-1`}
            onClick={() => setDeleteModalOpen(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            className={`${customDark === "dark-dark" ? `${customMid} text-white` : `${customLight} border-1 ${customDarkText}`} ${customDarkBorder} d-flex align-items-center gap-1`}
            onClick={handleDelete}
          >
            {t('delete')}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AllUsers;