const express = require("express");
const router = express.Router();
const sendNewsletterSubscriptionMail = require("../utils/sendNewsletterSubscriptionMail");
const { saveEmail } = require("../services/newsletterService");
const formLimiter = require("../utils/formLimiter");

const { qualifyLink } = require("../utils/qualifyLinks");
const HttpError = require("../utils/HttpError");
const { Http } = require("winston/lib/winston/transports");

router.get("/newsletter", async (req, res) => {
  const context = {
    csrfToken: res.locals.csrfToken,
    title: "Newsletter",
    formAction: qualifyLink("/newsletter"),
    formMethod: "POST"
  }
  res.renderWithBaseContext("pages/newsletter.handlebars", context);
});

router.get("/newsletter/success", async (req, res) => {
  const context = {
    title: "Thank You",
  }
  res.renderWithBaseContext("pages/newsletter-success.handlebars", context);
});

router.post("/newsletter", formLimiter, async (req, res, next) => {
  const { email } = req.body;
  // Basic validation
  if (!email || typeof email !== 'string') {
    return next(new HttpError("Email is required", 400))
  }
    // Sanitize and validate email
  const sanitizedEmail = validator.normalizeEmail(email.trim());
  if (!sanitizedEmail || !validator.isEmail(sanitizedEmail)) {
    return next(new HttpError("Invalid email format", 400))
  }
  
  // Length check
  if (sanitizedEmail.length > 320) { // RFC 5321 limit
    return next(new HttpError("Email too long", 400))
  }

  try {
    await saveEmail(email);
    await sendNewsletterSubscriptionMail({ email });
    res.redirect("/newsletter/success");
  } catch (err) {
    // Log the error but don't expose internal details
    console.error('Newsletter subscription error:', err);
    
    // Generic response to avoid information disclosure
    if (err.code === 'DUPLICATE_EMAIL') {
      // Still redirect to success to avoid enumeration
      return res.redirect("/newsletter/success");
    }
    next(err);
  }
});

module.exports = router;
