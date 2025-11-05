import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Table, Spin, message, Button, Collapse, Checkbox, Select, InputNumber } from 'antd';
import API from '../../../CustomHooks/MasterApiHooks/api';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import themeStore from '../../../store/themeStore';
const { Panel } = Collapse;
const { Option } = Select;

const DragHandle = SortableHandle(({ disabled }) => {
  return (
    <span style={{
      cursor: disabled ? 'not-allowed' : 'grab',
      marginRight: '8px',
      opacity: disabled ? 0.5 : 1,
      display: disabled ? 'none' : 'inline'
    }} aria-hidden={disabled ? "true" : "false"}>⣿</span>
  );
});

const SortableRow = SortableElement(({ process, index, features, editingProcessId, editingFeatures, handleFeatureChange, handleSaveFeatures, handleCancelEdit, handleEdit, independentProcesses, disabled, handleThresholdChange }) => {
  const { t } = useTranslation();
  const canEditThreshold = process.installedFeatures?.includes(4);

  return (
    <tr style={{ opacity: 1, background: 'white', margin: '10px' }}>
      <td>
        {<DragHandle disabled={disabled} />}
        {independentProcesses.some(p => p.id === process.id) && <span className='fw-bold c-pointer' style={{ color: 'green' }} title='Independent Process'>~ </span>}
        {process.name}
      </td>
      <td>
        {editingProcessId === process.id ? (
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            value={editingFeatures}
            onChange={handleFeatureChange}
          >
            {features.map(feature => (
              <Option key={feature.featureId} value={feature.featureId}>
                {feature.features}
              </Option>
            ))}
          </Select>
        ) : (
          <div>
            {features
              .filter(feature => process.installedFeatures.includes(feature.featureId))
              .map(feature => (
                <div key={feature.featureId} style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{feature.features}</span>
                  <span style={{ marginLeft: '8px', color: 'green' }}>✔️</span>
                </div>
              ))}
          </div>
        )}
      </td>
      <td>{process.weightage}</td>
      <td>{process.relativeWeightage.toFixed(4)}%</td>
      <td>
        {editingProcessId === process.id && canEditThreshold ? (
          <InputNumber
            min={0}
            value={process.thresholdQty}
            onChange={(value) => handleThresholdChange(process.id, value)}
          />
        ) : (
          canEditThreshold ? process.thresholdQty : ''
        )}
      </td>
      <td>
        {editingProcessId === process.id ? (
          <>
            <Button onClick={() => handleSaveFeatures(process.id)} type="primary">{t("save")}</Button>
            <Button onClick={handleCancelEdit}>Cancel</Button>
          </>
        ) : (
          <Button onClick={() => handleEdit(process)}>{t("edit")}</Button>
        )}
      </td>
    </tr>
  );
});

const SortableBody = SortableContainer(({ children }) => {
  return <tbody>{children}</tbody>;
});

const arrayMoveMutate = (array, from, to) => {
  array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
};

const arrayMove = (array, from, to) => {
  array = array.slice();
  arrayMoveMutate(array, from, to);
  return array;
};

