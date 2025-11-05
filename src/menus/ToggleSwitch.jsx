import React, { useState } from 'react';
import './ToggleSwitch.css'; // Import the CSS file

const ToggleSwitch = () => {
  const [isChecked, setIsChecked] = useState(false);

  const handleChange = () => {
    setIsChecked(!isChecked);
  };

  return (
    <div className="toggle-container">
      <input
        type="checkbox"
        id="toggle-checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="toggle-checkbox"
      />
      <label htmlFor="toggle-checkbox" className="toggle-label">
        <span className="toggle-switch"></span>
      </label>
    </div>
  );
};

export default ToggleSwitch;
