import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaRegHourglassHalf } from "react-icons/fa6";
import { useStore } from 'zustand';
import themeStore from '../../../store/themeStore';

const PreviousProcess = ({ previousProcess, previousProcessCompletionPercentage }) => {
  const { t } = useTranslation();
  const { getCssClasses } = useStore(themeStore);
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = getCssClasses();

  return (
    <div className="align-items-center flex-column">
      <div className='text-center fs-5'>{t("previousProcess")}</div>
      <div 
        className={`p-1 fs-6 text-primary border ${customDarkBorder} rounded ms-1 d-flex justify-content-center align-items-center ${customDark === 'dark-dark' ? `${customBtn} text-white` : `${customLight} bg-light`}`}
        style={{ fontWeight: 900 }}
      >
        {previousProcess ? `${previousProcess.processName} - ${previousProcessCompletionPercentage}%` : 'N/A'}
        <span className='ms-2'>
          <FaRegHourglassHalf color='blue' size="20" />
        </span>
      </div>
    </div>
  );
};

export default PreviousProcess;
