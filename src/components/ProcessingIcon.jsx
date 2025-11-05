import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import './../styles/ProcessingIcon.css'; // Update the CSS file name

const ProcessingIcon = ({ color = 'black' , size= 20}) => {
  return (
    <div className="processing-icon-container">
      <FaSpinner className="processing-icon" style={{ color }} size={size}/>
    </div>
  );
};

export default ProcessingIcon;
