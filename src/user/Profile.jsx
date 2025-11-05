import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPencilAlt, FaLock } from 'react-icons/fa';
import 'bootstrap/dist/css/bootstrap.min.css';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import SampleUser from "./../assets/sampleUsers/defaultUser.jpg";
import "./../styles/Profile.css";
import { useUserData, useUserDataActions } from '../store/userDataStore';
import API from '../CustomHooks/MasterApiHooks/api';
import { useTranslation } from 'react-i18next';
import ScreenLockPin from './ScreenLockPin';
import { success } from '../CustomHooks/Services/AlertMessageService';

const UserProfile = () => {
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, , customLightBorder, customDarkBorder] = cssClasses;

  const userData = useUserData();
  const { fetchUserData, refreshUserData, updateUserData } = useUserDataActions();
  const [isEditing, setIsEditing] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileImageKey, setProfileImageKey] = useState(Date.now());
  const [roles, setRoles] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const APIUrlBase = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      await fetchUserData();
      await fetchRoles();
      setIsLoading(false);
    };
    loadUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (userData && roles.length > 0) {
      const role = roles.find(role => role.roleId === userData.roleId);
      setUserRole(role ? role.roleName : '');
    }
  }, [userData, roles]);

  const fetchRoles = async () => {
    try {
      const response = await API.get('/Roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleImageClick = (event) => {
    event.stopPropagation();
    setIsZoomed(true);
  };

  const handleZoomedImageClick = () => {
    setIsZoomed(false);
  };

  const handleDocumentClick = () => {
    setIsZoomed(false);
  };

  React.useEffect(() => {
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const handleEditImageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          if (userData?.profileImage === SampleUser) {
            await uploadImage(file);
          } else {
            await updateProfilePicture(file);
          }
          await refreshUserData();
          setProfileImageKey(Date.now());
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const uploadImage = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await API.post('/User/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      await refreshUserData();
      window.location.reload();
      console.log('Upload successful');
    } catch (error) {
      console.error('Upload failed', error);
    }
  };

  const updateProfilePicture = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      await API.put(`/User/updateProfilePicture/${userData.userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      await refreshUserData();
      // window.location.reload();
      success(t('profilePictureUpdatedSuccessfully'));
    } catch (error) {
      console.error('Update failed', error);
      error(t('failedToUpdateProfilePicture'));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateUserData({ ...userData, [name]: value });
  };

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return SampleUser;
    if (!isValidImageFormat(imagePath)) return SampleUser;
    return imagePath.startsWith('http') ? imagePath : `${APIUrlBase}/${imagePath}?${profileImageKey}`;
  };

  const isValidImageFormat = (imagePath) => {
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
    const extension = imagePath.split('.').pop().toLowerCase();
    return validExtensions.includes(extension);
  };

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  if (!userData) {
    return <div>{t('errorUnableToLoadUserData')}</div>;
  }
  const welcomeLabel = t('welcome');
const userName = userData.firstName;
  return (
    <Container className="my-4">
      <div className={`d-flex justify-content-between align-items-center ${customDark} ${customDark === 'dark-dark' ? `${customLightBorder} border-top border-start border-end border-light border-bottom-0` : ""} 
      ${customBtn === 'dark-dark' ? "" : ""} text-white p-3 rounded-top`}>
        <div className="greet">
          <h2>{`${welcomeLabel} ${userName}`}</h2>
          <p className="mb-0 d-none d-md-block">
            {new Intl.DateTimeFormat('en-US', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              weekday: 'long',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              hour12: true,
            }).format(currentDateTime)}
          </p>
        </div>
        <OverlayTrigger
          placement="top"
          overlay={<Tooltip>{t('changeScreenLockPin')}</Tooltip>}
        >
          <Button 
            variant="link"
            size="sm"
            className={`${customDark === 'dark-dark' ? customDark : customLight}`}
            onClick={() => setShowPinModal(true)}
          >
            <FaLock size={24} className={customDarkText} />
          </Button>
        </OverlayTrigger>
        <ScreenLockPin 
          show={showPinModal} 
          onHide={() => setShowPinModal(false)} 
        />
      </div>
      <div className={`p-4 rounded-bottom shadow-lg ${customLight} ${customDark === 'dark-dark' ? `${customDarkBorder} border-1` : "border-light"}`}>
        <Row className="align-items-center mb-4">
          <Col xs={12} sm={3} md={2} className="text-center position-relative">
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip>{t('clickToZoom')}</Tooltip>}
            >
              <img
                src={getProfileImageUrl(userData.profilePicturePath)}
                alt={t('profilePicture')}
                width="100px"
                height="100px"
                className={`rounded-circle ${customDarkBorder}`}
                onClick={handleImageClick}
              />
            </OverlayTrigger>
            <sub>
              <OverlayTrigger
                placement="bottom"
                overlay={<Tooltip>{t('editProfilePicture')}</Tooltip>}
              >
                <Button
                  variant="link"
                  className={`position-absolute p-0 rounded-circle ${customDark === "dark-dark" ? `${customMid} ${customDarkText} ${customDarkBorder} border-2` : `${customDarkText} ${customMid} ${customDarkBorder}`}`}
                  style={{
                    bottom: '0',
                    right: '0',
                    transform: 'translate(50%, 50%)',
                    width: '30px',
                    height: '30px',
                    padding: '0',
                  }}
                  onClick={handleEditImageClick}
                >
                  <FaPencilAlt
                    className="p-1"
                    style={{ width: '100%', height: '100%' }}
                  />
                </Button>
              </OverlayTrigger>
            </sub>
            {isZoomed && (
              <div className={`zoomed-image rounded-circle ${isZoomed ? 'show' : 'hide'}`} onClick={handleZoomedImageClick}>
                <img src={getProfileImageUrl(userData.profilePicturePath)} alt="" width="200px" className="rounded-circle" />
              </div>
            )}
          </Col>
          <Col xs={12} sm={12} md={8} className="mt-3">
            <h4 className={`${customDarkText}`}>{userData.userName}</h4>
            <p className={`text-muted mb-0 ${customDarkText}`}>{`${userData.firstName} ${userData.middleName} ${userData.lastName}`}</p>
          </Col>
          
        </Row>
        <Form>
          <Row className="mb-3">
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="formFirstName">
                <Form.Label className={`${customDarkText}`}>{t('firstName')}</Form.Label>
                <Form.Control
                  name="firstName"
                  placeholder={t('yourFirstName')}
                  value={userData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className='rounded'
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="formMiddleName">
                <Form.Label className={`${customDarkText}`}>{t('middleName')}</Form.Label>
                <Form.Control
                  name="middleName"
                  placeholder={t('yourMiddleName')}
                  value={userData.middleName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className='rounded'
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Group controlId="formLastName">
                <Form.Label className={`${customDarkText}`}>{t('lastName')}</Form.Label>
                <Form.Control
                  name="lastName"
                  placeholder={t('yourLastName')}
                  value={userData.lastName}
                  className='rounded'
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs={12} sm={6} md={4} className="mb-3">
              <Form.Group controlId="formGender">
                <Form.Label className={`${customDarkText}`}>{t('gender')}</Form.Label>
                <Form.Select
                  name="gender"
                  value={userData.gender}
                  onChange={handleChange}
                  disabled={!isEditing}
                >
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Group controlId="formRole">
                <Form.Label className={`${customDarkText}`}>{t('role')}</Form.Label>
                <Form.Control
                  name="role"
                  placeholder={t('yourRole')}
                  value={userData.role.roleName}
                  className='rounded'
                  disabled
                />
              </Form.Group>
            </Col>
            <Col xs={12} sm={6} md={4}>
              <Form.Group controlId="formMobile">
                <Form.Label className={`${customDarkText}`}>{t('mobileNumber')}</Form.Label>
                <Form.Control
                  name="mobileNumber"
                  placeholder={t('yourMobileNumber')}
                  value={userData.mobileNo}
                  className='rounded'
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12}>
              <Form.Group controlId="formAddress">
                <Form.Label className={`${customDarkText}`}>{t('address')}</Form.Label>
                <Form.Control
                  name="address"
                  placeholder={t('yourAddress')}
                  value={userData.address}
                  className='rounded'
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </div>
    </Container>
  );
};

export default UserProfile;
