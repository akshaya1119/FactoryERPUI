import React, { useState, useEffect } from 'react';
import { Table, Container, Spinner, Form, Row, Col, Button, Nav, OverlayTrigger, Tooltip } from 'react-bootstrap';
import API from "../../CustomHooks/MasterApiHooks/api";
import { FaCalendarAlt, FaTable, FaIndustry, FaCogs, FaChartBar, FaClipboardList, FaUsers, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import ProcessExport from './Dailyexport/Processexport';
import PendingExport from './Dailyexport/Pendingexport';
import GroupExport from './Dailyexport/Groupexport';

// Utility function to aggressively clean names from unwanted symbols
const cleanName = (name) => {
    if (!name) return '';
    // Convert to string and perform a series of replacements
    let cleanedName = String(name)
        // Specifically target and remove all percent-like symbols
        .replace(/[%％]/g, '')
        // Remove a wide range of other symbols, but keep letters, numbers,
        // whitespace, hyphens, and parentheses.
        .replace(/[^\w\s-()]/g, '')
        // Normalize multiple spaces into a single space
        .replace(/\s+/g, ' ')
        .trim();
    return cleanedName;
};

// Helper to calculate hours ago from lastLoggedAt
const getHoursAgo = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const now = new Date();
    const last = new Date(dateTimeStr);
    const diffMs = now - last;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHours;
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

const DailyReport = () => {
    // State variables
    const [activeTab, setActiveTab] = useState('process-production');
    const [loading, setLoading] = useState(false);
    const [processes, setProcesses] = useState([]);
    const [groups, setGroups] = useState([]);
    const [projects, setProjects] = useState([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');
    const [selectedView, setSelectedView] = useState('summary');
    const [processProductionData, setProcessProductionData] = useState([]);
    const [processProductionDetailsData, setProcessProductionDetailsData] = useState([]);
    const [expandedProcesses, setExpandedProcesses] = useState(new Set());
    const [expandAllProcesses, setExpandAllProcesses] = useState(false);

    const [pendingData, setPendingData] = useState([]);
    const [groupProductionData, setGroupProductionData] = useState([]);
    const [showData, setShowData] = useState(false);

    const [groupDetailsData, setGroupDetailsData] = useState({});
    const [expandedGroupProcesses, setExpandedGroupProcesses] = useState(new Set());

    // Add state for expanded group rows and their project data
    const [expandedGroups, setExpandedGroups] = useState({});
    const [groupProjectsData, setGroupProjectsData] = useState({});

    // Add after existing state declarations
    const [expandedGroupProjects, setExpandedGroupProjects] = useState({}); // { [processId]: Set(groupId) }
    const [groupProjectDetails, setGroupProjectDetails] = useState({}); // { [processId]: { [groupId]: [projectRows] } }

    // Add state for expanded project rows and their catch list data
    const [expandedProjectRows, setExpandedProjectRows] = useState({}); // { [processId]: { [groupId]: Set(projectId) } }
    const [projectCatchLists, setProjectCatchLists] = useState({}); // { [processId]: { [groupId]: { [projectId]: { bookletCatchList, paperCatchList } } } }

    // Add state for expand all in group-details
    const [expandAllGroupDetails, setExpandAllGroupDetails] = useState(false);

    // Add state for pending report filters
    const [selectedGroup, setSelectedGroup] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedLot, setSelectedLot] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [apiGroups, setApiGroups] = useState([]);
    const [groupProjects, setGroupProjects] = useState([]);
    const [projectLots, setProjectLots] = useState([]);

    // Add after other useState hooks
    const [selectedProcessCatchDetails, setSelectedProcessCatchDetails] = useState(null);
    const [expandedPendingProcessId, setExpandedPendingProcessId] = useState(null);

    // State for expanding all pending process catch details
    const [expandAllPendingProcesses, setExpandAllPendingProcesses] = useState(false);
    const [allProcessCatchDetails, setAllProcessCatchDetails] = useState({}); // { processId: catchDetailsObj }
    // Multi-row expansion: use a Set for expanded process IDs
    const [expandedPendingProcessIds, setExpandedPendingProcessIds] = useState(new Set());

    // Add state for project-wise data under group details
    const [groupDetailsProjectWise, setGroupDetailsProjectWise] = useState({}); // { [processId]: [projectRows] }

    // Sorting state for pending report
    const [pendingSortColumn, setPendingSortColumn] = useState('quantity'); // default to 'quantity'
    const [pendingSortDirection, setPendingSortDirection] = useState('desc'); // default to 'desc'

    // Fetch all processes for name mapping
    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const response = await API.get('/Processes');
                setProcesses(response.data);
            } catch (error) {
                console.error('Error fetching processes:', error);
            }
        };

        const fetchGroups = async () => {
            try {
                const response = await API.get('/Reports/GetAllGroups');
                const activeGroups = response.data.filter(group => group.status);
                setGroups(activeGroups);
            } catch (error) {
                console.error('Error fetching groups:', error);
            }
        };

        const fetchApiGroups = async () => {
            try {
                const response = await API.get('/Reports/project-lotno-with-status');
                setApiGroups(response.data);
            } catch (error) {
                console.error('Error fetching API groups:', error);
            }
        };

        fetchProcesses();
        fetchGroups();
        fetchApiGroups();
    }, []);

    // Get process name by ID
    const getProcessName = (processId) => {
        if (!processId) return 'N/A';
        const process = processes.find(p => p.id === processId);
        return cleanName(process ? process.name : `Process ${processId}`);
    };

    // Get group name by ID
    const getGroupName = (groupId) => {
        if (!groupId) return 'N/A';
        const group = groups.find(g => g.id === parseInt(groupId));
        return cleanName(group ? group.name : `Group ${groupId}`);
    };

    // Get project name by ID
    const getProjectName = (projectId) => {
        if (!projectId) return 'N/A';
        const project = projects.find(p => p.projectId === parseInt(projectId));
        return cleanName(project ? project.name : `Project ${projectId}`);
    };

    // Fetch all projects for name mapping (used in details view)
    const fetchAllProjects = async () => {
        try {
            const response = await API.get('/Project');
            // Create a mapping object for faster lookup
            const projectMapping = {};
            response.data.forEach(project => {
                projectMapping[project.projectId] = project.name;
            });
            return projectMapping;
        } catch (error) {
            console.error('Error fetching all projects:', error);
            return {};
        }
    };

    // Format date for API
    const formatDateForApi = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
    };

    // Fetch Process Production Report data
    const fetchProcessProductionReport = async () => {
        if (!startDate || !selectedView) {
            return;
        }

        try {
            setLoading(true);
            setShowData(false);

            const params = {};

            if (startDate && endDate) {
                params.startDate = formatDateForApi(startDate);
                params.endDate = formatDateForApi(endDate);
            } else if (startDate) {
                params.date = formatDateForApi(startDate);
            }

            if (selectedView === 'summary' || selectedView === 'group-details') {
                // Fetch summary data (used for both summary and group-details)
                const response = await API.get(`/Reports/Process-Production-Report`, { params });
                console.log("API Response:", response.data);
                if (Array.isArray(response.data)) {
                    // Separate Total row and process data
                    const totalRow = response.data.find(item => item.processId === "Total");
                    const processData = response.data.filter(item => item.processId !== "Total");

                    // Sort process data to show Proofreading process first
                    const sortedProcessData = processData.sort((a, b) => {
                        const aProcessName = getProcessName(a.processId);
                        const bProcessName = getProcessName(b.processId);

                        const aIsProofreading = aProcessName && aProcessName.toLowerCase().includes('proofreading');
                        const bIsProofreading = bProcessName && bProcessName.toLowerCase().includes('proofreading');

                        if (aIsProofreading && !bIsProofreading) return -1;
                        if (!aIsProofreading && bIsProofreading) return 1;
                        return 0; // Keep original order for other processes
                    });

                    // Add total row at the END if it exists
                    const finalData = [];
                    finalData.push(...sortedProcessData);
                    if (totalRow) {
                        finalData.push({
                            ...totalRow,
                            processName: "TOTAL",
                            isTotal: true
                        });
                    }

                    setProcessProductionData(finalData);
                } else {
                    setProcessProductionData([]);
                }

                // Add delay to ensure data is rendered before hiding loader
                setTimeout(() => {
                    setShowData(true);
                    setLoading(false);
                }, 300);
                return; // Exit early to avoid the finally block
            } else if (selectedView === 'details') {
                // First: Load only process-level data (summary from main API)
                console.log('Starting details fetch - loading process summary first...');

                const response = await API.get(`/Reports/Process-Production-Report`, { params });
                if (Array.isArray(response.data)) {
                    // Filter out Total row and create process data structure without projects initially
                    const detailsData = response.data
                        .filter(item => item.processId !== "Total") // Remove total row
                        .map(item => ({
                            type: 'process',
                            processId: item.processId,
                            processName: getProcessName(item.processId),
                            completedTotalCatchesInPaper: item.completedTotalCatchesInPaper || 0,
                            completedTotalQuantityInPaper: item.completedTotalQuantityInPaper || 0,
                            completedTotalCatchesInBooklet: item.completedTotalCatchesInBooklet || 0,
                            completedTotalQuantityInBooklet: item.completedTotalQuantityInBooklet || 0,
                            projects: [], // Empty initially - will be loaded on expansion
                            projectsLoaded: false // Track if projects are loaded
                        }));

                    // Sort data to show Proofreading process first
                    const sortedDetailsData = detailsData.sort((a, b) => {
                        const aIsProofreading = a.processName && a.processName.toLowerCase().includes('proofreading');
                        const bIsProofreading = b.processName && b.processName.toLowerCase().includes('proofreading');

                        if (aIsProofreading && !bIsProofreading) return -1;
                        if (!aIsProofreading && bIsProofreading) return 1;
                        return 0; // Keep original order for other processes
                    });

                    setProcessProductionDetailsData(sortedDetailsData);
                    console.log('Process summary data loaded');
                } else {
                    setProcessProductionDetailsData([]);
                }

                // Add delay to ensure data is rendered before hiding loader
                setTimeout(() => {
                    setShowData(true);
                    setLoading(false);
                    console.log('Details view process data loaded and displayed');
                }, 300);
            }
        } catch (error) {
            console.error('Error fetching process production report:', error);
            setProcessProductionData([]);
            setProcessProductionDetailsData([]);
            setTimeout(() => {
                setShowData(false);
                setLoading(false);
            }, 300);
            alert('Error loading report data. Please try again.');
        }
    };

    // Fetch Group Production Report data
    const fetchGroupProductionReport = async () => {
        if (!startDate) {
            alert('Please select a start date');
            return;
        }

        try {
            setLoading(true);
            setShowData(false);

            const params = {};
            if (startDate && endDate) {
                params.startDate = formatDateForApi(startDate);
                params.endDate = formatDateForApi(endDate);
            } else if (startDate) {
                params.date = formatDateForApi(startDate);
            }

            // Using DailyProductionSummaryReport endpoint for group production data
            const response = await API.get(`/Reports/DailyProductionSummaryReport`, { params });

            if (response.data) {
                setGroupProductionData([response.data]); // Wrap in array for consistent handling
                setShowData(true);
            } else {
                setGroupProductionData([]);
                setShowData(true);
            }
        } catch (error) {
            console.error('Error fetching group production report:', error);
            setGroupProductionData([]);
            setShowData(false);
            alert('Error loading group production report data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch pending report data using the new API endpoint
    const fetchPendingReport = async () => {
        if (!selectedGroup || !selectedProject || !selectedLot) {
            // Do nothing if any selection is missing (no alert)
            return;
        }

        try {
            setLoading(true);
            setShowData(false);

            // Use the summary API to get all processes
            const response = await API.get(`/Reports/pending-process-report-from-quantitysheet`, {
                params: {
                    groupId: selectedGroup,
                    projectId: selectedProject,
                    lotNo: selectedLot
                }
            });

            if (Array.isArray(response.data) && response.data.length > 0) {
                // For each process, fetch its catch details using the processId-specific API
                const processesWithDetails = await Promise.all(response.data.map(async (item) => {
                    try {
                        const detailsResp = await API.get(`/Reports/pending-process-report-from-quantitysheet`, {
                            params: {
                                groupId: selectedGroup,
                                projectId: selectedProject,
                                lotNo: selectedLot,
                                processId: item.processId
                            }
                        });
                        let catchDetails = [];
                        if (Array.isArray(detailsResp.data) && detailsResp.data.length > 0) {
                            catchDetails = detailsResp.data[0].catchDetails || [];
                        }
                        return {
                            ...item,
                            processName: getProcessName(item.processId),
                            catchDetails,
                        };
                    } catch (err) {
                        return {
                            ...item,
                            processName: getProcessName(item.processId),
                            catchDetails: [],
                        };
                    }
                }));
                setPendingData(processesWithDetails);
                setShowData(true);
            } else {
                setPendingData([]);
                setShowData(true);
            }
        } catch (error) {
            console.error('Error fetching pending report:', error);
            setPendingData([]);
            setShowData(false);
            alert('Error loading pending report data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle View Report button click (for pending and group reports)
    const handleViewReport = () => {
        if (activeTab === 'pending-report') {
            fetchPendingReport();
        } else if (activeTab === 'group-production') {
            fetchGroupProductionReport();
        }
    };

    // Handle tab change
    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setShowData(false);
        setLoading(false); // Stop any ongoing loading

        // Clear all form field values
        setStartDate(new Date().toISOString().split('T')[0]); // Reset to today's date
        setEndDate(''); // Clear end date
        setSelectedView(''); // Clear view selection

        // Clear all data from previous tabs
        setProcessProductionData([]);
        setProcessProductionDetailsData([]);
        setPendingData([]);
        setGroupProductionData([]);

        // Reset expansion states
        setExpandedProcesses(new Set());
        setExpandAllProcesses(false);
    };

    // Load project data for a specific process (Production Report)
    const loadProjectsForProcess = async (processId) => {
        try {
            console.log(`Loading projects for process ${processId}...`);

            // Get current date parameters
            const params = {};
            if (startDate && endDate) {
                params.startDate = formatDateForApi(startDate);
                params.endDate = formatDateForApi(endDate);
            } else if (startDate) {
                params.date = formatDateForApi(startDate);
            }
            params.processId = processId;

            // Fetch project data and project mapping
            const [projectResponse, projectMapping] = await Promise.all([
                API.get(`/Reports/Process-Production-Report-Project-Wise`, { params }),
                fetchAllProjects()
            ]);

            if (Array.isArray(projectResponse.data) && projectResponse.data.length > 0) {
                const projectsData = projectResponse.data.map(project => ({
                    ...project,
                    type: 'project',
                    processId: processId,
                    projectName: cleanName(projectMapping[project.projectId] || `Project ${project.projectId}`)
                }));

                // Update the specific process with project data
                setProcessProductionDetailsData(prevData =>
                    prevData.map(processData =>
                        processData.processId === processId
                            ? { ...processData, projects: projectsData, projectsLoaded: true }
                            : processData
                    )
                );

                console.log(`Projects loaded for process ${processId}:`, projectsData);
            }
        } catch (error) {
            console.error(`Error loading projects for process ${processId}:`, error);
        }
    };

    // Load pending project data for a specific process (Pending Report)
    const loadPendingProjectsForProcess = async (processId) => {
        try {
            console.log(`Loading pending projects for process ${processId}...`);

            // Get current date parameters
            const params = {};
            if (startDate && endDate) {
                params.startDate = formatDateForApi(startDate);
                params.endDate = formatDateForApi(endDate);
            } else if (startDate) {
                params.date = formatDateForApi(startDate);
            }
            params.processId = processId;

            // Fetch pending project data using the new Process-Pending-Report-Project-Wise API
            const [projectResponse, projectMapping] = await Promise.all([
                API.get(`/Reports/Process-Pending-Report-Project-Wise`, { params }),
                fetchAllProjects()
            ]);

            if (Array.isArray(projectResponse.data) && projectResponse.data.length > 0) {
                const projectsData = projectResponse.data.map(project => ({
                    ...project,
                    type: 'project',
                    processId: processId,
                    projectName: cleanName(projectMapping[project.projectId] || `Project ${project.projectId}`),
                    // Map the new API field names to match the expected structure
                    pendingCatchInPaper: project.pendingCountOfCatchesInPaper || 0,
                    pendingQuantityInPaper: project.pendingQuantityInPaper || 0,
                    pendingCatchInBooklet: project.pendingCountOfCatchesInBooklet || 0,
                    pendingQuantityInBooklet: project.pendingQuantityInBooklet || 0
                }));

                // Update the specific process with project data
                setPendingData(prevData =>
                    prevData.map(processData =>
                        processData.processId === processId
                            ? { ...processData, projects: projectsData, projectsLoaded: true }
                            : processData
                    )
                );

                console.log(`Pending projects loaded for process ${processId}:`, projectsData);
            }
        } catch (error) {
            console.error(`Error loading pending projects for process ${processId}:`, error);
        }
    };

    // Toggle process expansion
    const toggleProcessExpansion = async (processId) => {
        const newExpanded = new Set(expandedProcesses);
        const isCurrentlyExpanded = newExpanded.has(processId);

        if (isCurrentlyExpanded) {
            newExpanded.delete(processId);
        } else {
            newExpanded.add(processId);

            // Check which tab is active and load appropriate project data
            if (activeTab === 'process-production') {
                // Check if projects are already loaded for this process in production data
                const processData = processProductionDetailsData.find(p => p.processId === processId);
                if (processData && !processData.projectsLoaded) {
                    // Load production projects when expanding for the first time
                    await loadProjectsForProcess(processId);
                }
            } else if (activeTab === 'pending-report') {
                // Check if projects are already loaded for this process in pending data
                const processData = pendingData.find(p => p.processId === processId);
                if (processData && !processData.projectsLoaded) {
                    // Load pending projects when expanding for the first time
                    await loadPendingProjectsForProcess(processId);
                }
            }
        }
        setExpandedProcesses(newExpanded);
    };

    // Toggle expand/collapse all processes
    const toggleExpandAllProcesses = async () => {
        if (expandAllProcesses) {
            // Collapse all
            setExpandedProcesses(new Set());
            setExpandAllProcesses(false);
        } else {
            // Expand all based on active tab
            if (activeTab === 'process-production') {
                const allProcessIds = new Set(processProductionDetailsData.map(process => process.processId));
                setExpandedProcesses(allProcessIds);
                setExpandAllProcesses(true);

                // Load projects for all processes that haven't been loaded yet
                const processesToLoad = processProductionDetailsData.filter(p => !p.projectsLoaded);
                if (processesToLoad.length > 0) {
                    console.log('Loading production projects for all processes...');
                    await Promise.all(
                        processesToLoad.map(process => loadProjectsForProcess(process.processId))
                    );
                }
            } else if (activeTab === 'pending-report') {
                const allProcessIds = new Set(pendingData.filter(p => !p.isTotal).map(process => process.processId));
                setExpandedProcesses(allProcessIds);
                setExpandAllProcesses(true);

                // Load projects for all processes that haven't been loaded yet
                const processesToLoad = pendingData.filter(p => !p.isTotal && !p.projectsLoaded);
                if (processesToLoad.length > 0) {
                    console.log('Loading pending projects for all processes...');
                    await Promise.all(
                        processesToLoad.map(process => loadPendingProjectsForProcess(process.processId))
                    );
                }
            }
        }
    };

    // Reset data when dates change - DON'T auto-fetch, wait for user action
    useEffect(() => {
        setShowData(false);
        setProcessProductionData([]);
        setProcessProductionDetailsData([]);
        setGroupProductionData([]);
        setPendingData([]);
        setExpandedProcesses(new Set());
        setExpandAllProcesses(false);

        // DON'T auto-fetch data on date change - user must click View Report or select view
    }, [startDate, endDate]);

    // Auto-load data on component mount and tab change with default values
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (activeTab === 'process-production' && startDate && selectedView) {
                fetchProcessProductionReport();
            }
            // Removed auto-loading for pending-report - user must click View Report button
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [activeTab]);

    // Function to fetch project-level data for a group
    const fetchProjectsForGroup = async (processId, groupId) => {
        try {
            const params = {};
            if (startDate && endDate) {
                params.startDate = formatDateForApi(startDate);
                params.endDate = formatDateForApi(endDate);
            } else if (startDate && !endDate) {
                params.date = formatDateForApi(startDate);
            }
            params.processId = processId;
            params.groupId = groupId;
            const response = await API.get('/Reports/Process-Production-Report-Project-Wise', { params });
            if (Array.isArray(response.data)) {
                setGroupProjectDetails(prev => ({
                    ...prev,
                    [processId]: {
                        ...(prev[processId] || {}),
                        [groupId]: response.data
                    }
                }));
            }
        } catch (error) {
            console.error('Error fetching project details for group:', error);
        }
    };

    // Function to toggle group row expansion
    const toggleGroupProjectExpansion = async (processId, groupId) => {
        setExpandedGroupProjects(prev => {
            const processGroups = new Set(prev[processId] || []);
            if (processGroups.has(groupId)) {
                processGroups.delete(groupId);
            } else {
                processGroups.add(groupId);
                // Fetch project data if not already loaded
                if (!groupProjectDetails[processId] || !groupProjectDetails[processId][groupId]) {
                    fetchProjectsForGroup(processId, groupId);
                }
            }
            return { ...prev, [processId]: processGroups };
        });
    };

    // Ensure project mapping is loaded for getProjectName
    useEffect(() => {
        const ensureProjectMapping = async () => {
            if (!projects || projects.length === 0) {
                try {
                    const response = await API.get('/Project');
                    setProjects(response.data);
                } catch (error) {
                    console.error('Error fetching all projects:', error);
                }
            }
        };
        ensureProjectMapping();
    }, []);

    // Add the toggleExpandAllGroupDetails function
    const toggleExpandAllGroupDetails = async () => {
        if (expandAllGroupDetails) {
            setExpandedGroupProcesses(new Set());
            setExpandedGroupProjects({});
            setExpandedProjectRows({});
            setExpandAllGroupDetails(false);
        } else {
            // Expand all processes
            const allProcessIds = new Set(processProductionData.map(process => process.processId));
            setExpandedGroupProcesses(allProcessIds);
            // Fetch group data for all processes if not already loaded
            await Promise.all(processProductionData.map(async (process) => {
                if (!groupDetailsData[process.processId]) {
                    const params = {};
                    if (startDate && endDate) {
                        params.startDate = formatDateForApi(startDate);
                        params.endDate = formatDateForApi(endDate);
                    } else if (startDate && !endDate) {
                        params.date = formatDateForApi(startDate);
                    }
                    params.processId = process.processId;
                    try {
                        const response = await API.get('/Reports/Process-Production-Report-Group-Wise', { params });
                        if (Array.isArray(response.data)) {
                            setGroupDetailsData(prev => ({ ...prev, [process.processId]: response.data }));
                        }
                    } catch (error) {
                        console.error('Error fetching group details:', error);
                    }
                }
            }));
            // After group data is loaded, expand all groups for each process
            setTimeout(() => {
                const newExpandedGroupProjects = {};
                processProductionData.forEach(process => {
                    if (groupDetailsData[process.processId]) {
                        newExpandedGroupProjects[process.processId] = new Set(groupDetailsData[process.processId].map(group => group.groupId));
                    }
                });
                setExpandedGroupProjects(newExpandedGroupProjects);
            }, 500);
            setExpandAllGroupDetails(true);
        }
    };

    // Fetch projects for selected group
    const fetchProjectsForSelectedGroup = async (groupId) => {
        if (!groupId) {
            setGroupProjects([]);
            return;
        }

        try {
            const response = await API.get(`/Reports/project-lotno-with-status?groupId=${groupId}`);
            setGroupProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects for group:', error);
            setGroupProjects([]);
        }
    };

    // Fetch lot numbers for selected project
    const fetchLotsForSelectedProject = async (groupId, projectId) => {
        if (!groupId || !projectId) {
            setProjectLots([]);
            return;
        }

        try {
            const response = await API.get(`/Reports/project-lotno-with-status?groupId=${groupId}&projectId=${projectId}`);
            setProjectLots(response.data);
        } catch (error) {
            console.error('Error fetching lot numbers for project:', error);
            setProjectLots([]);
        }
    };

    // Add this function after fetchLotsForSelectedProject
    const fetchCatchDetailsForPendingProcess = async (processId) => {
        if (!selectedGroup || !selectedProject || !selectedLot) return;
        try {
            setLoading(true);
            // Call the API with all parameters
            const response = await API.get(`/Reports/pending-process-report-from-quantitysheet`, {
                params: {
                    groupId: selectedGroup,
                    projectId: selectedProject,
                    lotNo: selectedLot,
                    processId: processId
                }
            });
            if (Array.isArray(response.data) && response.data.length > 0) {
                setSelectedProcessCatchDetails(response.data[0]);
                setExpandedPendingProcessId(processId);
                setAllProcessCatchDetails(prev => ({ ...prev, [processId]: response.data[0] }));
            } else {
                setSelectedProcessCatchDetails(null);
                setExpandedPendingProcessId(null);
            }
        } catch (error) {
            setSelectedProcessCatchDetails(null);
            setExpandedPendingProcessId(null);
            alert('Error loading catch details.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch all process catch details for expand all
    const fetchAllPendingProcessCatchDetails = async () => {
        if (!selectedGroup || !selectedProject || !selectedLot) return;
        setLoading(true);
        try {
            const details = {};
            await Promise.all(
                pendingData.map(async (item) => {
                    const response = await API.get(`/Reports/pending-process-report-from-quantitysheet`, {
                        params: {
                            groupId: selectedGroup,
                            projectId: selectedProject,
                            lotNo: selectedLot,
                            processId: item.processId
                        }
                    });
                    if (Array.isArray(response.data) && response.data.length > 0) {
                        details[item.processId] = response.data[0];
                    }
                })
            );
            console.log(details);
            setAllProcessCatchDetails(details);
        } catch (error) {
            alert('Error loading all catch details.');
        } finally {
            setLoading(false);
        }
    };

    // Reset pending report data and hide table when filters change
    useEffect(() => {
        setShowData(false);
        setPendingData([]);
        setSelectedProcessCatchDetails(null);
        // Reset expanded rows
        setExpandedPendingProcessIds(new Set());
        setExpandAllPendingProcesses(false);
        setAllProcessCatchDetails({});
        // Reset sort state to default: high quantity first
        setPendingSortColumn('quantity');
        setPendingSortDirection('desc');
    }, [selectedGroup, selectedProject, selectedLot]);

    // Add a date/time formatting helper below other helpers
    const formatDateTime = (dateTimeStr) => {
        if (!dateTimeStr) return '';
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('en-GB', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        });
    };

    // Add this function to fetch project-wise data for a process in group details
    const fetchProjectWiseForGroupDetails = async (processId) => {
        const params = {};
        if (startDate && endDate) {
            params.startDate = formatDateForApi(startDate);
            params.endDate = formatDateForApi(endDate);
        } else if (startDate) {
            params.date = formatDateForApi(startDate);
        }
        params.processId = processId;
        try {
            const response = await API.get('/Reports/Process-Production-Report-Project-Wise', { params });
            setGroupDetailsProjectWise(prev => ({ ...prev, [processId]: response.data }));
        } catch (error) {
            // Optionally handle error
        }
    };

    // Add this helper just before the return statement
    const showVal = (v) => (v === 0 || v === null || v === undefined ? '' : v);

    // Helper for expanding/collapsing a pending process row
    const handlePendingProcessExpand = async (item) => {
        setSelectedProcessCatchDetails(null); // Always clear single details
        setTimeout(() => {
            setSelectedProcessCatchDetails(null);
            setTimeout(() => {
                setSelectedProcessCatchDetails(null);
            }, 0);
        }, 0);
        setExpandedPendingProcessIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(item.processId)) {
                newSet.delete(item.processId);
            } else {
                newSet.add(item.processId);
            }
            return newSet;
        });
        // Fetch details if not already loaded and expanding
        if (!expandedPendingProcessIds.has(item.processId) && !allProcessCatchDetails[item.processId]) {
            await fetchCatchDetailsForPendingProcess(item.processId);
        }
    };

    return (
        <div>
            {/* Tab Navigation */}
            <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'process-production'}
                        onClick={() => handleTabChange('process-production')}
                        style={{ cursor: 'pointer' }}
                    >
                        <FaChartBar className="me-2" />
                        Process Production Report
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'pending-report'}
                        onClick={() => handleTabChange('pending-report')}
                        style={{ cursor: 'pointer' }}
                    >
                        <FaClipboardList className="me-2" />
                        Pending Report
                    </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link
                        active={activeTab === 'group-production'}
                        onClick={() => handleTabChange('group-production')}
                        style={{ cursor: 'pointer' }}
                    >
                        <FaUsers className="me-2" />
                        Group Production Report
                    </Nav.Link>
                </Nav.Item>
            </Nav>

            {/* Dynamic Filter Section based on Active Tab */}
            {activeTab === 'process-production' && (
                <Row className="mb-4 align-items-end">
                    <Col md={3} lg={2}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold mb-1">
                                <FaCalendarAlt className="me-1" size={12} />
                                From
                            </Form.Label>
                            <Form.Control
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                size="sm"
                                style={{ height: '32px' }}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3} lg={2}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold mb-1">
                                <FaCalendarAlt className="me-1" size={12} />
                                To
                            </Form.Label>
                            <Form.Control
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                size="sm"
                                style={{ height: '32px' }}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={3} lg={2}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold mb-1">
                                Report Type
                            </Form.Label>
                            <Form.Select
                                value={selectedView}
                                onChange={(e) => setSelectedView(e.target.value)}
                                size="sm"
                                style={{ height: '32px', width: '75%' }}
                            >
                                <option value="">Select Report</option>
                                <option value="summary">Summary</option>
                               
                                <option value="details">Details</option>
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={3} lg={2}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold mb-1" style={{ visibility: 'hidden' }}>
                                Action
                            </Form.Label>
                            {startDate && selectedView && (
                                <Button
                                    variant="primary"
                                    onClick={fetchProcessProductionReport}
                                    disabled={loading}
                                    size="sm"
                                    style={{ height: '32px', width: '50%' }}
                                >
                                    {loading ? <Spinner animation="border" size="sm" /> : 'View Report'}
                                </Button>
                            )}
                        </Form.Group>
                    </Col>
                </Row>
            )}

            {activeTab === 'pending-report' && (
                <Row className="mb-4 align-items-end">

                    <Col md={2} lg={2}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold mb-1 d-flex align-items-center">
                                Group
                                <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1em', marginLeft: 4 }}>*</span>
                            </Form.Label>
                            <Form.Select
                                value={selectedGroup}
                                onChange={(e) => {
                                    setSelectedGroup(e.target.value);
                                    setSelectedProject(''); // Clear project selection
                                    fetchProjectsForSelectedGroup(e.target.value);
                                }}
                                size="sm"
                                style={{ height: '32px' }}
                            >
                                <option value="">All Groups</option>
                                {apiGroups.map((group) => (
                                    <option key={group.groupId} value={group.groupId}>
                                        {getGroupName(group.groupId)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={2} lg={2}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold mb-1 d-flex align-items-center">
                                Project
                                <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1em', marginLeft: 4 }}>*</span>
                            </Form.Label>
                            <Form.Select
                                value={selectedProject}
                                onChange={(e) => {
                                    setSelectedProject(e.target.value);
                                    setSelectedLot(''); // Clear lot selection
                                    fetchLotsForSelectedProject(selectedGroup, e.target.value);
                                }}
                                size="sm"
                                style={{ height: '32px' }}
                            >
                                <option value="">All Projects</option>
                                {groupProjects.map((project) => (
                                    <option key={project.projectId} value={project.projectId}>
                                        {project.name ? project.name : `Project ${project.projectId}`}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={2} lg={1}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold mb-1 d-flex align-items-center">
                                Lot
                                <span style={{ color: 'red', fontWeight: 'bold', fontSize: '1.1em', marginLeft: 4 }}>*</span>
                            </Form.Label>
                            <Form.Select
                                value={selectedLot}
                                onChange={(e) => setSelectedLot(e.target.value)}
                                size="sm"
                                style={{ height: '32px' }}
                            >
                                <option value="">All Lots</option>
                                {projectLots.map((lot, index) => (
                                    <option key={index} value={lot.lotNo}>
                                        {lot.lotNo}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>

                    <Col md={2} lg={1}>
                        <Form.Group>
                            <Form.Label className="small fw-semibold mb-1" style={{ visibility: 'hidden' }}>
                                Action
                            </Form.Label>
                            <Button
                                variant="primary"
                                onClick={handleViewReport}
                                disabled={loading}
                                size="sm"
                                style={{ height: '32px', width: '100%' }}
                            >
                                {loading ? <Spinner animation="border" size="sm" /> : 'View Report'}
                            </Button>
                        </Form.Group>
                    </Col>
                </Row>
            )}

            {activeTab === 'group-production' && (
                <>
                    {/* Use the same filter section as process-production */}
                    <Row className="mb-4 align-items-end">
                        <Col md={3} lg={2}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold mb-1">
                                    <FaCalendarAlt className="me-1" size={12} />
                                    From
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    size="sm"
                                    style={{ height: '32px' }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3} lg={2}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold mb-1">
                                    <FaCalendarAlt className="me-1" size={12} />
                                    To
                                </Form.Label>
                                <Form.Control
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    size="sm"
                                    style={{ height: '32px' }}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={3} lg={2}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold mb-1">
                                    Report Type
                                </Form.Label>
                                <Form.Select
                                    value={selectedView}
                                    onChange={(e) => setSelectedView(e.target.value)}
                                    size="sm"
                                    style={{ height: '32px', width: '75%' }}
                                >
                                    <option value="">Select Report</option>
                                    <option value="summary">Summary</option>
                                    <option value="group-details">Group Details</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col md={3} lg={2}>
                            <Form.Group>
                                <Form.Label className="small fw-semibold mb-1" style={{ visibility: 'hidden' }}>
                                    Action
                                </Form.Label>
                                {startDate && selectedView && (
                                    <Button
                                        variant="primary"
                                        onClick={fetchProcessProductionReport}
                                        disabled={loading}
                                        size="sm"
                                        style={{ height: '32px', width: '50%' }}
                                    >
                                        {loading ? <Spinner animation="border" size="sm" /> : 'View Report'}
                                    </Button>
                                )}
                            </Form.Group>
                        </Col>
                    </Row>
                    {/* Show the same summary table as process-production summary view */}
                    {selectedView === 'summary' && (
                        processProductionData && processProductionData.length > 0 ? (
                            <>
                                {/* Export Buttons */}
                                <GroupExport
                                    data={processProductionData}
                                    viewType="summary"
                                    startDate={startDate}
                                    endDate={endDate}
                                    getProcessName={getProcessName}
                                />

                                <div className="d-flex justify-content-center">
                                    <div className="table-responsive" style={{ width: '65%' }}>
                                        <Table striped bordered hover size="sm" className="shadow-sm" style={{
                                            fontSize: '0.8rem',
                                            border: '2px solid #dee2e6',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            margin: '0 auto',
                                            backgroundColor: '#fff',
                                            tableLayout: 'fixed'
                                        }}>
                                            <thead className="table-light">
                                                <tr>
                                                    <th rowSpan="2" className="text-center" style={{

                                                        padding: '6px 4px',
                                                        verticalAlign: 'middle',
                                                        fontWeight: '800',
                                                        width: '10%',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Process</th>
                                                    <th colSpan="2" className="text-center" style={{

                                                        padding: '6px 8px',
                                                        fontWeight: '800',
                                                        width: '15%',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Paper</th>
                                                    <th colSpan="2" className="text-center" style={{

                                                        padding: '6px 8px',
                                                        fontWeight: '800',
                                                        width: '15%',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Booklet</th>
                                                </tr>
                                                <tr>
                                                    <th className="text-center" style={{

                                                        padding: '4px 6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '800',
                                                        width: '15%',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Catch</th>
                                                    <th className="text-center" style={{

                                                        padding: '4px 6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '800',
                                                        width: '10%',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Quantity</th>
                                                    <th className="text-center" style={{

                                                        padding: '4px 6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '800',
                                                        width: '10%',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Catch</th>
                                                    <th className="text-center" style={{

                                                        padding: '4px 6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '800',
                                                        width: '10%',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {processProductionData.length === 0 ? (
                                                    <tr>
                                                        <td className="text-center" colSpan={5}>&nbsp;</td>
                                                    </tr>
                                                ) : (
                                                    processProductionData.map((item, index) => (
                                                        <tr key={index} style={{
                                                            backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit',
                                                            fontWeight: item.isTotal ? '700' : 'normal'
                                                        }}>
                                                            <td className="text-center" style={{

                                                                padding: '6px 8px',
                                                                fontWeight: item.isTotal ? '800' : '700',
                                                                width: '20%',
                                                                wordWrap: 'break-word',
                                                                backgroundColor: item.isTotal ? '#1976d2' : 'inherit',
                                                                color: item.isTotal ? 'white' : 'inherit'
                                                            }}>{item.isTotal ? item.processName : getProcessName(item.processId)}</td>
                                                            <td className="text-center" style={{

                                                                fontWeight: item.isTotal ? '700' : '600',
                                                                padding: '6px 10px',
                                                                width: '10%',
                                                                backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit'
                                                            }}>{item.completedTotalCatchesInPaper ? item.completedTotalCatchesInPaper : ""}</td>
                                                            <td className="text-center" style={{

                                                                fontWeight: item.isTotal ? '700' : '600',
                                                                padding: '6px 10px',
                                                                width: '10%',
                                                                backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit'
                                                            }}>{item.completedTotalQuantityInPaper ? item.completedTotalQuantityInPaper.toLocaleString() : ""}</td>
                                                            <td className="text-center" style={{

                                                                fontWeight: item.isTotal ? '700' : '600',
                                                                padding: '6px 10px',
                                                                width: '10%',
                                                                backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit'
                                                            }}>{item.completedTotalCatchesInBooklet ? item.completedTotalCatchesInBooklet : ""}</td>
                                                            <td className="text-center" style={{

                                                                fontWeight: item.isTotal ? '700' : '600',
                                                                padding: '6px 10px',
                                                                width: '10%',
                                                                backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit'
                                                            }}>{item.completedTotalQuantityInBooklet ? item.completedTotalQuantityInBooklet.toLocaleString() : ""}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-4">
                                <FaUsers size={48} className="text-muted mb-3" />
                                <h5>No Process Production Data</h5>
                                <p className="text-muted">No data found for the selected date range.</p>
                            </div>
                        )
                    )}
                    {/* Group Details Table */}
                    {selectedView === 'group-details' && processProductionData && processProductionData.length > 0 && (
                        <div style={{ position: 'relative', width: '70%', margin: '0 auto' }}>
                            {/* Floating controls at top-right */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                zIndex: 2
                            }}>
                                <OverlayTrigger
                                    overlay={
                                        <Tooltip id="expand-all-group-details-tooltip">
                                            {expandAllGroupDetails ? 'Collapse all' : 'Expand all'}
                                        </Tooltip>
                                    }
                                >
                                    <div className="d-inline-flex align-items-center">
                                        <Form.Label htmlFor="expand-all-group-details-checkbox" className="me-2 mb-0 small fw-semibold" style={{ cursor: 'pointer' }}>
                                            Expand All:
                                        </Form.Label>
                                        <Form.Check
                                            type="checkbox"
                                            id="expand-all-group-details-checkbox"
                                            checked={expandAllGroupDetails}
                                            onChange={toggleExpandAllGroupDetails}
                                            style={{ fontSize: '20px', cursor: 'pointer' }}
                                        />
                                    </div>
                                </OverlayTrigger>
                                <GroupExport
                                    data={processProductionData}
                                    groupDetailsData={groupDetailsData}
                                    expandedGroupProcesses={expandedGroupProcesses}
                                    expandedGroupProjects={expandedGroupProjects}
                                    expandedProjectRows={expandedProjectRows}
                                    groupProjectDetails={groupProjectDetails}
                                    projectCatchLists={projectCatchLists}
                                    viewType="group-details"
                                    startDate={startDate}
                                    endDate={endDate}
                                    getProcessName={getProcessName}
                                    getGroupName={getGroupName}
                                    getProjectName={getProjectName}
                                />
                            </div>
                            {/* Table below */}
                            <div className="table-responsive" style={{ width: '100%' }}>
                                {/* Export Buttons for Group Details */}
                                {selectedView === 'group-details' && processProductionData && processProductionData.length > 0 && (
                                    <GroupExport
                                        data={processProductionData}
                                        groupDetailsData={groupDetailsData}
                                        expandedGroupProcesses={expandedGroupProcesses}
                                        expandedGroupProjects={expandedGroupProjects}
                                        expandedProjectRows={expandedProjectRows}
                                        groupProjectDetails={groupProjectDetails}
                                        projectCatchLists={projectCatchLists}
                                        viewType="group-details"
                                        startDate={startDate}
                                        endDate={endDate}
                                        getProcessName={getProcessName}
                                        getGroupName={getGroupName}
                                        getProjectName={getProjectName}
                                    />
                                )}

                                {/* End Group Details Table */}
                                <Table striped bordered hover size="sm" className="shadow-sm" style={{
                                    fontSize: '0.8rem',
                                    border: '2px solid #dee2e6',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    margin: '0 auto',
                                    backgroundColor: '#fff',
                                    tableLayout: 'fixed'
                                }}>
                                    <thead className="table-light">
                                        <tr>
                                            <th rowSpan="2" className="text-center" style={{
                                                padding: '6px 4px',
                                                verticalAlign: 'middle',
                                                fontWeight: '800',
                                                width: '20%',
                                                fontSize: '0.75rem',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Process</th>
                                            <th colSpan="2" className="text-center" style={{
                                                padding: '6px 8px',
                                                fontWeight: '800',
                                                width: '30%',
                                                fontSize: '0.75rem',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Paper</th>
                                            <th colSpan="2" className="text-center" style={{
                                                padding: '6px 8px',
                                                fontWeight: '800',
                                                width: '30%',
                                                fontSize: '0.75rem',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Booklet</th>
                                        </tr>
                                        <tr>
                                            <th className="text-center" style={{
                                                padding: '4px 6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                width: '15%',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Catch</th>
                                            <th className="text-center" style={{
                                                padding: '4px 6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                width: '15%',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Quantity</th>
                                            <th className="text-center" style={{
                                                padding: '4px 6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                width: '15%',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Catch</th>
                                            <th className="text-center" style={{
                                                padding: '4px 6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                width: '15%',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processProductionData.filter(process => process.processId !== "Total").map((process, idx) => (
                                            <React.Fragment key={process.processId || idx}>
                                                <tr
                                                    style={{
                                                        cursor: 'pointer',
                                                        backgroundColor: '#f8f9fa'
                                                    }}
                                                    onClick={async () => {
                                                        const newExpanded = new Set(expandedGroupProcesses);
                                                        if (newExpanded.has(process.processId)) {
                                                            newExpanded.delete(process.processId);
                                                        } else {
                                                            newExpanded.add(process.processId);
                                                            if (!groupDetailsData[process.processId]) {
                                                                // Fetch group data for this process
                                                                const params = {};
                                                                if (startDate && endDate) {
                                                                    params.startDate = formatDateForApi(startDate);
                                                                    params.endDate = formatDateForApi(endDate);
                                                                } else if (startDate && !endDate) {
                                                                    params.date = formatDateForApi(startDate);
                                                                }
                                                                params.processId = process.processId;
                                                                try {
                                                                    const response = await API.get('/Reports/Process-Production-Report-Group-Wise', { params });
                                                                    if (Array.isArray(response.data)) {
                                                                        setGroupDetailsData(prev => ({ ...prev, [process.processId]: response.data }));
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error fetching group details:', error);
                                                                }
                                                            }
                                                            // Always fetch project-wise data if not already loaded
                                                            if (!groupDetailsProjectWise[process.processId]) {
                                                                await fetchProjectWiseForGroupDetails(process.processId);
                                                            }
                                                        }
                                                        setExpandedGroupProcesses(newExpanded);
                                                    }}
                                                >
                                                    <td style={{
                                                        padding: '6px 8px',
                                                        fontWeight: '600',
                                                        width: '20%',
                                                        wordWrap: 'break-word',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        <div className="d-flex align-items-center">
                                                            {expandedGroupProcesses.has(process.processId) ?
                                                                <FaChevronDown className="me-2 text-primary" /> :
                                                                <FaChevronRight className="me-2 text-primary" />
                                                            }
                                                            {getProcessName(process.processId)}
                                                        </div>
                                                    </td>
                                                    <td className="text-center" style={{ padding: '6px 4px', width: '15%', fontWeight: '600', fontSize: '0.8rem' }}>{process.completedTotalCatchesInPaper || ''}</td>
                                                    <td className="text-center" style={{ padding: '6px 4px', width: '15%', fontWeight: '600', fontSize: '0.8rem' }}>{process.completedTotalQuantityInPaper ? process.completedTotalQuantityInPaper.toLocaleString() : ''}</td>
                                                    <td className="text-center" style={{ padding: '6px 4px', width: '15%', fontWeight: '600', fontSize: '0.8rem' }}>{process.completedTotalCatchesInBooklet || ''}</td>
                                                    <td className="text-center" style={{ padding: '6px 4px', width: '15%', fontSize: '0.75rem', color: '#2e7d32', fontWeight: '600' }}>{process.completedTotalQuantityInBooklet ? process.completedTotalQuantityInBooklet.toLocaleString() : ''}</td>
                                                </tr>
                                                {/* Project-wise details table directly under process row when expanded */}
                                                {activeTab !== 'group-production' && expandedGroupProcesses.has(process.processId) && groupDetailsProjectWise[process.processId] && groupDetailsProjectWise[process.processId].length > 0 && (
                                                    <tr>
                                                        <td colSpan={5} style={{ background: '#f1f8e9', padding: '0.5rem 1rem' }}>
                                                            <div>
                                                                <strong>Project Wise Details:</strong>
                                                                <Table bordered size="sm" style={{ margin: 0, background: '#fff', fontSize: '0.8rem' }}>
                                                                    <thead className="table-light">
                                                                        <tr>
                                                                            <th rowSpan="2" className="text-center" style={{ width: '30%' }}>Project</th>
                                                                            <th colSpan="2" className="text-center">Paper</th>
                                                                            <th colSpan="2" className="text-center">Booklet</th>
                                                                        </tr>
                                                                        <tr>
                                                                            <th className="text-center">Catch</th>
                                                                            <th className="text-center">Quantity</th>
                                                                            <th className="text-center">Catch</th>
                                                                            <th className="text-center">Quantity</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {groupDetailsProjectWise[process.processId].map((proj, idx) => (
                                                                            <tr key={proj.projectId || idx}>
                                                                                <td className="text-center">{proj.projectName}</td>
                                                                                <td className="text-center">{proj.completedTotalCatchesInPaper}</td>
                                                                                <td className="text-center">{proj.completedTotalQuantityInPaper}</td>
                                                                                <td className="text-center">{proj.completedTotalCatchesInBooklet}</td>
                                                                                <td className="text-center">{proj.completedTotalQuantityInBooklet}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </Table>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                                {/* Group rows under process, shown when expanded */}
                                                {expandedGroupProcesses.has(process.processId) && groupDetailsData[process.processId] && groupDetailsData[process.processId].length > 0 && (
                                                    groupDetailsData[process.processId].map((group, gidx) => (
                                                        <React.Fragment key={group.groupId}>
                                                            <tr
                                                                style={{ backgroundColor: '#fff', cursor: 'pointer' }}
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    const processGroups = new Set(expandedGroupProjects[process.processId] || []);
                                                                    if (processGroups.has(group.groupId)) {
                                                                        processGroups.delete(group.groupId);
                                                                    } else {
                                                                        processGroups.add(group.groupId);
                                                                        if (!groupProjectDetails[process.processId] || !groupProjectDetails[process.processId][group.groupId]) {
                                                                            // Fetch project data for this group
                                                                            const params = {};
                                                                            if (startDate && endDate) {
                                                                                params.startDate = formatDateForApi(startDate);
                                                                                params.endDate = formatDateForApi(endDate);
                                                                            } else if (startDate && !endDate) {
                                                                                params.date = formatDateForApi(startDate);
                                                                            }
                                                                            params.processId = process.processId;
                                                                            params.groupId = group.groupId;
                                                                            try {
                                                                                const response = await API.get('/Reports/Process-Production-Report-Project-Wise', { params });
                                                                                if (Array.isArray(response.data)) {
                                                                                    setGroupProjectDetails(prev => ({
                                                                                        ...prev,
                                                                                        [process.processId]: {
                                                                                            ...(prev[process.processId] || {}),
                                                                                            [group.groupId]: response.data
                                                                                        }
                                                                                    }));
                                                                                }
                                                                            } catch (error) {
                                                                                console.error('Error fetching project details for group:', error);
                                                                            }
                                                                        }
                                                                    }
                                                                    setExpandedGroupProjects(prev => ({ ...prev, [process.processId]: processGroups }));
                                                                }}
                                                            >
                                                                <td style={{

                                                                    padding: '6px 8px 6px 32px',
                                                                    fontWeight: '500',
                                                                    color: '#388e3c',
                                                                    fontSize: '0.8rem'
                                                                }}>
                                                                    <div className="d-flex align-items-center">
                                                                        {expandedGroupProjects[process.processId]?.has(group.groupId) ?
                                                                            <FaChevronDown className="me-2 text-success" /> :
                                                                            <FaChevronRight className="me-2 text-success" />
                                                                        }
                                                                        └─ {getGroupName(group.groupId)}
                                                                    </div>
                                                                </td>
                                                                <td className="text-center" style={{ padding: '6px 4px', fontSize: '0.8rem' }}>{group.completedTotalCatchesInPaper || ''}</td>
                                                                <td className="text-center" style={{ padding: '6px 4px', fontSize: '0.8rem' }}>{group.completedTotalQuantityInPaper ? group.completedTotalQuantityInPaper.toLocaleString() : ''}</td>
                                                                <td className="text-center" style={{ padding: '6px 4px', fontSize: '0.8rem' }}>{group.completedTotalCatchesInBooklet || ''}</td>
                                                                <td className="text-center" style={{ padding: '6px 4px', fontSize: '0.8rem' }}>{group.completedTotalQuantityInBooklet ? group.completedTotalQuantityInBooklet.toLocaleString() : ''}</td>
                                                            </tr>
                                                            {/* Project rows under group, shown when expanded */}
                                                            {expandedGroupProjects[process.processId]?.has(group.groupId) && groupProjectDetails[process.processId]?.[group.groupId] && groupProjectDetails[process.processId][group.groupId].length > 0 && (
                                                                groupProjectDetails[process.processId][group.groupId].map((proj, projIdx) => (
                                                                    <React.Fragment key={proj.projectId}>
                                                                        <tr
                                                                            style={{ backgroundColor: '#f9fbe7', fontSize: '0.75rem' }}
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation();
                                                                                const groupProjects = new Set((expandedProjectRows[process.processId]?.[group.groupId]) || []);
                                                                                if (groupProjects.has(proj.projectId)) {
                                                                                    groupProjects.delete(proj.projectId);
                                                                                } else {
                                                                                    groupProjects.add(proj.projectId);
                                                                                    if (!projectCatchLists[process.processId]?.[group.groupId]?.[proj.projectId]) {
                                                                                        // Fetch catch list for this project
                                                                                        const params = {};
                                                                                        if (startDate && endDate) {
                                                                                            params.startDate = formatDateForApi(startDate);
                                                                                            params.endDate = formatDateForApi(endDate);
                                                                                        } else if (startDate && !endDate) {
                                                                                            params.date = formatDateForApi(startDate);
                                                                                        }
                                                                                        params.processId = process.processId;
                                                                                        params.groupId = group.groupId;
                                                                                        params.projectId = proj.projectId;
                                                                                        try {
                                                                                            const response = await API.get('/Reports/Process-Production-Report-Group-Wise', { params });
                                                                                            if (Array.isArray(response.data) && response.data.length > 0) {
                                                                                                const { bookletCatchList, paperCatchList, lotNos } = response.data[0];
                                                                                                setProjectCatchLists(prev => ({
                                                                                                    ...prev,
                                                                                                    [process.processId]: {
                                                                                                        ...(prev[process.processId] || {}),
                                                                                                        [group.groupId]: {
                                                                                                            ...(prev[process.processId]?.[group.groupId] || {}),
                                                                                                            [proj.projectId]: { bookletCatchList, paperCatchList, lotNos }
                                                                                                        }
                                                                                                    }
                                                                                                }));
                                                                                            }
                                                                                        } catch (error) {
                                                                                            console.error('Error fetching catch list for project:', error);
                                                                                        }
                                                                                    }
                                                                                }
                                                                                setExpandedProjectRows(prev => ({
                                                                                    ...prev,
                                                                                    [process.processId]: {
                                                                                        ...(prev[process.processId] || {}),
                                                                                        [group.groupId]: groupProjects
                                                                                    }
                                                                                }));
                                                                            }}
                                                                        >
                                                                            <td style={{ padding: '6px 8px 6px 56px', fontWeight: '600', color: '#1976d2' }}>
                                                                                <div className="d-flex align-items-center">
                                                                                    {expandedProjectRows[process.processId]?.[group.groupId]?.has(proj.projectId) ?
                                                                                        <FaChevronDown className="me-2 text-info" /> :
                                                                                        <FaChevronRight className="me-2 text-info" />
                                                                                    }
                                                                                    └─ {getProjectName(proj.projectId)}
                                                                                </div>
                                                                            </td>
                                                                            <td className="text-center" style={{ padding: '6px 4px', color: '#388e3c', fontWeight: '600' }}>{proj.completedTotalCatchesInPaper || 0}</td>
                                                                            <td className="text-center" style={{ padding: '6px 4px', color: '#388e3c', fontWeight: '600' }}>{proj.completedTotalQuantityInPaper ? proj.completedTotalQuantityInPaper.toLocaleString() : ''}</td>
                                                                            <td className="text-center" style={{ padding: '6px 4px', color: '#388e3c', fontWeight: '600' }}>{proj.completedTotalCatchesInBooklet || 0}</td>
                                                                            <td className="text-center" style={{ padding: '6px 4px', color: '#388e3c', fontWeight: '600' }}>{proj.completedTotalQuantityInBooklet ? proj.completedTotalQuantityInBooklet.toLocaleString() : ''}</td>
                                                                        </tr>
                                                                        {/* Catch list row under project, shown when expanded */}
                                                                        {expandedProjectRows[process.processId]?.[group.groupId]?.has(proj.projectId) && projectCatchLists[process.processId]?.[group.groupId]?.[proj.projectId] && (
                                                                            <tr style={{ backgroundColor: '#e3f2fd', fontSize: '0.75rem' }}>
                                                                                <td colSpan={5} style={{ padding: '8px 16px' }}>
                                                                                    <div>
                                                                                        <strong>Booklet Catch List:</strong> {projectCatchLists[process.processId][group.groupId][proj.projectId].bookletCatchList?.length > 0 ? projectCatchLists[process.processId][group.groupId][proj.projectId].bookletCatchList.join(', ') : 'None'}
                                                                                    </div>
                                                                                    <div>
                                                                                        <strong>Paper Catch List:</strong> {projectCatchLists[process.processId][group.groupId][proj.projectId].paperCatchList?.length > 0 ? projectCatchLists[process.processId][group.groupId][proj.projectId].paperCatchList.join(', ') : 'None'}
                                                                                    </div>
                                                                                    <div>
                                                                                        <strong style={{ color: 'Red', fontWeight: 'bold' }}>Lot No:</strong>
                                                                                        {projectCatchLists[process.processId][group.groupId][proj.projectId].lotNos?.length > 0 ? (
                                                                                            <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '15px', marginLeft: 8 }}>
                                                                                                {projectCatchLists[process.processId][group.groupId][proj.projectId].lotNos.join(', ')}
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span style={{ color: '#757575', marginLeft: 8 }}>None</span>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        )}
                                                                    </React.Fragment>
                                                                ))
                                                            )}
                                                        </React.Fragment>
                                                    ))
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    )}


                </>
            )}

            {/* Content based on active tab */}
            {loading ? (
                <div >

                </div>
            ) : ((activeTab === 'process-production' && startDate && (selectedView === 'summary' || selectedView === 'group-details' || selectedView === 'details') && showData) || (activeTab === 'pending-report' && selectedGroup && selectedProject && selectedLot && showData)) ? (
                <div className="mt-4">
                    {/* Process Production Report Content */}
                    {activeTab === 'process-production' && selectedView === 'details' && processProductionDetailsData && processProductionDetailsData.length > 0 && (
                        <div className="d-flex flex-column align-items-center">
                            {/* Export button above the table, right aligned */}
                            <div style={{ width: '65%', display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                                <ProcessExport
                                    data={processProductionDetailsData}
                                    detailsData={processProductionDetailsData}
                                    viewType="details"
                                    startDate={startDate}
                                    endDate={endDate}
                                    getProcessName={getProcessName}
                                />
                            </div>
                            {/* Expand All Checkbox above the table, right aligned */}
                            <div style={{ width: '65%', display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                                <label style={{ fontWeight: 500, fontSize: '0.95em', cursor: 'pointer', userSelect: 'none' }}>
                                    <input
                                        type="checkbox"
                                        checked={expandAllProcesses}
                                        onChange={toggleExpandAllProcesses}
                                        style={{ marginRight: 6 }}
                                    />
                                    Expand All
                                </label>
                            </div>
                            <div className="table-responsive" style={{ width: '65%' }}>
                                <Table striped bordered hover size="sm" className="shadow-sm" style={{
                                    fontSize: '0.8rem',
                                    border: '2px solid #dee2e6',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    margin: '0 auto',
                                    backgroundColor: '#fff',
                                    tableLayout: 'fixed'
                                }}>
                                    <thead className="table-light">
                                        <tr>
                                            <th rowSpan="2" className="text-center" style={{
                                                padding: '6px 4px',
                                                verticalAlign: 'middle',
                                                fontWeight: '800',
                                                width: '20%',
                                                fontSize: '0.75rem',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Process</th>
                                            <th colSpan="2" className="text-center" style={{
                                                padding: '6px 8px',
                                                fontWeight: '800',
                                                width: '30%',
                                                fontSize: '0.75rem',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Paper</th>
                                            <th colSpan="2" className="text-center" style={{
                                                padding: '6px 8px',
                                                fontWeight: '800',
                                                width: '30%',
                                                fontSize: '0.75rem',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Booklet</th>
                                        </tr>
                                        <tr>
                                            <th className="text-center" style={{
                                                padding: '4px 6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                width: '15%',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Catch</th>
                                            <th className="text-center" style={{
                                                padding: '4px 6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                width: '15%',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Quantity</th>
                                            <th className="text-center" style={{
                                                padding: '4px 6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                width: '15%',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Catch</th>
                                            <th className="text-center" style={{
                                                padding: '4px 6px',
                                                fontSize: '0.7rem',
                                                fontWeight: '800',
                                                width: '15%',
                                                backgroundColor: '#343a40', color: 'white'
                                            }}>Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processProductionDetailsData.map((process, idx) => {
                                            const isExpanded = expandedProcesses.has(process.processId);
                                            return (
                                                <React.Fragment key={process.processId || idx}>
                                                    <tr
                                                        style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#e3f2fd' : 'inherit' }}
                                                        onClick={async () => { await toggleProcessExpansion(process.processId); }}
                                                    >
                                                        <td className="text-center" style={{
                                                            padding: '6px 8px',
                                                            fontWeight: '700',
                                                            width: '20%',
                                                            wordWrap: 'break-word',
                                                            fontSize: '0.8rem',
                                                            backgroundColor: isExpanded ? '#1976d2' : 'inherit',
                                                            color: isExpanded ? 'white' : 'inherit'
                                                        }}>
                                                            <div className="d-flex align-items-center">
                                                                {isExpanded ? <FaChevronDown className="me-2 text-primary" /> : <FaChevronRight className="me-2 text-primary" />}
                                                                {process.processName}
                                                            </div>
                                                        </td>
                                                        <td className="text-center">{showVal(process.completedTotalCatchesInPaper)}</td>
                                                        <td className="text-center">{showVal(process.completedTotalQuantityInPaper) ? process.completedTotalQuantityInPaper.toLocaleString() : ''}</td>
                                                        <td className="text-center">{showVal(process.completedTotalCatchesInBooklet)}</td>
                                                        <td className="text-center">{showVal(process.completedTotalQuantityInBooklet) ? process.completedTotalQuantityInBooklet.toLocaleString() : ''}</td>
                                                    </tr>
                                                    {/* Show project rows directly below process row when expanded */}
                                                    {isExpanded && process.projects && process.projects.length > 0 && process.projects.map((proj, pidx) => (
                                                        <tr key={proj.projectId || pidx} style={{ background: '#f1f8e9', fontSize: '0.8rem' }}>
                                                            <td style={{ paddingLeft: 36, fontWeight: 500, color: '#1976d2' }}>
                                                                └ {proj.projectName}
                                                            </td>
                                                            <td className="text-center">{showVal(proj.completedTotalCatchesInPaper)}</td>
                                                            <td className="text-center">{showVal(proj.completedTotalQuantityInPaper) ? proj.completedTotalQuantityInPaper.toLocaleString() : ''}</td>
                                                            <td className="text-center">{showVal(proj.completedTotalCatchesInBooklet)}</td>
                                                            <td className="text-center">{showVal(proj.completedTotalQuantityInBooklet) ? proj.completedTotalQuantityInBooklet.toLocaleString() : ''}</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Process Production Report Content */}
                    {activeTab === 'process-production' && (selectedView === 'summary' || selectedView === 'group-details') && (
                        <>
                            {/* Export Buttons */}
                            {processProductionData && processProductionData.length > 0 && (
                                <ProcessExport
                                    data={processProductionData}
                                    viewType="summary"
                                    startDate={startDate}
                                    endDate={endDate}
                                    getProcessName={getProcessName}
                                />
                            )}

                            {processProductionData && processProductionData.length > 0 ? (
                                <div className="d-flex justify-content-center">
                                    <div className="table-responsive" style={{ width: '65%' }}>
                                        <Table striped bordered hover size="sm" className="shadow-sm" style={{
                                            fontSize: '0.8rem',
                                            border: '2px solid #dee2e6',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            margin: '0 auto',
                                            backgroundColor: '#fff',
                                            tableLayout: 'fixed'
                                        }}>
                                            <thead className="table-light">
                                                <tr>
                                                    <th rowSpan="2" className="text-center" style={{

                                                        padding: '6px 4px',
                                                        verticalAlign: 'middle',
                                                        fontWeight: '800',
                                                        width: '10%',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Process</th>
                                                    <th colSpan="2" className="text-center" style={{

                                                        padding: '6px 8px',
                                                        fontWeight: '800',
                                                        width: '15%',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Paper</th>
                                                    <th colSpan="2" className="text-center" style={{

                                                        padding: '6px 8px',
                                                        fontWeight: '800',
                                                        width: '15%',
                                                        fontSize: '0.75rem',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Booklet</th>
                                                </tr>
                                                <tr>
                                                    <th className="text-center" style={{

                                                        padding: '4px 6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '800',
                                                        width: '15%',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Catch</th>
                                                    <th className="text-center" style={{

                                                        padding: '4px 6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '800',
                                                        width: '10%',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Quantity</th>
                                                    <th className="text-center" style={{

                                                        padding: '4px 6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '800',
                                                        width: '10%',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Catch</th>
                                                    <th className="text-center" style={{

                                                        padding: '4px 6px',
                                                        fontSize: '0.7rem',
                                                        fontWeight: '800',
                                                        width: '10%',
                                                        backgroundColor: '#343a40', color: 'white'
                                                    }}>Quantity</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {processProductionData.length === 0 ? (
                                                    <tr>
                                                        <td className="text-center" colSpan={5}>&nbsp;</td>
                                                    </tr>
                                                ) : (
                                                    processProductionData.map((item, index) => (
                                                        <tr key={index} style={{
                                                            backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit',
                                                            fontWeight: item.isTotal ? '700' : 'normal'
                                                        }}>
                                                            <td className="text-center" style={{

                                                                padding: '6px 8px',
                                                                fontWeight: item.isTotal ? '800' : '700',
                                                                width: '20%',
                                                                wordWrap: 'break-word',
                                                                backgroundColor: item.isTotal ? '#1976d2' : 'inherit',
                                                                color: item.isTotal ? 'white' : 'inherit'
                                                            }}>{item.isTotal ? item.processName : getProcessName(item.processId)}</td>
                                                            <td className="text-center" style={{

                                                                fontWeight: item.isTotal ? '700' : '600',
                                                                padding: '6px 10px',
                                                                width: '10%',
                                                                backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit'
                                                            }}>{item.completedTotalCatchesInPaper ? item.completedTotalCatchesInPaper : ""}</td>
                                                            <td className="text-center" style={{

                                                                fontWeight: item.isTotal ? '700' : '600',
                                                                padding: '6px 10px',
                                                                width: '10%',
                                                                backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit'
                                                            }}>{item.completedTotalQuantityInPaper ? item.completedTotalQuantityInPaper.toLocaleString() : ""}</td>
                                                            <td className="text-center" style={{

                                                                fontWeight: item.isTotal ? '700' : '600',
                                                                padding: '6px 10px',
                                                                width: '10%',
                                                                backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit'
                                                            }}>{item.completedTotalCatchesInBooklet ? item.completedTotalCatchesInBooklet : ""}</td>
                                                            <td className="text-center" style={{

                                                                fontWeight: item.isTotal ? '700' : '600',
                                                                padding: '6px 10px',
                                                                width: '10%',
                                                                backgroundColor: item.isTotal ? '#e3f2fd' : 'inherit'
                                                            }}>{item.completedTotalQuantityInBooklet ? item.completedTotalQuantityInBooklet.toLocaleString() : ""}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-4">
                                    <p className="text-muted">No data found for the selected date.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Pending Report Content */}
                    {activeTab === 'pending-report' && showData && (
                        <>
                            {/* Export Buttons */}
                            {pendingData && pendingData.length > 0 && (
                                <PendingExport
                                    data={pendingData}
                                    startDate={startDate}
                                    endDate={endDate}
                                    getProcessName={getProcessName}
                                    expandedPendingProcessIds={new Set(pendingData.map(item => item.processId))}
                                    allProcessCatchDetails={allProcessCatchDetails}
                                    groupName={getGroupName(selectedGroup)}
                                    projectName={getProjectName(selectedProject)}
                                    lotNo={selectedLot}
                                />
                            )}

                            {pendingData && pendingData.length > 0 ? (
                                <div style={{ position: 'relative', width: '90%',  margin: '0 auto' }}>
                                    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                                        <Table striped bordered hover size="sm" className="shadow-sm" style={{ fontSize: '0.9rem', border: '2px solid #dee2e6', borderRadius: '8px', overflow: 'hidden', margin: '0 auto', backgroundColor: '#fff', tableLayout: 'fixed', width: '90%' }}>
                                            <thead>
                                                {/* Row 1: Process Names with Last Activity */}
                                                <tr>
                                                    {pendingData.map((proc, idx) => (
                                                        <th key={proc.processId} colSpan={2} className="text-center" style={{ background: '#e0f2f1', fontWeight: 700, fontSize: '1.1em', borderBottom: 'none' }}>
                                                            <div>{getProcessName(proc.processId)}</div>
                                                            <span style={{ fontSize: '0.9em', color: '#1976d2', fontWeight: 500 }}>
                                                              Last Activity: {proc.lastLoggedAt ? getTimeAgo(proc.lastLoggedAt) : 'N/A'}
                                                            </span>
                                                        </th>
                                                    ))}
                                                </tr>
                                                {/* Row 2: Summary */}
                                                <tr>
                                                    {pendingData.map((proc, idx) => (
                                                        <th key={proc.processId + '-summary'} colSpan={2} className="text-center" style={{ background: '#388e3c', color: 'white', fontWeight: 700, borderTop: 'none', borderBottom: 'none' }}>
                                                            {proc.totalCatchCount}/{proc.totalQuantity}
                                                        </th>
                                                    ))}
                                                </tr>
                                                {/* Row 3: Catch/Quantity subheaders */}
                                                <tr>
                                                    {pendingData.map((proc, idx) => [
                                                        <th
                                                            key={proc.processId + '-catch'}
                                                            className="text-center"
                                                            style={{ color: 'red', fontWeight: 700, background: '#f5f5f5', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                if (pendingSortColumn === 'catchNo') {
                                                                    setPendingSortDirection(pendingSortDirection === 'asc' ? 'desc' : 'asc');
                                                                } else {
                                                                    setPendingSortColumn('catchNo');
                                                                    setPendingSortDirection('asc');
                                                                }
                                                            }}
                                                        >
                                                            Catch {pendingSortColumn === 'catchNo' ? (pendingSortDirection === 'asc' ? '▲' : '▼') : ''}
                                                        </th>,
                                                        <th
                                                            key={proc.processId + '-qty'}
                                                            className="text-center"
                                                            style={{ color: 'red', fontWeight: 700, background: '#f5f5f5', cursor: 'pointer' }}
                                                            onClick={() => {
                                                                if (pendingSortColumn === 'quantity') {
                                                                    setPendingSortDirection(pendingSortDirection === 'asc' ? 'desc' : 'asc');
                                                                } else {
                                                                    setPendingSortColumn('quantity');
                                                                    setPendingSortDirection('asc');
                                                                }
                                                            }}
                                                        >
                                                            Quantity {pendingSortColumn === 'quantity' ? (pendingSortDirection === 'asc' ? '▲' : '▼') : ''}
                                                        </th>
                                                    ])}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Find max number of catches for any process */}
                                                {(() => {
                                                    // Get selected project object
                                                    const selectedProjectObj = projects.find(p => p.projectId === parseInt(selectedProject));
                                                    const isBooklet = selectedProjectObj && selectedProjectObj.noOfSeries > 1;

                                                    // Sort catch details by quantity in descending order for each process
                                                    const sortedPendingData = pendingData.map(proc => ({
                                                        ...proc,
                                                        catchDetails: proc.catchDetails ? 
                                                            [...proc.catchDetails].sort((a, b) => {
                                                                if (pendingSortColumn === 'catchNo') {
                                                                    if (pendingSortDirection === 'asc') return (a.catchNo || '').localeCompare(b.catchNo || '');
                                                                    else return (b.catchNo || '').localeCompare(a.catchNo || '');
                                                                } else {
                                                                    if (pendingSortDirection === 'asc') return (a.quantity || 0) - (b.quantity || 0);
                                                                    else return (b.quantity || 0) - (a.quantity || 0);
                                                                }
                                                            })
                                                            : []
                                                    }));

                                                    if (isBooklet) {
                                                        // For booklet, group by catchNo and sum quantities
                                                        const groupedData = sortedPendingData.map(proc => {
                                                            const catchMap = {};
                                                            proc.catchDetails.forEach(cd => {
                                                                if (!cd.catchNo) return;
                                                                if (!catchMap[cd.catchNo]) catchMap[cd.catchNo] = 0;
                                                                catchMap[cd.catchNo] += cd.quantity || 0;
                                                            });
                                                            // Convert to array of {catchNo, quantity}
                                                            const grouped = Object.entries(catchMap).map(([catchNo, quantity]) => ({ catchNo, quantity }));
                                                            // Sort by selected column and direction
                                                            grouped.sort((a, b) => {
                                                                if (pendingSortColumn === 'catchNo') {
                                                                    if (pendingSortDirection === 'asc') return (a.catchNo || '').localeCompare(b.catchNo || '');
                                                                    else return (b.catchNo || '').localeCompare(a.catchNo || '');
                                                                } else {
                                                                    if (pendingSortDirection === 'asc') return (a.quantity || 0) - (b.quantity || 0);
                                                                    else return (b.quantity || 0) - (a.quantity || 0);
                                                                }
                                                            });
                                                            return grouped;
                                                        });
                                                        const maxRows = Math.max(...groupedData.map(arr => arr.length));
                                                        return Array.from({ length: maxRows }).map((_, rowIdx) => (
                                                            <tr key={rowIdx}>
                                                                {groupedData.map((grouped, pidx) => {
                                                                    const item = grouped[rowIdx];
                                                                    return [
                                                                        <td key={pidx + '-catch-' + rowIdx} className="text-center" style={{ fontWeight: 500 }}>
                                                                            {item ? item.catchNo : ''}
                                                                        </td>,
                                                                        <td key={pidx + '-qty-' + rowIdx} className="text-center" style={{ fontWeight: 500 }}>
                                                                            {item ? item.quantity : ''}
                                                                        </td>
                                                                    ];
                                                                })}
                                                            </tr>
                                                        ));
                                                    } else {
                                                        // For paper, show all catch details as before (already sorted above)
                                                        const maxRows = Math.max(...sortedPendingData.map(proc => (proc.catchDetails ? proc.catchDetails.length : 0)));
                                                        return Array.from({ length: maxRows }).map((_, rowIdx) => (
                                                            <tr key={rowIdx}>
                                                                {sortedPendingData.map((proc, pidx) => {
                                                                    const catchItem = proc.catchDetails && proc.catchDetails[rowIdx];
                                                                    return [
                                                                        <td key={proc.processId + '-catch-' + rowIdx} className="text-center" style={{ fontWeight: 500 }}>
                                                                            {catchItem ? catchItem.catchNo : ''}
                                                                        </td>,
                                                                        <td key={proc.processId + '-qty-' + rowIdx} className="text-center" style={{ fontWeight: 500 }}>
                                                                            {catchItem ? `${catchItem.quantity}` : ''}
                                                                        </td>
                                                                    ];
                                                                })}
                                                            </tr>
                                                        ));
                                                    }
                                                })()}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center p-4">
                                    <FaClipboardList size={48} className="text-muted mb-3" />
                                    <h5>No Pending Data</h5>
                                    <p className="text-muted">No pending data found for the selected criteria.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Catch Details for Selected Process */}
                    {/* This is now integrated into the main table above */}
                </div>
            ) : (
                <div >

                </div>
            )}
        </div>

    );
};

export default DailyReport;