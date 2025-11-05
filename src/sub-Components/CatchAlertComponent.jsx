import React, { useState } from 'react';
import './../styles/CatchAlertComponent.css'; // Custom CSS for styling

const AlertComponent = () => {
  // Predefined 4 alerts from an object
  const alertData = [
    { id: 1, message: 'Alert 1: System will update at midnight.' },
    { id: 2, message: 'Alert 2: Server load is high.' },
    { id: 3, message: 'Alert 3: Backup completed successfully.' },
    { id: 4, message: 'Alert 4: Unauthorized login attempt detected.' },
  ];

  const [isPaused, setIsPaused] = useState(false);

  // Pause on hover or click
  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  return (
    <div className="alert-container p-  rounded h-100 w-100" onMouseEnter={handlePause} onMouseLeave={handleResume}>
      <div className={`alert-list ${isPaused ? 'paused' : ''} p-2`}>
        {alertData.map((alert) => (
          <div key={alert.id} className="alert alert-warning c-pointer">
            {alert.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlertComponent;
