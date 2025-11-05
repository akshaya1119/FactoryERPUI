import React, { useState, useEffect, useRef } from 'react';
import { FaUserCircle, FaPowerOff } from 'react-icons/fa';
import { ImProfile } from "react-icons/im";
import { IoSettingsSharp } from "react-icons/io5";
import { RiLockPasswordFill } from "react-icons/ri";
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Modal, Button } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import "./../styles/userMenu.css"
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import SampleUser from "./../assets/sampleUsers/defaultUser.jpg";
import { useUserData, useUserDataActions } from '../store/userDataStore';
import { useMediaQuery } from 'react-responsive';
import { useTranslation } from 'react-i18next';
import AuthService from '../CustomHooks/ApiServices/AuthService';
import { openCustomUiSidebar } from './CustomUi';

const UserMenu = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, , customBtn] = cssClasses;
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const userData = useUserData();
  const { fetchUserData, clearUserData } = useUserDataActions();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const menuRef = useRef(null);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleLogoutClick = () => setShowModal(true);
  const handleProfileClick = () => navigate('/profile');
  const handleSettingsClick = () => {
    console.log("Trigger the right side bar.")
  };
  const handleChangePasswordClick = () => navigate('/change-password');

  const handleLogoutConfirm = () => {
    clearUserData();
    AuthService.logout();
    localStorage.setItem('loggedOut', 'true');
    navigate('/');
    setShowModal(false);
    onClose();
  };

  const handleClose = () => setShowModal(false);

  const isValidImageUrl = (url) => url && url.match(/\.(jpeg|jpg|gif|png)$/) != null;

  return (
    <div
      ref={menuRef}
      className={`card p-3 rounded shadow-sm ${customDark} border mt-1`}
      style={{
        minWidth: isMobile ? '100%' : '200px',
        maxWidth: isMobile ? '100%' : '300px',
      }}
    >
      <div className="text-center mb-2 custom-zoom-btn">
        <div style={{ 
          width: isMobile ? '60px' : '80px', 
          height: isMobile ? '60px' : '80px',
          margin: '0 auto',
          overflow: 'hidden',
          borderRadius: '50%'
        }}>
          {userData?.profilePicturePath && isValidImageUrl(`${import.meta.env.VITE_API_BASE_URL}/${userData.profilePicturePath}`) ? (
            <img
              src={`${import.meta.env.VITE_API_BASE_URL}/${userData.profilePicturePath}`}
              alt=""
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover'
              }}
            />
          ) : (
            <img
              src={SampleUser}
              alt=""
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover'
              }}
            />
          )}
        </div>
      </div>
      <ul className="list-unstyled">
        {[/* eslint-disable */
          { icon: <ImProfile />, text: 'profile', route: '/profile', onClick: handleProfileClick },
          { icon: <IoSettingsSharp />, text: 'mySettings', onClick: openCustomUiSidebar },
          { icon: <RiLockPasswordFill />, text: 'changePassword', route: '/change-password', onClick: handleChangePasswordClick },
          { icon: <FaPowerOff />, text: 'logout', onClick: handleLogoutClick },
        ].map((item, index) => (
          <li key={index} className={`p-2 ${index !== 3 ? 'border-bottom' : ''} d-flex align-items-center custom-zoom-btn`}>
            <span className="me-2 text-light">{item.icon}</span>
            {index === 3 ? (
              <button
                onClick={item.onClick}
                className="btn text-decoration-none text-light d-block p-0 border-0 bg-transparent"
                style={{ cursor: 'pointer' }}
              >
                {t(item.text)}
              </button>
            ) : (
              <Link to={item.route} className="text-decoration-none text-light d-block" onClick={item.onClick}>
                {t(item.text)}
              </Link>
            )}
          </li>
        ))}
      </ul>

      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton={false} className={`${customDark} ${customBtn} ${customDark === 'dark-dark' ? "border border-bottom-0" : ""}`}>
          <Modal.Title>{t('confirmLogout')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={`${customDark} ${customBtn} ${customDark === 'dark-dark' ? "border border-top-0 border-bottom-0" : ""}`}>
          {t('areYouSureYouWantToLogOut')}
        </Modal.Body>
        <Modal.Footer className={`${customDark} ${customBtn} ${customDark === 'dark-dark' ? "border border-top-0" : ""}`}>
          <Button variant="light" onClick={handleClose} className={`${customDark === 'dark-dark' ? `${customMid} text-light` : `${customDark} text-white`}`}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={handleLogoutConfirm}
            className={customDark === 'red-dark' ? 'text-danger bg-white' : ''}
          >
            {t('logout')}
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer />
    </div>
  );
}

export default UserMenu;
