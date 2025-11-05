import React, { useState } from 'react';
import { Button, Offcanvas } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './../styles/sidebar.css';

const Sidebar = () => {
  const [show, setShow] = useState(false);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <>
      {/* Button to toggle sidebar */}
      <Button variant="primary" onClick={handleShow}>
        Open Sidebar
      </Button>

      {/* Sidebar using Offcanvas */}
      <Offcanvas show={show} onHide={handleClose} placement="start">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Sidebar</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          This is sidebar content.
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default Sidebar;
