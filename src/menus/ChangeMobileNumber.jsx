import React, { useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { AiFillCloseSquare } from "react-icons/ai";

const ChangeMobileNumber = ({ currentMobileNumber, onSave }) => {
  // Theme Change Section
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const customDark = cssClasses[0];
  const customMid = cssClasses[1];
  const customLight = cssClasses[2];
  const customBtn = cssClasses[3];
  const customDarkText = cssClasses[4];
  const customLightText = cssClasses[5];
  const customLightBorder = cssClasses[6];
  const customDarkBorder = cssClasses[7];

  const [show, setShow] = useState(false);
  const [newMobileNumber, setNewMobileNumber] = useState(currentMobileNumber.replace(/^\+\d+/, '')); // Extract just the number
  const countryCode = '+91 '; // Default country code

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleSave = () => {
    const fullMobileNumber = `${countryCode}${newMobileNumber}`; // Combine country code and number
    onSave(fullMobileNumber); // Pass new number to parent
    handleClose();
  };

  return (
    <>
      <Button
        variant="dark"
        className={`mt-3 custom-zoom-btn text-light w-100 d-none d-md-block d-lg-block  ${customBtn} ${customDarkBorder}`}
        onClick={handleShow}
      >
        Change Mobile Number
      </Button>
      <Button
        variant="dark"
        className={`mt-3 custom-zoom-btn text-light w-100 d-md-none d-lg-none  ${customBtn} ${customDarkBorder}`}
        onClick={handleShow}
      >
        Change Mobile Number
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton={false} className={`d-flex justify-content-between ${customDark}  ${customLightText} ${customDark === "dark-dark" ? "border border-bottom-0" : ""}`}>

          <div>
            <Modal.Title>Change Mobile Number</Modal.Title>
          </div>
          <div>
            <Button
              variant="link"
              className={`close-button ${customDark} ${customLightText} `}
              style={{ padding: 0 }}
              onClick={handleClose}
            >
              <AiFillCloseSquare size={30} className='rounded-5' />
            </Button>
          </div>
        </Modal.Header>
        <Modal.Body className={`${customDark} ${customDarkText} ${customDark === "dark-dark" ? "border border-top-0 border-bottom-0" : ""}`}>
          <Form.Group controlId="formCurrentMobile" >
            <Form.Label className={`${customLightText}`}>Current Mobile Number</Form.Label>
            <Form.Control type="text" value={currentMobileNumber} disabled />
          </Form.Group>
          <Form.Group controlId="formNewMobile" className="mt-3">
            <Form.Label className={`${customLightText}`}>New Mobile Number</Form.Label>
            <InputGroup>
              <InputGroup.Text className={`${customLightText} ${customDark}`}>{countryCode}</InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Enter new mobile number"
                value={newMobileNumber}
                onChange={(e) => setNewMobileNumber(e.target.value)}
              />
            </InputGroup>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className={`d-flex justify-content-between ${customDark}  ${customLightText} ${customDark === "dark-dark" ? "border border-top-0" : ""}`}>
          <Button variant="danger" onClick={handleClose} className={`${customDark==="red-dark"?"border":""}`}>
            Cancel
          </Button>
          <Button variant="" onClick={handleSave} className={`${customLight} ${customDarkText} ${customDark === "dark-dark" ? "border":""}`}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ChangeMobileNumber;
