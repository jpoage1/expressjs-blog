const express = require("express");
const router = express.Router();
const sendNewsletterSubscriptionMail = require("../utils/sendNewsletterSubscriptionMail");
const { saveEmail } = require("../services/newsletterService");
const formLimiter = require("../utils/formLimiter");
const { unsubscribeEmail } = require("../services/newsletterService");
const { ERRORS } = require("../constants/newsletterConstants");

const {
  validateAndSanitizeEmail,
  MESSAGES,
} = require("../utils/emailValidator");

const { qualifyLink } = require("../utils/qualifyLinks");

router.get("/newsletter", async (req, res) => {
  const context = {
    csrfToken: res.locals.csrfToken,
    title: "Newsletter",
    formAction: qualifyLink("/newsletter"),
    formMethod: "POST",
  };
  res.renderWithBaseContext("pages/newsletter.handlebars", context);
});

router.get("/newsletter/success", async (req, res) => {
  const context = {
    title: "Unsubscribed",
    message:
      "You’ve successfully subscribed to my newsletter. Stay tuned for updates.",
  };
  res.renderWithBaseContext("pages/newsletter-success.handlebars", context);
});

router.post("/newsletter", formLimiter, async (req, res, next) => {
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
});

router.get("/unsubscribe", async (req, res) => {
  const { valid, email, message } = validateAndSanitizeEmail(req.query.email);

  if (!valid) {
    return next(new HttpError(message || ERRORS.INVALID_EMAIL, 400));
  }

  try {
    await unsubscribeEmail(email);
    const context = {
      title: "Thank You",
      message:
        "You’ve been successfully removed from the newsletter mailing list.",
    };
    res.renderGenericMessage(context);
  } catch (err) {
    next(new HttpError({ error: "Failed to unsubscribe" }, 500));
  }
});

module.exports = router;
