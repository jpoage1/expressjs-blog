// src/routes/contact.js
const express = require("express");
const router = express.Router();
const formLimiter = require("../utils/formLimiter");
const {
  handleContactFormPost,
  renderContactForm,
  renderThankYouPage,
} = require("../controllers/contactControllers");

router.post("/contact", formLimiter, handleContactFormPost);

router.get("/contact", renderContactForm);

router.get("/contact/thankyou", renderThankYouPage);

module.exports = router;
