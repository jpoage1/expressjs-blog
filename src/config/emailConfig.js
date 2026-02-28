// src/config/emailConfig.js
const path = require("path");

module.exports = {
  EMAIL_LOG_PATH: path.join(__dirname, "../../data/emails.json"),
};
