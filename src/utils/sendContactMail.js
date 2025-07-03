// src/utils/sendContactMail.js
const transporter = require("./transporter");

function sendContactMail({ name, email, subject, message }) {
  const { DOMAIN: domain } = process.env;
  const data = {
    from: `"Contact Form" <no-reply@${domain}>`,
    to: process.env.MAIL_USER,
    replyTo: `"${name}" <${email}>`,
    subject: subject || "New Contact Form Submission",
    text: message,
  };
  console.log(data);
  return transporter.sendMail(data);
}

module.exports = sendContactMail;
