// src/utils/sendContactMail.js
const transporter = require("./transporter");

// Basic sanitization and validation functions
function sanitizeInput(input) {
  return String(input)
    .replace(/[\r\n<>]/g, "")
    .trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sendContactMail({ name, email, subject, message }) {
  const { MAIL_DOMAIN: domain } = process.env;

  // Sanitize inputs
  const cleanName = sanitizeInput(name);
  const cleanEmail = sanitizeInput(email);
  const cleanSubject = sanitizeInput(subject || "New Contact Form Submission");
  const cleanMessage = sanitizeInput(message);

  // Validate email
  if (!isValidEmail(cleanEmail)) {
    throw new Error("Invalid email format");
  }

  const data = {
    from: `"Contact Form" <no-reply@${domain}>`,
    to: process.env.MAIL_USER,
    replyTo: `"${cleanName}" <${cleanEmail}>`,
    subject: cleanSubject,
    text: cleanMessage,
  };

  // Optional: limit message length to prevent abuse
  if (cleanMessage.length > 2000) {
    throw new Error("Message too long");
  }

  return transporter.sendMail(data);
}

module.exports = sendContactMail;
