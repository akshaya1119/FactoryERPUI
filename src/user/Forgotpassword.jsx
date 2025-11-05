import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Spinner, Dropdown } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import themeStore from './../store/themeStore';
import languageStore from './../store/languageStore';
import { useStore } from 'zustand';
import Logo1 from "./../assets/Logos/CUPLLogoTheme.png";
import redBrain from "./../assets/bgImages/brain/brainRed.png";
import greenBrain from "./../assets/bgImages/brain/brainGreen.png";
import blueBrain from "./../assets/bgImages/brain/brainBlue.png";
import pinkBrain from "./../assets/bgImages/brain/brainPink.png";
import purpleBrain from "./../assets/bgImages/brain/brainPurple.png";
import darkBrain from "./../assets/bgImages/brain/brainDark.png";
import brownBrain from "./../assets/bgImages/brain/brainBrown.png";
import lightBrain from "./../assets/bgImages/brain/brainLight.png";
import defaultBrain from "./../assets/bgImages/brain/brainDefault.png";
import { AiFillEyeInvisible } from "react-icons/ai";
import { AiFillEye } from "react-icons/ai";
import API from '../CustomHooks/MasterApiHooks/api';
import IndianFlag from './../assets/Icons/Hindi.png';
import UKFlag from './../assets/Icons/English.png';
import { useTranslation } from 'react-i18next';
import { error, success } from '../CustomHooks/Services/AlertMessageService';
import { ToastContainer } from 'react-toastify';

