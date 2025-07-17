const validator = require("validator");

const MAX_EMAIL_LENGTH = 320; // RFC 5321 limit
const MESSAGES = {
  REQUIRED: "Email is required",
  INVALID: "Invalid email format",
  TOO_LONG: "Email too long",
};

function validateAndSanitizeEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== "string") {
    return { valid: false, message: MESSAGES.REQUIRED };
  }

  const email = validator.normalizeEmail(rawEmail.trim().toLowerCase());

  if (!email || !validator.isEmail(email)) {
    return { valid: false, message: MESSAGES.INVALID };
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return { valid: false, message: MESSAGES.TOO_LONG };
  }

  if (email.includes("..") || email.startsWith(".") || email.endsWith(".")) {
    return { valid: false, message: MESSAGES.INVALID };
  }

  return { valid: true, email };
}

module.exports = {
  validateAndSanitizeEmail,
  MESSAGES,
  MAX_EMAIL_LENGTH,
};
