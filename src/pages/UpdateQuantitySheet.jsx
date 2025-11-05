import React, { useState, useEffect } from "react";
import { Form, Table, Button, Row } from "react-bootstrap";
import { Select, Pagination, Popover } from "antd";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import API from "../CustomHooks/MasterApiHooks/api";
import { BsPencilSquare, BsInfoCircle } from "react-icons/bs";
import { error, success } from "./../CustomHooks/Services/AlertMessageService";

const UpdateQuantitySheet = ({ projectId, onClose }) => {
  const { t } = useTranslation();
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [mappedFields, setMappedFields] = useState({});
  const [excelData, setExcelData] = useState([]);
  const [updateMode, setUpdateMode] = useState("project");
  const [selectedLot, setSelectedLot] = useState(null);
  const [availableLots, setAvailableLots] = useState([]);
  const [filterOutLots, setFilterOutLots] = useState([]);
  const [apiData, setApiData] = useState([]);
  const [selectedFieldsToUpdate, setSelectedFieldsToUpdate] = useState({});
  const [selectedCatchToupdate, setSelectedCatchToupdate] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageSize = 10;

  // Add constant for locked fields
  const LOCKED_FIELDS = ["CatchNo", "LotNo", "Pages"];

  const fields = [
    { name: "CatchNo", type: "string" },
    { name: "LotNo", type: "string" },
    { name: "Paper", type: "string" },
    { name: "Course", type: "string" },
    { name: "Subject", type: "string" },
    { name: "ExamDate", type: "string" },
    { name: "ExamTime", type: "string" },
    {
      name: "InnerEnvelope",
      type: "string",
      multiSelect: true,
      envelopeTypes: ["E10", "E20", "E30", "E40", "E50", "E60", "E80", "E100"],
      colspan: true,
    },
    {
      name: "OuterEnvelope",
      type: "string",
      multiSelect: false,
    },
    { name: "Quantity", type: "string" },
    { name: "Pages", type: "string" },
  ];

  const formatDateForDB = (dateString) => {
    if (!dateString) return "";

    const [day, month, year] = dateString.split("/");
    if (!day || !month || !year) return "";

    // Create date object in IST timezone
    const date = new Date(year, month - 1, day, 5, 30); // Add 5:30 for IST offset
    return date.toISOString(); 
  };

  useEffect(() => {
    const fetchAvailableLots = async () => {
      try {
        const response = await API.get(
          `/QuantitySheet/Lots?ProjectId=${projectId}`
        );
        const lots = response.data; // ["1", "2", ..., "12"]

        let dispatchedLots = [];
        let availableLots = [];

        await Promise.all(
          lots.map(async (lot) => {
            try {
              const dispatchResponse = await API.get(
                `/Dispatch/project/${projectId}/lot/${lot}`
              );
              const dispatchData = dispatchResponse.data; // Expecting an array

              // If any entry has status: true, consider it dispatched
              const isDispatched = dispatchData.some(
                (entry) => entry.status === true
              );

              if (isDispatched) {
                dispatchedLots.push(lot); // Store dispatched lots separately
              } else {
                availableLots.push(lot); // Store non-dispatched lots
              }
            } catch (err) {
              console.error(`err checking lot ${lot}:`, err);
              availableLots.push(lot); // If err, keep it available
            }
          })
        );

        setFilterOutLots(dispatchedLots); // Set dispatched lots
        setAvailableLots(availableLots); // Set available lots

        // Fetch API data after setting available lots
        try {
          const response = await API.get(
            `/QuantitySheet/CatchByproject?ProjectId=${projectId}`
          );
          let data = response.data;

          // Filter only data with LotNo present in availableLots
          data = data.filter((item) =>
            availableLots.includes(item.lotNo?.toString())
          );

          // Group data by catchNo and combine quantities
          const groupedData = data.reduce((acc, curr) => {
            const existingEntry = acc.find(
              (item) => item.catchNo === curr.catchNo
            );
            if (existingEntry) {
              existingEntry.quantity += curr.quantity;
            } else {
              acc.push({ ...curr });
            }
            return acc;
          }, []);

          setApiData(groupedData);
        } catch (err) {
          console.error("Failed to fetch API data:", err);
        }
      } catch (err) {
        console.error("Failed to fetch lots:", err);
      }
    };

    if (projectId) {
      fetchAvailableLots();
    }
  }, [projectId]);

  const handleModeSelect = (mode) => {
    setUpdateMode(mode);
    setCurrentPage(1); // Reset to first page when mode changes
  };

  const handleLotSelect = (lot) => {
    setSelectedLot(lot);
    setCurrentPage(1); // Reset to first page when lot changes
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const buffer = evt.target.result;
      const array = new Uint8Array(buffer);
      const binaryString = array.reduce(
        (str, byte) => str + String.fromCharCode(byte),
        ""
      );
      const wb = XLSX.read(binaryString, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Extract headers and data
      const headers = data[0];
      const rows = data.slice(1);

      setExcelHeaders(headers);
      setExcelData(rows);

      // Auto map fields that have matching names in Excel headers
      const autoMappedFields = {};
      fields.forEach((field) => {
        const matchingHeader = headers.find(
          (header) =>
            header.toLowerCase().replace(/\s+/g, "") ===
            field.name.toLowerCase()
        );
        if (matchingHeader) {
          autoMappedFields[field.name] = matchingHeader;
        }
      });

      setMappedFields(autoMappedFields);
      setCurrentPage(1);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleHeaderMapping = (fieldName, excelHeader) => {
    setMappedFields({
      ...mappedFields,
      [fieldName]: excelHeader,
    });
  };

  const getColumnData = (excelHeader) => {
    if (!excelHeader) return [];

    if (Array.isArray(excelHeader)) {
      // For multi-select fields, combine data from multiple columns
      return excelData.map((row) => {
        if (excelHeader === mappedFields["InnerEnvelope"]) {
          // Special handling for InnerEnvelope
          const envelopeData = [];
          fields
            .find((f) => f.name === "InnerEnvelope")
            .envelopeTypes.forEach((envelopeType) => {
              const header = excelHeader.find((h) => h.includes(envelopeType));
              if (header) {
                const headerIndex = excelHeaders.indexOf(header);
                const value = row[headerIndex];
                if (value) {
                  envelopeData.push(`${envelopeType}: ${value}`);
                }
              }
            });
          return envelopeData.join(", "); // Return as single string
        }

        return excelHeader
          .map((header) => {
            const headerIndex = excelHeaders.indexOf(header);
            return row[headerIndex];
          })
          .filter(Boolean)
          .join(", ");
      });
    }

    // For single select fields
    const headerIndex = excelHeaders.indexOf(excelHeader);
    return excelData.map((row) => row[headerIndex]);
  };

  // Update the handleFieldUpdateSelection to prevent changes to locked fields
  const handleFieldUpdateSelection = (fieldName) => {
    if (LOCKED_FIELDS.includes(fieldName)) {
      return; // Don't allow changes to locked fields
    }
    setSelectedFieldsToUpdate((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const convertExcelDate = (excelDate) => {
    if (!excelDate) return null;
    let date;
    // Check if excelDate is a number (Excel serial date)
    if (!isNaN(excelDate)) {
      // Excel dates are number of days since 1/1/1900
      // Add 5:30 hours to account for IST
      date = new Date((excelDate - 25569) * 86400 * 1000 + (5.5 * 60 * 60 * 1000));
    } else {
      // If it's already a date string, parse it and add IST offset
      date = new Date(excelDate);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 30);
    }

    // Format as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const filteredData = getFilteredData();
      const displayedData = filteredData.filter((row) => {
        const lotNoHeader = mappedFields["LotNo"];
        if (!lotNoHeader) return true;
        const lotNoIndex = excelHeaders.indexOf(lotNoHeader);
        if (lotNoIndex === -1) return true;
        const rowLotNo = row[lotNoIndex]?.toString().trim();
        return !filterOutLots.includes(rowLotNo);
      });

      // Validate required fields
      const missingFields = displayedData.some((row) => {
        const catchNoIndex = excelHeaders.indexOf(mappedFields["CatchNo"]);
        const lotNoIndex = excelHeaders.indexOf(mappedFields["LotNo"]);
        const quantityIndex = excelHeaders.indexOf(mappedFields["Quantity"]);

        const catchNo = catchNoIndex !== -1 ? row[catchNoIndex]?.toString().trim() : '';
        const lotNo = lotNoIndex !== -1 ? row[lotNoIndex]?.toString().trim() : '';
        const quantity = quantityIndex !== -1 ? Number(row[quantityIndex]) : 0;

        return !catchNo || !lotNo || !quantity;
      });

      if (missingFields) {
        error("Lot, Catch, and Quantity are required fields for all rows");
        return;
      }

      const formattedData = displayedData.map((row, index) => {
        const catchNoIndex = excelHeaders.indexOf(mappedFields["CatchNo"]);
        const currentCatchNo =
          catchNoIndex !== -1 ? row[catchNoIndex]?.toString().trim() : null;

        // Find all matching records for the current catch number
        const matchingRecords = apiData.filter(
          (apiRow) => apiRow.catchNo?.toString().trim() === currentCatchNo
        );

        // Calculate combined quantity from all matching records
        const totalQuantity = matchingRecords.reduce(
          (sum, record) => sum + (record.quantity || 0),
          0
        );

        const examDate = convertExcelDate(
          getColumnData(mappedFields["ExamDate"])[index]
        );

        const lotNoIndex = excelHeaders.indexOf(mappedFields["LotNo"]);
        const rowLotNo =
          lotNoIndex !== -1 ? row[lotNoIndex]?.toString().trim() : "";

        // Skip if lot is filtered out
        if (filterOutLots.includes(rowLotNo)) {
          return null;
        }
        console.log(matchingRecords);
        const rowData = {
          quantitySheetId: matchingRecords[0]?.quantitySheetId || 0,
          catchNo: currentCatchNo || "",
          paper:
            getColumnData(mappedFields["Paper"])[index]?.toString() || "",
          course:
            getColumnData(mappedFields["Course"])[index]?.toString() || "",
          subject:
            getColumnData(mappedFields["Subject"])[index]?.toString() || "",
          innerEnvelope:
            getColumnData(mappedFields["InnerEnvelope"])[index] || "",
          outerEnvelope:
            Number(getColumnData(mappedFields["OuterEnvelope"])[index]) || 0,
          examDate: formatDateForDB(examDate) || "",
          examTime:
            getColumnData(mappedFields["ExamTime"])[index]?.toString() || "",
          lotNo: updateMode === "lot" ? selectedLot : rowLotNo || "",
          quantity: selectedFieldsToUpdate["Quantity"]
            ? Number(getColumnData(mappedFields["Quantity"])[index]) || 0
            : totalQuantity ||
              Number(getColumnData(mappedFields["Quantity"])[index]) ||
              0,
          pages: Number(getColumnData(mappedFields["Pages"])[index]) || 0,
          percentageCatch: 0,
          projectId: projectId,
          processId: [0],
          status: 0,
          stopCatch: 0,
        };

        // For existing catches, preserve original data for unselected fields
        if (matchingRecords.length > 0) {
          fields.forEach((field) => {
            const key =
              field.name.charAt(0).toLowerCase() + field.name.slice(1);
            if (!selectedFieldsToUpdate[field.name]) {
              if (key === "quantity") {
                rowData[key] = totalQuantity; // Always use combined quantity for existing records
              } else if (["outerEnvelope", "pages"].includes(key)) {
                rowData[key] = Number(matchingRecords[0][key]) || 0;
              } else if (key === "examDate") {
                rowData[key] = matchingRecords[0][key] || "";
              } else {
                rowData[key] = matchingRecords[0][key]?.toString() || "";
              }
            }
          });
        }

        return rowData;
      });

      const response = await API.put("/QuantitySheet", formattedData);
      console.log("Update successful:", response);
      success("Quantity sheet updated successfully");
      onClose();
    } catch (err) {
      error("Failed to update quantity sheet:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if any fields have been mapped
  const hasAnyMappedFields = Object.keys(mappedFields).length > 0;

  // Modified getFilteredData to strictly filter by lot number
  const getFilteredData = () => {
    if (updateMode !== "lot") {
      return excelData;
    }

    return excelData.filter((row, index) => {
      const lotNoHeader = mappedFields["LotNo"];
      if (!lotNoHeader) return false; // Skip if LotNo mapping not set

      const lotNoIndex = excelHeaders.indexOf(lotNoHeader);
      if (lotNoIndex === -1) return false; // Skip if header not found

      const rowLotNo = row[lotNoIndex]?.toString().trim();
      return rowLotNo === selectedLot.toString();
    });
  };

  const isMatchingCatch = (catchNo) => {
    if (!catchNo) return false;
    return apiData.some(
      (apiRow) =>
        apiRow.catchNo?.toString().trim() === catchNo.toString().trim()
    );
  };

  // Add a debug display for API data (optional, remove in production)
  useEffect(() => {
    if (apiData.length > 0) {
      console.log("API Data loaded:", apiData);
    }
  }, [apiData]);

  // Add clearFile handler
  const clearFile = () => {
    // Reset all related states
    setExcelHeaders([]);
    setMappedFields({});
    setExcelData([]);
    setSelectedFieldsToUpdate({});
    setCurrentPage(1);

    // Reset the file input by creating a ref
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Get paginated data
  const getPaginatedData = () => {
    const filteredData = getFilteredData().filter((row) => {
      const lotNoHeader = mappedFields["LotNo"];
      if (!lotNoHeader) return true; // If LotNo is not mapped, keep all data

      const lotNoIndex = excelHeaders.indexOf(lotNoHeader);
      if (lotNoIndex === -1) return true; // If header not found, keep all data

      const rowLotNo = row[lotNoIndex]?.toString().trim();

      // 🔹 Exclude rows where LotNo exists in filterOutLots
      return !filterOutLots.includes(rowLotNo);
    });

    console.log("Filtered Paginated Data:", filteredData);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredData.slice(startIndex, endIndex);
  };

  // Add visual indication for required fields in the header
  const getFieldLabel = (fieldName) => {
    const isRequired = ["LotNo", "CatchNo", "Quantity"].includes(fieldName);
    return (
      <div className="d-flex align-items-center gap-1">
        {fieldName}
        {isRequired && <span className="text-danger">*</span>}
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-lg-row gap-3 p-3 bg-white shadow rounded">
            {/* Radio Buttons Group */}
            <div className="d-flex flex-column flex-sm-row justify-content-start gap-3">
              <div className="d-flex align-items-center">
                <Form.Check
                  type="radio"
                  id="lot-radio"
                  label={t("UpdateLotWise")}
                  name="updateMode"
                  checked={updateMode === "lot"}
                  onChange={() => handleModeSelect("lot")}
                  className="fs-5"
                  style={{
                    transform: "scale(1.05)",
                    cursor: "pointer",
                  }}
                />
              </div>
              <div className="d-flex align-items-center">
                <Form.Check
                  type="radio"
                  id="project-radio"
                  label={t("updateEntireProject")}
                  name="updateMode"
                  checked={updateMode === "project"}
                  onChange={() => handleModeSelect("project")}
                  className="fs-5"
                  style={{
                    transform: "scale(1.05)",
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>

            {/* Lot Select and File Upload Group */}
            <div className="d-flex flex-column flex-sm-row gap-3 flex-grow-1">
              {updateMode === "lot" && (
                <div style={{ width: "250px" }}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder={t("selectLot")}
                    onChange={handleLotSelect}
                    value={selectedLot}
                  >
                    {availableLots.map((lot) => (
                      <Select.Option key={lot} value={lot}>
                        {t("lot")} - {lot}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="flex-grow-1 d-flex gap-2">
                <Form.Control
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  disabled={
                    !updateMode || (updateMode === "lot" && !selectedLot)
                  }
                />
                {excelHeaders.length > 0 && (
                  <Button
                    variant="outline-danger"
                    onClick={clearFile}
                    title="Clear file"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {(updateMode === "project" || (updateMode === "lot" && selectedLot)) && (
        <>
          {excelHeaders.length > 0 && (
            <>
              <div className="row">
                <div className="col-12">
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        {fields.map((field) => {
                          if (field.colspan && mappedFields[field.name]) {
                            const selectedHeaders = Array.isArray(
                              mappedFields[field.name]
                            )
                              ? mappedFields[field.name]
                              : [mappedFields[field.name]];
                            return (
                              <>
                                <th
                                  key={field.name}
                                  colSpan={selectedHeaders.length}
                                  className="text-center"
                                >
                                  <div className="d-flex align-items-center gap-2">
                                    {field.name}
                                    {!LOCKED_FIELDS.includes(field.name) && (
                                      <Form.Check
                                        type="checkbox"
                                        checked={
                                          selectedFieldsToUpdate[field.name] ||
                                          false
                                        }
                                        onChange={() =>
                                          handleFieldUpdateSelection(field.name)
                                        }
                                        label="Update existing"
                                      />
                                    )}
                                  </div>
                                  <div>
                                    <Select
                                      style={{ width: "100%" }}
                                      placeholder="Select Excel Header"
                                      onChange={(value) =>
                                        handleHeaderMapping(field.name, value)
                                      }
                                      value={mappedFields[field.name]}
                                      mode={
                                        field.multiSelect
                                          ? "multiple"
                                          : undefined
                                      }
                                      virtual={false}
                                      listHeight={256}
                                    >
                                      {excelHeaders.map((header) => (
                                        <Select.Option
                                          key={header}
                                          value={header}
                                        >
                                          {header}
                                        </Select.Option>
                                      ))}
                                    </Select>
                                  </div>
                                </th>
                              </>
                            );
                          }
                          return (
                            <th key={field.name} className="text-center">
                              <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                                {getFieldLabel(field.name)}
                                {!LOCKED_FIELDS.includes(field.name) && (
                                  <div className="d-flex align-items-center gap-1">
                                    <Form.Check
                                      type="checkbox"
                                      checked={
                                        selectedFieldsToUpdate[field.name] ||
                                        false
                                      }
                                      onChange={() =>
                                        handleFieldUpdateSelection(field.name)
                                      }
                                      className="m-0"
                                    />
                                    <BsPencilSquare
                                      size={14}
                                      title="Update existing"
                                    />
                                  </div>
                                )}
                              </div>
                              <div>
                                <Select
                                  style={{ width: "100%", minWidth: "100px" }}
                                  placeholder="Select Excel Header"
                                  onChange={(value) =>
                                    handleHeaderMapping(field.name, value)
                                  }
                                  value={mappedFields[field.name]}
                                  mode={
                                    field.multiSelect ? "multiple" : undefined
                                  }
                                  virtual={false}
                                  listHeight={256}
                                >
                                  {excelHeaders.map((header) => (
                                    <Select.Option key={header} value={header}>
                                      {header}
                                    </Select.Option>
                                  ))}
                                </Select>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {getPaginatedData().map((row, rowIndex) => {
                        const catchNoIndex = excelHeaders.indexOf(
                          mappedFields["CatchNo"]
                        );
                        const currentCatchNo =
                          catchNoIndex !== -1 ? row[catchNoIndex] : null;
                        const existingData = apiData.find(
                          (apiRow) =>
                            apiRow.catchNo?.toString().trim() ===
                            currentCatchNo?.toString().trim()
                        );
                        const isMatching = !!existingData;

                        return (
                          <tr key={rowIndex}>
                            {fields.map((field) => {
                              if (field.colspan && mappedFields[field.name]) {
                                const selectedHeaders = Array.isArray(
                                  mappedFields[field.name]
                                )
                                  ? mappedFields[field.name]
                                  : [mappedFields[field.name]];
                                return selectedHeaders.map((header, idx) => {
                                  let displayValue = "";
                                  let oldValue = "";
                                  if (
                                    isMatching &&
                                    !selectedFieldsToUpdate[field.name]
                                  ) {
                                    // Show API data if exists and field not selected for update
                                    const key =
                                      field.name.charAt(0).toLowerCase() +
                                      field.name.slice(1);
                                    displayValue = existingData[key] || "";
                                  } else {
                                    // Show Excel data
                                    displayValue =
                                      row[excelHeaders.indexOf(header)] || "";
                                    if (isMatching) {
                                      const key =
                                        field.name.charAt(0).toLowerCase() +
                                        field.name.slice(1);
                                      oldValue = existingData[key] || "";
                                    }
                                  }
                                  return (
                                    <td
                                      key={`${field.name}-${idx}`}
                                      style={{
                                        color:
                                          isMatching &&
                                          !selectedFieldsToUpdate[field.name]
                                            ? "blue"
                                            : "green",
                                        position: "relative",
                                        textAlign: "center",
                                      }}
                                    >
                                      {displayValue}
                                      {isMatching &&
                                        oldValue &&
                                        oldValue !== displayValue && (
                                          <div
                                            style={{
                                              position: "absolute",
                                              top: 2,
                                              right: 2,
                                            }}
                                          >
                                            <Popover
                                              content={
                                                <div
                                                  style={{
                                                    whiteSpace: "pre-wrap",
                                                    maxWidth: "200px",
                                                  }}
                                                >{`Previous value: ${oldValue}`}</div>
                                              }
                                              trigger="click"
                                              placement="topRight"
                                            >
                                              <BsInfoCircle
                                                style={{
                                                  cursor: "pointer",
                                                  color: "red",
                                                }}
                                              />
                                            </Popover>
                                          </div>
                                        )}
                                    </td>
                                  );
                                });
                              }

                              let displayValue = "";
                              let oldValue = "";
                              if (
                                isMatching &&
                                !selectedFieldsToUpdate[field.name]
                              ) {
                                // Show API data if exists and field not selected for update
                                const key =
                                  field.name.charAt(0).toLowerCase() +
                                  field.name.slice(1);
                                displayValue = existingData[key] || "";
                              } else {
                                // Show Excel data
                                const headerIndex = excelHeaders.indexOf(
                                  mappedFields[field.name]
                                );
                                displayValue =
                                  headerIndex !== -1 ? row[headerIndex] : "";
                                if (isMatching) {
                                  const key =
                                    field.name.charAt(0).toLowerCase() +
                                    field.name.slice(1);
                                  oldValue = existingData[key] || "";
                                }
                              }

                              // Format date if the field is ExamDate
                              if (field.name === "ExamDate") {
                                displayValue = convertExcelDate(displayValue);
                                oldValue = convertExcelDate(oldValue);
                              }

                              return (
                                <td
                                  key={field.name}
                                  style={{
                                    color:
                                      isMatching &&
                                      !selectedFieldsToUpdate[field.name]
                                        ? "blue"
                                        : "green",
                                    position: "relative",
                                    textAlign: "center",
                                  }}
                                >
                                  {displayValue}
                                  {isMatching &&
                                    oldValue &&
                                    oldValue !== displayValue && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          top: 2,
                                          right: 2,
                                        }}
                                      >
                                        <Popover
                                          content={
                                            <div
                                              style={{
                                                whiteSpace: "pre-wrap",
                                                maxWidth: "200px",
                                              }}
                                            >{`Previous value: ${oldValue}`}</div>
                                          }
                                          trigger="click"
                                          placement="topRight"
                                        >
                                          <BsInfoCircle
                                            style={{
                                              cursor: "pointer",
                                              color: "red",
                                            }}
                                          />
                                        </Popover>
                                      </div>
                                    )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                  {getFilteredData().length === 0 ? (
                    <div className="text-center p-3">
                      <p>{t("noDataFoundForSelectedLot")}</p>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-center mt-3">
                      <Pagination
                        current={currentPage}
                        total={getFilteredData().length}
                        pageSize={pageSize}
                        onChange={(page) => setCurrentPage(page)}
                        showSizeChanger={false}
                      />
                    </div>
                  )}
                  <div className="text-end mt-3 mb-4">
                    <Button
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={getFilteredData().length === 0 || isSubmitting}
                    >
                      {isSubmitting ? t("submitting") : t("submit")}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default UpdateQuantitySheet;