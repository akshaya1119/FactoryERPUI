export const validateLogin = (userId, password) => {
  let errors = {};
  
  // User ID validation
  if (!userId) {
    errors.userId = "User ID is required.";
  }

  // Password validation
  if (!password) {

    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  return errors;
};
