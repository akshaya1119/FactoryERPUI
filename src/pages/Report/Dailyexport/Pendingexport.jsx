import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { FaFilePdf, FaFileExcel, FaDownload } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Utility function to clean names - remove % symbols and extra spaces
const cleanName = (name) => {
    if (!name) return '';

    console.log('=== CLEANING PENDING NAME ===');
    console.log('Original:', JSON.stringify(name));
    console.log('Type:', typeof name);

    // Convert to string and handle ALL possible % variations
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

    // Pass 2: Character-by-character cleaning
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
    console.log('=== END CLEANING ===');

    return cleanedName;
};

// Group catchDetails by catchNo and sum quantities
const groupCatchDetails = (catchDetails = []) => {
    const map = {};
    catchDetails.forEach(cd => {
        if (!cd.catchNo) return;
        if (!map[cd.catchNo]) map[cd.catchNo] = 0;
        map[cd.catchNo] += cd.quantity || 0;
    });
    // Return as array of { catchNo, quantity }
    return Object.entries(map).map(([catchNo, quantity]) => ({ catchNo, quantity }));
};

// Helper to calculate detailed time ago from lastLoggedAt
const getTimeAgo = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    
    const now = new Date();
    const last = new Date(dateTimeStr);
    const diffMs = now - last;
    
    if (diffMs < 0) return 'Future';
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30.44); // Average days per month
    const diffYears = Math.floor(diffDays / 365.25); // Average days per year
    
    if (diffYears > 0) {
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    } else if (diffMonths > 0) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    } else if (diffWeeks > 0) {
        return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    } else if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
        return 'Just now';
    }
};

