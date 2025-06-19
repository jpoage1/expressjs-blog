// src/routes/contact.js
const express = require("express");
const router = express.Router();
const sendContactMail = require("../utils/mailer");
const getBaseContext = require("../utils/baseContext");

router.post("/contact", async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    await sendContactMail({ name, email, message });
    res.redirect("/contact/thankyou");
  } catch (err) {
    next(err);
  }
});

router.get("/contact", async (req, res) => {
  const context = await getBaseContext({
    title: "Contact",
  });
  res.render("pages/contact.handlebars", context);
});

router.get("/contact/thankyou", async (req, res) => {
  const context = await getBaseContext({
    title: "Thank You",
  });
  res.render("pages/thankyou.handlebars", context);
});

module.exports = router;
