import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import themeStore from '../store/themeStore';
import { useMemo } from 'react';
import { error, warning } from '../CustomHooks/Services/AlertMessageService';
import { ToastContainer } from 'react-toastify';

const statusMapping = {
    0: 'pending',
    1: 'started', 
    2: 'completed',
};

const InterimQuantityModal = ({ show, handleClose, handleSave, data, processId }) => {
    const [interimQuantity, setInterimQuantity] = useState('');
    const { t } = useTranslation();
    const themeState = useStore(themeStore);
    const cssClasses = useMemo(() => themeState.getCssClasses(), [themeState]);
    const [
        customDark,
        customMid,
        customLight,
        customBtn,
        customDarkText,
        customLightText,
        customLightBorder,
        customDarkBorder,
        customThead
    ] = cssClasses;

    const handleSubmit = async () => {
        const totalQuantity = data.previousProcessData && data.previousProcessData.interimQuantity
        ? data.previousProcessData.interimQuantity 
        : data.quantity;
        const totalInterimQuantity = data.interimQuantity + parseFloat(interimQuantity);

        if (totalInterimQuantity > totalQuantity) {
            error(t('interimQuantityError'));
            return;
        }

        try {
            let existingTransactionData;
            if (data.transactionId) {
                const response = await API.get(`/Transactions/${data.transactionId}`);
                existingTransactionData = response.data;
            }

            const postData = {
                transactionId: data.transactionId || 0,
                interimQuantity: totalInterimQuantity,
                remarks: existingTransactionData ? existingTransactionData.remarks : "", 
                projectId: data.projectId,
                quantitysheetId: data.srNo || 0,
                processId: processId,
                zoneId: existingTransactionData ? existingTransactionData.zoneId : 0,
                machineId: existingTransactionData ? existingTransactionData.machineId : 0,
                status: existingTransactionData ? existingTransactionData.status : 0,
                alarmId: existingTransactionData ? existingTransactionData.alarmId : "",
                lotNo: data.lotNo,
                teamId: existingTransactionData ? existingTransactionData.teamId : [],  
                voiceRecording: existingTransactionData? existingTransactionData.voiceRecording : ""             
            };

            const response = await API.post('/Transactions', postData);
            
            handleSave(interimQuantity);
            setInterimQuantity('');
            handleClose();
        } catch (error) {
            console.error('Error updating interim quantity:', error);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} > 
        <ToastContainer></ToastContainer>
            <Modal.Header closeButton={false} className={customDark}>
                <Modal.Title className={customLightText}>{t("setInterimQuantity")}</Modal.Title>
            </Modal.Header>
            <Modal.Body className={customDark}>
                {data ? (
                    <>
                        <div className="details mb-3 d-flex justify-content-between align-items-center">
                            <div>
                                <span className={`fw-bold ${customLightText} me-1`}>{t("catchNo")} :</span> 
                                <span className={customLightText}>{data.catchNumber}</span>
                            </div>
                            <div>
                                <span className={`fw-bold ${customLightText}`}>{t("status")} :</span>
                                <span className={`ms-1 fw-bold ${data.status === 0 ? 'text-danger' :
                                        data.status === 1 ? 'text-primary' :
                                        data.status === 2 ? 'text-success' : ''
                                    }`}>
                                    {t(statusMapping[data.status])}
                                </span>
                            </div>
                        </div>
                        <div className="details mb-3 d-flex justify-content-between align-items-center">
                            <div>
                                <span className={`me-1 fw-bold ${customLightText}`}>{t("totalQuantity")} :</span> 
                                <span className={customLightText}>{data.quantity}</span>
                            </div>
                            <div>
                                <span className={`me-1 fw-bold ${customLightText}`}>{t("interimQuantity")} :</span>
                                <span className={customLightText}>{data.interimQuantity}</span>
                            </div>
                        </div>
                        <div className="details mb-3 d-flex justify-content-between align-items-center">
                            <div>
                                <span className={`me-1 fw-bold ${customLightText}`}>{t("remainingQuantity")} :</span>
                                <span className={customLightText}>{data.quantity - data.interimQuantity}</span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={customLightText}>{t("noDataAvailable")}</div>
                )}
                <Form.Group controlId="formInterimQuantity">
                    <Form.Label className={customLightText}>{t("interimQuantity")}</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder={t("enterInterimQuantity")}
                        value={interimQuantity}
                        onChange={(e) => setInterimQuantity(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSubmit();
                            }
                        }}
                    />
                </Form.Group>
            </Modal.Body>
            <Modal.Footer className={customDark}>
                <Button 
                    variant="danger" 
                    onClick={handleClose}
                    className={customDark === "red-dark" || customDark === "dark-dark" ? "border border-white" : ""}
                >
                    {t("close")}
                </Button>
                <Button 
                    className={`${customDark === 'red-dark' ? 'border-0 bg-white text-danger' : `border-white ${customBtn}`}`} 
                    onClick={handleSubmit}
                >
                    {t("saveChanges")}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default InterimQuantityModal;
