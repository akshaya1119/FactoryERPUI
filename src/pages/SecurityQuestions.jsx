import React, { useState, useEffect } from 'react';
import { Form, Button, InputGroup, FormControl } from 'react-bootstrap';
import { Table, Input } from 'antd';
import API from '../CustomHooks/MasterApiHooks/api';
import themeStore from '../store/themeStore';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { success, error } from '../CustomHooks/Services/AlertMessageService';
import { message } from 'antd';

const { Search } = Input;

const SecurityQuestions = () => {
  const { t, i18n } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText] = getCssClasses();

  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await API.get('/SecurityQuestions');
      if (response.status === 200) {
        const formattedQuestions = response.data.map((item, index) => ({
          key: item.questionId,
          sr: index + 1,
          questionId: item.questionId,
          question: item.securityQuestions
        }));
        setQuestions(formattedQuestions);
      } else {
        error(t('failedToFetchQuestions'));
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      error(t('errorOccurredWhileFetchingQuestions'));
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (newQuestion.trim() === '') {
      error(t('pleaseEnterQuestion'));
      return;
    }

    setLoading(true);

    try {
      const response = await API.post('/SecurityQuestions', { securityQuestions: newQuestion });

      if (response.status === 201) {
        success(t('questionAddedSuccessfully'));
        setNewQuestion('');
        await fetchQuestions();
      } else {
        console.error('Unexpected response status:', response.status);
        error(t('failedToAddQuestion'));
      }
    } catch (err) {
      console.error('Error adding question:', err);
      error(t('errorOccurredWhileAddingQuestion'));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: t('sr'),
      dataIndex: 'sr',
      key: 'sr',
      width: 70,
      align: 'center',
      sorter: (a, b) => a.sr - b.sr,
    },
    {
      title: t('question'),
      dataIndex: 'question',
      key: 'question',
      sorter: (a, b) => a.question.localeCompare(b.question),
      filteredValue: [searchText],
      onFilter: (value, record) =>
        record.question.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: t('questionId'),
      dataIndex: 'questionId',
      key: 'questionId',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.questionId - b.questionId,
    }
  ];

  const filteredData = questions.filter(item =>
    Object.values(item).some(val =>
      val.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  return (
    <div className="container-fluid">
      <div className="row mb-3">
        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <Search
            placeholder={t('searchQuestions')}
            allowClear
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            className="w-100"
            style={{ height: '38px' }}
          />
        </div>
        <div className="col-12 col-md-8 d-flex justify-content-end">
          <Form className="d-flex align-items-center">
            <FormControl
              type="text"
              placeholder={t('enterYourSecurityQuestion')}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="me-2"
              disabled={loading}
              style={{ height: '38px', width: '300px' }}
            />
            <Button
              onClick={addQuestion}
              disabled={newQuestion.trim() === '' || loading}
              className={`${customBtn} ${customDark === "dark-dark" ? "border" : "border-0"}`}
              style={{ height: '38px', width: '150px', fontSize: '16px' }}
            >
              {loading ? t('adding') : t('addQuestion')}
            </Button>
          </Form>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          total: filteredData.length,
          pageSize: 5,
          showSizeChanger: true,
          showTotal: (total) => t('totalItems', { total }),
          className: 'bg-white p-3 rounded rounded-top-0'
        }}
        className={`${customDark === "default-dark" ? "thead-default" : ""}
                                    ${customDark === "red-dark" ? "thead-red" : ""}
                                    ${customDark === "green-dark" ? "thead-green" : ""}
                                    ${customDark === "blue-dark" ? "thead-blue" : ""}
                                    ${customDark === "dark-dark" ? "thead-dark" : ""}
                                    ${customDark === "pink-dark" ? "thead-pink" : ""}
                                    ${customDark === "purple-dark" ? "thead-purple" : ""}
                                    ${customDark === "light-dark" ? "thead-light" : ""}
                                    ${customDark === "brown-dark" ? "thead-brown" : ""} `}
        size="middle"
        bordered
      />
    </div>
  );
};

export default SecurityQuestions;
