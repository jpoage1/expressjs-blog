// constants/newsletterConstants.js
const FILE_PATH = require("path").join(
  __dirname,
  "../../data/newsletter-emails.json"
);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ERRORS = {
  INVALID_EMAIL: "Invalid email format",
  PARSE_FAILURE: "Failed to parse newsletter-emails.json",
  WRITE_FAILURE: "writeFile failed",
  SAVE_EMAIL_FAILURE: "Failed to save email",
};

module.exports = {
  FILE_PATH,
  EMAIL_REGEX,
  ERRORS,
};
