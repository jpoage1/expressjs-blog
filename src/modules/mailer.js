const {
  createTransporter,
  createMailer,
  createHCaptchaVerifier,
} = require("@jpoage1/mailer");
const { HttpError } = require("@jpoage1/errors");
const { logger } = require("#logging");
const config = require("#config");

const transporter = createTransporter(config.mail);

const { sendContactMail, sendNewsletterSubscriptionMail, sanitizeInput } =
  createMailer({
    transporter,
    mailConfig: config.mail,
    HttpError,
    logger,
  });

const verifyHCaptcha = createHCaptchaVerifier(config.hcaptcha.secret);

module.exports = {
  transporter,
  sendContactMail,
  sendNewsletterSubscriptionMail,
  sanitizeInput,
  verifyHCaptcha,
};