const AddProjectProcess = ({ selectedProject, setIsProcessSubmitted }) => {
  if (!selectedProject) {
    return null;
  }

  const [projectProcesses, setProjectProcesses] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allProcesses, setAllProcesses] = useState([]);
  const [selectedProcessIds, setSelectedProcessIds] = useState([]);
  const [removedProcessIds, setRemovedProcessIds] = useState([]);
  const [requiredProcessIds, setRequiredProcessIds] = useState([]);
  const [editingProcessId, setEditingProcessId] = useState(null);
  const [editingFeatures, setEditingFeatures] = useState([]);
  const [previousFeatures, setPreviousFeatures] = useState([]);
  const [independentProcesses, setIndependentProcesses] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [isQuantitySheetExists, setIsQuantitySheetExists] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tableRef = useRef(null);
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;
  useEffect(() => {
    const fetchRequiredProcesses = async (typeId) => {
      try {
        const response = await API.get(`/PaperTypes/${typeId}/RequiredProcesses`);
        setRequiredProcessIds(response.data.map(process => process.id));
      } catch (error) {
        console.error(t('unableToFetchRequiredProcessesPleaseTryAgainLater'), error);
      }
    };

    const fetchProcessesOfProject = async () => {
      try {
        const projectResponse = await API.get(`/Project/${selectedProject}`);
        const { typeId, name } = projectResponse.data;

        setProjectName(name);
        const response = await API.get(`/ProjectProcess/GetProjectProcesses/${selectedProject}`);
        if (response.data.length > 0) {
          await fetchRequiredProcesses(typeId);
          setIsProcessSubmitted(true);
          const sortedProcesses = response.data.sort((a, b) => a.sequence - b.sequence);
          const independentOnly = sortedProcesses.filter(process => process.processType !== "Dependent");
          setProjectProcesses(calculatedWeightage(independentOnly));
        } else {
          await fetchRequiredProcesses(typeId);
          await fetchProjectProcesses(typeId);
        }
      } catch (error) {
        console.error(t('unableToFetchProjectProcessesPleaseTryAgainLater'), error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProjectProcesses = async (typeId) => {
      try {
        const response = await API.get(`/PaperTypes/${typeId}/Processes`);
        const independentOnly = response.data.filter(process => process.processType !== "Dependent");
        setProjectProcesses(calculatedWeightage(independentOnly));
      } catch (error) {
        console.error(t('unableToFetchProjectProcessesPleaseTryAgainLater'), error);
      }
    };

    const fetchFeatures = async () => {
      try {
        const response = await API.get('/Features');
        setFeatures(response.data);
      } catch (error) {
        console.error(t('unableToFetchProjectProcessesPleaseTryAgainLater'), error);
      }
    };

    const fetchAllProcesses = async () => {
      try {
        const response = await API.get('/Processes');
        const independentOnly = response.data
          .filter(process => process.processType === "Independent")
          .map(process => ({
            ...process,
            rangeStart: process.rangeStart || 0,
            rangeEnd: process.rangeEnd || 0
          }));

        setAllProcesses(response.data);
        setIndependentProcesses(independentOnly);

      } catch (error) {
        console.error(t('unableToFetchProjectProcessesPleaseTryAgainLater'), error);
      }
    };

    const checkQuantity = async () => {
      try {
        const response = await API.get(`/QuantitySheet/CatchByproject?ProjectId=${selectedProject}`);
        if (response.data.length > 1) {
          setIsQuantitySheetExists(response.data);
        }
      } catch (error) {
        console.error(t('errorCheckingTransactionStatus'), error);
      }
    };

    checkQuantity();
    fetchFeatures();
    fetchProcessesOfProject();
    fetchAllProcesses();
  }, [selectedProject]);

  useEffect(() => {
    setSelectedProcessIds(projectProcesses.map(process => process.id));
  }, [projectProcesses]);

  const handleProcessSelect = (processId) => {
    if (isQuantitySheetExists) return;
    const process = allProcesses.find(p => p.id === processId);

    setSelectedProcessIds((prev) => {
      const newSelection = prev.includes(processId)
        ? prev.filter(id => id !== processId)
        : [...prev, processId];

      if (prev.includes(processId)) {
        setRemovedProcessIds((prevRemoved) => [...prevRemoved, processId]);
      } else {
        setRemovedProcessIds((prevRemoved) => prevRemoved.filter(id => id !== processId));
      }

      const updatedProcesses = allProcesses.filter(process => newSelection.includes(process.id));
      const existingIds = new Set(projectProcesses.map(p => p.id));
      const processesToAdd = updatedProcesses.filter(p => !existingIds.has(p.id));
      const processesToRemove = projectProcesses.filter(p => !newSelection.includes(p.id));

      // Find position of the process in allProcesses
      const processIndex = allProcesses.findIndex(p => p.id === processId);

      setProjectProcesses((prev) => {
        const filteredProcesses = prev.filter(p => !processesToRemove.includes(p));
        const newProcesses = [...filteredProcesses];

        // Insert new process at correct position if adding
        if (!prev.includes(processId) && processIndex !== -1) {
          const newProcess = processesToAdd.find(p => p.id === processId);
          if (newProcess) {
            // Find appropriate position in current processes
            let insertIndex = 0;
            while (insertIndex < newProcesses.length &&
              allProcesses.findIndex(p => p.id === newProcesses[insertIndex].id) < processIndex) {
              insertIndex++;
            }
            newProcesses.splice(insertIndex, 0, newProcess);
          }
        }

        return calculatedWeightage(newProcesses);
      });

      return newSelection;
    });
  };

  const handleThresholdChange = (processId, value) => {
    setProjectProcesses(prevProcesses => {
      const updatedProcesses = prevProcesses.map(process =>
        process.id === processId
          ? { ...process, thresholdQty: value }
          : process
      );
      return calculatedWeightage(updatedProcesses);
    });
  };

  const calculatedWeightage = (processes) => {
    const totalWeightage = processes.reduce((sum, process) => sum + (process.weightage || 0), 0);
    return processes.map(process => ({
      ...process,
      relativeWeightage: totalWeightage > 0 ? ((process.weightage || 0) / totalWeightage) * 100 : 0
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const projectProcessesToSubmit = projectProcesses.map((process, index) => {
        const matchingProcess = allProcesses.find(p => p.name === process.name);
        return {
          id: process.id,
          projectId: selectedProject,
          processId: matchingProcess ? matchingProcess.id : process.id,
          weightage: process.relativeWeightage,
          sequence: index + 1,
          featuresList: process.installedFeatures || [],
          userId: process.userId || [],
          thresholdQty: process.thresholdQty || 0
        };
      });

      const data = { projectProcesses: projectProcessesToSubmit };
      const deleteData = { projectId: selectedProject, processIds: removedProcessIds };

      // if (removedProcessIds.length > 0) {
      //   await API.post('/ProjectProcess/DeleteProcessesFromProject', deleteData);
      // }

      await API.post('/ProjectProcess/AddProcessesToProject', data);

      message.success(t('processesUpdatedSuccessfully'));
      setIsProcessSubmitted(true);
      setRemovedProcessIds([]);

    } catch (error) {
      message.error(t('errorUpdatingProcessesPleaseTryAgain'));
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (process) => {
    setEditingProcessId(process.id);
    setEditingFeatures(process.installedFeatures);
    setPreviousFeatures(process.installedFeatures);
  };

  const handleCancelEdit = () => {
    setEditingProcessId(null);
    setEditingFeatures(previousFeatures);
  };

  const handleFeatureChange = (value) => {
    setEditingFeatures(value);
  };

  const handleSaveFeatures = async (processId) => {
    const process = projectProcesses.find(p => p.id === processId);
    const updatedProcess = {
      projectId: selectedProject,
      processId: processId,
      featuresList: editingFeatures,
      thresholdQty: process.thresholdQty
    };

    try {
      await API.post('/ProjectProcess/UpdateProcessFeatures', updatedProcess);

      setProjectProcesses((prevProcesses) => {
        return prevProcesses.map(process => {
          if (process.id === processId) {
            return { ...process, installedFeatures: editingFeatures };
          }
          return process;
        });
      });
      message.success(t('processUpdateSuccess'));
    } catch (error) {
      message.error(t('errorUpdatingProcessPleaseTryAgain'));
    } finally {
      setEditingProcessId(null);
      setEditingFeatures([]);
    }
  };

  const onSortEnd = useCallback(({ oldIndex, newIndex }) => {
    if (isQuantitySheetExists) return;

    const process = projectProcesses[oldIndex];
    const processWithRange = independentProcesses.find(p => p.id === process.id);

    // if (processWithRange?.rangeStart && processWithRange?.rangeEnd) {
    //   const rangeStartIndex = projectProcesses.findIndex(p => p.id === processWithRange.rangeStart);
    //   const rangeEndIndex = projectProcesses.findIndex(p => p.id === processWithRange.rangeEnd);

    //   if (newIndex <= rangeStartIndex || newIndex >= rangeEndIndex) {
    //     message.error(`${t('thisProcessMustBePositionedBetween')} ${projectProcesses[rangeStartIndex]?.name} ${t('and')} ${projectProcesses[rangeEndIndex]?.name}`);
    //     return;
    //   }
    // }

    setProjectProcesses(prevProcesses => {
      const newProcesses = arrayMove(prevProcesses, oldIndex, newIndex);
      return calculatedWeightage(newProcesses);
    });
  }, [projectProcesses, independentProcesses, isQuantitySheetExists]);

  const handleSomeAction = () => {
    if (tableRef.current) {
      const tableData = {
        processes: projectProcesses,
        features: features,
        selectedProcessIds: selectedProcessIds
      };
    }
  };

  if (loading || projectProcesses.length === 0) {
    return <Spin tip={t("loading")} />;
  }

  return (
    <div>
      <h4>Project: {projectName}</h4>

      <Collapse defaultActiveKey={['1']}>
        <Panel header={`${t('manageProcess')}`} key="1" inert={isQuantitySheetExists ? "true" : undefined}>
          {allProcesses.map(process => (
            <Checkbox
              key={process.id}
              checked={selectedProcessIds.includes(process.id)}
              onChange={() => handleProcessSelect(process.id)}
              disabled={requiredProcessIds.includes(process.id) || isQuantitySheetExists}
              aria-hidden={requiredProcessIds.includes(process.id) || isQuantitySheetExists}
            >
              {process.name}
            </Checkbox>
          ))}
        </Panel>
      </Collapse>

      <div style={{ padding: '10px', overflowX: 'auto' }}>
        <table ref={tableRef} className="table table-striped table-bordered" style={{ minWidth: '800px', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '5px', textAlign: 'left', width: '20%' }}>{t("processName")}</th>
              <th style={{ padding: '5px', textAlign: 'left', width: '25%' }}>{t("installedFeatures")}</th>
              <th style={{ padding: '5px', textAlign: 'left', width: '15%' }}>{t("weightage")}</th>
              <th style={{ padding: '5px', textAlign: 'left', width: '15%' }}>{t("relativeWeightage")}</th>
              <th style={{ padding: '5px', textAlign: 'left', width: '10%' }}>{t("thresholdQty")}</th>
              <th style={{ padding: '5px', textAlign: 'left', width: '15%' }}>{t("action")}</th>
            </tr>
          </thead>
          <SortableBody
            onSortEnd={onSortEnd}
            axis="y"
            lockAxis="y"
            lockToContainerEdges={true}
            lockOffset={["30%", "50%"]}
            useDragHandle={true}
            helperClass="row-dragging"
            disabled={isQuantitySheetExists}
          >
            {projectProcesses.map((process, index) => (
              <SortableRow
                key={process.id}
                index={index}
                process={process}
                features={features}
                editingProcessId={editingProcessId}
                editingFeatures={editingFeatures}
                handleFeatureChange={handleFeatureChange}
                handleSaveFeatures={handleSaveFeatures}
                handleCancelEdit={handleCancelEdit}
                handleEdit={handleEdit}
                independentProcesses={independentProcesses}
                disabled={isQuantitySheetExists}
                handleThresholdChange={handleThresholdChange}
              />
            ))}
          </SortableBody>
        </table>
      </div>

      <Button
        type="primary"
        className={`${customBtn}`}
        onClick={handleSubmit}
        style={{ marginTop: '16px' }}
        disabled={isQuantitySheetExists || isSubmitting}
      >
        {isSubmitting ? t("submitting") : t("submitProcesses")}
      </Button>

      <style>
        {`
          .row-dragging {
            background: #fafafa;
            border: 1px solid #ccc;
            z-index: 9999;
          }
          .row-dragging td {
            padding: 16px;
            visibility: visible !important;
          }
          .row-dragging .drag-visible {
            visibility: visible !important;
          }
        `}
      </style>
    </div>
  );
};

export default AddProjectProcess;
