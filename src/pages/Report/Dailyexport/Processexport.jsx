import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { FaFilePdf, FaFileExcel, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// SUPER AGGRESSIVE utility function to clean names - PERMANENTLY remove ALL % symbols
const cleanName = (name) => {
    if (!name) return '';

    console.log('=== SUPER CLEANING NAME ===');
    console.log('Original:', JSON.stringify(name));
    console.log('Type:', typeof name);

    // Convert to string and handle ALL possible % variations - MULTIPLE PASSES
    let cleanedName = String(name);

    // Pass 1: Remove all common % patterns
    cleanedName = cleanedName
        .replace(/%%+/g, '')          // Remove multiple %
        .replace(/%+/g, '')           // Remove single or multiple %
        .replace(/％+/g, '')          // Remove full-width % (Unicode)
        .replace(/\u0025+/g, '')      // Remove % by Unicode code point
        .replace(/\u00A5+/g, '')      // Remove yen symbol
        .replace(/[％＄¥]+/g, '')     // Remove other similar symbols
        .replace(/percent/gi, '')     // Remove word "percent"
        .replace(/\s+/g, ' ')         // Normalize spaces
        .trim();

    // Pass 2: Character-by-character cleaning (GUARANTEED removal)
    cleanedName = cleanedName.split('').filter(char => {
        const charCode = char.charCodeAt(0);
        // Remove % (37), ％ (65285), and any similar characters
        return charCode !== 37 && charCode !== 65285 && char !== '%' && char !== '％';
    }).join('');

    // Pass 3: Final cleanup
    cleanedName = cleanedName
        .replace(/\s+/g, ' ')         // Normalize spaces again
        .trim();

    // Pass 4: ABSOLUTE FINAL CHECK - if STILL contains %, replace with empty
    if (cleanedName.includes('%') || cleanedName.includes('％')) {
        console.log('STILL CONTAINS % - DOING NUCLEAR CLEANUP');
        cleanedName = cleanedName.replace(/[%％]/g, '');
    }

    console.log('FINAL CLEANED RESULT:', JSON.stringify(cleanedName));
    console.log('=== END SUPER CLEANING ===');

    return cleanedName;
};

const ProcessExport = ({
    data,
    detailsData,
    viewType,
    startDate,
    endDate,
    getProcessName,
    className = "mb-3"
}) => {

    // Format date for display
    const formatDisplayDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    // Get report title and date range
    const getReportInfo = () => {
        const title = viewType === 'summary'
            ? 'Process Production Summary Report'
            : 'Process Production Details Report';

        let dateRange = '';
        if (startDate && endDate) {
            dateRange = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
        } else if (startDate) {
            dateRange = formatDisplayDate(startDate);
        }

        return { title, dateRange };
    };

    // Export Summary to PDF
    const exportSummaryToPDF = () => {
        const doc = new jsPDF();
        const { title, dateRange } = getReportInfo();

        // Add title
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(title, 14, 20);

        // Add date range
        if (dateRange) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Date Range: ${dateRange}`, 14, 30);
        }

        // Move total row to the end
        let processRows = [];
        let totalRow = null;
        data.forEach(item => {
            const processName = getProcessName ? getProcessName(item.processId) : item.processName || item.processId;
            let cleanProcessName = cleanName(processName);
            if ((cleanProcessName || '').toLowerCase().includes('total')) {
                totalRow = [
                    'Total',
                    item.completedTotalCatchesInPaper || '',
                    item.completedTotalQuantityInPaper || '',
                    item.completedTotalCatchesInBooklet || '',
                    item.completedTotalQuantityInBooklet || ''
                ];
            } else {
                processRows.push([
                    cleanProcessName,
                    item.completedTotalCatchesInPaper || '',
                    item.completedTotalQuantityInPaper || '',
                    item.completedTotalCatchesInBooklet || '',
                    item.completedTotalQuantityInBooklet || ''
                ]);
            }
        });
        const tableData = totalRow ? [...processRows, totalRow] : processRows;

        // Add table with colorful styling for better visibility
        doc.autoTable({
            head: [
                [
                    { content: 'Process', rowSpan: 2 },
                    { content: 'Paper', colSpan: 2 },
                    { content: 'Booklet', colSpan: 2 }
                ],
                [
                    { content: 'Catch' },
                    { content: 'Quantity' },
                    { content: 'Catch' },
                    { content: 'Quantity' }
                ]
            ],
            body: tableData,
            startY: dateRange ? 40 : 30,
            showHead: 'firstPage',
            styles: {
                fontSize: 10,
                cellPadding: 4,
                lineColor: [200, 200, 200], // pleasant medium-light gray
                lineWidth: 0.2,
                textColor: [33, 37, 41]
            },
            headStyles: {
                fillColor: [60, 60, 60], // Pleasant light black header
                textColor: [255, 255, 255], // Bold white text
                fontStyle: 'bold',
                lineColor: [200, 200, 200],
                lineWidth: 0.2,
                halign: 'center'
            },
            bodyStyles: {
                fillColor: [255, 255, 255], // White background for body
                textColor: [33, 37, 41]
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250] // Subtle light gray for alternate rows
            },
            columnStyles: {
                0: { cellWidth: 70, halign: 'center' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' }
            },
            didParseCell: function (data) {
                // Highlight Total row (case-insensitive, matches only 'Total')
                if (data.section === 'body') {
                    const cellValue = (data.row.raw && data.row.raw[0]) ? data.row.raw[0].toString().trim().toLowerCase() : '';
                    const isTotalRow = cellValue === 'total';
                    if (isTotalRow) {
                        data.cell.styles.fillColor = [225, 245, 254]; // Very light blue background
                        data.cell.styles.textColor = [33, 37, 41]; // Use dark text for better contrast
                        data.cell.styles.fontStyle = 'bold';
                        // Set the cell value to 'Total' (capitalized)
                        if (data.column.index === 0) {
                            data.cell.text = ['Total'];
                        }
                    }
                }
            }
        });

        // Save the PDF with timestamp to avoid caching
        const timestamp = new Date().getTime();
        doc.save(`Process_Production_Summary_${dateRange || 'Report'}_${timestamp}.pdf`);
    };

    // Export Details to PDF
    const exportDetailsToPDF = () => {
        const doc = new jsPDF();
        const { title, dateRange } = getReportInfo();

        // Add title
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(title, 14, 20);

        // Add date range
        if (dateRange) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Date Range: ${dateRange}`, 14, 30);
        }

        // Prepare all data in a flat structure - export ALL data regardless of expansion state
        let allTableData = [];
        let rowTypes = [];
        let totalRowData = null;
        detailsData.forEach(processData => {
            let cleanProcessName = cleanName(processData.processName);
            if ((cleanProcessName || '').toLowerCase().includes('total')) {
                totalRowData = [
                    'Total',
                    processData.completedTotalCatchesInPaper || '',
                    processData.completedTotalQuantityInPaper || '',
                    processData.completedTotalCatchesInBooklet || '',
                    processData.completedTotalQuantityInBooklet || ''
                ];
            } else {
                allTableData.push([
                    cleanProcessName,
                    processData.completedTotalCatchesInPaper || '',
                    processData.completedTotalQuantityInPaper || '',
                    processData.completedTotalCatchesInBooklet || '',
                    processData.completedTotalQuantityInBooklet || ''
                ]);
                rowTypes.push('process');
                if (processData.projects && processData.projects.length > 0) {
                    processData.projects.forEach(project => {
                        const cleanProjectName = cleanName(project.projectName);
                        allTableData.push([
                            `  ${cleanProjectName}`,
                            project.completedTotalCatchesInPaper || '',
                            project.completedTotalQuantityInPaper || '',
                            project.completedTotalCatchesInBooklet || '',
                            project.completedTotalQuantityInBooklet || ''
                        ]);
                        rowTypes.push('project');
                    });
                }
            }
        });
        if (totalRowData) {
            allTableData.push(totalRowData);
            rowTypes.push('process');
        }

        // Add single table with all data - colorful styling only for project rows
        doc.autoTable({
            head: [
                [
                    { content: 'Process', rowSpan: 2 },
                    { content: 'Paper', colSpan: 2 },
                    { content: 'Booklet', colSpan: 2 }
                ],
                [
                    { content: 'Catch' },
                    { content: 'Quantity' },
                    { content: 'Catch' },
                    { content: 'Quantity' }
                ]
            ],
            body: allTableData,
            startY: dateRange ? 40 : 30,
            showHead: 'firstPage',
            styles: {
                fontSize: 10,
                cellPadding: 4,
                lineColor: [200, 200, 200], // pleasant medium-light gray
                lineWidth: 0.2,
                textColor: [33, 37, 41]
            },
            headStyles: {
                fillColor: [60, 60, 60], // Pleasant light black header
                textColor: [255, 255, 255], // Bold white text
                fontStyle: 'bold',
                lineColor: [200, 200, 200],
                lineWidth: 0.2,
                halign: 'center'
            },
            bodyStyles: {
                fillColor: [255, 255, 255], // White background for body
                textColor: [33, 37, 41]
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250] // Subtle light gray for alternate rows
            },
            columnStyles: {
                0: { cellWidth: 80, halign: 'center' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' }
            },
            didParseCell: function (data) {
                // Highlight Total row (case-insensitive, matches only 'Total')
                if (data.section === 'body') {
                    const cellValue = (data.row.raw && data.row.raw[0]) ? data.row.raw[0].toString().trim().toLowerCase() : '';
                    const rowIndex = data.row.index;
                    const isProjectRow = rowTypes[rowIndex] === 'project';
                    const isTotalRow = cellValue === 'total';
                    if (isTotalRow) {
                        data.cell.styles.fillColor = [225, 245, 254]; // Very light blue background
                        data.cell.styles.textColor = [33, 37, 41]; // Use dark text for better contrast
                        data.cell.styles.fontStyle = 'bold';
                        // Set the cell value to 'Total' (capitalized)
                        if (data.column.index === 0) {
                            data.cell.text = ['Total'];
                        }
                    } else if (!isProjectRow) {
                        data.cell.styles.fontStyle = 'bold'; // Make process names bold
                    } else {
                        data.cell.styles.fontStyle = 'normal';
                    }
                }
            }
        });

        // Save the PDF with timestamp to avoid caching
        const timestamp = new Date().getTime();
        doc.save(`Process_Production_Details_${dateRange || 'Report'}_${timestamp}.pdf`);
    };

    // Export Summary to Excel
    const exportSummaryToExcel = () => {
        const { title, dateRange } = getReportInfo();

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.book_new().Sheets.Sheet1 = {};

        // Add title and date range
        let currentRow = 1;
        XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: `A${currentRow}` });
        currentRow++;

        if (dateRange) {
            XLSX.utils.sheet_add_aoa(ws, [[`Date Range: ${dateRange}`]], { origin: `A${currentRow}` });
            currentRow++;
        }
        currentRow++; // Empty row

        // Add proper header structure
        const headerRow1 = ['Process', 'Paper', '', 'Booklet', ''];
        const headerRow2 = ['', 'Catch', 'Quantity', 'Catch', 'Quantity'];

        XLSX.utils.sheet_add_aoa(ws, [headerRow1], { origin: `A${currentRow}` });
        currentRow++;
        XLSX.utils.sheet_add_aoa(ws, [headerRow2], { origin: `A${currentRow}` });
        currentRow++;

        // Add data
        const excelData = data.map(item => {
            const processName = getProcessName ? getProcessName(item.processId) : item.processName || item.processId;
            // Clean process name - remove %% symbols and extra spaces
            const cleanProcessName = cleanName(processName);

            return [
                cleanProcessName,
                item.completedTotalCatchesInPaper || '',
                item.completedTotalQuantityInPaper || '',
                item.completedTotalCatchesInBooklet || '',
                item.completedTotalQuantityInBooklet || ''
            ];
        });

        XLSX.utils.sheet_add_aoa(ws, excelData, { origin: `A${currentRow}` });

        // Merge cells for proper header structure
        ws['!merges'] = [
            { s: { r: currentRow - 3, c: 0 }, e: { r: currentRow - 2, c: 0 } }, // Process column
            { s: { r: currentRow - 3, c: 1 }, e: { r: currentRow - 3, c: 2 } }, // Paper header
            { s: { r: currentRow - 3, c: 3 }, e: { r: currentRow - 3, c: 4 } }  // Booklet header
        ];

        // Set column widths
        ws['!cols'] = [
            { width: 35 }, // Process - wider for full names
            { width: 18 }, // Paper Catch
            { width: 18 }, // Paper Quantity
            { width: 18 }, // Booklet Catch
            { width: 18 }  // Booklet Quantity
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Process Production Summary');

        // Save the file
        XLSX.writeFile(wb, `Process_Production_Summary_${dateRange || 'Report'}.xlsx`);
    };

    // Export Details to Excel
    const exportDetailsToExcel = () => {
        const { title, dateRange } = getReportInfo();

        // Data will be prepared in the new structure below

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.book_new().Sheets.Sheet1 = {};

        // Add title and date range
        let currentRow = 1;
        XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: `A${currentRow}` });
        currentRow++;

        if (dateRange) {
            XLSX.utils.sheet_add_aoa(ws, [[`Date Range: ${dateRange}`]], { origin: `A${currentRow}` });
            currentRow++;
        }
        currentRow++; // Empty row

        // Add proper header structure
        const headerRow1 = ['Process', 'Paper', '', 'Booklet', ''];
        const headerRow2 = ['', 'Catch', 'Quantity', 'Catch', 'Quantity'];

        XLSX.utils.sheet_add_aoa(ws, [headerRow1], { origin: `A${currentRow}` });
        currentRow++;
        XLSX.utils.sheet_add_aoa(ws, [headerRow2], { origin: `A${currentRow}` });
        currentRow++;

        // Prepare all data in flat structure - export ALL data
        const allExcelData = [];
        detailsData.forEach(processData => {
            // Clean process name - remove %% symbols and extra spaces
            const cleanProcessName = cleanName(processData.processName);

            // Add process summary row
            allExcelData.push([
                cleanProcessName,
                processData.completedTotalCatchesInPaper || '',
                processData.completedTotalQuantityInPaper || '',
                processData.completedTotalCatchesInBooklet || '',
                processData.completedTotalQuantityInBooklet || ''
            ]);

            // Add ALL project details (regardless of expansion state)
            if (processData.projects && processData.projects.length > 0) {
                processData.projects.forEach(project => {
                    // Clean project name - remove %% symbols and extra spaces
                    const cleanProjectName = cleanName(project.projectName);

                    allExcelData.push([
                        `${cleanProjectName}`,
                        project.completedTotalCatchesInPaper || '',
                        project.completedTotalQuantityInPaper || '',
                        project.completedTotalCatchesInBooklet || '',
                        project.completedTotalQuantityInBooklet || ''
                    ]);
                });
            }
        });

        // Add data
        XLSX.utils.sheet_add_aoa(ws, allExcelData, { origin: `A${currentRow}` });

        // Merge cells for proper header structure
        ws['!merges'] = [
            { s: { r: currentRow - 3, c: 0 }, e: { r: currentRow - 2, c: 0 } }, // Process column
            { s: { r: currentRow - 3, c: 1 }, e: { r: currentRow - 3, c: 2 } }, // Paper header
            { s: { r: currentRow - 3, c: 3 }, e: { r: currentRow - 3, c: 4 } }  // Booklet header
        ];

        // Set column widths
        ws['!cols'] = [
            { width: 45 }, // Process/Project - wider for full names with indentation
            { width: 18 }, // Paper Catch
            { width: 18 }, // Paper Quantity
            { width: 18 }, // Booklet Catch
            { width: 18 }  // Booklet Quantity
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Process Production Details');

        // Save the file
        XLSX.writeFile(wb, `Process_Production_Details_${dateRange || 'Report'}.xlsx`);
    };

    // Don't render if no data
    if ((!data || data.length === 0) && (!detailsData || detailsData.length === 0)) {
        return null;
    }

    return (
        <div className={`d-flex justify-content-end align-items-center ${className}`} style={{ marginRight: '10px' }}>
            <Dropdown>
                <Dropdown.Toggle
                    variant="primary"
                    size="sm"
                    className="d-flex align-items-center justify-content-center p-0"
                    style={{
                        width: '85px',
                        height: '42px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: 'none',
                        backgroundColor: '#0d6efd',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <FaDownload style={{ fontSize: '20px' }} />
                </Dropdown.Toggle>

                <Dropdown.Menu 
                    align="end"
                    style={{
                        minWidth: 'auto',
                        padding: '8px',
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        marginTop: '1px'
                    }}
                >
                    <Dropdown.Item
                        onClick={viewType === 'summary' ? exportSummaryToPDF : exportDetailsToPDF}
                        className="d-flex align-items-center justify-content-center p-2"
                        style={{ 
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            color: '#dc3545',
                            width: '70px',
                            height: '48px',
                            marginBottom: '4px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FaFilePdf style={{ fontSize: '35px' }} />
                    </Dropdown.Item>
                    
                    <Dropdown.Item
                        onClick={viewType === 'summary' ? exportSummaryToExcel : exportDetailsToExcel}
                        className="d-flex align-items-center justify-content-center p-2"
                        style={{ 
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            color: '#28a745',
                            width: '70px',
                            height: '48px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0fff4'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <FaFileExcel style={{ fontSize: '35px' }} />
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export default ProcessExport;