import React from "react";
import { ProgressBar } from "react-bootstrap";
import "./../styles/catchProgressBar.css"; // Assuming you use external CSS
import themeStore from "./../store/themeStore";
import { useStore } from "zustand";
import { useTranslation } from "react-i18next";

const CatchProgressBar = ({ data }) => {
  const { t } = useTranslation();
  //Theme Change Section
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const customDark = cssClasses[0];
  const customMid = cssClasses[1];
  const customLight = cssClasses[2];
  const customBtn = cssClasses[3];
  const customDarkText = cssClasses[4];

  const updateData = (jsonData) => {
    let completed = 0;

    jsonData.forEach((item) => {
      if (item.status === 2) {
        completed += 1;
      }
    });

    const total = jsonData.length || 1; // Prevent division by 0

    return {
      completedPercent: (completed / total) * 100,
      completed,
      total,
    };
  };

  const { completedPercent, completed, total } = updateData(data);

  return (
    <div className="progress-container">
      <div className="d-flex justify-content-between align-items-center">
        {/* <h5 className={`${customDarkText}`}>
          {`${completedPercent.toFixed(0)}%`}{" "}
        </h5> */}
        <p className={`${customDarkText} mb-1`} style={{fontSize:'13px'}}>
          {/* Catches: {completed} / {total} */}
        </p>
      </div>
      <ProgressBar
        className={`progress-bar-custom border border-2 ${
          customDark === "dark-dark" ? customDark : customDarkText
        }`}
      >
        <ProgressBar className="p-2" striped variant="success"  label={`${completedPercent.toFixed(2)}% - Catches: ${completed} / ${total}`} now={completedPercent}  key={3} />

      </ProgressBar>
    </div>
  );
};

export default CatchProgressBar;
