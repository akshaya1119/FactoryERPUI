import React from 'react';
import { Button } from 'react-bootstrap';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FaFilePdf } from "react-icons/fa6";

const PdfExport = ({ data, projectName, groupName, visibleColumns, lotNo }) => {
  const exportToPDF = () => {
    // Create PDF in landscape A4 format
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Add title and info in a compact layout
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "bold");
    doc.text('Report', doc.internal.pageSize.width/2, 12, {align: 'center'});
    
    // Add project and group info in a horizontal layout
    doc.setFontSize(8);
    doc.setTextColor(52, 73, 94);
    doc.setFont("helvetica", "normal");
    
    // Left side info
    doc.text(`Group: `, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.text(`${groupName || 'N/A'}`, 32, 20);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Project: `, 80, 20);
    doc.setFont("helvetica", "bold");
    doc.text(`${projectName || 'N/A'}`, 95, 20);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Lot: `, 140, 20);
    doc.setFont("helvetica", "bold");
    doc.text(`${lotNo || 'N/A'}`, 150, 20);

    doc.setFont("helvetica", "normal");
    doc.text(`Dispatch Date: `, 180, 20);
    doc.setFont("helvetica", "bold");
    doc.text(`${data[0]?.dispatchDate || 'N/A'}`, 200, 20);
    

    // Map of headers to their corresponding data fields
    const headerMap = {
      'Catch No': sheet => sheet.catchNo,
      'Subject': sheet => sheet.subject,
      'Course': sheet => sheet.course,
      'Paper': sheet => sheet.paper,
      'Exam Date': sheet => new Date(sheet.examDate).toLocaleDateString('en-GB'),
      'Exam Time': sheet => sheet.examTime,
      'Quantity': sheet => sheet.quantity,
      'Pages': sheet => sheet.pages,
      'Status': sheet => sheet.catchStatus === 'Completed' ? 'Completed' :
                        sheet.catchStatus === 'Running' ? 'Running' :
                        sheet.catchStatus === 'Pending' ? 'Pending' : 'N/A',
      'Inner Envelope': sheet => sheet.innerEnvelope,
      'Outer Envelope': sheet => sheet.outerEnvelope ? sheet.outerEnvelope : ''
    };

    // Get visible headers based on visibleColumns with mapping
    const headerMapping = {
      catchNo: 'Catch No',
      subject: 'Subject',
      course: 'Course',
      paper: 'Paper',
      examDate: 'Exam Date',
      examTime: 'Exam Time',
      quantity: 'Quantity',
      pages: 'Pages',
      status: 'Status',
      currentProcess: 'Current Process',
      innerEnvelope: 'Inner Envelope',
      outerEnvelope: 'Outer Envelope'
    };

    // Get visible headers using the mapping
    const headers = Object.entries(visibleColumns)
      .filter(([key, isVisible]) => isVisible)
      .map(([key]) => headerMapping[key])
      .filter((header, index, self) => self.indexOf(header) === index);

    // Update headerMap after headers are defined
    headers.forEach(header => {
      if (header === 'Current Process' && !headerMap[header]) {
        headerMap[header] = sheet => sheet.currentProcessName;
      }
    });

    // Format table data using the header map
    const tableData = data.map(sheet => {
      return headers.map(header => {
        const dataFn = headerMap[header];
        return dataFn ? dataFn(sheet) : '';
      });
    });

    // Column width configurations - adjusted for landscape
    const columnWidthMap = {
      'Catch No': { fontStyle: 'bold', width: 20, halign: 'center' },
      'Subject': { width: 35, halign: 'center' },
      'Course': { width: 30, halign: 'center' },
      'Paper': { width: 25, halign: 'center' },
      'Exam Date': { width: 25, halign: 'center' },
      'Exam Time': { width: 20, halign: 'center' },
      'Quantity': { width: 15, halign: 'center' },
      'Pages': { width: 15, halign: 'center' },
      'Status': { width: 20, halign: 'center' },
      'Current Process': { width: 25, halign: 'center' },
      'Inner Envelope': { width: 25, halign: 'center' },
      'Outer Envelope': { width: 25, halign: 'center' }
    };

    // Build column styles object - only for visible headers
    const columnStyles = {};
    headers.forEach((header, index) => {
      if (columnWidthMap[header]) {  // Only add styles for headers that exist in the map
        columnStyles[index] = columnWidthMap[header];
      }
    });

    // Add table with improved styling for landscape A4
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 25,
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineColor: [189, 195, 199],
        lineWidth: 0.1,
        font: "helvetica",
        overflow: 'linebreak',
        halign: 'center'
      },
      headStyles: {
        fillColor: [52, 73, 94],
        textColor: 255,
        fontSize: 7,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 3
      },
      bodyStyles: {
        textColor: [44, 62, 80]
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249]
      },
      columnStyles: columnStyles,
      margin: { top: 25, right: 15, bottom: 15, left: 15 },
      didDrawPage: function(data) {
        // Add page number at bottom center
        doc.setFontSize(6);
        doc.setTextColor(44, 62, 80);
        const currentPage = doc.internal.getNumberOfPages();
      
        doc.text(
          `Page ${currentPage}`,
          doc.internal.pageSize.width/2, 
          doc.internal.pageSize.height - 10,
          {align: 'center'}
        );

        // Add datetime watermark footer at bottom right
        doc.setFontSize(5);
        doc.setTextColor(180, 180, 180);
        const datetime = new Date().toLocaleString();
        doc.text(
          `Generated: ${datetime}`,
          doc.internal.pageSize.width - 15,
          doc.internal.pageSize.height - 10,
          {align: 'right'}
        );
      },
      showHead: 'firstPage'
    });

    // Save PDF with formatted name including group and project
    const dateStr = new Date().toISOString().slice(0,10);
    const fileName = `${groupName || 'no-group'}_${projectName || 'no-project'}_${dateStr}_${new Date().toLocaleTimeString().replace(/:/g,'-')}.pdf`;
    doc.save(fileName);
  };

  return (
    <span 
      onClick={exportToPDF}
      className="ms-2 px-3"
      style={{ cursor: 'pointer' }}
    >
      <FaFilePdf size={40} color='purple' />
    </span>
  );
};

export default PdfExport;
