import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Table, Input, Spin} from 'antd';
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import themeStore from '../store/themeStore';
import { useStore } from 'zustand';

const { Search } = Input;

const CuDetailedAgGrid = ({ projectId , clickedProject }) => {
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
    customThead
  ] = getCssClasses();
  const { t } = useTranslation();
  const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
  const [isLoading, setIsLoading] = useState(true);
  const [rowData, setRowData] = useState([]);
  const [processNames, setProcessNames] = useState({});
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    // Fetch process names
    const fetchProcessNames = async () => {
      setIsLoading(prev => ({ ...prev, processes: true }));
      try {
        const response = await API.get('/Processes');
        const processMap = {};
        response.data.forEach(process => {
          processMap[process.id] = process.name;
        });
        setProcessNames(processMap);
      } catch (error) {
        console.error('Error fetching process names:', error);
      }
      finally {
        setIsLoading(prev => ({ ...prev, processes: false }));
      }
    };

    fetchProcessNames();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (projectId) {
        setIsLoading(prev => ({ ...prev, processes: true })); 
        try {
          const response = await API.get(`/Transactions/process-lot-percentages?projectId=${projectId}`);
          const processData = response.data.processes.map((process, index) => ({
            key: index,
            sn: index + 1,
            processName: processNames[process.processId] || `Process ${process.processId}`,
            totalCatch: process.statistics.totalSheets,
            remainingCatch: process.statistics.totalSheets - process.statistics.completedSheets,
            totalQuantity: process.statistics.totalQuantity,
          }));
          setRowData(processData);
          setFilteredData(processData);
        } catch (error) {
          console.error('Error fetching process data:', error);
        }
        finally {
          setIsLoading(prev => ({ ...prev, processes: false }));
        }
      }
    };

    if (Object.keys(processNames).length > 0) {
      fetchData();
    }
  }, [projectId, processNames]);

  useEffect(() => {
    const filtered = rowData.filter(item => 
      Object.values(item).some(val => 
        val?.toString().toLowerCase().includes(searchText.toLowerCase())
      )
    );
    setFilteredData(filtered);
  }, [searchText, rowData]);

  const columns = [
    {
      title: t('sn'),
      dataIndex: 'sn',
      key: 'sn',
      width: 140,
      align: 'center',
      className: 'border-right',
      sorter: (a, b) => a.sn - b.sn,
      ellipsis: true
    },
    {
      title: t('processes'),
      dataIndex: 'processName',
      key: 'processName',
      width: 140,
      className: 'border-right',
      sorter: (a, b) => a.processName.localeCompare(b.processName),
      ellipsis: true
    },
    {
      title: t('totalCatches'),
      dataIndex: 'totalCatch',
      key: 'totalCatch',
      width: 140,
      align: 'center',
      className: 'border-right',
      sorter: (a, b) => a.totalCatch - b.totalCatch,
      ellipsis: true
    },
    {
      title: t('remainingCatches'),
      dataIndex: 'remainingCatch',
      key: 'remainingCatch',
      width: 180,
      align: 'center',
      className: 'border-right',
      sorter: (a, b) => a.remainingCatch - b.remainingCatch,
      ellipsis: true
    },
    {
      title: t('totalQuantity'),
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 140,
      align: 'center',
      className: 'border-right',
      sorter: (a, b) => a.totalQuantity - b.totalQuantity,
      ellipsis: true
    }
  ];

  const tableStyle = {
    '.ant-table': {
      width: '100%',
      overflowX: 'auto',
      display: 'block'
    },
    '.ant-table-container': {
      width: '100%'
    },
    '.ant-table-header': {
      overflow: 'hidden !important'
    },
    '.ant-table-cell': {
      whiteSpace: 'nowrap',
      minWidth: '80px'
    }
  };

  return (
    <div style={containerStyle}>
      <div id="grid-wrapper" style={{ width: '100%', height: '100%', margin: 'auto', padding: '0 10px' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px',
          marginBottom: '15px',
          '@media (min-width: 768px)': {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }
        }}>
          <h4 className={`${customDarkText} m-0`}>
            {clickedProject || t("selectProject")}
          </h4>
          <Search
            placeholder={t('search')}
            allowClear
            onChange={e => setSearchText(e.target.value)}
            style={{ width: '100%', maxWidth: '300px' }}
          />
        </div>
        <div style={{ width: '100%', overflowX: 'auto' }}>
          {(isLoading.processes || isLoading.data) ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
              <Spin size="large" tip={t('loading')} />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={filteredData}
              pagination={{
                position: ['bottomCenter'],
                pageSize: 8,
                showSizeChanger: true,
                pageSizeOptions: ['8', '10', '20', '50'],
                showTotal: (total) => `${t("total")} ${total} ${t("items")}`,
                className: `${customDark === "dark-dark"? "bg-white" : `${customMid}`} p-2 rounded-bottom border`,
                responsive: true
              }}
              size="small"
              bordered
              scroll={{ x: '100%' }}
              rowClassName={(record, index) => index % 2 === 0 ? 'striped-row' : ''}
              className={`${customDark === "default-dark" ? "thead-default" : ""}
                ${customDark === "red-dark" ? "thead-red" : ""}
                ${customDark === "green-dark" ? "thead-green" : ""}
                ${customDark === "blue-dark" ? "thead-blue" : ""}
                ${customDark === "dark-dark" ? "thead-dark" : ""}
                ${customDark === "pink-dark" ? "thead-pink" : ""}
                ${customDark === "purple-dark" ? "thead-purple" : ""}
                ${customDark === "light-dark" ? "thead-light" : ""}
                ${customDark === "brown-dark" ? "thead-brown" : ""} responsive-table`}
              style={{
                ...tableStyle,
                width: '100%',
                minWidth: '100%'
              }}
              locale={{
                emptyText: (
                  <div style={{ padding: '24px 0' }}>
                    <p>{t('noDataAvailable')}</p>
                  </div>
                )
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CuDetailedAgGrid;