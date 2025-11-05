import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { FaCircleCheck } from "react-icons/fa6";
import { Row, Col } from 'react-bootstrap';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';

const AlertBadge = ({ catchNo, alerts, onClick, status }) => {

    //Theme Change Section
    const { getCssClasses } = useStore(themeStore);
    const [
        customDark,
        customMid,
        customLight,
        customBtn,
        customDarkText,
        customLightText,
        customLightBorder,
        customDarkBorder
    ] = getCssClasses();

    const [visible, setVisible] = useState(true);
    // const activeUser = JSON.parse(localStorage.getItem('activeUser')); // not implemented
    const handleClose = (e) => {
        e.stopPropagation();
        setVisible(false);
    };

    if (!visible) return null;

    const getBadgeStyles = () => {
        switch (status) {
            case 'level1-':
                return 'bg-danger text-white';
            case 'level2-':
                return 'bg-warning text-dark';
            default:
                return 'bg-white text-dark';
            // return '';
        }
    };

    return (
        <Row>
            <div
                className={`badge c-pointer d-flex align-items-center  p-2 me-2 ${getBadgeStyles()}`}
                onClick={onClick}
                style={{ width: "auto", background: "", border: "2px solid #FFD964" }}
            >
                <Col lg={10} md={10} xs={10}>
                    <span className={`fs-5 `}>
                        Catch : {catchNo}
                    </span>
                    <span className={`fs-5 ms-2 `}>
                        ({alerts})
                    </span>
                </Col>
                    <Col lg={2} md={2} xs={2}>
                        <Button
                            variant="link"
                            className="ms- p-0"
                            onClick={handleClose}
                            style={{ color: "inherit" }}
                        >
                            <span className='bg-white rounded-circle p-1 d-flex justify-content-start  align-items-center ms-3'>
                                <FaCircleCheck size={25} color='green' />
                            </span>
                        </Button>
                    </Col>
            </div>
        </Row>
    );
};

export default AlertBadge;