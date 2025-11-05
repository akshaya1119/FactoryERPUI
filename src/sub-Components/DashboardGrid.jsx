import React, { useMemo, useState, useCallback, useEffect } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-quartz.css";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import { ModuleRegistry } from "@ag-grid-community/core";
import "./../styles/DashboardGrid.css";
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';


// Register AG Grid Modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const DashboardGrid = ({ projectId, lotNo }) => {
  const { t } = useTranslation();
  // Set grid container width to 800px and allow it to take full height
  const containerStyle = useMemo(() => ({ height: "100vh" }), []);

  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

  const [rowData, setRowData] = useState([]);
  const [transactionData, setTransactionData] = useState([]); // Added to hold transaction data
  const [isLoading, setIsLoading] = useState({
    transactions: true,
    transactionData: true
  });




  const getColumnDefs = useCallback(() => [
    {
      field: "quantitySheetId",
      headerName: t('srNo'),
      cellStyle: { textAlign: "center" },
      headerClass: "center-header",
      valueGetter: (params) => {
        // Get the index of the current row and add 1 to start from 1 instead of 0
        return params.node.rowIndex + 1;
      }
    },
    { field: "catchNo", headerName: t('catchNo'), cellStyle: { textAlign: "center" }, headerClass: "center-header" },
    { field: "paper", headerName: t('paper'), cellStyle: { textAlign: "center" }, headerClass: "center-header" },
    { field: "course", headerName: t('course'), cellStyle: { textAlign: "center" }, headerClass: "center-header" },
    { field: "subject", headerName: t('subject'), cellStyle: { textAlign: "center" }, headerClass: "center-header" },
    { field: "innerEnvelope", headerName: t('innerEnvelope'), cellStyle: { textAlign: "center" }, headerClass: "center-header" },
    { field: "outerEnvelope", headerName: t('outerEnvelope'), cellStyle: { textAlign: "center" }, headerClass: "center-header" },
    { field: "quantity", headerName: t('quantity'), cellStyle: { textAlign: "center" }, headerClass: "center-header" },
    { field: "percentageCatch", headerName: t('percentageCatch'), cellStyle: { textAlign: "center" }, headerClass: "center-header", valueFormatter: params => params.value.toFixed(2) },
    {
      field: "status", headerName: t('status'), cellStyle: { textAlign: "center" }, headerClass: "center-header", valueFormatter: params => {
        const transactionStatus = transactionData.find(transaction => transaction.catchNo === params.data.catchNo)?.status;
        switch (transactionStatus) {
          case 1:
            return t('started');
          case 2:
            return t('completed');
          default:
            return t('pending');
        }
      }
    },
  ], [t, transactionData]);

  const [columnDefs, setColumnDefs] = useState(getColumnDefs());

  const defaultColDef = useMemo(() => ({
    editable: true,
    filter: true,
    resizable: true,
    flex: 1 // This will make columns use the available space
  }), []);

  // Auto-size columns when the grid is ready
  const onGridReady = useCallback((params) => {
    setTimeout(() => {
      const allColumnIds = params.columnApi.getAllColumns().map(col => col.getId());
      params.columnApi.autoSizeColumns(allColumnIds, false);
    }, 0);
  }, []);

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(prev => ({ ...prev, transactions: true }));
      try {
        if (lotNo && projectId) {
          const response = await API.get(`/QuantitySheet/Catch?ProjectId=${projectId}&lotNo=${lotNo}`);
          setRowData(response.data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
      finally {
        setIsLoading(prev => ({ ...prev, transactions: false }));
      }
    };

    const fetchTransactionData = async () => {
      setIsLoading(prev => ({ ...prev, transactionData: true }));
      try {
        if (lotNo && projectId) {
          const response = await API.get(`/Transactions?ProjectId=${projectId}&ProcessId=${lotNo}`);
          setTransactionData(response.data);
        }
      } catch (error) {
        console.error("Error fetching transaction data:", error);
      }
      finally {
        setIsLoading(prev => ({ ...prev, transactionData: false }));
      }
    };

    fetchTransactions();
    fetchTransactionData();
  }, [projectId, lotNo]);

  useEffect(() => {
    setColumnDefs(getColumnDefs());
  }, [t, transactionData, getColumnDefs]);

  const localeTextFunc = useCallback((key, defaultValue) => {
    // Map AG Grid's pagination text keys to your translation keys
    const translationMap = {
      'Page Size': 'pageSize',
      'of': 'of',
      'to': 'to',
      'of Page': 'ofPage',
      'Page': 'page'
    };
    return t(translationMap[key] || key);
  }, [t]);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      {isLoading.transactions || isLoading.transactionData ? (
        <div className="d-flex justify-content-center align-items-center h-100">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">{t('loading')}</span>
          </Spinner>
        </div>
      ) : (
        <div style={{ height: '100%', width: '100%' }} className="ag-theme-quartz-dark">
          <AgGridReact
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            paginationPageSize={10}
            pagination={true}
            autoHeight={true}
            width={300}
            height={300}
            localeText={{
              page: t('page'),
              to: t('to'), 
              of: t('of'),
              pageSize: t('pageSize')
            }}
            paginationOptions={{
              pageSize: 10,
              pageSizes: [10, 25, 50],
            }}
            overlayLoadingTemplate={
              '<span class="ag-overlay-loading-center">' + t('loading') + '</span>'
            }
            overlayNoRowsTemplate={
              '<span class="ag-overlay-no-rows-center">' + t('noDataAvailable') + '</span>'
            }
          />
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;
