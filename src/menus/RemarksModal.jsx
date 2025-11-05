import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Container, Row, Col } from 'react-bootstrap';
import { useReactMediaRecorder } from "react-media-recorder";
import { useStore } from 'zustand';
import themeStore from '../store/themeStore';
import { FaMicrophone } from 'react-icons/fa';
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';

const RemarksModal = ({ show, handleClose, handleSave, data, processId }) => {
    const themeState = useStore(themeStore);
    const cssClasses = themeState.getCssClasses();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder] = cssClasses;

    const [remarks, setRemarks] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const {
        status,
        startRecording,
        stopRecording,
        mediaBlobUrl,
    } = useReactMediaRecorder({
        video: false,
        audio: true,
        echoCancellation: true,
    });

    const { t } = useTranslation();

    // Force re-render when theme changes
    useEffect(() => {
        // This empty dependency array ensures cssClasses are always fresh
    }, [cssClasses]);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60).toString().padStart(2, '0');
        const seconds = (time % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    const handleSubmit = async () => {
        try {
            let existingTransactionData;
            if (data.transactionId) {
                const response = await API.get(`/Transactions/${data.transactionId}`);
                existingTransactionData = response.data;
            }

            // Ensure that the mediaBlobUrl is not null or empty
            let base64Audio = null;
            if (mediaBlobUrl) {
                base64Audio = await convertToBase64(mediaBlobUrl);
            }

            const postData = {
                transactionId: data.transactionId || 0,
                interimQuantity: data.interimQuantity,
                remarks: remarks,
                projectId: data.projectId,
                quantitysheetId: data.srNo || 0,
                processId: processId,
                zoneId: existingTransactionData ? existingTransactionData.zoneId : 0,
                machineId: existingTransactionData ? existingTransactionData.machineId : 0,
                status: existingTransactionData ? existingTransactionData.status : 0,
                alarmId: existingTransactionData ? existingTransactionData.alarmId : "",
                lotNo: data.lotNo,
                teamId: existingTransactionData ? existingTransactionData.teamId : [],
                voiceRecording: base64Audio || ""
            };

            await API.post('/Transactions', postData);

            // Reset states after save
            handleSave(remarks, mediaBlobUrl);
            setRemarks('');  // Clear remarks input
            setIsRecording(false);  // Reset recording state
            setRecordingTime(0);  // Reset recording timer
            handleClose();  // Close modal

            // Clear the audio state after submitting
            stopRecording(); // Stop recording if still active
            setRecordingTime(0); // Reset the timer
        } catch (error) {
            console.error('Error updating interim quantity:', error);
        }
    };

    const convertToBase64 = (mediaBlobUrl) => {
        return new Promise((resolve, reject) => {
            fetch(mediaBlobUrl)
                .then(response => response.blob()) // Fetch the Blob from the media URL
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result.split(',')[1]); // Extract base64 string
                    reader.onerror = reject;
                    reader.readAsDataURL(blob); // Convert the Blob to a DataURL (base64)
                })
                .catch(reject);
        });

    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
        setIsRecording(!isRecording);
    };

    return (
        <Modal show={show} onHide={handleClose} size="md">
            <Modal.Header className={`${customDark} ${customDarkText}`}>
                <Modal.Title className={customLightText}>{t('setRemarks')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className={`${customLight} ${customDarkText}`}>
                <Container fluid>
                    <Row>
                        <Col xs={12} md={12}>
                            <Form.Group controlId="formRemarks" className="mb-3">
                                <Form.Label className={`${customDarkText} fs-4`}>
                                    {t('remarks')} <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={5}
                                    placeholder={t('enterRemarks')}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className={` ${customDarkText}`}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={12}>
                            <div className="voice-recording mb-3">
                                <h5 className={customDarkText}>{t('voiceRecording')}</h5>
                                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2">
                                    <Button
                                        variant={isRecording ? "danger" : "primary"}
                                        onClick={toggleRecording}
                                        className={`${customBtn} ${customLightBorder} mb-2 mb-md-0`}
                                    >
                                        <FaMicrophone className="me-2" />
                                        {isRecording ? t('stopRecording') : t('startRecording')}
                                    </Button>
                                    <div className={customDarkText}>
                                        <span className="fw-bold">{t('recordingStatus')}: </span>
                                        {status}
                                    </div>
                                    <div className={customDarkText}>
                                        <span className="fw-bold">{t('recordingTime')}: </span>
                                        {formatTime(recordingTime)}
                                    </div>
                                </div>
                                {mediaBlobUrl && (
                                    <audio src={mediaBlobUrl} controls className="mt-3 w-100" />
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </Modal.Body>
            <Modal.Footer className={`${customDark} ${customDarkText}`}>
                <Button 
                    variant="secondary" 
                    onClick={handleClose} 
                    className={`${customBtn} ${customLightBorder}`}
                >
                    {t('close')}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    className={`${customBtn} ${customLightBorder}`}
                    disabled={remarks.trim() === ''}
                >
                    {t('saveChanges')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default RemarksModal;