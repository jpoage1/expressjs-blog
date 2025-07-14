const transporter = require("./transporter");

const MAIL_DOMAIN = process.env.MAIL_DOMAIN;
const MAIL_USER = process.env.MAIL_USER;
const DEFAULT_SUBJECT = "New Contact Form Submission";
const MAX_MESSAGE_LENGTH = 2000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeInput(input) {
  return String(input)
    .replace(/[\r\n<>]/g, "")
    .trim();
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

function sendContactMail({ name, email, subject, message }) {
  const cleanName = sanitizeInput(name);
  const cleanEmail = sanitizeInput(email);
  const cleanSubject = sanitizeInput(subject || DEFAULT_SUBJECT);
  const cleanMessage = sanitizeInput(message);

  if (!isValidEmail(cleanEmail)) {
    throw new Error("Invalid email format");
  }

  if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
    throw new Error("Message too long");
  }

  const mailData = {
    from: `"Contact Form" <no-reply@${MAIL_DOMAIN}>`,
    to: MAIL_USER,
    replyTo: `"${cleanName}" <${cleanEmail}>`,
    subject: cleanSubject,
    text: cleanMessage,
  };

  return transporter.sendMail(mailData);
}

module.exports = sendContactMail;
