// addUsersValidations.js

export const validateFormData = (data) => {
  const errors = [];
  const success = {};

  // Validate first name
  if (!data.firstName) {
    errors.push('First name is required.');
  } else {
    success.firstName = data.firstName;
  }

  // Validate mobile number
  const mobileRegex = /^[0-9]{10}$/;
  if (!data.mobileNumber) {
    errors.push('Mobile number is required.');
  } else if (!mobileRegex.test(data.mobileNumber)) {
    errors.push('Mobile number must be 10 digits and contain only numbers.');
  } else {
    success.mobileNumber = data.mobileNumber;
  }

  // Validate email
  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  if (!data.email) {
    errors.push('Email address is required.');
  } else if (!emailRegex.test(data.email)) {
    errors.push('Please enter a valid email address.');
  } else {
    success.email = data.email;
  }

  // Validate role
  if (!data.role) {
    errors.push('Role is required.');
  } else {
    success.role = data.role;
  }

  // Validate department
  if (!data.department) {
    errors.push('Department is required.');
  } else {
    success.department = data.department;
  }

  return { errors, success };
};
