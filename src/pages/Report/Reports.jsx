import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Spinner, Dropdown } from "react-bootstrap";
import {
    FaFileExport, FaSearch, FaFilter, FaSave, FaSortUp, FaSortDown, FaList,
    FaUndo, FaObjectGroup, FaBoxes, FaCalendarAlt, FaTable, FaListOl, FaChartBar,
    FaChartPie, FaUserTie, FaClock, FaCogs, FaIndustry, FaChevronDown, FaChevronRight
} from 'react-icons/fa';
import { FaAnglesLeft, FaAnglesRight } from "react-icons/fa6";
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import API from "../../CustomHooks/MasterApiHooks/api";
import Table from 'react-bootstrap/Table';
import ExcelExport from './Excel';
import PdfExport from './Pdf';
import { AiFillCloseSquare } from "react-icons/ai";
import ProcessDetails from './Process';
import DailyReport from "./Dailyreport";

const ProjectReport = () => {
    const [activeProjects, setActiveProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(() => localStorage.getItem('selectedGroup') || "");
    const [selectedLot, setSelectedLot] = useState("");
    const [lotNumbers, setLotNumbers] = useState([]);
    const [groups, setGroups] = useState({});
    const [quantitySheets, setQuantitySheets] = useState([]);
    const [showTable, setShowTable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [projectName, setProjectName] = useState("");

    const [selectedCatch, setSelectedCatch] = useState(null);
    const [showCatchView, setShowCatchView] = useState(false);
    const [viewMode, setViewMode] = useState('catch'); // 'catch' or 'process'
    const [searchResults, setSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [visibleColumns, setVisibleColumns] = useState({
        catchNo: true,
        subject: true,
        course: true,
        paper: true,
        examDate: true,
        examTime: true,
        quantity: true,
        pages: true,
        status: true,
        startTime: true,
        endTime: true,
        duration: true,
        currentProcess: true,
        innerEnvelope: true,
        outerEnvelope: true,
    });

    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const [filteredSheets, setFilteredSheets] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const [recordsPerPage, setRecordsPerPage] = useState(10);

    const [currentSearchPage, setCurrentSearchPage] = useState(1);
    const [hasMoreResults, setHasMoreResults] = useState(false);

    const [showDailyReport, setShowDailyReport] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState('Detailed Report');

    // Define CSS animations
    const keyframes = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideInUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        @keyframes shimmer {
            0% { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
        }
    `;

    // Add the keyframes to the document and card hover effects
    React.useEffect(() => {
        // Add keyframes and z-index styles
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
            ${keyframes}

            /* Ensure dropdowns appear above all other elements */
            .position-absolute.bg-white.rounded.shadow-lg {
                z-index: 99999 !important;
            }

            /* Ensure cards have a lower z-index */
            .card {
                z-index: 1;
            }
        `;
        document.head.appendChild(styleElement);

        // Add hover effects to cards
        const addCardHoverEffects = () => {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-5px)';
                    card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.06)';
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)';
                });
            });
        };

        // Add the hover effects after a short delay to ensure the DOM is ready
        const timer = setTimeout(() => {
            addCardHoverEffects();
        }, 500);

        return () => {
            document.head.removeChild(styleElement);
            clearTimeout(timer);
        };
    }, [keyframes]);

    // Define global styles for the component
    const styles = {
        pageContainer: {
            background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
            minHeight: '100vh',
            padding: '25px 20px',
            transition: 'all 0.3s ease',
            position: 'relative'
        },
       
        pageHeader: {
            marginBottom: '25px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            paddingBottom: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        pageTitle: {
            display: 'flex',
            alignItems: 'center',
            fontSize: '1.75rem',
            fontWeight: '600',
            color: '#2c3e50',
            margin: '0'
        },
        pageTitleIcon: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #4a90e2, #5e72e4)',
            color: 'white',
            marginRight: '12px',
            boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)'
        },
        sectionTitle: {
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '15px',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            textAlign: 'center'
        },
        sectionIcon: {
            marginRight: '8px',
            color: '#4a90e2'
        },
        card: {
            borderRadius: '12px',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            overflow: 'hidden',
            height: '100%',
            backgroundColor: 'white',
            cursor: 'pointer',
            zIndex: 1 /* Ensure cards have a lower z-index than dropdowns */
        },
        formLabel: {
            fontSize: '0.9rem',
            fontWeight: '500',
            color: '#495057',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px'
        },
        formControl: {
            backgroundColor: "#ffffff",
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
            height: "42px",
            fontSize: "0.9rem",
            padding: '10px 12px',
            width: '100%'
        },
        button: {
            transition: "all 0.3s ease",
            boxShadow: "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
            fontWeight: '500',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        table: {
            borderCollapse: 'separate',
            borderSpacing: '0',
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.05)'
        },
        tableHeader: {
            backgroundColor: '#f8f9fa',
            color: '#495057',
            fontWeight: '600',
            fontSize: '0.9rem',
            padding: '12px 15px',
            textAlign: 'left',
            borderBottom: '2px solid #e9ecef'
        },
        tableCell: {
            padding: '12px 15px',
            fontSize: '0.9rem',
            borderBottom: '1px solid #e9ecef',
            color: '#495057'
        },
        filterSection: {
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
            border: '1px solid rgba(0,0,0,0.05)',
            animation: 'slideInUp 0.5s ease-in-out 0.1s both',
            position: 'relative',
            zIndex: 1 /* Ensure filter section has a lower z-index than dropdowns */
        }
    };

    const columnDefinitions = [
        { id: 'catchNo', label: 'Catch No' },
        { id: 'subject', label: 'Subject' },
        { id: 'course', label: 'Course' },
        { id: 'paper', label: 'Paper' },
        { id: 'examDate', label: 'Exam Date' },
        { id: 'examTime', label: 'Exam Time' },
        { id: 'quantity', label: 'Quantity' },
        { id: 'pages', label: 'Pages' },
        { id: 'status', label: 'Status' },
        { id: 'startTime', label: 'SD-ST' },
        { id: 'endTime', label: 'ED-ET' },
        { id: 'duration', label: 'Duration' },
        { id: 'currentProcess', label: 'Current Process' },
        { id: 'innerEnvelope', label: 'Inner Envelope' },
        { id: 'outerEnvelope', label: 'Outer Envelope' },
    ];

    useEffect(() => {
        if (selectedProjectId) {
            const project = activeProjects.find(p => p.projectId === parseInt(selectedProjectId));
            setProjectName(project ? project.name : "");
        }



    }, [selectedProjectId]);


    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const groupsResponse = await API.get("/Reports/GetAllGroups");
                const groupsMap = {};
                groupsResponse.data.forEach((group) => {
                    if (group.status) {
                        groupsMap[group.id] = group.name;
                    }
                });
                setGroups(groupsMap);
            } catch (error) {
                console.error("Error fetching groups:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            if (selectedGroup) {
                setIsLoading(true);
                try {
                    const projectsResponse = await API.get(`/Reports/GetProjectsByGroupId/${selectedGroup}`);
                    setActiveProjects(projectsResponse.data);
                    localStorage.setItem('selectedGroup', selectedGroup);
                } catch (error) {
                    console.error("Error fetching projects:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setActiveProjects([]);
                localStorage.removeItem('selectedGroup');
                localStorage.removeItem('selectedProjectId');
            }
        };

        fetchProjects();
    }, [selectedGroup]);

    useEffect(() => {
        const fetchLotNumbers = async () => {
            if (selectedProjectId) {
                setIsLoading(true);
                try {
                    const response = await API.get(`/Reports/GetLotNosByProjectId/${selectedProjectId}`);
                    setLotNumbers(response.data);
                    localStorage.setItem('selectedProjectId', selectedProjectId);
                } catch (error) {
                    console.error("Error fetching lot numbers:", error);
                    setLotNumbers([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setLotNumbers([]);
                localStorage.removeItem('selectedProjectId');
            }
        };

        fetchLotNumbers();
    }, [selectedProjectId, activeProjects]);

    useEffect(() => {
        setFilteredSheets(quantitySheets);
        setCurrentPage(0);
    }, [quantitySheets]);


    const fetchProjectName = async () => {
        try {
            const response = await API.get('/Project');
            const projects = response.data;
            const projectData = projects.map(project => ({
                projectId: project.projectId,
                name: project.name
            }));
            return projectData;
        } catch (error) {
            console.error("Error fetching project names:", error);
            return [];
        }
    }

    const handleViewReport = async () => {
        setSelectedItem(null);
        if (selectedProjectId) {
            setIsLoading(true);
            try {
                // First get the project details to get the series name
                const projectResponse = await API.get(`/Project/${selectedProjectId}`);
                const projectDetails = projectResponse.data;

                // Then get the quantity sheets
                const response = await API.get(`/Reports/GetQuantitySheetsByProjectId/${selectedProjectId}/LotNo/${selectedLot}`);
                const filteredSheets = selectedLot
                    ? response.data.filter((sheet) => sheet.lotNo === selectedLot)
                    : response.data;

                // Group by catchNo and sum quantities
                const groupedSheets = filteredSheets.reduce((acc, sheet) => {
                    const existing = acc.find(item => item.catchNo === sheet.catchNo);
                    if (existing) {
                        existing.quantity += sheet.quantity; // Sum the quantity
                    } else {
                        acc.push({ ...sheet }); // Add new entry
                    }
                    return acc;
                }, []);

                // Add series name to each sheet with the correct series letter if series exists
                const sheetsWithSeries = groupedSheets.map((sheet, index) => {
                    const catchNo = sheet.catchNo;

                    // Check if project has series name and number of series
                    // Removed series name logic
                    return {
                        ...sheet,
                        // seriesName: `${seriesLetter}` // Removed this line
                    };
                });

                setQuantitySheets(sheetsWithSeries);
                setShowTable(true);
            } catch (error) {
                console.error("Error fetching quantity sheets:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };
    const handleSearch = async (query, page = 1, pageSize = 5) => {
        if (!query.trim()) {
            setSearchResults([]);
            setHasMoreResults(false);
            return;
        }
        setIsSearching(true);
        try {
            const response = await API.get(`/Reports/search`, {
                params: {
                    query: query,
                    page: page,
                    pageSize: pageSize,
                    groupId: selectedGroup,
                    projectId: selectedProjectId
                }
            });

            // Map project IDs to project names
            const projectNames = await fetchProjectName();
            const resultsWithProjectNames = response.data.results.map(result => {
                const project = projectNames.find(p => p.projectId === result.projectId);
                return {
                    ...result,
                    projectName: project ? project.name : 'Unknown Project'
                };
            });

            if (page === 1) {
                setSearchResults(resultsWithProjectNames);
            } else {
                setSearchResults(prev => [...prev, ...resultsWithProjectNames]);
            }

            setHasMoreResults(response.data.results.length === pageSize);
            setCurrentSearchPage(page);
        } catch (error) {
            console.error("Error searching:", error);
            setSearchResults([]);
            setHasMoreResults(false);
        } finally {
            setIsSearching(false);
        }
    };

    const handleShowMore = () => {
        handleSearch(searchTerm, currentSearchPage + 1);
    };

    const SearchCatchClick = async (value) => {
        setQuantitySheets([]);
        setSearchTerm('');
        setSearchResults([]);
        setSelectedItem(null); // Clear selected item
        setShowDropdown(false); // Hide dropdown

        if (!value) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);

        try {
            const response = await API.get(`/Reports/GetQuantitySheetsByCatchNo/${value.projectId}/${value.catchNo}`);
            // console.log(response.data);
            setShowDropdown(false);
            setSelectedItem(response.data[0]);
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSort = (field) => {
        const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(newDirection);

        const sortedSheets = [...quantitySheets].sort((a, b) => {
            let aValue, bValue;

            // Match the field names with your sheet data structure
            switch (field) {
                case 'catchNo':
                    aValue = a.catchNo;
                    bValue = b.catchNo;
                    break;
                case 'subject':
                    aValue = a.subject;
                    bValue = b.subject;
                    break;
                case 'course':
                    aValue = a.course;
                    bValue = b.course;
                    break;
                case 'paper':
                    aValue = a.paper;
                    bValue = b.paper;
                    break;
                case 'examDate':
                    aValue = new Date(a.examDate);
                    bValue = new Date(b.examDate);
                    break;
                case 'examTime':
                    aValue = a.examTime;
                    bValue = b.examTime;
                    break;
                case 'quantity':
                    aValue = Number(a.quantity);
                    bValue = Number(b.quantity);
                    break;
                case 'pages':
                    aValue = Number(a.pages);
                    bValue = Number(b.pages);
                    break;
                case 'status':
                    aValue = a.catchStatus;
                    bValue = b.catchStatus;
                    break;
                case 'currentProcess':
                    aValue = a.currentProcessName;
                    bValue = b.currentProcessName;
                    break;
                case 'dispatchDate':
                    aValue = a.dispatchDate;
                    bValue = b.dispatchDate;
                    break;

                default:
                    aValue = a[field];
                    bValue = b[field];
            }

            // Handle null/undefined values
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Sort based on direction
            const compareResult =
                typeof aValue === 'string'
                    ? aValue.localeCompare(bValue)
                    : aValue - bValue;

            return newDirection === 'asc' ? compareResult : -compareResult;
        });

        setQuantitySheets(sortedSheets);
    };

    const handleRecordsPerPageChange = (e) => {
        const newRecordsPerPage = Number(e.target.value);
        setRecordsPerPage(newRecordsPerPage);
        setCurrentPage(0);
    };

    const handleResetAll = () => {
        // Reset all state variables
        setSelectedReportType('Detailed Report');
        setShowDailyReport(false);
        setSelectedGroup('');
        setSelectedProjectId('');
        setSelectedLot('');
        setQuantitySheets([]);
        setFilteredSheets([]);
        setSearchTerm('');
        setCurrentPage(0);
        setRecordsPerPage(10);
        setSortField('');
        setSortDirection('asc');
        setSearchResults([]);
        setSelectedItem(null);
        setSelectedCatch(null);
        setShowCatchView(false);
        setShowTable(false);
        setVisibleColumns({
            catchNo: true,
            subject: true,
            course: true,
            paper: true,
            examDate: true,
            examTime: true,
            quantity: true,
            pages: true,
            status: true,
            innerEnvelope: true,
            outerEnvelope: true,
            dispatchDate: true,
        });
    };

    return (
        <Container fluid style={styles.pageContainer}>
            <div style={styles.reportContainer}>
                {/* Page Title and Header */}
                <div style={styles.pageHeader}>
                    <div style={{width: '150px'}}> {/* Left side controls if needed */}
                    </div>
                    <h2 style={{...styles.pageTitle, justifyContent: 'center', textAlign: 'center'}}>
                       
                        Report
                    </h2>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px', width: '250px', justifyContent: 'flex-end'}}>
                        <Dropdown>
                            
                            <Dropdown.Toggle
                                variant="outline-primary"
                                id="report-type-dropdown"
                                style={{
                                    backgroundColor: '#f0f7ff',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                                    border: '1px solid #4a90e2',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    color: '#4a90e2',
                                    minWidth: '150px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}
                            >
                                {selectedReportType}
                                
                            </Dropdown.Toggle>

                            <Dropdown.Menu style={{
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                border: '1px solid rgba(0,0,0,0.05)',
                                padding: '8px',
                                minWidth: '200px'
                            }}>
                                
                                <Dropdown.Item
                                    onClick={() => {
                                        setSelectedReportType('Detailed Report');
                                        setShowDailyReport(false);
                                        // Reset all state variables when switching report types
                                        setSelectedGroup('');
                                        setSelectedProjectId('');
                                        setSelectedLot('');
                                        setQuantitySheets([]);
                                        setFilteredSheets([]);
                                        setSearchTerm('');
                                        setCurrentPage(0);
                                        setRecordsPerPage(10);
                                        setSortField('');
                                        setSortDirection('asc');
                                        setSearchResults([]);
                                        setSelectedItem(null);
                                        setSelectedCatch(null);
                                        setShowCatchView(false);
                                        setShowTable(false);
                                        setVisibleColumns({
                                            catchNo: true,
                                            subject: true,
                                            course: true,
                                            paper: true,
                                            examDate: true,
                                            examTime: true,
                                            quantity: true,
                                            pages: true,
                                            status: true,
                                            innerEnvelope: true,
                                            outerEnvelope: true,
                                            dispatchDate: true,
                                        });
                                    }}
                                    style={{
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        fontWeight: selectedReportType === 'Detailed Report' ? '600' : '500',
                                        backgroundColor: selectedReportType === 'Detailed Report' ? '#e8f4fd' : 'transparent',
                                        color: selectedReportType === 'Detailed Report' ? '#4a90e2' : '#495057'
                                    }}
                                >
                                    Detailed Report
                                </Dropdown.Item>
                                <Dropdown.Item
                                    onClick={() => {
                                        setSelectedReportType(' Daily Production Report');
                                        setShowDailyReport(true);
                                        // Reset all state variables when switching to  Daily Production Report
                                        setSelectedGroup('');
                                        setSelectedProjectId('');
                                        setSelectedLot('');
                                        setQuantitySheets([]);
                                        setFilteredSheets([]);
                                        setSearchTerm('');
                                        setCurrentPage(0);
                                        setRecordsPerPage(10);
                                        setSortField('');
                                        setSortDirection('asc');
                                        setSearchResults([]);
                                        setSelectedItem(null);
                                        setSelectedCatch(null);
                                        setShowCatchView(false);
                                        setShowTable(false);
                                        setVisibleColumns({
                                            catchNo: true,
                                            subject: true,
                                            course: true,
                                            paper: true,
                                            examDate: true,
                                            examTime: true,
                                            quantity: true,
                                            pages: true,
                                            status: true,
                                            innerEnvelope: true,
                                            outerEnvelope: true,
                                            dispatchDate: true,
                                        });
                                    }}
                                    style={{
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        fontWeight: selectedReportType === ' Daily Production Report' ? '600' : '500',
                                        backgroundColor: selectedReportType === ' Daily Production Report' ? '#e8f4fd' : 'transparent',
                                        color: selectedReportType === ' Daily Production Report' ? '#4a90e2' : '#495057'
                                    }}
                                >
                                    Daily Production Report
                                </Dropdown.Item>

                               
                                <Dropdown.Item
                                    onClick={() => {
                                        setSelectedReportType('User Wise Report');
                                        setShowDailyReport(false);
                                        // Reset all state variables when switching report types
                                        setSelectedGroup('');
                                        setSelectedProjectId('');
                                        setSelectedLot('');
                                        setQuantitySheets([]);
                                        setFilteredSheets([]);
                                        setSearchTerm('');
                                        setCurrentPage(0);
                                        setRecordsPerPage(10);
                                        setSortField('');
                                        setSortDirection('asc');
                                        setSearchResults([]);
                                        setSelectedItem(null);
                                        setSelectedCatch(null);
                                        setShowCatchView(false);
                                        setShowTable(false);
                                        setVisibleColumns({
                                            catchNo: true,
                                            subject: true,
                                            course: true,
                                            paper: true,
                                            examDate: true,
                                            examTime: true,
                                            quantity: true,
                                            pages: true,
                                            status: true,
                                            innerEnvelope: true,
                                            outerEnvelope: true,
                                            dispatchDate: true,
                                        });
                                    }}
                                    style={{
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        fontWeight: selectedReportType === 'User Wise Report' ? '600' : '500',
                                        backgroundColor: selectedReportType === 'User Wise Report' ? '#e8f4fd' : 'transparent',
                                        color: selectedReportType === 'User Wise Report' ? '#4a90e2' : '#495057'
                                    }}
                                >
                                    User Wise Report
                                </Dropdown.Item>
                              
                               

                               
                               
                            </Dropdown.Menu>
                        </Dropdown>
                        <Button
                            variant="outline-primary"
                            className="rounded"
                            onClick={handleResetAll}
                            style={{
                                ...styles.button,
                                padding: '4px 12px',
                                backgroundColor: '#f0f7ff',
                                border: '1px solid #4a90e2',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: '500',
                                color: '#4a90e2',
                                minWidth: '80px',
                                justifyContent: 'center'
                            }}
                        >
                            <FaUndo className="me-1" style={{fontSize: '0.75rem'}} />
                            Reset
                        </Button>
                    </div>
                </div>

                {selectedReportType === ' Daily Production Report' ? (
                    <DailyReport />
                ) : selectedReportType === 'Process Report' ? (
                    <DailyProcessCompletionSummary />
                ) : selectedReportType === 'Pending Report' ? (
                    <PendingReport />
                ) : selectedReportType === 'Detailed Report' ? (
                    <>
                        {/* Filters Section */}
                        <div style={styles.filterSection}>

                            <Row className="g-3">
                                {/* Group Dropdown */}
                                <Col xs={12} md={6} lg={2}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={styles.formLabel}>
                                            <FaObjectGroup style={{ marginRight: '8px', color: '#4a90e2' }} />
                                            Group <span style={{ color: '#e74c3c', marginLeft: '3px' }}>*</span>
                                        </div>
                                        <Form.Select
                                            onChange={(e) => {
                                                setSelectedGroup(e.target.value);
                                                setSelectedProjectId('');
                                                setQuantitySheets([]);
                                            }}
                                            value={selectedGroup}
                                            style={styles.formControl}
                                        >
                                            <option value="">Select Group</option>
                                            {Object.entries(groups).map(([id, name]) => (
                                                <option key={id} value={id}>{name}</option>
                                            ))}
                                        </Form.Select>
                                    </div>
                                </Col>

                                {/* Project Dropdown */}
                                <Col xs={12} md={6} lg={2}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={styles.formLabel}>
                                            <FaList style={{ marginRight: '8px', color: '#4a90e2' }} />
                                            Project <span style={{ color: '#e74c3c', marginLeft: '3px' }}>*</span>
                                        </div>
                                        <Form.Select
                                            onChange={(e) => {
                                                setSelectedProjectId(e.target.value);
                                                setSelectedLot("");
                                                setQuantitySheets([]);
                                            }}
                                            value={selectedProjectId}
                                            style={styles.formControl}
                                        >
                                            <option value="">Select Project</option>
                                            {activeProjects.map((project, index) => (
                                                <option key={index} value={project.projectId}>{project.name}</option>
                                            ))}
                                        </Form.Select>
                                    </div>
                                </Col>

                                {/* Lot Dropdown */}
                                <Col xs={12} md={6} lg={2}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={styles.formLabel}>
                                            <FaBoxes style={{ marginRight: '8px', color: '#4a90e2' }} />
                                            Lot <span style={{ color: '#e74c3c', marginLeft: '3px' }}>*</span>
                                        </div>
                                        <Form.Select
                                            onChange={(e) => {
                                                setSelectedLot(e.target.value);
                                                setQuantitySheets([]);
                                            }}
                                            value={selectedLot}
                                            disabled={!selectedProjectId}
                                            style={{
                                                ...styles.formControl,
                                                opacity: selectedProjectId ? 1 : 0.7
                                            }}
                                        >
                                            <option value="">Select Lot</option>
                                            {lotNumbers.map((lotNo) => (
                                                <option key={lotNo} value={lotNo}>{lotNo}</option>
                                            ))}
                                        </Form.Select>
                                    </div>
                                </Col>

                                {/* View Report Button and Dispatch Date in the same column */}
                                <Col xs={12} md={6} lg={4} className="d-flex align-items-end">
                                    <div style={{ marginBottom: '15px', width: '100%' }}>
                                        <div className="d-flex align-items-center">
                                            {selectedGroup && selectedProjectId && selectedLot && (
                                                <Button
                                                    variant="primary"
                                                    onClick={handleViewReport}
                                                    disabled={isLoading}
                                                    style={{
                                                        ...styles.button,
                                                        padding: '10px 15px',
                                                        opacity: isLoading ? 0.7 : 1,
                                                        transform: isLoading ? "none" : "translateY(-1px)",
                                                        marginRight: '10px'
                                                    }}
                                                >
                                                    <FaSearch className="me-2" />
                                                    View Report
                                                </Button>
                                            )}

                                            {showTable && quantitySheets.length > 0 && (
                                                <div style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '8px 12px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#e8f4fd',
                                                    color: '#2c7be5',
                                                    fontWeight: '500',
                                                    fontSize: '0.9rem',
                                                    boxShadow: '0 2px 4px rgba(44, 123, 229, 0.1)',
                                                    border: '1px solid rgba(44, 123, 229, 0.2)',
                                                    animation: 'fadeIn 0.3s ease-in-out',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    <FaCalendarAlt style={{ marginRight: '8px' }} />
                                                    Dispatch: {quantitySheets[0]?.dispatchDate || 'N/A'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Col>

                                {/* Search Box */}
                                <Col xs={12} md={6} lg={2} className="d-flex align-items-end" style={{ position: 'static' }}>
                                    <div className="position-relative" style={{
                                       
                                        marginBottom: '15px',
                                        position: 'relative', /* Ensure proper positioning context */
                                        zIndex: 1000 /* Add z-index to parent container */
                                    }}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Quick search..."
                                            value={searchTerm}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setCurrentSearchPage(1);
                                                handleSearch(e.target.value, 1);
                                            }}
                                            style={{
                                                ...styles.formControl,
                                                paddingLeft: '40px'
                                            }}
                                        />
                                        <FaSearch
                                            style={{
                                                position: "absolute",
                                                left: "15px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: "#4A90E2"
                                            }}
                                        />

                                        {searchTerm.length > 0 && (
                                            <div
                                                className="position-absolute w-100 bg-white rounded shadow-lg"
                                                style={{
                                                    maxHeight: "300px",
                                                    overflowY: "auto",
                                                    zIndex: 99999, /* Significantly increased z-index to ensure dropdown appears above all elements */
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    position: 'absolute', /* Ensure absolute positioning */
                                                    bottom: '100%', /* Position above the search input instead of below */
                                                    marginBottom: '5px', /* Add some space between input and dropdown */
                                                    left: 0,
                                                    right: 0
                                                }}
                                            >
                                                {isSearching && currentSearchPage === 1 ? (
                                                    <div className="text-center py-3">
                                                        <Spinner animation="border" size="sm" variant="primary" />
                                                        <div style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '8px' }}>Searching...</div>
                                                    </div>
                                                ) : searchResults.length > 0 ? (
                                                    <>
                                                        <div className="search-results">
                                                            {searchResults.map((result, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="p-3 border-bottom"
                                                                    onClick={() => SearchCatchClick(result)}
                                                                    style={{
                                                                        cursor: "pointer",
                                                                        transition: 'background-color 0.2s ease',
                                                                        backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
                                                                        borderLeft: '3px solid transparent',
                                                                        ':hover': {
                                                                            backgroundColor: '#e8f4fd',
                                                                            borderLeftColor: '#4a90e2'
                                                                        }
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.backgroundColor = '#e8f4fd';
                                                                        e.currentTarget.style.borderLeft = '3px solid #4a90e2';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white';
                                                                        e.currentTarget.style.borderLeft = '3px solid transparent';
                                                                    }}
                                                                >
                                                                    <div style={{ fontWeight: '600', color: '#4a90e2', fontSize: '0.9rem', marginBottom: '3px' }}>Catch No: {result.catchNo}</div>
                                                                    <div style={{ fontWeight: '500', color: '#495057', fontSize: '0.85rem', marginBottom: '3px' }}>
                                                                        {result.matchedColumn}: {result.matchedValue}
                                                                    </div>
                                                                    <div style={{ fontWeight: '500', color: '#495057', fontSize: '0.85rem', marginBottom: '3px' }}>Project: {result.projectName}</div>
                                                                    <div style={{ fontWeight: '500', color: '#495057', fontSize: '0.85rem' }}>Lot No: {result.lotNo}</div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {hasMoreResults && (
                                                            <div
                                                                className="text-center py-2 border-top"
                                                                style={{ backgroundColor: '#f8f9fa' }}
                                                            >
                                                                <button
                                                                    className="btn btn-link"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleShowMore();
                                                                    }}
                                                                    disabled={isSearching}
                                                                    style={{
                                                                        color: '#4a90e2',
                                                                        textDecoration: 'none',
                                                                        fontWeight: '500',
                                                                        fontSize: '0.9rem',
                                                                        padding: '8px 16px',
                                                                        borderRadius: '4px',
                                                                        transition: 'background-color 0.2s ease'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        e.currentTarget.style.backgroundColor = '#e8f4fd';
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                                    }}
                                                                >
                                                                    {isSearching ? (
                                                                        <>
                                                                            <Spinner
                                                                                animation="border"
                                                                                size="sm"
                                                                                className="me-2"
                                                                            />
                                                                            Loading...
                                                                        </>
                                                                    ) : (
                                                                        'Show More'
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-center py-4">
                                                        <div style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: '4px' }}>No results found</div>
                                                        <small style={{ color: '#adb5bd', fontSize: '0.8rem' }}>Try a different search term</small>
                                                    </div>
                                                )}
                                                </div>
                                        )}
                                    </div>
                                </Col>
                            </Row>
                        </div>

                        {/* Table Section */}
                        <div style={{

                        }}>
                            {/* Table to display selected data */}
                            {selectedItem && (
                                <>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 style={styles.sectionTitle}>
                                            <FaTable style={styles.sectionIcon} />
                                            Catch Details
                                        </h5>

                                        <div className="d-flex align-items-center">
                                            <Dropdown className="d-inline-block">
                                                <Dropdown.Toggle
                                                    variant="primary"
                                                    id="export-dropdown"
                                                    className="me-3"
                                                    style={{
                                                        ...styles.button,
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        backgroundColor: '#4a90e2',
                                                        border: 'none'
                                                    }}
                                                >
                                                    <FaFileExport className="me-2" />
                                                    Export
                                                </Dropdown.Toggle>

                                                <Dropdown.Menu style={{
                                                    borderRadius: '8px',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    border: '1px solid rgba(0,0,0,0.05)',
                                                    padding: '8px'
                                                }}>
                                                    <div className="d-flex">
                                                        <Dropdown.Item
                                                            as={ExcelExport}
                                                            data={[selectedItem]}
                                                            projectName={projectName}
                                                            groupName={groups[selectedGroup]}
                                                            lotNo={selectedLot}
                                                            visibleColumns={{
                                                                catchNo: true,
                                                                subject: true,
                                                                course: true,
                                                                paper: true,
                                                                examDate: true,
                                                                examTime: true,
                                                                quantity: true,
                                                                pages: true,
                                                                status: true,
                                                                currentProcess: true,
                                                                innerEnvelope: true,
                                                                outerEnvelope: true,
                                                                dispatchDate: true
                                                            }}
                                                            className="py-2"
                                                            style={{
                                                                borderRadius: '4px',
                                                                transition: 'background-color 0.2s ease'
                                                            }}
                                                        />
                                                        <div className="vr mx-2"></div>

                                                        <Dropdown.Item
                                                            as={PdfExport}
                                                            data={[selectedItem]}
                                                            projectName={projectName}
                                                            groupName={groups[selectedGroup]}
                                                            lotNo={selectedLot}
                                                            visibleColumns={{
                                                                catchNo: true,
                                                                subject: true,
                                                                course: true,
                                                                paper: true,
                                                                examDate: true,
                                                                examTime: true,
                                                                quantity: true,
                                                                pages: true,
                                                                status: true,
                                                                currentProcess: true,
                                                                innerEnvelope: true,
                                                                outerEnvelope: true,
                                                                dispatchDate: true
                                                            }}
                                                            className="py-2"
                                                            style={{
                                                                borderRadius: '4px',
                                                                transition: 'background-color 0.2s ease'
                                                            }}
                                                        />
                                                    </div>
                                                </Dropdown.Menu>
                                            </Dropdown>

                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                style={{
                                                    ...styles.button,
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #dc3545'
                                                }}
                                                onClick={() => setSelectedItem(null)}
                                            >
                                                <AiFillCloseSquare className="me-2" />
                                                Close
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
                                        border: '1px solid rgba(0,0,0,0.05)',
                                        marginBottom: '20px'
                                    }}>
                                        <Table striped bordered hover style={{
                                            margin: 0,
                                            borderCollapse: 'collapse'
                                        }}>
                                            <thead>
                                                <tr style={{
                                                    backgroundColor: '#f8f9fa',
                                                    borderBottom: '2px solid #e9ecef'
                                                }}>
                                                    <th style={styles.tableHeader}>Catch No</th>
                                                    <th style={styles.tableHeader}>Subject</th>
                                                    <th style={styles.tableHeader}>Course</th>
                                                    <th style={styles.tableHeader}>Paper</th>
                                                    <th style={styles.tableHeader}>Exam Date</th>
                                                    <th style={styles.tableHeader}>Exam Time</th>
                                                    <th style={styles.tableHeader}>Quantity</th>
                                                    <th style={styles.tableHeader}>Pages</th>
                                                    <th style={styles.tableHeader}>Status</th>
                                                    <th style={styles.tableHeader}>Current Process</th>
                                                    <th style={styles.tableHeader}>Inner Envelope</th>
                                                    <th style={styles.tableHeader}>Outer Envelope</th>
                                                    <th style={styles.tableHeader}>Dispatch</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr
                                                    onClick={() => {
                                                        selectedItem.showProcessDetails = !selectedItem.showProcessDetails;
                                                        setSelectedItem({ ...selectedItem });
                                                    }}
                                                    style={{
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#f0f7ff';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '';
                                                    }}
                                                >
                                                    <td style={styles.tableCell}>{selectedItem.catchNo}</td>
                                                    <td style={styles.tableCell}>{selectedItem.subject}</td>
                                                    <td style={styles.tableCell}>{selectedItem.course}</td>
                                                    <td style={styles.tableCell}>{selectedItem.paper}</td>
                                                    <td style={styles.tableCell}>{new Date(selectedItem.examDate).toLocaleDateString()}</td>
                                                    <td style={styles.tableCell}>{selectedItem.examTime}</td>
                                                    <td style={styles.tableCell}>{selectedItem.quantity}</td>
                                                    <td style={styles.tableCell}>{selectedItem.pages}</td>
                                                    <td style={styles.tableCell}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '500',
                                                            color: 'white',
                                                            backgroundColor:
                                                                selectedItem.catchStatus === 'Completed' ? '#2dce89' :
                                                                selectedItem.catchStatus === 'Running' ? '#4a90e2' :
                                                                selectedItem.catchStatus === 'Pending' ? '#f5365c' : '#6c757d'
                                                        }}>
                                                            {selectedItem.catchStatus}
                                                        </span>
                                                    </td>
                                                    <td style={styles.tableCell}>{selectedItem.currentProcessName}</td>
                                                    <td style={styles.tableCell}>{selectedItem.innerEnvelope}</td>
                                                    <td style={styles.tableCell}>{selectedItem.outerEnvelope}</td>
                                                    <td style={styles.tableCell}>{selectedItem.dispatchDate}</td>
                                                </tr>
                                                {selectedItem.showProcessDetails && (
                                                    <tr>
                                                        <td colSpan="13" style={{
                                                            padding: '15px',
                                                            backgroundColor: '#f8f9fa',
                                                            border: '1px solid #e9ecef'
                                                        }}>
                                                            <ProcessDetails
                                                                catchData={selectedItem}
                                                                projectName={selectedProjectId}
                                                                groupName={groups[selectedGroup]}
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '40px 20px',
                        textAlign: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        animation: 'slideInUp 0.5s ease-in-out'
                    }}>
                        <div style={{
                            fontSize: '3rem',
                            color: '#4a90e2',
                            marginBottom: '20px'
                        }}>
                            <FaChartBar />
                        </div>
                        <h4 style={{
                            color: '#2c3e50',
                            marginBottom: '15px',
                            fontWeight: '600'
                        }}>
                            {selectedReportType}
                        </h4>
                        <p style={{
                            color: '#6c757d',
                            fontSize: '1.1rem',
                            maxWidth: '400px',
                            margin: '0 auto'
                        }}>
                            This report type is coming soon. Please select "Detailed Report" or " Daily Production Report" for now.
                        </p>
                    </div>
                )}
            </div>



            {/* Loading Spinner */}
            {isLoading && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    textAlign: 'center',
                    animation: 'slideInUp 0.5s ease-in-out',
                    marginBottom: '25px'
                }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        position: 'relative',
                        marginBottom: '20px'
                    }}>
                        <Spinner
                            animation="border"
                            variant="primary"
                            style={{
                                width: '60px',
                                height: '60px',
                                color: '#4a90e2',
                                borderWidth: '4px'
                            }}
                        />
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '1.5rem',
                            color: '#4a90e2',
                            opacity: 0.5
                        }}>
                            <FaChartBar />
                        </div>
                    </div>
                    <h5 style={{
                        fontSize: '1.2rem',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#2c3e50'
                    }}>Loading Report Data</h5>
                    <p style={{
                        color: '#6c757d',
                        fontSize: '0.95rem',
                        maxWidth: '400px',
                        margin: '0 auto'
                    }}>Please wait while we fetch the latest information...</p>
                </div>
            )}

            {/* Pagination Section */}
            {!isLoading && showTable && quantitySheets.length > 0 && (
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '25px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    animation: 'slideInUp 0.5s ease-in-out 0.3s both'
                }}>
                    <Row className="align-items-center">
                        {/* Showing total records */}
                        <Col xs={12} md={6} lg={3}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '10px 19px',
                                borderRadius: '8px',
                                backgroundColor: '#f8f9fa',
                                color: '#495057',
                                fontWeight: '500',
                                fontSize: '0.9rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                border: '1px solid rgba(0,0,0,0.05)',

                            }}>
                                <FaTable style={{ marginRight: '8px', color: '#4a90e2' }} />
                                <span>Showing </span>
                                <span style={{ fontWeight: '600', color: '#4a90e2', margin: '0 4px' }}>
                                    {filteredSheets.length > 0 ? currentPage * recordsPerPage + 1 : 0}
                                </span>
                                <span> to </span>
                                <span style={{ fontWeight: '600', color: '#4a90e2', margin: '0 4px' }}>
                                    {Math.min((currentPage + 1) * recordsPerPage, filteredSheets.length)}
                                </span>
                                <span> of </span>
                                <span style={{ fontWeight: '600', color: '#f5365c', margin: '0 4px' }}>
                                    {filteredSheets.length}
                                </span>
                                <span> Records</span>
                            </div>
                        </Col>

                        {/* Limit Rows */}
                        <Col xs={12} md={6} lg={3}>
                            <div className="d-flex align-items-center">
                                <div style={{
                                    fontWeight: '500',
                                    color: '#495057',
                                    fontSize: '0.9rem',
                                    marginRight: '10px'
                                }}>
                                    <FaListOl style={{ marginRight: '8px', color: '#4a90e2' }} />
                                    Rows per page:
                                </div>
                                <select
                                    className="form-select form-select-sm"
                                    value={recordsPerPage}
                                    onChange={handleRecordsPerPageChange}
                                    style={{

                                        borderRadius: '6px',
                                        border: '1px solid #e0e0e0',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        width: ' 90px',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </Col>

                            {/* Search and Filters */}
                            <Col xs={12} md={4} lg={3}>
                                {/* Table Search */}
                                <div className="position-relative w-100 d-flex align-items-center">

                                    <div className="position-relative" style={{ width: "330px" }}>
                                        <Form.Control
                                            style={{
                                                height: "40px",
                                                width: "210px",
                                                paddingLeft: "35px" // Changed from paddingRight to paddingLeft
                                            }}
                                            type="search"
                                            placeholder="Search..."
                                            className="rounded"
                                            onChange={(e) => {
                                                const searchTerm = e.target.value.toLowerCase();
                                                if (!searchTerm) {
                                                    setFilteredSheets(quantitySheets);
                                                    return;
                                                }

                                                const filtered = quantitySheets.filter(sheet => {
                                                    return (
                                                        sheet.catchNo?.toString().toLowerCase().includes(searchTerm) ||
                                                        sheet.examDate?.toString().toLowerCase().includes(searchTerm) ||
                                                        sheet.examTime?.toString().toLowerCase().includes(searchTerm) ||
                                                        sheet.lotNo?.toString().toLowerCase().includes(searchTerm) ||
                                                        sheet.quantity?.toString().toLowerCase().includes(searchTerm) ||
                                                        sheet.status?.toString().toLowerCase().includes(searchTerm) ||
                                                        sheet.catchStatus?.toLowerCase().includes(searchTerm) ||
                                                        sheet.currentProcessName?.toLowerCase().includes(searchTerm) ||
                                                        sheet.transactionData?.zoneDescriptions?.join(', ').toLowerCase().includes(searchTerm) ||
                                                        sheet.transactionData?.teamDetails?.some(team =>
                                                            team.teamName.toLowerCase().includes(searchTerm) ||
                                                            team.userNames.join(', ').toLowerCase().includes(searchTerm)
                                                        ) ||
                                                        sheet.transactionData?.machineNames?.join(', ').toLowerCase().includes(searchTerm) ||
                                                        sheet.processNames?.some(process => process.toLowerCase().includes(searchTerm))
                                                    );
                                                });

                                                setFilteredSheets(filtered);
                                                setCurrentPage(0);
                                            }}
                                        />
                                        <FaSearch
                                            style={{
                                                position: "absolute",
                                                left: "10px", // Changed from right to left
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: "#6c757d",
                                                pointerEvents: "none"
                                            }}
                                        />
                                    </div>

                                    <div className="dropdown bg-white btn ms-4">
                                        <Button
                                            variant="link"
                                            className="p-0"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                            onClick={(e) => {
                                                e.currentTarget.parentElement.nextElementSibling.classList.toggle('show');
                                            }}
                                        >
                                            <FaFilter style={{ color: '#6c757d', fontSize: '1.5rem', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.1)' } }} />
                                        </Button>
                                        <div className="dropdown-menu p-3" style={{ minWidth: '300px' }}>

                                            <div>
                                                <div className="mb-3">

                                                </div>
                                                <div className="column-list" style={{ cursor: 'grab' }}>
                                                    {columnDefinitions.map(column => (
                                                        <div key={column.id} className="form-check mb-2">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`column-${column.id}`}
                                                                checked={column.id === 'catchNo' ? true : visibleColumns[column.id]}
                                                                onChange={(e) => {
                                                                    if (column.id === 'catchNo') return;
                                                                    setVisibleColumns(prev => ({
                                                                        ...prev,
                                                                        [column.id]: e.target.checked
                                                                    }));
                                                                }}
                                                                disabled={column.id === 'catchNo'}
                                                            />
                                                            <label className="form-check-label" htmlFor={`column-${column.id}`}>
                                                                {column.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </Col>



                            {/* Export */}
                            <Col xs={12} md={4} lg={2} className="text-end">

                                {/* Export */}
                                <div className="exporttbn">
                                    <Dropdown className="d-inline-block">
                                        <Dropdown.Toggle variant="primary" id="export-dropdown" className="me-">
                                            <FaFileExport className="me-3" />
                                            Export
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="mt-1">
                                            <Dropdown.Item
                                                as={ExcelExport}
                                                data={quantitySheets}
                                                projectName={projectName}
                                                groupName={groups[selectedGroup]}
                                                visibleColumns={visibleColumns}
                                                lotNo={selectedLot}
                                                className="py-1"

                                            >
                                            </Dropdown.Item>

                                            <div className="vr mx-1"></div>
                                            {/* {console.log(quantitySheets)} */}
                                            <Dropdown.Item
                                                as={PdfExport}
                                                data={quantitySheets}
                                                projectName={projectName}
                                                groupName={groups[selectedGroup]}
                                                visibleColumns={visibleColumns}
                                                lotNo={selectedLot}
                                                className="py-1"

                                            >
                                            </Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </div>
                            </Col>



                        </Row>
                        {!showCatchView ? (
                            <div className="table-responsive">
                                <Table striped bordered hover className="shadow-sm">
                                    <thead className="bg-primary text-white">
                                        <tr>
                                            {visibleColumns.catchNo && (
                                                <th>
                                                    <div className="d-flex align-items-center justify-content-between">
                                                        <div onClick={() => handleSort('catchNo')} style={{ cursor: 'pointer', textAlign: 'center' }}>
                                                            <div className="d-flex align-items-center justify-content-center">
                                                                Catch No
                                                                <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                                    <FaSortUp
                                                                        color={sortField === 'catchNo' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                        style={{ marginBottom: '-3px' }}
                                                                    />
                                                                    <FaSortDown
                                                                        color={sortField === 'catchNo' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                        style={{ marginTop: '-3px' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-sm btn-light ms-2"
                                                            onClick={() => {
                                                                // Toggle first 5 process details initially
                                                                setFilteredSheets(sheets => {
                                                                    // Check if any sheet has showProcessDetails as false
                                                                    const hasHiddenDetails = sheets.some(sheet => !sheet.showProcessDetails);

                                                                    // If any are hidden, show first 5. Otherwise hide all
                                                                    return sheets.map((sheet, index) => ({
                                                                        ...sheet,
                                                                        showProcessDetails: hasHiddenDetails && index < 5
                                                                    }));
                                                                });

                                                                // Load remaining process details after delay
                                                                setTimeout(() => {
                                                                    setFilteredSheets(sheets => {
                                                                        const hasHiddenDetails = sheets.some(sheet => !sheet.showProcessDetails);
                                                                        return sheets.map(sheet => ({
                                                                            ...sheet,
                                                                            showProcessDetails: hasHiddenDetails
                                                                        }));
                                                                    });
                                                                }, 500);
                                                            }}
                                                            title="Toggle All Process Details"
                                                        >
                                                            <FaList size={12} />
                                                        </button>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.subject && (
                                                <th onClick={() => handleSort('subject')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Subject
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'subject' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'subject' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.course && (
                                                <th onClick={() => handleSort('course')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Course
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'course' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'course' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.paper && (
                                                <th onClick={() => handleSort('paper')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Paper
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'paper' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'paper' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.examDate && (
                                                <th onClick={() => handleSort('examDate')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Exam Date
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'examDate' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'examDate' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.examTime && (
                                                <th onClick={() => handleSort('examTime')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Exam Time
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'examTime' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'examTime' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.quantity && (
                                                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Quantity
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'quantity' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'quantity' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.pages && (
                                                <th onClick={() => handleSort('pages')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Pages
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'pages' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'pages' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.status && (


                                                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Status
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'status' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'status' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.startTime && (
                                                <th onClick={() => handleSort('startTime')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        SD-ST
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'startTime' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'startTime' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.endTime && (
                                                <th onClick={() => handleSort('endTime')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        ED-ET
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'endTime' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'endTime' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.duration && (
                                                <th onClick={() => handleSort('duration')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Duration
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'duration' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'duration' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.currentProcess && (


                                                <th onClick={() => handleSort('currentProcess')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Current Process
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'currentProcess' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'currentProcess' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.innerEnvelope && (
                                                <th onClick={() => handleSort('innerEnvelope')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Inner Envelope
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'innerEnvelope' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'innerEnvelope' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}
                                            {visibleColumns.outerEnvelope && (
                                                <th onClick={() => handleSort('outerEnvelope')} style={{ cursor: 'pointer' }}>
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        Outer Envelope
                                                        <div className="d-flex flex-column ms-2" style={{ fontSize: '12px' }}>
                                                            <FaSortUp
                                                                color={sortField === 'outerEnvelope' && sortDirection === 'asc' ? '#fff' : '#000'}
                                                                style={{ marginBottom: '-3px' }}
                                                            />
                                                            <FaSortDown
                                                                color={sortField === 'outerEnvelope' && sortDirection === 'desc' ? '#fff' : '#000'}
                                                                style={{ marginTop: '-3px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                </th>
                                            )}



                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSheets
                                            .slice(currentPage * recordsPerPage, (currentPage + 1) * recordsPerPage)
                                            .map((sheet, index) => [
                                                <tr
                                                    key={`${index}-main`}
                                                    style={{ cursor: 'pointer' }}
                                                    className="hover-highlight"
                                                    onClick={() => {
                                                        setSelectedCatch(sheet);
                                                        sheet.showProcessDetails = !sheet.showProcessDetails;
                                                        setQuantitySheets([...quantitySheets]);
                                                    }}
                                                >
                                                    {visibleColumns.catchNo && <td className="text-center">{sheet.catchNo}</td>}
                                                    {visibleColumns.subject && <td className="text-center">{sheet.subject}</td>}
                                                    {visibleColumns.course && <td className="text-center">{sheet.course}</td>}
                                                    {visibleColumns.paper && <td className="text-center">{sheet.paper}</td>}
                                                    {visibleColumns.examDate && <td className="text-center">{new Date(sheet.examDate).toLocaleDateString('en-GB')}</td>}
                                                    {visibleColumns.examTime && <td className="text-center">{sheet.examTime}</td>}
                                                    {visibleColumns.quantity && <td className="text-center">{sheet.quantity}</td>}
                                                    {visibleColumns.pages && <td className="text-center">{sheet.pages}</td>}

                                                    {visibleColumns.status && (
                                                        <td className="text-center">
                                                            <span className={`badge ${sheet.catchStatus === 'Completed' ? 'bg-success' :
                                                                sheet.catchStatus === 'Running' ? 'bg-primary' :
                                                                    sheet.catchStatus === 'Pending' ? 'bg-danger' : 'bg-secondary'
                                                                }`}>
                                                                {sheet.catchStatus}
                                                            </span>
                                                        </td>
                                                    )}
                                                    {visibleColumns.startTime && <td className="text-center">{new Date(sheet.startTime).toLocaleString('en-GB', { hour12: true })}</td>}
                                                    {visibleColumns.endTime && (
                                                        <td className="text-center">
                                                            {sheet.catchStatus === 'Running' ? '' : new Date(sheet.endTime).toLocaleString('en-GB', { hour12: true })}
                                                        </td>
                                                    )}
                                                    {visibleColumns.duration && (
                                                        <td className="text-center">
                                                            {sheet.catchStatus === 'Running' ? '' : sheet.duration || ''}
                                                        </td>
                                                    )}
                                                    {visibleColumns.currentProcess && <td className="text-center">{sheet.currentProcessName}</td>}

                                                    {visibleColumns.innerEnvelope && <td className="text-center">{sheet.innerEnvelope}</td>}
                                                    {visibleColumns.outerEnvelope && <td className="text-center">{sheet.outerEnvelope || ''}</td>}



                                                </tr>,
                                                sheet.showProcessDetails && (
                                                    <tr key={`${index}-details`}>
                                                        <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 2}>
                                                            <ProcessDetails
                                                                catchData={sheet}
                                                                projectName={selectedProjectId}
                                                                groupName={groups[selectedGroup]}
                                                            />
                                                        </td>
                                                    </tr>
                                                )
                                            ])}
                                        {filteredSheets.length === 0 && (
                                            <tr>
                                                <td colSpan={Object.values(visibleColumns).filter(Boolean).length + 2} className="text-center py-4">
                                                    <div className="text-muted">No records found</div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>

                                <div className="d-flex justify-content-between align-items-center mt-3">
                                <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: '#f8f9fa',
                                color: '#495057',
                                fontWeight: '500',
                                fontSize: '0.9rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                border: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                <FaTable style={{ marginRight: '8px', color: '#4a90e2' }} />
                                <span>Showing </span>
                                <span style={{ fontWeight: '600', color: '#4a90e2', margin: '0 4px' }}>
                                    {filteredSheets.length > 0 ? currentPage * recordsPerPage + 1 : 0}
                                </span>
                                <span> to </span>
                                <span style={{ fontWeight: '600', color: '#4a90e2', margin: '0 4px' }}>
                                    {Math.min((currentPage + 1) * recordsPerPage, filteredSheets.length)}
                                </span>
                                <span> of </span>
                                <span style={{ fontWeight: '600', color: '#f5365c', margin: '0 4px' }}>
                                    {filteredSheets.length}
                                </span>
                                <span> Records</span>
                            </div>

                                    <ul className="pagination mb-0">
                                        <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(p => p - 1)}
                                                disabled={currentPage === 0}
                                            >
                                                <FaAnglesLeft />
                                            </button>
                                        </li>
                                        {[...Array(Math.ceil(filteredSheets.length / recordsPerPage))].map((_, i) => {
                                            const showPage = i === 0 ||
                                                i === Math.ceil(filteredSheets.length / recordsPerPage) - 1 ||
                                                Math.abs(currentPage - i) <= 1;

                                            if (!showPage) {
                                                if (i === currentPage - 2 || i === currentPage + 2) {
                                                    return (
                                                        <li key={i} className="page-item disabled">
                                                            <span className="page-link">...</span>
                                                        </li>
                                                    );
                                                }
                                                return null;
                                            }

                                            return (
                                                <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => setCurrentPage(i)}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                        <li className={`page-item ${currentPage >= Math.ceil(filteredSheets.length / recordsPerPage) - 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(p => p + 1)}
                                                disabled={currentPage >= Math.ceil(filteredSheets.length / recordsPerPage) - 1}
                                            >
                                                <FaAnglesRight />
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'catch' ? (
                                    <CatchDetails
                                        catchData={selectedCatch}
                                        projectName={selectedProjectId}
                                        groupName={groups[selectedGroup]}
                                    />
                                ) : (
                                    <ProcessDetails
                                        catchData={selectedCatch}
                                        projectName={selectedProjectId}
                                        groupName={groups[selectedGroup]}
                                    />
                                )}
                            </>
                        )}
                    </div>

            )}
        </Container>
    );
};

export default ProjectReport;