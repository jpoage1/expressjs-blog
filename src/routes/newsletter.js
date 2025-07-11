const express = require("express");
const router = express.Router();
const sendNewsletterSubscriptionMail = require("../utils/sendNewsletterSubscriptionMail");
const { saveEmail } = require("../services/newsletterService");
const formLimiter = require("../utils/formLimiter");

const getBaseContext = require("../utils/baseContext");
const { qualifyLink } = require("../utils/qualifyLinks");

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
  if (!email) {
    return res.status(400).send("Email is required");
  }
  try {
    saveEmail(email);
    await sendNewsletterSubscriptionMail({ email });
    res.redirect("/newsletter/success");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
