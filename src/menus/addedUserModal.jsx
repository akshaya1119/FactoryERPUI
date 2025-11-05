import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { FaClipboard, FaExclamationTriangle } from 'react-icons/fa'; // Import clipboard and alert icons
import { notification } from 'antd'; // Import AntD notification
import 'antd/dist/reset.css'; // Import Ant Design styles
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import Clipboard from 'clipboard';
import { useTranslation } from 'react-i18next';

const AddUserModal = ({ show, username, password, onClose, fullName }) => {
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const customDark = cssClasses[0];
  const customMid = cssClasses[1]; 
  const customLight = cssClasses[2];
  const customBtn = cssClasses[3];
  const customDarkText = cssClasses[4];
  const customLightBorder = cssClasses[6];
  const customDarkBorder = cssClasses[7];

  const [countdown, setCountdown] = useState(5); // Countdown state
  const [isClosingEnabled, setIsClosingEnabled] = useState(false); // State to manage close button enabling

  useEffect(() => {
    if (show) {
      setIsClosingEnabled(false); // Disable closing initially
      setCountdown(5); // Reset countdown
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsClosingEnabled(true); // Enable closing after countdown
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval); // Clear interval on unmount
    }
  }, [show]);

  const handleClose = () => {
    if (isClosingEnabled) {
      onClose(); // Call the onClose prop to manage modal visibility in the parent component
    }
  };

  // Function to copy text to clipboard and show AntD notification
  const handleCopyToClipboard = (text, label) => {
    const clipboard = new Clipboard('.copy-btn', {
      text: () => text,
    });

    clipboard.on('success', () => {
      notification.success({
        message: t('copySuccessTitle', { label }),
        description: t('copySuccessDescription', { label }),
        placement: 'bottomRight',
      });
      clipboard.destroy();
    });

    clipboard.on('error', (err) => {
      console.error('Failed to copy text: ', err);
      notification.error({
        message: t('copyFailedTitle'),
        description: t('copyFailedDescription'),
        placement: 'bottomRight',
      });
    });
  };

  // Function to copy both username and password to clipboard
  const handleCopyBothToClipboard = () => {
    const combinedText = `${t('yourUsername')}: ${username}\n${t('yourTemporaryPassword')}: ${password}`;
    navigator.clipboard.writeText(combinedText)
      .then(() => {
        notification.success({
          message: t('credentialsCopiedTitle'),
          description: t('credentialsCopiedDescription'),
          placement: 'bottomRight',
        });
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false}>
      <Modal.Header className={`${customDark === "dark-dark" ? `${customDarkText} ${customDark}` : `${customDark} text-light`} d-flex justify-content-center`}>
        <Modal.Title>{t('userAddedSuccessfully')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        {/* Disclaimer Section */}
        <div className="d-flex align-items-center text-danger mb-3 justify-content-center">
          <FaExclamationTriangle style={{ marginRight: '5px' }} />
          <strong>{t('noteCredentialsCarefully')}</strong>
        </div>

        <p>{t('userAddedSuccessMessage', { fullName })}</p>

        <div className="d-flex align-items-center justify-content-between">
          <strong>{t('username')}:</strong>
          <div>
            {username}
            <Button
              variant="link"
              onClick={() => handleCopyToClipboard(username, t('username'))}
              style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center' }}
            >
              {t('copyUsername')} <FaClipboard style={{ marginLeft: '5px' }} />
            </Button>
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between mt-3">
          <strong>{t('password')}:</strong>
          <div>
            {password}
            <Button
              variant="link"
              onClick={() => handleCopyToClipboard(password, t('password'))}
              style={{ marginLeft: '10px', display: 'inline-flex', alignItems: 'center' }}
              className="copy-btn"
            >
              {t('copyPassword')} <FaClipboard style={{ marginLeft: '5px' }} />
            </Button>
          </div>
        </div>

        {/* New Button to Copy Both */}
        <div className="d-flex align-items-center justify-content-between mt-3">
          <Button
            onClick={handleCopyBothToClipboard}
            style={{ display: 'inline-flex', alignItems: 'center' }}
            className={`${customDark === "dark-dark" ? `${customBtn} border-light custom-zoom-btn` : `${customBtn} border-0 custom-zoom-btn`} copy-btn`}
          >
            {t('copyCredentials')} <FaClipboard style={{ marginLeft: '5px' }} />
          </Button>
        </div>

        {/* Countdown Timer */}
        <div className="text-center mt-4">
          {isClosingEnabled ? (
            <span>{t('canCloseWindow')}</span>
          ) : (
            <span>{t('waitBeforeClosing', { seconds: countdown })}</span>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className={`${customDark === "dark-dark" ? `${customBtn} border-light custom-zoom-btn` : `${customBtn} border-0 custom-zoom-btn`}`}
          onClick={handleClose}
          disabled={!isClosingEnabled} // Disable button until countdown finishes
        >
          {t('close')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddUserModal;
