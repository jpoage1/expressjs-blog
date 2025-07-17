const express = require("express");
const router = express.Router();
const sendNewsletterSubscriptionMail = require("../utils/sendNewsletterSubscriptionMail");
const { saveEmail } = require("../services/newsletterService");
const formLimiter = require("../utils/formLimiter");

const { validateAndSanitizeEmail } = require("../utils/emailValidator");

const { qualifyLink } = require("../utils/qualifyLinks");
const HttpError = require("../utils/HttpError");

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
    title: "Thank You",
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
    res.customRedirect("/newsletter/success"); // fixme qualifyLink()
  } catch (err) {
    console.error("Newsletter subscription error:", err);
    if (err.code === "DUPLICATE_EMAIL") {
      return res.customRedirect("/newsletter/success"); // fixme qualifyLink()
    }
    next(err);
  }
});

module.exports = router;
