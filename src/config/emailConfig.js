// src/config/emailConfig.js
const path = require("path");

const MAIL_DOMAIN = process.env.MAIL_DOMAIN;
const MAIL_USER = process.env.MAIL_USER;
const DEFAULT_SUBJECT = "New Contact Form Submission";
const EMAIL_LOG_PATH = path.join(__dirname, "../../data/emails.json");

module.exports = {
  MAIL_DOMAIN,
  MAIL_USER,
  DEFAULT_SUBJECT,
  EMAIL_LOG_PATH,
};
