import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './../styles/AssignedTeam.css'; // Ensure the path matches the location of your CSS file
import { FaUserAlt } from "react-icons/fa";
import { CgMenuGridR } from "react-icons/cg";
import { IoSearch } from "react-icons/io5";
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';

function App() {

    //Theme Change Section
    const { getCssClasses } = useStore(themeStore);
    const cssClasses = getCssClasses();
    const customDark = cssClasses[0];
    const customMid = cssClasses[1];
    const customLight = cssClasses[2];
    const customBtn = cssClasses[3];
    const customDarkText = cssClasses[4];

    const [searchVisible, setSearchVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(null);

    const toggleSearch = () => {
        setSearchVisible(!searchVisible);
    };

    const toggleMenu = (index) => {
        setMenuVisible(menuVisible === index ? null : index);
    };

    const users = [
        { name: "Mr. CTP", about: "About Mr.CTP" },
        { name: "Mr. CTP", about: "About Mr.CTP" },
        { name: "Mr. CTP", about: "About Mr.CTP" },
        { name: "Mr. CTP", about: "About Mr.CTP" },
        { name: "Mr. CTP", about: "About Mr.CTP" }
    ];

    return (
        <>
            <nav className={`assigned-team-navba ${customDark==='dark-dark'?'border':''}   rounded ${customDark}`}>
                <div className="container-fluid text-center p-2 d-flex justify-content-between align-items-center">
                    < CgMenuGridR size={19} className={`text-white`}/>
                    <span className={`navbar-brand mb-0 h1 fs-6  text-white`}>Assigned Team</span>
                    <div className="assigned-team-search-box mb-1" style={{ display: searchVisible ? 'block' : 'none' }}>
                        <input className="form-control rounded border-2" placeholder="Search User.." type="text" />
                    </div>
                    < IoSearch size={19} className='text-white' onClick={toggleSearch} style={{ cursor: 'pointer' }} id="search-icon" />
                </div>
            </nav>
            <div className="assigned-team-container mt-3">
                {users.map((user, index) => (
                    <div className="assigned-team-card card" key={index}>
                        <div className="assigned-team-card-body card-body">
                            {/* <img alt="User icon" height="40" width="40" src={<FaUserAlt/>} /> */}
                            <FaUserAlt size={40} className='custom-theme-dark-text' />
                            <div className="ms-4 assigned-team-info custom-theme-dark-text" >
                                <h5>{user.name}</h5>
                                <p>{user.about}</p>
                            </div>
                            <div className="assigned-team-options" onClick={() => toggleMenu(index)}>
                                <i className="fas fa-ellipsis-v"></i>
                                <div className="assigned-team-dropdown-menu" style={{ display: menuVisible === index ? 'block' : 'none' }}>
                                    <a href="#">View Profile</a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="assigned-team-footer">
                <i className="fas fa-chevron-down"></i>
            </div>
        </>
    );
}

export default App;
