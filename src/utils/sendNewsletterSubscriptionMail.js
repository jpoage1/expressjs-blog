// src/utils/sendNewsletterSubscriptionMail.js
const transporter = require("./transporter");
const { winstonLogger } = require("./logging");
const { mail } = require("../config/loader");

const MAIL_SUBJECT = "New Newsletter Subscription";

function getMailFrom() {
  return `Newsletter <no-reply@${mail.domain}>`;
}

function getMailText() {
  return `Please add this email to the newsletter list: ${mail.newsletter}`;
}

async function sendNewsletterSubscriptionMail({ email }) {
  const mailData = {
    from: getMailFrom(),
    to: email,
    subject: MAIL_SUBJECT,
    text: getMailText(email),
  };

  try {
    return await transporter.sendMail(mailData);
  } catch (error) {
    winstonLogger.error(error);
  }
}

module.exports = sendNewsletterSubscriptionMail;
