import React, { useEffect, useState } from "react";
import { Form, Upload, Button, Select, message, Menu, Spin } from "antd";
import { Row, Col, Modal } from "react-bootstrap";
import {
  UploadOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import themeStore from "./../store/themeStore";
import { useStore } from "zustand";
import ViewQuantitySheet from "./../pages/ViewQuantitySheet"
import { useParams } from "react-router-dom";
import { IoMdEye } from "react-icons/io";
import API from "../CustomHooks/MasterApiHooks/api";
import { useTranslation } from "react-i18next";
import { decrypt } from "./../Security/Security";
import { BsCheckCircleFill } from "react-icons/bs";
import {
  success,
  error,
  warning,
} from "./../CustomHooks/Services/AlertMessageService";
import UpdateQuantitySheet from "./UpdateQuantitySheet";

// Helper function to convert Excel date number to JS Date
const convertExcelDate = (excelDate) => {
  if (!excelDate) return null;
  // Check if excelDate is a number (Excel serial date)
  if (!isNaN(excelDate)) {
    // Excel dates are number of days since 1/1/1900
    return new Date((excelDate - 25569) * 86400 * 1000);
  }
  // If it's already a date string, parse it
  return new Date(excelDate);
};

const QtySheetUpload = () => {
  const { t } = useTranslation();
  const { encryptedProjectId } = useParams();
  const projectId = decrypt(encryptedProjectId);
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [
    customDark,
    customMid,
    customLight,
    customBtn,
    customDarkText,
    customLightText,
    customLightBorder,
    customDarkBorder,
  ] = cssClasses;
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [form] = Form.useForm();
  const [headers, setHeaders] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [showMappingFields, setShowMappingFields] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showBtn, setShowBtn] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [lots, setLots] = useState([]);
  const [selectedLotNo, setSelectedLotNo] = useState(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [dispatchedLots, setDispatchedLots] = useState([]);
  const [isLotsFetched, setIsLotsFetched] = useState(false);
  const [existingLots, setExistingLots] = useState([]); // To hold the existing lots in the system
  const [mappedLots, setMappedLots] = useState([]); // To hold the mapped lots from the file
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility
  const [skipLots, setSkipLots] = useState([]); // Lots to be skipped based on matching
  const [mappedData, setMappeddata] = useState([]);
  const [transactionExist, setTransactionExist] = useState(false);
  const [unreleasedLots, setUnReleasedLots] = useState([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showConfigDisclaimer, setShowConfigDisclaimer] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [hasUploadedFile, setHasUploadedFile] = useState(false);
  const [rightClickLotNo, setRightClickLotNo] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Track mouse position for context menu
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    // Show config disclaimer only when no lots are found
    if (!isLotsFetched && !showDisclaimer) {
      setShowConfigDisclaimer(true);
    } else {
      setShowConfigDisclaimer(false);
    }
  }, [isLotsFetched, showDisclaimer]);

  useEffect(() => {
    const checkTransactionExistence = async () => {
      if (selectedLotNo) {
        // Check if selectedLotNo is not null
        try {
          // const response = await API.get(`/Transactions/exists/${projectId}`);
          const response = await API.get(
            `/Dispatch/project/${projectId}/lot/${selectedLotNo}`
          );
          const hasDispatched = response.data?.status;
          // Only show delete button if there are no transactions AND a file has been uploaded
          setShowDeleteButton(
            !hasDispatched && (hasUploadedFile || isLotsFetched)
          );
        } catch (error) {
          console.error("Failed to check transaction existence:", error);
          setShowDeleteButton(true);
        }
      } else {
        setShowDeleteButton(false); // Reset delete button visibility if selectedLotNo is null
      }
    };

    checkTransactionExistence();
  }, [hasUploadedFile, isLotsFetched, selectedLotNo]); // Run when hasUploadedFile changes

  useEffect(() => {
    const fetchProjectName = async () => {
      try {
        const response = await API.get(`/Project/${projectId}`);
        setProjectName(response.data.name);
      } catch (error) {
        console.error(t("failedToFetchProjectName"), error);
      }
    };

    fetchProjectName();
  }, [projectId]);

  useEffect(() => {
    const fetchDispatchedLots = async () => {
      try {
        if (projectId && selectedLotNo) {
          const response = await API.get(
            `/Dispatch/project/${projectId}/lot/${selectedLotNo}`
          );
          const dispatchedLotStatus = response.data.map(
            (dispatch) => dispatch.lotNo
          );
          setDispatchedLots(dispatchedLotStatus);
        }
      } catch (error) {
        console.error("Failed to fetch dispatched lots status:", error);
      }
    };

    fetchDispatchedLots();
  }, [projectId, selectedLotNo]);

  useEffect(() => {
    const fetchUnReleasedLots = async () => {
      try {
        const response = await API.get(
          `/QuantitySheet/UnReleasedLots?ProjectId=${projectId}`
        );
        setUnReleasedLots(response.data);
      } catch (error) {
        console.error("Failed to fetch dispatched lots status:", error);
      }
    };

    fetchUnReleasedLots();
  }, [projectId]);

  const handleRightClick = (e, lotNo) => {
    // Only allow right click if the lot is in unreleasedLots
    if (unreleasedLots.includes(lotNo)) {
      e.preventDefault(); // Prevent default context menu
      setSelectedLotNo(lotNo);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setIsDropdownVisible(true);
    }
  };

  // Handle clicking outside context menu
  useEffect(() => {
    const handleClickOutside = () => {
      setIsDropdownVisible(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const releaseForProduction = async () => {
    try {
      const lotNo = selectedLotNo;

      // Using axios to make the POST request
      const response = await API.post("/QuantitySheet/ReleaseForProduction", {
        lotNo: lotNo,
        projectId: projectId,
      });

      // Check if the response was successful
      if (response.status === 200) {
        success(`${t("lot")} ${lotNo} ${t("releasedForProduction")}`);
      } else {
        error(t("failedToReleaseLot"));
      }
    } catch (error) {
      console.error("Error releasing lot:", error);
      error(t("errorReleasinglot"));
    }
  };

  const handleUpload = async (data) => {
    setIsLoading(true);
    setShowDisclaimer(false);
    let mappedData;

    try {
      if (data) {
        mappedData = data;
      } else {
        mappedData = await createMappedData();
      }

      if (
        !mappedData ||
        !Array.isArray(mappedData) ||
        mappedData.length === 0
      ) {
        error(t("mappedDataInvalidOrEmpty"));
        setUploading(false);
        resetState();
        return;
      }

      const finalPayload = mappedData.map((item) => {
        // Convert Excel date to proper date format
        const examDate = item.ExamDate ? convertExcelDate(item.ExamDate) : null;
        const lotNo = String(item.LotNo || "").trim();
        const catchNo = String(item.CatchNo || "").trim();
        const innerEnvelope = String(item.InnerEnvelope || "").trim();

        return {
          catchNo: item.CatchNo || "",
          paper: item.Paper || "",
          course: item.Course || "",
          subject: item.Subject || "",
          innerEnvelope: item.InnerEnvelope || "",
          outerEnvelope: item.OuterEnvelope || 0,
          examDate: examDate ? examDate.toISOString() : "",
          examTime: item.ExamTime || "",
          lotNo: item.LotNo || "",
          quantity: Number(item.Quantity) || 0,
          percentageCatch: Number(item.percentageCatch) || 0,
          projectId: projectId,
          processId: [0],
          status: 0,
          pages: item.Pages || 0,
          stopCatch: 0,
        };
      });

      const response = await API.post("/QuantitySheet", finalPayload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setDataSource(finalPayload);
      success(
        isUpdateMode
          ? t("quantitySheetUpdatedSuccessfully")
          : t("quantitySheetUploadedSuccessfully")
      );
      fetchLots();
      setHasUploadedFile(true);
      resetState();
    } catch (err) {
      error(t("failedToUploadQuantitySheet"));
      console.error(t("uploadFailed"), err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createMappedData = async () => {
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert the sheet to JSON with the first row as headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Ensure that jsonData[0] is an array (header row)
        if (!Array.isArray(jsonData[0])) {
          console.error(
            "The first row (headers) is not an array.",
            jsonData[0]
          );
          resolve([]); // Resolve with an empty array if the headers are malformed
          return;
        }
        const rows = jsonData.slice(1); // Skip the header row
        const mappedData = rows.map((row) => {
          const rowData = {};

          // Iterate over each field in fieldMappings
          for (let property in fieldMappings) {
            let headers = fieldMappings[property]; // Array of headers for this field

            // Ensure headers is an array
            if (!Array.isArray(headers)) {
              headers = [headers]; // Convert to array if it's a single value
            }

            // If there are multiple headers for the property, create a string value
            if (headers.length > 1) {
              const valueString = headers
                .map((header) => {
                  const index = jsonData[0].indexOf(header); // Find the index of the header
                  if (index !== -1) {
                    const value = row[index] || ""; // Get the value for that header
                    return `${header}: ${value}`; // Format as "header: value"
                  }
                  return null;
                })
                .filter(Boolean) // Remove any null values
                .join(", "); // Join all header-value pairs with commas

              // Store the formatted string (e.g., "E10: 2, E20: 4")
              rowData[property] = valueString;
            } else {
              // For single header match, do not include this in rowData
              const header = headers[0]; // Only one header for this property
              const index = jsonData[0].indexOf(header);
              if (index !== -1) {
                let value = row[index] || ""; // Get the value for that header

                // Explicitly convert 'LotNo' and 'CatchNo' to strings
                if (
                  property === "LotNo" ||
                  property === "CatchNo" ||
                  property === "InnerEnvelope"
                ) {
                  value = String(value).trim(); // Ensure 'LotNo' and 'CatchNo' are treated as strings
                  console.log(
                    `${property} value before sending:`,
                    value,
                    `Type:`,
                    typeof value
                  );
                }

                // Add the value directly to the rowData
                rowData[property] = value || ""; // Default to empty string if no value found
              }
            }
          }

          // Add additional fields like projectId or percentageCatch
          rowData["projectId"] = projectId;
          rowData["percentageCatch"] = "0";

          return rowData; // Return the mapped row data
        });

        setMappeddata(mappedData); // Set the processed data
        resolve(mappedData); // Resolve with the mapped data
      };

      // Read the file as an ArrayBuffer
      reader.readAsArrayBuffer(selectedFile);
    });
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    setIsUpdateMode(true);
    try {
      // Fetch the mapped data from the file
      const mappedData = await createMappedData(); // This will contain the processed Excel data

      // Extract LotNo values from the mapped data and existing data
      const mappedLotNos = [...new Set(mappedData.map((item) => item.LotNo))];

      // Find matching lots between mapped data and existing lots
      const matchingLots = mappedLotNos.filter((lotNo) => lots.includes(lotNo));

      // Get unique lots to skip by using Set to deduplicate lot numbers
      const uniqueLotsToSkip = Array.from(
        new Set(
          mappedData
            .filter((item) => matchingLots.includes(item.LotNo))
            .map((item) => item.LotNo)
        )
      ).map((lotNo) => ({ LotNo: lotNo }));

      if (uniqueLotsToSkip.length > 0) {
        // If there are matching lots, show the modal with unique lots
        setSkipLots(uniqueLotsToSkip);
        setIsModalVisible(true);
      } else {
        // No matching lots, proceed directly with the upload
        handleUpload(mappedData);
      }
    } catch (error) {
      console.error("Failed to process data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipUpdate = () => {
    try {
      const skipLotNos = skipLots.map((item) => item.LotNo);
      const remainingMappedData = mappedData.filter(
        (item) => !skipLotNos.includes(item.LotNo)
      );

      if (remainingMappedData.length === 0) {
        warning(t("allLotsSkipped"));
        setIsModalVisible(false);
        return;
      }

      success(
        `${skipLotNos.length} ${t("lotsSkipped")}: ${skipLotNos.join(", ")}`
      );
      handleUpload(remainingMappedData);
      setIsModalVisible(false);
    } catch (err) {
      error(t("errorProcessingSkipUpdate"));
    }
  };

  const handleCancelSkip = () => {
    // Cancel the skip action
    setIsModalVisible(false);
  };

  const getColumns = async () => {
    try {
      const response = await API.get("/QuantitySheet/Columns");
      setColumns(response.data);
    } catch (error) {
      console.error(t("failedToFetchColumns"), error);
    }
  };

  useEffect(() => {
    getColumns();
    fetchLots();
  }, []);

  const handleFileUpload = (file) => {
    setFileList([file]);
    setSelectedFile(file);

    setIsProcessingFile(true); // Show loader when file processing starts

    setShowTable(false); // Hide table when file is selected
    setShowBtn(false); // Hide button when file is selected

    processFile(file);
    return false;
  };

  const processFile = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const filteredData = jsonData.filter((row) =>
          row.some((cell) => cell !== null && cell !== "")
        );

        if (filteredData.length === 0) {
          error(t("noValidDataFoundInFile"));
          setIsProcessingFile(false);
          return;
        }

        // Extract the headers (first row of the data)
        const excelHeaders = filteredData[0];
        setHeaders(excelHeaders);

        setShowMappingFields(true);
        setShowDisclaimer(true);

        // Dynamically build the field mappings based on multiple headers per field
        const autoMappings = {};
        // Adjust this to support multiple headers per field
        columns.forEach((col) => {
          // Create an array to hold all matching headers for the current field
          const matchingHeaders = excelHeaders.filter(
            (header) => header?.toLowerCase() === col?.toLowerCase()
          );
          // Assign the matching headers (or empty array if no match found)
          autoMappings[col] = matchingHeaders.length > 0 ? matchingHeaders : [];
        });

        setFieldMappings(autoMappings);
        success(t("fileProcessedSuccessfully"));
      } catch (err) {
        error(t("errorProcessingFile"));
        console.error("File processing error:", err);
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleMappingChange = (property, value) => {
    setFieldMappings((prev) => {
      const newMappings = { ...prev };
      newMappings[property] = value || []; // Ensure value is an array
      return newMappings;
    });
  };

  const getAvailableOptions = (property) => {
    const selectedValues = Object.values(fieldMappings).flat();
    return headers
      .filter((header) => !selectedValues.includes(header))
      .map((header) => ({ label: header, value: header }));
  };

  const resetState = () => {
    setFieldMappings({});
    setHeaders([]);
    setShowMappingFields(false);
    setSelectedFile(null);
    setFileList([]);
    setShowTable(false);
    setShowDisclaimer(false);
    setIsUpdateMode(false);
  };

  const fetchLots = async () => {
    try {
      const response = await API.get(
        `/QuantitySheet/Lots?ProjectId=${projectId}`
      );
      const lotsData = response.data;
      setLots(lotsData);
      setExistingLots(lotsData);
      setIsLotsFetched(lotsData.length > 0);
    } catch (err) {
      error(t("failedToFetchLots"));
      console.error(t("failedToFetchLots"), err);
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "path_to_your_template_file.xlsx"; // local QS file
    link.download = "QtySheet-Input.xlsx";
    link.click();
  };

  const handleLotClick = (lotNo) => {
    if (selectedLotNo === lotNo) {
      setShowTable(!showTable); // Toggle table visibility
      setShowBtn(!showBtn);
    } else {
      setSelectedLotNo(lotNo);
      setShowTable(true); // Show table for the selected lot
      setShowBtn(true);
    }
  };

  const menu = (
    <Menu
      style={{
        position: "fixed",
        top: contextMenuPosition.y,
        left: contextMenuPosition.x,
        zIndex: 1000,
        outline: "2px solid white",
      }}
      className={`${customLight} rounded-3 border-3 ${customDarkBorder} ${customDarkText} `}
    >
      <Menu.Item
        key="1"
        onClick={releaseForProduction}
        className={`w-100 rounded-3 `}
      >
        {t("releaseForProduction")}
      </Menu.Item>
    </Menu>
  );

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      await API.delete(`/QuantitySheet/DeleteByProjectId/${projectId}`);
      fetchLots();
      setHasUploadedFile(false);
      setShowDeleteButton(true);
      success(t("quantitySheetDeletedSuccessfully"));
    } catch (error) {
      console.error("Failed to delete quantity sheet:", error);
      error(t("failedToDeleteQuantitySheet"));
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const resetEditingMode = () => {
    setIsUpdateMode(false);
    resetState();
    setShowDeleteButton(true);
    setShowTable(false);
    setShowBtn(false);
    setSelectedLotNo(null);
    setIsLotsFetched(true); // Keep the initial state
    // Re-fetch lots to refresh the view
    fetchLots();
  };

  return (
    <div
      className={`container-fluid ${customDarkText} rounded shadow-lg ${customLight} ${customLightBorder}`}
    >
      {/* Top Headers */}
      <Row className="mt-2 mb-1">
        <Col lg={12}>
          <div className="text-center p-2 d-flex justify-content-around align-items-center">
            <h4 className={`${customDarkText} fw-bold m-0`}>
              {t("Quantity Sheet")}
            </h4>
            <h5 className={`${customDarkText} custom-zoom-btn m-0`}>
              {projectName}
            </h5>
          </div>
          <hr className="mt-2 mb-1" />
        </Col>
      </Row>

      {/* Warning Message */}
      {showConfigDisclaimer && (
        <Row className="mb-3">
          <Col lg={8} className="mx-auto">
            <div className="alert alert-warning text-center p-1">
              {t(
                "Warning: Once you upload the quantity sheet, project configuration cannot be changed."
              )}
            </div>
          </Col>
        </Row>
      )}

      {/* File Upload Section */}
      <Row className="mb-2">
        <Col lg={12}>
          <Form layout="vertical" form={form}>
            {/* File Upload */}
            {!isUpdateMode ? (
              <>
                <Form.Item
                  name="file"
                  rules={[{ required: true, message: t("pleaseSelectAFile") }]}
                >
                  <div className="d-flex align-items-center">
                    {!isLotsFetched ? (
                      <Upload
                        onRemove={(file) => {
                          const index = fileList.indexOf(file);
                          const newFileList = fileList.slice();
                          newFileList.splice(index, 1);
                          setFileList(newFileList);
                        }}
                        beforeUpload={handleFileUpload}
                        fileList={fileList}
                        className="flex-grow-1"
                      >
                        <Button className="fs-4 custom-zoom-btn w-100 d-flex align-items-center p-2">
                          <UploadOutlined />
                          <span className="d-none d-sm-inline">
                            {t("selectFile")}
                          </span>
                          <span className="d-inline d-sm-none">
                            {t("upload")}
                          </span>
                        </Button>
                      </Upload>
                    ) : (
                      <Button
                        className={customBtn}
                        type="primary"
                        onClick={() => {
                          setIsLotsFetched(false);
                          setIsUpdateMode(true);
                          setShowTable(false);
                          setShowBtn(false);
                        }}
                      >
                        {t("updateFile")}
                      </Button>
                    )}

                    {showDeleteButton && (
                      <Button
                        type="primary"
                        danger
                        onClick={handleDelete}
                        className="ms-2"
                        disabled={transactionExist}
                      >
                        <DeleteOutlined />
                        <span>{t("deleteFile")}</span>
                      </Button>
                    )}
                  </div>
                </Form.Item>

                {/* Upload/Update Button */}
                {fileList.length > 0 && showDisclaimer && (
                  <Form.Item>
                    <Button
                      className={customBtn}
                      type="primary"
                      onClick={handleUpdate}
                      loading={isLoading}
                    >
                      {isUpdateMode
                        ? t("updateLots")
                        : isLotsFetched
                        ? t("updateLots")
                        : t("uploadLots")}
                    </Button>
                  </Form.Item>
                )}

                {/* Lot Buttons */}
                <Form.Item>
                  <div className="d-flex flex-wrap gap-2">
                    {lots.map((lotNo, index) => {
                      const isDispatched = dispatchedLots.includes(lotNo);
                      return (
                        <Button
                          key={index}
                          className={`${
                            selectedLotNo === lotNo
                              ? "bg-white text-dark border-dark"
                              : customBtn
                          } d-flex align-items-center justify-content-center p-2`}
                          type="primary"
                          onClick={() => handleLotClick(lotNo)}
                          onContextMenu={(e) => handleRightClick(e, lotNo)}
                        >
                          {t("lot")} - {lotNo}{" "}
                          {isDispatched ? (
                            <BsCheckCircleFill className="ms-1 text-success" />
                          ) : (
                            <IoMdEye className="ms-1" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </Form.Item>
              </>
            ) : (
              <div className="d-flex justify-content-end mb-2">
                <Button
                  className={`${customBtn} d-flex align-items-center gap-2`}
                  type="primary"
                  onClick={resetEditingMode}
                >
                  <CloseOutlined />
                </Button>
              </div>
            )}

            {isUpdateMode && (
              <UpdateQuantitySheet
                projectId={projectId}
                onClose={() => {
                  setIsUpdateMode(false);
                  setIsLotsFetched(true);
                  resetState();
                  setShowDeleteButton(true);
                  setShowTable(false);
                  setShowBtn(false);
                  setSelectedLotNo(null);
                  fetchLots();
                }}
              />
            )}

            {/* Quantity Sheet View */}
            <ViewQuantitySheet
              project={projectId}
              selectedLotNo={selectedLotNo}
              showBtn={showBtn}
              showTable={showTable}
              lots={lots}
            />
          </Form>
        </Col>
      </Row>

      {isDropdownVisible && menu}
      <Modal show={isModalVisible} onHide={handleCancelSkip}>
        <Modal.Header closeButton>
          <Modal.Title>{t("confirmUpdate")} </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <p>{t("existingLotsMessage")} </p>
            <ul>
              {skipLots.map((lot, index) => (
                <li key={index}>
                  {" "}
                  {t("lotNo")}: {lot.LotNo} {t("existsMessage")}{" "}
                </li>
              ))}
            </ul>
            <p> {t("skipTheseLotsMessage")} </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelSkip}>
            {t("no")}
          </Button>
          <Button variant="primary" onClick={handleSkipUpdate}>
            {t("yes")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
      >
        <Modal.Header className={`${customDark} ${customLightText}`}>
          <Modal.Title>
            {t("confirmDelete")} {`->`} {projectName}{" "}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={`${customLight}`}>
          {t("areYouSureDeleteQuantitySheet")}
        </Modal.Body>
        <Modal.Footer className={`${customDark}`}>
          <Button
            variant="secondary"
            className={`${customBtn}`}
            onClick={() => setShowDeleteConfirm(false)}
          >
            {t("cancel")}
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            {t("delete")}
          </Button>
        </Modal.Footer>
      </Modal>

      {isProcessingFile && (
        <div className="text-center my-3">
          <Spin size="large" tip="Processing file..." />
        </div>
      )}

      {showDisclaimer && (
        <div className="text-danger mb-3 fw-bold text-center">
          {t("mapTheExcelHeaderWithTheirRespectedDefinedFields")}
        </div>
      )}

      {showMappingFields && headers.length > 0 && (
        <Row className="mt-2 mb-2">
          <Col lg={12}>
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th style={{ width: "50%" }}> {t("fields")} </th>
                  <th style={{ width: "50%" }}> {t("excelHeader")} </th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(fieldMappings).map((property) => (
                  <tr key={property}>
                    <td>{property} </td>
                    <td>
                      <Select
                        mode={
                          property === "InnerEnvelope" ? "multiple" : "default"
                        }
                        allowClear
                        value={fieldMappings[property]}
                        onChange={(value) =>
                          handleMappingChange(property, value)
                        }
                        options={getAvailableOptions(property)}
                        style={{ width: "100%" }}
                        dropdownMatchSelectWidth={false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Col>
        </Row>
      )}
      {isLoading && <Spin size="large" tip="Loading..." />}
    </div>
  );
};

export default QtySheetUpload;
