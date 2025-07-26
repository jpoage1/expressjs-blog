// src/utils/sendContactMail.js
const transporter = require("./transporter");
const path = require("path");
const fs = require("fs").promises;
const { validateAndSanitizeEmail } = require("../utils/emailValidator");
const { winstonLogger } = require("../utils/logging");
const {
  MAIL_DOMAIN,
  MAIL_USER,
  DEFAULT_SUBJECT,
  EMAIL_LOG_PATH,
} = require("../config/emailConfig");
function sanitizeInput(input) {
  return String(input)
    .replace(/[\r\n<>]/g, "")
    .trim();
}

const HttpError = require("./HttpError");

async function sendContactMail({ name, email, subject, message }) {
  const cleanName = sanitizeInput(name);
  const cleanSubject = sanitizeInput(subject || DEFAULT_SUBJECT);
  const cleanMessage = sanitizeInput(message);

  const {
    valid,
    email: sanitizedEmail,
    message: errorMessage,
  } = validateAndSanitizeEmail(email);

  if (!valid) throw new HttpError(errorMessage, 400);

  const mailData = {
    from: `"Contact Form" <no-reply@${MAIL_DOMAIN}>`,
    to: MAIL_USER,
    replyTo: `"${cleanName}" <${sanitizedEmail}>`,
    subject: cleanSubject,
    text: cleanMessage,
  };
  const emailLogEntry = {
    timestamp: new Date().toISOString(),
    name: cleanName,
    email: sanitizedEmail,
    subject: cleanSubject,
    message: cleanMessage,
  };
  try {
    const data = await fs.readFile(EMAIL_LOG_PATH, "utf-8");
    const logs = JSON.parse(data);
    logs.push(emailLogEntry);
    await fs.writeFile(EMAIL_LOG_PATH, JSON.stringify(logs, null, 2));
  } catch (err) {
    winstonLogger.error("Failed to log email to file:", err);
    throw err;
  }

  return transporter.sendMail(mailData);
}

module.exports.sendContactMail = sendContactMail;
module.exports.sanitizeInput = sanitizeInput;
