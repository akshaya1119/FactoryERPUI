import React, { useEffect, useState, useMemo } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import themeStore from '../store/themeStore';
import { useStore } from 'zustand';

const AlarmModal = ({ show, handleClose, data, processId, handleSave }) => {
    const { t } = useTranslation();
    const themeState = useStore(themeStore);
    const cssClasses = themeState.getCssClasses();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

    // Force re-render when theme changes
    useEffect(() => {
        // This empty dependency array ensures cssClasses are always fresh
    }, [cssClasses]);

    const statusMapping = {
        0: t('pending'),
        1: t('started'),
        2: t('completed'),
    };

    const [alarmType, setAlarmType] = useState('');
    const [alarmId, setAlarmId] = useState(null);
    const [customMessage, setCustomMessage] = useState('');
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [alarmOptions, setAlarmOptions] = useState([]);

    const handleSubmit = async () => {
        try {
            let existingTransactionData;
            if (data.transactionId) {
                const response = await API.get(`/Transactions/${data.transactionId}`);
                existingTransactionData = response.data;
            }

            const finalAlarmId = alarmType === 'Other' && customMessage.trim() !== "" ? customMessage : alarmId;

            if (!finalAlarmId) {
                alert("Alarm ID is required. Please select a valid alarm type or enter a custom message.");
                return;
            }

            const alarmIdString = String(finalAlarmId);

            const postData = {
                transactionId: data.transactionId || 0,
                interimQuantity: existingTransactionData ? existingTransactionData.interimQuantity : 0,
                remarks: existingTransactionData ? existingTransactionData.remarks : "",
                projectId: data.projectId,
                quantitysheetId: data.srNo || 0,
                processId: processId,
                zoneId: existingTransactionData ? existingTransactionData.zoneId : 0,
                machineId: existingTransactionData ? existingTransactionData.machineId : 0,
                status: existingTransactionData ? existingTransactionData.status : 0,
                alarmId: alarmIdString,
                lotNo: data.lotNo,
                teamId: existingTransactionData ? existingTransactionData.teamId : [],
                voiceRecording: existingTransactionData ? existingTransactionData.voiceRecording : ""
            };

            await API.post('/Transactions', postData);

            handleSave(alarmIdString);
            handleClose();
            setAlarmType('');
            setAlarmId(null);
            setCustomMessage('');
        } catch (error) {
            console.error('Error saving alarm:', error);
        }
    };

    const handleAlarmTypeChange = (e) => {
        const selectedOption = alarmOptions.find(option => option.message === e.target.value);

        if (e.target.value === 'Other') {
            setAlarmType('Other');
            setShowCustomInput(true);
        } else {
            setAlarmType(selectedOption ? selectedOption.message : '');
            setAlarmId(selectedOption ? selectedOption.alarmId : null);
            setShowCustomInput(false);
        }
    };

    const getAlarm = async () => {
        try {
            const response = await API.get('/alarms');
            setAlarmOptions(response.data);
        } catch (error) {
            console.error("Failed to fetch alarm types", error);
        }
    };

    useEffect(() => {
        getAlarm();
    }, []);

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className={`${customDark} ${customDarkText}`}>
                <Modal.Title className={`${customLightText} fs-4`}>{t('setAlarm')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className={`${customLight} ${customDarkText} p-4`}>
                {data ? (
                    <>
                        <div className="details mb-3 d-flex justify-content-between align-items-center">
                            <div>
                                <span className="fw-bold">{t('catchNo')} </span>: {data.catchNumber}
                            </div>
                            <div>
                                <span className="fw-bold">{t('status')} </span>:
                                <span className={`fw-bold ${data.status === 0 ? 'text-danger' :
                                        data.status === 1 ? 'text-primary' :
                                        data.status === 2 ? 'text-success' : ''
                                    }`}>
                                    {statusMapping[data.status]}
                                </span>
                            </div>
                        </div>
                        <div className='details mb-3 d-flex justify-content-between align-items-center'>
                            <div>
                                <span className='fw-bold'>{t('totalQuantity')} : </span>
                                <span className=''>{data.quantity}</span>
                            </div>
                            <div>
                                <span className='fw-bold'>{t('remainingQuantity')} : </span>
                                <span className=''>{data.quantity - data.interimQuantity}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div>{t('noDataAvailable')}</div>
                )}
                <Form.Group controlId="formAlarmType">
                    <Form.Label>{t('alarmType')}</Form.Label>
                    <Form.Control
                        as="select"
                        value={alarmType}
                        onChange={handleAlarmTypeChange}
                        className="text-dark"
                    >
                        <option value="" className="text-dark">{t('selectAlarmType')}</option>
                        {alarmOptions.map(option => (
                            <option key={option.id} value={option.message} className="text-dark">{option.message}</option>
                        ))}
                        <option value="Other" className="text-dark">{t('other')}</option>
                    </Form.Control>
                </Form.Group>
                {showCustomInput && (
                    <Form.Group controlId="formCustomMessage" className="mt-3">
                        <Form.Label>{t('customMessage')}</Form.Label>
                        <div className='d-flex justify-content-between align-items-center'>
                            <div className="text-box w-75">
                                <Form.Control
                                    type="text"
                                    placeholder={t('enterCustomMessage')}
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    className={`${customLight} ${customDarkText}`}
                                />
                            </div>
                        </div>
                    </Form.Group>
                )}
            </Modal.Body>
            <Modal.Footer className={`${customLight} justify-content-center`}>
                <Button 
                    variant="danger" 
                    onClick={handleClose}
                    className="px-4 py-2 fs-5"
                >
                    {t('close')}
                </Button>
                <Button 
                    className={`${customBtn} border-0 px-4 py-2 fs-5`} 
                    onClick={handleSubmit}
                >
                    {t('saveChanges')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AlarmModal;