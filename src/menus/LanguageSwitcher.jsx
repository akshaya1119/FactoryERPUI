import React from 'react';
import Hindi from "./../assets/Icons/Hindi.png";
import English from "./../assets/Icons/English.png";
import { Form } from 'react-bootstrap';
import './../styles/LanguageSwitcher.css'; // Custom styles
import useLanguageStore from '../store/languageStore';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguageStore();
    const { t } = useTranslation();

    return (
        <div className="language-switcher-container">
            <Form.Label className="language-label">{t('changeLanguage')}</Form.Label>
            <div className="language-switcher">
                {/* Hindi Button */}
                <button
                    className={`language-btn rounded-4 ${language === 'hi' ? 'active' : ''}`}
                    onClick={() => setLanguage('hi')}
                >
                    <img src={Hindi} alt="Hindi" className="language-icon" />
                    <span>हिन्दी</span>
                </button>

                {/* English Button */}
                <button
                    className={`language-btn rounded-4 ${language === 'en' ? 'active' : ''}`}
                    onClick={() => setLanguage('en')}
                >
                    <img src={English} alt="English" className="language-icon" />
                    <span>English</span>
                </button>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
