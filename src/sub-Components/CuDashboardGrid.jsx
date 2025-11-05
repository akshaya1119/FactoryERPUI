// This component has not been used yet

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import Data from './../store/CuAgGrid.json';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import themeStore from '../store/themeStore';
import { useStore } from 'zustand';
// Register AG Grid Modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const CuDashboardGrid = ({ setClickData }) => {
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
  const [hasProcesses, setHasProcesses] = useState(false);
  const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);

  // Use your local JSON data
  const [rowData, setRowData] = useState(Data);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Assuming Data is imported from your JSON file
        setRowData(Data);
        setClickData(Data?.[0]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  useEffect(() => {
    setClickData(rowData?.[0]);
  }, []);

  const onRowClicked = useCallback((params) => {
    // Update the clicked data using setClickData prop
    setClickData(params.data);
  }, [setClickData]);

  // Set the columns for S.No, Project Name, Percentage of Completion, and Percentage of Remaining
  const columnDefs = useMemo(() => [
    {
      headerName: 'S.No',
      valueGetter: (params) => params.node.rowIndex + 1, // This generates the serial number
      minWidth: 70,
      maxWidth: 90,
      cellStyle: { textAlign: 'center', borderLeft:'1px solid #ccc', borderRight:'1px solid #ccc'  },
    },
    { 
      field: 'projectName', 
      headerName: 'Project Name', 
      minWidth: 150, 
      cellStyle: { textAlign: 'center', borderRight:'1px solid #ccc' },
      onCellClicked: (params) => {
        onRowClicked(params);
      }
    },
    { field: 'completionPercentage', headerName: 'Completion %', minWidth: 100, cellStyle: { textAlign: 'center', borderRight:'1px solid #ccc' } },
    { field: 'remainingPercentage', headerName: 'Remaining %', minWidth: 100, cellStyle: { textAlign: 'center', borderRight:'1px solid #ccc' } },
  ], [onRowClicked]);

  // Apply striped row styling using getRowClass
  const getRowClass = useCallback((params) => {
    return params.node.rowIndex % 2 === 0 ? 'striped-row' : '';
  }, []);

  const onGridSizeChanged = useCallback((params) => {
    const gridWidth = document.querySelector('.ag-body-viewport').clientWidth;
    const columnsToShow = [];
    const columnsToHide = [];
    let totalColsWidth = 0;

    const allColumns = params.columnApi.getAllColumns();
    if (allColumns && allColumns.length > 0) {
      for (let i = 0; i < allColumns.length; i++) {
        const column = allColumns[i];
        totalColsWidth += column.getMinWidth();
        if (totalColsWidth > gridWidth) {
          columnsToHide.push(column.getColId());
        } else {
          columnsToShow.push(column.getColId());
        }
      }
    }

    params.columnApi.setColumnsVisible(columnsToShow, true);
    params.columnApi.setColumnsVisible(columnsToHide, false);

    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 10);
  }, []);

  const onFirstDataRendered = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  return (
    <div style={containerStyle}>
      <div id="grid-wrapper" style={{ width: '100%', height: '100%' }}>
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <Spinner 
              animation="border" 
              role="status" 
              className={customDarkText}
            >
              <span className="visually-hidden">{t('loading')}</span>
            </Spinner>
          </div>
        ) : (
          <div style={gridStyle} className="ag-theme-quartz-dark">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              getRowClass={getRowClass}
              onGridSizeChanged={onGridSizeChanged}
              onFirstDataRendered={onFirstDataRendered}
              overlayLoadingTemplate={
                '<span class="ag-overlay-loading-center">' + t('loading') + '</span>'
              }
              overlayNoRowsTemplate={
                '<span class="ag-overlay-no-rows-center">' + t('noDataAvailable') + '</span>'
              }
              loadingOverlayComponent={LoadingOverlay}
              noRowsOverlayComponent={NoRowsOverlay}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const LoadingOverlay = () => {
  const { t } = useTranslation();
  return (
    <div className="d-flex justify-content-center align-items-center h-100">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">{t('loading')}</span>
      </Spinner>
    </div>
  );
};

// Custom No Rows Overlay Component
const NoRowsOverlay = () => {
  const { t } = useTranslation();
  return (
    <div className="d-flex justify-content-center align-items-center h-100">
      <div className="text-center">
        <h4>{t('noDataAvailable')}</h4>
        <p>{t('pleaseCheckYourData')}</p>
      </div>
    </div>
  );
};

export default CuDashboardGrid;
