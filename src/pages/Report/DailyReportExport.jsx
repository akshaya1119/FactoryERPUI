import React, { useState } from 'react';
import { Dropdown, Spinner } from 'react-bootstrap';
import { FaFileExcel, FaFilePdf, FaFileExport } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-toastify';
import API from "../../CustomHooks/MasterApiHooks/api";


/**
 * DailyReportExport component for exporting data from DailyReport
 * Supports both Excel and PDF export formats
 * Exports summary overview and transaction details data
 */
const DailyReportExport = ({
  selectedDate,
  startDate,
  endDate,
  selectedGroup,
  userId,
  groupName,
  processes,
  machines,
  zones,
  users,
  projectName,
  // New props for summary and transaction data
  productionSummaryData,
  productionReportData,
  projects,
  types,
  // Quick Task data
  quickTaskData,
  userMap,
  quickTaskGroupMap,
  quickTaskProjectMap
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState(null);

  // Helper function to get process name from process ID
  const getProcessName = (processId) => {
    const process = processes.find(p => p.id === processId);
    return process ? process.name : `Process ${processId}`;
  };

  // Helper function to get machine name from machine ID
  const getMachineName = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    return machine ? machine.name : `Machine ${machineId}`;
  };

  // Helper function to get zone name from zone ID
  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.name : `Zone ${zoneId}`;
  };

  // Helper function to get user name from user ID (kept for future use)
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.fullName : `User ${userId}`;
  };

  // Helper function to get project name from project ID
  const getProjectName = (projectId) => {
    if (!projectId) return 'N/A';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : `Project ${projectId}`;
  };

  // Helper function to get type name from type ID
  const getTypeName = (typeId) => {
    if (!typeId) return 'N/A';
    const type = types.find(t => t.id === typeId);
    return type ? type.name : `Type ${typeId}`;
  };

  // Helper function to format date and time - used in both export functions
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to format date only
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Function to fetch all transaction data
  const fetchAllTransactionData = async () => {
    try {
      // Format dates for API
      const formatDateForApi = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).replace(/\//g, '-');
      };

      // Prepare API parameters - use a large pageSize to get all records
      // This approach is more reliable than using a custom parameter
      const params = {
        page: 1,
        pageSize: 10000 // Use a very large page size to get all records
      };

      // Use date range if both start and end dates are provided
      if (startDate && endDate) {
        params.startDate = formatDateForApi(startDate);
        params.endDate = formatDateForApi(endDate);
        console.log(`Using date range: ${params.startDate} to ${params.endDate}`);
      } else if (selectedDate) {
        // Fall back to single date if date range is not provided
        params.date = formatDateForApi(selectedDate);
        console.log(`Using single date: ${params.date}`);
      }

      // Only add userId if it's selected
      if (userId) {
        params.userId = userId;
      }

      // Only add groupId if it's selected
      if (selectedGroup) {
        params.groupId = parseInt(selectedGroup);
      }

      console.log("Fetching all transaction data with params:", params);
      const response = await API.get(`/Reports/DailyReports`, { params });
      console.log("Fetched transaction data:", response.data);

      // If the API returns paginated data, use userTransactionDetails
      if (response.data && response.data.userTransactionDetails) {
        return response.data.userTransactionDetails || [];
      }

      // If the API returns an array directly
      if (Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error("Error fetching all transaction data:", error);

      return [];
    }
  };

  // Function to handle Summary Overview Excel export
  const handleSummaryExcelExport = async () => {
    setIsExporting(true);
    setExportType('summary-excel');

    try {
      if (!productionSummaryData || Object.keys(productionSummaryData).length === 0) {
        toast.warning('No summary data available to export.');
        return;
      }

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Define headers for summary overview
      const headers = [
        'Metric',
        'Count'
      ];

      // Prepare data for Excel
      const wsData = [headers];

      // Add summary data rows
      const summaryRows = [
        ['Groups', productionSummaryData.totalGroups || 0],
        ['Projects', productionSummaryData.totalProjects || 0],
        ['Total Lots', productionSummaryData.totalLots || 0],
        ['Total Catches', productionSummaryData.totalCountOfCatches || 0],
        ['Total Quantity', productionSummaryData.totalQuantity || 0]
      ];

      summaryRows.forEach(row => {
        wsData.push(row);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 },  // Metric
        { wch: 15 }   // Count
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Summary Overview");

      // Generate filename
      let dateStr = '';
      let filenameDateStr = '';
      if (startDate && endDate) {
        const startDateStr = new Date(startDate).toISOString().slice(0,10);
        const endDateStr = new Date(endDate).toISOString().slice(0,10);
        dateStr = `${startDateStr}_to_${endDateStr}`;
        filenameDateStr = `${startDateStr.replace(/-/g, '')}_to_${endDateStr.replace(/-/g, '')}`;
      } else if (selectedDate) {
        dateStr = new Date(selectedDate).toISOString().slice(0,10);
        filenameDateStr = dateStr.replace(/-/g, '');
      } else {
        dateStr = new Date().toISOString().slice(0,10);
        filenameDateStr = dateStr.replace(/-/g, '');
      }

      let fileName = `DailyReport_Summary_${groupName || 'All'}_${filenameDateStr}.xlsx`;

      if (projectName) {
        const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        fileName = `DailyReport_Summary_${safeProjectName}_${filenameDateStr}.xlsx`;
      }

      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error("Error exporting summary to Excel:", error);
      toast.error('Failed to export summary overview.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Function to handle Transaction Details Excel export
  const handleTransactionDetailsExcelExport = async () => {
    setIsExporting(true);
    setExportType('details-excel');

    try {
      if (!productionReportData || productionReportData.length === 0) {
        toast.warning('No transaction details available to export.');
        return;
      }

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Define headers for transaction details
      const headers = [
        'S.No',
        'Group Name',
        'Project Name',
        'Type Name',
        'Lot No',
        'Date Range (From)',
        'Date Range (To)',
        'Count of Catches',
        'Total Quantity'
      ];

      // Prepare data for Excel
      const wsData = [headers];

      // Add transaction data rows
      productionReportData.forEach((item, index) => {
        const row = [
          index + 1,
          item.groupName || '',
          getProjectName(item.projectId),
          getTypeName(item.typeId),
          item.lotNo || '',
          item.from || '',
          item.to || '',
          item.countOfCatches || 0,
          item.totalQuantity || 0
        ];
        wsData.push(row);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws['!cols'] = [
        { wch: 5 },   // S.No
        { wch: 15 },  // Group Name
        { wch: 25 },  // Project Name
        { wch: 15 },  // Type Name
        { wch: 10 },  // Lot No
        { wch: 15 },  // Date Range (From)
        { wch: 15 },  // Date Range (To)
        { wch: 15 },  // Count of Catches
        { wch: 15 }   // Total Quantity
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Transaction Details");

      // Generate filename
      let dateStr = '';
      let filenameDateStr = '';
      if (startDate && endDate) {
        const startDateStr = new Date(startDate).toISOString().slice(0,10);
        const endDateStr = new Date(endDate).toISOString().slice(0,10);
        dateStr = `${startDateStr}_to_${endDateStr}`;
        filenameDateStr = `${startDateStr.replace(/-/g, '')}_to_${endDateStr.replace(/-/g, '')}`;
      } else if (selectedDate) {
        dateStr = new Date(selectedDate).toISOString().slice(0,10);
        filenameDateStr = dateStr.replace(/-/g, '');
      } else {
        dateStr = new Date().toISOString().slice(0,10);
        filenameDateStr = dateStr.replace(/-/g, '');
      }

      let fileName = `DailyReport_Details_${groupName || 'All'}_${filenameDateStr}.xlsx`;

      if (projectName) {
        const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        fileName = `DailyReport_Details_${safeProjectName}_${filenameDateStr}.xlsx`;
      }

      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error("Error exporting transaction details to Excel:", error);
      toast.error('Failed to export transaction details.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Function to handle Quick Task Excel export
  const handleQuickTaskExcelExport = async () => {
    setIsExporting(true);
    setExportType('quicktask-excel');

    try {
      if (!quickTaskData || quickTaskData.length === 0) {
        toast.warning('No quick task data available to export.');
        return;
      }

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Define headers for quick task data
      const headers = [
        'S.No',
        'Name',
        'Project Name',
        'Group Name',
        'Catch No',
        'Quantity',
        'Start Time',
        'End Time',
        'Time Difference (Min)'
      ];

      // Prepare data for Excel
      const wsData = [headers];

      // Helper functions for getting names
      const getQuickTaskProjectName = (projectId) => {
        if (!projectId) return 'N/A';
        return quickTaskProjectMap[projectId] || `Project ${projectId}`;
      };

      const getQuickTaskGroupName = (groupId) => {
        if (!groupId) return 'N/A';
        return quickTaskGroupMap[groupId] || `Group ${groupId}`;
      };

      // Add quick task data rows
      quickTaskData.forEach((task, index) => {
        const startTime = task.loggedAT_A ?
          new Date(task.loggedAT_A).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
          'N/A';
        const endTime = task.loggedAT_B ?
          new Date(task.loggedAT_B).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
          'N/A';

        const row = [
          index + 1,
          userMap[task.triggeredBy_A] || `User ${task.triggeredBy_A}`,
          getQuickTaskProjectName(task.projectId),
          getQuickTaskGroupName(task.groupId),
          task.catchNo || 'N/A',
          task.quantity || 'N/A',
          startTime,
          endTime,
          task.timeDifferenceMinutes || 0
        ];
        wsData.push(row);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      ws['!cols'] = [
        { wch: 8 },   // S.No
        { wch: 20 },  // Name
        { wch: 25 },  // Project Name
        { wch: 20 },  // Group Name
        { wch: 15 },  // Catch No
        { wch: 12 },  // Quantity
        { wch: 15 },  // Start Time
        { wch: 15 },  // End Time
        { wch: 18 }   // Time Difference
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Quick Task Data");

      // Generate filename
      let dateStr = '';
      let filenameDateStr = '';
      if (startDate && endDate) {
        const startDateStr = new Date(startDate).toISOString().slice(0,10);
        const endDateStr = new Date(endDate).toISOString().slice(0,10);
        dateStr = `${startDateStr}_to_${endDateStr}`;
        filenameDateStr = `${startDateStr.replace(/-/g, '')}_to_${endDateStr.replace(/-/g, '')}`;
      } else if (selectedDate) {
        dateStr = new Date(selectedDate).toISOString().slice(0,10);
        filenameDateStr = dateStr.replace(/-/g, '');
      } else {
        dateStr = new Date().toISOString().slice(0,10);
        filenameDateStr = dateStr.replace(/-/g, '');
      }

      let fileName = `QuickTask_Report_${groupName || 'All'}_${filenameDateStr}.xlsx`;

      if (projectName) {
        const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        fileName = `QuickTask_Report_${safeProjectName}_${filenameDateStr}.xlsx`;
      }

      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error("Error exporting quick task data to Excel:", error);
      toast.error('Failed to export quick task data.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Function to handle Summary Overview PDF export
  const handleSummaryPdfExport = async () => {
    setIsExporting(true);
    setExportType('summary-pdf');

    try {
      if (!productionSummaryData || Object.keys(productionSummaryData).length === 0) {
        toast.warning('No summary data available to export.');
        return;
      }

      // Create PDF in portrait A4 format
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margins = {
        top: 30,
        bottom: 25,
        left: 15,
        right: 15
      };

      // Prepare summary data for table
      const summaryTableData = [
        ['Groups', (productionSummaryData.totalGroups || 0).toString()],
        ['Projects', (productionSummaryData.totalProjects || 0).toString()],
        ['Total Lots', (productionSummaryData.totalLots || 0).toString()],
        ['Total Catches', (productionSummaryData.totalCountOfCatches || 0).toLocaleString()],
        ['Total Quantity', (productionSummaryData.totalQuantity || 0).toLocaleString()]
      ];

      // Create the summary table with extremely compact styling and very small dimensions
      doc.autoTable({
        head: [['Metric', 'Count']],
        body: summaryTableData,
        startY: 35,
        margin: { top: 30, bottom: 25, left: 90, right: 90 }, // Very large side margins for tiny table
        tableWidth: 'wrap', // Let table wrap to content
        styles: {
          fontSize: 6,
          cellPadding: { top: 1, right: 2, bottom: 1, left: 2 },
          halign: 'center',
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          font: "helvetica",
          textColor: [60, 60, 60],
          overflow: 'linebreak',
          minCellHeight: 4
        },
        headStyles: {
          fillColor: [37, 56, 60],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
          minCellHeight: 5
        },
        columnStyles: {
          0: {
            cellWidth: 25,
            halign: 'left',
            fontStyle: 'normal'
          },
          1: {
            cellWidth: 18,
            halign: 'center',
            fontStyle: 'normal'
          }
        },
        theme: 'grid',
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.1,
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        showHead: 'firstPage', // Only show headers on first page
        didDrawPage: function() {
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

          if (currentPage === 1) {
            // Add title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text('Daily Report - Summary Overview', pageWidth / 2, 15, { align: 'center' });

            // Add date and project info
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);

            let dateText = '';
            if (startDate && endDate) {
              dateText = `Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`;
            } else if (selectedDate) {
              dateText = `Date: ${formatDate(selectedDate)}`;
            }

            doc.text(dateText, margins.left, 25);

            if (groupName) {
              doc.text(`Group: ${groupName}`, margins.left, 30);
            }

            if (projectName) {
              doc.text(`Project: ${projectName}`, pageWidth / 2, 30);
            }
          }

          // Footer with page number
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(
            `Page ${currentPage}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      });

      // Generate filename
      let filenameDateStr = '';
      if (startDate && endDate) {
        const startDateStr = new Date(startDate).toISOString().slice(0,10);
        const endDateStr = new Date(endDate).toISOString().slice(0,10);
        filenameDateStr = `${startDateStr.replace(/-/g, '')}_to_${endDateStr.replace(/-/g, '')}`;
      } else if (selectedDate) {
        filenameDateStr = new Date(selectedDate).toISOString().slice(0,10).replace(/-/g, '');
      } else {
        filenameDateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      }

      let fileName = `DailyReport_Summary_${groupName || 'All'}_${filenameDateStr}.pdf`;

      if (projectName) {
        const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        fileName = `DailyReport_Summary_${safeProjectName}_${filenameDateStr}.pdf`;
      }

      doc.save(fileName);

    } catch (error) {
      console.error("Error exporting summary to PDF:", error);
      toast.error('Failed to export summary overview PDF.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Function to handle Transaction Details PDF export
  const handleTransactionDetailsPdfExport = async () => {
    setIsExporting(true);
    setExportType('details-pdf');

    try {
      if (!productionReportData || productionReportData.length === 0) {
        toast.warning('No transaction details available to export.');
        return;
      }

      // Create PDF in landscape A4 format
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margins = {
        top: 30,
        bottom: 25,
        left: 15,
        right: 15
      };

      // Prepare transaction data for table
      const transactionTableData = [];
      productionReportData.forEach((item, index) => {
        const row = [
          index + 1,
          item.groupName || '',
          getProjectName(item.projectId),
          getTypeName(item.typeId),
          item.lotNo || '',
          item.from || '',
          item.to || '',
          item.countOfCatches || 0,
          (item.totalQuantity || 0).toLocaleString()
        ];
        transactionTableData.push(row);
      });

      // Create the transaction details table
      doc.autoTable({
        head: [['S.No', 'Group', 'Project', 'Type', 'Lot No', 'From', 'To', 'Catches', 'Quantity']],
        body: transactionTableData,
        startY: 35,
        margin: margins,
        styles: {
          fontSize: 9,
          cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
          halign: 'center',
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          font: "helvetica",
          textColor: [60, 60, 60],
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [37, 56, 60],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: { top: 8, right: 4, bottom: 8, left: 4 }
        },
        columnStyles: {
          0: { cellWidth: '5%' },   // S.No
          1: { cellWidth: '12%' },  // Group
          2: { cellWidth: '20%' },  // Project
          3: { cellWidth: '12%' },  // Type
          4: { cellWidth: '8%' },   // Lot No
          5: { cellWidth: '12%' },  // From
          6: { cellWidth: '12%' },  // To
          7: { cellWidth: '9%' },   // Catches
          8: { cellWidth: '10%' }   // Quantity
        },
        theme: 'grid',
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.2,
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        showHead: 'firstPage', // Only show headers on first page
        didDrawPage: function() {
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

          if (currentPage === 1) {
            // Add title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text('Daily Report - Transaction Details', pageWidth / 2, 15, { align: 'center' });

            // Add date and project info
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);

            let dateText = '';
            if (startDate && endDate) {
              dateText = `Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`;
            } else if (selectedDate) {
              dateText = `Date: ${formatDate(selectedDate)}`;
            }

            const col1X = margins.left;
            const col2X = pageWidth / 3;
            const col3X = (pageWidth / 3) * 2;

            doc.text(dateText, col1X, 25);

            if (groupName) {
              doc.text(`Group: ${groupName}`, col2X, 25);
            }

            if (projectName) {
              doc.text(`Project: ${projectName}`, col3X, 25);
            }
          }

          // Footer with page number
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(
            `Page ${currentPage} of ${doc.internal.getNumberOfPages()}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      });

      // Generate filename
      let filenameDateStr = '';
      if (startDate && endDate) {
        const startDateStr = new Date(startDate).toISOString().slice(0,10);
        const endDateStr = new Date(endDate).toISOString().slice(0,10);
        filenameDateStr = `${startDateStr.replace(/-/g, '')}_to_${endDateStr.replace(/-/g, '')}`;
      } else if (selectedDate) {
        filenameDateStr = new Date(selectedDate).toISOString().slice(0,10).replace(/-/g, '');
      } else {
        filenameDateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      }

      let fileName = `DailyReport_Details_${groupName || 'All'}_${filenameDateStr}.pdf`;

      if (projectName) {
        const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        fileName = `DailyReport_Details_${safeProjectName}_${filenameDateStr}.pdf`;
      }

      doc.save(fileName);

    } catch (error) {
      console.error("Error exporting transaction details to PDF:", error);
      toast.error('Failed to export transaction details PDF.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  // Function to handle Quick Task PDF export
  const handleQuickTaskPdfExport = async () => {
    setIsExporting(true);
    setExportType('quicktask-pdf');

    try {
      if (!quickTaskData || quickTaskData.length === 0) {
        toast.warning('No quick task data available to export.');
        return;
      }

      // Create PDF in landscape A4 format
      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margins = {
        top: 30,
        bottom: 25,
        left: 15,
        right: 15
      };

      // Helper functions for getting names
      const getQuickTaskProjectName = (projectId) => {
        if (!projectId) return 'N/A';
        return quickTaskProjectMap[projectId] || `Project ${projectId}`;
      };

      const getQuickTaskGroupName = (groupId) => {
        if (!groupId) return 'N/A';
        return quickTaskGroupMap[groupId] || `Group ${groupId}`;
      };

      // Prepare quick task data for table
      const quickTaskTableData = [];
      quickTaskData.forEach((task, index) => {
        const startTime = task.loggedAT_A ?
          new Date(task.loggedAT_A).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
          'N/A';
        const endTime = task.loggedAT_B ?
          new Date(task.loggedAT_B).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) :
          'N/A';

        const row = [
          index + 1,
          userMap[task.triggeredBy_A] || `User ${task.triggeredBy_A}`,
          getQuickTaskProjectName(task.projectId),
          getQuickTaskGroupName(task.groupId),
          task.catchNo || 'N/A',
          task.quantity || 'N/A',
          startTime,
          endTime,
          task.timeDifferenceMinutes || 0
        ];
        quickTaskTableData.push(row);
      });

      // Create the quick task table
      doc.autoTable({
        head: [['S.No', 'Name', 'Project Name', 'Group Name', 'Catch No', 'Quantity', 'Start Time', 'End Time', 'Time Diff (Min)']],
        body: quickTaskTableData,
        startY: 35,
        margin: margins,
        styles: {
          fontSize: 9,
          cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
          halign: 'center',
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          font: "helvetica",
          textColor: [60, 60, 60],
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [40, 167, 69],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center',
          cellPadding: { top: 8, right: 4, bottom: 8, left: 4 }
        },
        columnStyles: {
          0: { cellWidth: '6%' },   // S.No
          1: { cellWidth: '15%' },  // Name
          2: { cellWidth: '18%' },  // Project Name
          3: { cellWidth: '15%' },  // Group Name
          4: { cellWidth: '12%' },  // Catch No
          5: { cellWidth: '10%' },  // Quantity
          6: { cellWidth: '12%' },  // Start Time
          7: { cellWidth: '12%' },  // End Time
          8: { cellWidth: '10%' }   // Time Difference
        },
        theme: 'grid',
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0.2,
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        showHead: 'firstPage',
        didDrawPage: function() {
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;

          if (currentPage === 1) {
            // Add title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(44, 62, 80);
            doc.text('Quick Task Report', pageWidth / 2, 15, { align: 'center' });

            // Add date and project info
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80, 80, 80);

            let dateText = '';
            if (startDate && endDate) {
              dateText = `Date Range: ${formatDate(startDate)} to ${formatDate(endDate)}`;
            } else if (selectedDate) {
              dateText = `Date: ${formatDate(selectedDate)}`;
            }

            const col1X = margins.left;
            const col2X = pageWidth / 3;
            const col3X = (pageWidth / 3) * 2;

            doc.text(dateText, col1X, 25);

            if (groupName) {
              doc.text(`Group: ${groupName}`, col2X, 25);
            }

            if (projectName) {
              doc.text(`Project: ${projectName}`, col3X, 25);
            }
          }

          // Footer with page number
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(
            `Page ${currentPage} of ${doc.internal.getNumberOfPages()}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      });

      // Generate filename
      let filenameDateStr = '';
      if (startDate && endDate) {
        const startDateStr = new Date(startDate).toISOString().slice(0,10);
        const endDateStr = new Date(endDate).toISOString().slice(0,10);
        filenameDateStr = `${startDateStr.replace(/-/g, '')}_to_${endDateStr.replace(/-/g, '')}`;
      } else if (selectedDate) {
        filenameDateStr = new Date(selectedDate).toISOString().slice(0,10).replace(/-/g, '');
      } else {
        filenameDateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
      }

      let fileName = `QuickTask_Report_${groupName || 'All'}_${filenameDateStr}.pdf`;

      if (projectName) {
        const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        fileName = `QuickTask_Report_${safeProjectName}_${filenameDateStr}.pdf`;
      }

      doc.save(fileName);

    } catch (error) {
      console.error("Error exporting quick task data to PDF:", error);
      toast.error('Failed to export quick task data PDF.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <>


      <Dropdown className="d-inline-block">
        <Dropdown.Toggle variant="primary" id="export-dropdown" className="me-">
          <FaFileExport className="me-2" />
          Export
        </Dropdown.Toggle>

        <Dropdown.Menu className="mt-1 py-2" style={{ minWidth: '200px' }}>
          {/* Summary Overview Section */}
          <Dropdown.Header className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>
            SUMMARY OVERVIEW
          </Dropdown.Header>

          <Dropdown.Item
            onClick={handleSummaryExcelExport}
            className="py-2 d-flex align-items-center"
            disabled={isExporting}
            title="Export Summary to Excel"
          >
            {isExporting && exportType === 'summary-excel' ? (
              <Spinner animation="border" size="sm" variant="success" className="me-2" />
            ) : (
              <FaFileExcel size={16} color="#1d6f42" className="me-2" />
            )}
            <span style={{ fontSize: '0.9rem' }}>Summary Excel</span>
          </Dropdown.Item>

          <Dropdown.Item
            onClick={handleSummaryPdfExport}
            className="py-2 d-flex align-items-center"
            disabled={isExporting}
            title="Export Summary to PDF"
          >
            {isExporting && exportType === 'summary-pdf' ? (
              <Spinner animation="border" size="sm" variant="danger" className="me-2" />
            ) : (
              <FaFilePdf size={16} color='#dc3545' className="me-2" />
            )}
            <span style={{ fontSize: '0.9rem' }}>Summary PDF</span>
          </Dropdown.Item>

          <div className="dropdown-divider my-2"></div>

          {/* Transaction Details Section */}
          <Dropdown.Header className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>
            TRANSACTION DETAILS
          </Dropdown.Header>

          <Dropdown.Item
            onClick={handleTransactionDetailsExcelExport}
            className="py-2 d-flex align-items-center"
            disabled={isExporting}
            title="Export Transaction Details to Excel"
          >
            {isExporting && exportType === 'details-excel' ? (
              <Spinner animation="border" size="sm" variant="success" className="me-2" />
            ) : (
              <FaFileExcel size={16} color="#1d6f42" className="me-2" />
            )}
            <span style={{ fontSize: '0.9rem' }}>Details Excel</span>
          </Dropdown.Item>

          <Dropdown.Item
            onClick={handleTransactionDetailsPdfExport}
            className="py-2 d-flex align-items-center"
            disabled={isExporting}
            title="Export Transaction Details to PDF"
          >
            {isExporting && exportType === 'details-pdf' ? (
              <Spinner animation="border" size="sm" variant="danger" className="me-2" />
            ) : (
              <FaFilePdf size={16} color='#dc3545' className="me-2" />
            )}
            <span style={{ fontSize: '0.9rem' }}>Details PDF</span>
          </Dropdown.Item>

          <div className="dropdown-divider my-2"></div>

          {/* Quick Task Section */}
          <Dropdown.Header className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>
            QUICK TASK
          </Dropdown.Header>

          <Dropdown.Item
            onClick={handleQuickTaskExcelExport}
            className="py-2 d-flex align-items-center"
            disabled={isExporting}
            title="Export Quick Task to Excel"
          >
            {isExporting && exportType === 'quicktask-excel' ? (
              <Spinner animation="border" size="sm" variant="success" className="me-2" />
            ) : (
              <FaFileExcel size={16} color="#1d6f42" className="me-2" />
            )}
            <span style={{ fontSize: '0.9rem' }}>Quick Task Excel</span>
          </Dropdown.Item>

          <Dropdown.Item
            onClick={handleQuickTaskPdfExport}
            className="py-2 d-flex align-items-center"
            disabled={isExporting}
            title="Export Quick Task to PDF"
          >
            {isExporting && exportType === 'quicktask-pdf' ? (
              <Spinner animation="border" size="sm" variant="danger" className="me-2" />
            ) : (
              <FaFilePdf size={16} color='#dc3545' className="me-2" />
            )}
            <span style={{ fontSize: '0.9rem' }}>Quick Task PDF</span>
          </Dropdown.Item>

        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

export default DailyReportExport;
