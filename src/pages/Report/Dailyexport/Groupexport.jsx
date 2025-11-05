import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { FaFilePdf, FaFileExcel, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// A new, more aggressive cleaning function to ensure all symbols are removed.
const cleanName = (name) => {
    if (typeof name !== 'string') {
        name = String(name);
    }
    // Remove ANY character that is not a letter, number, space, hyphen, or parenthesis.
    return name.replace(/[^a-zA-Z0-9\s-()]/g, '').replace(/\s+/g, ' ').trim();
};

const GroupExport = ({
    data,
    groupDetailsData,
    expandedGroupProcesses,
    expandedGroupProjects,
    expandedProjectRows,
    groupProjectDetails,
    projectCatchLists,
    viewType,
    startDate,
    endDate,
    getProcessName,
    getGroupName,
    getProjectName,
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

    // Helper function to format cell value - returns empty string for 0 or null/undefined
    const formatCellValue = (value) => {
        return value && value !== 0 ? value : '';
    };

    // Get report title and date range
    const getReportInfo = () => {
        const title = viewType === 'summary'
            ? 'Group Production Summary Report'
            : 'Group Production Details Report';

        let dateRange = '';
        if (startDate && endDate) {
            dateRange = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
        } else if (startDate) {
            dateRange = formatDisplayDate(startDate);
        }

        return { title, dateRange };
    };

    // Helper to check if any expansion exists
    const isAnyExpanded = () => {
        if (expandedGroupProcesses && expandedGroupProcesses.size > 0) return true;
        if (expandedGroupProjects) {
            for (const key in expandedGroupProjects) {
                if (expandedGroupProjects[key] && expandedGroupProjects[key].size > 0) return true;
            }
        }
        if (expandedProjectRows) {
            for (const p in expandedProjectRows) {
                for (const g in expandedProjectRows[p] || {}) {
                    if (expandedProjectRows[p][g] && expandedProjectRows[p][g].size > 0) return true;
                }
            }
        }
        return false;
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

        // Prepare table data - move total row to the end
        let processRows = [];
        let totalRow = null;
        data.forEach(item => {
            const processName = getProcessName ? getProcessName(item.processId) : item.processName || item.processId;
            let cleanProcessName = cleanName(processName); // Use local, aggressive cleaner
            // The name is already cleaned by the getter from the parent component.
            if ((cleanProcessName || '').toLowerCase().includes('total')) {
                totalRow = [
                    'Total',
                    formatCellValue(item.completedTotalCatchesInPaper),
                    formatCellValue(item.completedTotalQuantityInPaper),
                    formatCellValue(item.completedTotalCatchesInBooklet),
                    formatCellValue(item.completedTotalQuantityInBooklet)
                ];
            } else {
                processRows.push([
                    cleanProcessName, // Use cleaned name
                    formatCellValue(item.completedTotalCatchesInPaper),
                    formatCellValue(item.completedTotalQuantityInPaper),
                    formatCellValue(item.completedTotalCatchesInBooklet),
                    formatCellValue(item.completedTotalQuantityInBooklet)
                ]);
            }
        });
        const tableData = totalRow ? [...processRows, totalRow] : processRows;

        // Add table with pleasant styling
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
            showHead: 'firstPage', // Show headers only on first page
            pageBreak: 'avoid', // Avoid breaking table across pages
            styles: {
                fontSize: 10,
                cellPadding: 4,
                lineColor: [200, 200, 200],
                lineWidth: 0.2,
                textColor: [33, 37, 41]
            },
            headStyles: {
                fillColor: [60, 60, 60],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                lineColor: [200, 200, 200],
                lineWidth: 0.2,
                halign: 'center'
            },
            bodyStyles: {
                fillColor: [255, 255, 255],
                textColor: [33, 37, 41]
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250]
            },
            columnStyles: {
                0: { cellWidth: 70, halign: 'center' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' }
            },
            didParseCell: function (data) {
                // Highlight Total row
                if (data.section === 'body') {
                    const cellValue = (data.row.raw && data.row.raw[0]) ? data.row.raw[0].toString().trim().toLowerCase() : '';
                    const isTotalRow = cellValue === 'total';
                    if (isTotalRow) {
                        data.cell.styles.fillColor = [225, 245, 254]; // Very light blue background
                        data.cell.styles.textColor = [33, 37, 41]; // Dark text for contrast
                        data.cell.styles.fontStyle = 'bold';
                        if (data.column.index === 0) {
                            data.cell.text = ['Total'];
                        }
                    }
                }
                // Highlight Lot No line in catch list row
                if (data.section === 'body' && data.row.raw && data.row.raw[0] && typeof data.row.raw[0].content === 'string') {
                    const content = data.row.raw[0].content;
                    if (content.includes('Lot No:')) {
                        // Change text color for the whole cell to blue for label and red for data
                        // jsPDF autoTable does not support inline color, so we use all-caps and asterisks for emphasis
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.textColor = [25, 118, 210]; // blue
                        // Optionally, you could split the line and use customDrawCell for more advanced formatting
                    }
                }
            }
        });

        // Save the PDF with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        doc.save(`Group_Production_Summary_${timestamp}.pdf`);
    };

    // Export Group Details to PDF
    const exportGroupDetailsToPDF = () => {
        const doc = new jsPDF();
        const { title, dateRange } = getReportInfo();

        // Add title and date range
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(title, 14, 20);
        if (dateRange) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Date Range: ${dateRange}`, 14, 30);
        }

        const tableBody = [];

        // Define styles for reuse
        const styles = {
            process: { fontStyle: 'bold', fillColor: '#f8f9fa' },
            group: { fillColor: '#e8f5e9', textColor: '#388e3c' },
            project: { fillColor: '#f9fbe7', textColor: '#1976d2' },
            catchList: { halign: 'left', fillColor: '#e3f2fd', textColor: '#1976d2', fontSize: 8 }
        };

        const anyExpanded = isAnyExpanded();

        data.forEach(process => {
            if (process.isTotal) return; // Skip total row

            // Process Row
            tableBody.push([
                { content: cleanName(getProcessName(process.processId)), styles: styles.process },
                { content: formatCellValue(process.completedTotalCatchesInPaper), styles: styles.process },
                { content: formatCellValue(process.completedTotalQuantityInPaper), styles: styles.process },
                { content: formatCellValue(process.completedTotalCatchesInBooklet), styles: styles.process },
                { content: formatCellValue(process.completedTotalQuantityInBooklet), styles: styles.process }
            ]);

            // Group Rows
            const groupIds = (anyExpanded && expandedGroupProcesses.has(process.processId)) || !anyExpanded
                ? (groupDetailsData[process.processId] || [])
                : [];
            groupIds.forEach(group => {
                tableBody.push([
                    { content: ` ${cleanName(getGroupName(group.groupId))}`, styles: styles.group },
                    { content: formatCellValue(group.completedTotalCatchesInPaper), styles: styles.group },
                    { content: formatCellValue(group.completedTotalQuantityInPaper), styles: styles.group },
                    { content: formatCellValue(group.completedTotalCatchesInBooklet), styles: styles.group },
                    { content: formatCellValue(group.completedTotalQuantityInBooklet), styles: styles.group }
                ]);

                // Project Rows
                const projectArr = (anyExpanded && expandedGroupProjects[process.processId]?.has(group.groupId)) || !anyExpanded
                    ? (groupProjectDetails[process.processId]?.[group.groupId] || [])
                    : [];
                projectArr.forEach(project => {
                    tableBody.push([
                        { content: `${cleanName(getProjectName(project.projectId))}`, styles: styles.project },
                        { content: formatCellValue(project.completedTotalCatchesInPaper), styles: styles.project },
                        { content: formatCellValue(project.completedTotalQuantityInPaper), styles: styles.project },
                        { content: formatCellValue(project.completedTotalCatchesInBooklet), styles: styles.project },
                        { content: formatCellValue(project.completedTotalQuantityInBooklet), styles: styles.project }
                    ]);

                    // Catch List Row
                    const showCatch = (anyExpanded && expandedProjectRows[process.processId]?.[group.groupId]?.has(project.projectId)) || !anyExpanded;
                    if (showCatch && projectCatchLists[process.processId]?.[group.groupId]?.[project.projectId]) {
                        const catchData = projectCatchLists[process.processId][group.groupId][project.projectId];
                        const bookletCatchList = catchData.bookletCatchList?.length > 0 ? catchData.bookletCatchList.join(', ') : 'None';
                        const paperCatchList = catchData.paperCatchList?.length > 0 ? catchData.paperCatchList.join(', ') : 'None';
                        const lotNos = catchData.lotNos?.length > 0 ? catchData.lotNos.join(', ') : 'None';
                        const lotNoLabel = 'Lot No:';
                        const lotNoLine = lotNos !== 'None'
                            ? `${lotNoLabel} ${lotNos}`
                            : `${lotNoLabel} None`;
                        const catchListText =
                            `Booklet Catch List: ${bookletCatchList}\n` +
                            `Paper Catch List: ${paperCatchList}\n` +
                            lotNoLine;
                        tableBody.push([
                            {
                                content: catchListText,
                                colSpan: 5,
                                styles: {
                                    ...styles.catchList,
                                }
                            }
                        ]);
                    }
                });
            });
        });

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
            body: tableBody,
            startY: dateRange ? 40 : 30,
            showHead: 'firstPage',
            theme: 'grid',
            headStyles: {
                fillColor: [60, 60, 60],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 70, halign: 'left' },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' }
            }
        });

        // Save the PDF
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        doc.save(`Group_Production_Details_${timestamp}.pdf`);
    };

    // Export Summary to Excel
    const exportSummaryToExcel = () => {
        const { title, dateRange } = getReportInfo();

        // Prepare worksheet data
        const worksheetData = [];

        // Add title and date range
        worksheetData.push([title]);
        if (dateRange) {
            worksheetData.push([`Date Range: ${dateRange}`]);
        }
        worksheetData.push([]); // Empty row

        // Add headers
        worksheetData.push(['Process', 'Paper Catch', 'Paper Quantity', 'Booklet Catch', 'Booklet Quantity']);

        // Add data rows - move total to the end
        let processRows = [];
        let totalRow = null;
        data.forEach(item => {
            const processName = getProcessName ? getProcessName(item.processId) : item.processName || item.processId;
            let cleanProcessName = cleanName(processName); // Use local, aggressive cleaner
            if ((cleanProcessName || '').toLowerCase().includes('total')) {
                totalRow = [
                    'Total',
                    formatCellValue(item.completedTotalCatchesInPaper),
                    formatCellValue(item.completedTotalQuantityInPaper),
                    formatCellValue(item.completedTotalCatchesInBooklet),
                    formatCellValue(item.completedTotalQuantityInBooklet)
                ];
            } else {
                processRows.push([
                    cleanProcessName, // Use cleaned name
                    formatCellValue(item.completedTotalCatchesInPaper),
                    formatCellValue(item.completedTotalQuantityInPaper),
                    formatCellValue(item.completedTotalCatchesInBooklet),
                    formatCellValue(item.completedTotalQuantityInBooklet)
                ]);
            }
        });

        // Add process rows first, then total
        worksheetData.push(...processRows);
        if (totalRow) {
            worksheetData.push(totalRow);
        }

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Style the worksheet
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        
        // Style headers (row 4)
        for (let col = range.s.c; col <= range.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col });
            if (!worksheet[cellAddress]) continue;
            worksheet[cellAddress].s = {
                fill: { fgColor: { rgb: "4A4A4A" } },
                font: { color: { rgb: "FFFFFF" }, bold: true },
                alignment: { horizontal: "center" }
            };
        }

        // Style total row (last row)
        if (totalRow) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: worksheetData.length - 1, c: col });
                if (!worksheet[cellAddress]) continue;
                worksheet[cellAddress].s = {
                    fill: { fgColor: { rgb: "E1F5FE" } },
                    font: { bold: true },
                    alignment: { horizontal: "center" }
                };
            }
        }

        // Set column widths
        worksheet['!cols'] = [
            { width: 30 }, // Process
            { width: 15 }, // Paper Catch
            { width: 15 }, // Paper Quantity
            { width: 15 }, // Booklet Catch
            { width: 15 }  // Booklet Quantity
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Group Production Summary');

        // Save the file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        XLSX.writeFile(workbook, `Group_Production_Summary_${timestamp}.xlsx`);
    };

    // Export Group Details to Excel
    const exportGroupDetailsToExcel = () => {
        const { title, dateRange } = getReportInfo();

        // Create workbook
        const workbook = XLSX.utils.book_new();

        const anyExpanded = isAnyExpanded();

        // Process each process in a separate worksheet
        data.forEach((process, processIndex) => {
            const processName = getProcessName ? getProcessName(process.processId) : process.processName || process.processId;
            const cleanProcessName = cleanName(processName); // Use local, aggressive cleaner
            const worksheetName = cleanProcessName.substring(0, 31); // Excel sheet name limit

            // Prepare worksheet data
            const worksheetData = [];

            // Add title and date range
            worksheetData.push([title]);
            if (dateRange) {
                worksheetData.push([`Date Range: ${dateRange}`]);
            }
            worksheetData.push([`Process: ${cleanProcessName}`]);
            worksheetData.push([]); // Empty row

            // Add headers
            worksheetData.push(['Level', 'Name', 'Paper Catch', 'Paper Quantity', 'Booklet Catch', 'Booklet Quantity']);

            // Add process row
            worksheetData.push([
                'Process',
                cleanProcessName, // Use cleaned name
                formatCellValue(process.completedTotalCatchesInPaper),
                formatCellValue(process.completedTotalQuantityInPaper),
                formatCellValue(process.completedTotalCatchesInBooklet),
                formatCellValue(process.completedTotalQuantityInBooklet)
            ]);

            // Add groups
            const groupArr = (anyExpanded && expandedGroupProcesses.has(process.processId)) || !anyExpanded
                ? (groupDetailsData[process.processId] || [])
                : [];
            groupArr.forEach(group => {
                worksheetData.push([
                    'Group',
                    cleanName(getGroupName ? getGroupName(group.groupId) : group.groupId),
                    formatCellValue(group.completedTotalCatchesInPaper),
                    formatCellValue(group.completedTotalQuantityInPaper),
                    formatCellValue(group.completedTotalCatchesInBooklet),
                    formatCellValue(group.completedTotalQuantityInBooklet)
                ]);

                // Add projects
                const projectArr = (anyExpanded && expandedGroupProjects[process.processId]?.has(group.groupId)) || !anyExpanded
                    ? (groupProjectDetails[process.processId]?.[group.groupId] || [])
                    : [];
                projectArr.forEach(project => {
                    worksheetData.push([
                        'Project',
                        cleanName(getProjectName ? getProjectName(project.projectId) : project.projectId),
                        formatCellValue(project.completedTotalCatchesInPaper),
                        formatCellValue(project.completedTotalQuantityInPaper),
                        formatCellValue(project.completedTotalCatchesInBooklet),
                        formatCellValue(project.completedTotalQuantityInBooklet)
                    ]);

                    // Add catch lists
                    const showCatch = (anyExpanded && expandedProjectRows[process.processId]?.[group.groupId]?.has(project.projectId)) || !anyExpanded;
                    if (showCatch && projectCatchLists[process.processId]?.[group.groupId]?.[project.projectId]) {
                        const catchData = projectCatchLists[process.processId][group.groupId][project.projectId];
                        const bookletCatchList = catchData.bookletCatchList && catchData.bookletCatchList.length > 0 ? 
                            catchData.bookletCatchList.join(', ') : 'None';
                        const paperCatchList = catchData.paperCatchList && catchData.paperCatchList.length > 0 ? 
                            catchData.paperCatchList.join(', ') : 'None';
                        const lotNos = catchData.lotNos && catchData.lotNos.length > 0 ? catchData.lotNos.join(', ') : 'None';
                        worksheetData.push([
                            'Catch Lists',
                            `Booklet: ${bookletCatchList} | Paper: ${paperCatchList} | Lot No: ${lotNos}`,
                            '',
                            '',
                            '',
                            ''
                        ]);
                    }
                });
            });

            // Create worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            // Style the worksheet
            const range = XLSX.utils.decode_range(worksheet['!ref']);
            
            // Style headers (row 5)
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 4, c: col });
                if (!worksheet[cellAddress]) continue;
                worksheet[cellAddress].s = {
                    fill: { fgColor: { rgb: "4A4A4A" } },
                    font: { color: { rgb: "FFFFFF" }, bold: true },
                    alignment: { horizontal: "center" }
                };
            }

            // Style process row (row 6)
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 5, c: col });
                if (!worksheet[cellAddress]) continue;
                worksheet[cellAddress].s = {
                    fill: { fgColor: { rgb: "F8F9FA" } },
                    font: { bold: true },
                    alignment: { horizontal: "center" }
                };
            }

            // Style group, project, and catch list rows
            for (let row = 6; row <= range.e.r; row++) {
                const levelCell = XLSX.utils.encode_cell({ r: row, c: 0 });
                if (!worksheet[levelCell]) continue;
                
                const level = worksheet[levelCell].v;
                for (let col = range.s.c; col <= range.e.c; col++) {
                    const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                    if (!worksheet[cellAddress]) continue;
                    
                    if (level === 'Group') {
                        worksheet[cellAddress].s = {
                            fill: { fgColor: { rgb: "E8F5E8" } },
                            font: { color: { rgb: "388E3C" } },
                            alignment: { horizontal: col === 1 ? "left" : "center" }
                        };
                    } else if (level === 'Project') {
                        worksheet[cellAddress].s = {
                            fill: { fgColor: { rgb: "F9FBE7" } },
                            font: { color: { rgb: "1976D2" } },
                            alignment: { horizontal: col === 1 ? "left" : "center" }
                        };
                    } else if (level === 'Catch Lists') {
                        worksheet[cellAddress].s = {
                            fill: { fgColor: { rgb: "E3F2FD" } },
                            font: { color: { rgb: "1976D2" }, italic: true },
                            alignment: { horizontal: col === 1 ? "left" : "center" }
                        };
                    }
                }
            }

            // Set column widths
            worksheet['!cols'] = [
                { width: 12 }, // Level
                { width: 30 }, // Name
                { width: 15 }, // Paper Catch
                { width: 15 }, // Paper Quantity
                { width: 15 }, // Booklet Catch
                { width: 15 }  // Booklet Quantity
            ];

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);
        });

        // Save the file
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        XLSX.writeFile(workbook, `Group_Production_Details_${timestamp}.xlsx`);
    };

    // Determine which export function to call based on view type
    const handleExport = (type) => {
        if (viewType === 'summary') {
            if (type === 'pdf') {
                exportSummaryToPDF();
            } else if (type === 'excel') {
                exportSummaryToExcel();
            }
        } else if (viewType === 'group-details') {
            if (type === 'pdf') {
                exportGroupDetailsToPDF();
            } else if (type === 'excel') {
                exportGroupDetailsToExcel();
            }
        }
    };

    return (
        <div className={`d-flex justify-content-end  ${className}`}>
            <Dropdown>
                <Dropdown.Toggle  variant="primary"
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
                    }}>
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
                     style={{ 
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        color: '#dc3545',
                        width: '70px',
                        height: '48px',
                        marginBottom: '4px'
                    }}
                    
                    
                    onClick={() => handleExport('pdf')}>
                        <FaFilePdf className="me-2 text-danger" style={{ fontSize: '35px' }} />
                     
                    </Dropdown.Item>
                    <Dropdown.Item
                     style={{ 
                        borderRadius: '8px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        color: '#dc3545',
                        width: '70px',
                        height: '48px',
                        marginBottom: '4px'
                    }}
                    
                    onClick={() => handleExport('excel')}>
                        <FaFileExcel className="me-2 text-success"style={{ fontSize: '35px' }} />
                        
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export default GroupExport;
