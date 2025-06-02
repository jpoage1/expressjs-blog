// src/utils/mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

let auth = null;
if (process.env.MAIL_AUTH != "null") {
  auth = {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  };
}
console.log(process.env.MAIL_PORT);
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT, 10),
  secure: process.env.MAIL_SECURE === "true",
  auth,
});

function sendContactMail({ name, email, message }) {
  const { DOMAIN: domain } = process.env;
  const data = {
    from: `"Contact Form" <no-reply@${domain}>`,
    to: process.env.MAIL_USER,
    replyTo: `"${name}" <${email}>`,
    subject: "New Contact Form Submission",
    text: message,
  };
  console.log(data);
  return transporter.sendMail(data);
}

module.exports = sendContactMail;