const ForgotPassword = () => {
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;
  const themeImages = {
    "purple-dark": purpleBrain,
    "blue-dark": blueBrain,
    "green-dark": greenBrain,
    "red-dark": redBrain,
    "dark-dark": darkBrain,
    "light-dark": lightBrain,
    "pink-dark": pinkBrain,
    "brown-dark": brownBrain,
    "default": defaultBrain
  };

  const navigate = useNavigate();
  const isMediumOrSmaller = useMediaQuery({ query: '(max-width: 992px)' });
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [answers, setAnswers] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [userQuestions, setUserQuestions] = useState([]);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setLanguage } = useStore(languageStore);
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleUserNameSubmit = async (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      error(t('pleaseEnterYourUserName'));
      return;
    }
    setLoading(true);

    try {
      const response = await API.get(`/Login/forgotPassword/securityQuestions/${userName}`);
      setUserQuestions(response.data);
      setCurrentStep(2);
      success(t('securityQuestionsLoadedSuccessfully'));
    } catch (err) {
      if (err.response?.status === 404) {
        error(t('noSecurityQuestionsFoundForThisUsername'));
      } else {
        error(t('anErrorOccurredWhileFetchingSecurityQuestions'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswers = async (e) => {
    e.preventDefault();
    if (answers.some(answer => !answer?.trim())) {
      error(t('pleaseAnswerAllSecurityQuestions'));
      return;
    }
    const data = {
      userName: userName,
      securityAnswer1: answers[0],
      securityAnswer2: answers[1]
    };

    try {
      await API.post('/Login/forgotPassword/verifySecurityAnswers', data);
      setCurrentStep(3);
      success(t('securityAnswersVerifiedSuccessfully'));
    } catch (err) {
      if (err.response?.status === 401) {
        error(t('securityAnswersAreIncorrect'));
      } else {
        error(t('anErrorOccurredWhileVerifyingSecurityAnswers'));
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error(t('passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 8) {
      error(t('passwordMustBeAtLeast8CharactersLong'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        userName: userName.toLowerCase(),
        newPassword: newPassword,
        securityAnswersVerified: true
      };

      const response = await API.post('/Login/forgotPassword/setNewPassword', payload);
      if (response.status === 200) {
        success(t('passwordResetSuccessfully'), {
          autoClose: 1500,
          onClose: () => navigate('/')
        });
      } else {
        error(t('anErrorOccurredWhileResettingPassword'));
      }
    } catch (err) {
      error(t('anErrorOccurredWhileResettingPassword'));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = value;
    setAnswers(updatedAnswers);
  };

  return (
    <Container fluid className="vh-100 position-relative overflow-hidden">
      <ToastContainer />
      <Dropdown className={`position-absolute ${customDarkBorder} rounded-3`} style={{ top: '20px', left: '20px', zIndex: 2 }}>
        <Dropdown.Toggle variant="light" id="language-dropdown" className="d-flex align-items-center">
          <img 
            src={i18n.language === 'hi' ? IndianFlag : UKFlag} 
            alt="Selected Language" 
            style={{ width: '20px', marginRight: '5px' }}
          />
          {i18n.language === 'hi' ? 'हिंदी' : 'English'}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item onClick={() => handleLanguageChange('en')} className="d-flex align-items-center">
            <img 
              src={UKFlag} 
              alt="UK Flag" 
              style={{ width: '20px', marginRight: '5px' }}
            />
            English
          </Dropdown.Item>
          <Dropdown.Item onClick={() => handleLanguageChange('hi')} className="d-flex align-items-center">
            <img 
              src={IndianFlag} 
              alt="Indian Flag" 
              style={{ width: '20px', marginRight: '5px' }}
            />
            हिंदी
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      {isMediumOrSmaller && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url(${themeImages[customDark] || defaultBrain})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(5px)',
            zIndex: -1,
          }}
        />
      )}
      <Row className="h-100 d-flex align-items-center justify-content-center shadow-lg">
        <Col
          lg={5}
          md={12}
          sm={12}
          className={`d-flex align-items-center justify-content-center p-0 m-0 shadow-lg ${isMediumOrSmaller ? '' : customDark}`}
          style={{ zIndex: 1, height: '100%', borderTopRightRadius: "15%", borderBottomRightRadius: "15%" }}
        >
          <div className="p-3 rounded-5 shadow-lg" style={{ width: '100%', maxWidth: '450px' }}>
            <div className={`text-center mb-2 rounded-3 ${customBtn}`}>
              <img src={Logo1} alt="Company Logo" className="img-fluid" style={{ maxWidth: '150px' }} />
            </div>

            {currentStep === 1 && (
              <Form onSubmit={handleUserNameSubmit} className="bg-white p-3 rounded-4 shadow-sm shadow-lg">
                <h3 className="text-center mb-4">{t('resetPassword')}</h3>
                <Form.Group controlId="formBasicUserName" className="mb-3">
                  <Form.Label>{t('enterUsername')}</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder={t('enterUsername')}
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button
                  type="submit"
                  className={`w-100 border-0 ${customBtn} custom-zoom-btn`}
                  disabled={loading}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : t('submitUsername')}
                </Button>
                <div className="text-center mt-3 custom-zoom-btn">
                  <Link to="/" className={`${customDark === "dark-dark" ? `text-dark` : `${customDarkText}`}`}>
                    {t('backToLogin')}
                  </Link>
                </div>
              </Form>
            )}

            {currentStep === 2 && (
              <Form onSubmit={handleSubmitAnswers} className="bg-white p-3 rounded-4 shadow-sm shadow-lg">
                <h3 className="text-center mb-4">{t("answerSecurityQuestions")}</h3>
                {userQuestions.map((question, index) => (
                  <Form.Group controlId={`securityQuestion${index}`} className="mb-3" key={index}>
                    <Form.Label>{`${t("question")} ${index + 1}: ${question.question}`}</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={t("yourAnswer")}
                      value={answers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      required
                    />
                  </Form.Group>
                ))}

                <Button
                  type="submit"
                  className={`w-100 border-0 ${customBtn} custom-zoom-btn`}
                  disabled={loading}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : t('submitAnswers')}
                </Button>
                <div className="text-center mt-3 custom-zoom-btn">
                  <Link to="/" className={`${customDark === "dark-dark" ? `text-dark` : `${customDarkText}`}`}>
                    {t("backToLogin")}
                  </Link>
                </div>
              </Form>
            )}

            {currentStep === 3 && (
              <Form onSubmit={handlePasswordSubmit} className="bg-white p-3 rounded-4 shadow-sm shadow-lg">
                <h3 className="text-center mb-4">{t("setNewPassword")}</h3>
                <Form.Group controlId="formNewPassword" className="mb-3">
                  <Form.Label>{t("newPassword")}</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showNewPassword ? "text" : "password"}
                      placeholder={t("enterNewPassword")}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength="8"
                      required
                    />
                    <span
                      className="position-absolute"
                      style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <AiFillEye size={20} className={`${customDark === "dark-dark" ? `` : `${customDarkText}`}`} /> : <AiFillEyeInvisible size={20} className={`${customDark === "dark-dark" ? `` : `${customDarkText}`}`} />}
                    </span>
                  </div>
                </Form.Group>

                <Form.Group controlId="formConfirmPassword" className="mb-3">
                  <Form.Label>{t("confirmNewPassword")}</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("confirmNewPassword")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength="8"
                      required
                    />
                    <span
                      className="position-absolute"
                      style={{ right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <AiFillEye size={20} className={`${customDark === "dark-dark" ? `` : `${customDarkText}`}`} /> : <AiFillEyeInvisible size={20} className={`${customDark === "dark-dark" ? `` : `${customDarkText}`}`} />}
                    </span>
                  </div>
                </Form.Group>

                <Button
                  type="submit"
                  className={`w-100 border-0 ${customBtn} custom-zoom-btn`}
                  disabled={
                    loading ||
                    newPassword.length < 8 ||
                    confirmPassword.length < 8 ||
                    newPassword !== confirmPassword
                  }
                >
                  {loading ? <Spinner animation="border" size="sm" /> : t('resetPassword')}
                </Button>
                <div className="text-center mt-3 custom-zoom-btn">
                  <Link to="/" className={`${customDark === "dark-dark" ? `text-dark` : `${customDarkText}`}`}>
                    {t("backToLogin")}
                  </Link>
                </div>
              </Form>
            )}
          </div>
        </Col>
        {!isMediumOrSmaller && (
          <Col lg={7} className="d-flex align-items-center justify-content-center p-0 position-relative">
            <img
              src={themeImages[customDark] || defaultBrain}
              alt="Forgot Password Illustration"
              className="img-fluid"
              style={{ objectFit: 'contain', maxHeight: '100vh' }}
            />
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default ForgotPassword;
