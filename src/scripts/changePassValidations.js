// src/scripts/validation.js

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Function to validate the current password
export const validateCurrentPassword = (currentPassword, activeUser) => {
  if (!currentPassword) {
    toast.error('Current password is required', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      draggable: true,
      style: { backgroundColor: '#ff4d4d', color: 'white' },
    });
    return false;
  }
  
  if (currentPassword !== activeUser.password) {
    toast.error('Current password is incorrect', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      draggable: true,
      style: { backgroundColor: '#ff4d4d', color: 'white' },
    });
    return false;
  }
  return true;
};

// Function to validate the new password and confirm password
export const validateNewPasswords = (newPassword, confirmPassword) => {
  if (!newPassword) {
    toast.error('New password is required', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      draggable: true,
      style: { backgroundColor: '#ff4d4d', color: 'white' },
    });
    return false;
  }

  if (newPassword.length < 8) {
    toast.error('New password must be at least 8 characters long', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      draggable: true,
      style: { backgroundColor: '#ff4d4d', color: 'white' },
    });
    return false;
  }

  if (!confirmPassword) {
    toast.error('Confirm password is required', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      draggable: true,
      style: { backgroundColor: '#ff4d4d', color: 'white' },
    });
    return false;
  }

  if (newPassword !== confirmPassword) {
    toast.error('New password and confirm password do not match', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: true,
      draggable: true,
      style: { backgroundColor: '#ff4d4d', color: 'white' },
    });
    return false;
  }

  return true;
};
