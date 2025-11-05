/**
 * NavigationBar Component
 * 
 * This component renders a navigation bar with links to different sections of the application.
 * It uses React Bootstrap for layout and styling, and React Router for navigation.
 * The component is responsive and adapts to different screen sizes.
 * 
 * @component
 * @param {Object} props - The component props
 * @param {Function} props.onLinkClick - Callback function to be called when a navigation link is clicked
 * @param {Function} props.onClose - Callback function to be called when the navigation bar should close
 */

import React, { useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';
import { useStore } from 'zustand';
import themeStore from './../store/themeStore';
import { BiSolidDashboard } from "react-icons/bi";
import { hasPermission } from '../CustomHooks/Services/permissionUtils';
import { useUserData } from '../store/userDataStore';
import { TbReportSearch } from "react-icons/tb";
import { TbMessage2Cog } from "react-icons/tb";
import { IoIosSwitch } from "react-icons/io";
import { useTranslation } from 'react-i18next';
import { FaTv } from "react-icons/fa";

const NavigationBar = ({ onLinkClick, onClose }) => {
  const { t } = useTranslation();
  // Get the CSS classes for theming
  const { getCssClasses } = useStore(themeStore);
  const [customDark] = getCssClasses();
  
  // Check if the application is running in development mode
  const isDevelopmentMode = import.meta.env.VITE_APP_MODE === 'development';
  
  // Retrieve the user data from a custom hook
  const userData = useUserData();

  // Ref for the navigation bar container
  const navRef = useRef(null);

  /**
   * Navigation items configuration
   * Each item represents a link in the navigation bar
   */
  const navItems = useMemo(() => [
    { id: "1", to: "/cudashboard", icon: BiSolidDashboard, text: t('cumulativeDashboard')},
    { id: "2", to: "/master", icon: IoIosSwitch, text: t('masterManagement'), permission: "2" },
    { id: "3", to: "/labels", icon: TbMessage2Cog , text: t('messageManagement'), permission: "3" },
    { id: "4", to: "/reports", icon: TbReportSearch, text: t('viewReports'), permission: "4" },
  ], [t]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <Container fluid className={`${customDark} py-4`} ref={navRef}>
      <Row className="justify-content-evenly g-4">
        {navItems.map(item => {
          // If no permission defined or has permission, show the item
          if (!item.permission || hasPermission(item.permission)) {
            return (
              <Col xs={6} sm={4} lg={2} key={item.id} className="text-center">
                <Link 
                  to={item.to} 
                  className="text-white text-decoration-none d-flex flex-column align-items-center custom-zoom-btn" 
                  onClick={onLinkClick}
                >
                  <item.icon style={{ width: "40px", height: "40px" }} />
                  <div className="mt-2">{item.text}</div>
                </Link>
              </Col>
            );
          }
          return null; // Hide item if permission check fails
        })}
      </Row>
    </Container>
  );
};

export default React.memo(NavigationBar);
