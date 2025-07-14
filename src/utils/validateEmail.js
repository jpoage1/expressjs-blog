const validator = require("validator");

const MESSAGES = {
  REQUIRED: "Email is required",
  TOO_LONG: "Email address is too long",
  INVALID: "Please enter a valid email address",
};

const MAX_EMAIL_LENGTH = 254;

const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return { valid: false, message: MESSAGES.REQUIRED };
  }

  email = email.trim().toLowerCase();

  if (email.length > MAX_EMAIL_LENGTH) {
    return { valid: false, message: MESSAGES.TOO_LONG };
  }

  if (
    !validator.isEmail(email) ||
    email.includes("..") ||
    email.startsWith(".") ||
    email.endsWith(".")
  ) {
    return { valid: false, message: MESSAGES.INVALID };
  }

  return { valid: true, email };
};

module.exports = validateEmail;
