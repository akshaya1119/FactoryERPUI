import NotFoundImage from "./../assets/bgImages/404.svg";
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import React, { useState } from 'react';
const PageNotFound = () => {

  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const [customDark, customMid, customLight, customBtn, customDarkText, customLightText, customLightBorder, customDarkBorder] = cssClasses;
  const [displayName, setDisplayName] = useState("");

  return (
    <>
      <div className={`container text-center align-items-center mt-3 rounded-4 shadow-lg ${customDark === "dark-dark" ? `${customMid} border` : `${customLight}`}`}>
        <div className="row justify-content-center align-items-center">
          <div className="col-12 col-md-8 col-lg-6">
            <img
              src={NotFoundImage}
              alt="404 Not Found"
              className="img-fluid mb-3  w-75 container"
            />
            <h2 className={`mb-0 pb-5 poppins-semibold  ${customDark === "dark-dark" ? `${customDarkText}` : `${customDarkText}`}`}>PAGE NOT FOUND</h2>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageNotFound;
