// src/utils/sendNewsletterSubscriptionMail.js
const transporter = require("./transporter");
const { winstonLogger } = require("./logging");

const MAIL_SUBJECT = "New Newsletter Subscription";

function getMailFrom() {
  return `Newsletter <no-reply@${process.env.MAIL_DOMAIN}>`;
}

function getMailText() {
  return `Please add this email to the newsletter list: ${process.env.MAIL_NEWSLETTER}`;
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
