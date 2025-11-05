import React, { useState, useRef, useEffect } from 'react';
import './../styles/slider.css'; // Custom CSS file for styling

const StatusSlider = ({ onUpdateStatus }) => {
  const [currentStep, setCurrentStep] = useState(0); // Tracks slider position based on steps
  const [dragging, setDragging] = useState(false); // Tracks if the slider is being dragged
  const sliderRef = useRef(null); // Reference to the slider container

  const steps = [
    { label: 'Pending', color: '#ffcc00' }, // Yellow
    { label: 'Started', color: '#33cc33' }, // Green
    { label: 'Running', color: '#3399ff' }, // Blue
    { label: 'Completed', color: '#ff6600' } // Orange
  ];

  const handleMouseDown = () => {
    setDragging(true);
  };

  const handleMouseMove = (e) => {
    if (dragging && sliderRef.current) {
      const slider = sliderRef.current;
      const rect = slider.getBoundingClientRect();
      const offsetX = e.clientX - rect.left; // Mouse position relative to the slider
      const width = rect.width;
      const stepWidth = width / (steps.length - 1); // Width of each step
      let newStep = Math.round(offsetX / stepWidth);

      // Ensure the slider can't go back once a checkpoint is reached
      if (newStep > currentStep) {
        setCurrentStep(newStep);
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleUpdateStatus = () => {
    onUpdateStatus(steps[currentStep].label); // Export current step status via props
  };

  // Cleanup event listeners on mouse up
  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, currentStep]);

  return (
    <div className="slider-container">
      <div className="slider" ref={sliderRef}>
        <div
          className="slider-progress"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
            backgroundColor: steps[currentStep].color,
            transition: dragging ? 'none' : 'width 0.5s ease-in-out',
          }}
        ></div>
        <div
          className="slider-handle"
          style={{
            left: `${(currentStep / (steps.length - 1)) * 100}%`,
            backgroundColor: steps[currentStep].color,
          }}
          onMouseDown={handleMouseDown}
        ></div>
      </div>
      <div className="step-labels">
        {steps.map((step, index) => (
          <span key={index} className="step-label">
            {step.label}
          </span>
        ))}
      </div>
      <button onClick={handleUpdateStatus} className="btn btn-primary mt-3">
        Update Status
      </button>
    </div>
  );
};

export default StatusSlider;
