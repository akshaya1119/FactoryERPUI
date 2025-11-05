import React from 'react';
import { Spin } from 'antd';
import './../styles/Spinner.css'; // Import the custom CSS file

const Spinner = ({ color }) => {
  const className = color === 'white' ? 'ant-spin-dot-item-1' : 'ant-spin-dot-item-2';
  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      className={className}
    >
      <Spin tip="Loading..." size="large" />
    </div>
  );
};

export default Spinner;