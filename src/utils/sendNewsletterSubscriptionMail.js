// src/utils/mailer.js
const nodemailer = require("nodemailer");
require("dotenv").config();

let auth = null;
if (process.env.MAIL_AUTH !== "null") {
  auth = {
    user: process.env.MAIL_USER || null,
    pass: process.env.MAIL_PASS || null,
  };
}

const credentials = {
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT, 10),
  secure: process.env.MAIL_SECURE === "true",
  auth,
};
console.log(credentials);
const transporter = nodemailer.createTransport(credentials);

const sendNewsletterSubscriptionMail = async function ({ email }) {
  const { DOMAIN: domain } = process.env;
  const data = {
    from: `"Newsletter" <no-reply@${domain}>`,
    to: email,
    subject: "New Newsletter Subscription",
    text: `Please add this email to the newsletter list: ${process.env.MAIL_NEWSLETTER}`,
  };
  console.log(data);
  try {
    const result = await transporter.sendMail(data);
    console.log(result);
    return result;
  } catch (e) {
    console.log(e);
  }
};

module.exports = sendNewsletterSubscriptionMail;
