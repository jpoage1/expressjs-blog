const { HttpError } = require("@jpoage1/errors");
const {
  saveEmail,
  unsubscribeEmail,
} = require("#services/newsletterService.js");
const {
  sendNewsletterSubscriptionMail,
  validateAndSanitizeEmail,
} = require("#mailer");

const { ERRORS } = require("#constants/newsletterConstants.js");

exports.renderNewsletterForm = async (req, res) => {
  res.locals.renderWithBaseContext("pages/newsletter.handlebars", {
    csrfToken: res.locals.csrfToken,
    title: "Newsletter",
    formAction: res.locals.qualifyLink("/newsletter"),
    formMethod: "POST",
  });
};

exports.renderSubscriptionSuccess = async (req, res) => {
  res.locals.renderWithBaseContext("pages/newsletter-success.handlebars", {
    title: "Unsubscribed",
    message:
      "You’ve successfully subscribed to my newsletter. Stay tuned for updates.",
  });
};

exports.handleNewsletterSubscribe = async (req, res, next) => {
  const { email: rawEmail } = req.body;
  const result = validateAndSanitizeEmail(rawEmail);

  if (!result.valid) {
    return next(new HttpError(result.message, 400));
  }

  const sanitizedEmail = result.email;

  try {
    await saveEmail(sanitizedEmail);
    await sendNewsletterSubscriptionMail({ email: sanitizedEmail });
    res.customRedirect("/newsletter/success");
  } catch (err) {
    req.log.error("Newsletter subscription error:", err);
    if (err.code === "DUPLICATE_EMAIL") {
      return res.customRedirect("/newsletter/success");
    }
    next(err);
  }
};

exports.handleUnsubscribe = async (req, res, next) => {
  const { valid, email, message } = validateAndSanitizeEmail(req.query.email);

  if (!valid) {
    return next(new HttpError(message || ERRORS.INVALID_EMAIL, 400));
  }

  try {
    await unsubscribeEmail(email);
    res.locals.renderGenericMessage({
      title: "Thank You",
      message:
        "You’ve been successfully removed from the newsletter mailing list.",
    });
  } catch (err) {
    next(new HttpError({ error: "Failed to unsubscribe" }, 500));
  }
};
