import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { Form, Button, Row, Col } from 'react-bootstrap'; // Updated to use React Bootstrap
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { validateFormData } from './../scripts/addUsersValidations';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import SuccessModal from './../menus/addedUserModal.jsx';
import API from '../CustomHooks/MasterApiHooks/api.jsx';
import { useTranslation } from 'react-i18next';
import { useUserData } from '../store/userDataStore.jsx';


const AddUsers = () => {
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const customDarkText = cssClasses[4];
  const customBtn = cssClasses[3];
  const [displayName, setDisplayName] = useState("");
  // Initial state for the form data
  const initialState = {
    username: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    mobileNo: '',
    roleId: '',
    status: true,
    address: '',
    profilePicturePath: "",
  };
  const [usernameError, setUsernameError] = useState('');
  const [formData, setFormData] = useState(initialState);
  const [userDetails, setUserDetails] = useState({ userName: '', password: '' });
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(false);
  const [roles, setRoles] = useState([]);
  const userData = useUserData();
  console.log(userData)

  const handleCloseModal = () => {
    setShowModal(false);
    handleReset();
  };

  // Function to check if all required fields are filled
  const areRequiredFieldsFilled = () => {
    return (
      formData.firstName &&
      formData.gender &&
      formData.mobileNo &&
      formData.roleId &&
      formData.address &&
      isUsernameValid(formData.username)
    );
  };

  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation logic for required fields
    const requiredFields = [
      { name: 'firstName', value: formData.firstName },
      { name: 'gender', value: formData.gender },
      { name: 'mobileNo', value: formData.mobileNo },
      { name: 'roleId', value: formData.roleId },
      { name: 'address', value: formData.address },
    ];
    setDisplayName(`${formData.firstName} ${formData.middleName} ${formData.lastName}`);
    const errors = requiredFields
      .filter(field => !field.value)
      .map(field => `${field.name.charAt(0).toUpperCase() + field.name.slice(1)} is required`);
    // Clear previous notifications
    toast.dismiss();
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error)); // Display errors using toast
    } else {
      const { success } = validateFormData(formData); // Validate the form data
      if (success) {
        try {
          const response = await API.post('/User/create', formData); // API call to add user
          const { userName, password } = response.data;
          
          // Only show modal if password is returned
          if (password) {
            setUserDetails({ userName, password });
            setShowModal(true);
          }
          
          toast.success(t('userAddedSuccessfully'));
        } catch (error) {
          toast.error(t('failedToAddUser') + error.response.data.message);
        }
      }
    }
  };
  // Function to handle input changes
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await API.get('/Roles');
        // Filter out roles with status false
        const activeRoles = response.data.filter(role => role.status === true)
        .filter(role => userData.role && role.roleId > userData.role.roleId);
        setRoles(activeRoles);
      } catch (error) {
        console.error(t('failedToFetchRoles'), error);
      }
    };

    fetchRoles();
  }, [t, userData.role?.roleId]);

  // Generate username suggestion based on input
  useEffect(() => {
    const { firstName, middleName, lastName } = formData;
    let usernameBase = '';

    const getRandomChars = (str, count) => {
      const chars = str.replace(/\s/g, '').split('');
      return Array.from({ length: count }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const getRandomDigits = (count) => {
      return Math.floor(Math.random() * Math.pow(10, count)).toString().padStart(count, '0');
    };

    if (firstName) {
      usernameBase = firstName.slice(0, 3).toLowerCase(); // Get first 3 characters of firstName
      if (middleName && lastName) {
        usernameBase += getRandomChars(middleName, 1) + getRandomChars(lastName, 1);
      } else if (lastName) {
        usernameBase += getRandomChars(lastName, 2);
      }
    }

    let usernameSuggestion = usernameBase + getRandomDigits(2);

    // Ensure username length is between 6 and 8 characters
    if (usernameSuggestion.length > 8) {
      usernameSuggestion = usernameSuggestion.slice(0, 8);
    } else if (usernameSuggestion.length < 6) {
      usernameSuggestion += getRandomDigits(6 - usernameSuggestion.length);
    }

    if (usernameSuggestion.length >= 6 && usernameSuggestion.length <= 8) {
      setFormData((prev) => ({ ...prev, username: usernameSuggestion }));
      setUsernameError('');
    } else {
      setUsernameError(t('usernameMustBeBetween6And8Characters'));
    }
  }, [formData.firstName, formData.middleName, formData.lastName, t]);

  // Validate username length and content
  const isUsernameValid = (username) => {
    const hasAtLeastTwoNumbers = (username.match(/\d/g) || []).length >= 2;
    const isCorrectLength = username.length >= 6 && username.length <= 8;
    const isNotAllAlphabets = /[^a-zA-Z]/.test(username);
    return hasAtLeastTwoNumbers && isCorrectLength && isNotAllAlphabets;
  };

  const handleMobileNumberChange = (event) => {
    let value = event.target.value.replace(/\D/g, ''); // Allow only numbers

    if (value.length > 10) {
      value = value.slice(0, 10); // Truncate if there are more than 10 digits
    }

    setFormData({ ...formData, mobileNo: value });

    // Mobile number validation
    if (value.length !== 10) {
      setMessage(t('mobileNumberMustBeExactly10Digits'));
    } else {
      setMessage(''); // Clear message when valid
    }
  };


  // Function to handle reset
  const handleReset = () => {
    setFormData(initialState); // Reset to the initial state
    setUsernameError('');
  };

  return (
    <div style={{ padding: '20px', borderRadius: '8px' }}>
      <h4 className={`${customDarkText}`}>{t('addUsers')}</h4>
      <Form onSubmit={handleSubmit}>
        {/* First Row: First Name, Middle Name, Last Name */}
        <Row className="mb-3">
          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label className={customDarkText}>{t('firstName')}: <span style={{ color: 'red' }}>*</span></Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                placeholder={t('enterFirstName')}
                value={formData.firstName}
                onChange={handleInputChange}
                required
                autoComplete='off'
              />
            </Form.Group>
          </Col>

          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label className={customDarkText}>{t('middleName')}:</Form.Label>
              <Form.Control
                type="text"
                name="middleName"
                placeholder={t('enterMiddleName')}
                value={formData.middleName}
                onChange={handleInputChange}
                autoComplete='off'
              />
            </Form.Group>
          </Col>

          <Col xs={12} md={4}>
            <Form.Group>
              <Form.Label className={customDarkText}>{t('lastName')}:</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                placeholder={t('enterLastName')}
                value={formData.lastName}
                onChange={handleInputChange}
                autoComplete='off'
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Username Suggestion */}
        <Row className="mb-3">
          <Col lg={6} md={12} sm={12} xs={12}>
            <Form.Group>
              <Form.Label className={customDarkText}>{t('username')} :<span style={{ color: 'red' }}>*</span></Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange} // Allow manual editing
                isInvalid={!isUsernameValid(formData.username) && formData.username.length > 0} // Conditional error styling
              />
              <Form.Control.Feedback type="invalid">
                {t('usernameMustBe6To8CharactersLongContainAtLeast2NumbersAndNotBeEntirelyAlphabetic')}
              </Form.Control.Feedback>
            </Form.Group>
          </Col>

          <Col lg={6} md={12} sm={12} xs={12}>
            <Form.Group>
              <Form.Label className={customDarkText}>{t('gender')}: <span style={{ color: 'red' }}>*</span></Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">{t('selectGender')}</option>
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="others">{t('others')}</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Row className="mb-3">
          <Col lg={6} md={12} sm={12} xs={12}>
            <Form.Group>
              <Form.Label className={customDarkText}>{t('mobileNumber')}: <span style={{ color: 'red' }}>*</span></Form.Label>
              <Form.Control
                maxLength={10}
                minLength={10}
                type="text"
                name="mobileNo"
                placeholder={t('enterMobileNumber')}
                value={formData.mobileNo}
                onChange={handleMobileNumberChange}
                required
              />
            </Form.Group>
          </Col>
          <Col lg={6} md={12} sm={12} xs={12}>
            <Form.Group>
              <Form.Label className={customDarkText}>{t('role')}: <span style={{ color: 'red' }}>*</span></Form.Label>
              <Form.Select
                name="roleId"
                value={formData.roleId}
                onChange={handleInputChange}
                required
              >
                <option value="">{t('selectARole')}</option>
                {roles.map(role => (
                  <option key={role.roleId} value={role.roleId}>
                    {role.roleName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col lg={12} md={12} sm={12} xs={12} className='mt-3'>
            <Form.Group controlId="formBasicAddress">
              <Form.Label className={customDarkText}>{t('address')}: <span style={{ color: 'red' }}>*</span></Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder={t('address')}
                required
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Add and Reset Buttons */}
        <div style={{ textAlign: 'right' }}>
          <Button variant="secondary" onClick={handleReset} className='custom-zoom-btn' style={{ width: '100px' }}>
            {t('reset')}
          </Button>
          <Button 
            type="submit" 
            className={`ms-2 ${customBtn === "dark-dark" ? `${customBtn}  custom-zoom-btn ` : `${customBtn}  custom-zoom-btn`} ${areRequiredFieldsFilled() ? `border border-white` : `border-0`} text-white`} 

            disabled={!areRequiredFieldsFilled()}
            style={{ width: '100px' }}
          >
            {t('add')}
          </Button>
        </div>
      </Form>
      <div>
        <ToastContainer style={{ marginTop: "50px" }} autoClose={2000} />
      </div>
      <SuccessModal
        show={showModal} username={userDetails.userName} password={userDetails.password} onClose={handleCloseModal} fullName={displayName}
      />
    </div>
  );
};
export default AddUsers;
