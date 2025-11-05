import { Button } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { FaFileExcel } from "react-icons/fa";

const ExcelExport = ({ data, projectName, groupName, visibleColumns, lotNo }) => {
  const handleExcelExport = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Map of headers to their corresponding data fields
      const headerMap = {
        'Catch No': sheet => sheet.catchNo,
        'Subject': sheet => sheet.subject,
        'Course': sheet => sheet.course,
        'Paper': sheet => sheet.paper,
        'Exam Date': sheet => new Date(sheet.examDate).toLocaleDateString(),
        'Exam Time': sheet => sheet.examTime,
        'Quantity': sheet => sheet.quantity,
        'Pages': sheet => sheet.pages,
        'Status': sheet => sheet.catchStatus,
        'Current Process': sheet => sheet.currentProcessName,
        
        'Inner Envelope': sheet => sheet.innerEnvelope,
        'Outer Envelope': sheet => sheet.outerEnvelope,
        'Dispatch Date': sheet => sheet.dispatchDate
      };

      // Define headers based on visible columns
      const headers = [
        visibleColumns.catchNo && "Catch No",
        visibleColumns.subject && "Subject", 
        visibleColumns.course && "Course",
        visibleColumns.paper && "Paper",
        visibleColumns.examDate && "Exam Date",
        visibleColumns.examTime && "Exam Time",
        visibleColumns.quantity && "Quantity",
        visibleColumns.pageNo && "Pages",
        visibleColumns.status && "Status",
        visibleColumns.currentProcessName && "Current Process",
        visibleColumns.innerEnvelope && "Inner Envelope",
        visibleColumns.outerEnvelope && "Outer Envelope",
        visibleColumns.dispatchDate && "Dispatch Date"
      ].filter(Boolean);

      // Create worksheet data
      const wsData = [
        // Title row with all info in one row
        [`Group: ${groupName || 'N/A'}`, `Project: ${projectName || 'N/A'}`, `Lot: ${lotNo || 'N/A'}`, `Generated: ${new Date().toLocaleString()}`, `Dispatch Date: ${data[0]?.dispatchDate || 'N/A'}`],
        // Blank row for spacing
        [],
        // Column headers
        headers,
        // Data rows
        ...data.map(sheet => {
          return headers.map(header => {
            const dataFn = headerMap[header];
            return dataFn ? dataFn(sheet) : '';
          });
        })
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths based on visible columns  
      ws['!cols'] = headers.map(() => ({ wch: 15 }));

      // Merge cells for title components
      ws['!merges'] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: 1 } }, // Group name
        { s: { r: 0, c: 3 }, e: { r: 0, c: 3 } }, // Project name 
        { s: { r: 0, c: 5 }, e: { r: 0, c: 5 } }, // Lot number
        { s: { r: 0, c: 7 }, e: { r: 0, c: 7 } }, // Generated date
        { s: { r: 0, c: 9 }, e: { r: 0, c: 9 } }  // Dispatch date
      ];

      // Define header colors
      const headerColors = [
        "90EE90", "90EE90", "90EE90", "90EE90", "90EE90",
        "90EE90", "90EE90", "90EE90", "90EE90", "90EE90"
      ];

      // Apply styles
      headers.forEach((header, i) => {
        try {
          // Style title row
          if (i <= 5) {
            const titleCell = XLSX.utils.encode_cell({r: 0, c: i});
            if (ws[titleCell]) {
              ws[titleCell].s = {
                font: { bold: true, size: 12 },
                fill: { fgColor: { rgb: "90EE90" } },
                alignment: { horizontal: 'center', vertical: 'center' }
              };
            }
          }

          // Style headers
          const headerCell = XLSX.utils.encode_cell({r: 2, c: i});
          if (ws[headerCell]) {
            ws[headerCell].s = {
              font: { bold: true, color: { rgb: "FFFFFF" }, size: 11 },
              fill: { fgColor: { rgb: headerColors[i] } },
              alignment: { horizontal: 'center', vertical: 'center' }
            };
          }

          // Style data cells
          for (let r = 3; r < 3 + data.length; r++) {
            const dataCell = XLSX.utils.encode_cell({r: r, c: i});
            if (ws[dataCell]) {
              ws[dataCell].s = {
                font: { size: 10 },
                alignment: { vertical: 'center', wrapText: true },
                border: {
                  top: { style: 'thin', color: { rgb: "CCCCCC" } },
                  bottom: { style: 'thin', color: { rgb: "CCCCCC" } },
                  left: { style: 'thin', color: { rgb: "CCCCCC" } },
                  right: { style: 'thin', color: { rgb: "CCCCCC" } }
                }
              };

              // Add color to status cells
              if (header === "Status") {
                const status = ws[dataCell].v;
                if (status === "Completed") {
                  ws[dataCell].s.fill = { fgColor: { rgb: "2ECC71" } };
                } else if (status === "Running") {
                  ws[dataCell].s.fill = { fgColor: { rgb: "3498DB" } };
                } else if (status === "Pending") {
                  ws[dataCell].s.fill = { fgColor: { rgb: "E74C3C" } };
                }
              }
            }
          }
        } catch (error) {
          console.warn(`Error styling column ${i}:`, error);
        }
      });

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Quantity Sheets");

      // Generate Excel file
      const dateStr = new Date().toISOString().slice(0,10);
      const fileName = `${groupName || 'no-group'}_${projectName || 'no-project'}_${dateStr}.xlsx`;

      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export Excel file");
    }
  };

  return (
    <span 
      className="ms-2"
      onClick={handleExcelExport}
      style={{ cursor: 'pointer' }}
    >
      <FaFileExcel className="p-0" color='green' size={40}/>
      {/* Export Excel */}
    </span>
  );
};

export default ExcelExport;
