/**
 * Labels Component: Handles label management operations
 * Created by Shivom on 2023-10-08
 * 
 * This component uses the textLabelService for API requests
 */

import React, { useState, useEffect } from 'react';
import { Table, Input, Pagination, Button } from 'antd';
import { Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import useLanguageStore from '../../store/languageStore';
import themeStore from '../../store/themeStore';
import { useStore } from 'zustand';
import { fetchTextLabels, addTextLabel, updateTextLabel } from '../../CustomHooks/ApiServices/textLabelSevice';
import { EditOutlined } from '@ant-design/icons';
import { useUserData } from '../../store/userDataStore';
import AddMessage from './AddMessage';
import { success, error } from '../../CustomHooks/Services/AlertMessageService';

const Message = () => {
  const userData = useUserData();
  const [labels, setLabels] = useState([]);
  const [formData, setFormData] = useState({
    textLabelId: '',
    labelKey: '',
    englishLabel: '',
    hindiLabel: '',
  });
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ text: '', type: '' });
  const [showAlert, setShowAlert] = useState(false);
  const { t } = useTranslation();
  const { language } = useLanguageStore();

  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;
  const isDeveloper = userData.role.roleId === 1;

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    try {
      const response = await fetchTextLabels();
      setLabels(response);
    } catch (err) {
      console.error('Error fetching labels:', err);
      error(t('Failed to fetch labels'));
    }
  };

  const columns = [
    {
      title: t('id'),
      dataIndex: 'textLabelId',
      key: 'textLabelId',
      sorter: (a, b) => a.textLabelId - b.textLabelId,
    },
    {
      title: t('key'),
      dataIndex: 'labelKey',
      key: 'labelKey',
      sorter: (a, b) => a.labelKey.localeCompare(b.labelKey),
    },
    {
      title: t('englishLabel'),
      dataIndex: 'englishLabel',
      key: 'englishLabel',
      sorter: (a, b) => a.englishLabel.localeCompare(b.englishLabel),
    },
    {
      title: t('hindiLabel'),
      dataIndex: 'hindiLabel',
      key: 'hindiLabel',
      sorter: (a, b) => a.hindiLabel.localeCompare(b.hindiLabel),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record) => (
        <div className="d-flex justify-content-center">
          <Button
            onClick={() => handleEdit(record)}
            className={`${customBtn} ${customLightBorder} btn-sm d-flex align-items-center`}
          >
            <EditOutlined className="me-1" />
            <span className="d-none d-sm-inline">{t('edit')}</span>
          </Button>
        </div>
      ),
    },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setShowAlert(false);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      if (showAddForm) {
        const { labelKey, englishLabel, hindiLabel } = formData;
        await addTextLabel({ labelKey, englishLabel, hindiLabel });
        success(t('labeladdedsuccess'));
        setShowAddForm(false);
      } else {
        await updateTextLabel(formData.textLabelId, formData);
        success(t('labelUpdatedSuccess'));
        setShowEditForm(false);
      }
      fetchLabels();
    } catch (err) {
      console.error('Error submitting form:', err);
      error(t('failedToSubmitLabel'));
    }
  };

  const handleEdit = (record) => {
    setFormData(record);
    setShowEditForm(true);
    setShowAlert(false);
  };

  const handleAdd = () => {
    setFormData({ textLabelId: '', labelKey: '', englishLabel: '', hindiLabel: '' });
    setShowAddForm(true);
    setShowAlert(false);
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const filteredLabels = labels.filter((label) =>
    Object.values(label).some((val) =>
      val.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const paginatedLabels = filteredLabels.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleModalClose = () => {
    setShowEditForm(false);
    setShowAddForm(false);
  };

  return (
    <div className={`container ${customLight} rounded py-2 shadow-lg ${customDark === "dark-dark" ? `border` : ``}`}>
      <h2 className={`text-center mt-2 ${customDarkText}`}>
        {t('messageManagement')}
      </h2>
      {showAlert && (
        <Alert variant={alertMessage.type} onClose={() => setShowAlert(false)} dismissible>
          {t(alertMessage.text)}
        </Alert>
      )}



      <div className="mt-4">
        <div className="d-flex justify-content-between mb-3">
          <div>
            {isDeveloper && (
              <Button onClick={handleAdd} className={`${customBtn} ${customLightBorder}`}>
                {t('addMessage')}
              </Button>
            )}
          </div>
          <div className="d-flex gap-3">
            <Input.Search
              placeholder={t('searchMessages')}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 300 }}
            />
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={paginatedLabels}
          pagination={false}
          scroll={{ x: true }}
          bordered
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
        <div className={`d-flex justify-content-end mt-3 ${customDark === "dark-dark" ? "bg-white" : ""} rounded rounded-2 rounded-top-0 p-2`}>
          <Pagination
            current={currentPage}
            total={filteredLabels.length}
            pageSize={pageSize}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
          />
        </div>
      </div>
      <AddMessage
        showEditForm={showEditForm}
        showAddForm={showAddForm}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        formData={formData}
        onCancel={handleModalClose}
        customDark={customDark}
        customMid={customMid}
        customLight={customLight}
        customBtn={customBtn}
        customDarkText={customDarkText}
        customLightText={customLightText}
        customLightBorder={customLightBorder}
        customDarkBorder={customDarkBorder}
      />
    </div>
  );
};

export default Message;