const transporter = require("#utils/transporter.js");
const path = require("path");
const fs = require("fs").promises;
const { validateAndSanitizeEmail } = require("#utils/emailValidator.js");
const { logger } = require("#logging");
const config = require("#config");
const { HttpError } = require("#errors");

const { mail } = config;

// Fixed sanitizeInput function
function sanitizeInput(input) {
  // Handle null, undefined, and non-string inputs safely
  if (input === undefined) {
    return "undefined";
  }
  if (input == null) {
    return "null";
  }
  // if (input == "null") {
  //   return "";
  // }

  try {
    return String(input)
      .replace(/[\r\n<>]/g, "")
      .trim();
  } catch (error) {
    // If String() conversion fails, return empty string
    return "";
  }
}

async function sendContactMail({ name, email, subject, message }) {
  const cleanName = sanitizeInput(name);
  const cleanSubject = sanitizeInput(subject || mail.defaultSubject);
  const cleanMessage = sanitizeInput(message);

  const {
    valid,
    email: sanitizedEmail,
    message: errorMessage,
  } = validateAndSanitizeEmail(email);

  if (!valid) throw new HttpError(errorMessage, 400);

  const mailData = {
    from: `"Contact Form" <no-reply@${mail.domain}>`,
    to: mail.user,
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
    const data = await fs.readFile(mail.logPath, "utf-8");
    const logs = JSON.parse(data);
    logs.push(emailLogEntry);
    await fs.writeFile(mail.logPath, JSON.stringify(logs, null, 2));
  } catch (err) {
    logger.error("Failed to log email to file:", err);
    throw err;
  }

  return transporter.sendMail(mailData);
}

module.exports.sendContactMail = sendContactMail;
module.exports.sanitizeInput = sanitizeInput;
