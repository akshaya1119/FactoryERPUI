import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
// import './Footer.css'; // Import the CSS file for additional styling if needed

import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  //Theme Change Section
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const customDark = cssClasses[0];
  const customMid = cssClasses[1];
  const customLight = cssClasses[2];
  const customBtn = cssClasses[3];

  return (
    <footer className={`sticky-bottom ${customDark} text-light py-3 border-top  border-white`}>
    <Container>
      <Row className="align-items-center justify-content-between">
        <Col xs="6" className="text-start text-md-start">
          <span className="text-responsive">{t('cuplAllRightsReserved')}</span>
        </Col>
        <Col xs="6" className="text-end text-md-end">
          <span className="text-responsive">{t('poweredByCupl')}</span>
        </Col>
      </Row>
    </Container>
  </footer>
  );
};

export default Footer;
