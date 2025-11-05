import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './../styles/notification.css';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { IoNotifications } from "react-icons/io5";
const Notification = () => {

    //Theme Change Section
    const { getCssClasses } = useStore(themeStore);
    const cssClasses = getCssClasses();
    const customDark = cssClasses[0];
    const customMid = cssClasses[1];
    const customLight = cssClasses[2];
    const customBtn = cssClasses[3];
    const customDarkText = cssClasses[4];

  return (
    <div className={`noti-container p-3 rounded ${customDark} text-white border border-bottom border-white mt-1` }>
      <ul className="list-group list-group-flush">
        <li className={`list-group-item ${customDark} text-white d-flex align-items-center`}>
          <span className="me-2"><IoNotifications size={25}/></span> Notification 1
        </li>
        <li className={`list-group-item ${customDark} text-white d-flex align-items-center`}>
          <span className="me-2"><IoNotifications size={25}/></span> Notification 2
        </li>
        {/* <li className={`list-group-item ${customDark} text-white d-flex align-items-center`}>
          <span className="me-2"><IoNotifications /></size={25}span> Notification 3
        </li> */}
        <li className={`list-group-item ${customDark} text-white d-flex align-items-center`}>
          <span className="me-2"><IoNotifications size={25}/></span> Notification 3
        </li>
        {/* <li className={`list-group-item ${customDark} text-white d-flex align-items-center`}>
          <span className="me-2">ℹ️</span> And a fifth size={25}one
        </li> */}
      </ul>
    </div>
  );
};

export default Notification;
