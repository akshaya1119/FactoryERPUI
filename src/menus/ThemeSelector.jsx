import React from 'react';
import { Button, Row, Col, Form } from 'react-bootstrap';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import './../styles/ThemeSelector.css'; // Custom styles for theme buttons
import { useTranslation } from 'react-i18next';

const themes = [
  { name: 'Dark', color: '#021526' },
  { name: 'Light', color: '#71C9CE' },
  { name: 'Red', color: '#D12E5A' },
  { name: 'Blue', color: '#0F2469' },
  { name: 'Green', color: '#348D58' },
  { name: 'Purple', color: '#AD49E1' },
  { name: 'Brown', color: '#3C3D37' },
  { name: 'Pink', color: '#ED3EF7' },
  { name: 'Default', color: '#37474F' }
];

const ThemeSelector = () => {
  const { t } = useTranslation();
  const setTheme = useStore(themeStore, (state) => state.setTheme);
  const currentTheme = useStore(themeStore, (state) => state.theme);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const getEnglishTheme = (themeName) => {
    const themeMap = {
      dark: 'Dark',
      light: 'Light',
      red: 'Red',
      blue: 'Blue',
      green: 'Green',
      purple: 'Purple',
      brown: 'Brown',
      pink: 'Pink',
      default: 'Default'
    };
    return themeMap[themeName.toLowerCase()] || themeName;
  };

  return (
    <Row className="g-3">
      <Form.Label>{t('selectTheme')}</Form.Label>
      {themes.map((theme) => (
        <Col key={theme.name} xs={4} md={4}>
          <Button
            style={{
              backgroundColor: theme.color,
              borderColor: theme.color
            }}
            className={`w-100 text-white theme-btn ${currentTheme === theme.name ? 'active' : ''}`}
            onClick={() => handleThemeChange(getEnglishTheme(theme.name))}
          >
            {t(theme.name.toLowerCase())}
          </Button>
        </Col>
      ))}
    </Row>
  );
};

export default ThemeSelector;
