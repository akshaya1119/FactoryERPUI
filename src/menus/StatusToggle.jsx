import React, { useState, useEffect } from "react";
import { Switch } from "antd";
import { useTranslation } from 'react-i18next';

const defaultStatusSteps = [
  { status: "pending", color: "red" },
  { status: "started", color: "blue" },
  { status: "completed", color: "#00F700" },
];

const StatusToggle = ({ initialStatusIndex, onStatusChange, disabled, statusSteps = defaultStatusSteps }) => {
  const { t } = useTranslation();
  const [statusIndex, setStatusIndex] = useState(Math.min(initialStatusIndex, statusSteps.length - 1));
  const [toggling, setToggling] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);

  // Ensure statusSteps[statusIndex] exists before destructuring
  const { status = "", color = "gray" } = statusSteps[statusIndex] || {};   

  const handleToggle = () => {
    if (toggling || disabled) return; // Prevent toggling if disabled or already toggling
    
    if (statusIndex < statusSteps.length - 1) {
      setToggling(true);
      setStatusChecked(true); // Move the toggle temporarily

      setTimeout(() => {
        setStatusChecked(false); // Reset toggle
        const nextIndex = Math.min(statusIndex + 1, statusSteps.length - 1);
        setStatusIndex(nextIndex); // Move to the next status
        setToggling(false);
        onStatusChange(nextIndex); // Notify parent component about the change
      }, 500);
    }
  };

  useEffect(() => {
    setStatusIndex(initialStatusIndex); // Sync the initial status
  }, [initialStatusIndex]);

  return (
    <Switch
      checkedChildren={status} // Display status when checked
      unCheckedChildren={status} // Display status when unchecked
      style={{
        backgroundColor: color, // Change background color based on status
        borderColor: color,
        color: "white",
        transition: "background-color 2.0s ease",
        width: 110, // Fixed width for the toggle button
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      checked={statusChecked}
      onClick={handleToggle} // Handle status change
      disabled={disabled} // Use the disabled prop directly in Switch
    />
  );
};

export default StatusToggle;
