import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import themeStore from '../store/themeStore';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';

const ColumnToggleModal = ({ show, handleClose, columnVisibility, setColumnVisibility, featureData, hasFeaturePermission }) => {
    const themeState = useStore(themeStore);
    const cssClasses = themeState.getCssClasses();
    const { t } = useTranslation();
    const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

    // Force re-render when theme changes
    useEffect(() => {
        // This empty dependency array ensures cssClasses are always fresh
    }, [cssClasses]);

    // Load saved column visibility from localStorage on initial render
    useEffect(() => {
        const savedVisibility = localStorage.getItem('columnVisibility');
        if (savedVisibility) {
            setColumnVisibility(JSON.parse(savedVisibility));
        }
    }, [setColumnVisibility]);

    const handleToggle = (column) => {
        setColumnVisibility((prevVisibility) => {
            const newVisibility = {
                ...prevVisibility,
                [column]: !prevVisibility[column],
            };
            // Save to localStorage whenever visibility changes
            localStorage.setItem('columnVisibility', JSON.stringify(newVisibility));
            return newVisibility;
        });
    };

    const columns = [
        { key: 'Interim Quantity', label: 'interimQuantity' },
        { key: 'Remarks', label: 'remarks' },
        { key: 'Team Assigned', label: 'teamAssigned' },
        { key: 'Paper', label: 'paper' },
        { key: 'Paper Details', label: 'paperDetails' },
        { key: 'Envelopes', label: 'envelopes' },
        { key: 'Course', label: 'course' },
        { key: 'Machine', label: 'machine' },
        { key: 'Zone', label: 'zone' },
        { key: 'Subject', label: 'subject' },
        { key: 'Exam Date', label: 'examDate' },
        { key: 'Exam Time', label: 'examTime' },
        { key: 'Pages', label: 'Pages' }
    ];

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className={`${customDark} ${customDarkText}`}>
                <Modal.Title className={`${customLightText} fs-4`}>{t('toggleColumns')}</Modal.Title>
            </Modal.Header>
            <Modal.Body className={`${customLight} ${customDarkText} p-4`}>
                <Form>
                    {columns.map(({ key, label }) => (
                        <Form.Group key={key} className="mb-3">
                            <Form.Check
                                type="switch"
                                id={`custom-switch-${key}`}
                                label={t(label)}
                                checked={columnVisibility[key]}
                                onChange={() => handleToggle(key)}
                            />
                        </Form.Group>
                    ))}
                </Form>
            </Modal.Body>
            <Modal.Footer className={`${customLight} justify-content-center`}>
                <Button 
                    className={`${customBtn} border-0 px-4 py-2 fs-5`} 
                    onClick={handleClose}
                >
                    {t('close')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ColumnToggleModal;