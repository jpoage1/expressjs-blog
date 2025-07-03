const express = require("express");
const router = express.Router();
const sendNewsletterSubscriptionMail = require("../utils/sendNewsletterSubscriptionMail");
const { saveEmail } = require("../services/newsletterService");

const getBaseContext = require("../utils/baseContext");

router.get("/newsletter", async (req, res) => {
  const context = await getBaseContext({
    title: "Newsletter",
  });
  res.render("pages/newsletter.handlebars", context);
});

router.get("/newsletter/success", async (req, res) => {
  const context = await getBaseContext({
    title: "Thank You",
  });
  res.render("pages/newsletter-success.handlebars", context);
});

router.post("/newsletter", async (req, res, next) => {
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
