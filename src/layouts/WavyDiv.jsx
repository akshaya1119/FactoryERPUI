import React, { useRef } from 'react';
import { useStore } from 'zustand';
import themeStore from './../store/themeStore';

const WavyDiv = () => {
  const { getCssClasses } = useStore(themeStore);
  const cssClasses = getCssClasses();
  const customMid = cssClasses[1];
  const wavyDivRef = useRef(null); // Added ref directly to the element

  return (
    <div
      ref={wavyDivRef} // Added ref to the div element
      className={`fixed-bottom w-100 border ${customMid}`}
      style={{
        zIndex: "1",
        width:"100%",
        height: "200px",
        position: "relative",
        clipPath: "path('M0,100 C100,0 200,200 300,100 C400,0 500,200 600,100 C700,0 800,200 900,100 C1000,0 1100,200 1200,100 C1300,0 1400,200 1500,100 C1600,0 1700,200 1800,100 L1800,200 L0,200 Z')",


        // Smooth wave
        backgroundColor: '#yourColorHere', // Change to your desired color
      }}
    >
      {/* Optional content here */}
    </div>
  );
};

export default WavyDiv;
