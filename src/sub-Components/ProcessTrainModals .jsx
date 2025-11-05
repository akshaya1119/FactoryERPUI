import React, { useState } from 'react';
import { Button, Modal, Table, Input } from 'antd';
import API from '../CustomHooks/MasterApiHooks/api';
import { useEffect } from 'react';
import { useStore } from 'zustand';
import themeStore from '../store/themeStore';
import { CloseOutlined, SearchOutlined } from '@ant-design/icons';

const ProcessTrainModals = ({ ProjectID, lotNumber, ProcessID, status, setModalVisible }) => {
  console.log(ProjectID, lotNumber, ProcessID, status );
  const { getCssClasses } = useStore(themeStore);
  const [
    customDark,
    customMid,
    customLight,
    customBtn,
    customDarkText,
    customLightText,
    customLightBorder,
    customDarkBorder,
    customThead,
  ] = getCssClasses();


  const getModalTitle = () => {
    switch (status) {
      case 'Pending':
        return 'Pending';
      case 'WIP':
        return 'Work In Progress';
      case 'Completed':
        return 'Completed';
      default:
        return '';
    }
  };

  const rowClassName = (record) => {
    switch (record.status) {
      case 0:
        return "status-pending-row";
      case 1:
        return "status-started-row";
      case 2:
        return "status-completed-row";
      default:
        return "";
    }
  };

  const getStatusforAPi = () => {
    switch(status){
      case 'Pending':
        return 0;
      case 'WIP':
        return 1;
      case 'Completed':
        return 2;
    }
  }

  const [data, setData]  = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  const columns = [
    {
      title: 'Catch No',
      dataIndex: 'catchNo',
      key: 'catchNo',
      sorter: (a, b) => a.catchNo.localeCompare(b.catchNo),
      fixed: 'left',
      align: 'center',
      width:'20%',
      responsive: ["sm","md"],
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center',
      sorter: (a, b) => a.quantity - b.quantity,
      // width:'40%'
      responsive: ["sm","md"],
    },
    {
      title: 'Exam Date',
      dataIndex: 'examDate',
      key: 'examDate',
      align: 'center',
      // width:'40%',
      responsive: ["sm","md"],
      render: (text) => text ? text.split('T')[0] : text
    },
    {
      title: 'Shift',
      dataIndex: 'examTime',
      key: 'examTime',
      align: 'center',
      // width:'40%',
      responsive: ["sm","md"],
    }
    // {
    //   title: 'Status',
    //   dataIndex: 'status',
    //   key: 'status',
    //   align: 'center',
    //   // width:'40%',
    //   responsive: ["sm","md"],
    //   sorter: (a, b) => a.status - b.status,
    //   render: () => (
    //     <span>
    //       {getModalTitle()}
    //     </span>
    //   ),
    // }
  ];

  useEffect(() => {
    setData([]);
    console.log(ProjectID, lotNumber, ProcessID, status);
    const getData = async () => {
      const response = await API.get(`Transactions/StatusDetails?projectId=${ProjectID}&LotNo=${lotNumber}&ProcessIDFilter=${ProcessID}&StatustoFind=${getStatusforAPi()}`);
      const dataFromApi = response.data;
      console.log(dataFromApi);
      setData(dataFromApi);
      setFilteredData(dataFromApi);
    };
    getData();
  }, [ ProjectID, lotNumber, ProcessID, status]);

  const handleSearch = (value) => {
    setSearchText(value);
    const searchResult = data.filter((item) => {
      return Object.values(item).some((val) => 
        String(val).toLowerCase().includes(value.toLowerCase())
      );
    });
    setFilteredData(searchResult);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Input.Search
          placeholder="Search within this table"
          allowClear
          enterButton={<SearchOutlined/>}
          size="middle"
          onSearch={handleSearch}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ width: 300 }}
        />
        <Button size="small" danger onClick={() => setModalVisible(false)}>
          <CloseOutlined className='fw-bold p' color=''/>
        </Button>
      </div>
      <Table
      tableLayout="auto"
      responsive={true}
      rowClassName={rowClassName}
        dataSource={filteredData}
        rowKey="quantitySheetId"
        className={`${customDark === "default-dark" ? "thead-default" : ""
        }
      ${customDark === "red-dark" ? "thead-red" : ""}
      ${customDark === "green-dark" ? "thead-green" : ""}
      ${customDark === "blue-dark" ? "thead-blue" : ""}
      ${customDark === "dark-dark" ? "thead-dark" : ""}
      ${customDark === "pink-dark" ? "thead-pink" : ""}
      ${customDark === "purple-dark" ? "thead-purple" : ""}
      ${customDark === "light-dark" ? "thead-light" : ""}
      ${customDark === "brown-dark" ? "thead-brown" : ""} `}
      columns={columns}
       
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1020 }}
        size="middle"
      />
    </div>
  );
};

export default ProcessTrainModals;