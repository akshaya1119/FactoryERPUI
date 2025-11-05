import React from 'react';
import './../styles/textAnimation.css';

const AnimatedText = () => {
  return (
    <div className="card-uiVerse">
      <div className="loader-uiVerse">
        <p>Login | </p>
        <div className="words-uiVerse">
          <span className="word-uiVerse">CUPL</span>
          <span className="word-uiVerse">ApexERP</span>
          {/* <span className="word-uiVerse">switches</span> */}
          {/* <span className="word-uiVerse">cards</span> */}
          {/* <span className="word-uiVerse">buttons</span> */}
        </div>
      </div>
    </div>
  );
};

export default AnimatedText;
