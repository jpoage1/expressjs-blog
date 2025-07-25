const express = require("express");
const router = express.Router();
const formLimiter = require("../utils/formLimiter");
const {
  renderNewsletterForm,
  renderSubscriptionSuccess,
  handleNewsletterSubscribe,
  handleUnsubscribe,
} = require("../controllers/newsletterController");

router.get("/newsletter", renderNewsletterForm);
router.get("/newsletter/success", renderSubscriptionSuccess);
router.post("/newsletter", formLimiter, handleNewsletterSubscribe);
router.get("/unsubscribe", handleUnsubscribe);

module.exports = router;