const PendingExport = ({
    data,
    startDate,
    endDate,
    getProcessName,
    className = "mb-3",
    expandedPendingProcessIds = new Set(),
    allProcessCatchDetails = {},
    exportDisabled = false,
    groupName, // new
    projectName, // new
    lotNo // new
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
        const title = 'Pending Process Report';

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
        let infoY = 30;
        if (dateRange) {
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Date: ${dateRange}`, 14, infoY);
            infoY += 8;
        }
        // Add group/project/lot info
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        if (groupName) {
            doc.text(`Group: ${groupName}`, 14, infoY);
            infoY += 8;
        }
        if (projectName) {
            doc.text(`Project: ${projectName}`, 14, infoY);
            infoY += 8;
        }
        if (lotNo) {
            doc.text(`Lot: ${lotNo}`, 14, infoY);
            infoY += 8;
        }
        let startY = infoY;

        // Create table structure matching the pending report table
        // Header row 1: Process names with last activity
        const headerRow1 = [];
        data.forEach(item => {
            const processName = getProcessName ? getProcessName(item.processId) : item.processName || item.processId;
            const cleanProcessName = cleanName(processName);
            const lastActivity = item.lastLoggedAt
                ? `\nLast Activity: ${getTimeAgo(item.lastLoggedAt)}`
                : '';
            headerRow1.push({
                content: cleanProcessName + lastActivity,
                colSpan: 2,
                styles: { 
                    fillColor: [224, 242, 241], 
                    fontStyle: 'bold', 
                    halign: 'center', 
                    valign: 'middle', 
                    fontSize: 8
                }
            });
        });

        // Header row 2: Summary counts
        const headerRow2 = [];
        data.forEach(item => {
            headerRow2.push({
                content: `${item.totalCatchCount || 0}/${item.totalQuantity || 0}`,
                colSpan: 2,
                styles: { 
                    fillColor: [56, 142, 60], 
                    textColor: [255, 255, 255], 
                    fontStyle: 'bold', 
                    halign: 'center', 
                    fontSize: 10 
                }
            });
        });

        // Header row 3: Catch/Quantity subheaders
        const headerRow3 = [];
        data.forEach(item => {
            headerRow3.push(
                { content: 'Catch', styles: { fillColor: [245, 245, 245], fontStyle: 'bold', halign: 'center', fontSize: 9, textColor: [220, 53, 69] } },
                { content: 'Quantity', styles: { fillColor: [245, 245, 245], fontStyle: 'bold', halign: 'center', fontSize: 9, textColor: [220, 53, 69] } }
            );
        });

        // Body rows: Catch details
        // Sort catchDetails by quantity descending for each item
        const sortedData = data.map(item => ({
            ...item,
            catchDetails: groupCatchDetails(item.catchDetails)
                .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        }));
        const maxRows = Math.max(...sortedData.map(item => (item.catchDetails ? item.catchDetails.length : 0)));
        
        const bodyRows = [];
        for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
            const bodyRow = [];
            sortedData.forEach(item => {
                const catchItem = item.catchDetails && item.catchDetails[rowIdx];
                bodyRow.push(
                    { content: catchItem ? catchItem.catchNo : '', styles: { halign: 'center', fontSize: 9 } },
                    { content: catchItem ? catchItem.quantity || '' : '', styles: { halign: 'center', fontSize: 9 } }
                );
            });
            bodyRows.push(bodyRow);
        }

        // Create the table
        doc.autoTable({
            head: [headerRow1, headerRow2, headerRow3],
            body: bodyRows,
            startY,
            tableWidth: 'auto',
            margin: { left: 10, right: 10 },
            styles: {
                fontSize: 9,
                cellPadding: 3,
                textColor: [33, 37, 41],
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.2,
                lineColor: [180, 180, 180],
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [33, 37, 41],
                fontStyle: 'bold',
                halign: 'center',
                valign: 'middle',
                fontSize: 10,
                cellPadding: 3,
                lineWidth: 0.2,
                lineColor: [180, 180, 180],
            },
            bodyStyles: {
                fillColor: [255, 255, 255],
                textColor: [33, 37, 41],
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.2,
                lineColor: [180, 180, 180],
            },
            tableLineWidth: 0.2,
            tableLineColor: [180, 180, 180],
            showHead: 'firstPage',
        });

        // Save the PDF with timestamp to avoid caching
        const timestamp = new Date().getTime();
        doc.save(`Pending_Process_Summary_${dateRange || 'Report'}_${timestamp}.pdf`);
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
        if (groupName) {
            XLSX.utils.sheet_add_aoa(ws, [[`Group: ${groupName}`]], { origin: `A${currentRow}` });
            currentRow++;
        }
        if (projectName) {
            XLSX.utils.sheet_add_aoa(ws, [[`Project: ${projectName}`]], { origin: `A${currentRow}` });
            currentRow++;
        }
        if (lotNo) {
            XLSX.utils.sheet_add_aoa(ws, [[`Lot: ${lotNo}`]], { origin: `A${currentRow}` });
            currentRow++;
        }
        currentRow++; // Empty row

        // Create table structure matching the pending report table
        // Header row 1: Process names with last activity
        const headerRow1 = [];
        data.forEach(item => {
            const processName = getProcessName ? getProcessName(item.processId) : item.processName || item.processId;
            const cleanProcessName = cleanName(processName);
            const lastActivity = item.lastLoggedAt
                ? `\nLast Activity: ${getTimeAgo(item.lastLoggedAt)}`
                : '';
            headerRow1.push(cleanProcessName + lastActivity, ''); // Empty cell for colspan
        });
        XLSX.utils.sheet_add_aoa(ws, [headerRow1], { origin: `A${currentRow}` });
        currentRow++;

        // Header row 2: Summary counts
        const headerRow2 = [];
        data.forEach(item => {
            headerRow2.push(`${item.totalCatchCount || 0}/${item.totalQuantity || 0}`, ''); // Empty cell for colspan
        });
        XLSX.utils.sheet_add_aoa(ws, [headerRow2], { origin: `A${currentRow}` });
        currentRow++;

        // Header row 3: Catch/Quantity subheaders
        const headerRow3 = [];
        data.forEach(item => {
            headerRow3.push('Catch', 'Quantity');
        });
        XLSX.utils.sheet_add_aoa(ws, [headerRow3], { origin: `A${currentRow}` });
        currentRow++;

        // Body rows: Catch details
        // Sort catchDetails by quantity descending for each item
        const sortedData = data.map(item => ({
            ...item,
            catchDetails: groupCatchDetails(item.catchDetails)
                .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        }));
        const maxRows = Math.max(...sortedData.map(item => (item.catchDetails ? item.catchDetails.length : 0)));
        
        for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
            const bodyRow = [];
            sortedData.forEach(item => {
                const catchItem = item.catchDetails && item.catchDetails[rowIdx];
                bodyRow.push(
                    catchItem ? catchItem.catchNo : '',
                    catchItem ? catchItem.quantity || '' : ''
                );
            });
            XLSX.utils.sheet_add_aoa(ws, [bodyRow], { origin: `A${currentRow}` });
            currentRow++;
        }

        // Set column widths - 2 columns per process
        const columnWidths = [];
        data.forEach(() => {
            columnWidths.push({ width: 15 }); // Catch column
            columnWidths.push({ width: 15 }); // Quantity column
        });
        ws['!cols'] = columnWidths;

        // Add cell merges for header rows
        const merges = [];
        let colIndex = 0;
        data.forEach(() => {
            // Merge process name cells (row 1)
            merges.push({ s: { r: currentRow - maxRows - 4, c: colIndex }, e: { r: currentRow - maxRows - 4, c: colIndex + 1 } });
            // Merge summary count cells (row 2)
            merges.push({ s: { r: currentRow - maxRows - 3, c: colIndex }, e: { r: currentRow - maxRows - 3, c: colIndex + 1 } });
            colIndex += 2;
        });
        ws['!merges'] = merges;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Pending Process Summary');

        // Save the file
        XLSX.writeFile(wb, `Pending_Process_Summary_${dateRange || 'Report'}.xlsx`);
    };



    // Don't render if no data
    if (!data || data.length === 0) {
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
                        backgroundColor: exportDisabled ? '#adb5bd' : '#0d6efd',
                        transition: 'all 0.2s ease',
                       
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
                        onClick={exportDisabled ? undefined : exportSummaryToPDF}
                        className="d-flex align-items-center justify-content-center p-2"
                        style={{ 
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                          
                            color: '#dc3545',
                            width: '70px',
                            height: '48px',
                            marginBottom: '4px',
                           
                        }}
                        onMouseOver={(e) => {  e.currentTarget.style.backgroundColor = '#fff5f5'; }}
                        onMouseOut={(e) => {  e.currentTarget.style.backgroundColor = 'transparent'; }}
                        
                        
                    >
                        <FaFilePdf style={{ fontSize: '35px' }} />
                    </Dropdown.Item>

                    <Dropdown.Item
                        onClick={exportDisabled ? undefined : exportSummaryToExcel}
                        className="d-flex align-items-center justify-content-center p-2"
                        style={{ 
                            borderRadius: '8px',
                            transition: 'all 0.2s ease',
                            
                            color: '#28a745',
                            width: '70px',
                            height: '48px',
                            
                        }}
                        onMouseOver={(e) => {  e.currentTarget.style.backgroundColor = '#f0fff4'; }}
                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                     
                     
                    >
                        <FaFileExcel style={{ fontSize: '35px' }} />
                    </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
        </div>
    );
};

export { PendingExport };
export default PendingExport;