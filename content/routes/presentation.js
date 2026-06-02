const express = require("express");
const router = express.Router();

const {
  renderPresentation,
  resolveReturnUrl,
  securityPolicy,
  CSP_DIRECTIVES,
} = require("../../src/api.js");

router.get(
  "/",
  resolveReturnUrl,
  securityPolicy({
    scriptSrc: [...CSP_DIRECTIVES.scriptSrc, "'unsafe-eval'"],
    styleSrc: [...CSP_DIRECTIVES.styleSrc, "'unsafe-inline'"],
  }),
  renderPresentation,
);

module.exports = router;
