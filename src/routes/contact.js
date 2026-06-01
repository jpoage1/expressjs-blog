// src/routes/contact.js
const express = require("express");
const router = express.Router();
const formLimiter = require("#utils/formLimiter.js");
const {
  handleContactFormPost,
  renderContactForm,
  renderThankYouPage,
} = require("#controllers/contactControllers.js");

router.post("/contact", formLimiter, handleContactFormPost);

router.get("/contact", renderContactForm);

router.get("/contact/thankyou", renderThankYouPage);

module.exports = router;
