import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form } from 'react-bootstrap';
import themeStore from '../store/themeStore';
import { useStore } from 'zustand';
import API from '../CustomHooks/MasterApiHooks/api';
import { ToastContainer } from 'react-toastify';
import { t } from 'i18next';



const InputPages = ({ show, onClose, data, processId, fetchTransactions, onSuccess, onError }) => {
    const [inputValues, setInputValues] = useState([]);
    const [errors, setErrors] = useState("");
    const [loading, setLoading] = useState(false);

    // Access the theme store
    const themeState = useStore(themeStore);
    const cssClasses = themeState.getCssClasses();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

    // Force re-render when theme changes
    useEffect(() => {
        if (data && data.length > 0) {
            // Initialize inputValues with the data provided when the modal opens
            const initialValues = data.map(item => ({
                catchNumber: item.catchNumber,
                lotNo: item.lotNo,
                pages: item.pages || '', // Ensure pages is initialized (default to empty string)
                projectId: item.projectId
            }));
            setInputValues(initialValues);
        }
    }, [data]); // Re-run when 'data' changes

    const handleInputChange = (event, item) => {
        setErrors('');
        const { name, value } = event.target;
        setInputValues((prevState) => {
            const existingIndex = prevState.findIndex(
                (entry) => entry.catchNumber === item.catchNumber
            );

            const updatedEntry = {
                ...item,
                [name]: value,
                pages: value, // Ensure 'pages' value is updated
            };

            if (existingIndex > -1) {
                // Replace the existing entry with the updated one
                const updatedState = [...prevState];
                updatedState[existingIndex] = updatedEntry;
                return updatedState;
            }

            // Add a new entry if not already in state
            return [...prevState, updatedEntry];
        });
    };

    const handleSave = async () => {
        setErrors('');
        setLoading(true);
        const formattedData = inputValues.map((item) => ({
            pages: item.pages || '', // Ensure pages is empty string if not provided
            catchNumber: item.catchNumber,
            lotNo: item.lotNo,
            projectId: item.projectId,
        }));

        try {
            console.log('Formatted Data:', formattedData); // Log the formatted data before sending
            const res = await API.post(`/QuantitySheet/UpdatePages`, formattedData);
            if (res?.status === 200) {
                onSuccess()
                await fetchTransactions(processId, formattedData);
                handleClose();
            } else {
                setErrors(res?.data);
                onError()
            }

        } catch (error) {
            setErrors(t('Failed to update pages'));
            console.error(t('Error updating pages:'), error);
            onError()
        }
        finally {
            setLoading(false);
        }
    };
    const handleClose = () => {
        setInputValues([]);
        setErrors('');
        onClose();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton className={`${customDark} ${customDarkText}`}>
                <Modal.Title className={`${customLightText} fs-4`}>{t('Enter Pages in the given Catch Number')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className={`${customLight} ${customDarkText} p-4`}>
                <p className={`text-center ${customDarkText}`}>{t('Please enter the number of pages for each catch number.')}</p>
                <Table striped bordered hover responsive className={`table-bordered ${customLightBorder}`}>
                    <thead>
                        <tr className={`${customDark} ${customLightText}`}>
                            <th className='text-center'>{t('Catch Number')}</th>
                            <th className='text-center'>{t('Lot Number')}</th>
                            <th className='text-center'>{t('Pages')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data && data.length > 0 ? (
                            data.map((item, index) => (
                                <tr key={index}>
                                    <td className='text-center'>{item.catchNumber}</td>
                                    <td className='text-center'>{item.lotNo}</td>
                                    <td>
                                        <Form.Control
                                            className='text-center'
                                            type="number"
                                            name="pages"
                                            size="sm"
                                            value={inputValues.find(i => i.catchNumber === item.catchNumber)?.pages || ''}
                                            onChange={(e) => handleInputChange(e, item)}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className={`text-center ${customDarkText}`}>
                                    {t('No data available')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
                <p className="text-danger">{errors}</p>
                <ToastContainer />
            </Modal.Body>
            <Modal.Footer className={`${customLight} justify-content-center`}>
                <Button size="sm" onClick={handleClose} className={`${customBtn} border-0 `}>{t('close')}</Button>
                <Button size="sm" className={`${customBtn} border-0 `} onClick={handleSave} disabled={loading}>{loading ? t('Saving...') : t('Save Changes')}</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default InputPages;