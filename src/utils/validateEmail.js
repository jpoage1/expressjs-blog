const validator = require("validator");

// Email validation function
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: "Email is required" };
  }
  
  // Trim and normalize
  email = email.trim().toLowerCase();
  
  // Length check
  if (email.length > 254) {
    return { valid: false, message: "Email address is too long" };
  }
  
  // Basic validation
  if (!validator.isEmail(email)) {
    return { valid: false, message: "Please enter a valid email address" };
  }
  
  // Additional checks for suspicious patterns
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return { valid: false, message: "Please enter a valid email address" };
  }
  
  return { valid: true, email };
};

module.exports = validateEmail;
