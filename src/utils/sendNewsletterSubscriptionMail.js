// src/utils/sendNewsletterSubscriptionMail.js
const transporter = require("./transporter");
const sendNewsletterSubscriptionMail = async function ({ email }) {
  const { DOMAIN: domain } = process.env;
  const data = {
    from: `"Newsletter" <no-reply@${domain}>`,
    to: email,
    subject: "New Newsletter Subscription",
    text: `Please add this email to the newsletter list: ${process.env.MAIL_NEWSLETTER}`,
  };
  try {
    const result = await transporter.sendMail(data);
    return result;
  } catch (e) {
    console.log(e);
  }
};

module.exports = sendNewsletterSubscriptionMail;
