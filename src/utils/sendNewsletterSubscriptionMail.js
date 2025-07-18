const transporter = require("./transporter");

const MAIL_DOMAIN = process.env.MAIL_DOMAIN;
const MAIL_NEWSLETTER = process.env.MAIL_NEWSLETTER;

const MAIL_SUBJECT = "New Newsletter Subscription";
const MAIL_FROM = `Newsletter <no-reply@${MAIL_DOMAIN}>`;
const MAIL_TEXT_TEMPLATE = (email) =>
  `Please add this email to the newsletter list: ${MAIL_NEWSLETTER}`; // fixme

async function sendNewsletterSubscriptionMail({ email }) {
  const mailData = {
    from: MAIL_FROM,
    to: email,
    subject: MAIL_SUBJECT,
    text: MAIL_TEXT_TEMPLATE(email),
  };

  try {
    return await transporter.sendMail(mailData);
  } catch (error) {
    console.error(error);
  }
}

module.exports = sendNewsletterSubscriptionMail;
