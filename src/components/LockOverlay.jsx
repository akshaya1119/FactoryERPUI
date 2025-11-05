import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaLock } from 'react-icons/fa';
import { Form } from 'react-bootstrap';
import './../styles/lockOverlay.css';
import { ToastContainer } from 'react-toastify';
import themeStore from './../store/themeStore';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import AuthService from '../CustomHooks/ApiServices/AuthService';

// Configure inactivity timeout in milliseconds
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; 

const LockOverlay = () => {
    const { t } = useTranslation();
    const { getCssClasses } = useStore(themeStore);
    const [
        customDark,
        customMid, 
        customLight,
        customBtn,
        customDarkText,
        customLightText,
        customLightBorder,
        customDarkBorder,
        customThead
    ] = getCssClasses();

    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const timerRef = useRef(null);
    const inputRef = useRef(null);
    const [isLocked, setIsLocked] = useState(() => {
        return JSON.parse(localStorage.getItem('isLocked') || 'false');
    });
    const [lastActivity, setLastActivity] = useState(Date.now());

    useEffect(() => {
        localStorage.setItem('isLocked', JSON.stringify(isLocked));
    }, [isLocked]);

    useEffect(() => {
        let inactivityTimer = null;

        const resetInactivityTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            setLastActivity(Date.now());
            
            // Only start timer if screen is not already locked
            if (!isLocked) {
                inactivityTimer = setTimeout(() => {
                    setIsLocked(true);
                    setShowModal(false);
                }, INACTIVITY_TIMEOUT);
            }
        };

        // Enhanced list of events to track
        const events = [
            'mousemove',
            'mousedown',
            'keypress',
            'keydown',
            'scroll',
            'touchstart',
            'touchmove',
            'touchend',
            'click',
            'contextmenu',
            'orientationchange',
            'resize',
            'visibilitychange',
            'focus',
            'blur'
        ];

        // Debounced event handler to prevent excessive timer resets
        let debounceTimeout;
        const handleUserActivity = () => {
            if (debounceTimeout) clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                resetInactivityTimer();
            }, 250); // Debounce for 250ms
        };

        // Initialize timer on component mount
        resetInactivityTimer();

        // Add event listeners
        events.forEach(event => {
            window.addEventListener(event, handleUserActivity, { passive: true });
        });

        // Handle page visibility changes
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Page is hidden, check if enough time has passed to lock
                const inactiveTime = Date.now() - lastActivity;
                if (inactiveTime >= INACTIVITY_TIMEOUT) {
                    setIsLocked(true);
                    setShowModal(false);
                }
            } else {
                // Page is visible again, reset timer if not locked
                if (!isLocked) {
                    resetInactivityTimer();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            if (debounceTimeout) clearTimeout(debounceTimeout);
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isLocked, lastActivity]);

    const handleLock = useCallback(() => {
        setIsLocked(true);
        setShowModal(false);
        setLastActivity(Date.now() - INACTIVITY_TIMEOUT); // Set last activity to trigger immediate lock
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    const handleUnlock = useCallback(() => {
        setShowModal(true);
        // Focus input after a short delay to ensure the input is rendered
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 100);
    }, []);

    const handlePasswordChange = useCallback(async (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        
        if (newPassword.length > 2) {
            try {
                const response = await AuthService.unlockScreen(newPassword);
                if (response.status === 200) {
                    setIsLocked(false);
                    setShowModal(false);
                    setPassword('');
                    setLastActivity(Date.now()); // Reset last activity on successful unlock
                }
            } catch (error) {
                console.log('Pin is incorrect');
            }
        }
    }, []);

    return (
        <>
            <ToastContainer />
            {isLocked && (
                <div className="lock-overlay" style={{ zIndex: "9999999999999" }}>
                    {showModal ? (
                        <Form className={`rounded-circle border p-2 pt-4 ${customDark}`}
                            style={{ height: "250px", width: "250px" }}>
                            <Form.Group controlId="formBasicPassword" className='d-flex flex-column justify-content-center align-items-center'>
                                <FaLock size={100} color="white" className={customLightText} />
                                <Form.Label className='text-light text-center mt-1'>{t('enterYourUnlockKey')}</Form.Label>
                                <Form.Control
                                    ref={inputRef}
                                    type="password"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder={t('enterUnlockKey')}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className='rounded-bottom-5'
                                    style={{ width: "200px", textAlign: "center" }}
                                    autoComplete="off"
                                />
                            </Form.Group>
                        </Form>
                    ) : (
                        <button className="unlock-button" onClick={handleUnlock}>
                            <FaLock size={100} color="white" />
                        </button>
                    )}
                </div>
            )}
            <button className={`unlock-button manual-unlock-btn ${customBtn} border p-1 ms-1 rounded`} onClick={handleLock}>
                <FaLock size={30} color="white" />
            </button>
        </>
    );
};

export default LockOverlay;
