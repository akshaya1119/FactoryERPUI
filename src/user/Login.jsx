import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Dropdown } from 'react-bootstrap';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import BlueTheme from './../assets/bgImages/Factory.svg';
import PurpleTheme from './../assets/bgImages/FactoryPurple.png';
import DefaultTheme from './../assets/bgImages/FactoryDefault.png';
import GreenTheme from './../assets/bgImages/FactoryGreen.png';
import RedTheme from './../assets/bgImages/FactoryRed.png';
import DarkTheme from './../assets/bgImages/FactoryDark.png';
import BrownTheme from './../assets/bgImages/FactoryBrown.png';
import PinkTheme from './../assets/bgImages/FactoryPink.png';
import LightTheme from './../assets/bgImages/FactoryLight.png';
import Logo1 from './../assets/Logos/CUPLLogoTheme.png';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { useMediaQuery } from 'react-responsive';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import AuthService from '../CustomHooks/ApiServices/AuthService';
import IndianFlag from './../assets/Icons/Hindi.png';
import UKFlag from './../assets/Icons/English.png';
import languageStore from './../store/languageStore';
import { success, error, info } from '../CustomHooks/Services/AlertMessageService';


const Login = () => {
  const isLoggedIn = AuthService.isLoggedIn();
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Theme Change Section
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;

  const themeImages = {
    "purple-dark": PurpleTheme,
    "blue-dark": BlueTheme,
    "green-dark": GreenTheme,
    "red-dark": RedTheme,
    "dark-dark": DarkTheme,
    "light-dark": LightTheme,
    "pink-dark": PinkTheme,
    "brown-dark": BrownTheme,
    default: DefaultTheme,
  };

  const isMediumOrSmaller = useMediaQuery({ query: "(max-width: 992px)" });
  const isTabletPortrait = useMediaQuery({
    query: "(max-width: 768px) and (orientation: portrait)",
  });

  const appliedClass = !isMediumOrSmaller ? customDark : "";

  const { setLanguage } = useStore(languageStore);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/cudashboard');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      info(t("processing..."), true);

      const response = await AuthService.login(userName, password);

      if (response.status === 200) {
        success(t('loginSuccessful'));

        const { autogenPass } = response.data;
        
        if (autogenPass) {
          setTimeout(() => {
            navigate('/setpassword');
          }, 1500);
        } else {
          setTimeout(() => {
            navigate('/cudashboard');
          }, 1500);
        }
      } else {
        error(t("unexpectedResponse"));
      }
    } catch (err) {
      if (err.response) {
        switch (err.response.status) {
          case 400:
            error(t("badRequest"));
            break;
          case 401:
            error(t("invalidUserNameOrPassword"));
            break;
          case 403:
            error(t("forbiddenYouDoNotHaveAccess"));
            break;
          case 404:
            error(t("invalidUserNameOrPassword"));
            break;
          case 500:
            error(t("serverErrorPleaseTryAgainLater"));
            break;
          default:
            error(t(`Error: ${err.response.data.message || "anErrorOccurred"}`));
        }
      } else if (err.request) {
        error(t("noResponseFromTheServerPleaseCheckYourNetwork"));
      } else {
        error(t(`error: ${err.message}`));
      }
    }
  };

  useEffect(() => {
    if (localStorage.getItem('loggedOut')) {
      success(t('successfullyLoggedOut'));
      localStorage.removeItem('loggedOut');
    }
  }, []);

  return (
    <Container fluid className="vh-100 position-relative overflow-hidden">
      <ToastContainer />
      <Dropdown className={`position-absolute ${customDarkBorder} rounded-3`} style={{ top: '20px', right: '20px', zIndex: 2 }}>
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
      {isTabletPortrait && (
        <img
          src={themeImages[customDark] || DefaultTheme}
          alt="Background Image"
          className="position-absolute w-100 h-100"
          style={{
            objectFit: "cover",
            zIndex: -1,
            filter: "blur(8px)",
            top: 0,
            left: 0,
          }}
        />
      )}
      <Row className="h-100">
        <Col
          lg={7}
          className="d-none d-lg-flex align-items-center justify-content-center p-0"
        >
          <img
            src={themeImages[customDark] || DefaultTheme}
            alt="Login Theme"
            className="w-100"
            style={{ objectFit: "contain", maxHeight: "100vh" }}
          />
        </Col>

        <Col lg={5} md={12} className={`d-flex align-items-center justify-content-center ${appliedClass}`} style={{ borderTopLeftRadius: "15%", borderBottomLeftRadius: "15%" }}>
          <div className={`shadow-lg rounded-5  p-3 ${customDark === "dark-dark" ? `${customMid}` : ""}`} style={{ maxWidth: '450px', width: '100%', position: 'relative', zIndex: 1 }}>
            <div className={`text-center mb-4 ${customDark} rounded-3`}>
              <img
                src={Logo1}
                alt="Logo"
                className="img-fluid"
                style={{ maxWidth: "250px" }}
              />
            </div>

            <Form className="p-4 bg-white rounded-3" onSubmit={handleSubmit}>
              <h2
                className={`text-center mb-4 ${customDark === "dark-dark" ? "" : `${customDarkText}`
                  }`}
              >
                {t('webtitle')}
              </h2>

              <Form.Group controlId="formBasicuserName">
                <Form.Label>{t("username")}</Form.Label>
                <Form.Control
                  type="text"
                  placeholder={t("enterUsername")}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group controlId="formBasicPassword" className="mt-3">
                <Form.Label>{t("password")}</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder={t("password")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                  <span
                    className="position-absolute"
                    style={{ right: "10px", top: "5px", cursor: "pointer" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <AiFillEye size={20} className={`${customDark === "dark-dark" ? `` : `${customDarkText}`}`} />
                    ) : (
                      <AiFillEyeInvisible size={20} className={`${customDark === "dark-dark" ? `` : `${customDarkText}`}`} />
                    )}
                  </span>
                </div>
              </Form.Group>

              <Button
                className={`${customBtn} mt-4 w-100 ${customDark === "dark-dark" ? "border-white " : "border-0 "
                  } custom-zoom-btn `}
                type="submit"
              >
                {t("login")}
              </Button>
              <div className="text-center mt-3 custom-zoom-btn">
                <Link
                  to="/forgotpassword"
                  className={`${customDark === "dark-dark"
                    ? "text-dark"
                    : `${customDarkText}`
                    } `}
                >
                  {t("forgotPassword")}
                </Link>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
