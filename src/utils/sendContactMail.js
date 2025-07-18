const transporter = require("./transporter");
const { validateAndSanitizeEmail } = require("../utils/emailValidator");

const MAIL_DOMAIN = process.env.MAIL_DOMAIN;
const MAIL_USER = process.env.MAIL_USER;
const DEFAULT_SUBJECT = "New Contact Form Submission";

function sanitizeInput(input) {
  return String(input)
    .replace(/[\r\n<>]/g, "")
    .trim();
}

const HttpError = require("./HttpError");

function sendContactMail({ name, email, subject, message }) {
  const cleanName = sanitizeInput(name);
  const cleanSubject = sanitizeInput(subject || DEFAULT_SUBJECT);
  const cleanMessage = sanitizeInput(message);

  const {
    valid,
    email: sanitizedEmail,
    message: errorMessage,
  } = validateAndSanitizeEmail(email);

  if (!valid) throw new HttpError(errorMessage || ERRORS.INVALID_EMAIL, 400);

  const mailData = {
    from: `"Contact Form" <no-reply@${MAIL_DOMAIN}>`,
    to: MAIL_USER,
    replyTo: `"${cleanName}" <${sanitizedEmail}>`,
    subject: cleanSubject,
    text: cleanMessage,
  };

  return transporter.sendMail(mailData);
}

module.exports = sendContactMail;
